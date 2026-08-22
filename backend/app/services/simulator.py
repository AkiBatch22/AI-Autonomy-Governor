import math

import pandas as pd

from backend.app.services.metrics import normalize_execution_data


def _validate_policy_parameters(
    confidence_threshold: float,
    max_transaction_value: float,
    max_error_rate: float,
) -> None:
    if not math.isfinite(confidence_threshold) or not (
        0 <= confidence_threshold <= 1
    ):
        raise ValueError("confidence_threshold must be between 0 and 1.")

    if not math.isfinite(max_transaction_value) or max_transaction_value <= 0:
        raise ValueError("max_transaction_value must be greater than 0.")

    if not math.isfinite(max_error_rate) or not (0 <= max_error_rate <= 1):
        raise ValueError("max_error_rate must be between 0 and 1.")


def simulate_policy(
    df: pd.DataFrame,
    confidence_threshold: float,
    max_transaction_value: float,
    max_error_rate: float,
) -> dict:
    """Backtest a proposed autonomy policy against historical executions."""
    _validate_policy_parameters(
        confidence_threshold,
        max_transaction_value,
        max_error_rate,
    )
    data = normalize_execution_data(df)
    total_tasks = len(data)

    current_auto_cases = data.loc[~data["human_reviewed"]]
    current_autonomous_tasks = len(current_auto_cases)
    current_human_reviews = total_tasks - current_autonomous_tasks
    current_accuracy = (
        float(current_auto_cases["correct"].mean())
        if current_autonomous_tasks
        else 0.0
    )
    current_error_rate = (
        1.0 - current_accuracy if current_autonomous_tasks else 0.0
    )

    normalized_risk = data["risk_level"].astype("string").str.strip().str.lower()
    proposed_auto_mask = (
        (data["confidence"] >= confidence_threshold)
        & (data["amount"] <= max_transaction_value)
        & (normalized_risk != "high")
    )
    proposed_auto_cases = data.loc[proposed_auto_mask]
    proposed_autonomous_tasks = len(proposed_auto_cases)
    proposed_human_reviews = total_tasks - proposed_autonomous_tasks
    proposed_accuracy = (
        float(proposed_auto_cases["correct"].mean())
        if proposed_autonomous_tasks
        else 0.0
    )
    proposed_error_rate = (
        1.0 - proposed_accuracy if proposed_autonomous_tasks else 0.0
    )

    current_autonomy_rate = current_autonomous_tasks / total_tasks
    proposed_autonomy_rate = proposed_autonomous_tasks / total_tasks
    human_reviews_saved = current_human_reviews - proposed_human_reviews
    autonomy_change = proposed_autonomy_rate - current_autonomy_rate

    return {
        "current": {
            "total_tasks": total_tasks,
            "autonomous_tasks": current_autonomous_tasks,
            "human_reviews": current_human_reviews,
            "autonomy_rate": current_autonomy_rate,
            "accuracy": current_accuracy,
            "error_rate": current_error_rate,
        },
        "proposed": {
            "total_tasks": total_tasks,
            "autonomous_tasks": proposed_autonomous_tasks,
            "human_reviews": proposed_human_reviews,
            "autonomy_rate": proposed_autonomy_rate,
            "accuracy": proposed_accuracy,
            "error_rate": proposed_error_rate,
        },
        "impact": {
            "autonomy_change": autonomy_change,
            "human_reviews_saved": human_reviews_saved,
        },
        "risk": {
            "maximum_allowed_error_rate": max_error_rate,
            "status": (
                "pass" if proposed_error_rate <= max_error_rate else "fail"
            ),
        },
    }
