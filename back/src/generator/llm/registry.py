from dataclasses import dataclass
from typing import Any, Awaitable, Callable


@dataclass
class Tool:
    definition: dict
    function: Callable[..., Awaitable[Any]]


@dataclass
class ToolContext:
    modpack_id: str


class ToolRegistry:

    def __init__(self):
        self._tools: dict[str, Tool] = {}

    def register(
        self,
        name: str,
        definition: dict,
        function: Callable[..., Awaitable[Any]],
    ):
        self._tools[name] = Tool(
            definition=definition,
            function=function,
        )

    def get_definitions(self) -> list[dict]:
        return [
            tool.definition
            for tool in self._tools.values()
        ]

    async def execute(
        self,
        name: str,
        arguments: dict,
        context: ToolContext,
    ):
        tool = self._tools.get(name)

        if tool is None:
            raise ValueError(f"Unknown tool: {name}")

        return await tool.function(
            **arguments,
            context=context,
        )

registry = ToolRegistry()