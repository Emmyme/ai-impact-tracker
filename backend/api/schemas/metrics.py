from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class MetricBase(BaseModel):
    energy_consumed: float
    emissions: float
    duration: float
    gpu_energy: Optional[float] = None
    cpu_energy: Optional[float] = None
    water_usage: Optional[float] = None
    environment: str = "development"

class MetricCreate(MetricBase):
    project: str
    team: Optional[str] = None

class Metric(MetricBase):
    id: int
    project_id: int
    team_id: Optional[int] = None
    project: str
    team: Optional[str] = None
    timestamp: datetime

    class Config:
        from_attributes = True