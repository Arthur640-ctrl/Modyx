from fastapi import APIRouter, HTTPException, Depends, Request
from datetime import datetime
import re
from models import *
from database import *
from core.auth_security import *
from core.deps import get_current_user

router = APIRouter(prefix="/modpacks")

@router.get("/")
async def modpacks_get(request: Request, user: User = Depends(get_current_user)):
                       
    modpacks_owned : list[Modpack] = await Modpack.find(Modpack.owner_id == user.id).to_list()
    modpacks_shared : list[Modpack] = await Modpack.find(Modpack.shared_ids == user.id).to_list()

    return {
        "owned": modpacks_owned,
        "shared": modpacks_shared
    }
    
    
