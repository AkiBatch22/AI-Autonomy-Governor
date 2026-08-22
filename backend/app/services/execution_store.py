import pandas as pd
from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.app.models.execution import Execution


def get_agent_execution_dataframe(
    db: Session,
    agent_id: int,
) -> pd.DataFrame:
    """
    Load one AI employee's execution history
    from PostgreSQL and return it as a Pandas DataFrame.
    """

    executions = db.scalars(
        select(Execution)
        .where(
            Execution.agent_id == agent_id
        )
        .order_by(
            Execution.timestamp
        )
    ).all()

    if not executions:
        raise ValueError(
            f"No executions found for agent_id={agent_id}"
        )

    records = []

    for execution in executions:

        records.append(
            {
                "task_id":
                    execution.external_task_id,

                "timestamp":
                    execution.timestamp,

                "workflow_type":
                    execution.workflow_type,

                "confidence":
                    execution.confidence,

                "amount":
                    execution.amount,

                "vendor_id":
                    execution.vendor_id,

                "vendor_type":
                    execution.vendor_type,

                "risk_level":
                    execution.risk_level,

                "human_reviewed":
                    execution.human_reviewed,

                "ai_decision":
                    execution.ai_decision,

                "final_decision":
                    execution.final_decision,

                "correct":
                    execution.correct,

                "processing_time_seconds":
                    execution.processing_time_seconds,

                "exception_type":
                    execution.exception_type,
            }
        )

    return pd.DataFrame(records)