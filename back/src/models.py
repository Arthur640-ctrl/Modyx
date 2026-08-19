from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime
from beanie import Document
import uuid

# Documents :
class User(Document):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))

    pseudo: str
    pseudo_lower: str

    email: EmailStr
    password: str

    created_at : str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    updated_at : str = Field(default_factory=lambda: datetime.utcnow().isoformat())

    class Settings:
        name = "users"

# Requets :
class RegisterRequest(BaseModel):
    pseudo: str

    email: EmailStr
    password: str

    bot : str | None = None

class LoginRequest(BaseModel):
    email : EmailStr
    password : str

    bot : str | None = None

class UpdateAccountRequest(BaseModel):
    pseudo: str | None = None
    email: EmailStr | None = None

class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str