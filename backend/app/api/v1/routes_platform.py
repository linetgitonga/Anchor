"""Platform surface: dashboard, memory, forecast, insights, workspaces, onboarding, settings, admin."""
from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel

from app.core.rbac import get_current_subject, require_permission
from app.db.models import Simulation, Workspace, store
from app.services.simulation import compare_paths, forecast_risk

router = APIRouter(prefix="/v1", tags=["platform"])

READ_OWN = require_permission("commitments:read:own")
WRITE_OWN = require_permission("commitments:write:own")


@router.get("/dashboard")
def dashboard(sub: dict = Depends(READ_OWN)):
    summary = store.dashboard_summary(sub["user_id"])
    risks = forecast_risk(summary["open"], summary["overdue"], summary["completion_rate"])
    recent = [c.__dict__ for c in store.list_view(sub["user_id"], "active")[:5]]
    return {"summary": summary, "risks": risks, "recent": recent}


@router.get("/dashboard/summary")
def dashboard_summary(sub: dict = Depends(READ_OWN)):
    return store.dashboard_summary(sub["user_id"])


@router.get("/dashboard/risks")
def dashboard_risks(sub: dict = Depends(READ_OWN)):
    s = store.dashboard_summary(sub["user_id"])
    return forecast_risk(s["open"], s["overdue"], s["completion_rate"])


@router.get("/memories")
def list_memories(sub: dict = Depends(READ_OWN), q: str = Query(default=""), category: str | None = None):
    return [m.__dict__ for m in store.search_memories(sub["user_id"], q, category)]


class ForecastIn(BaseModel):
    open_ct: int = 0
    overdue_ct: int = 0
    completion_rate: float = 0.0


@router.post("/forecast/what-if")
def forecast_what_if(body: ForecastIn, sub: dict = Depends(READ_OWN)):
    return forecast_risk(body.open_ct, body.overdue_ct, body.completion_rate)


class CompareIn(BaseModel):
    base: dict = {}
    var_delta: dict = {}
    scenario: str = "compare paths"


@router.post("/simulations/compare")
def simulations_compare(body: CompareIn, sub: dict = Depends(require_permission("simulations:run"))):
    result = compare_paths(body.base, body.var_delta)
    sim = Simulation(scenario=body.scenario, user_id=sub["user_id"], base=body.base, alt=result["alt"])
    store.simulations[sim.id] = sim
    return {"id": sim.id, **result}


@router.get("/insights/weekly")
def insights_weekly(sub: dict = Depends(READ_OWN)):
    s = store.dashboard_summary(sub["user_id"])
    return {"completion_rate": s["completion_rate"], "captured": s["total"],
            "completed": s["completed"], "overdue": s["overdue"]}


@router.get("/insights/trends")
def insights_trends(sub: dict = Depends(READ_OWN)):
    mine = [c for c in store.commitments.values() if c.user_id == sub["user_id"]]
    by_status: dict[str, int] = {}
    for c in mine:
        by_status[c.status] = by_status.get(c.status, 0) + 1
    return {"by_status": by_status, "total": len(mine)}


@router.get("/workspaces")
def list_workspaces(sub: dict = Depends(READ_OWN)):
    return [w.__dict__ for w in store.workspaces.values() if w.owner_id == sub["user_id"]]


class WorkspaceIn(BaseModel):
    name: str


@router.post("/workspaces")
def create_workspace(body: WorkspaceIn, sub: dict = Depends(WRITE_OWN)):
    w = Workspace(name=body.name, owner_id=sub["user_id"])
    store.workspaces[w.id] = w
    return w.__dict__


@router.get("/workspaces/{wid}")
def get_workspace(wid: str, sub: dict = Depends(READ_OWN)):
    w = store.workspaces.get(wid)
    if not w or w.owner_id != sub["user_id"]:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="not found")
    return w.__dict__


@router.get("/onboarding/status")
def onboarding_status(sub: dict = Depends(get_current_subject)):
    prefs = store.prefs.get(sub["user_id"], {})
    return {"completed": bool(prefs.get("onboarded")), "prefs": prefs}


@router.post("/onboarding/complete")
def onboarding_complete(sub: dict = Depends(WRITE_OWN)):
    prefs = store.prefs.setdefault(sub["user_id"], {})
    prefs["onboarded"] = True
    return {"completed": True}


@router.get("/settings")
def get_settings(sub: dict = Depends(READ_OWN)):
    return store.prefs.get(sub["user_id"], {})


@router.put("/settings")
def put_settings(body: dict, sub: dict = Depends(WRITE_OWN)):
    store.prefs[sub["user_id"]] = body
    return store.prefs[sub["user_id"]]


@router.get("/goals")
def list_goals(sub: dict = Depends(READ_OWN)):
    return [g for g in store.goals if g.get("user_id") == sub["user_id"]]


@router.post("/goals")
def create_goal(body: dict, sub: dict = Depends(WRITE_OWN)):
    g = {"user_id": sub["user_id"], **body}
    store.goals.append(g)
    return g


@router.get("/admin/health")
def admin_health(sub: dict = Depends(require_permission("audit:read"))):
    return {"status": "ok", "commitments": len(store.commitments),
            "memories": len(store.memories), "user": sub["user_id"]}


@router.get("/admin/metrics")
def admin_metrics(sub: dict = Depends(require_permission("metrics:read"))):
    return {"commitments": len(store.commitments), "memories": len(store.memories),
            "events": len(store.events), "workspaces": len(store.workspaces)}
