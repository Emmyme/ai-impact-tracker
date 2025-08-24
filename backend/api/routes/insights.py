from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from core.database import get_db

router = APIRouter()

@router.get("/")
def get_insights(db: Session = Depends(get_db)):
    return {"message": "Insights endpoint - coming soon"}
