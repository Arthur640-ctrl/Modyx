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
