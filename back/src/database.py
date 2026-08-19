from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from models import *
import config

client = None
db = None

async def connect_db():
    global client, db

    client = AsyncIOMotorClient(config.MONGO_URI)
    db = client[config.MONGO_NAME]

    await init_beanie(
        database=db,
        document_models=[User]
    )

    print("Database connected !")

def get_db():
    return db