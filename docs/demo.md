# Demo Walkthrough

This is a 2–3 minute walkthrough for the synthetic **Accounts Payable AI** demo. Start the backend and frontend, apply migrations, and run `python -m scripts.seed_database` before presenting.

## Verified Demo Snapshot

The following values were reproduced from the current deterministic CSV and governance services with a 0.50% historical error limit:

| Measure | Synthetic result |
|---|---:|
| Historical executions | 25,000 |
| Current autonomy | 75.45% |
| Current Human Review rate | 24.55% |
| Overall accuracy | 99.44% |
| Governor minimum confidence | 88% |
| Governor transaction limit | ₹150,000 |
| Recommended Safe Autonomy | 94.96% |
| Observed autonomous error | 0.4928% |
| Human reviews avoided in replay | 4,877 |

All records and results are synthetic historical examples. They are not customer data or future-performance guarantees.

## Suggested Sequence

### 1. Establish the operating question

Use the AI Employee selector to choose **Accounts Payable AI** and explain the thesis:

> AI agents should earn autonomy from demonstrated performance, not static confidence thresholds.

The system is deciding which invoice-processing tasks can bypass Human Review under explicit constraints.

### 2. Open the Policy Simulator

Navigate to `/simulator?agentId=1`.

- Explain minimum confidence, maximum transaction value, and maximum acceptable error rate.
- Set confidence to `0.88`, transaction value to `150000`, and error rate to `0.005`.
- Run the Historical Backtest.
- Compare current versus proposed autonomy, accuracy, error, and Human Review volume.
- Point out the PASS/FAIL result and that high-risk transactions always remain reviewed.

### 3. Ask the Governor

Navigate to `/recommendations?agentId=1`.

- Keep the maximum acceptable error rate at `0.005`.
- Generate the Governor Recommendation.
- Explain that the backend evaluates 120 candidates, removes candidates that violate risk or evidence requirements, then ranks the remainder by Safe Autonomy.
- Use the Autonomy vs Risk frontier to show that more autonomy is a constrained optimization problem, not simply “pick the lowest confidence threshold.”

### 4. Save the recommendation

Select **Save Recommended Policy**.

Emphasize that recommendation and saving are separate. The backend replays the policy again before atomically saving both the policy and its supporting simulation.

### 5. Activate the Governing Policy

Navigate to `/audit?agentId=1`.

- Find the newly saved policy.
- Activate it.
- Show its `active` status and explain that a previously active policy would be marked `retired`.

### 6. Close on traceability

Use the policy history and simulation audit log to show:

- who/what the policy governs—the selected AI Employee;
- the thresholds that were approved;
- the historical evidence and PASS/FAIL result;
- the saved, active, and retired lifecycle states;
- the simulation linked to the saved policy.

The product is more than a monitoring dashboard: it turns execution history into a reviewable governance decision and preserves the evidence behind that decision.

## Current UI Note

The sidebar currently labels `/` as **Dashboard**, but the root page renders another Policy Simulator. The standalone analytics chart and metric-card components are not wired into a dashboard page. Use `/simulator`, `/recommendations`, and `/audit` for the current demo, and capture a dashboard screenshot only after the root route is corrected.
