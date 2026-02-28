from enum import Enum
from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from .finding import Finding


class ReportStatus(str, Enum):
    DRAFT = "DRAFT"
    FINAL = "FINAL"


class Report(BaseModel):
    id: str
    inspection_id: str
    asset_id: str
    inspection_started_at: Optional[datetime] = None
    generated_at: datetime
    status: ReportStatus
    findings: list[Finding]
    total_findings: int
    summary: str
    critical_count: int
    moderate_count: int
    monitor_count: int
    pass_count: int
    pdf_url: Optional[str] = None
