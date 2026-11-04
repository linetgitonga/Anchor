# Anchor Implementation Plan — Implemented 2026-11-01 (Phases 1-10 in-files)

> Status: Phase 1-7 code landed in this workspace. Phase 8-10 gates in CI + runbooks. See `.agents/plans/` for full spec.

## 0. Principles

- LLM reasons, system decides. Every state change goes through validation + audit.
- MVP = students only. Other roles supported architecturally via RBAC + feature flags, not built out.
- Calm UI (Linear/Notion/Stripe). No emojis, icons only. Deep Navy + Teal.

## Phase 0 — Foundations (days 1–2)

- [x] Monorepo: `backend/`, `frontend/`, `docs/`, `infra/`
- [x] docker-compose: postgres:16+pgvector, redis:7, rabbitmq:3
- [x] FastAPI skeleton: health, readiness, liveness, structured JSON logs, correlation IDs
- [x] Auth: JWT access + refresh, device tracking stub, password reset stub, MFA-ready schema
- [x] RBAC middleware (see RBAC_AND_API.md)
- [x] Audit log on every commitment transition + LLM call

Exit: `uvicorn` boots, `/api/health` 200, tests pass.

## Phase 1 — Commitment engine (days 3–5, hackathon core)

- Messages API: text ingest, normalize, store
- Extraction service: regex/date-parser baseline + Llama hook behind interface
  - Output schema: `{type, action, person, deadline, confidence}`
  - Validation: confidence threshold, date resolution (`tonight`, `Friday`), dedupe
- Memory service: SQLAlchemy models + pgvector embeddings (defer embeddings if no key)
- Scheduling: due dates, follow-up reminders (Celery task or in-process fallback)
- Complete flow: `DONE` → status update + audit

Demo script: "I'll send Brian the database notes tonight." → stored → reminder → DONE.

## Phase 2 — Voice + follow-up (days 5–6)

- `POST /voice-notes`: store file ref (S3 stub → local), STT hook (Whisper/local), then Phase 1 pipeline
- Notification service interface: log + WhatsApp webhook stub, push/email later
- Retry + idempotency keys for webhooks

## Phase 3 — Simulation + weekly review (days 6–7)

- Simulation engine (deterministic, no LLM math):
  - Inputs: study sessions, deadlines, completion rate
  - Output: readiness %, coverage %, recommendation
  - Example: skip session → readiness -3%
- Weekly review: completion rate, captured/missed, trends, forecast
- Forecast Center API + minimal UI

## Phase 4 — Hardening (post-hackathon)

- Security: parameterized ORM, CSP headers, SameSite cookies + CSRF, SSRF allowlist, prompt-injection guardrails
- Encryption: TLS 1.3, AES-256 at rest (RDS), Secrets Manager/Vault
- GDPR: export/delete endpoints, consent flags
- Observability: Prometheus metrics (p50/p95/p99, extraction latency, notify success), Sentry, Slack/PagerDuty alerts
- SRE: playbooks for webhook/WhatsApp/Redis/queue/DB/LLM outages, blue-green + canary + rollback
- Cost: batch embeddings, cache summaries, dedupe simulations, track LLM/storage/notify spend

## SLIs/SLOs (MVP targets)

- API p95 < 400ms (non-LLM), extraction p95 < 4s
- Notification success > 98%, weekly review generation < 10s
- Error budget: 1% 5xx over 30d

## Risks

- Llama downtime → baseline parser still captures dated commitments
- WhatsApp outage → queue + retry, degrade to in-app feed
- Redis/queue down → synchronous fallback for MVP, alert
