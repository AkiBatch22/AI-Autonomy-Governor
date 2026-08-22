from typing import Optional

import pandas as pd

from backend.app.services.simulator import simulate_policy


DEFAULT_CONFIDENCE_THRESHOLDS = [
    round(x / 100, 2)
    for x in range(80, 100)
]

DEFAULT_AMOUNT_LIMITS = [
    25_000,
    50_000,
    75_000,
    100_000,
    150_000,
    200_000,
]


def generate_candidate_policies(
    df: pd.DataFrame,
    max_error_rate: float,
    confidence_thresholds: Optional[list[float]] = None,
    amount_limits: Optional[list[float]] = None,
    minimum_sample_size: int = 100,
) -> list[dict]:
    """
    Test multiple autonomy policies against historical data.

    Only policies that:
    - satisfy the customer's error tolerance
    - have enough historical evidence

    are returned.
    """

    if not 0 <= max_error_rate <= 1:
        raise ValueError(
            "max_error_rate must be between 0 and 1."
        )

    if minimum_sample_size <= 0:
        raise ValueError(
            "minimum_sample_size must be greater than 0."
        )

    if confidence_thresholds is not None and not confidence_thresholds:
        return []

    if amount_limits is not None and not amount_limits:
        return []

    if confidence_thresholds is None:
        confidence_thresholds = (
            DEFAULT_CONFIDENCE_THRESHOLDS
        )

    if amount_limits is None:
        amount_limits = DEFAULT_AMOUNT_LIMITS

    candidates = []

    for confidence_threshold in confidence_thresholds:

        for max_transaction_value in amount_limits:

            result = simulate_policy(
                df=df,
                confidence_threshold=confidence_threshold,
                max_transaction_value=max_transaction_value,
                max_error_rate=max_error_rate,
            )

            proposed = result["proposed"]

            # Don't trust policies based on tiny samples
            if (
                proposed["autonomous_tasks"]
                < minimum_sample_size
            ):
                continue

            # Remove policies exceeding risk tolerance
            if result["risk"]["status"] != "pass":
                continue

            candidate = {
                "confidence_threshold":
                    float(confidence_threshold),

                "max_transaction_value":
                    float(max_transaction_value),

                "autonomous_tasks":
                    proposed["autonomous_tasks"],

                "human_reviews":
                    proposed["human_reviews"],

                "autonomy_rate":
                    proposed["autonomy_rate"],

                "accuracy":
                    proposed["accuracy"],

                "error_rate":
                    proposed["error_rate"],

                "human_reviews_saved":
                    result["impact"][
                        "human_reviews_saved"
                    ],

                "autonomy_change":
                    result["impact"][
                        "autonomy_change"
                    ],

                "risk_status":
                    result["risk"]["status"],
            }

            candidates.append(candidate)

    return candidates


def rank_candidate_policies(
    candidates: list[dict],
) -> list[dict]:
    """
    Rank safe policies.

    Primary objective:
        Maximize autonomy.

    Tie breaker:
        Prefer lower error rate.
    """

    return sorted(
        candidates,
        key=lambda policy: (
            -policy["autonomy_rate"],
            policy["error_rate"],
        ),
    )


def recommend_policy(
    df: pd.DataFrame,
    max_error_rate: float,
    confidence_thresholds: Optional[list[float]] = None,
    amount_limits: Optional[list[float]] = None,
    minimum_sample_size: int = 100,
) -> Optional[dict]:
    """
    Return the highest-autonomy policy that stays
    within the customer's error tolerance.
    """

    resolved_thresholds = (
        DEFAULT_CONFIDENCE_THRESHOLDS
        if confidence_thresholds is None
        else confidence_thresholds
    )
    resolved_amount_limits = (
        DEFAULT_AMOUNT_LIMITS
        if amount_limits is None
        else amount_limits
    )

    candidates = generate_candidate_policies(
        df=df,
        max_error_rate=max_error_rate,
        confidence_thresholds=resolved_thresholds,
        amount_limits=resolved_amount_limits,
        minimum_sample_size=minimum_sample_size,
    )

    if not candidates:
        return None

    ranked = rank_candidate_policies(
        candidates
    )

    best_policy = ranked[0]

    return {
        "recommendation": best_policy,
        "safe_policies_tested": len(candidates),
        "total_policies_tested": (
            len(resolved_thresholds)
            * len(resolved_amount_limits)
        ),
    }


def get_top_policies(
    df: pd.DataFrame,
    max_error_rate: float,
    top_n: int = 5,
) -> list[dict]:
    """
    Return the top N safe policies.

    Useful later for the frontend.
    """

    if top_n <= 0:
        raise ValueError("top_n must be greater than 0.")

    candidates = generate_candidate_policies(
        df=df,
        max_error_rate=max_error_rate,
    )

    ranked = rank_candidate_policies(
        candidates
    )

    return ranked[:top_n]
