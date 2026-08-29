import time
import threading
from datetime import datetime
from beanie import Document
from pydantic import BaseModel
import requests
from models import *
import asyncio
import httpx

class LLM_Router:

    def __init__(self, interval_seconds: int = 60):
        self.interval_seconds = interval_seconds

    async def start(self):
        while True:
            await self.check_providers()
            await asyncio.sleep(self.interval_seconds)

    async def check_providers(self):
        providers = await Provider.find_all().to_list()

        for provider in providers:
            await self.check_provider(provider)

    async def check_provider(self, provider: Provider):
        url = provider.provider_url.rstrip("/") + "/models"

        try:
            async with httpx.AsyncClient(timeout=10) as client:
                response = await client.get(url)

            provider.reachable = True

        except httpx.RequestError:
            provider.reachable = False

        await provider.save()

    async def set_model_usable(
        self,
        provider: Provider,
        model: Model,
        usable: bool
    ):
        model.usable = usable

        if usable:
            model.last_unusable_at = None
        else:
            model.last_unusable_at = datetime.now()

        await provider.save()

    async def get_available_models(self):
        providers = await Provider.find(
            Provider.reachable == True
        ).to_list()

        models = []

        for provider in providers:
            for model in provider.models:

                if not model.usable:
                    continue

                price = (
                    model.cache_miss_pricing
                    + model.output_pricing
                )

                models.append({
                    "model_id": model.model_id,
                    "api_key": provider.api_keys[0],
                    "provider_url": provider.provider_url,

                    "provider_priority": provider.priority,
                    "price": price,
                    "last_unusable_at": model.last_unusable_at,

                    # Nécessaires pour set_model_usable()
                    "provider": provider,
                    "model": model,
                })

        models.sort(
            key=lambda model: (
                model["provider_priority"],
                model["price"],
                model["last_unusable_at"] is not None,
                model["last_unusable_at"] or datetime.min
            )
        )

        return models

router = LLM_Router()