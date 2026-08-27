from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime
from beanie import Document
import uuid
from beanie import PydanticObjectId

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

class Modpack(Document):
    owner_id: str
    shared_ids: list[str]

    display_name: str

    created_at : str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    updated_at : str = Field(default_factory=lambda: datetime.utcnow().isoformat())

    class Settings:
        name = "modpacks"

class ModpackState(Document):
    modpack_id: PydanticObjectId

    loader: str
    minecraft_version: str

    mods: list[dict] = []

    created_at : str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    updated_at : str = Field(default_factory=lambda: datetime.utcnow().isoformat())

    class Settings:
        name = "modpack_states"


class Conversation(Document):
    modpack_id: PydanticObjectId

    messages: list[str] = []

    created_at : str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    updated_at : str = Field(default_factory=lambda: datetime.utcnow().isoformat())

    class Settings:
        name = "conversations"

class Message(Document):
    role: str
    content: list[str]
    agent_run_id: PydanticObjectId = None

    created_at : str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    updated_at : str = Field(default_factory=lambda: datetime.utcnow().isoformat())

    class Settings:
        name = "messages"

class AgentRun(Document):
    history: list[dict] = []
    summary: str = ""

    state: str = "waiting"
    
    created_at : str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    updated_at : str = Field(default_factory=lambda: datetime.utcnow().isoformat())

    class Settings:
        name = "agent_runs"

class AgentRunUsage(Document):
    agent_run_id: PydanticObjectId = None

    prompt_tokens_raw: int = 0
    cache_hit_tokens: int = 0
    cache_miss_tokens: int = 0
    output_tokens: int = 0
    total_tokens: int = 0
    
    created_at : str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    updated_at : str = Field(default_factory=lambda: datetime.utcnow().isoformat())

    class Settings:
        name = "agent_runs_usage"

class SubscriptionPlan(Document):
    plan_code: str
    display_name: str
    price_cents: int
    monthly_credits_limit: int
    
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())

    class Settings:
        name = "subscription_plans"

class UserSubscription(Document):
    user_id: str
    plan_code: str
    
    credits_balance: int = 50
    credits_used_this_month: int = 0

    reserved: int = 0
    
    current_period_start: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    current_period_end: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())

    class Settings:
        name = "user_subscriptions"

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

class NewModpackRequest(BaseModel):
    name: str
    minecraft_version: str
    loader: str 

class ChatModpackRequest(BaseModel):
    prompt: str
    modpack_id: str