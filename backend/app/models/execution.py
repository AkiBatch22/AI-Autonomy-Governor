from datetime import datetime

from sqlalchemy import (
    Boolean,
    DateTime,
    Float,
    ForeignKey,
    Index,
    Integer,
    String,
    UniqueConstraint,
)

from sqlalchemy.orm import (
    Mapped,
    mapped_column,
)

from backend.app.core.database import Base


class Execution(Base):

    __tablename__ = "executions"

    __table_args__ = (

        # Prevent the same task from being inserted
        # twice for the same AI employee
        UniqueConstraint(
            "agent_id",
            "external_task_id",
            name="uq_agent_external_task",
        ),

        # Helps queries such as:
        # "give me Agent 1's executions by date"
        Index(
            "ix_executions_agent_timestamp",
            "agent_id",
            "timestamp",
        ),

        # Helps confidence-based analytics
        Index(
            "ix_executions_agent_confidence",
            "agent_id",
            "confidence",
        ),
    )

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )

    agent_id: Mapped[int] = mapped_column(
        ForeignKey(
            "agents.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    external_task_id: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )

    workflow_type: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    confidence: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )

    amount: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )

    vendor_id: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    vendor_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )

    risk_level: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        index=True,
    )

    human_reviewed: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
    )

    ai_decision: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )

    final_decision: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )

    correct: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
    )

    processing_time_seconds: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    exception_type: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )