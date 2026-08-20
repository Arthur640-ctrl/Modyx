from generator.services.modrinth import get_project_dependencies
from generator.llm.registry import *


async def get_mod_dependencies(
    mod_id: str,
    minecraft_version: str,
    loader: str,
    context: ToolContext,
):
    """
    Returns only the dependencies relevant to a specific
    Minecraft version and mod loader.
    """

    infos = await get_project_dependencies(mod_id)

    projects = {
        project["id"]: project
        for project in infos.get("projects", [])
    }

    versions = infos.get("versions", [])

    dependencies = {}

    for version in versions:
        game_versions = version.get("game_versions", [])
        loaders = version.get("loaders", [])

        # Ignore incompatible dependency versions
        if minecraft_version not in game_versions:
            continue

        if loader not in loaders:
            continue

        project_id = version.get("project_id")

        if not project_id:
            continue

        project = projects.get(project_id, {})

        # Group by project so we don't return the same dependency
        # multiple times because it has several compatible versions.
        if project_id not in dependencies:
            dependencies[project_id] = {
                "project_id": project_id,
                "name": project.get("title"),
                "versions": [],
            }

        dependencies[project_id]["versions"].append({
            "version_id": version.get("id"),
            "version": version.get("version_number"),
        })

    return {
        "mod_id": mod_id,
        "minecraft_version": minecraft_version,
        "loader": loader,
        "dependencies": list(dependencies.values()),
    }


def register(registry: ToolRegistry):
    registry.register(
        name="get_mod_dependencies",
        definition={
            "type": "function",
            "function": {
                "name": "get_mod_dependencies",
                "description": (
                    "Find the dependencies required by a mod for a specific "
                    "Minecraft version and mod loader. Only return dependencies "
                    "compatible with the requested Minecraft version and loader. "
                    "Use this after identifying the correct mod."
                ),
                "parameters": {
                    "type": "object",
                    "properties": {
                        "mod_id": {
                            "type": "string",
                            "description": "The ID of the mod."
                        },
                        "minecraft_version": {
                            "type": "string",
                            "description": (
                                "Minecraft version to check, for example "
                                "'1.20.1'."
                            )
                        },
                        "loader": {
                            "type": "string",
                            "description": (
                                "Mod loader to check, for example 'forge', "
                                "'fabric' or 'neoforge'."
                            )
                        },
                    },
                    "required": [
                        "mod_id",
                        "minecraft_version",
                        "loader"
                    ]
                }
            }
        },
        function=get_mod_dependencies
    )