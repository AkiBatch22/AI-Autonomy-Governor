# AI Employee Autonomy Governor

Backend MVP for measuring an AI employee's current autonomy, backtesting proposed
autonomy policies, and recommending the highest observed safe-autonomy policy
within a configured historical error tolerance.

Recommendations are historical backtest results, not guarantees of future
performance. High-risk transactions always remain human-reviewed in the MVP.

## Local setup

Prerequisites: Python 3.10+ and PostgreSQL.

1. Create and activate a virtual environment.
2. Install dependencies with `python -m pip install -r requirements.txt`.
3. Copy `.env.example` to `.env` and replace its placeholders. Never commit
   `.env`.
4. Create the configured PostgreSQL database.
5. Apply migrations with `python -m alembic upgrade head`.
6. Seed the demo data with `python -m scripts.seed_database`.
7. Start the API with `python -m uvicorn backend.app.main:app --reload`.

The API documentation is available at `http://127.0.0.1:8000/docs` and health
at `http://127.0.0.1:8000/api/v1/health`.

## Demo data

`data/demo_executions.csv` contains 25,000 deterministic synthetic Accounts
Payable executions. Regenerate it from the repository root with:

```bash
python -m scripts.generate_demo_data
```

## Validation

Run the business-logic tests without requiring a live database:

```bash
python -m pytest -v
python -m compileall backend scripts
python -c "from backend.app.main import app; print(app.title)"
python -m alembic heads
```

Database-dependent migration, seeding, and endpoint workflows require the
PostgreSQL instance configured by `DATABASE_URL`.
