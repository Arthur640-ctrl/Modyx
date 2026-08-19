from fastapi import APIRouter, HTTPException, Depends, Request
from datetime import datetime
import re
from models import *
from database import *
from core.auth_security import *
from core.deps import get_current_user

router = APIRouter(prefix="/account")


@router.get("/me")
async def get_me(request: Request, user: User = Depends(get_current_user)):
    return {
        "pseudo": user.pseudo,
        "email": user.email
    }
