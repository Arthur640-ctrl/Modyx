from generator.services.modrinth import *
from generator.llm.registry import *
from models import *

async def add_mod(mod_id: str, version_id: str, context: ToolContext):

    modpack_id_obj = PydanticObjectId(context.modpack_id)

    modpack_state = await ModpackState.find_one(
        {"modpack_id": modpack_id_obj}
    )

    mod_data = await get_project(project_id=mod_id)

    if not version_id in mod_data["versions"]:
        return {
            "success": False,
            "message": "The version doesn't exist for this mod !"
        }

    modpack_state.mods.append({
        "mod_id": mod_id,
        "version_id": version_id,
        "title": mod_data["title"]
    })

    await modpack_state.save()

    return {
        "success": True,
        "message": f"The version {version_id} of the mod {mod_id} ({mod_data["title"]}) was added in the modpack !"
    }
    

def register(registry: ToolRegistry):
    registry.register(
        name="add_mod",
        definition={
            "type": "function",
            "function": {
                "name": "add_mod",
                "description": (
                    "Add a mod in the modpack by giving the id of the mod and the version."
                ),
                "parameters": {
                    "type": "object",
                    "properties": {
                        "mod_id": {
                            "type": "string",
                            "description": "The id of the mod to add in the modpack"
                        },
                        "version_id": {
                            "type": "string",
                            "description": "The version_id of the mod to add in the modpack"
                        }

                    },
                    "required": ["mod_id", "version_id"]
                },
            },
        },
        function=add_mod,
    )
