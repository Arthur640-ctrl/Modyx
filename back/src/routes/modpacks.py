from fastapi import APIRouter, HTTPException, Depends, Request
from datetime import datetime
import re
from models import *
from database import *
from core.auth_security import *
from core.deps import get_current_user

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

    print(modpacks)

    modpacks.sort(
        key=lambda modpack: modpack.updated_at,
        reverse=True
    )

    return [
        {
            "id": modpack.id,
            "owner_id": modpack.owner_id,
            "display_name": modpack.display_name,
            "created_at": modpack.created_at,
            "updated_at": modpack.updated_at,
            "shared_ids": modpack.shared_ids,
            "relation": "owned" if modpack.owner_id == user.id else "shared"
        }
        for modpack in modpacks
    ]

@router.post("/new")
async def modpack_new(
    request: Request,
    data: NewModpackRequest,
    user: User = Depends(get_current_user)
):
    modpack = Modpack(
        owner_id=user.id,
        shared_ids=[],

        display_name=data.name
    )

    await modpack.insert()

    return {
        "error": "not",
        "message": "Modpack creation success",
        "data": {
            "modpack_id": modpack.id,
        } 
    }