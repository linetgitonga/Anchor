"""JWT + password helpers (MVP).

Production: use bcrypt/argon2 via passlib and Secrets Manager/Vault.
"""
import hashlib
import hmac
import os
from datetime import datetime, timedelta, timezone

import jwt

from app.core.config import settings

_ITER = 210_000


def hash_password(password: str) -> str:
    salt = os.urandom(16)
    dk = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, _ITER)
    return f"pbkdf2${_ITER}${salt.hex()}${dk.hex()}"


def verify_password(password: str, hashed: str) -> bool:
    try:
        _, it, salt_h, dk_h = hashed.split("$", 3)
        dk = hashlib.pbkdf2_hmac("sha256", password.encode(), bytes.fromhex(salt_h), int(it))
        return hmac.compare_digest(dk.hex(), dk_h)
    except Exception:
        return False


def _encode(sub: str, role: str, delta: timedelta, kind: str) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": sub,
        "role": role,
        "kind": kind,
        "iat": int(now.timestamp()),
        "exp": int((now + delta).timestamp()),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def create_tokens(user_id: str, role: str) -> dict:
    return {
        "access_token": _encode(user_id, role, timedelta(minutes=settings.access_minutes), "access"),
        "refresh_token": _encode(user_id, role, timedelta(days=settings.refresh_days), "refresh"),
    }


def decode_token(token: str) -> dict:
    return jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
