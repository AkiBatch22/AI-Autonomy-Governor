from backend.app.services.recommendations import (
    rank_candidate_policies,
    recommend_policy,
)


def test_recommended_policy_respects_error_tolerance(execution_df):
    result = recommend_policy(
        execution_df,
        max_error_rate=0.0,
        confidence_thresholds=[0.9, 0.95],
        amount_limits=[25_000, 50_000],
        minimum_sample_size=1,
    )
    assert result is not None
    assert result["recommendation"]["error_rate"] <= 0.0
    assert result["recommendation"]["risk_status"] == "pass"


def test_minimum_evidence_requirement_is_respected(execution_df):
    result = recommend_policy(
        execution_df,
        max_error_rate=1.0,
        confidence_thresholds=[0.8],
        amount_limits=[200_000],
        minimum_sample_size=len(execution_df) + 1,
    )
    assert result is None


def test_no_safe_candidate_returns_none(execution_df):
    unsafe = execution_df.copy()
    unsafe["correct"] = False
    result = recommend_policy(
        unsafe,
        max_error_rate=0.0,
        confidence_thresholds=[0.8],
        amount_limits=[200_000],
        minimum_sample_size=1,
    )
    assert result is None


def test_ranking_prioritizes_autonomy():
    candidates = [
        {"autonomy_rate": 0.4, "error_rate": 0.0, "name": "safer"},
        {"autonomy_rate": 0.6, "error_rate": 0.1, "name": "more autonomous"},
    ]
    assert rank_candidate_policies(candidates)[0]["name"] == "more autonomous"


def test_error_rate_is_the_tie_breaker():
    candidates = [
        {"autonomy_rate": 0.5, "error_rate": 0.02, "name": "higher error"},
        {"autonomy_rate": 0.5, "error_rate": 0.01, "name": "lower error"},
    ]
    assert rank_candidate_policies(candidates)[0]["name"] == "lower error"


def test_explicit_empty_search_space_tests_no_policies(execution_df):
    result = recommend_policy(
        execution_df,
        max_error_rate=1.0,
        confidence_thresholds=[],
        amount_limits=[100_000],
        minimum_sample_size=1,
    )
    assert result is None
