from fastapi import APIRouter, HTTPException, Depends, Request
from datetime import datetime
import asyncio
from generator.agent_run import *
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

@router.post("/chat")
async def modpack_chat(
    request: Request,
    data: ChatModpackRequest,
    # user: User = Depends(get_current_user)
):

    user = await User.find_one(
        User.id == "4f168fa7-bb46-49c6-bb20-3a8d5c05adda"
    ) 

    # Récuperation modpack
    try:
        modpack_id_obj = PydanticObjectId(data.modpack_id)
    except Exception:
        raise HTTPException(
            status_code=400,
            detail={
                "error": 400,
                "message": f"Invalid modpack ID"
            }
        )

    modpack = await Modpack.find_one(
        Modpack.id == modpack_id_obj
    )

    if not modpack:
        raise HTTPException(
            status_code=404,
            detail={
                "error": 404,
                "message": f"Modpack not found"
            }
        )

    if user.id != modpack.owner_id:
        raise HTTPException(
            status_code=403,
            detail={
                "error": 403,
                "message": "You do not have permission to access this modpack"
            }
        )

    # Check de la queue avant de tout créer et initialiser
    if agent_queue.full():
        raise HTTPException(
            status_code=503,
            detail={
                "error": 503,
                "message": "Too many agent tasks queued"
            }
        )

    # Récuperation conversation
    conversation = await Conversation.find_one(
        Conversation.modpack_id == modpack.id
    )

    # Création d'un AgentRun
    agent_run = AgentRun(
        history=[],
        summary="",

        state="waiting"
    )

    await agent_run.insert()

    # Création du message utilisateur
    user_message = Message(
        role="user",
        content=[data.prompt],
    )

    await user_message.insert()

    # Ajout du message utilisateur dans la conversation
    conversation.messages.append(str(user_message.id))
    await conversation.save()

    # Création du message assistant
    assistant_message = Message(
        role="assistant",
        content=[],
        agent_run_id=agent_run.id
    )

    await assistant_message.insert()

    # Ajout du message assistant dans la conversation
    conversation.messages.append(str(assistant_message.id))
    await conversation.save()

    # Envoie de la tache au worker
    try:
        agent_queue.put_nowait(
            (
                data.prompt,
                str(modpack.id),
                str(agent_run.id),
                assistant_message
            )
        )

    except asyncio.QueueFull:
        agent_run.state = "failed"
        await agent_run.save()

        raise HTTPException(
            status_code=503,
            detail={
                "error": 503,
                "message": "Too many agent tasks queued"
            }
        )

    # Update du state de l'agent run
    agent_run.state = "queued"
    await agent_run.save()

    return {
        "error": None,
        "message": "Request accepted",
        "data": {
            "user_message_id": str(user_message.id),
            "modpack_id": str(modpack.id),
            "agent_run": str(agent_run.id),
            "state": agent_run.state
        }
    }

