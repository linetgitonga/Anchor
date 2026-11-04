"""SQLAlchemy Postgres models for Anchor (Phase 2)."""
from sqlalchemy import String, Text, Float, DateTime, ForeignKey, JSON, Boolean
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
import datetime

try:  # pgvector optional; guarded so unit tests run without it
    from pgvector.sqlalchemy import Vector  # type: ignore
except Exception:  # pragma: no cover
    Vector = None  # type: ignore

class Base(DeclarativeBase):
    pass

class CommitmentRow(Base):
    __tablename__ = "commitments"
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    user_id: Mapped[str] = mapped_column(String(64), default="mvp-user")
    team_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    action: Mapped[str] = mapped_column(Text)
    person: Mapped[str | None] = mapped_column(String(128), nullable=True)
    deadline_text: Mapped[str | None] = mapped_column(String(64), nullable=True)
    deadline: Mapped[datetime.datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    status: Mapped[str] = mapped_column(String(16), default="open")
    confidence: Mapped[float] = mapped_column(Float, default=0.0)

class AuditRow(Base):
    __tablename__ = "audit_logs"
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    action: Mapped[str] = mapped_column(String(64))
    entity_id: Mapped[str] = mapped_column(String(64))
    at: Mapped[datetime.datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.datetime.now(datetime.timezone.utc))


class MemoryRow(Base):
    __tablename__ = "memories"
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    user_id: Mapped[str] = mapped_column(String(64), default="mvp-user")
    text: Mapped[str] = mapped_column(Text)
    source: Mapped[str] = mapped_column(String(16), default="text")
    action: Mapped[str | None] = mapped_column(Text, nullable=True)
    person: Mapped[str | None] = mapped_column(String(128), nullable=True)
    deadline_text: Mapped[str | None] = mapped_column(String(64), nullable=True)
    category: Mapped[str] = mapped_column(String(32), default="academics")
    confidence: Mapped[float] = mapped_column(Float, default=0.0)
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.datetime.now(datetime.timezone.utc))


class MemoryVectorRow(Base):
    """pgvector embedding sidecar; embedding column only when pgvector installed."""
    __tablename__ = "memory_vectors"
    memory_id: Mapped[str] = mapped_column(String(36), ForeignKey("memories.id"), primary_key=True)


class WorkspaceRow(Base):
    __tablename__ = "workspaces"
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    name: Mapped[str] = mapped_column(String(128))
    owner_id: Mapped[str] = mapped_column(String(64))
    members: Mapped[dict] = mapped_column(JSON, default=dict)


class SimulationRow(Base):
    __tablename__ = "simulations"
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    user_id: Mapped[str] = mapped_column(String(64))
    scenario: Mapped[str] = mapped_column(Text)
    base: Mapped[dict] = mapped_column(JSON, default=dict)
    alt: Mapped[dict] = mapped_column(JSON, default=dict)


class CommitmentEventRow(Base):
    __tablename__ = "commitment_events"
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    commitment_id: Mapped[str] = mapped_column(String(36))
    kind: Mapped[str] = mapped_column(String(32))
    meta: Mapped[dict] = mapped_column(JSON, default=dict)
    at: Mapped[datetime.datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.datetime.now(datetime.timezone.utc))


class UserProfileRow(Base):
    __tablename__ = "user_profiles"
    user_id: Mapped[str] = mapped_column(String(64), primary_key=True)
    prefs: Mapped[dict] = mapped_column(JSON, default=dict)
    goals: Mapped[dict] = mapped_column(JSON, default=dict)


# Attach vector column only when pgvector is available (keeps import safe in tests).
if Vector is not None:  # pragma: no cover
    MemoryVectorRow.__table__.append_column(
        __import__("sqlalchemy").Column("embedding", Vector(1536))
    )
