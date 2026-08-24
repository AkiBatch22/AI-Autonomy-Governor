# AI Autonomy Governor

A full-stack governance workbench for measuring how much autonomy an AI Employee has earned from historical execution performance.

> **AI agents should earn autonomy from demonstrated performance, not static confidence thresholds.**

Backtest AI Employee behavior, quantify Safe Autonomy, recommend governance thresholds, and preserve policy decisions in a Governance Audit Trail.

**Historical performance analysis · Policy backtesting · Risk-constrained recommendations · Governing Policy activation · Auditability · Multi-agent governance**

## Why This Exists

AI agents increasingly take actions with operational consequences. Two common operating models are both inadequate: unrestricted autonomy ignores risk, while routing every action through Human Review removes most of the value of automation.

AI Autonomy Governor treats autonomy as measurable and earned. It replays historical execution outcomes under proposed governance rules, then answers a practical question:

> Under which conditions can this AI Employee act autonomously while remaining within an acceptable historical error rate?

## What It Does

- Measures current autonomy, Human Review, accuracy, error, and processing-time metrics.
- Breaks performance down by confidence band, risk level, vendor type, and workflow.
- Uses a Policy Simulator to replay historical executions under proposed thresholds.
- Keeps high-risk transactions under Human Review regardless of model confidence.
- Searches 120 candidate confidence and transaction-limit combinations by default.
- Returns the highest-autonomy Governor Recommendation that satisfies the configured error tolerance and minimum evidence requirement.
- Backtests a policy again before saving it.
- Activates one intended Governing Policy per AI Employee and retires the previously active policy.
- Persists saved policies and simulation history as a Governance Audit Trail.
- Supports multiple AI Employees through agent-scoped API routes and `?agentId=` UI state.

## Product Workflow

```mermaid
flowchart LR
    A[Execution History] --> B[Metrics Engine]
    B --> C[Policy Simulator]
    C --> D[Candidate Policy Search]
    D --> E{Risk Filtering}
    E -->|Within tolerance| F[Governor Recommendation]
    E -->|Exceeds tolerance| G[Reject Candidate]
    F --> H[Human Approval and Save]
    H --> I[Active Governing Policy]
    I --> J[Governance Audit Trail]
```

## Live Demo

[Launch AI Autonomy Governor](https://ai-autonomy-governor.vercel.app)

## Demo

The included demo represents **Accounts Payable AI**, an AI Employee in Finance performing Invoice Processing. Its 25,000 execution records span approximately six months and are entirely **synthetic**—they are not customer or production data.

The generator intentionally models relationships such as higher confidence generally corresponding to higher accuracy, and high-risk transactions, new vendors, and difficult exceptions producing more errors.

### Verified synthetic example

These results were reproduced from `data/demo_executions.csv` using the current metrics and recommendation services. The recommendation uses a 0.50% maximum historical error rate and a 100-task minimum evidence requirement.

| Measure | Verified result |
|---|---:|
| Historical executions | 25,000 |
| Current autonomy | 75.45% |
| Current Human Review rate | 24.55% |
| Overall accuracy | 99.44% |
| Current autonomous accuracy | 99.62% |
| Recommended minimum confidence | 88% |
| Recommended maximum transaction | ₹150,000 |
| Recommended Safe Autonomy | 94.96% |
| Recommended historical error | 0.4928% |
| Human reviews avoided in replay | 4,877 |

These are historical backtest observations on synthetic data, not forecasts or formal safety guarantees.

## Product Screens

- **Policy Simulator** — configure confidence, transaction, and error thresholds; compare current and proposed behavior; and see a PASS/FAIL historical risk result.
- **Governor Recommendations** — choose an acceptable error tolerance, inspect the recommended policy, save it, and explore the Autonomy vs Risk frontier.
- **Governance Audit Trail** — review saved, active, and retired policies; activate a Governing Policy; and inspect linked simulation evidence.
- **AI Employee selector** — switch among agents while preserving the selected `agentId` in the URL; agents without execution history receive empty states.

> **Current UI note:** the sidebar labels `/` as “Dashboard,” but the current root page renders another Policy Simulator. `MetricCard` and `AnalyticsCharts` components exist, but no analytics dashboard page currently mounts them. Documentation follows the implemented routes rather than presenting that screen as complete.

No screenshots are committed yet. See [the screenshot capture guide](docs/screenshots/README.md) for the recommended filenames and content.

## Architecture

```mermaid
flowchart TB
    Browser[Browser]
    UI[Next.js 16 / TypeScript UI]
    API[FastAPI REST API]
    Routes[Agent-scoped API routes]
    Store[Execution Store]
    Frame[Pandas DataFrame]
    Metrics[Metrics Engine]
    Simulator[Policy Simulator]
    Governor[Recommendation Engine]
    Persistence[Persistence Service]
    DB[(PostgreSQL)]
    CSV[Synthetic execution CSV]
    Seed[Generation and seed scripts]

    Browser --> UI
    UI -->|REST / JSON| API
    API --> Routes
    Routes --> Store
    Store -->|SQLAlchemy 2.x| DB
    Store --> Frame
    Frame --> Metrics
    Frame --> Simulator
    Frame --> Governor
    Governor --> Simulator
    Routes --> Persistence
    Persistence -->|SQLAlchemy 2.x| DB
    CSV --> Seed
    Seed --> DB
```

The backend intentionally loads one AI Employee's PostgreSQL execution history into a Pandas DataFrame before running deterministic analytics. This keeps the MVP governance logic explicit and testable without hiding policy decisions inside database queries or predictive models.

For component, request-flow, lifecycle, and data-model diagrams, see [System Architecture](docs/architecture.md).

## How the Governor Works

1. The execution store loads an AI Employee's historical records from PostgreSQL into a DataFrame.
2. The metrics engine measures current autonomy, Human Review, accuracy, autonomous error, and segment performance.
3. The recommendation engine generates confidence thresholds from 0.80 through 0.99 and transaction limits from ₹25,000 through ₹200,000.
4. Each candidate is passed to the same Policy Simulator used by the interactive UI.
5. A historical task qualifies for autonomy only when confidence meets the threshold, transaction value is within the limit, and risk is not high.
6. The simulator calculates autonomous volume, accuracy, error rate, and Human Review impact.
7. Candidates exceeding the configured historical error tolerance or providing fewer than 100 autonomous examples by default are rejected.
8. Remaining policies are ranked first by highest Safe Autonomy and then by lower error rate.
9. The best valid candidate is returned as a Governor Recommendation for human review; it is not saved automatically.
10. Saving triggers another backtest and atomically records the policy with supporting evidence. A separate action activates it, retiring any previously active policy for that AI Employee.

This is **historical replay**, not a predictive guarantee. A policy that passed on past executions may behave differently as workflows, vendors, models, or data distributions change.

## Safe Autonomy

**Safe Autonomy Rate** is the percentage of historical tasks that a policy would allow the AI Employee to execute autonomously while the observed autonomous error rate remains within the configured governance constraint.

```text
Safe Autonomy Rate = autonomous tasks under the policy / total historical tasks
```

Accuracy alone is insufficient because it does not express how often the AI is allowed to act, which cases remain reviewed, or whether errors cluster in high-impact segments. The Governor evaluates four related signals:

- **Autonomy rate** — share of tasks allowed to proceed without Human Review.
- **Autonomous error rate** — observed error rate among those autonomous tasks.
- **Human Review rate** — share of tasks still routed to a person.
- **Risk constraints** — confidence, transaction-value, high-risk exclusion, error tolerance, and minimum historical evidence.

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS 4 |
| API | FastAPI, Pydantic |
| Analytics | Pandas, NumPy |
| Database | PostgreSQL, Psycopg 3 |
| ORM | SQLAlchemy 2.x |
| Migrations | Alembic |
| Testing and QA | Pytest, ESLint, Next.js production build |
| Visualization | Recharts, Lucide React |

## Repository Structure

```text
.
├── backend/
│   ├── app/
│   │   ├── api/          # FastAPI routes
│   │   ├── core/         # Database configuration
│   │   ├── models/       # SQLAlchemy entities
│   │   ├── schemas/      # Pydantic request/response models
│   │   └── services/     # Metrics, simulation, recommendation, persistence
│   ├── alembic/          # Migration environment and revisions
│   └── tests/            # Backend unit and route-registration tests
├── data/                 # Deterministic synthetic execution history
├── docs/                 # Architecture, demo, and screenshot guidance
├── frontend/
│   ├── app/              # Next.js App Router pages
│   ├── components/       # Governance UI and charts
│   ├── lib/              # REST client
│   └── types/            # API-facing TypeScript types
└── scripts/              # Synthetic data generation and database seeding
```

## API

All versioned routes are under `/api/v1`.

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/v1/health` | Service health |
| `POST` | `/api/v1/agents` | Create an AI Employee |
| `GET` | `/api/v1/agents` | List AI Employees |
| `GET` | `/api/v1/agents/{agent_id}` | Get one AI Employee |
| `GET` | `/api/v1/agents/{agent_id}/metrics` | Get current and segmented performance metrics |
| `POST` | `/api/v1/agents/{agent_id}/simulate` | Run and record a Historical Backtest |
| `POST` | `/api/v1/agents/{agent_id}/recommend` | Generate the best safe Governor Recommendation |
| `GET` | `/api/v1/agents/{agent_id}/recommendations/top` | Return top safe candidates for frontier analysis |
| `POST` | `/api/v1/agents/{agent_id}/policies` | Backtest and save a safe policy |
| `GET` | `/api/v1/agents/{agent_id}/policies` | List saved policy history |
| `PATCH` | `/api/v1/agents/{agent_id}/policies/{policy_id}/activate` | Activate a Governing Policy and retire the prior active policy |
| `GET` | `/api/v1/agents/{agent_id}/simulations` | List the Governance Audit Trail of simulations |

Interactive Swagger documentation is available at `http://127.0.0.1:8000/docs` while the backend is running.

## Data Model

- **Agent** — an AI Employee with a name, department, workflow, and creation timestamp.
- **Execution** — one historical task outcome, including confidence, amount, vendor and risk attributes, Human Review status, decisions, correctness, timing, and exception type. `(agent_id, external_task_id)` is unique.
- **Policy** — an AI Employee's saved governance thresholds and lifecycle status (`saved`, `active`, or `retired`).
- **Simulation** — a persisted Historical Backtest containing current-versus-proposed metrics, PASS/FAIL outcome, and an optional link to the saved policy it supports.

Executions, policies, and simulations are agent-scoped. Deleting an agent cascades to its records; deleting a policy leaves its simulations as audit history by setting `policy_id` to `NULL`.

## Local Setup

### Prerequisites

- Python 3.10 or newer
- PostgreSQL
- Node.js 20 or newer
- npm

### 1. Backend environment

From the repository root in PowerShell:

```powershell
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
```

Copy the example configuration and replace only the placeholders:

```powershell
Copy-Item .env.example .env
```

```dotenv
DATABASE_URL=postgresql+psycopg://USER:PASSWORD@localhost:5432/autonomy_governor
```

Create the PostgreSQL database using your normal administration workflow, then apply migrations:

```powershell
python -m alembic upgrade head
```

The deterministic CSV is already included. To regenerate it, then seed PostgreSQL:

```powershell
python -m scripts.generate_demo_data
python -m scripts.seed_database
```

Start FastAPI:

```powershell
python -m uvicorn backend.app.main:app --reload
```

The API runs at `http://127.0.0.1:8000`; Swagger is at `http://127.0.0.1:8000/docs`.

### 2. Frontend environment

In a second PowerShell terminal:

```powershell
Set-Location frontend
Copy-Item .env.example .env.local
npm install
npm run dev
```

The UI runs at `http://localhost:3000` and expects the backend at the configured versioned API base URL.

## Environment Variables

| Variable | Location | Example | Purpose |
|---|---|---|---|
| `DATABASE_URL` | Root `.env` | `postgresql+psycopg://USER:PASSWORD@localhost:5432/autonomy_governor` | SQLAlchemy/Psycopg connection URL |
| `NEXT_PUBLIC_API_URL` | `frontend/.env.local` | `http://127.0.0.1:8000/api/v1` | Base URL used by the Next.js REST client |

Both runtime environment files are ignored by Git. Commit only the placeholder-only `.env.example` files.

## Testing

Backend tests are deterministic and do not require the production database:

```powershell
python -m pytest
```

Frontend checks:

```powershell
Set-Location frontend
npm run lint
npm run build
```

The current suite contains **26 passing backend tests** covering metrics normalization and aggregation, simulator constraints and consistency, recommendation safety/evidence/ranking, and API route registration. The current frontend also passes ESLint and the Next.js production build.

## Key Design Decisions

- **Historical replay over raw confidence:** confidence is one policy input, not proof that an action is safe.
- **Explicit risk tolerance:** each simulation evaluates observed autonomous error against a user-configured maximum.
- **Conservative high-risk handling:** high-risk transactions remain under Human Review in every simulated policy.
- **Evidence before recommendation:** default recommendations require at least 100 historical autonomous tasks.
- **Human-controlled lifecycle:** recommendation, saving, and activation are separate actions; recommendations never auto-deploy.
- **One intended active policy per AI Employee:** activation retires any previously active policy in application logic.
- **Persistent evidence:** simulations and saved-policy backtests form a traceable Governance Audit Trail.
- **Multi-agent boundaries:** execution history, policies, recommendations, and audit records are agent-scoped.
- **Deterministic engine/UI separation:** the frontend presents decisions; backend services own repeatable governance calculations.

## Limitations and Future Work

- The demo dataset is synthetic and represents one seeded Accounts Payable scenario.
- Historical performance does not guarantee future AI Employee behavior.
- The current root “Dashboard” route renders the Policy Simulator; analytics components are not yet wired into a dashboard page.
- Authentication, role-based access control, and enterprise approval workflows are not implemented.
- There is no production execution gateway or real-time policy-enforcement integration.
- Drift monitoring, alerting, and automatic re-evaluation are not implemented.
- The single-active-policy rule is maintained by application logic rather than a database-level uniqueness constraint.

## Why This Project Is Interesting

Most AI evaluation asks, “Can this model answer correctly?” AI Autonomy Governor asks a more operational question:

> Under what conditions should this AI system be allowed to act without human intervention?

That shift matters for AI Employees operating in finance, procurement, customer operations, support, and other workflows where errors have different costs and autonomy must remain explainable.

## Documentation

- [System Architecture](docs/architecture.md)
- [Demo Walkthrough](docs/demo.md)
- [Screenshot Capture Guide](docs/screenshots/README.md)

## License

Licensed under the [MIT License](LICENSE).
