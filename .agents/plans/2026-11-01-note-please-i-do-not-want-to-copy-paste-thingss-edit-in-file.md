## Anchor — Full 10-Phase Production Plan (ready to implement in-files)

> `write_file` + `edit_file` are now both **refused by permission mode** (workspace still in Restricted Mode). I cannot create/edit files until you click **Trust Workspace** / approve file changes. The moment you do, I'll implement all below directly in-files — no copy-paste.

No guessing — based on `docker-compose.yml:1`, `backend/app/main.py:1`, `backend/app/services/extraction.py:1`, `frontend/app/page.tsx:1`, `docs/RBAC_AND_API.md:1`.

### Phase 1 — Foundations + Guardrails
**Deliverables in-files:**
- `.gitignore` hardened (done earlier), `.env.example` (no secrets), `AGENTS.md` (pipeline-only, calm UI Deep Navy `#14213D`+Teal, tests-required)
- `docker-compose.yml` → `env_file:[.env]`, healthchecks for postgres/redis/api, add `web: build ./frontend → 3000:3000`, named volumes
- `backend/Dockerfile` → non-root, `HEALTHCHECK CMD curl -f /api/health`
- `frontend/Dockerfile` + `playwright.config.ts` + `e2e/smoke.spec.ts` + `.github/workflows/ci.yml`
**Done when:** `docker compose up --build` green, `/api/health 200`, `pytest` 3/3 pass

### Phase 2 — Contracts + Persistence
Replace `backend/app/db/models.py:35 MemoryStore` (in-memory) with SQLAlchemy 2.0 for all 14 tables (`users,messages,voice_notes,commitments,goals,relationships,simulations,notifications,weekly_reviews,audit_logs,teams,groups,subscriptions,feature_flags`), Alembic + pgvector, `deadline timestamptz`, `status open|done|missed|snoozed`, audit row per transition.
**Playwright check:** create via API → reload → still visible

### Phase 3 — Auth + RBAC Hardening
Fix `backend/app/core/security.py:14 SHA256` → PBKDF2/bcrypt, `routes_auth.py:37 refresh 501` → rotation, add reset/device/MFA-ready. Enforce `team_owner/admin/member` for `team_id` (currently stored unchecked in `routes_commitments.py`), gate `simulations:advanced` to premium, add CSP/CSRF/SameSite, rate-limit login.

### Phase 4 — Commitment Engine
Harden `extract_baseline` in `backend/app/services/extraction.py:28` — normalize, dedupe hash, `confidence>=0.5` gate, tz-aware `tonight/tomorrow/Friday/next week`, XSS-safe output. Keep `extract_with_llm` interface for Llama swap.
**Golden set:** ~30 utterances incl. `I'll send Brian the database notes tonight.` → `{person:Brian, deadline:tonight}`

### Phase 5 — Voice + Follow-up
Add `POST /voice-notes` (multipart → local/S3 stub → Whisper hook → same pipeline), Celery/RabbitMQ reminders with sync fallback, idempotency keys, WhatsApp stub + retry/backoff.

### Phase 6 — Simulation + Review (deterministic)
Keep `simulation.py:13 what_if_skip_study -3%/-4%`, wire `readiness_score` to API, expand `GET /reviews/weekly` to trends + forecast. No LLM math.

### Phase 7 — World-Class UI
Rebuild `frontend/app/page.tsx:1` (now placeholder list) → Dashboard / Memory Feed / Detail (source+extraction+history) / Forecast Center / Weekly Review / Admin, responsive, keyboard + screen-reader + high-contrast, `data-testid` hooks, no emojis.

### Phase 8 — Security + Compliance
Parameterized ORM, SSRF allowlist, prompt-injection guardrails, TLS 1.3, AES-256, Vault, GDPR export/delete.

### Phase 9 — Observability + SRE
JSON logs + `x-correlation-id` (already in `main.py:12`), Prometheus p50/p95/p99, Sentry, Slack/PagerDuty, runbooks for DB/Redis/LLM/WhatsApp outage, blue-green/canary/rollback.

### Phase 10 — Release + Cost
Flags, Redis cache + invalidation, batch embeddings, dedupe sims, LLM cost tracking, k6 load, rollback drill. SLOs: API p95 <400ms, extraction p95 <4s, notify >98%, 1% error budget.

**Playwright as AI validator (all phases):** `GET /health` → `POST /messages` → assert extracted `action/person/deadline` rendered → `POST /complete DONE` → assert `done` → Forecast Center shows `readiness/coverage/recommendation` + screenshots.

---

To unblock in-file implementation:
1. Click **Trust this workspace** in VS Code (Restricted Mode banner)
2. Reply **“proceed”**

I’ll then scaffold Phases 1-10 in order: env → compose → Dockerfiles → backend deps → DB → auth → engine → UI → e2e → CI, reporting errors/warnings after each round and fixing what I broke.
