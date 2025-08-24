#!/usr/bin/env python3
"""
Initialize the database with default users.
Run this script to create the database tables and add default users.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from core.database.database import engine, get_db, Base
from core.security import get_password_hash
from core.database.models import User
from sqlalchemy.orm import Session

def create_default_users():
    """Create default users in the database."""
    # Create all tables first
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    
    db = next(get_db())
    
    # Check if users already exist
    existing_admin = db.query(User).filter(User.username == "admin").first()
    if existing_admin:
        print("Default users already exist. Skipping user creation.")
        return
    
    # Create default users
    default_users = [
        {
            "username": "admin",
            "email": "admin@example.com",
            "full_name": "System Administrator",
            "role": "admin",
            "hashed_password": get_password_hash("admin123"),
            "is_active": True,
            "needs_password_setup": False
        },
        {
            "username": "developer",
            "email": "developer@example.com",
            "full_name": "AI Developer",
            "role": "developer",
            "hashed_password": get_password_hash("dev123"),
            "is_active": True,
            "needs_password_setup": False
        },
        {
            "username": "manager",
            "email": "manager@example.com",
            "full_name": "Project Manager",
            "role": "manager",
            "hashed_password": get_password_hash("manager123"),
            "is_active": True,
            "needs_password_setup": False
        }
    ]
    
    for user_data in default_users:
        user = User(**user_data)
        db.add(user)
    
    db.commit()
    print("Default users created successfully!")
    print("Admin: admin / admin123")
    print("Developer: developer / dev123")
    print("Manager: manager / manager123")

if __name__ == "__main__":
    create_default_users()
