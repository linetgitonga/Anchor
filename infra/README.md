# Infra (post-MVP)

- `k8s/` — deployments for api, worker, postgres, redis, nginx ingress
- `terraform/` — VPC, RDS Postgres + pgvector, ElastiCache, S3, Secrets Manager
- CI: GitHub Actions — lint, test, build, blue-green deploy, canary flags, auto-rollback
- Keep MVP on docker-compose; promote manifests here in Phase 4.
