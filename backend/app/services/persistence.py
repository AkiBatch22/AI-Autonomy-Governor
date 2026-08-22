from typing import Any

from sqlalchemy.orm import Session

from backend.app.models.policy import Policy
from backend.app.models.simulation import Simulation


def _new_simulation(
    *,
    agent_id: int,
    confidence_threshold: float,
    max_transaction_value: float,
    max_error_rate: float,
    result: dict[str, Any],
    policy_id: int | None = None,
) -> Simulation:
    current = result["current"]
    proposed = result["proposed"]
    impact = result["impact"]
    risk = result["risk"]

    return Simulation(
        agent_id=int(agent_id),
        policy_id=int(policy_id) if policy_id is not None else None,
        confidence_threshold=float(confidence_threshold),
        max_transaction_value=float(max_transaction_value),
        max_error_rate=float(max_error_rate),
        current_autonomy_rate=float(current["autonomy_rate"]),
        current_error_rate=float(current["error_rate"]),
        proposed_autonomy_rate=float(proposed["autonomy_rate"]),
        proposed_accuracy=float(proposed["accuracy"]),
        proposed_error_rate=float(proposed["error_rate"]),
        autonomous_tasks=int(proposed["autonomous_tasks"]),
        human_reviews=int(proposed["human_reviews"]),
        autonomy_change=float(impact["autonomy_change"]),
        human_reviews_saved=int(impact["human_reviews_saved"]),
        risk_status=str(risk["status"]),
    )


def save_simulation(
    db: Session,
    agent_id: int,
    confidence_threshold: float,
    max_transaction_value: float,
    max_error_rate: float,
    result: dict,
    policy_id: int | None = None,
) -> Simulation:
    """Persist one backtest and leave the session usable after failures."""
    simulation = _new_simulation(
        agent_id=agent_id,
        policy_id=policy_id,
        confidence_threshold=confidence_threshold,
        max_transaction_value=max_transaction_value,
        max_error_rate=max_error_rate,
        result=result,
    )

    try:
        db.add(simulation)
        db.commit()
        db.refresh(simulation)
    except Exception:
        db.rollback()
        raise

    return simulation


def save_policy_with_backtest(
    db: Session,
    agent_id: int,
    name: str,
    minimum_confidence: float,
    maximum_transaction_value: float,
    maximum_error_rate: float,
    result: dict,
) -> Policy:
    """Atomically persist an approved policy and its supporting backtest."""
    policy = Policy(
        agent_id=int(agent_id),
        name=name,
        minimum_confidence=float(minimum_confidence),
        maximum_transaction_value=float(maximum_transaction_value),
        maximum_error_rate=float(maximum_error_rate),
        status="saved",
    )

    try:
        db.add(policy)
        db.flush()
        simulation = _new_simulation(
            agent_id=agent_id,
            policy_id=policy.id,
            confidence_threshold=minimum_confidence,
            max_transaction_value=maximum_transaction_value,
            max_error_rate=maximum_error_rate,
            result=result,
        )
        db.add(simulation)
        db.commit()
        db.refresh(policy)
    except Exception:
        db.rollback()
        raise

    return policy
