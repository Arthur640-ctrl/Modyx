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


async def send_verification_code(
    email: str,
    code: str
) -> bool:

    try:
        await resend.Emails.send_async({
            "from": "Modyx <onboarding@resend.dev>",
            "to": [email],
            "subject": "Votre code de vérification Modyx",
            "html": f"""
                <div>
                    <h2>Vérification de votre adresse email</h2>

                    <p>Votre code de vérification est :</p>

                    <h1 style="
                        font-size: 32px;
                        letter-spacing: 8px;
                    ">
                        {code}
                    </h1>

                    <p>
                        Ce code expire dans 10 minutes.
                    </p>

                    <p>
                        Si vous n'êtes pas à l'origine de cette demande,
                        vous pouvez ignorer cet email.
                    </p>
                </div>
            """
        })

        return True

    except Exception as e:
        print(f"[Email] Erreur envoi : {e}")
        return False