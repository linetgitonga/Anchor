"""Anchor API entrypoint."""
import os
import uuid
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.v1 import routes_auth, routes_commitments, routes_health, routes_platform, routes_simulations, routes_voice

app = FastAPI(title="Anchor API", version="0.1.0")

# Browser calls come from the web container (default http://localhost:3000).
# Without this, cross-origin fetch fails and the UI reports "Backend unreachable".
_frontends = [o.strip() for o in os.getenv(
    "FRONTEND_URL", "http://localhost:3000,http://127.0.0.1:3000").split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_frontends,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "x-correlation-id"],
    expose_headers=["x-correlation-id"],
    max_age=600,
)


@app.middleware("http")
async def correlation_id(request: Request, call_next):
    cid = request.headers.get("x-correlation-id", str(uuid.uuid4()))
    resp = await call_next(request)
    resp.headers["x-correlation-id"] = cid
    resp.headers["X-Content-Type-Options"] = "nosniff"
    resp.headers["X-Frame-Options"] = "DENY"
    resp.headers["Content-Security-Policy"] = "default-src 'self'"
    resp.headers["Referrer-Policy"] = "no-referrer"
    return resp


@app.exception_handler(Exception)
async def err_handler(_: Request, exc: Exception):
    return JSONResponse(status_code=500, content={"detail": "internal error", "code": "E500"})


app.include_router(routes_health.router, prefix="/api")
app.include_router(routes_auth.router, prefix="/api")
app.include_router(routes_commitments.router, prefix="/api")
app.include_router(routes_platform.router, prefix="/api")
app.include_router(routes_simulations.router, prefix="/api")
app.include_router(routes_voice.router, prefix="/api")


@app.get("/api/metrics")
def metrics():
    return {"api_p95_target_ms": 400, "extraction_p95_target_s": 4, "notify_success_target": 0.98}


@app.get("/")
def root():
    return {"service": "anchor", "docs": "/docs"}
