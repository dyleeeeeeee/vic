from enum import Enum
from typing import Optional, Any
from pydantic import BaseModel, Field
import time
import uuid


class AgentStatus(str, Enum):
    IDLE = "idle"
    RUNNING = "running"
    WAITING = "waiting"   # blocked on user input
    BLOCKED = "blocked"   # blocked on another agent
    DONE = "done"
    ERROR = "error"


class AgentConfig(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4())[:8])
    name: str
    model: str = "claude-sonnet-4-20250514"
    system_prompt: str = "You are a helpful AI agent. Complete the tasks given to you."
    tools: list[str] = ["terminal", "file_read", "file_write", "message_agent", "ask_user"]
    api_key: str = ""
    x: float = 0.0
    y: float = 0.0
    team: str = "default"
    building_id: Optional[str] = None


class Message(BaseModel):
    role: str
    content: Any
    timestamp: float = Field(default_factory=time.time)
    text_preview: str = ""  # first 120 chars of text content for frontend


class AgentState(BaseModel):
    id: str
    name: str
    status: AgentStatus = AgentStatus.IDLE
    model: str
    system_prompt: str
    messages: list[Message] = []
    current_task: Optional[str] = None
    pending_question: Optional[str] = None  # set when status==WAITING
    x: float = 0.0
    y: float = 0.0
    team: str = "default"
    building_id: Optional[str] = None
    created_at: float = Field(default_factory=time.time)


class WSEvent(BaseModel):
    type: str  # agent_created | agent_update | agent_message | agent_deleted | init | error
    agent_id: Optional[str] = None
    data: Any = None
    timestamp: float = Field(default_factory=time.time)
