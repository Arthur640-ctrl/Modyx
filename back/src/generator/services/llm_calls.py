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

async def call_llm(
    messages: list[dict],
    *,
    tools: bool = True,
    agent_run_id: str = "",
    stream_as: str = "",
    verbose: bool = False
):
    models = await router.get_available_models()

    if not models:
        raise RuntimeError("No available LLM model")

    for model_info in models:

        model_id = model_info["model_id"]
        api_key = model_info["api_key"]
        provider_url = model_info["provider_url"]

        provider = model_info["provider"]
        model = model_info["model"]

        client = AsyncOpenAI(
            base_url=provider_url,
            api_key=api_key,
        )

        kwargs = {
            "model": model_id,
            "messages": messages,
            "stream": True,
            "stream_options": {
                "include_usage": True
            },
        }

        if tools:
            kwargs["tools"] = registry.get_definitions()
            kwargs["tool_choice"] = "auto"

            if verbose:
                tools_json = json.dumps(
                    registry.get_definitions(),
                    ensure_ascii=False
                )

                print(
                    f"[LLM] tools chars = {len(tools_json):,}"
                )

        if verbose:
            messages_json = json.dumps(
                messages,
                ensure_ascii=False
            )

            print(
                f"[LLM] messages chars = {len(messages_json):,}"
            )

            print(
                f"[LLM] trying "
                f"provider={provider.provider_id} "
                f"model={model_id}"
            )

        try:
            response = await client.chat.completions.create(
                **kwargs
            )

            await stream_manager.add_message(
                agent_run_id=agent_run_id,
                role=stream_as
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

            async for chunk in response:

                # =========================
                # USAGE
                # =========================

                if getattr(chunk, "usage", None):
                    u = chunk.usage

                    raw_prompt = getattr(
                        u,
                        "prompt_tokens",
                        0
                    ) or 0

                    prompt_details = getattr(
                        u,
                        "prompt_tokens_details",
                        None
                    )

                    cache_hit = 0

                    if prompt_details:
                        cache_hit = getattr(
                            prompt_details,
                            "cached_tokens",
                            0
                        ) or 0

                    output = getattr(
                        u,
                        "completion_tokens",
                        0
                    ) or 0

                    total = getattr(
                        u,
                        "total_tokens",
                        0
                    ) or (raw_prompt + output)

                    cache_miss = max(
                        0,
                        raw_prompt - cache_hit
                    )

                    usage_metrics = {
                        "prompt_tokens_raw": raw_prompt,
                        "cache_hit_tokens": cache_hit,
                        "cache_miss_tokens": cache_miss,
                        "output_tokens": output,
                        "total_tokens": total
                    }

                if not chunk.choices:
                    continue

                delta = chunk.choices[0].delta

                # =========================
                # ROLE
                # =========================

                if delta.role:
                    role = delta.role

                # =========================
                # TEXT
                # =========================

                if delta.content:
                    await stream_manager.update_content(
                        agent_run_id,
                        delta.content
                    )

                    content += delta.content

                # =========================
                # TOOL CALLS
                # =========================

                if delta.tool_calls:

                    for tool_call in delta.tool_calls:

                        await stream_manager.update_tool_call(
                            agent_run_id,
                            tool_call.index,
                            tool_call
                        )

                        index = tool_call.index

                        if index not in tool_calls:
                            tool_calls[index] = {
                                "id": "",
                                "type": "function",
                                "function": {
                                    "name": "",
                                    "arguments": ""
                                }
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

            # =========================
            # FORMAT TOOL CALLS
            # =========================

            formatted_tool_calls = []

            for tool_call in tool_calls.values():

                formatted_tool_calls.append(
                    SimpleNamespace(
                        id=tool_call["id"],
                        type=tool_call["type"],
                        function=SimpleNamespace(
                            name=tool_call["function"]["name"],
                            arguments=tool_call["function"]["arguments"]
                        )
                    )
                )

            # =========================
            # USAGE DATABASE
            # =========================

            await update_agent_run_usage(
                usage_metrics,
                agent_run_id,
                model_id
            )

            if verbose:
                print(
                    f"[LLM] success "
                    f"provider={provider.provider_id} "
                    f"model={model_id} "
                    f"prompt_tokens="
                    f"{usage_metrics['prompt_tokens_raw']:,}"
                )

            await client.close()

            return SimpleNamespace(
                role=role or "assistant",
                content=content or None,
                tool_calls=formatted_tool_calls or None,
                usage=usage_metrics
            )

        except Exception as e:

            print(
                f"[LLM] generation failed "
                f"provider={provider.provider_id} "
                f"model={model_id}: {e}"
            )

            # =========================
            # MODEL UNUSABLE
            # =========================

            await router.set_model_usable(
                provider,
                model,
                False
            )

            await client.close()

            # On passe au modèle suivant
            continue

    # =========================
    # NO MODEL WORKED
    # =========================

    raise RuntimeError(
        "All available LLM models failed"
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