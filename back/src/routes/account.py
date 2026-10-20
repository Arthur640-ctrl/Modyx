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
    subscription = await UserSubscription.find_one(UserSubscription.user_id == user.id)
    plan = await SubscriptionPlan.find_one(
        SubscriptionPlan.plan_code == subscription.plan_code
    )

    return {
        "user_id": user.id,
        "pseudo": user.pseudo,
        "email": user.email,

        "plan": {
            "plan_code": plan.plan_code,
            "plan_display_name": plan.display_name,

            "credits_availble":  {
                "plan_limit_total": plan.monthly_credits_limit,
                "added_credits": subscription.credits_added,
                "total": subscription.credits_balance_this_month + subscription.credits_added
            },

            "plan_credits_used": {
                "plan_credits_used_this_month": plan.monthly_credits_limit - subscription.credits_balance_this_month
            }
        }
    }

@router.post("/settings/update")
async def update_account_settings(request: Request, data: UpdateSettingsRequest, user: User = Depends(get_current_user)):
    if data.setting_key == "pseudo":
        if await User.find_one({"pseudo_lower": data.new_value.lower()}):
            raise HTTPException(400, {
                    "error": 400,
                    "message": "Ce pseudo existe déjà. Impossible de le modifier.",
                })

        user.pseudo_lower = data.new_value.lower()
        user.pseudo = data.new_value
        await user.save()

        return {
            "ok": True,
            "message": "Pseudo actualisé."
        }

    if data.setting_key == "email":
        if await User.find_one({"email": data.new_value}):
            raise HTTPException(400, {
                "error": 400,
                "message": "Cette email existe déjà. Impossible de le modifier.",
            })

        user.email = data.new_value
        await user.save()

        return {
            "ok": True,
            "message": "Email actualisé."
        }

    if data.setting_key == "password":
        hashed_password = hash_password(data.new_value)

        user.password = hashed_password
        await user.save()

        return {
            "ok": True,
            "message": "Mot de passe actualisé."
        }

    raise HTTPException(404, {
        "error": 404,
        "message": "Le paramètre demandé n'est pas trouvé.",
    })