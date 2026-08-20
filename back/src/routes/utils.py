from fastapi import APIRouter, HTTPException, Depends, Request
from datetime import datetime
import re
from models import *
from database import *
from core.auth_security import *
from core.deps import get_current_user
from utils.minecraft_versions import *

router = APIRouter(prefix="/utils")

@router.get("/minecraft/versions")
async def get_minecraft_version(request: Request):
    return await get_minecraft_versions()
