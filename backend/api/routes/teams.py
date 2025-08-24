from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from core.database import get_db
from api.schemas.teams import TeamCreate, Team
from core.database.models import Team as TeamModel

router = APIRouter()

@router.get("/", response_model=List[Team])
def get_teams(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    teams = db.query(TeamModel).offset(skip).limit(limit).all()
    return teams
