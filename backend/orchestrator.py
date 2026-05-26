import asyncio
import time
from typing import Callable, Dict

from agent import Agent
from models import AgentConfig, AgentState, AgentStatus, WSEvent


class Orchestrator:
    """
    Manages the full agent pool. Owns every agent's lifecycle,
    routes inter-agent messages, and fans out WS events to the frontend.
    """

    def __init__(self, on_event: Callable):
        self._on_event = on_event            # async (WSEvent) -> None
        self._agents: Dict[str, Agent] = {}
        self._states: Dict[str, AgentState] = {}
        self._tasks: Dict[str, asyncio.Task] = {}

    # ── agent lifecycle ───────────────────────

    async def create_agent(self, config: AgentConfig) -> AgentState:
        agent_id = config.id

        state = AgentState(
            id=agent_id,
            name=config.name,
            model=config.model,
            system_prompt=config.system_prompt,
            x=config.x,
            y=config.y,
        )

        agent = Agent(
            state=state,
            api_key=config.api_key,
            on_update=self._on_agent_update,
            on_message_agent=self._on_message_agent,
            workdir=f"/tmp/swarmhq/{agent_id}",
        )

        self._agents[agent_id] = agent
        self._states[agent_id] = state
        self._tasks[agent_id] = asyncio.create_task(agent.run(), name=f"agent-{agent_id}")

        await self._emit(WSEvent(
            type="agent_created",
            agent_id=agent_id,
            data=state.model_dump(exclude={"messages"}),
        ))

        return state

    async def delete_agent(self, agent_id: str):
        if agent_id not in self._agents:
            return
        self._agents[agent_id].stop()
        self._tasks[agent_id].cancel()
        del self._agents[agent_id]
        del self._states[agent_id]
        del self._tasks[agent_id]
        await self._emit(WSEvent(type="agent_deleted", agent_id=agent_id))

    # ── task / message routing ─────────────────

    async def send_task(self, agent_id: str, task: str):
        self._require(agent_id)
        await self._agents[agent_id].enqueue_task(task)

    async def send_answer(self, agent_id: str, answer: str):
        self._require(agent_id)
        await self._agents[agent_id].provide_answer(answer)

    async def update_position(self, agent_id: str, x: float, y: float):
        if agent_id in self._states:
            self._states[agent_id].x = x
            self._states[agent_id].y = y

    # ── queries ───────────────────────────────

    def get_all_states(self) -> list[dict]:
        return [s.model_dump(exclude={"messages"}) for s in self._states.values()]

    def get_messages(self, agent_id: str) -> list[dict]:
        if agent_id not in self._states:
            return []
        return [m.model_dump() for m in self._states[agent_id].messages]

    # ── internal callbacks ────────────────────

    async def _on_agent_update(self, state: AgentState, message: str):
        await self._emit(WSEvent(
            type="agent_update",
            agent_id=state.id,
            data={
                "status": state.status,
                "current_task": state.current_task,
                "pending_question": state.pending_question,
                "message": message,
                "x": state.x,
                "y": state.y,
            },
        ))

    async def _on_message_agent(self, from_id: str, to_id: str, message: str):
        if to_id not in self._agents:
            # notify sender that target doesn't exist
            await self._agents[from_id].provide_answer(f"Error: agent {to_id} not found.")
            return

        # mark source as blocked while target works
        if from_id in self._states:
            self._states[from_id].status = AgentStatus.BLOCKED
            await self._emit(WSEvent(
                type="agent_update",
                agent_id=from_id,
                data={"status": AgentStatus.BLOCKED, "current_task": f"waiting on {to_id}"},
            ))

        await self._emit(WSEvent(
            type="agent_message",
            agent_id=from_id,
            data={"to": to_id, "message": message},
        ))

        await self._agents[to_id].enqueue_task(message, from_agent=from_id)

    # ── helpers ───────────────────────────────

    async def _emit(self, event: WSEvent):
        try:
            await self._on_event(event)
        except Exception:
            pass  # don't let broadcast failures crash orchestrator

    def _require(self, agent_id: str):
        if agent_id not in self._agents:
            raise KeyError(f"Agent '{agent_id}' not found")
