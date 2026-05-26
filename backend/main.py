import json
import logging

import uvicorn
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from models import AgentConfig, WSEvent
from orchestrator import Orchestrator

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("swarmhq")

app = FastAPI(title="SwarmHQ", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── global state ──────────────────────────────

_clients: list[WebSocket] = []
orchestrator: Orchestrator = None


async def broadcast(event: WSEvent):
    dead = []
    payload = event.model_dump_json()
    for ws in _clients:
        try:
            await ws.send_text(payload)
        except Exception:
            dead.append(ws)
    for ws in dead:
        _clients.remove(ws)


@app.on_event("startup")
async def startup():
    global orchestrator
    orchestrator = Orchestrator(on_event=broadcast)
    logger.info("SwarmHQ orchestrator ready")


# ── WebSocket ─────────────────────────────────

@app.websocket("/ws")
async def ws_endpoint(ws: WebSocket):
    await ws.accept()
    _clients.append(ws)
    logger.info(f"WS client connected ({len(_clients)} total)")

    # hydrate new client with current agent states
    await ws.send_text(json.dumps({
        "type": "init",
        "data": orchestrator.get_all_states(),
    }))

    try:
        while True:
            raw = await ws.receive_text()
            try:
                msg = json.loads(raw)
                await _handle(msg, ws)
            except Exception as exc:
                await ws.send_text(json.dumps({"type": "error", "data": str(exc)}))
    except WebSocketDisconnect:
        _clients.remove(ws)
        logger.info(f"WS client disconnected ({len(_clients)} remaining)")


async def _handle(msg: dict, ws: WebSocket):
    action = msg.get("action")

    match action:
        case "create_agent":
            config = AgentConfig(**msg["config"])
            state = await orchestrator.create_agent(config)
            # ack back to sender
            await ws.send_text(json.dumps({"type": "ack", "action": "create_agent", "agent_id": state.id}))

        case "send_task":
            await orchestrator.send_task(msg["agent_id"], msg["task"])

        case "send_answer":
            await orchestrator.send_answer(msg["agent_id"], msg["answer"])

        case "delete_agent":
            await orchestrator.delete_agent(msg["agent_id"])

        case "update_position":
            await orchestrator.update_position(msg["agent_id"], msg["x"], msg["y"])

        case "get_messages":
            messages = orchestrator.get_messages(msg["agent_id"])
            await ws.send_text(json.dumps({
                "type": "messages",
                "agent_id": msg["agent_id"],
                "data": messages,
            }))

        case _:
            raise ValueError(f"Unknown action: {action}")


# ── REST (optional convenience layer) ─────────

@app.get("/agents")
async def list_agents():
    return orchestrator.get_all_states()


@app.post("/agents")
async def create_agent(config: AgentConfig):
    state = await orchestrator.create_agent(config)
    return state.model_dump(exclude={"messages"})


@app.delete("/agents/{agent_id}")
async def delete_agent(agent_id: str):
    await orchestrator.delete_agent(agent_id)
    return {"ok": True}


@app.get("/agents/{agent_id}/messages")
async def get_messages(agent_id: str):
    return orchestrator.get_messages(agent_id)


# ── entrypoint ────────────────────────────────

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8765, reload=True)
