from pydantic import BaseModel
from datetime import datetime

class TeamBase(BaseModel):
    name: str
    project_id: int

class TeamCreate(TeamBase):
    pass

class Team(TeamBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True