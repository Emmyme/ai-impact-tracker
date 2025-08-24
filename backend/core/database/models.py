from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base

class Project(Base):
    __tablename__ = "projects"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    metrics = relationship("Metric", back_populates="project")
    teams = relationship("Team", back_populates="project")

class Team(Base):
    __tablename__ = "teams"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    project = relationship("Project", back_populates="teams")
    metrics = relationship("Metric", back_populates="team")

class Metric(Base):
    __tablename__ = "metrics"
    
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"))
    team_id = Column(Integer, ForeignKey("teams.id"), nullable=True)
    
    # Environmental metrics
    energy_consumed = Column(Float)  # kWh
    emissions = Column(Float)  # kg CO2
    duration = Column(Float)  # seconds
    gpu_energy = Column(Float, nullable=True)  # kWh
    cpu_energy = Column(Float, nullable=True)  # kWh
    water_usage = Column(Float, nullable=True)  # liters
    
    # Metadata
    environment = Column(String, default="development")
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    project = relationship("Project", back_populates="metrics")
    team = relationship("Team", back_populates="metrics")
