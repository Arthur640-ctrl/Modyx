import os 
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from core.limiter import limiter
from contextlib import asynccontextmanager
from database import connect_db
import config
from generator.llm.tools import register_tools

# Routers
from routes import auth, account, modpacks, utils

@asynccontextmanager
async def lifespan(app: FastAPI):
    register_tools()
    await connect_db()
    yield


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

@app.get("/")
async def root():
    return {
        "message": "Welcome on Modyx API"
    }