from fastapi import APIRouter, HTTPException, Depends, Request
from datetime import datetime
import asyncio
from generator.agent_run import *
from models import *
from database import *
from core.auth_security import *
from core.deps import get_current_user
from utils.minecraft_versions import *
from fastapi.responses import StreamingResponse
import json
from generator.stream_manager import *

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
            "id": str(modpack.id),

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
    user: User = Depends(get_current_user)
):
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
    
    # Build conversation
    conversation_history = []

    for message_id in conversation.messages:
        try:
            message_id_obj = PydanticObjectId(message_id)
        except Exception:
            continue

        message = await Message.find_one(
            Message.id == message_id_obj
        )

        if not message:
            continue 

        if message.role == "user":
            conversation_history.append({
                "role": "user",
                "content": message.content[0]
            })
            continue
        else:
            message_agent_run = await AgentRun.find_one(
                AgentRun.id == message.agent_run_id
            )

            conversation_history.append({
                "role": "assistant",
                "content": message_agent_run.summary
            })

    # Création d'un AgentRun
    agent_run = AgentRun(
        history=[],
        summary="",

        state="waiting"
    )

    await agent_run.insert()

    # Initialize stream
    stream_manager.create(str(agent_run.id))

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
                assistant_message,
                conversation_history
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

@router.get("/{modpack_id}")
async def modpack_get(
    modpack_id: str,
    request: Request,
    user: User = Depends(get_current_user)
):  
    # Validation de l'ID
    try:
        modpack_id_obj = PydanticObjectId(modpack_id)
    except Exception:
        raise HTTPException(
            status_code=400,
            detail={
                "error": 400,
                "message": "Invalid modpack ID"
            }
        )

    # Récupération du modpack
    modpack = await Modpack.find_one(
        Modpack.id == modpack_id_obj
    )

    if not modpack:
        raise HTTPException(
            status_code=404,
            detail={
                "error": 404,
                "message": "Modpack not found"
            }
        )

    # Vérification des permissions
    if modpack.owner_id != user.id and user.id not in modpack.shared_ids:
        raise HTTPException(
            status_code=403,
            detail={
                "error": 403,
                "message": "You do not have permission to access this modpack"
            }
        )

    # Recup du modpack_state
    modpack_state = await ModpackState.find_one(
        ModpackState.modpack_id == modpack.id
    )

    # Recup conversation
    conversation = await Conversation.find_one(
        Conversation.modpack_id == modpack.id
    )

    # Build conversation
    conversation_history = []

    for message_id in conversation.messages:
        try:
            message_id_obj = PydanticObjectId(message_id)
        except Exception:
            continue

        message = await Message.find_one(
            Message.id == message_id_obj
        )

        if not message:
            continue 

        if message.role == "user":
            conversation_history.append({
                "role": "user",
                "content": message.content[0]
            })
            continue
        else:
            agent_run = await AgentRun.find_one(
                AgentRun.id == message.agent_run_id
            )

            agent_run_history = []

            for step in agent_run.history:
                if step["role"] == "system":
                    continue
                else:
                    agent_run_history.append(step)

            conversation_history.append({
                "role": "assistant",
                "content": {
                    "agent_run": agent_run_history,
                    "summary": agent_run.summary
                }
            })

    # Send response

    data = {
        "modpack_id": str(modpack.id),

        "display_name": modpack.display_name,

        "owner_id": modpack.owner_id,
        "shared_ids": modpack.shared_ids,

        "conversation": {
            "id": str(conversation.id),
            "history": conversation_history
        },

        "state": {
            "id": str(modpack_state.id),
            "loader": modpack_state.loader,
            "minecraft_version": modpack_state.minecraft_version,
            "mods": modpack_state.mods
        }
    }

    return data

@router.get("/stream/{agent_run_id}")
async def modpack_stream(
    agent_run_id: str,
    request: Request,
    user: User = Depends(get_current_user)
):
    try:
        agent_run_id_obj = PydanticObjectId(agent_run_id)
    except Exception:
        raise HTTPException(
            status_code=400,
            detail={
                "error": 400,
                "message": "Invalid agent run ID"
            }
        )

    agent_run = await AgentRun.get(agent_run_id_obj)

    if not agent_run:
        raise HTTPException(
            status_code=404,
            detail={
                "error": 404,
                "message": "Agent run not found"
            }
        )

    async def event_generator():

        last_state = None

        while True:

            # Client déconnecté
            if await request.is_disconnected():
                break

            current_stream = stream_manager.get(agent_run_id)

            # Copie pour éviter de travailler directement sur l'objet mutable
            current_state = json.loads(
                json.dumps(current_stream, ensure_ascii=False)
            )

            # On n'envoie que si quelque chose a changé
            if current_state != last_state:

                yield (
                    f"data: {json.dumps(current_state, ensure_ascii=False)}\n\n"
                )

                last_state = current_state

            # Vérifier si le workflow est terminé
            agent_run = await AgentRun.get(agent_run_id_obj)

            if agent_run:
                if agent_run.state in ["success", "failed"]:
                    # Envoyer une dernière fois l'état final
                    current_stream = stream_manager.get(agent_run_id)

                    yield (
                        f"data: {json.dumps(current_stream, ensure_ascii=False)}\n\n"
                    )

                    break

            await asyncio.sleep(0.05)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )