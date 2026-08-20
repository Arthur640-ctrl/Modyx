from generator.services.modrinth import *
from generator.llm.registry import *
from typing import Optional

async def get_mod_versions(
    mod_id: str,
    context: ToolContext,
    loader: Optional[str] = None,
    game_version: Optional[str] = None,
):
    try:
        versions = await list_project_versions(
            project_id=mod_id,
            loader=loader,
            game_version=game_version,
            include_changelog=False,
        )
    except Exception as e:
        return {"error": f"Failed to fetch versions: {str(e)}"}

    # Ne garder que les versions stables (release)
    release_versions = [v for v in versions if v.get("version_type") == "release"]
    if not release_versions:  # Si aucune release, on prend toutes (cas rare)
        release_versions = versions

    # Trier par date de publication décroissante (les plus récentes d'abord)
    release_versions.sort(key=lambda x: x.get("date_published", ""), reverse=True)

    # Limiter à 5 versions maximum
    release_versions = release_versions[:5]

    data = []
    for v in release_versions:
        data.append({
            "mod_id": mod_id,                 # ✅ On associe le mod_id
            "version_id": v.get("id"),
            "version_number": v.get("version_number"),
            "game_versions": v.get("game_versions", []),
            "loaders": v.get("loaders", []),
            "version_type": v.get("version_type"),
            "date_published": v.get("date_published"),
        })

    return data

def register(registry: ToolRegistry):
    registry.register(
        name="get_mod_versions",
        definition={
            "type": "function",
            "function": {
                "name": "get_mod_versions",
                "description": (
                    "Retrieve available versions of a mod, with optional filters "
                    "by mod loader and Minecraft version."
                ),
                "parameters": {
                    "type": "object",
                    "properties": {
                        "mod_id": {
                            "type": "string",
                            "description": "Id of the mod"
                        },
                        "loader": {
                            "type": "string",
                            "description": "Optional mod loader filter (e.g., 'fabric', 'forge')"
                        },
                        "game_version": {
                            "type": "string",
                            "description": "Optional Minecraft version filter (e.g., '1.20.1')"
                        }
                    },
                    "required": ["mod_id"]
                },
            },
        },
        function=get_mod_versions,
    )