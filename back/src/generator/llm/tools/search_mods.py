from generator.services.modrinth import *
from generator.llm.registry import *

async def search_mods(
    query: str,
    context: ToolContext,
    limit: int = 10,
    offset: int = 0,
):
    results = await search_projects(
        query=query,
        project_type="mod",
        offset=offset,
        limit=limit
    )

    mods = results["hits"]
    stats = {
        "offset": results["offset"],
        "limit": results["limit"],
        "total_hits": results["total_hits"]
    }

    cleaned_mods = []

    for mod in mods:
        cleaned_mods.append({
            "mod_id": mod["project_id"],

            "title": mod["title"],
            "description": mod["description"],

            "categories": mod["categories"],

            "downloads": mod["downloads"],
        })

    return cleaned_mods

def register(registry: ToolRegistry):
    registry.register(
        name="search_mods",
        definition={
            "type": "function",
            "function": {
                "name": "search_mods",
                "description": "Search Minecraft mods on the mods database.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "query": {
                            "type": "string",
                            "description": "The query to search for"
                        },
                        "limit": {
                            "type": "integer",
                            "description": "The number of results returned by the search",
                            "minimum": 1,
                            "maximum": 100
                        },
                        "offset": {
                            "type": "integer",
                            "description": "The offset into the search. Skips this number of results",
                        }
                    },
                    "required": ["query"]
                }
            }
        },
        function=search_mods,
    )