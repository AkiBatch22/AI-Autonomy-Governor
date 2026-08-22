"""Generate synthetic execution logs for AI Employee Autonomy Governor.

Run from the repository root:
    python -m scripts.generate_demo_data

Output:
    data/demo_executions.csv
"""

from pathlib import Path
import numpy as np
import csv

SEED = 42
N = 25_000
OUTPUT_PATH = (
    Path(__file__).resolve().parents[1]
    / "data"
    / "demo_executions.csv"
)

rng = np.random.default_rng(SEED)

start = np.datetime64("2026-02-22T00:00:00")
end = np.datetime64("2026-08-21T23:59:59")
span_seconds = int((end - start) / np.timedelta64(1, "s"))
timestamps = start + rng.integers(0, span_seconds + 1, N).astype("timedelta64[s]")

vendor_type = rng.choice(["existing", "new"], N, p=[0.90, 0.10])

amount = np.clip(
    rng.lognormal(mean=np.log(28_000), sigma=0.80, size=N),
    2_500,
    1_200_000,
)

exception_type = rng.choice(
    [
        "none",
        "missing_po",
        "price_mismatch",
        "duplicate_invoice",
        "missing_approval",
        "contract_mismatch",
    ],
    N,
    p=[0.81, 0.06, 0.04, 0.02, 0.04, 0.03],
)

workflow_type = rng.choice(
    ["standard_invoice", "po_invoice", "non_po_invoice"],
    N,
    p=[0.30, 0.55, 0.15],
)

confidence = 0.78 + 0.22 * rng.beta(7, 1.8, N)
confidence -= np.where(vendor_type == "new", rng.uniform(0.01, 0.04, N), 0)

confidence_penalties = {
    "missing_po": (0.01, 0.03),
    "price_mismatch": (0.015, 0.04),
    "duplicate_invoice": (0.005, 0.02),
    "missing_approval": (0.01, 0.025),
    "contract_mismatch": (0.02, 0.05),
}

for exc, (lo, hi) in confidence_penalties.items():
    mask = exception_type == exc
    confidence[mask] -= rng.uniform(lo, hi, mask.sum())

confidence = np.clip(confidence, 0.50, 0.999)

risk_level = np.full(N, "low", dtype=object)

medium_risk = (
    (amount > 75_000)
    | (vendor_type == "new")
    | np.isin(exception_type, ["price_mismatch", "duplicate_invoice", "contract_mismatch"])
)

high_risk = (
    (amount > 180_000)
    | ((vendor_type == "new") & (amount > 100_000))
    | ((exception_type == "contract_mismatch") & (amount > 75_000))
)

risk_level[medium_risk] = "medium"
risk_level[high_risk] = "high"

reject_probability = np.full(N, 0.06)
reject_probability += np.where(vendor_type == "new", 0.05, 0)
reject_probability += np.where(risk_level == "medium", 0.04, 0)
reject_probability += np.where(risk_level == "high", 0.16, 0)

rejection_effects = {
    "missing_po": 0.10,
    "price_mismatch": 0.20,
    "duplicate_invoice": 0.52,
    "missing_approval": 0.18,
    "contract_mismatch": 0.24,
}

for exc, increment in rejection_effects.items():
    reject_probability += np.where(exception_type == exc, increment, 0)

reject_probability = np.clip(reject_probability, 0.02, 0.90)

final_is_reject = rng.random(N) < reject_probability
final_decision = np.where(final_is_reject, "reject", "approve")

error_probability = 0.001 + 0.15 * np.power(1 - confidence, 1.4)
error_probability += np.where(vendor_type == "new", 0.003, 0)
error_probability += np.where(risk_level == "medium", 0.003, 0)
error_probability += np.where(risk_level == "high", 0.020, 0)

exception_error_effects = {
    "missing_po": 0.003,
    "price_mismatch": 0.009,
    "duplicate_invoice": 0.007,
    "missing_approval": 0.004,
    "contract_mismatch": 0.014,
}

for exc, increment in exception_error_effects.items():
    error_probability += np.where(exception_type == exc, increment, 0)

error_probability = np.clip(error_probability, 0.0005, 0.25)

correct = rng.random(N) >= error_probability

ai_decision = np.where(
    correct,
    final_decision,
    np.where(final_decision == "approve", "reject", "approve"),
)

human_reviewed = (
    (confidence < 0.90)
    | (amount > 100_000)
    | (risk_level == "high")
    | np.isin(exception_type, ["duplicate_invoice", "contract_mismatch", "missing_approval"])
)

human_reviewed |= ((vendor_type == "new") & (confidence < 0.94))
human_reviewed |= rng.random(N) < 0.01

base_processing = rng.lognormal(mean=np.log(22), sigma=0.45, size=N)

processing_time_seconds = (
    base_processing
    + np.where(human_reviewed, rng.lognormal(np.log(240), 0.55, N), 0)
    + np.where(exception_type != "none", rng.lognormal(np.log(35), 0.45, N), 0)
)

processing_time_seconds = np.round(
    np.clip(processing_time_seconds, 5, 3_600)
).astype(int)

existing_vendor_ids = np.array([f"V-{i:04d}" for i in range(1, 401)])
new_vendor_ids = np.array([f"NV-{i:04d}" for i in range(1, 151)])

vendor_id = np.empty(N, dtype=object)
existing_mask = vendor_type == "existing"
vendor_id[existing_mask] = rng.choice(existing_vendor_ids, existing_mask.sum())
vendor_id[~existing_mask] = rng.choice(new_vendor_ids, (~existing_mask).sum())

headers = [
    "task_id",
    "timestamp",
    "agent",
    "workflow_type",
    "confidence",
    "amount",
    "vendor_id",
    "vendor_type",
    "risk_level",
    "human_reviewed",
    "ai_decision",
    "final_decision",
    "correct",
    "processing_time_seconds",
    "exception_type",
]

order = np.argsort(timestamps)

with OUTPUT_PATH.open("w", newline="", encoding="utf-8") as f:
    writer = csv.writer(f)
    writer.writerow(headers)

    for i, idx in enumerate(order, start=1):
        writer.writerow([
            f"T-{i:05d}",
            str(timestamps[idx]).replace("T", " "),
            "Accounts Payable AI",
            workflow_type[idx],
            round(float(confidence[idx]), 4),
            round(float(amount[idx]), 2),
            vendor_id[idx],
            vendor_type[idx],
            risk_level[idx],
            bool(human_reviewed[idx]),
            ai_decision[idx],
            final_decision[idx],
            bool(correct[idx]),
            int(processing_time_seconds[idx]),
            exception_type[idx],
        ])

print(f"Created {OUTPUT_PATH} with {N:,} rows.")
