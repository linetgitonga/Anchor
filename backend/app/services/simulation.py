"""Deterministic simulation engine (no LLM math)."""
from __future__ import annotations


def readiness_score(completed: int, total: int, study_hours: float) -> float:
    if total <= 0:
        return 50.0
    base = 100.0 * completed / total
    bonus = min(study_hours * 2.0, 20.0)
    return round(max(0.0, min(100.0, base * 0.7 + 30 + bonus - 30)), 1)


def what_if_skip_study(current_readiness: float, coverage: float) -> dict:
    readiness = round(max(0.0, current_readiness - 3.0), 1)
    cov = round(max(0.0, coverage - 4.0), 1)
    return {
        "readiness": readiness,
        "coverage": cov,
        "delta_readiness": -3.0,
        "recommendation": "Study for 30 minutes tonight.",
    }


def forecast_risk(open_ct: int, overdue_ct: int, completion_rate: float) -> dict:
    """Deterministic delay-risk forecast (no LLM math)."""
    score = max(0.0, min(100.0, overdue_ct * 25.0 + max(0, open_ct - 3) * 8.0 + (100.0 - completion_rate) * 0.3))
    p_delay = round(score / 100.0, 2)
    level = "low" if score < 30 else ("medium" if score < 65 else "high")
    return {"level": level, "p_delay": p_delay, "score": round(score, 1)}


def compare_paths(base: dict, var_delta: dict) -> dict:
    """Compare base forecast vs a variant delta (deterministic)."""
    out_base = dict(base)
    alt = {k: round(v + var_delta.get(k, 0), 1) if isinstance(v, (int, float)) else v for k, v in base.items()}
    delta = {k: round(alt.get(k, 0) - v, 1) if isinstance(v, (int, float)) else 0 for k, v in base.items()}
    return {"base": out_base, "alt": alt, "delta": delta}
