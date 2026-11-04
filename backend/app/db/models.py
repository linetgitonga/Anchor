"""Commitment store: SQLAlchemy Postgres models + in-memory MVP fallback.

Phase 2: Postgres via DATABASE_URL; falls back to MemoryStore when unavailable.
Tables: see docs/RBAC_AND_API.md (14 tables).
"""
from __future__ import annotations

import uuid
from dataclasses import dataclass, field
from datetime import datetime, timezone

TABLES = [
    "users", "messages", "voice_notes", "commitments", "goals",
    "relationships", "simulations", "notifications", "weekly_reviews",
    "audit_logs", "teams", "groups", "subscriptions", "feature_flags",
]


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


@dataclass
class Commitment:
    action: str
    person: str | None = None
    deadline_text: str | None = None
    status: str = "open"
    confidence: float = 0.0
    user_id: str = "mvp-user"
    team_id: str | None = None
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = field(default_factory=utcnow)
    deferred_until: str | None = None
    is_recurring: bool = False


@dataclass
class Memory:
    text: str
    user_id: str = "mvp-user"
    source: str = "text"  # text|voice|group
    action: str | None = None
    person: str | None = None
    deadline_text: str | None = None
    category: str = "academics"  # academics|work|health|family|financial|leadership
    confidence: float = 0.0
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = field(default_factory=utcnow)


@dataclass
class Workspace:
    name: str
    owner_id: str = "mvp-user"
    members: list[dict] = field(default_factory=list)
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = field(default_factory=utcnow)


@dataclass
class Simulation:
    scenario: str
    user_id: str = "mvp-user"
    base: dict = field(default_factory=dict)
    alt: dict = field(default_factory=dict)
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = field(default_factory=utcnow)


class MemoryStore:
    """In-memory store behind the MemoryService interface."""

    def __init__(self) -> None:
        self.commitments: dict[str, Commitment] = {}
        self.messages: list[dict] = []
        self.audit: list[dict] = []
        self.memories: dict[str, Memory] = {}
        self.events: list[dict] = []
        self.workspaces: dict[str, Workspace] = {}
        self.simulations: dict[str, Simulation] = {}
        self.goals: list[dict] = []
        self.prefs: dict[str, dict] = {}

    def add_commitment(self, c: Commitment) -> Commitment:
        self.commitments[c.id] = c
        self.audit.append({"action": "commitment.create", "entity_id": c.id, "at": utcnow().isoformat()})
        return c

    def complete(self, cid: str) -> Commitment | None:
        c = self.commitments.get(cid)
        if c:
            c.status = "done"
            self.audit.append({"action": "commitment.complete", "entity_id": cid, "at": utcnow().isoformat()})
        return c

    def add_memory(self, m: Memory) -> Memory:
        self.memories[m.id] = m
        return m

    def log_event(self, cid: str, kind: str, meta: dict | None = None) -> dict:
        evt = {"commitment_id": cid, "kind": kind, "meta": meta or {}, "at": utcnow().isoformat()}
        self.events.append(evt)
        self.audit.append({"action": f"commitment.{kind}", "entity_id": cid, "at": evt["at"]})
        return evt

    def timeline(self, cid: str) -> list[dict]:
        return [e for e in self.events if e["commitment_id"] == cid]

    def list_view(self, user_id: str, view: str) -> list[Commitment]:
        mine = [c for c in self.commitments.values() if c.user_id == user_id]
        if view == "completed":
            return [c for c in mine if c.status == "done"]
        if view == "overdue":
            return [c for c in mine if c.status == "overdue"]
        if view == "recurring":
            return [c for c in mine if c.is_recurring and c.status != "archived"]
        if view == "archived":
            return [c for c in mine if c.status == "archived"]
        if view == "inbox":
            return [c for c in mine if c.status == "open"]
        # active: open + overdue + deferred, excluding done/archived
        return [c for c in mine if c.status in ("open", "overdue", "deferred")]

    def search_memories(self, user_id: str, q: str = "", category: str | None = None) -> list[Memory]:
        ql = (q or "").lower()
        out = []
        for m in self.memories.values():
            if m.user_id != user_id:
                continue
            if category and m.category != category:
                continue
            if ql and ql not in (m.text or "").lower() and ql not in (m.action or "").lower():
                continue
            out.append(m)
        return sorted(out, key=lambda m: m.created_at, reverse=True)

    def dashboard_summary(self, user_id: str) -> dict:
        mine = [c for c in self.commitments.values() if c.user_id == user_id]
        total = len(mine)
        done = sum(1 for c in mine if c.status == "done")
        overdue = sum(1 for c in mine if c.status == "overdue")
        open_ct = sum(1 for c in mine if c.status in ("open", "overdue", "deferred"))
        rate = round(100.0 * done / total, 1) if total else 0.0
        return {
            "total": total, "completed": done, "overdue": overdue,
            "open": open_ct, "completion_rate": rate,
            "memories": sum(1 for m in self.memories.values() if m.user_id == user_id),
        }


store = MemoryStore()
