## Outcome: plan ready, code edits still blocked

Edits (`edit_file` on `backend/app/db/models.py:1-5`) are refused by permission mode even after your approval. I can't write files from this session, so no code was changed. Below is the apply-ready platform plan to match your 10-surface vision — no storytelling.

### 0. What I verified (current)

- `backend/app/api/v1/routes_commitments.py:21-32`: `POST /messages` → regex extract → in-memory save only.
- `backend/app/db/models.py:36-54`: `MemoryStore` with `commitments/messages/audit` only.
- `backend/app/db/schema.py:9-26`: 2 tables only.
- `backend/app/services/simulation.py:5-16`: single `readiness_score` + `what_if_skip_study`.
- `docker-compose.yml:1-59`: `postgres+redis+rabbitmq+api+web` only.
- `frontend/app/page.tsx:1-96`: single page, no 10 routes.
- Tests green path: `backend/tests/test_api.py:13-26` message→DONE flow.

### 1. Delivery plan (4 increments, working after each)

**Increment 1 — Backend backbone (no breaking changes)**

- `backend/app/db/models.py`: extend `MemoryStore`, keep `add_commitment/complete` signatures. Add:
```python
@dataclass
class Memory: id: str; user_id: str; text: str; source: str  # text|voice|group
    action: str | None; person: str | None; deadline_text: str | None
    category: str  # academics|work|health|family|financial|leadership
    confidence: float; created_at: datetime
@dataclass
class Workspace: id: str; name: str; owner_id: str; members: list[dict]
@dataclass
class Simulation: id: str; user_id: str; scenario: str; base: dict; alt: dict
# store adds: memories, events, workspaces, simulations, goals, prefs
# methods: add_memory(), log_event(cid, kind, meta), list_view(user, view),
#          search_memories(user, q), dashboard_summary(user)
```
- `backend/app/db/schema.py`: add rows `MemoryRow, MemoryVectorRow, WorkspaceRow, SimulationRow, CommitmentEventRow, UserProfileRow` (pgvector via `Vector(1536)` guarded import).
- `backend/app/services/simulation.py`: add `forecast_risk(open_ct, overdue_ct, completion_rate) -> {level, p_delay}` and `compare_paths(base, var_delta)`.
- `backend/app/api/v1/routes_commitments.py`: on ingest also `add_memory + log_event(created)`. Add `GET /commitments?view=inbox|active|completed|overdue|recurring|archived`, `GET /commitments/{id}` returns `{commitment, source_message, extracted, timeline, explanation}`, `POST /commitments/{id}/defer`.
- New `backend/app/api/v1/routes_platform.py` (`/api/v1/...`): `dashboard, dashboard/summary, dashboard/risks, memories?q=&category=, simulations/what-if, insights/*, workspaces/*, onboarding/*, settings, admin/health, admin/metrics`. Wire in `backend/app/main.py:28-32`.
- Acceptance: existing `test_api.py` + `test_extraction.py` still pass; new `test_platform.py` covers views/search/forecast.

**Increment 2 — Frontend 10 surfaces**

Keep theme `NAVY #14213D / TEAL #14B8A6 / BG #FAFAF7` from `page.tsx:5-8`. Add App Router pages:
```
app/auth/page.tsx  app/onboarding/page.tsx  app/dashboard/page.tsx
app/memory/page.tsx  app/commitments/page.tsx  app/commitments/[id]/page.tsx
app/forecast/page.tsx  app/insights/page.tsx  app/workspaces/page.tsx
app/settings/page.tsx  app/admin/page.tsx (internal, RBAC-gated)
```
Each page: server-static shell + client fetch to the endpoint above, `data-testid` per surface. Update `app/page.tsx` nav to link all 10. No pie charts (line/bar/heatmap/radar only).

**Increment 3 — Docker full stack**

Extend `docker-compose.yml` (keep current 5 services working):
```yaml
celery_worker: build ./backend, command celery -A app.workers.celery_app worker
celery_beat: same build, command beat
minio: image minio/minio, ports 9000:9000
nginx: image nginx:alpine, ports 80:80, depends_on [web, api]
prometheus: image prom/prometheus, port 9090
grafana: image grafana/grafana, port 3001
pgadmin: image dpage/pgadmin4, port 5050
# verify: docker compose config && docker compose up -d --build
```

**Increment 4 — Verify working**

```powershell
docker compose config
python -m pytest backend/tests -q
npm --prefix frontend run build
npx playwright test e2e/smoke.spec.ts
```

### 2. What's next

Enable file-edit approval for this workspace in VS Code (Muse Spark extension → approval mode), then tell me `go`. I'll apply Increment 1 first, run `pytest`, and report real output before touching frontend/docker.
