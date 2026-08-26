from generator.services.modrinth import get_project
from generator.llm.registry import *

async def get_mod_infos(mod_id: str, compacted: bool, context: ToolContext):
    infos = await get_project(mod_id)

    data = {
        "mod_id": infos.get("id"),
        "title": infos.get("title"),
        "description": infos.get("description"),
        "categories": infos.get("categories", []) + infos.get("additional_categories", []),
        "loaders": infos.get("loaders", []),
        "game_versions": infos.get("game_versions", []),
    }

    if not compacted:
        data["body"] = infos.get("body")
        data["downloads"] = infos.get("downloads")

    return data
    

def register(registry: ToolRegistry):
    registry.register(
        name="get_mod_infos",
        definition={
            "type": "function",
            "function": {
                "name": "get_mod_infos",
                "description": "Get information about a mod (mod_id, title, description, categories, loaders, game_versions, and optionally body and downloads).",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "mod_id": {
                            "type": "string",
                            "description": "The unique ID of the mod."
                        },
                        "compacted": {
                            "type": "boolean",
                            "description": "Return a compacted version of the mod info. Useful when it is not necessary to get all information. Omits 'body' and 'downloads' when true."
                        }
                    },
                    "required": ["mod_id", "compacted"]
                }
            }
        },
        function=get_mod_infos
    )