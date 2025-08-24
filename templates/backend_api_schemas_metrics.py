from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class MetricBase(BaseModel):
    project: str
    energy_consumed: float
    emissions: float
    duration: float
    environment: str = "development"
    water_usage: Optional[float] = None
    gpu_energy: Optional[float] = None
    cpu_energy: Optional[float] = None

class MetricCreate(MetricBase):
    pass

class MetricResponse(MetricBase):
    id: int
    timestamp: datetime
    user_id: Optional[int] = None

    class Config:
        from_attributes = True
