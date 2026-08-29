import os 
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from core.limiter import limiter
from contextlib import asynccontextmanager
from database import connect_db
import config
from generator.llm.tools import register_tools
from generator.agent_run import *
from generator.services.llm_router import router

# Routers
from routes import auth, account, modpacks, utils, global_route

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("API starting...")

    register_tools()
    await connect_db()

    workers = [
        asyncio.create_task(agent_worker())
        for _ in range(2)
    ]

    router_task = asyncio.create_task(
        router.start()
    )

    print("API started.")

    yield

    for worker in workers:
        worker.cancel()

    router_task.cancel()

    await asyncio.gather(
        *workers,
        return_exceptions=True
    )

    print("API stopped.")


# Api :
app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.state.limiter = limiter

# Routes
app.include_router(auth.router)
app.include_router(account.router)
app.include_router(modpacks.router)
app.include_router(utils.router)
app.include_router(global_route.router)

@app.get("/")
async def root():
    return {
        "message": "Welcome on Modyx API"
    }