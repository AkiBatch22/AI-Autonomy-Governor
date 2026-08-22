from datetime import datetime

from sqlalchemy import (
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    func,
)

from sqlalchemy.orm import (
    Mapped,
    mapped_column,
)

from backend.app.core.database import Base


class Simulation(Base):

    __tablename__ = "simulations"

    id: Mapped[int] = mapped_column(
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

    policy_id: Mapped[int | None] = mapped_column(
        ForeignKey(
            "policies.id",
            ondelete="SET NULL",
        ),
        nullable=True,
        index=True,
    )

    confidence_threshold: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )

    max_transaction_value: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )

    max_error_rate: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )

    # Baseline at the time the simulation ran

    current_autonomy_rate: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )

    current_error_rate: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )

    # Proposed policy result

    proposed_autonomy_rate: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )

    proposed_accuracy: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )

    proposed_error_rate: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )

    autonomous_tasks: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    human_reviews: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    autonomy_change: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )

    human_reviews_saved: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    risk_status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )