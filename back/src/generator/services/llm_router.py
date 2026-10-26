
# generator/services/llm_router.py

import json
import os
from pathlib import Path

from litellm import Router

class LLMRouter:
    def __init__(self, config_path: str | None = None):
        path = config_path or os.environ.get(
            "LLM_CONFIG_PATH", "llm_config.json"
        )
        self.config_path = str(Path(path).resolve())

        self.config = {}
        self.router = None
        self.alias_to_model = {}
        self.model_aliases = []

        self.reload()

    def load_config(self):
        with open(self.config_path, "r", encoding="utf-8") as f:
            return json.load(f)

    def reload(self):
        config = self.load_config()
        model_list = []
        alias_to_model = {}
        candidates = []

        # Fournisseurs distants
        for provider in config.get("providers", []):
            provider_id = provider["id"]
            provider_url = provider["provider_url"].rstrip("/")
            api_keys = provider.get("api_keys", [])

            if not api_keys:
                continue

            for model in provider.get("models", []):
                model_id = model["model_id"]
                priority = provider.get("priority", 99)
                price = (
                    model.get("cache_miss_pricing", 0)
                    + model.get("output_pricing", 0)
                )

                candidates.append({
                    "alias": f"modyx-{len(candidates)}",
                    "model_id": model_id,
                    "provider_id": provider_id,
                    "priority": priority,
                    "price": price,
                    "model": model,
                    "provider": provider,
                    "api_key": api_keys[0],
                    "provider_url": provider_url,
                })

        candidates.sort(
            key=lambda item: (
                item["priority"],
                item["price"],
            )
        )

        for candidate in candidates:
            alias = candidate["alias"]
            model_id = candidate["model_id"]
            provider = candidate["provider"]

            params = {
                "model": f"openai/{model_id}",
                "api_base": candidate["provider_url"],
                "api_key": candidate["api_key"],
                "timeout": 120,
            }

            # Limite déclarative par déploiement.
            rpm = provider.get("rate_limit_rpm", 0)
            if rpm > 0:
                params["rpm"] = rpm

            model_list.append({
                "model_name": alias,
                "litellm_params": params,
                "model_info": {
                    "id": alias,
                },
            })

            alias_to_model[alias] = {
                "model_id": model_id,
                "provider_id": candidate["provider_id"],
            }

        if not model_list:
            raise RuntimeError(
                "No LLM deployment configured in llm_config.json"
            )

        # Fallbacks suivant l'ordre priorité/prix.
        fallbacks = []
        aliases = [item["alias"] for item in candidates]

        for index, alias in enumerate(aliases[:-1]):
            fallbacks.append({
                alias: aliases[index + 1:]
            })

        self.router = Router(
            model_list=model_list,
            num_retries=0,
            timeout=120,
            allowed_fails=1,
            cooldown_time=60,
        )

        self.config = config
        self.alias_to_model = alias_to_model
        self.model_aliases = aliases

    
    async def acompletion(self, **kwargs):
        if self.router is None:
            raise RuntimeError("LiteLLM router is not initialized")

        # Désactiver le reasoning uniquement pour LM Studio / Gemma.
        model_alias = kwargs.get("model")
        deployment = self.alias_to_model.get(model_alias)

        if deployment and deployment.get("provider_id") == "lmstudio":
            kwargs["reasoning_effort"] = "none"

        return await self.router.acompletion(**kwargs)



router = LLMRouter()
