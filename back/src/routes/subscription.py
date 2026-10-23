from fastapi import APIRouter, HTTPException, Depends, Request
from models import *
from database import *

router = APIRouter(prefix="/subscription")

@router.get("/user/{user_id}")
async def get_me(user_id: str):
    subscription = await UserSubscription.find_one(UserSubscription.user_id == user_id)
    
    if not subscription:
        raise HTTPException(status_code=404, detail="Subscription not found")

    return {
        "user_id": subscription.user_id,
        "plan_code": subscription.plan_code
    }

@router.get("/list")
async def get_subscription(request: Request):
    return {
        "bundles": [
            {
                "id": "emergency",
                "name": "Ravitaillement d'urgence",
                "price": 2.99,
                "credits": 50
            },
            {
                "id": "small",
                "name": "Petite soif",
                "price": 4.99,
                "credits": 100
            },
            {
                "id": "large",
                "name": "Grande soif",
                "price": 10.99,
                "credits": 250
            }
        ],
        "plans": [
            {
                "id": "free",
                "name": "Free",
                "price": 0,
                "credits": 50,
                "credits_period": "one_time",
                "description": "Pour découvrir Modyx",
                "features": [
                    {
                        "included": True,
                        "content": "Fonctionnalités de base",
                    },
                    {
                        "included": False,
                        "content": "50 crédits offerts, non renouvelables",
                    },
                    {
                        "included": False,
                        "content": "Accés prioritaire lors de la génération",
                    },
                    {
                        "included": False,
                        "content": "Accés prioritaire au support",
                    }
                ]
            },
            {
                "id": "starter",
                "name": "Starter",
                "price": 4.99,
                "credits": 150,
                "credits_period": "monthly",
                "description": "Pour créer régulièrement",
                "features": [
                    {
                        "included": True,
                        "content": "Fonctionnalités de base",
                    },
                    {
                        "included": True,
                        "content": "150 crédits, renouvelés tout les mois",
                    },
                    {
                        "included": True,
                        "content": "Accés prioritaire lors de la génération",
                    },
                    {
                        "included": True,
                        "content": "Accés prioritaire au support",
                    }
                ]
            },
            {
                "id": "pro",
                "name": "Pro",
                "price": 14.99,
                "credits": 500,
                "credits_period": "monthly",
                "description": "Pour aller plus loin",
                "features": [
                    {
                        "included": True,
                        "content": "Fonctionnalités avancées",
                    },
                    {
                        "included": True,
                        "content": "500 crédits, renouvelés tout les mois",
                    },
                    {
                        "included": True,
                        "content": "Accés prioritaire lors de la génération",
                    },
                    {
                        "included": True,
                        "content": "Accés prioritaire au support",
                    }
                ]
            }
        ]
    }