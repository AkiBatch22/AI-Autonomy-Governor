from backend.app.services.metrics import (
    load_execution_data,
)

from backend.app.services.recommendations import (
    recommend_policy,
)


def test_recommendation_respects_error_limit():

    df = load_execution_data(
        "data/demo_executions.csv"
    )

    max_error_rate = 0.005

    result = recommend_policy(
        df=df,
        max_error_rate=max_error_rate,
    )

    assert result is not None

    recommendation = result[
        "recommendation"
    ]

    assert (
        recommendation["error_rate"]
        <= max_error_rate
    )


def test_recommendation_has_evidence():

    df = load_execution_data(
        "data/demo_executions.csv"
    )

    result = recommend_policy(
        df=df,
        max_error_rate=0.005,
        minimum_sample_size=100,
    )

    recommendation = result[
        "recommendation"
    ]

    assert (
        recommendation["autonomous_tasks"]
        >= 100
    )


def test_recommendation_is_safe():

    df = load_execution_data(
        "data/demo_executions.csv"
    )

    result = recommend_policy(
        df=df,
        max_error_rate=0.005,
    )

    assert (
        result["recommendation"][
            "risk_status"
        ]
        == "pass"
    )