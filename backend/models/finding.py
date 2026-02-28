from enum import Enum
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class Severity(str, Enum):
    PASS = "PASS"
    MONITOR = "MONITOR"
    MODERATE = "MODERATE"
    CRITICAL = "CRITICAL"


class Finding(BaseModel):
    id: str
    inspection_id: str
    component: str
    issue: str
    description: str
    severity: Severity
    confidence: float = Field(ge=0.0, le=1.0)
    recommended_action: str
    operational_impact: str
    timestamp: datetime
    image_url: Optional[str] = None
    voice_transcript: Optional[str] = None


class FindingCreate(BaseModel):
    inspection_id: str
    component: str
    voice_transcript: Optional[str] = None
    # Base64-encoded image from camera/glasses (plain base64 or data-URI prefix accepted).
    # image_url is kept for backwards-compat when a pre-uploaded URL is supplied instead.
    image_b64: Optional[str] = None
    image_url: Optional[str] = None


class FindingResponse(Finding):
    pass
