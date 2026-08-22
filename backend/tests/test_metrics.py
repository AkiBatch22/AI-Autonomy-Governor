import pytest

from backend.app.services.metrics import (
    build_metrics_snapshot,
    get_overview_metrics,
    normalize_execution_data,
    performance_by_confidence_band,
    performance_by_segment,
)


def test_overview_autonomy_and_accuracy_metrics(execution_df):
    metrics = get_overview_metrics(execution_df)
    assert metrics["autonomous_tasks"] == 4
    assert metrics["human_reviews"] == 2
    assert metrics["autonomy_rate"] == pytest.approx(4 / 6)
    assert metrics["human_review_rate"] == pytest.approx(2 / 6)
    assert metrics["autonomous_accuracy"] == pytest.approx(0.75)
    assert metrics["autonomous_error_rate"] == pytest.approx(0.25)


def test_confidence_band_grouping(execution_df):
    result = performance_by_confidence_band(execution_df).set_index(
        "confidence_band"
    )
    assert result.loc["95-100%", "total_tasks"] == 2
    assert result.loc["90-95%", "total_tasks"] == 1
    assert result.loc["80-85%", "total_tasks"] == 2


def test_segment_grouping(execution_df):
    result = performance_by_segment(execution_df, "risk_level").set_index(
        "risk_level"
    )
    assert result.loc["low", "total_tasks"] == 3
    assert result.loc["high", "human_review_rate"] == pytest.approx(1.0)


def test_string_booleans_are_parsed_strictly(execution_df):
    data = execution_df.copy()
    data["human_reviewed"] = ["false", "TRUE", "false", "true", "false", "false"]
    normalized = normalize_execution_data(data)
    assert normalized["human_reviewed"].tolist() == [
        False,
        True,
        False,
        True,
        False,
        False,
    ]


def test_malformed_boolean_is_rejected(execution_df):
    data = execution_df.copy()
    data["correct"] = data["correct"].astype(object)
    data.loc[0, "correct"] = "yes"
    with pytest.raises(ValueError, match="invalid boolean"):
        normalize_execution_data(data)


def test_metrics_snapshot_contains_only_json_safe_scalars(execution_df):
    snapshot = build_metrics_snapshot(execution_df)
    assert isinstance(snapshot["overview"]["overall_accuracy"], float)
    assert isinstance(
        snapshot["confidence_performance"][0]["total_tasks"], int
    )
