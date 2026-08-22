import math
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd


REQUIRED_COLUMNS = {
    "task_id",
    "timestamp",
    "workflow_type",
    "confidence",
    "amount",
    "vendor_type",
    "risk_level",
    "human_reviewed",
    "correct",
    "processing_time_seconds",
}

BOOLEAN_COLUMNS = ("human_reviewed", "correct")
NUMERIC_COLUMNS = (
    "confidence",
    "amount",
    "processing_time_seconds",
)


def _parse_boolean(value: Any, column_name: str) -> bool:
    if isinstance(value, (bool, np.bool_)):
        return bool(value)

    if isinstance(value, str):
        normalized = value.strip().lower()
        if normalized == "true":
            return True
        if normalized == "false":
            return False

    raise ValueError(
        f"Column '{column_name}' contains an invalid boolean value: {value!r}."
    )


def normalize_execution_data(df: pd.DataFrame) -> pd.DataFrame:
    """Validate and normalize execution data from CSV or PostgreSQL."""
    missing_columns = REQUIRED_COLUMNS - set(df.columns)
    if missing_columns:
        raise ValueError(
            f"Missing required columns: {sorted(missing_columns)}"
        )

    if df.empty:
        raise ValueError("Execution dataset is empty.")

    normalized = df.copy()

    for column in NUMERIC_COLUMNS:
        try:
            normalized[column] = pd.to_numeric(
                normalized[column], errors="raise"
            )
        except (TypeError, ValueError) as exc:
            raise ValueError(
                f"Column '{column}' must contain numeric values."
            ) from exc

        values = normalized[column].to_numpy(dtype=float)
        if not np.isfinite(values).all():
            raise ValueError(
                f"Column '{column}' cannot contain missing or non-finite values."
            )

    for column in BOOLEAN_COLUMNS:
        normalized[column] = normalized[column].map(
            lambda value: _parse_boolean(value, column)
        )

    try:
        normalized["timestamp"] = pd.to_datetime(
            normalized["timestamp"], errors="raise", utc=True
        )
    except (TypeError, ValueError) as exc:
        raise ValueError(
            "Column 'timestamp' contains an invalid timestamp."
        ) from exc

    if normalized["timestamp"].isna().any():
        raise ValueError("Column 'timestamp' cannot contain missing values.")

    if not normalized["confidence"].between(0, 1).all():
        raise ValueError("Confidence values must be between 0 and 1.")

    if (normalized["amount"] < 0).any():
        raise ValueError("Transaction amounts cannot be negative.")

    if (normalized["processing_time_seconds"] < 0).any():
        raise ValueError("Processing times cannot be negative.")

    return normalized


def load_execution_data(csv_path: str | Path) -> pd.DataFrame:
    """Load and validate AI execution history from CSV."""
    return normalize_execution_data(pd.read_csv(csv_path))


def validate_execution_data(df: pd.DataFrame) -> None:
    """Raise ``ValueError`` when execution data is malformed."""
    normalize_execution_data(df)


def get_overview_metrics(df: pd.DataFrame) -> dict:
    """Calculate headline AI employee performance metrics."""
    data = normalize_execution_data(df)
    total_tasks = len(data)
    human_reviews = int(data["human_reviewed"].sum())
    autonomous_tasks = total_tasks - human_reviews
    autonomous_df = data.loc[~data["human_reviewed"]]

    autonomous_accuracy = (
        float(autonomous_df["correct"].mean())
        if not autonomous_df.empty
        else None
    )

    return {
        "total_tasks": total_tasks,
        "autonomous_tasks": autonomous_tasks,
        "human_reviews": human_reviews,
        "autonomy_rate": autonomous_tasks / total_tasks,
        "human_review_rate": human_reviews / total_tasks,
        "overall_accuracy": float(data["correct"].mean()),
        "autonomous_accuracy": autonomous_accuracy,
        "autonomous_error_rate": (
            1.0 - autonomous_accuracy
            if autonomous_accuracy is not None
            else None
        ),
        "avg_processing_time_seconds": float(
            data["processing_time_seconds"].mean()
        ),
    }


def performance_by_confidence_band(df: pd.DataFrame) -> pd.DataFrame:
    """Measure AI performance across confidence bands."""
    data = normalize_execution_data(df)
    data["confidence_band"] = pd.cut(
        data["confidence"],
        bins=[0, 0.80, 0.85, 0.90, 0.95, 1.01],
        labels=["<80%", "80-85%", "85-90%", "90-95%", "95-100%"],
        right=False,
    )

    result = (
        data.groupby("confidence_band", observed=True)
        .agg(
            total_tasks=("task_id", "count"),
            accuracy=("correct", "mean"),
            human_review_rate=("human_reviewed", "mean"),
            avg_amount=("amount", "mean"),
        )
        .reset_index()
    )
    result["confidence_band"] = result["confidence_band"].astype(str)
    result["error_rate"] = 1 - result["accuracy"]
    return result


def performance_by_segment(
    df: pd.DataFrame,
    segment_column: str,
) -> pd.DataFrame:
    """Calculate AI performance by a categorical segment."""
    data = normalize_execution_data(df)
    if segment_column not in data.columns:
        raise ValueError(f"{segment_column} does not exist.")

    result = (
        data.groupby(segment_column, dropna=False)
        .agg(
            total_tasks=("task_id", "count"),
            accuracy=("correct", "mean"),
            human_review_rate=("human_reviewed", "mean"),
            avg_confidence=("confidence", "mean"),
            avg_amount=("amount", "mean"),
            avg_processing_time_seconds=(
                "processing_time_seconds",
                "mean",
            ),
        )
        .reset_index()
    )
    result["error_rate"] = 1 - result["accuracy"]
    return result


def make_json_safe(value: Any) -> Any:
    """Recursively convert Pandas/NumPy values to JSON-safe Python values."""
    if isinstance(value, dict):
        return {key: make_json_safe(item) for key, item in value.items()}
    if isinstance(value, list):
        return [make_json_safe(item) for item in value]
    if isinstance(value, tuple):
        return [make_json_safe(item) for item in value]
    if value is pd.NA:
        return None
    if isinstance(value, np.integer):
        return int(value)
    if isinstance(value, np.floating):
        value = float(value)
    if isinstance(value, np.bool_):
        return bool(value)
    if isinstance(value, float) and not math.isfinite(value):
        return None
    return value


def build_metrics_snapshot(df: pd.DataFrame) -> dict:
    """Generate all major product metrics in one JSON-safe snapshot."""
    data = normalize_execution_data(df)
    snapshot = {
        "overview": get_overview_metrics(data),
        "confidence_performance": performance_by_confidence_band(
            data
        ).to_dict(orient="records"),
        "risk_performance": performance_by_segment(
            data, "risk_level"
        ).to_dict(orient="records"),
        "vendor_performance": performance_by_segment(
            data, "vendor_type"
        ).to_dict(orient="records"),
        "workflow_performance": performance_by_segment(
            data, "workflow_type"
        ).to_dict(orient="records"),
    }
    return make_json_safe(snapshot)
