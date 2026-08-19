from fastapi import HTTPException, Header

from models import User
from core.auth_security import decode_token


async def get_current_user(authorization: str = Header(...)) -> User:
    if not authorization.startswith("Bearer "):
        raise HTTPException(401, "Invalid authorization header")

    token = authorization[7:]
    payload = decode_token(token)

    if payload is None:
        raise HTTPException(401, "Invalid or expired token")

    user_id = payload.get("sub")

    if not user_id:
        raise HTTPException(401, "Invalid token payload")

    user = await User.get(user_id)

    if not user:
        raise HTTPException(401, "User not found")

    return user