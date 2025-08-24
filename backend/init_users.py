#!/usr/bin/env python3
"""
Initialize the database with default users.

"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from core.database.database import engine, get_db, Base
from api.models.user import User, UserRole
from core.security import get_password_hash

def create_default_users():
    # Create all tables first
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    
    db = next(get_db())
    
    # Check if users already exist
    existing_users = db.query(User).count()
    if existing_users > 0:
        print(f"Database already has {existing_users} users. Skipping initialization.")
        return
    
    # Default users
    default_users = [
        {
            "username": "admin",
            "password": "admin123",
            "full_name": "System Administrator",
            "email": "admin@company.com",
            "role": UserRole.ADMIN,
            "is_active": True
        },
        {
            "username": "developer",
            "password": "dev123",
            "full_name": "AI Developer",
            "email": "developer@company.com",
            "role": UserRole.DEVELOPER,
            "is_active": True
        }
    ]
    
    # Create users
    for user_data in default_users:
        hashed_password = get_password_hash(user_data["password"])
        user = User(
            username=user_data["username"],
            email=user_data["email"],
            full_name=user_data["full_name"],
            hashed_password=hashed_password,
            role=user_data["role"],
            is_active=user_data["is_active"],
            needs_password_setup=False  # Default users already have passwords
        )
        db.add(user)
        print(f"Created user: {user_data['username']} ({user_data['role'].value})")
    
    db.commit()
    print(f"\nSuccessfully created {len(default_users)} default users!")
    print("\nDefault credentials:")
    print("Admin: username=admin, password=admin123")
    print("Developer: username=developer, password=dev123")
    print("\nIMPORTANT: Change these passwords in production!")

if __name__ == "__main__":
    print("Initializing default users...")
    create_default_users()
    print("Done!")
