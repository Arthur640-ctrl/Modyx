from generator.services.modrinth import get_project
from generator.llm.registry import *

async def get_mod_infos(mod_id: str, context: ToolContext,):

    infos = await get_project(mod_id)

    data = {
        "mod_id": infos["id"],

        "title": infos["title"],
        "description": infos["description"],
        "body": infos["body"],
        "categories": infos["categories"] + infos["additional_categories"],

        "loaders": infos["loaders"],
        "game_versions": infos["game_versions"],

        "downloads": infos["downloads"]
    }

    return data
    

def register(registry: ToolRegistry):
    registry.register(
        name="get_mod_infos",
        definition={
            "type": "function",
            "function": {
                "name": "get_mod_infos",
                "description": "Get all informations about a mod.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "mod_id": {
                            "type": "string",
                            "description": "Id of the mod"
                        }
                    },
                    "required": ["mod_id"]
                }
            }
        },
        function=get_mod_infos
     )