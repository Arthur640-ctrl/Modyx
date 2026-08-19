from fastapi import APIRouter, HTTPException, Request
from datetime import datetime, timezone
import re
import uuid
from core.limiter import limiter

from models import *
from database import *
from core.auth_security import *

router = APIRouter(prefix="/auth")
EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$")

@router.post("/register")
@limiter.limit("5/minute")
async def register(request: Request, data: RegisterRequest):
    
    if data.bot:
        raise HTTPException(400, {
            "error": 400,
            "message": "Bot detected",
            "displayed_errors": {
                "email": "",
                "pseudo": "",
                "password": "",
                "password_confirm": "",
                "register_checkbox": "",
                "form": "L'utilisation d'un script est détécté"
            } 
        })

    
    pseudo = data.pseudo.strip()
    email = str(data.email).strip().lower()
    password = data.password

    if len(password) > 32 or len(password) < 8:
        raise HTTPException(400, {
            "error": 400,
            "message": "Invalid password length",
            "displayed_errors": {
                "email": "",
                "pseudo": "",
                "password": "La longueur du mot de passe doit être comprise entre 8 et 32 charactères.",
                "password_confirm": "La longueur du mot de passe doit être comprise entre 8 et 32 charactères.",
                "register_checkbox": "",
                "form": ""
            } 
        })

    if not EMAIL_REGEX.fullmatch(email):
        raise HTTPException(400, {
            "error": 400,
            "message": "Invalid email format",
            "displayed_errors": {
                "email": "Format de l'email invalide.",
                "pseudo": "",
                "password": "",
                "password_confirm": "",
                "register_checkbox": "",
                "form": ""
            } 
        })

    if await User.find_one({"email": email}):
        raise HTTPException(400, {
            "error": 400,
            "message": "Email already used",
            "displayed_errors": {
                "email": "Cette adresse email est déjà utilisé.",
                "pseudo": "",
                "password": "",
                "password_confirm": "",
                "register_checkbox": "",
                "form": ""
            } 
        })

    if await User.find_one({"pseudo_lower": pseudo.lower()}):
        raise HTTPException(400, {
                "error": 400,
                "message": "Pseudo already used",
                "displayed_errors": {
                    "email": "",
                    "pseudo": "Ce pseudo est déjà utilisé.",
                    "password": "",
                    "password_confirm": "",
                    "register_checkbox": "",
                    "form": ""
                } 
            })
    
    hashed_password = hash_password(password)

    user = User(
        pseudo=pseudo,
        pseudo_lower=pseudo.lower(),
        email=email,
        password=hashed_password
    )

    await user.insert()

    token = create_access_token(str(user.id))
    
    return {
        "error": "not",
        "message": "Register success",
        "data": {
            "access_token": token,
            "user_id": str(user.id),
        } 
    }

@router.post("/login")
@limiter.limit("10/minute")
async def login(request: Request, data: LoginRequest):

    if data.bot:
        raise HTTPException(400, {
            "error": 400,
            "message": "Bot detected",
            "displayed_errors": {
                "email": "",
                "pseudo": "",
                "password": "",
                "password_confirm": "",
                "register_checkbox": "",
                "form": "L'utilisation d'un script est détécté"
            } 
        })

    email = str(data.email).strip().lower()
    password = data.password

    user = await User.find_one({"email": email})

    if not user:
        raise HTTPException(400, {
            "error": 400,
            "message": "Invalid credentials",
            "displayed_errors": {
                "email": "Informations incorrectes",
                "pseudo": "",
                "password": "Informations incorrectes",
                "password_confirm": "",
                "register_checkbox": "",
                "form": ""
            } 
        })
    
    if not verify_password(password, user.password):
        raise HTTPException(400, {
            "error": 400,
            "message": "Invalid credentials",
            "displayed_errors": {
                "email": "Informations incorrectes",
                "pseudo": "",
                "password": "Informations incorrectes",
                "password_confirm": "",
                "register_checkbox": "",
                "form": ""
            } 
        })
    
    token = create_access_token(str(user.id))

    return {
            "error": "not",
            "message": "Login success",
            "data": {
                "access_token": token,
                "user_id": str(user.id),
                "email": user.email
            } 
        }