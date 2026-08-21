import pandas as pd


def simulate_policy(
    df: pd.DataFrame,
    confidence_threshold: float,
    max_transaction_value: float,
    max_error_rate: float,
) -> dict:
    """
    Backtest a proposed AI autonomy policy against historical executions.

    Proposed policy:
    - Confidence must be >= threshold
    - Transaction amount must be <= maximum
    - High-risk cases always require human review
    """

    if not 0 <= confidence_threshold <= 1:
        raise ValueError(
            "confidence_threshold must be between 0 and 1."
        )

    if max_transaction_value < 0:
        raise ValueError(
            "max_transaction_value cannot be negative."
        )

    if not 0 <= max_error_rate <= 1:
        raise ValueError(
            "max_error_rate must be between 0 and 1."
        )

    total_tasks = len(df)

    if total_tasks == 0:
        raise ValueError(
            "Cannot simulate policy on an empty dataset."
        )

    # ----------------------------------
    # CURRENT POLICY PERFORMANCE
    # ----------------------------------

    current_auto_mask = (
        df["human_reviewed"] == False
    )

    current_auto_cases = df[
        current_auto_mask
    ]

    current_autonomous_tasks = len(
        current_auto_cases
    )

    current_human_reviews = (
        total_tasks
        - current_autonomous_tasks
    )

    current_autonomy_rate = (
        current_autonomous_tasks
        / total_tasks
    )

    current_accuracy = (
        current_auto_cases["correct"].mean()
        if not current_auto_cases.empty
        else 0
    )

    current_error_rate = (
        1 - current_accuracy
    )

    # ----------------------------------
    # PROPOSED POLICY
    # ----------------------------------

    proposed_auto_mask = (
        (df["confidence"] >= confidence_threshold)
        & (
            df["amount"]
            <= max_transaction_value
        )
        & (
            df["risk_level"]
            != "high"
        )
    )

    proposed_auto_cases = df[
        proposed_auto_mask
    ]

    proposed_autonomous_tasks = len(
        proposed_auto_cases
    )

    proposed_human_reviews = (
        total_tasks
        - proposed_autonomous_tasks
    )

    proposed_autonomy_rate = (
        proposed_autonomous_tasks
        / total_tasks
    )

    proposed_accuracy = (
        proposed_auto_cases["correct"].mean()
        if not proposed_auto_cases.empty
        else 0
    )

    proposed_error_rate = (
        1 - proposed_accuracy
    )

    # ----------------------------------
    # BUSINESS IMPACT
    # ----------------------------------

    human_reviews_saved = (
        current_human_reviews
        - proposed_human_reviews
    )

    autonomy_change = (
        proposed_autonomy_rate
        - current_autonomy_rate
    )

    risk_status = (
        "pass"
        if proposed_error_rate
        <= max_error_rate
        else "fail"
    )

    return {
        "current": {
            "total_tasks": total_tasks,
            "autonomous_tasks":
                current_autonomous_tasks,
            "human_reviews":
                current_human_reviews,
            "autonomy_rate":
                current_autonomy_rate,
            "accuracy":
                current_accuracy,
            "error_rate":
                current_error_rate,
        },

        "proposed": {
            "total_tasks": total_tasks,
            "autonomous_tasks":
                proposed_autonomous_tasks,
            "human_reviews":
                proposed_human_reviews,
            "autonomy_rate":
                proposed_autonomy_rate,
            "accuracy":
                proposed_accuracy,
            "error_rate":
                proposed_error_rate,
        },

        "impact": {
            "autonomy_change":
                autonomy_change,
            "human_reviews_saved":
                human_reviews_saved,
        },

        "risk": {
            "maximum_allowed_error_rate":
                max_error_rate,
            "status":
                risk_status,
        },
    }