from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List
from core.database import get_db
from api.schemas.metrics import MetricCreate, Metric
from core.database.models import Metric as MetricModel, Project, Team

router = APIRouter()

@router.post("/", response_model=Metric)
def create_metric(metric: MetricCreate, db: Session = Depends(get_db)):
    
    project = db.query(Project).filter(Project.name == metric.project).first()
    if not project:
        project = Project(name=metric.project)
        db.add(project)
        db.commit()
        db.refresh(project)
    
    team = None
    if metric.team:
        team = db.query(Team).filter(Team.name == metric.team, Team.project_id == project.id).first()
        if not team:
            team = Team(name=metric.team, project_id=project.id)
            db.add(team)
            db.commit()
            db.refresh(team)
    
    db_metric = MetricModel(
        project_id=project.id,
        team_id=team.id if team else None,
        energy_consumed=metric.energy_consumed,
        emissions=metric.emissions,
        duration=metric.duration,
        gpu_energy=metric.gpu_energy,
        cpu_energy=metric.cpu_energy,
        water_usage=metric.water_usage,
        environment=metric.environment
    )
    db.add(db_metric)
    db.commit()
    db.refresh(db_metric)
    return db_metric

@router.get("/", response_model=List[Metric])
def get_metrics(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    
    metrics = (
        db.query(MetricModel)
        .options(
            joinedload(MetricModel.project),
            joinedload(MetricModel.team)
        )
        .offset(skip)
        .limit(limit)
        .all()
    )
    
    result = []
    for metric in metrics:
        metric_dict = {
            "id": metric.id,
            "project_id": metric.project_id,
            "team_id": metric.team_id,
            "project": metric.project.name if metric.project else "Unknown",
            "team": metric.team.name if metric.team else None,
            "energy_consumed": metric.energy_consumed,
            "emissions": metric.emissions,
            "duration": metric.duration,
            "gpu_energy": metric.gpu_energy,
            "cpu_energy": metric.cpu_energy,
            "water_usage": metric.water_usage,
            "environment": metric.environment,
            "timestamp": metric.timestamp
        }
        result.append(Metric(**metric_dict))
    
    return result
