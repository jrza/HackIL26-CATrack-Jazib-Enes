from enum import Enum
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class MachineType(str, Enum):
    EXCAVATOR = "EXCAVATOR"
    WHEEL_LOADER = "WHEEL_LOADER"
    BULLDOZER = "BULLDOZER"
    MOTOR_GRADER = "MOTOR_GRADER"
    COMPACTOR = "COMPACTOR"
    OTHER = "OTHER"


class Machine(BaseModel):
    model_config = ConfigDict(protected_namespaces=())

    asset_id: str
    name: str
    machine_type: MachineType
    serial_number: Optional[str] = None
    model_number: Optional[str] = None
    last_inspection_date: Optional[datetime] = None
    inspection_template_id: Optional[str] = None
    location: Optional[str] = None


class InspectionTemplate(BaseModel):
    id: str
    name: str
    checkpoints: list[str]
