# System Architecture

## Overview

AI Autonomy Governor is a two-tier application backed by PostgreSQL. A Next.js frontend provides the Policy Simulator, Governor Recommendation, Autonomy vs Risk, policy lifecycle, and audit interfaces. FastAPI exposes agent-scoped REST endpoints and delegates deterministic governance calculations to Pandas-based services.

The central analytical boundary is deliberate:

```text
PostgreSQL → SQLAlchemy execution store → Pandas DataFrame → governance services
```

The recommendation engine does not train a model or infer future risk. It searches a fixed policy space and replays each candidate against observed execution outcomes.

## Component Architecture

```mermaid
flowchart TB
    subgraph Client[Client Layer]
        Browser[Browser]
        Next[Next.js App Router]
        UI[TypeScript UI Components]
        Charts[Recharts Visualizations]
        Browser --> Next
        Next --> UI
        UI --> Charts
    end

    subgraph API[API Layer]
        FastAPI[FastAPI Application]
        AgentRoutes[Agent-scoped Routes]
        Validation[Pydantic Validation]
        FastAPI --> AgentRoutes
        AgentRoutes --> Validation
    end

    subgraph Governance[Governance Services]
        ExecutionStore[Execution Store]
        DataFrame[Pandas DataFrame]
        Metrics[Metrics Engine]
        Simulator[Policy Simulator]
        Recommendation[Recommendation Engine]
        Persistence[Persistence Service]
        ExecutionStore --> DataFrame
        DataFrame --> Metrics
        DataFrame --> Simulator
        DataFrame --> Recommendation
        Recommendation --> Simulator
    end

    subgraph Data[Data Layer]
        ORM[SQLAlchemy 2.x]
        PostgreSQL[(PostgreSQL)]
        CSV[Synthetic CSV]
        Generator[Deterministic Generator]
        Seeder[Batch Seeder]
        Generator --> CSV
        CSV --> Seeder
        Seeder --> ORM
        ORM --> PostgreSQL
    end

    Next -->|REST / JSON| FastAPI
    AgentRoutes --> ExecutionStore
    AgentRoutes --> Metrics
    AgentRoutes --> Simulator
    AgentRoutes --> Recommendation
    AgentRoutes --> Persistence
    ExecutionStore --> ORM
    Persistence --> ORM
```

### Frontend

- `frontend/app/` contains Next.js App Router pages for simulation, recommendations, and the Governance Audit Trail.
- `frontend/components/` contains the interactive simulator, recommendation workflow, policy activation UI, frontier visualization, and analytics components.
- `frontend/lib/api.ts` is the typed REST boundary. It reads `NEXT_PUBLIC_API_URL` and sends requests to the versioned FastAPI API.
- The shared sidebar loads available AI Employees and preserves selection through `?agentId=<id>`.

### FastAPI

- `backend/app/main.py` creates the application, configures local-development CORS for port 3000, and mounts system and agent routers below `/api/v1`.
- `backend/app/api/agents.py` validates AI Employee ownership, translates service errors into HTTP responses, and coordinates persistence.
- Pydantic schemas validate agent creation, simulation, recommendation, and policy-save inputs.

### Governance services

- **Execution Store** — loads one AI Employee's ordered ORM execution records and creates the DataFrame used by analytics.
- **Metrics Engine** — normalizes data, calculates overview metrics, and produces confidence, risk, vendor, and workflow breakdowns.
- **Policy Simulator** — compares current behavior with a proposed confidence/amount/risk policy and returns its historical impact and PASS/FAIL result.
- **Recommendation Engine** — searches candidate policies, removes unsafe or weak-evidence candidates, and ranks the remainder by autonomy and error.
- **Persistence Service** — converts analytical scalars to native values and atomically saves policies with their supporting Historical Backtest.

### Data pipeline

`scripts/generate_demo_data.py` deterministically creates 25,000 synthetic Accounts Payable executions with NumPy seed `42`. `scripts/seed_database.py` creates or reuses the demo AI Employee, replaces its execution records in one transaction, and inserts the CSV in batches.

## Policy Evaluation Flow

```mermaid
sequenceDiagram
    actor User
    participant UI as Next.js UI
    participant API as FastAPI Agent Route
    participant Store as Execution Store
    participant DB as PostgreSQL
    participant Governor as Recommendation Engine
    participant Simulator as Policy Simulator
    participant Persist as Persistence Service

    User->>UI: Choose maximum acceptable error rate
    UI->>API: POST /agents/{id}/recommend
    API->>Store: Load execution history
    Store->>DB: SELECT agent executions
    DB-->>Store: ORM execution rows
    Store-->>API: Pandas DataFrame
    API->>Governor: Search candidate policy space

    loop Confidence threshold × transaction limit
        Governor->>Simulator: Replay candidate against history
        Simulator-->>Governor: Autonomy, error, evidence, PASS/FAIL
    end

    Governor->>Governor: Reject unsafe or insufficient-evidence candidates
    Governor->>Governor: Rank by autonomy, then lower error
    Governor-->>API: Best safe historical candidate
    API-->>UI: Governor Recommendation
    UI-->>User: Show policy and Autonomy vs Risk trade-off

    opt User saves recommendation
        User->>UI: Save recommended policy
        UI->>API: POST /agents/{id}/policies
        API->>Simulator: Backtest policy again
        API->>Persist: Save policy and linked simulation
        Persist->>DB: COMMIT policy + Historical Backtest
        DB-->>UI: Saved policy
    end

    opt User activates saved policy
        User->>UI: Activate policy
        UI->>API: PATCH /agents/{id}/policies/{policy_id}/activate
        API->>DB: Mark selected active and prior active retired
        DB-->>UI: Active Governing Policy
    end
```

Generating a recommendation is read-only. Simulations are persisted when run through the simulation endpoint, and saving a policy persists a second supporting backtest linked by `policy_id`.

## Data Model

```mermaid
erDiagram
    AGENT ||--o{ EXECUTION : has
    AGENT ||--o{ POLICY : owns
    AGENT ||--o{ SIMULATION : records
    POLICY o|--o{ SIMULATION : supports

    AGENT {
        int id PK
        string name
        string department
        string workflow
        datetime created_at
    }

    EXECUTION {
        int id PK
        int agent_id FK
        string external_task_id
        datetime timestamp
        float confidence
        float amount
        string vendor_type
        string risk_level
        boolean human_reviewed
        boolean correct
        int processing_time_seconds
    }

    POLICY {
        int id PK
        int agent_id FK
        string name
        float minimum_confidence
        float maximum_transaction_value
        float maximum_error_rate
        string status
        datetime created_at
    }

    SIMULATION {
        int id PK
        int agent_id FK
        int policy_id FK
        float confidence_threshold
        float max_transaction_value
        float max_error_rate
        float proposed_autonomy_rate
        float proposed_error_rate
        int autonomous_tasks
        int human_reviews
        string risk_status
        datetime created_at
    }
```

Important database behaviors:

- `(agent_id, external_task_id)` is unique for executions.
- Deleting an agent cascades to its executions, policies, and simulations.
- `Simulation.policy_id` is nullable. Deleting a policy sets the link to `NULL`, preserving simulation history.
- Agent, timestamp, confidence, risk, policy, and simulation foreign-key access paths are indexed by the schema.

## Request Flow

A typical metrics request follows this path:

1. A Next.js Server Component calls `getAgentMetrics(agentId)`.
2. The REST client sends `GET /api/v1/agents/{agent_id}/metrics` with caching disabled.
3. FastAPI verifies that the AI Employee exists.
4. The execution store queries PostgreSQL through SQLAlchemy and converts rows into a Pandas DataFrame.
5. The metrics service validates booleans, timestamps, and numeric ranges, then calculates overview and segment metrics.
6. Pandas and NumPy scalar values are converted to JSON-safe Python values.
7. FastAPI returns JSON to the Next.js page.

Simulation and recommendation requests share the same execution-loading path. Persistence is invoked only for simulation history, saved policies, and activation changes.

## Governance Lifecycle

```mermaid
stateDiagram-v2
    [*] --> Observed: Historical executions
    Observed --> Simulated: Replay proposed thresholds
    Simulated --> Recommended: Candidate passes risk and evidence filters
    Recommended --> Saved: Human saves policy
    Saved --> Active: Human activates policy
    Active --> Retired: Another policy becomes active
    Retired --> Active: Human reactivates policy
```

`Observed`, `Simulated`, and `Recommended` are conceptual lifecycle stages. The `policies.status` column actually stores `saved`, `active`, or `retired`. Simulations separately store a `pass` or `fail` risk status. Recommendations are not automatically persisted.

The activation endpoint makes the selected policy active and changes any other active policy for the same AI Employee to retired within the same database transaction. This is an application-level invariant; the database does not currently enforce it with a partial unique index.

## Safety Model

In this project, “safe” has a narrow, testable meaning:

> A candidate policy's observed autonomous error rate on historical executions is less than or equal to the user-configured maximum error rate, and the candidate has enough historical autonomous examples.

The simulated autonomy predicate is:

```python
confidence >= confidence_threshold
and amount <= max_transaction_value
and risk_level != "high"
```

Default recommendation evidence requires at least 100 autonomous tasks. High-risk tasks cannot become autonomous through the current policy search.

This is governance by historical evidence, not formal verification. It does not prove future safety, detect distribution drift, enforce policies in an external execution gateway, or replace human accountability.
