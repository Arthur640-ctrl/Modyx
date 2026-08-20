import httpx

async def get_minecraft_versions():
    url = "https://piston-meta.mojang.com/mc/game/version_manifest_v2.json"

    async with httpx.AsyncClient() as client:
        response = await client.get(url)
        response.raise_for_status()

        data = response.json()

    return [
        version["id"]
        for version in data["versions"]
        if version["type"] == "release"
    ]