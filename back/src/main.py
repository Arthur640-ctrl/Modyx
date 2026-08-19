import os 
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from core.limiter import limiter
from database import connect_db
import config

# Routers
from routes import auth, account, modpacks

# Api :
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    await connect_db()

app.state.limiter = limiter

# Routes
app.include_router(auth.router)
app.include_router(account.router)
app.include_router(modpacks.router)

@app.get("/")
async def root():
    return {
        "message": "Welcome on Modyx API"
    }