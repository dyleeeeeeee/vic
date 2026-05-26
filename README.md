# Vic

Multi-agent orchestration UI. Spawn, monitor, and task autonomous AI agents from a single canvas.

## Architecture

```
backend/
  models.py         — Pydantic schemas (AgentState, WSEvent, etc.)
  agent.py          — Agent class: LLM loop, tool execution, state machine
  orchestrator.py   — Manages agent pool, inter-agent routing, WS broadcast
  main.py           — FastAPI + WebSocket server

frontend/src/
  types.ts                      — Shared TypeScript types
  hooks/useOrchestrator.ts      — WS connection, state, actions
  components/AgentCanvas.tsx    — react-flow canvas
  components/AgentNode.tsx      — Custom node with status indicators
  components/ChatPanel.tsx      — Sidebar: messages, task input, answer input
  components/CreateAgentModal.tsx — Spawn new agent
  App.tsx                       — Root layout
```

## Setup

### Backend

```bash
cd backend
pip install -r requirements.txt
python main.py
# → listening on ws://localhost:8765/ws
```

### Frontend

```bash
cd frontend
npm install
npm run dev
# → http://localhost:3000
```

## How it works

1. **Spawn an agent** — give it a name, model, system prompt, and API key
2. **Send a task** — click the agent node, type in the panel, hit send
3. **Agent runs autonomously** — uses terminal, file read/write, can delegate to other agents
4. **Inter-agent messaging** — an agent calls `message_agent` tool → orchestrator routes the task to the target
5. **User input** — when an agent calls `ask_user`, status flips to WAITING; the panel shows the question and accepts your answer

## Extending

**Add a tool:**
1. Add schema to `TOOLS` list in `agent.py`
2. Add handler in `_execute_tool()` match block

**Add a model provider:**
- OpenAI: swap `anthropic.AsyncAnthropic` for `openai.AsyncOpenAI`, adjust message format
- Gemini: use `google.generativeai` async client

**Persist state:**
- Add SQLite via `aiosqlite`, write agent states and messages on every update
- On startup, hydrate orchestrator from DB

## Environment variables

| Variable | Default | Description |
|---|---|---|
| `VITE_WS_URL` | `ws://localhost:8765/ws` | Backend WS endpoint |
