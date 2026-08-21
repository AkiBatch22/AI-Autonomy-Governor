from pathlib import Path

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


def load_execution_data(csv_path: str | Path) -> pd.DataFrame:
    """
    Load AI execution history from CSV.
    """

    df = pd.read_csv(csv_path)

    validate_execution_data(df)

    df["timestamp"] = pd.to_datetime(df["timestamp"])

    # Handles boolean values even if CSV loads them as strings.
    if df["human_reviewed"].dtype == "object":
        df["human_reviewed"] = (
            df["human_reviewed"]
            .astype(str)
            .str.lower()
            .map({"true": True, "false": False})
        )

    if df["correct"].dtype == "object":
        df["correct"] = (
            df["correct"]
            .astype(str)
            .str.lower()
            .map({"true": True, "false": False})
        )

    return df


def validate_execution_data(df: pd.DataFrame) -> None:
    """
    Validate that uploaded execution data contains
    the fields required by Autonomy Governor.
    """

    missing_columns = REQUIRED_COLUMNS - set(df.columns)

    if missing_columns:
        raise ValueError(
            f"Missing required columns: "
            f"{sorted(missing_columns)}"
        )

    if df.empty:
        raise ValueError("Execution dataset is empty.")

    if not df["confidence"].between(0, 1).all():
        raise ValueError(
            "Confidence values must be between 0 and 1."
        )

    if (df["amount"] < 0).any():
        raise ValueError(
            "Transaction amounts cannot be negative."
        )


def get_overview_metrics(df: pd.DataFrame) -> dict:
    """
    Calculate headline AI employee performance metrics.
    """

    total_tasks = len(df)

    human_reviews = df["human_reviewed"].sum()

    autonomous_tasks = (
        (~df["human_reviewed"]).sum()
    )

    autonomy_rate = (
        autonomous_tasks / total_tasks
        if total_tasks
        else 0
    )

    human_review_rate = (
        human_reviews / total_tasks
        if total_tasks
        else 0
    )

    overall_accuracy = df["correct"].mean()

    autonomous_df = df[
        df["human_reviewed"] == False
    ]

    autonomous_accuracy = (
        autonomous_df["correct"].mean()
        if not autonomous_df.empty
        else None
    )

    autonomous_error_rate = (
        1 - autonomous_accuracy
        if autonomous_accuracy is not None
        else None
    )

    avg_processing_time = (
        df["processing_time_seconds"].mean()
    )

    return {
        "total_tasks": total_tasks,
        "autonomous_tasks": int(autonomous_tasks),
        "human_reviews": int(human_reviews),
        "autonomy_rate": autonomy_rate,
        "human_review_rate": human_review_rate,
        "overall_accuracy": overall_accuracy,
        "autonomous_accuracy": autonomous_accuracy,
        "autonomous_error_rate": autonomous_error_rate,
        "avg_processing_time_seconds": avg_processing_time,
    }


def performance_by_confidence_band(
    df: pd.DataFrame,
) -> pd.DataFrame:
    """
    Measure AI performance across confidence bands.
    """

    temp = df.copy()

    temp["confidence_band"] = pd.cut(
        temp["confidence"],
        bins=[
            0,
            0.80,
            0.85,
            0.90,
            0.95,
            1.01,
        ],
        labels=[
            "<80%",
            "80-85%",
            "85-90%",
            "90-95%",
            "95-100%",
        ],
        right=False,
    )

    result = (
        temp.groupby(
            "confidence_band",
            observed=True,
        )
        .agg(
            total_tasks=("task_id", "count"),
            accuracy=("correct", "mean"),
            human_review_rate=(
                "human_reviewed",
                "mean",
            ),
            avg_amount=("amount", "mean"),
        )
        .reset_index()
    )

    result["error_rate"] = (
        1 - result["accuracy"]
    )

    return result


def performance_by_segment(
    df: pd.DataFrame,
    segment_column: str,
) -> pd.DataFrame:
    """
    Calculate AI performance by a categorical segment.

    Examples:
        risk_level
        vendor_type
        workflow_type
    """

    if segment_column not in df.columns:
        raise ValueError(
            f"{segment_column} does not exist."
        )

    result = (
        df.groupby(segment_column)
        .agg(
            total_tasks=("task_id", "count"),
            accuracy=("correct", "mean"),
            human_review_rate=(
                "human_reviewed",
                "mean",
            ),
            avg_confidence=("confidence", "mean"),
            avg_amount=("amount", "mean"),
            avg_processing_time_seconds=(
                "processing_time_seconds",
                "mean",
            ),
        )
        .reset_index()
    )

    result["error_rate"] = (
        1 - result["accuracy"]
    )

    return result


def build_metrics_snapshot(
    df: pd.DataFrame,
) -> dict:
    """
    Generate all major product metrics in one call.
    """

    return {
        "overview": get_overview_metrics(df),

        "confidence_performance":
            performance_by_confidence_band(
                df
            ).to_dict(
                orient="records"
            ),

        "risk_performance":
            performance_by_segment(
                df,
                "risk_level",
            ).to_dict(
                orient="records"
            ),

        "vendor_performance":
            performance_by_segment(
                df,
                "vendor_type",
            ).to_dict(
                orient="records"
            ),

        "workflow_performance":
            performance_by_segment(
                df,
                "workflow_type",
            ).to_dict(
                orient="records"
            ),
    }