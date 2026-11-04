from fastapi import APIRouter

router = APIRouter()


@router.get("/health")
def health():
    return {"status": "ok", "service": "anchor-api"}


@router.get("/readiness")
def readiness():
    return {"ready": True}


@router.get("/liveness")
def liveness():
    return {"alive": True}
