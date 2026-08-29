from models import *

def is_plan_credits_full(subscription : UserSubscription, plan: SubscriptionPlan) -> bool:

    plan_max_credits = plan.monthly_credits_limit
    user_plan_credits = subscription.credits_balance_this_month

    return True if plan_max_credits == user_plan_credits else False

async def add_credits(
    amount: int,
    user: User,
    plan_credits: bool = False,
    added_credits: bool = False
) -> bool:

    if amount <= 0:
        return False

    subscription = await UserSubscription.find_one(
        UserSubscription.user_id == user.id
    )

    if not subscription:
        return False

    plan = await SubscriptionPlan.find_one(
        SubscriptionPlan.plan_code == subscription.plan_code
    )

    if not plan:
        return False

    # Ajouter uniquement des crédits du plan
    if plan_credits and not added_credits:

        await subscription.inc({
            UserSubscription.credits_balance_this_month: amount
        })

        return True

    # Ajouter uniquement des crédits ajoutés
    if not plan_credits and added_credits:

        await subscription.inc({
            UserSubscription.credits_added: amount
        })

        return True

    # Mode automatique :
    # remplir le quota du plan → puis mettre le surplus dans added
    if not plan_credits and not added_credits:

        remaining_plan_credits = (
            plan.monthly_credits_limit
            - subscription.credits_balance_this_month
        )

        plan_amount = min(
            amount,
            max(0, remaining_plan_credits)
        )

        added_amount = amount - plan_amount

        if plan_amount > 0:
            await subscription.inc({
                UserSubscription.credits_balance_this_month: plan_amount
            })

        if added_amount > 0:
            await subscription.inc({
                UserSubscription.credits_added: added_amount
            })

        return True

    # Ajouter amount aux deux types
    if plan_credits and added_credits:

        await subscription.inc({
            UserSubscription.credits_balance_this_month: amount
        })

        await subscription.inc({
            UserSubscription.credits_added: amount
        })

        return True

    return False

async def remove_credits(
    amount: int,
    user: User,
    plan_credits: bool = False,
    added_credits: bool = False,
    allow_negative: bool = False
) -> bool:

    if amount <= 0:
        return False

    subscription = await UserSubscription.find_one(
        UserSubscription.user_id == user.id
    )

    if not subscription:
        return False

    # Retirer uniquement des crédits du plan
    if plan_credits and not added_credits:

        if (
            not allow_negative
            and subscription.credits_balance_this_month < amount
        ):
            return False

        await subscription.inc({
            UserSubscription.credits_balance_this_month: -amount
        })

        return True

    # Retirer uniquement des crédits ajoutés
    if not plan_credits and added_credits:

        if (
            not allow_negative
            and subscription.credits_added < amount
        ):
            return False

        await subscription.inc({
            UserSubscription.credits_added: -amount
        })

        return True

    # Mode automatique :
    # plan → puis added si le plan ne suffit pas
    if not plan_credits and not added_credits:

        plan_credits_available = subscription.credits_balance_this_month
        added_credits_available = subscription.credits_added

        total_credits = plan_credits_available + added_credits_available

        if not allow_negative and total_credits < amount:
            return False

        # On consomme d'abord les crédits du plan
        plan_amount = min(amount, max(0, plan_credits_available))
        remaining_amount = amount - plan_amount

        if plan_amount > 0:
            await subscription.inc({
                UserSubscription.credits_balance_this_month: -plan_amount
            })

        # Puis les crédits ajoutés
        if remaining_amount > 0:
            await subscription.inc({
                UserSubscription.credits_added: -remaining_amount
            })

        return True

    # Retirer amount des deux types
    if plan_credits and added_credits:

        if not allow_negative and (
            subscription.credits_balance_this_month < amount
            or subscription.credits_added < amount
        ):
            return False

        await subscription.inc({
            UserSubscription.credits_balance_this_month: -amount
        })

        await subscription.inc({
            UserSubscription.credits_added: -amount
        })

        return True

    return False

async def get_added_credits(user: User) -> int:
    subscription = await UserSubscription.find_one(
        UserSubscription.user_id == user.id
    )

    return subscription.credits_added

async def get_plan_credits(user: User) -> int:
    subscription = await UserSubscription.find_one(
        UserSubscription.user_id == user.id
    )

    return subscription.credits_balance_this_month