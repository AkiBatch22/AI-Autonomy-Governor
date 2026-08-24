import logging

from fastapi import APIRouter, Depends, HTTPException

from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from backend.app.core.database import get_db

from backend.app.models.agent import Agent
from backend.app.models.policy import Policy
from backend.app.models.simulation import Simulation

from backend.app.schemas.agent import (
    AgentCreate,
    AgentResponse,
)

from backend.app.schemas.policy import (
    PolicyCreate,
    PolicyResponse,
    RecommendationRequest,
    SimulationRequest,
    SimulationResponse,
)

from backend.app.services.execution_store import (
    get_agent_execution_dataframe,
)

from backend.app.services.metrics import (
    build_metrics_snapshot,
)

from backend.app.services.persistence import (
    save_policy_with_backtest,
    save_simulation,
)

from backend.app.services.recommendations import (
    get_top_policies,
    recommend_policy,
)

from backend.app.services.simulator import (
    simulate_policy,
)


logger = logging.getLogger(__name__)


router = APIRouter(
    prefix="/agents",
    tags=["Agents"],
)


def get_agent_or_404(
    agent_id: int,
    db: Session,
) -> Agent:

    agent = db.get(
        Agent,
        agent_id,
    )

    if agent is None:
        raise HTTPException(
            status_code=404,
            detail="Agent not found.",
        )

    return agent


def get_execution_data_or_404(
    agent_id: int,
    db: Session,
):

    try:
        return get_agent_execution_dataframe(
            db=db,
            agent_id=agent_id,
        )

    except ValueError as exc:

        raise HTTPException(
            status_code=404,
            detail=str(exc),
        ) from exc


# =========================================================
# AGENTS
# =========================================================


@router.post(
    "",
    response_model=AgentResponse,
    status_code=201,
)
def create_agent(
    request: AgentCreate,
    db: Session = Depends(get_db),
):

    agent = Agent(
        name=request.name,
        department=request.department,
        workflow=request.workflow,
    )

    try:

        db.add(agent)
        db.commit()
        db.refresh(agent)

    except SQLAlchemyError as exc:

        db.rollback()

        logger.exception(
            "Failed to create agent"
        )

        raise HTTPException(
            status_code=500,
            detail="Unable to create agent.",
        ) from exc

    return agent


@router.get(
    "",
    response_model=list[AgentResponse],
)
def list_agents(
    db: Session = Depends(get_db),
):

    return db.scalars(
        select(Agent)
        .order_by(
            Agent.created_at.desc()
        )
    ).all()


@router.get(
    "/{agent_id}",
    response_model=AgentResponse,
)
def get_agent(
    agent_id: int,
    db: Session = Depends(get_db),
):

    return get_agent_or_404(
        agent_id,
        db,
    )


# =========================================================
# METRICS
# =========================================================


@router.get(
    "/{agent_id}/metrics"
)
def get_agent_metrics(
    agent_id: int,
    db: Session = Depends(get_db),
):

    get_agent_or_404(
        agent_id,
        db,
    )

    df = get_execution_data_or_404(
        agent_id,
        db,
    )

    return build_metrics_snapshot(
        df
    )


# =========================================================
# POLICY SIMULATOR
# =========================================================


@router.post(
    "/{agent_id}/simulate"
)
def simulate_agent_policy(
    agent_id: int,
    request: SimulationRequest,
    db: Session = Depends(get_db),
):

    get_agent_or_404(
        agent_id,
        db,
    )

    df = get_execution_data_or_404(
        agent_id,
        db,
    )

    try:

        result = simulate_policy(
            df=df,
            confidence_threshold=(
                request.confidence_threshold
            ),
            max_transaction_value=(
                request.max_transaction_value
            ),
            max_error_rate=(
                request.max_error_rate
            ),
        )

    except ValueError as exc:

        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc


    try:

        save_simulation(
            db=db,
            agent_id=agent_id,
            confidence_threshold=(
                request.confidence_threshold
            ),
            max_transaction_value=(
                request.max_transaction_value
            ),
            max_error_rate=(
                request.max_error_rate
            ),
            result=result,
        )

    except SQLAlchemyError as exc:

        logger.exception(
            "Failed to persist simulation for agent %s",
            agent_id,
        )

        raise HTTPException(
            status_code=500,
            detail=(
                "Simulation completed but its "
                "history could not be saved."
            ),
        ) from exc

    return result


# =========================================================
# GOVERNOR RECOMMENDATIONS
# =========================================================


@router.post(
    "/{agent_id}/recommend"
)
def recommend_agent_policy(
    agent_id: int,
    request: RecommendationRequest,
    db: Session = Depends(get_db),
):

    get_agent_or_404(
        agent_id,
        db,
    )

    df = get_execution_data_or_404(
        agent_id,
        db,
    )

    try:

        result = recommend_policy(
            df=df,
            max_error_rate=(
                request.max_error_rate
            ),
            minimum_sample_size=(
                request.minimum_sample_size
            ),
        )

    except ValueError as exc:

        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc


    if result is None:

        raise HTTPException(
            status_code=404,
            detail=(
                "No safe autonomy policy "
                "was found."
            ),
        )

    return result


@router.get(
    "/{agent_id}/recommendations/top"
)
def get_agent_top_policies(
    agent_id: int,
    max_error_rate: float = 0.005,
    top_n: int = 5,
    db: Session = Depends(get_db),
):

    get_agent_or_404(
        agent_id,
        db,
    )


    if not 0 <= max_error_rate <= 1:

        raise HTTPException(
            status_code=400,
            detail=(
                "max_error_rate must be "
                "between 0 and 1."
            ),
        )


    if not 1 <= top_n <= 20:

        raise HTTPException(
            status_code=400,
            detail=(
                "top_n must be "
                "between 1 and 20."
            ),
        )


    df = get_execution_data_or_404(
        agent_id,
        db,
    )


    return get_top_policies(
        df=df,
        max_error_rate=max_error_rate,
        top_n=top_n,
    )


# =========================================================
# SAVED POLICIES
# =========================================================


@router.post(
    "/{agent_id}/policies",
    response_model=PolicyResponse,
    status_code=201,
)
def create_saved_policy(
    agent_id: int,
    request: PolicyCreate,
    db: Session = Depends(get_db),
):

    get_agent_or_404(
        agent_id,
        db,
    )


    df = get_execution_data_or_404(
        agent_id,
        db,
    )


    try:

        result = simulate_policy(
            df=df,
            confidence_threshold=(
                request.minimum_confidence
            ),
            max_transaction_value=(
                request.maximum_transaction_value
            ),
            max_error_rate=(
                request.maximum_error_rate
            ),
        )

    except ValueError as exc:

        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc


    if result["risk"]["status"] != "pass":

        raise HTTPException(
            status_code=400,
            detail=(
                "Policy exceeds the configured "
                "maximum error rate."
            ),
        )


    try:

        return save_policy_with_backtest(
            db=db,
            agent_id=agent_id,
            name=request.name,
            minimum_confidence=(
                request.minimum_confidence
            ),
            maximum_transaction_value=(
                request.maximum_transaction_value
            ),
            maximum_error_rate=(
                request.maximum_error_rate
            ),
            result=result,
        )

    except SQLAlchemyError as exc:

        logger.exception(
            "Failed to save policy for agent %s",
            agent_id,
        )

        raise HTTPException(
            status_code=500,
            detail=(
                "Unable to save policy and "
                "supporting backtest."
            ),
        ) from exc


@router.get(
    "/{agent_id}/policies",
    response_model=list[PolicyResponse],
)
def list_agent_policies(
    agent_id: int,
    db: Session = Depends(get_db),
):

    get_agent_or_404(
        agent_id,
        db,
    )


    return db.scalars(
        select(Policy)
        .where(
            Policy.agent_id == agent_id
        )
        .order_by(
            Policy.created_at.desc()
        )
    ).all()


# =========================================================
# POLICY ACTIVATION
# =========================================================


@router.patch(
    "/{agent_id}/policies/{policy_id}/activate",
    response_model=PolicyResponse,
)
def activate_policy(
    agent_id: int,
    policy_id: int,
    db: Session = Depends(get_db),
):

    # Make sure the AI employee exists.
    get_agent_or_404(
        agent_id,
        db,
    )


    # Only allow activation of a policy
    # belonging to this AI employee.
    policy = db.scalar(
        select(Policy)
        .where(
            Policy.id == policy_id,
            Policy.agent_id == agent_id,
        )
    )


    if policy is None:

        raise HTTPException(
            status_code=404,
            detail="Policy not found for this agent.",
        )


    try:

        # Find every policy belonging
        # to this AI employee.
        policies = db.scalars(
            select(Policy)
            .where(
                Policy.agent_id == agent_id
            )
        ).all()


        for existing_policy in policies:

            # Selected policy becomes active.
            if existing_policy.id == policy_id:

                existing_policy.status = "active"

            # Any previously active policy
            # becomes retired.
            elif existing_policy.status == "active":

                existing_policy.status = "retired"


        db.commit()
        db.refresh(policy)


    except SQLAlchemyError as exc:

        db.rollback()

        logger.exception(
            "Failed to activate policy %s "
            "for agent %s",
            policy_id,
            agent_id,
        )

        raise HTTPException(
            status_code=500,
            detail="Unable to activate policy.",
        ) from exc


    return policy


# =========================================================
# SIMULATION HISTORY
# =========================================================


@router.get(
    "/{agent_id}/simulations",
    response_model=list[SimulationResponse],
)
def list_agent_simulations(
    agent_id: int,
    db: Session = Depends(get_db),
):

    get_agent_or_404(
        agent_id,
        db,
    )


    return db.scalars(
        select(Simulation)
        .where(
            Simulation.agent_id == agent_id
        )
        .order_by(
            Simulation.created_at.desc()
        )
    ).all()