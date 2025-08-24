#!/usr/bin/env python3
"""
Database initialization script
Creates the database and tables for the AI Sustainability Dashboard

"""

import os
from core.database.database import engine, Base
from core.database.models import Project, Team, Metric

def init_database():

    print("Initializing database...")
    
    # Create data directory
    os.makedirs("./data", exist_ok=True)
    
    # Create all tables
    Base.metadata.create_all(bind=engine)
    
    print("Database initialized successfully!")
    print("Database file: ./data/sustainability.db")

if __name__ == "__main__":
    init_database()
