from pathlib import Path

import pandas as pd
from sqlalchemy import delete, insert, select

from backend.app.core.database import SessionLocal
from backend.app.models.agent import Agent
from backend.app.models.execution import Execution


PROJECT_ROOT = Path(__file__).resolve().parents[1]

CSV_PATH = (
    PROJECT_ROOT
    / "data"
    / "demo_executions.csv"
)


def parse_bool(value):
    """
    Safely convert CSV boolean values to Python bool.
    """

    if isinstance(value, bool):
        return value

    value = str(value).strip().lower()

    if value == "true":
        return True

    if value == "false":
        return False

    raise ValueError(
        f"Invalid boolean value: {value}"
    )


def seed_database():

    print("Loading execution data...")

    df = pd.read_csv(CSV_PATH)

    print(
        f"Loaded {len(df):,} execution records."
    )

    # PostgreSQL column uses timezone-aware timestamps.
    df["timestamp"] = pd.to_datetime(
        df["timestamp"],
        utc=True,
    )

    db = SessionLocal()

    try:

        # ----------------------------------
        # 1. FIND OR CREATE AI EMPLOYEE
        # ----------------------------------

        agent = db.scalar(
            select(Agent).where(
                Agent.name
                == "Accounts Payable AI"
            )
        )

        if agent is None:

            print(
                "Creating Accounts Payable AI..."
            )

            agent = Agent(
                name="Accounts Payable AI",
                department="Finance",
                workflow="Invoice Processing",
            )

            db.add(agent)
            db.flush()

            print(
                f"Created agent with ID "
                f"{agent.id}."
            )

        else:

            print(
                f"Agent already exists "
                f"with ID {agent.id}."
            )

        # ----------------------------------
        # 2. REMOVE PREVIOUS DEMO EXECUTIONS
        # ----------------------------------

        print(
            "Removing existing demo executions..."
        )

        db.execute(
            delete(Execution).where(
                Execution.agent_id
                == agent.id
            )
        )

        # ----------------------------------
        # 3. CONVERT DATAFRAME → DB RECORDS
        # ----------------------------------

        print(
            "Preparing execution records..."
        )

        records = []

        for row in df.itertuples(
            index=False
        ):

            record = {

                "agent_id":
                    agent.id,

                "external_task_id":
                    row.task_id,

                "timestamp":
                    row.timestamp.to_pydatetime(),

                "workflow_type":
                    row.workflow_type,

                "confidence":
                    float(row.confidence),

                "amount":
                    float(row.amount),

                "vendor_id":
                    row.vendor_id,

                "vendor_type":
                    row.vendor_type,

                "risk_level":
                    row.risk_level,

                "human_reviewed":
                    parse_bool(
                        row.human_reviewed
                    ),

                "ai_decision":
                    row.ai_decision,

                "final_decision":
                    row.final_decision,

                "correct":
                    parse_bool(
                        row.correct
                    ),

                "processing_time_seconds":
                    int(
                        row.processing_time_seconds
                    ),

                "exception_type":
                    row.exception_type,
            }

            records.append(record)

        # ----------------------------------
        # 4. INSERT IN BATCHES
        # ----------------------------------

        BATCH_SIZE = 1000

        print(
            "Inserting executions..."
        )

        for start in range(
            0,
            len(records),
            BATCH_SIZE,
        ):

            batch = records[
                start:
                start + BATCH_SIZE
            ]

            db.execute(
                insert(Execution),
                batch,
            )

            print(
                f"Inserted "
                f"{min(start + BATCH_SIZE, len(records)):,}"
                f"/{len(records):,}"
            )

        db.commit()

        print()
        print(
            "Database seeding completed successfully!"
        )

        print(
            f"Agent ID: {agent.id}"
        )

        print(
            f"Executions inserted: "
            f"{len(records):,}"
        )

    except Exception:

        db.rollback()

        print(
            "Database seeding failed."
        )

        raise

    finally:

        db.close()


if __name__ == "__main__":

    seed_database()
