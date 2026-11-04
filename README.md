# Anchor — Memory Layer for Human Commitments

MVP focus: **Students** (exam prep, deadlines, leadership, work-study balance).

Pipeline (never LLM-direct):

```
Input → Extraction → Validation → Storage → Business Logic → Scheduling → Simulation → Explanation → User
```

## Quick start (Docker-first)

```powershell
copy .env.example .env
docker compose up --build
```

API: `http://localhost:8000`, health: `/api/health`, docs: `/docs`. Web: `http://localhost:3000`.

## Structure

- `docs/IMPLEMENTATION_PLAN.md` — phased plan
- `docs/RBAC_AND_API.md` — RBAC schema + endpoints
- `backend/` — FastAPI MVP (auth, RBAC, commitments, simulations)
- `frontend/` — Next.js placeholder (dashboard, memory feed, forecast)
- `docker-compose.yml` — postgres+pgvector, redis, rabbitmq, api

## MVP flows

1. POST `/api/v1/messages` → extract commitment → store → schedule follow-up
2. POST `/api/v1/commitments/{id}/complete` with `DONE`
3. POST `/api/v1/simulations/what-if` → readiness forecast
4. GET `/api/v1/reviews/weekly` → completion rate, trends
