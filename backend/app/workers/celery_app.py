"""Celery app stub (Phase 3 scheduling). Broker: redis. Tasks run eagerly when celery is absent."""
import os

try:
    from celery import Celery  # type: ignore
except Exception:  # pragma: no cover - backend runs without celery installed
    Celery = None  # type: ignore

BROKER = os.getenv("REDIS_URL", "redis://redis:6379/0")

if Celery is not None:
    # NOTE: the instance must also be named `app`: `celery -A <module>`
    # auto-discovers only `app`/`celery` attributes, otherwise it silently
    # falls back to a default app on amqp://guest@localhost:5672.
    app = Celery("anchor", broker=BROKER, backend=BROKER)
    app.conf.update(task_always_eager=False, timezone="UTC")
    celery_app = app

    @app.task(name="anchor.nightly_review")
    def nightly_review() -> dict:
        return {"status": "ok"}
else:  # fallback so imports never fail in api/tests
    class _Stub:
        def task(self, *a, **k):
            def wrap(fn):
                return fn
            return wrap
    app = _Stub()  # type: ignore
    celery_app = app

    def nightly_review() -> dict:  # type: ignore
        return {"status": "ok"}
