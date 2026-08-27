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
    plan = None
    if subscription:
        plan = await SubscriptionPlan.find_one(
            SubscriptionPlan.plan_code == subscription.plan_code
        )

    credits_balance_this_month = (
        subscription.credits_balance + subscription.credits_reserved
        if subscription
        else 0
    )

    return {
        "pseudo": user.pseudo,
        "email": user.email,
        "plan_code": subscription.plan_code if subscription else "free",
        "plan_display_name": plan.display_name if plan else "Plan gratuit",
        "credits_balance_this_month": credits_balance_this_month,
        "credits_used_this_month": subscription.credits_used_this_month if subscription else 0,
        "monthly_credits_limit_plan": plan.monthly_credits_limit if plan else 0,
    }
