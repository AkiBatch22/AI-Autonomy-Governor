from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class SimulationRequest(BaseModel):
    confidence_threshold: float = Field(
        ge=0,
        le=1,
        examples=[0.88],
    )

    max_transaction_value: float = Field(
        gt=0,
        examples=[100000],
    )

    max_error_rate: float = Field(
        ge=0,
        le=1,
        examples=[0.005],
    )


class RecommendationRequest(BaseModel):
    max_error_rate: float = Field(
        ge=0,
        le=1,
        examples=[0.005],
    )

    minimum_sample_size: int = Field(
        default=100,
        gt=0,
    )

class PolicyCreate(BaseModel):

    model_config = ConfigDict(str_strip_whitespace=True)

    name: str = Field(
        min_length=1,
        max_length=150,
    )

    minimum_confidence: float = Field(
        ge=0,
        le=1,
    )

    maximum_transaction_value: float = Field(
        gt=0,
    )

    maximum_error_rate: float = Field(
        ge=0,
        le=1,
    )


class PolicyResponse(BaseModel):

    model_config = ConfigDict(
        from_attributes=True
    )

    id: int
    agent_id: int

    name: str

    minimum_confidence: float
    maximum_transaction_value: float
    maximum_error_rate: float

    status: str

    created_at: datetime


class SimulationResponse(BaseModel):

    model_config = ConfigDict(
        from_attributes=True
    )

    id: int
    agent_id: int
    policy_id: int | None

    confidence_threshold: float
    max_transaction_value: float
    max_error_rate: float

    current_autonomy_rate: float
    current_error_rate: float

    proposed_autonomy_rate: float
    proposed_accuracy: float
    proposed_error_rate: float

    autonomous_tasks: int
    human_reviews: int

    autonomy_change: float
    human_reviews_saved: int

    risk_status: str

    created_at: datetime
