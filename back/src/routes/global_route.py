from fastapi import APIRouter

from models import SubscriptionPlan, User


router = APIRouter(prefix="/global")


@router.get("/")
async def get_global_information():
    plans = await SubscriptionPlan.find_all().to_list()
    plans.sort(key=lambda plan: plan.price_cents)

    return {
        "stats": {
            "accounts_count": await User.count(),
            "plans_count": len(plans),
        },
        "plans": [
            {
                "plan_code": plan.plan_code,
                "display_name": plan.display_name,
                "price_cents": plan.price_cents,
                "monthly_credits_limit": plan.monthly_credits_limit,
                "product_id": plan.product_id,
                "variant_id": plan.variant_id
            }
            for plan in plans
        ],
    }


@router.get("/validate-user/{user_id}")
async def validate_global_user(user_id: str):
    user = await User.find_one(User.id == user_id)

    return {"valid": user is not None}
