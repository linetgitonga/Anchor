# AGENTS.md — Anchor agent rules

- Pipeline only: Input → Extraction → Validation → Storage → Business Logic → Scheduling → Simulation → Explanation → User. Never LLM → answer.
- MVP user: students. Other roles via RBAC + feature flags only.
- UI: calm Linear/Notion/Stripe, Deep Navy #14213D + Teal #14B8A6, Off-white #FAFAF7, icons only, no emojis, WCAG AA.
- Docker-first: `docker compose up --build` must run api + postgres + redis + web.
- No secrets in repo. Use env vars. Never commit `.env`.
- Tests required: backend `pytest`, frontend `build`, Playwright smoke for AI pipeline.
- Every state change: validation + audit log.
