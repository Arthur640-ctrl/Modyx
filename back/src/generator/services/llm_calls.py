import json
import asyncio

from openai import AsyncOpenAI
from types import SimpleNamespace

from generator.llm.tools import *
from generator.llm.registry import *
from generator.llm.tools.get_pack_mods import *
from models import *
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie, PydanticObjectId
import sys
import traceback
from datetime import datetime
from beanie import PydanticObjectId
from generator.services.llm_router import router

from generator.stream_manager import *


from types import SimpleNamespace

from generator.llm.registry import registry
from generator.services.llm_router import router
from generator.stream_manager import stream_manager


import asyncio
import inspect
import time
from types import SimpleNamespace

from generator.llm.registry import registry
from generator.services.llm_router import router
from generator.stream_manager import stream_manager


async def _close_llm_stream(response):
    """Ferme proprement un flux abandonné avant le premier chunk."""
    if response is None:
        return

    close = (
        getattr(response, "aclose", None)
        or getattr(response, "close", None)
    )

    if close:
        try:
            result = close()
            if inspect.isawaitable(result):
                await result
        except Exception:
            pass


async def _chunks_from_first(first_chunk, iterator):
    """Réinjecte le premier chunk avant de continuer le flux."""
    yield first_chunk
    async for chunk in iterator:
        yield chunk


async def call_llm(
    messages: list[dict],
    *,
    tools: bool = True,
    agent_run_id: str = "",
    stream_as: str = "",
    verbose: bool = False,
):
    aliases = router.model_aliases

    if not aliases:
        raise RuntimeError("No available LLM model")

    # Délai maximal entre le lancement d'un modèle
    # et la réception de son premier chunk.
    first_chunk_timeout = 120.0

    kwargs = {
        "messages": messages,
        "stream": True,
        "stream_options": {"include_usage": True},
    }

    if tools:
        kwargs["tools"] = registry.get_definitions()
        kwargs["tool_choice"] = "auto"

    response = None
    iterator = None
    first_chunk = None
    selected_alias = None
    last_error = None

    # Fallback manuel : chaque modèle dispose de son propre délai.
    for model_alias in aliases:
        started = time.monotonic()
        deadline = started + first_chunk_timeout
        response = None

        try:
            if verbose:
                print(f"[LLM] Trying {model_alias}")

            remaining = deadline - time.monotonic()
            if remaining <= 0:
                raise asyncio.TimeoutError()

            # Le délai couvre aussi l'ouverture de la requête.
            response = await asyncio.wait_for(
                router.acompletion(
                    model=model_alias,
                    **kwargs,
                ),
                timeout=remaining,
            )

            iterator = response.__aiter__()

            remaining = deadline - time.monotonic()
            if remaining <= 0:
                raise asyncio.TimeoutError()

            # Attendre explicitement le premier chunk.
            first_chunk = await asyncio.wait_for(
                iterator.__anext__(),
                timeout=remaining,
            )

            selected_alias = model_alias
            elapsed = time.monotonic() - started

            print(
                f"[LLM] First chunk from {model_alias} "
                f"after {elapsed:.2f}s"
            )
            break

        except (asyncio.TimeoutError, TimeoutError) as exc:
            last_error = exc
            elapsed = time.monotonic() - started

            print(
                f"[LLM] {model_alias} timed out after "
                f"{elapsed:.2f}s; trying next model"
            )
            await _close_llm_stream(response)
            response = None
            iterator = None
            first_chunk = None

        except Exception as exc:
            last_error = exc
            elapsed = time.monotonic() - started

            print(
                f"[LLM] {model_alias} failed after "
                f"{elapsed:.2f}s: {exc}; trying next model"
            )
            await _close_llm_stream(response)
            response = None
            iterator = None
            first_chunk = None

    if selected_alias is None:
        raise RuntimeError(
            "All LLM models failed before the first chunk"
        ) from last_error

    # On n'envoie rien au flux utilisateur avant d'avoir
    # sélectionné un modèle qui a commencé à répondre.
    await stream_manager.add_message(
        agent_run_id=agent_run_id,
        role=stream_as,
    )

    content = ""
    role = None
    tool_calls = {}

    usage_metrics = {
        "prompt_tokens_raw": 0,
        "cache_hit_tokens": 0,
        "cache_miss_tokens": 0,
        "output_tokens": 0,
        "total_tokens": 0,
    }

    actual_model = selected_alias

    # Après le premier chunk, on laisse ce modèle terminer.
    async for chunk in _chunks_from_first(first_chunk, iterator):
        # print("[LLM DEBUG] Chunk reçu")

        # if chunk.choices:
        #     delta = chunk.choices[0].delta
        #     print(
        #         "[LLM DEBUG] content =", repr(delta.content),
        #         "| tool_calls =", bool(delta.tool_calls),
        #         "| finish_reason =", chunk.choices[0].finish_reason,
        #     )
        # else:
        #     print("[LLM DEBUG] Chunk sans choices (usage/métadonnées)")

        if getattr(chunk, "model", None):
            actual_model = chunk.model

        usage = getattr(chunk, "usage", None)

        if usage:
            raw_prompt = getattr(usage, "prompt_tokens", 0) or 0
            details = getattr(usage, "prompt_tokens_details", None)
            cache_hit = (
                getattr(details, "cached_tokens", 0) or 0
                if details else 0
            )
            output = getattr(usage, "completion_tokens", 0) or 0
            total = getattr(usage, "total_tokens", 0) or (
                raw_prompt + output
            )

            usage_metrics = {
                "prompt_tokens_raw": raw_prompt,
                "cache_hit_tokens": cache_hit,
                "cache_miss_tokens": max(0, raw_prompt - cache_hit),
                "output_tokens": output,
                "total_tokens": total,
            }

        if not chunk.choices:
            continue

        delta = chunk.choices[0].delta

        if delta.role:
            role = delta.role

        if delta.content:
            await stream_manager.update_content(
                agent_run_id, delta.content
            )
            content += delta.content

        if delta.tool_calls:
            for tool_call in delta.tool_calls:
                index = tool_call.index

                await stream_manager.update_tool_call(
                    agent_run_id, index, tool_call
                )

                if index not in tool_calls:
                    tool_calls[index] = {
                        "id": "",
                        "type": "function",
                        "function": {
                            "name": "",
                            "arguments": "",
                        },
                    }

                current = tool_calls[index]

                if tool_call.id:
                    current["id"] = tool_call.id

                if tool_call.type:
                    current["type"] = tool_call.type

                if tool_call.function:
                    if tool_call.function.name:
                        current["function"]["name"] += (
                            tool_call.function.name
                        )

                    if tool_call.function.arguments:
                        current["function"]["arguments"] += (
                            tool_call.function.arguments
                        )

    formatted_tool_calls = [
        SimpleNamespace(
            id=item["id"],
            type=item["type"],
            function=SimpleNamespace(
                name=item["function"]["name"],
                arguments=item["function"]["arguments"],
            ),
        )
        for item in tool_calls.values()
    ]

    await update_agent_run_usage(
        usage_metrics,
        agent_run_id,
        actual_model,
    )

    print(f"[LLM] Completed using model={actual_model}")

    return SimpleNamespace(
        role=role or "assistant",
        content=content or None,
        tool_calls=formatted_tool_calls or None,
        usage=usage_metrics,
    )



async def update_agent_run_usage(
    usage_metrics: dict,
    agent_run_id: str,
    model_id: str
):
    if not agent_run_id:
        return

    try:
        run_obj_id = PydanticObjectId(agent_run_id)
    except Exception:
        return

    run_usage = await AgentRunUsage.find_one(
        AgentRunUsage.agent_run_id == run_obj_id
    )

    if not run_usage:
        return

    run_usage.prompt_tokens_raw += usage_metrics.get(
        "prompt_tokens_raw",
        0
    )

    run_usage.cache_hit_tokens += usage_metrics.get(
        "cache_hit_tokens",
        0
    )

    run_usage.cache_miss_tokens += usage_metrics.get(
        "cache_miss_tokens",
        0
    )

    run_usage.output_tokens += usage_metrics.get(
        "output_tokens",
        0
    )

    run_usage.total_tokens += usage_metrics.get(
        "total_tokens",
        0
    )

    run_usage.model_id = model_id

    await run_usage.save()