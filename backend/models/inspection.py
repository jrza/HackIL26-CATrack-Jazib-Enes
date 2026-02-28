from enum import Enum
from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class InspectionStatus(str, Enum):
    ACTIVE = "ACTIVE"
    COMPLETED = "COMPLETED"
    ABANDONED = "ABANDONED"


class InspectionSession(BaseModel):
    id: str
    asset_id: str
    operator_id: Optional[str] = None
    status: InspectionStatus
    started_at: datetime
    completed_at: Optional[datetime] = None
    template_id: Optional[str] = None


class InspectionCreate(BaseModel):
    asset_id: str
    operator_id: Optional[str] = None


class InspectionUpdate(BaseModel):
    status: Optional[InspectionStatus] = None
    completed_at: Optional[datetime] = None
