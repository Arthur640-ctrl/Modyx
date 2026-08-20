from fastapi import APIRouter, HTTPException, Depends, Request
from datetime import datetime
import re
from models import *
from database import *
from core.auth_security import *
from core.deps import get_current_user
from utils.minecraft_versions import *

router = APIRouter(prefix="/modpacks")

@router.get("/")
async def modpacks_get(
    request: Request,
    user: User = Depends(get_current_user)
):
    modpacks = await Modpack.find(
        {
            "$or": [
                {"owner_id": user.id},
                {"shared_ids": user.id}
            ]
        }
    ).to_list()

    modpacks.sort(
        key=lambda modpack: modpack.updated_at,
        reverse=True
    )

    response = []

    for modpack in modpacks:

        modpack_state = await ModpackState.find_one(
            ModpackState.modpack_id == modpack.id
        )

        data = {
            "id": modpack.id,

            "owner_id": modpack.owner_id,
            "shared_ids": modpack.shared_ids,

            "relation": "owned" if modpack.owner_id == user.id else "shared",

            "display_name": modpack.display_name,

            "minecraft_version": modpack_state.minecraft_version,
            "loader": modpack_state.loader,
            "mods_count": len(modpack_state.mods),

            "created_at": modpack.created_at,
            "updated_at": modpack.updated_at,            
        }

        response.append(data)

    return response

@router.post("/new")
async def modpack_new(
    request: Request,
    data: NewModpackRequest,
    user: User = Depends(get_current_user)
):

    minecraft_version_valid = minecraft_version_valid = await is_minecraft_version_valid(data.minecraft_version) 
    loader_valid = is_loader_valid(data.loader)

    if not minecraft_version_valid:
        raise HTTPException(400, {
            "error": 400,
            "message": "Invalid minecraft version"
        })

    
    if not loader_valid:
        raise HTTPException(
            status_code=400,
            detail={
                "error": 400,
                "message": f"Invalid loader. Loader must be one of the following: {loaders}"
            }
        )

    
    modpack = Modpack(
        owner_id=user.id,
        shared_ids=[],

        display_name=data.name
    )
    
    await modpack.insert()

    modpack_state = ModpackState(
        modpack_id=modpack.id,

        loader=data.loader,
        minecraft_version=data.minecraft_version
    )

    conversation = Conversation(
        modpack_id=modpack.id
    )

    await modpack_state.insert()
    await conversation.insert()

    return {
        "error": "not",
        "message": "Modpack creation success",
        "data": {
            "modpack_id": modpack.id,
        } 
    }