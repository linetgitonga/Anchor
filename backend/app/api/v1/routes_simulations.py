from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.core.rbac import require_permission
from app.services.simulation import what_if_skip_study

router = APIRouter(prefix="/v1/simulations", tags=["simulations"])


class WhatIf(BaseModel):
    scenario: str = "skip tomorrow's study session"
    current_readiness: float = 80.0
    coverage: float = 78.0


@router.post("/what-if")
def what_if(body: WhatIf, _sub: dict = Depends(require_permission("simulations:run"))):
    result = what_if_skip_study(body.current_readiness, body.coverage)
    return {"scenario": body.scenario, **result}
