from fastapi.testclient import TestClient

from app.main import app


def test_health():
    c = TestClient(app)
    r = c.get("/api/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_message_to_done_flow():
    c = TestClient(app)
    reg = c.post("/api/v1/auth/register", json={"email": "a@x.com", "password": "pw123456"})
    assert reg.status_code == 200, reg.text
    token = reg.json()["access_token"]
    h = {"Authorization": f"Bearer {token}"}
    m = c.post("/api/v1/messages", json={"text": "I'll send Brian the database notes tonight."}, headers=h)
    assert m.status_code == 200
    coms = m.json()["commitments"]
    assert len(coms) == 1
    cid = coms[0]["id"]
    d = c.post(f"/api/v1/commitments/{cid}/complete", json={"text": "DONE"}, headers=h)
    assert d.status_code == 200
    assert d.json()["status"] == "done"
