"""Commitment extraction pipeline.

Input -> Extraction -> Validation -> (caller stores).
Baseline uses patterns + deadline keywords. Llama plugs in behind
`extract_with_llm` without changing the pipeline.
"""
from __future__ import annotations

import re
from dataclasses import dataclass

DEADLINE_WORDS = ["tonight", "tomorrow", "today", "friday", "monday", "tuesday",
                  "wednesday", "thursday", "saturday", "sunday", "next week", "morning"]

_PERSON = re.compile(r"\b(?:to|for|with|call|send|meet)\s+([A-Z][a-z]+)", re.I)
_ACTION = re.compile(r"(?:i'?ll|i will|let'?s|need to|remind me to|we submit|submit)\s+(.+)", re.I)


@dataclass
class Extracted:
    type: str
    action: str
    person: str | None
    deadline: str | None
    confidence: float


def normalize(text: str) -> str:
    # NOTE: no html.escape here — escaping turns "I'll" into "I&#x27;ll"
    # which breaks the action-verb regex. Escape at render time instead.
    return " ".join(text.strip().split())[:500]


def dedupe_key(text: str) -> str:
    import hashlib
    return hashlib.sha256(normalize(text).lower().encode()).hexdigest()[:16]


def extract_baseline(text: str) -> Extracted | None:
    t = normalize(text)
    if len(t) < 4:
        return None
    m = _ACTION.search(t)
    if not m:
        return None
    action = m.group(1).strip().rstrip(".")[:200]
    if not action:
        return None
    pm = _PERSON.search(t)
    person = pm.group(1) if pm else None
    low = t.lower()
    deadline = next((w for w in DEADLINE_WORDS if w in low), None)
    conf = 0.5 + (0.2 if person else 0) + (0.2 if deadline else 0)
    return Extracted(type="commitment", action=action, person=person,
                     deadline=deadline, confidence=min(conf, 0.95))


def extract_with_llm(text: str) -> Extracted | None:
    """Hook for Meta Llama. MVP falls back to baseline."""
    return extract_baseline(text)


def validate(e: Extracted) -> bool:
    return bool(e.action) and e.confidence >= 0.5
