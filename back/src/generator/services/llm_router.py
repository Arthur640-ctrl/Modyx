import asyncio
import time
from datetime import datetime
import json
import httpx

class RateLimiter:
    def __init__(self, rpm: int):
        self.rpm = rpm
        self.interval = 60.0 / rpm if rpm > 0 else 0
        self.history = []
        self.lock = asyncio.Lock()

    async def acquire(self):
        if self.rpm <= 0:
            return
        
        async with self.lock:
            now = time.time()
            # Nettoyer l'historique des requêtes de plus d'une minute
            self.history = [t for t in self.history if now - t < 60.0]
            
            if len(self.history) >= self.rpm:
                # Calculer le temps d'attente nécessaire
                oldest = self.history[0]
                sleep_time = 60.0 - (now - oldest) + 0.1 # Petite marge de sécurité
                if sleep_time > 0:
                    print(f"[RateLimit] Limite atteinte ({self.rpm} RPM). Attente de {sleep_time:.2f}s...")
                    await asyncio.sleep(sleep_time)
                now = time.time()
                self.history = [t for t in self.history if now - t < 60.0]
            
            self.history.append(time.time())

class LLM_Router:
    def __init__(self, config_path: str = "back/llm_config.json", interval_seconds: int = 60):
        self.config_path = config_path
        self.interval_seconds = interval_seconds
        self.config = self.load_config()
        self.rate_limiters = {}
        self.reachable_cache = {}
        self._init_rate_limiters()

    def load_config(self):
        try:
            with open(self.config_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            print(f"[LLM] Erreur chargement config: {e}")
            return {"use_lm_studio": False, "providers": []}

    def _init_rate_limiters(self):
        for provider in self.config.get("providers", []):
            p_id = provider["id"]
            rpm = provider.get("rate_limit_rpm", 0)
            self.rate_limiters[p_id] = RateLimiter(rpm)

    async def start(self):
        while True:
            self.config = self.load_config()  # Rechargement dynamique possible
            await self.check_providers()
            await asyncio.sleep(self.interval_seconds)

    async def check_providers(self):
        # Vérification rapide de la joignabilité des providers
        async with httpx.AsyncClient(timeout=5) as client:
            if self.config.get("use_lm_studio"):
                url = self.config["lm_studio_url"].rstrip("/") + "/models"
                try:
                    res = await client.get(url)
                    self.reachable_cache["lm-studio"] = res.status_code == 200
                except:
                    self.reachable_cache["lm-studio"] = False

            for provider in self.config.get("providers", []):
                p_id = provider["id"]
                url = provider["provider_url"].rstrip("/") + "/models"
                try:
                    headers = {"Authorization": f"Bearer {provider['api_keys'][0]}"} if provider.get("api_keys") else {}
                    res = await client.get(url, headers=headers)
                    self.reachable_cache[p_id] = res.status_code == 200
                except:
                    self.reachable_cache[p_id] = False

    async def get_available_models(self):
        models = []

        # 1. Vérifier LM Studio en priorité si activé et dispo
        if self.config.get("use_lm_studio") and self.reachable_cache.get("lm-studio", False):
            try:
                async with httpx.AsyncClient(timeout=5) as client:
                    url = self.config["lm_studio_url"].rstrip("/") + "/models"
                    res = await client.get(url)
                    if res.status_code == 200:
                        data = res.json().get("data", [])
                        for m in data:
                            models.append({
                                "model_id": m["id"],
                                "api_key": self.config.get("lm_studio_api_key", "lm-studio"),
                                "provider_url": self.config["lm_studio_url"],
                                "provider_priority": -1, # Priorité maximale
                                "price": 0,
                                "provider_id": "lm-studio",
                                "is_local": True
                            })
            except Exception as e:
                print(f"[LLM] Erreur fetch LM Studio: {e}")

        # 2. Ajouter les providers distants joignables
        for provider in self.config.get("providers", []):
            p_id = provider["id"]
            if not self.reachable_cache.get(p_id, True): # Par défaut True si pas encore testé
                continue

            for model in provider.get("models", []):
                price = model.get("cache_miss_pricing", 0) + model.get("output_pricing", 0)
                models.append({
                    "model_id": model["model_id"],
                    "api_key": provider["api_keys"][0] if provider.get("api_keys") else "",
                    "provider_url": provider["provider_url"],
                    "provider_priority": provider.get("priority", 99),
                    "price": price,
                    "provider_id": p_id,
                    "is_local": False
                })

        # Trier par priorité (LM Studio en premier grâce à -1) puis par prix
        models.sort(key=lambda x: (x["provider_priority"], x["price"]))
        return models

    async def acquire_rate_limit(self, provider_id: str):
        """À appeler juste avant d'effectuer une requête vers un provider."""
        if provider_id in self.rate_limiters:
            await self.rate_limiters[provider_id].acquire()

router = LLM_Router(config_path=r'C:\Users\g_e_o\Documents\Modyx\back\llm_config.json')