# Anchor RBAC + API

## Roles

| Role | Key | Scope |
|---|---|---|
| Super Admin | `super_admin` | platform, infra, metrics, AI config, flags |
| Operations Admin | `ops_admin` | users, support, subscriptions (no private memories) |
| Trust & Safety Admin | `safety_admin` | reports, abuse, security events |
| Standard User | `user` | own commitments, simulations, settings |
| Premium User | `premium` | user + forecasting, long retention, priority |
| Team Owner | `team_owner` | workspace CRUD, invites |
| Team Admin | `team_admin` | team commitments, analytics |
| Team Member | `team_member` | assigned commitments, complete |

Role hierarchy: `premium` extends `user`. Team roles are workspace-scoped via `team_memberships`.

## Permissions

- `users:read|write`, `subs:read|write`, `flags:write`, `metrics:read`
- `memories:read:own`, `memories:write:own`, `memories:delete:own`
- `commitments:read:own|team`, `commitments:write:own|team`
- `simulations:run`, `simulations:advanced`
- `teams:manage`, `teams:invite`, `reports:read`
- `abuse:review`, `audit:read`

Ops Admin explicitly lacks `memories:read:*` on others. Enforced in middleware, not just UI.

## Schema (Postgres)

```sql
create table users (
  id uuid primary key default gen_random_uuid(),
  email citext unique not null,
  password_hash text not null,
  role text not null default 'user'
    check (role in ('super_admin','ops_admin','safety_admin','user','premium')),
  mfa_secret text null,
  created_at timestamptz default now()
);

create table teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_id uuid references users(id),
  created_at timestamptz default now()
);

create table team_memberships (
  team_id uuid references teams(id) on delete cascade,
  user_id uuid references users(id) on delete cascade,
  team_role text not null check (team_role in ('team_owner','team_admin','team_member')),
  primary key (team_id, user_id)
);

create table commitments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  team_id uuid references teams(id),
  source_message_id uuid,
  action text not null,
  person text null,
  deadline timestamptz null,
  status text not null default 'open' check (status in ('open','done','missed','snoozed')),
  confidence real null,
  created_at timestamptz default now()
);

create table audit_logs (
  id bigserial primary key,
  actor_id uuid references users(id),
  action text not null,
  entity text not null,
  entity_id text not null,
  meta jsonb default '{}',
  created_at timestamptz default now()
);
-- messages, voice_notes, goals, relationships, simulations,
-- notifications, weekly_reviews, subscriptions, feature_flags: see backend models
```

## API endpoints (v1, JWT unless noted)

Auth:

- `POST /api/v1/auth/register` (public)
- `POST /api/v1/auth/login` (public) → access + refresh
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/password-reset/request` (public), `/confirm` (public)

Messages / voice (ingest → extract):

- `POST /api/v1/messages` `{text, team_id?}` → `{message, commitments[]}`
- `POST /api/v1/voice-notes` (multipart) → `{voice_note, commitments[]}`

Commitments:

- `GET /api/v1/commitments?status=&due_before=`
- `GET /api/v1/commitments/{id}`
- `PATCH /api/v1/commitments/{id}` `{status|deadline|action}`
- `POST /api/v1/commitments/{id}/complete` `{text:"DONE"}`

Simulations / reviews:

- `POST /api/v1/simulations/what-if` `{scenario}` → `{readiness, coverage, recommendation}`
- `GET /api/v1/reviews/weekly` → `{completion_rate, captured, missed, trends}`

Admin (scoped):

- `GET /api/v1/admin/metrics` (`metrics:read`)
- `GET /api/v1/admin/queue` (`metrics:read`)

Health (public):

- `GET /api/health`, `/api/readiness`, `/api/liveness`

Errors: `{detail, code, correlation_id}`. Auth: `Bearer <jwt>`.
