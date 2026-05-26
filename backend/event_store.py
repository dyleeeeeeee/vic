import json
import sqlite3
import time
from typing import Optional


class EventStore:
    def __init__(self, db_path: str = "vic_events.db"):
        self.conn = sqlite3.connect(db_path, check_same_thread=False)
        self.conn.execute("""
            CREATE TABLE IF NOT EXISTS events (
                id INTEGER PRIMARY KEY,
                timestamp REAL NOT NULL,
                agent_id TEXT,
                event_type TEXT NOT NULL,
                data JSON NOT NULL
            )
        """)
        self.conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_events_time ON events(timestamp)"
        )
        self.conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_events_agent ON events(agent_id, timestamp)"
        )
        self.conn.commit()

    def write(self, event: dict):
        try:
            self.conn.execute(
                "INSERT INTO events (timestamp, agent_id, event_type, data) VALUES (?, ?, ?, ?)",
                (time.time(), event.get("agent_id"), event.get("type"), json.dumps(event)),
            )
            self.conn.commit()
        except Exception:
            pass

    def query(
        self, from_ts: float, to_ts: float, agent_id: Optional[str] = None
    ) -> list[dict]:
        if agent_id:
            rows = self.conn.execute(
                "SELECT data FROM events WHERE timestamp BETWEEN ? AND ? AND agent_id = ? ORDER BY timestamp",
                (from_ts, to_ts, agent_id),
            ).fetchall()
        else:
            rows = self.conn.execute(
                "SELECT data FROM events WHERE timestamp BETWEEN ? AND ? ORDER BY timestamp",
                (from_ts, to_ts),
            ).fetchall()
        return [json.loads(r[0]) for r in rows]
