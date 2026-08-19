import os
from pathlib import Path
from dotenv import load_dotenv

app_env = os.getenv("APP_ENV", "local")

# Dossier back/
BASE_DIR = Path(__file__).resolve().parent.parent

env_file = BASE_DIR / f".env.{app_env}"

if env_file.exists():
    load_dotenv(env_file)
    print(f"Configuration loaded from : {env_file}")
else:
    print(f"No file {env_file} found. Using system variables.")

MONGO_URI = os.getenv("MONGO_URI")
MONGO_NAME = os.getenv("MONGO_NAME")
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")