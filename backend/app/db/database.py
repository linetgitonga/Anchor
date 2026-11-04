"""DB session helper: Postgres when DATABASE_URL set, else None (fallback to MemoryStore)."""
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.db.schema import Base

URL = os.getenv("DATABASE_URL", "")
engine = None
SessionLocal = None
if URL:
    engine = create_engine(URL, pool_pre_ping=True)
    SessionLocal = sessionmaker(bind=engine)
    try:
        Base.metadata.create_all(engine)
    except Exception:
        pass
