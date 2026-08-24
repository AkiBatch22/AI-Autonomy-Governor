# AI Autonomy Governor Frontend

Next.js interface for the AI Autonomy Governor backend. It provides multi-agent navigation, deterministic policy backtesting, Governor Recommendations, an Autonomy vs Risk frontier, saved-policy activation, and the Governance Audit Trail.

See the [root README](../README.md) for the product thesis, verified synthetic demo results, system architecture, backend setup, API reference, and limitations.

## Setup

The frontend requires Node.js 20 or newer and a running FastAPI backend.

```powershell
Copy-Item .env.example .env.local
npm install
npm run dev
```

The placeholder configuration points the REST client to the versioned local API:

```dotenv
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api/v1
```

Open `http://localhost:3000`.

## Routes

| Route | Implemented interface |
|---|---|
| `/` | Policy Simulator workspace; currently labeled Dashboard in the sidebar |
| `/simulator` | Policy Simulator |
| `/recommendations` | Governor Recommendation and Autonomy vs Risk frontier |
| `/audit` | Policy activation and Governance Audit Trail |

Each route accepts `?agentId=<id>` to preserve the selected AI Employee.

## Quality Checks

```powershell
npm run lint
npm run build
```

## Known Presentation Gap

The sidebar labels `/` as Dashboard, but the root page currently renders the Policy Simulator. `MetricCard` and `AnalyticsCharts` are present but not mounted by a dashboard page. This README describes the current implementation and does not treat that screen as complete.
