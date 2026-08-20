from generator.services.modrinth import *
from generator.llm.registry import *
from models import *

async def get_pack_mods(context: ToolContext):

    modpack_id_obj = PydanticObjectId(context.modpack_id)

    modpack_state = await ModpackState.find_one(
        {"modpack_id": modpack_id_obj}
    )

    return modpack_state.mods
    

def register(registry: ToolRegistry):
    registry.register(
        name="get_pack_mods",
        definition={
            "type": "function",
            "function": {
                "name": "get_pack_mods",
                "description": (
                    "Get all mods currently installed in the "
                    "modpack being edited."
                ),
                "parameters": {
                    "type": "object",
                    "properties": {},
                    "required": [],
                },
            },
        },
        function=get_pack_mods,
    )
