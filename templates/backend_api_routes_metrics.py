from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timedelta
import random

from core.database import get_db
from core.database.models import Metric
from api.schemas.metrics import MetricCreate, MetricResponse
from api.routes.auth import get_current_user

router = APIRouter()

@router.get("/", response_model=List[MetricResponse])
async def get_metrics(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    metrics = db.query(Metric).filter(Metric.user_id == current_user.id).order_by(Metric.timestamp.desc()).all()
    return metrics

@router.post("/", response_model=MetricResponse)
async def create_metric(
    metric_data: MetricCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    db_metric = Metric(
        project=metric_data.project,
        energy_consumed=metric_data.energy_consumed,
        emissions=metric_data.emissions,
        duration=metric_data.duration,
        environment=metric_data.environment,
        water_usage=metric_data.water_usage,
        gpu_energy=metric_data.gpu_energy,
        cpu_energy=metric_data.cpu_energy,
        user_id=current_user.id
    )
    
    db.add(db_metric)
    db.commit()
    db.refresh(db_metric)
    
    return db_metric

@router.post("/generate-sample-data")
async def generate_sample_data(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    # Generate sample metrics data for testing.
    projects = ["image-classification", "nlp-model", "recommendation-system", "computer-vision"]
    environments = ["development", "production", "staging"]
    
    # Generate data for the last 30 days
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=30)
    
    sample_metrics = []
    
    for i in range(50):  # Generate 50 sample records
        # Random date 
        random_days = random.randint(0, 30)
        random_hours = random.randint(0, 23)
        random_minutes = random.randint(0, 59)
        
        timestamp = end_date - timedelta(
            days=random_days,
            hours=random_hours,
            minutes=random_minutes
        )
        
        energy_consumed = round(random.uniform(0.1, 10.0), 6)
        
        emissions = round(energy_consumed * 0.5, 6)
        
        # Duration in seconds
        duration = random.randint(1, 3600)
        
        # Water usage
        water_usage = round(random.uniform(0.1, 5.0), 6)
        
        gpu_ratio = random.uniform(0.6, 0.9)  # GPU typically uses more energy
        gpu_energy = round(energy_consumed * gpu_ratio, 6)
        cpu_energy = round(energy_consumed * (1 - gpu_ratio), 6)
        
        metric = Metric(
            project=random.choice(projects),
            energy_consumed=energy_consumed,
            emissions=emissions,
            duration=duration,
            timestamp=timestamp,
            environment=random.choice(environments),
            water_usage=water_usage,
            gpu_energy=gpu_energy,
            cpu_energy=cpu_energy,
            user_id=current_user.id
        )
        
        sample_metrics.append(metric)
    
    # Add to database
    db.add_all(sample_metrics)
    db.commit()
    
    return {"message": f"Generated {len(sample_metrics)} sample metrics"}
