import math

import pytest

from backend.app.services.simulator import simulate_policy


@pytest.mark.parametrize("threshold", [-0.01, 1.01, math.nan])
def test_invalid_confidence_thresholds_are_rejected(execution_df, threshold):
    with pytest.raises(ValueError):
        simulate_policy(execution_df, threshold, 100_000, 0.05)


@pytest.mark.parametrize("amount", [-1, 0, math.inf])
def test_invalid_transaction_values_are_rejected(execution_df, amount):
    with pytest.raises(ValueError):
        simulate_policy(execution_df, 0.9, amount, 0.05)


@pytest.mark.parametrize("error_rate", [-0.01, 1.01, math.nan])
def test_invalid_error_rates_are_rejected(execution_df, error_rate):
    with pytest.raises(ValueError):
        simulate_policy(execution_df, 0.9, 100_000, error_rate)


def test_empty_dataset_is_rejected(execution_df):
    with pytest.raises(ValueError, match="empty"):
        simulate_policy(execution_df.iloc[0:0], 0.9, 100_000, 0.05)


def test_high_risk_transactions_cannot_be_autonomous(execution_df):
    result = simulate_policy(execution_df, 0.9, 100_000, 1.0)

    eligible_non_high_risk = execution_df[
        (execution_df["confidence"] >= 0.9)
        & (execution_df["amount"] <= 100_000)
        & (execution_df["risk_level"] != "high")
    ]
    assert result["proposed"]["autonomous_tasks"] == len(
        eligible_non_high_risk
    )


def test_returned_metrics_are_internally_consistent(execution_df):
    result = simulate_policy(execution_df, 0.85, 75_000, 0.5)
    proposed = result["proposed"]
    current = result["current"]

    assert proposed["autonomous_tasks"] + proposed["human_reviews"] == len(
        execution_df
    )
    assert proposed["autonomy_rate"] == pytest.approx(
        proposed["autonomous_tasks"] / len(execution_df)
    )
    assert proposed["accuracy"] + proposed["error_rate"] == pytest.approx(1)
    assert result["impact"]["autonomy_change"] == pytest.approx(
        proposed["autonomy_rate"] - current["autonomy_rate"]
    )
    assert result["impact"]["human_reviews_saved"] == (
        current["human_reviews"] - proposed["human_reviews"]
    )


def test_zero_autonomous_tasks_have_zero_observed_error(execution_df):
    result = simulate_policy(execution_df, 1.0, 1, 0.0)
    assert result["proposed"]["autonomous_tasks"] == 0
    assert result["proposed"]["accuracy"] == 0.0
    assert result["proposed"]["error_rate"] == 0.0
    assert result["risk"]["status"] == "pass"
