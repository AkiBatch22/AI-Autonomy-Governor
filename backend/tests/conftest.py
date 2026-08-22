import pandas as pd
import pytest


@pytest.fixture
def execution_df() -> pd.DataFrame:
    return pd.DataFrame(
        {
            "task_id": [f"T-{index}" for index in range(1, 7)],
            "timestamp": pd.date_range(
                "2026-01-01", periods=6, freq="h", tz="UTC"
            ),
            "workflow_type": ["invoice"] * 6,
            "confidence": [0.99, 0.96, 0.92, 0.88, 0.84, 0.81],
            "amount": [10_000, 20_000, 40_000, 60_000, 80_000, 5_000],
            "vendor_type": [
                "existing",
                "existing",
                "new",
                "existing",
                "new",
                "existing",
            ],
            "risk_level": ["low", "high", "medium", "low", "medium", "low"],
            "human_reviewed": [False, True, False, True, False, False],
            "correct": [True, False, True, True, False, True],
            "processing_time_seconds": [10, 300, 20, 240, 25, 15],
        }
    )
