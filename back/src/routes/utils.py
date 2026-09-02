from fastapi import APIRouter, HTTPException, Depends, Request
from datetime import datetime
import re
from models import *
from database import *
from core.auth_security import *
from core.deps import get_current_user
from utils.minecraft_versions import *
from generator.services.modrinth import search_projects

router = APIRouter(prefix="/utils")

@router.get("/minecraft/versions")
async def get_minecraft_version(request: Request):
    return await get_minecraft_versions()

@router.get("/mods/search")
async def search_mods(
    request: Request,
    query: str = "",
    limit: int = 20,
    user: User = Depends(get_current_user)
):
    clean_query = query.strip()

    if not clean_query:
        return {
            "hits": [],
            "total": 0,
        }

    try:
        result = await search_projects(
            query=clean_query,
            project_type="mod",
            limit=max(1, min(50, limit))
        )
    except Exception as error:
        raise HTTPException(
            status_code=502,
            detail={
                "error": 502,
                "message": f"Modrinth search failed: {str(error)}"
            }
        )

    hits = result.get("hits", [])

    return {
        "total": result.get("total_hits", len(hits)),
        "hits": [
            {
                "mod_id": item.get("project_id") or item.get("id"),
                "title": item.get("title") or item.get("name"),
                "slug": item.get("slug"),
                "description": item.get("description"),
                "categories": item.get("categories", []),
                "downloads": item.get("downloads"),
                "icon_url": item.get("icon_url"),
                "versions": item.get("versions", [])
            }
            for item in hits
        ]
    }
