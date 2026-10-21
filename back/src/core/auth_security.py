import bcrypt
import jwt
import config
import resend

from datetime import datetime, timedelta


SECRET_KEY = config.JWT_SECRET_KEY
ALGORITHM = "HS256"

resend.api_key = config.RESEND_API_KEY


def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(
        password.encode("utf-8"),
        salt
    ).decode("utf-8")


def verify_password(
    plain_password: str,
    hashed_password: str
) -> bool:
    return bcrypt.checkpw(
        plain_password.encode("utf-8"),
        hashed_password.encode("utf-8")
    )


def create_access_token(player_id: str) -> str:
    expire = datetime.utcnow() + timedelta(days=1)

    payload = {
        "sub": player_id,
        "exp": expire
    }

    return jwt.encode(
        payload,
        SECRET_KEY,
        algorithm=ALGORITHM
    )


def decode_token(token: str) -> dict | None:
    try:
        return jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )
    except jwt.PyJWTError:
        return None


async def send_verification_code(email: str, code: str) -> bool:
    try:
        result = await resend.Emails.send_async({
            "from": "Modyx <verification_code@modyx.gleeze.com>",
            "to": [email],
            "subject": "Modyx",
            "text": (
                "Bonjour,\n\n"
                f"Voici le code demandé : {code}\n\n"
                "Il expire dans 10 minutes."
            )
        })

        print("Réponse Resend :", result)
        return True

    except Exception as e:
        print(f"[Email] Erreur Resend : {e}")
        return False