from fastapi import APIRouter, HTTPException, Request
from datetime import datetime, timedelta, timezone
import re
import uuid
from core.limiter import limiter
import secrets

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

    # Ajout user dans la DB
    user = User(
        pseudo=pseudo,
        pseudo_lower=pseudo.lower(),
        email=email,
        password=hashed_password
    )

    # Ajout de la verification
    verification_code = f"{secrets.randbelow(1_000_000):06d}"

    user.email_verification_code = verification_code
    user.email_verification_expires_at = (
        datetime.now(timezone.utc) + timedelta(minutes=10)
    )
    user.email_verification_attempts = 0
    user.email_verification_last_sent_at = datetime.now(timezone.utc)

    email_sent = await send_verification_code(
        email=user.email,
        code=verification_code
    )

    if not email_sent:
        await user.delete()

        raise HTTPException(
            status_code=500,
            detail={
                "error": 500,
                "message": "Unable to send the verification email.",
                "displayed_errors": {
                    "email": "",
                    "pseudo": "",
                    "password": "",
                    "password_confirm": "",
                    "register_checkbox": "",
                    "form": "Impossible d'envoyer le code de confirmation, verifiez l'email."
                }
            }
        )

    await user.insert()

    # Ajout du la subscription
    free_plan = await SubscriptionPlan.find_one(SubscriptionPlan.plan_code == "free")

    user_sub = UserSubscription(
        user_id=user.id,
        plan_code="free",
        credits_balance=free_plan.monthly_credits_limit,
        credits_used_this_month=0
    )

    await user_sub.insert()
    
    return {
        "error": "not",
        "message": "Register success",
        "data": {
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

@router.post("/verify-email")
@limiter.limit("10/minute")
async def verify_email(
    request: Request,
    data: VerifyEmailRequest
):
    user = await User.find_one({
        User.id: data.user_id
    })

    if not user:
        raise HTTPException(
            status_code=404,
            detail={
                "error": 404,
                "message": "User not found"
            }
        )

    # Déjà vérifié
    if user.email_verified:
        raise HTTPException(
            status_code=400,
            detail={
                "error": 400,
                "message": "Email already verified"
            }
        )

    # Aucun code
    if not user.email_verification_code:
        raise HTTPException(
            status_code=400,
            detail={
                "error": 400,
                "message": "No verification code"
            }
        )

    # Vérifier le nombre de tentatives
    if user.email_verification_attempts >= 5:
        raise HTTPException(
            status_code=429,
            detail={
                "error": 429,
                "message": "Too many attempts"
            }
        )

    # Vérifier l'expiration
    now = datetime.now(timezone.utc)

    expires_at = user.email_verification_expires_at

    if expires_at and expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)

    if not expires_at or expires_at < now:
        raise HTTPException(
            status_code=400,
            detail={
                "error": 400,
                "message": "Verification code expired"
            }
        )

    # Vérifier le code
    if user.email_verification_code != data.code:
        user.email_verification_attempts += 1
        await user.save()

        raise HTTPException(
            status_code=400,
            detail={
                "error": 400,
                "message": "Invalid verification code"
            }
        )

    user.email_verified = True
    user.email_verification_code = None
    user.email_verification_expires_at = None
    user.email_verification_attempts = 0
    user.email_verification_last_sent_at = None

    await user.save()

    # Création du JWT uniquement maintenant
    token = create_access_token(str(user.id))

    return {
        "error": "not",
        "message": "Email verified",
        "data": {
            "access_token": token,
            "user_id": str(user.id),
            "email": user.email
        }
    }

@router.post("/resend-verification")
@limiter.limit("3/minute")
async def resend_verification(
    request: Request,
    data: ResendVerificationRequest
):
    user = await User.find_one({
        User.id: data.user_id
    })

    if not user:
        raise HTTPException(
            status_code=404,
            detail={
                "error": 404,
                "message": "User not found"
            }
        )

    # Email déjà vérifié
    if user.email_verified:
        raise HTTPException(
            status_code=400,
            detail={
                "error": 400,
                "message": "Email already verified"
            }
        )

    now = datetime.now(timezone.utc)

    # Vérifier le cooldown entre deux envois
    if user.email_verification_last_sent_at:
        last_sent_at = user.email_verification_last_sent_at

        # MongoDB/Beanie peut nous renvoyer un datetime sans timezone
        if last_sent_at.tzinfo is None:
            last_sent_at = last_sent_at.replace(tzinfo=timezone.utc)

        seconds_since_last_send = (
            now - last_sent_at
        ).total_seconds()

        if seconds_since_last_send < 60:
            remaining = int(60 - seconds_since_last_send)

            raise HTTPException(
                status_code=429,
                detail={
                    "error": 429,
                    "message": "Please wait before requesting a new code",
                    "retry_after": remaining
                }
            )

    # Générer un nouveau code
    verification_code = f"{secrets.randbelow(1_000_000):06d}"

    user.email_verification_code = verification_code

    user.email_verification_expires_at = (
        now + timedelta(minutes=10)
    )

    # Reset des tentatives
    user.email_verification_attempts = 0

    user.email_verification_last_sent_at = now

    # Envoyer le nouveau code
    email_sent = await send_verification_code(
        email=user.email,
        code=verification_code
    )

    if not email_sent:
        raise HTTPException(
            status_code=500,
            detail={
                "error": 500,
                "message": "Unable to send the verification email."
            }
        )

    # Sauvegarder uniquement après l'envoi réussi
    await user.save()

    return {
        "error": "not",
        "message": "Verification code sent",
        "data": {
            "user_id": str(user.id)
        }
    }