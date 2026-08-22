import asyncio


class StreamManager:
    def __init__(self):
        self.stream = {}
        self.conditions = {}

    def create(self, agent_run_id: str):
        self.stream[agent_run_id] = []
        self.conditions[agent_run_id] = asyncio.Condition()

    async def add_message(
        self,
        agent_run_id: str,
        role: str,
        content: str = ""
    ):
        message = {
            "role": role,
            "content": content
        }

        async with self.conditions[agent_run_id]:
            self.stream[agent_run_id].append(message)
            self.conditions[agent_run_id].notify_all()

    async def update_content(
        self,
        agent_run_id: str,
        delta_content: str
    ):
        async with self.conditions[agent_run_id]:
            self.stream[agent_run_id][-1]["content"] += delta_content
            self.conditions[agent_run_id].notify_all()

    async def update_tool_call(
        self,
        agent_run_id: str,
        tool_call_index: int,
        delta
    ):
        async with self.conditions[agent_run_id]:
            message = self.stream[agent_run_id][-1]

            if "tool_calls" not in message:
                message["tool_calls"] = []

            while len(message["tool_calls"]) <= tool_call_index:
                message["tool_calls"].append({
                    "id": "",
                    "type": "function",
                    "function": {
                        "name": "",
                        "arguments": ""
                    }
                })

            tool_call = message["tool_calls"][tool_call_index]

            if delta.id:
                tool_call["id"] += delta.id

            if delta.type:
                tool_call["type"] = delta.type

            if delta.function:
                if delta.function.name:
                    tool_call["function"]["name"] += delta.function.name

                if delta.function.arguments:
                    tool_call["function"]["arguments"] += delta.function.arguments

            self.conditions[agent_run_id].notify_all()

    def get(self, agent_run_id: str):
        return self.stream[agent_run_id]

    async def wait_for_update(self, agent_run_id: str):
        async with self.conditions[agent_run_id]:
            await self.conditions[agent_run_id].wait()

    def delete(self, agent_run_id: str):
        self.stream.pop(agent_run_id, None)
        self.conditions.pop(agent_run_id, None)


stream_manager = StreamManager()