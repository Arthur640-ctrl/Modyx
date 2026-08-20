from generator.llm.registry import registry

from generator.llm.tools.search_mods import register as register_search_mod
from generator.llm.tools.get_mod_infos import register as register_get_mod_infos
from generator.llm.tools.get_mod_versions import register as register_get_mod_versions
from generator.llm.tools.get_mod_dependencies import register as register_get_mod_dependencies
from generator.llm.tools.get_pack_mods import register as register_get_pack_mods
from generator.llm.tools.get_pack_version import register as register_get_pack_version
from generator.llm.tools.add_mod import register as register_add_mod

def register_tools():
    # Modrinth
    register_search_mod(registry)
    register_get_mod_infos(registry)
    register_get_mod_versions(registry)
    register_get_mod_dependencies(registry)

    # Lecture
    register_get_pack_mods(registry)
    register_get_pack_version(registry)

    # Modification
    register_add_mod(registry)