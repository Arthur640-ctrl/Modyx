from generator.services.modrinth import *
from generator.llm.registry import *
from models import *

async def get_pack_version(context: ToolContext):
    modpack_id_obj = PydanticObjectId(context.modpack_id)
    
    modpack_state = await ModpackState.find_one(
        {"modpack_id": modpack_id_obj}
    )

    return {
        "minecraft_version": modpack_state.minecraft_version,
        "loader_name": modpack_state.loader
    }
    

def register(registry: ToolRegistry):
    registry.register(
        name="get_pack_version",
        definition={
            "type": "function",
            "function": {
                "name": "get_pack_version",
                "description": (
                    "Get modpack Minecraft version and loader name"
                ),
                "parameters": {
                    "type": "object",
                    "properties": {},
                    "required": [],
                },
            },
        },
        function=get_pack_version,
    )