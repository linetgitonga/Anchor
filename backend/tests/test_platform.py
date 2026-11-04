import uuid

from fastapi.testclient import TestClient

from app.main import app


def _client_and_headers():
    c = TestClient(app)
    email = f"p-{uuid.uuid4().hex[:8]}@x.com"
    reg = c.post("/api/v1/auth/register", json={"email": email, "password": "pw123456"})
    assert reg.status_code == 200, reg.text
    token = reg.json()["access_token"]
    return c, {"Authorization": f"Bearer {token}"}


def test_views_search_forecast_flow():
    c, h = _client_and_headers()
    m = c.post("/api/v1/messages",
               json={"text": "I'll send Brian the database notes tonight."}, headers=h)
    assert m.status_code == 200
    assert len(m.json()["commitments"]) == 1
    cid = m.json()["commitments"][0]["id"]

    inbox = c.get("/api/v1/commitments?view=inbox", headers=h)
    assert inbox.status_code == 200
    assert any(x["id"] == cid for x in inbox.json())

    detail = c.get(f"/api/v1/commitments/{cid}", headers=h)
    assert detail.status_code == 200
    body = detail.json()
    assert body["commitment"]["id"] == cid
    assert body["timeline"] and body["timeline"][0]["kind"] == "created"
    assert "explanation" in body

    mems = c.get("/api/v1/memories?q=brian", headers=h)
    assert mems.status_code == 200
    assert len(mems.json()) >= 1

    risks = c.get("/api/v1/dashboard/risks", headers=h)
    assert risks.status_code == 200
    assert risks.json()["level"] in ("low", "medium", "high")
    assert "p_delay" in risks.json()

    dash = c.get("/api/v1/dashboard/summary", headers=h)
    assert dash.status_code == 200
    assert dash.json()["total"] >= 1

    d = c.post(f"/api/v1/commitments/{cid}/defer", json={"until": "tomorrow"}, headers=h)
    assert d.status_code == 200
    assert d.json()["status"] == "deferred"


def test_simulations_compare_and_workspaces():
    c, h = _client_and_headers()
    r = c.post("/api/v1/simulations/compare",
               json={"base": {"readiness": 80.0}, "var_delta": {"readiness": -3.0},
                     "scenario": "skip study"}, headers=h)
    assert r.status_code == 200
    assert r.json()["alt"]["readiness"] == 77.0

    w = c.post("/api/v1/workspaces", json={"name": "Study group"}, headers=h)
    assert w.status_code == 200
    wid = w.json()["id"]
    g = c.get(f"/api/v1/workspaces/{wid}", headers=h)
    assert g.status_code == 200

    wk = c.get("/api/v1/insights/weekly", headers=h)
    assert wk.status_code == 200
    assert "completion_rate" in wk.json()

    # student role cannot hit admin metrics
    adm = c.get("/api/v1/admin/metrics", headers=h)
    assert adm.status_code == 403
