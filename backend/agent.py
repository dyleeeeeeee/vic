import asyncio
import os
import time
from typing import Callable, Optional

import anthropic

from models import AgentState, AgentStatus, Message

# ──────────────────────────────────────────────
# Tool schemas exposed to every agent
# ──────────────────────────────────────────────

TOOLS: list[dict] = [
    {
        "name": "run_terminal",
        "description": "Execute a shell command and return stdout/stderr. "
                       "Avoid long-running or interactive commands.",
        "input_schema": {
            "type": "object",
            "properties": {
                "command": {"type": "string", "description": "Shell command to execute"},
            },
            "required": ["command"],
        },
    },
    {
        "name": "read_file",
        "description": "Read the contents of a file from disk.",
        "input_schema": {
            "type": "object",
            "properties": {
                "path": {"type": "string", "description": "Absolute or relative file path"},
            },
            "required": ["path"],
        },
    },
    {
        "name": "write_file",
        "description": "Write content to a file, creating intermediate directories as needed.",
        "input_schema": {
            "type": "object",
            "properties": {
                "path": {"type": "string"},
                "content": {"type": "string"},
            },
            "required": ["path", "content"],
        },
    },
    {
        "name": "message_agent",
        "description": "Send a task or message to another agent by their ID. "
                       "Use this to delegate work or share results.",
        "input_schema": {
            "type": "object",
            "properties": {
                "agent_id": {"type": "string", "description": "Target agent ID"},
                "message": {"type": "string", "description": "Task or message to send"},
            },
            "required": ["agent_id", "message"],
        },
    },
    {
        "name": "ask_user",
        "description": "Ask the user a question when you need clarification before proceeding. "
                       "This pauses execution until the user replies.",
        "input_schema": {
            "type": "object",
            "properties": {
                "question": {"type": "string"},
            },
            "required": ["question"],
        },
    },
]


# ──────────────────────────────────────────────
# Agent
# ──────────────────────────────────────────────

class Agent:
    """
    One autonomous agent. Runs as a persistent asyncio task, consuming tasks
    from an internal queue, executing an LLM tool-use loop, and streaming
    status changes back via callbacks.
    """

    def __init__(
        self,
        state: AgentState,
        api_key: str,
        on_update: Callable,          # async (state, message_text) -> None
        on_message_agent: Callable,   # async (from_id, to_id, message) -> None
        workdir: str,
    ):
        self.state = state
        self.api_key = api_key
        self.on_update = on_update
        self.on_message_agent = on_message_agent
        self.workdir = workdir
        self.client = anthropic.AsyncAnthropic(api_key=api_key)

        self._queue: asyncio.Queue = asyncio.Queue()
        self._running = False
        self._answer_event = asyncio.Event()
        self._user_answer: Optional[str] = None

        os.makedirs(workdir, exist_ok=True)

    # ── public interface ──────────────────────

    async def enqueue_task(self, task: str, from_agent: Optional[str] = None):
        await self._queue.put({"task": task, "from_agent": from_agent})

    async def provide_answer(self, answer: str):
        self._user_answer = answer
        self._answer_event.set()

    def stop(self):
        self._running = False

    # ── main loop ─────────────────────────────

    async def run(self):
        self._running = True
        while self._running:
            try:
                item = await asyncio.wait_for(self._queue.get(), timeout=1.0)
                await self._execute_task(item["task"], item.get("from_agent"))
            except asyncio.TimeoutError:
                continue
            except asyncio.CancelledError:
                break
            except Exception as exc:
                self.state.status = AgentStatus.ERROR
                await self.on_update(self.state, f"Unhandled error: {exc}")

    # ── task execution ────────────────────────

    async def _execute_task(self, task: str, from_agent: Optional[str] = None):
        prefix = f"[from {from_agent}] " if from_agent else ""
        user_text = f"{prefix}{task}"

        self.state.status = AgentStatus.RUNNING
        self.state.current_task = task
        self._append_message("user", user_text)
        await self.on_update(self.state, f"▶ {task[:100]}")

        api_messages = self._build_api_messages()

        while True:
            response = await self.client.messages.create(
                model=self.state.model,
                max_tokens=4096,
                system=self.state.system_prompt,
                tools=TOOLS,
                messages=api_messages,
            )

            raw_blocks = [b.model_dump() for b in response.content]
            self._append_message("assistant", raw_blocks,
                                 text_preview=self._extract_text(response.content))
            api_messages.append({"role": "assistant", "content": response.content})

            if response.stop_reason == "end_turn":
                final = self._extract_text(response.content) or "Done."
                self.state.status = AgentStatus.DONE
                self.state.current_task = None
                self.state.pending_question = None
                await self.on_update(self.state, final)
                break

            if response.stop_reason == "tool_use":
                tool_results = await self._handle_tool_calls(response.content)

                # if we hit ask_user, wait for the answer before continuing
                if self.state.status == AgentStatus.WAITING:
                    await self._answer_event.wait()
                    self._answer_event.clear()
                    # patch the placeholder result with the real answer
                    for r in tool_results:
                        if isinstance(r.get("content"), str) and r["content"].startswith("__WAITING__"):
                            r["content"] = self._user_answer or "(no answer)"
                    self._user_answer = None
                    self.state.status = AgentStatus.RUNNING
                    self.state.pending_question = None
                    await self.on_update(self.state, "↩ Resuming with user input")

                self._append_message("user", tool_results)
                api_messages.append({"role": "user", "content": tool_results})

    # ── tool dispatch ─────────────────────────

    async def _handle_tool_calls(self, content: list) -> list[dict]:
        results = []
        for block in content:
            if block.type != "tool_use":
                continue
            result_text = await self._execute_tool(block.name, block.input)
            results.append({
                "type": "tool_result",
                "tool_use_id": block.id,
                "content": result_text,
            })
        return results

    async def _execute_tool(self, name: str, inputs: dict) -> str:
        match name:
            case "run_terminal":
                return await self._run_terminal(inputs["command"])
            case "read_file":
                return self._read_file(inputs["path"])
            case "write_file":
                return self._write_file(inputs["path"], inputs["content"])
            case "message_agent":
                await self.on_message_agent(
                    from_id=self.state.id,
                    to_id=inputs["agent_id"],
                    message=inputs["message"],
                )
                return f"Message dispatched to {inputs['agent_id']}."
            case "ask_user":
                question = inputs["question"]
                self.state.status = AgentStatus.WAITING
                self.state.pending_question = question
                await self.on_update(self.state, f"? {question}")
                return f"__WAITING__{question}"
            case _:
                return f"Unknown tool: {name}"

    # ── tool implementations ──────────────────

    async def _run_terminal(self, command: str) -> str:
        try:
            proc = await asyncio.create_subprocess_shell(
                command,
                cwd=self.workdir,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.STDOUT,
            )
            stdout, _ = await asyncio.wait_for(proc.communicate(), timeout=30.0)
            output = stdout.decode(errors="replace")
            return output[:6000] if output else "(no output)"
        except asyncio.TimeoutError:
            return "Error: command timed out after 30s"
        except Exception as exc:
            return f"Error: {exc}"

    def _read_file(self, path: str) -> str:
        try:
            full = path if os.path.isabs(path) else os.path.join(self.workdir, path)
            with open(full, "r", errors="replace") as f:
                content = f.read(10_000)
            return content or "(empty file)"
        except Exception as exc:
            return f"Error reading {path}: {exc}"

    def _write_file(self, path: str, content: str) -> str:
        try:
            full = path if os.path.isabs(path) else os.path.join(self.workdir, path)
            os.makedirs(os.path.dirname(os.path.abspath(full)), exist_ok=True)
            with open(full, "w") as f:
                f.write(content)
            return f"Wrote {len(content)} bytes → {path}"
        except Exception as exc:
            return f"Error writing {path}: {exc}"

    # ── helpers ───────────────────────────────

    def _append_message(self, role: str, content: Any, text_preview: str = ""):
        if not text_preview and isinstance(content, str):
            text_preview = content[:120]
        self.state.messages.append(
            Message(role=role, content=content, text_preview=text_preview)
        )

    def _build_api_messages(self) -> list[dict]:
        out = []
        for m in self.state.messages:
            out.append({"role": m.role, "content": m.content})
        return out

    @staticmethod
    def _extract_text(content: list) -> str:
        for block in content:
            if hasattr(block, "text"):
                return block.text
        return ""
