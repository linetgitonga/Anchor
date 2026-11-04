"""RBAC: roles, permissions, FastAPI dependencies."""
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.security import decode_token

ROLE_PERMISSIONS: dict[str, set[str]] = {
    "super_admin": {"*"},
    "ops_admin": {"users:read", "users:write", "subs:read", "subs:write", "metrics:read", "audit:read"},
    "safety_admin": {"abuse:review", "audit:read", "metrics:read"},
    "user": {"memories:read:own", "memories:write:own", "memories:delete:own",
             "commitments:read:own", "commitments:write:own", "simulations:run"},
    "premium": {"memories:read:own", "memories:write:own", "memories:delete:own",
                "commitments:read:own", "commitments:write:own",
                "simulations:run", "simulations:advanced"},
}

TEAM_PERMISSIONS: dict[str, set[str]] = {
    "team_owner": {"teams:manage", "teams:invite", "reports:read",
                   "commitments:read:team", "commitments:write:team"},
    "team_admin": {"reports:read", "commitments:read:team", "commitments:write:team"},
    "team_member": {"commitments:read:team"},
}

_bearer = HTTPBearer(auto_error=False)


def get_current_subject(creds: HTTPAuthorizationCredentials | None = Depends(_bearer)) -> dict:
    if creds is None:
        raise HTTPException(status_code=401, detail="missing bearer token")
    try:
        payload = decode_token(creds.credentials)
    except Exception:
        raise HTTPException(status_code=401, detail="invalid token")
    if payload.get("kind") != "access":
        raise HTTPException(status_code=401, detail="wrong token kind")
    return {"user_id": payload["sub"], "role": payload.get("role", "user")}


def require_permission(perm: str):
    def dep(sub: dict = Depends(get_current_subject)) -> dict:
        perms = ROLE_PERMISSIONS.get(sub["role"], set())
        if "*" in perms or perm in perms:
            return sub
        raise HTTPException(status_code=403, detail=f"missing permission: {perm}")
    return dep


def has_perm(role: str, perm: str) -> bool:
    perms = ROLE_PERMISSIONS.get(role, set())
    return "*" in perms or perm in perms
