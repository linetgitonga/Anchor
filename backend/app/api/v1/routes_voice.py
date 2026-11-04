"""Voice notes → same extraction pipeline (Phase 5). STT hook stub."""
from fastapi import APIRouter, UploadFile
from app.services.extraction import extract_baseline, validate
from app.db.models import Commitment, store

router = APIRouter(prefix="/v1/voice-notes", tags=["voice"])

def transcribe_stub(_bytes: bytes) -> str:
    return "I'll send Brian the database notes tonight."

@router.post("")
async def create_voice(file: UploadFile):
    raw = await file.read()
    text = transcribe_stub(raw)
    e = extract_baseline(text)
    if not e or not validate(e):
        return {"stored": False, "text": text}
    c = store.add_commitment(Commitment(action=e.action, person=e.person, deadline_text=e.deadline, confidence=e.confidence))
    return {"stored": True, "id": c.id, "text": text}
