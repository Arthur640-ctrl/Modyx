import httpx
import asyncio
import json

MODRINTH_API_URL = "https://api.modrinth.com/v2"

HEADERS = {
    "User-Agent": "Arthur640-ctrl/Modyx/beta"
}

async def search_projects(
    query: str,
    project_type: str = "mod",
    offset: int = 0,
    limit: int = 20
):

    params = {
        "query": query,
        "facets": json.dumps([[f"project_type:{project_type}"]]),
        "offset": offset,
        "limit": limit
    }
    
    async with httpx.AsyncClient(
        base_url=MODRINTH_API_URL,
        headers=HEADERS,
        timeout=10.0,
    ) as client:

        response = await client.get(
            "/search",
            params=params,
        )

        response.raise_for_status()

        return response.json()

async def get_project(project_id: str):
  
    async with httpx.AsyncClient(
        base_url=MODRINTH_API_URL,
        headers=HEADERS,
        timeout=10.0,
    ) as client:

        response = await client.get(
            f"/project/{project_id}",
        )

        response.raise_for_status()

        return response.json()

async def get_version(version_id: str):
    async with httpx.AsyncClient(
        base_url=MODRINTH_API_URL,
        headers=HEADERS,
        timeout=10.0,
    ) as client:

        response = await client.get(
            f"/version/{version_id}",
        )

        response.raise_for_status()

        return response.json()

async def get_project_dependencies(project_id: str):
    async with httpx.AsyncClient(
        base_url=MODRINTH_API_URL,
        headers=HEADERS,
        timeout=10.0,
    ) as client:

        response = await client.get(
            f"/project/{project_id}/dependencies",
        )

        response.raise_for_status()

        return response.json()

async def list_project_versions(
    project_id: str,
    loader: str | None = None,
    game_version: str | None = None,
    featured: bool | None = None,
    include_changelog: bool = True,
):
    params = {}

    if loader is not None:
        params["loaders"] = json.dumps([loader])

    if game_version is not None:
        params["game_versions"] = json.dumps([game_version])

    if featured is not None:
        params["featured"] = str(featured).lower()

    if include_changelog is not None:
        params["include_changelog"] = str(include_changelog).lower()

    async with httpx.AsyncClient(
        base_url=MODRINTH_API_URL,
        headers=HEADERS,
        timeout=10.0,
    ) as client:
        response = await client.get(
            f"/project/{project_id}/version",
            params=params,
        )
        response.raise_for_status()
        return response.json()

# async def main():

#     project = await get_project_dependencies("LNytGWDc")

#     print(project)


# if __name__ == "__main__":
#     asyncio.run(main())