from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from core.database.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=True)
    full_name = Column(String, nullable=False)
    hashed_password = Column(String, nullable=True)  # Nullable for first-time setup
    role = Column(String, default="user", nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    needs_password_setup = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    metrics = relationship("Metric", back_populates="user")

class Metric(Base):
    __tablename__ = "metrics"

    id = Column(Integer, primary_key=True, index=True)
    project = Column(String, nullable=False, index=True)
    energy_consumed = Column(Float, nullable=False)  # in kWh
    emissions = Column(Float, nullable=False)  # in g CO2
    duration = Column(Float, nullable=False)  # in seconds
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    environment = Column(String, nullable=False, default="development")
    water_usage = Column(Float, nullable=True)  # in mL
    gpu_energy = Column(Float, nullable=True)  # in kWh
    cpu_energy = Column(Float, nullable=True)  # in kWh
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="metrics")
