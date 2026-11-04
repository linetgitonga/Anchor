"""Auth routes (MVP in-memory users)."""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.core.security import create_tokens, hash_password, verify_password

router = APIRouter(prefix="/v1/auth", tags=["auth"])
_users: dict[str, dict] = {}


class Register(BaseModel):
    email: str
    password: str


class Login(BaseModel):
    email: str
    password: str


@router.post("/register")
def register(body: Register):
    if body.email in _users:
        raise HTTPException(status_code=409, detail="email taken")
    _users[body.email] = {"password": hash_password(body.password), "role": "user"}
    return create_tokens(body.email, "user")


@router.post("/login")
def login(body: Login):
    u = _users.get(body.email)
    if not u or not verify_password(body.password, u["password"]):
        raise HTTPException(status_code=401, detail="bad credentials")
    return create_tokens(body.email, u["role"])


@router.post("/refresh")
def refresh(body: dict):
    from app.core.security import decode_token, create_tokens
    token = body.get("refresh_token", "")
    try:
        data = decode_token(token)
        if data.get("kind") != "refresh":
            raise ValueError("not refresh")
        return create_tokens(data["sub"], data.get("role", "user"))
    except Exception:
        raise HTTPException(status_code=401, detail="invalid refresh")
