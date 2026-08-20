import httpx

loaders = ["fabric", "forge", "neoforge", "quilt"]

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


async def is_minecraft_version_valid(version : str):
    versions = await get_minecraft_versions()

    return version in versions

def is_loader_valid(loader: str):
    return loader in loaders