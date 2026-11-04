"""Messages -> extraction -> storage -> commitments."""
from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel

from app.core.rbac import get_current_subject, require_permission
from app.db.models import Commitment, Memory, store
from app.services.extraction import extract_with_llm, validate

router = APIRouter(prefix="/v1", tags=["commitments"])


class MessageIn(BaseModel):
    text: str
    team_id: str | None = None


class CompleteIn(BaseModel):
    text: str = "DONE"


@router.post("/messages")
def ingest(msg: MessageIn, sub: dict = Depends(require_permission("commitments:write:own"))):
    record = {"user_id": sub["user_id"], "text": msg.text}
    store.messages.append(record)
    ext = extract_with_llm(msg.text)
    out = []
    if ext and validate(ext):
        c = store.add_commitment(Commitment(
            action=ext.action, person=ext.person, deadline_text=ext.deadline,
            confidence=ext.confidence, user_id=sub["user_id"], team_id=msg.team_id,
        ))
        store.add_memory(Memory(
            text=msg.text, user_id=sub["user_id"], source="text",
            action=ext.action, person=ext.person, deadline_text=ext.deadline,
            confidence=ext.confidence,
        ))
        store.log_event(c.id, "created", {"source": "messages"})
        out.append(c.__dict__)
    return {"message": msg.text, "commitments": out}


@router.get("/commitments")
def list_commitments(
    sub: dict = Depends(require_permission("commitments:read:own")),
    view: str = Query(default="active", description="inbox|active|completed|overdue|recurring|archived"),
):
    items = store.list_view(sub["user_id"], view) if view != "all" else [
        c for c in store.commitments.values() if c.user_id == sub["user_id"]
    ]
    return [c.__dict__ for c in items]


@router.get("/commitments/{cid}")
def get_one(cid: str, sub: dict = Depends(require_permission("commitments:read:own"))):
    c = store.commitments.get(cid)
    if not c or c.user_id != sub["user_id"]:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="not found")
    source = next(
        (m.__dict__ for m in store.memories.values()
         if m.user_id == sub["user_id"] and m.action == c.action),
        None,
    )
    return {
        "commitment": c.__dict__,
        "source_message": source,
        "extracted": {"action": c.action, "person": c.person,
                      "deadline": c.deadline_text, "confidence": c.confidence},
        "timeline": store.timeline(cid),
        "explanation": f"'{c.action}' captured with confidence {c.confidence}.",
        # backward-compat top-level fields
        **c.__dict__,
    }


@router.post("/commitments/{cid}/complete")
def complete(cid: str, body: CompleteIn,
             sub: dict = Depends(require_permission("commitments:write:own"))):
    c = store.commitments.get(cid)
    if not c or c.user_id != sub["user_id"]:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="not found")
    if body.text.strip().upper() != "DONE":
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="send DONE to complete")
    store.complete(cid)
    return {"id": cid, "status": "done"}


@router.post("/commitments/{cid}/defer")
def defer(cid: str, body: dict,
          sub: dict = Depends(require_permission("commitments:write:own"))):
    c = store.commitments.get(cid)
    if not c or c.user_id != sub["user_id"]:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="not found")
    c.status = "deferred"
    c.deferred_until = str(body.get("until", "tomorrow"))
    store.log_event(cid, "deferred", {"until": c.deferred_until})
    return {"id": cid, "status": c.status, "until": c.deferred_until}


@router.get("/reviews/weekly")
def weekly(sub: dict = Depends(get_current_subject)):
    mine = [c for c in store.commitments.values() if c.user_id == sub["user_id"]]
    total = len(mine)
    done = sum(1 for c in mine if c.status == "done")
    rate = round(100.0 * done / total, 1) if total else 0.0
    return {"completion_rate": rate, "captured": total,
            "missed": sum(1 for c in mine if c.status == "missed")}



