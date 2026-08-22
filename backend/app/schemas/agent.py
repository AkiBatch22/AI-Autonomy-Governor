from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class AgentCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    name: str = Field(min_length=1, max_length=150)
    department: str = Field(min_length=1, max_length=100)
    workflow: str = Field(min_length=1, max_length=150)


class AgentResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True
    )

    id: int
    name: str
    department: str
    workflow: str
    created_at: datetime
