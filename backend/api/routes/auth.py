from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from core.database.database import get_db
from core.security import (
    create_access_token, 
    get_password_hash,
    verify_password,
    require_auth,
    require_role,
    require_roles,
    ACCESS_TOKEN_EXPIRE_MINUTES,
    security
)
from api.models.user import User, UserRole
from api.schemas.user import UserCreate, UserLogin, Token, UserResponse, UserUpdate, PasswordSetup
from typing import List

router = APIRouter(tags=["authentication"])


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    db = next(get_db())
    return require_auth(db, credentials)

def get_admin_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    db = next(get_db())
    return require_role(db, credentials, "admin")

def get_admin_or_developer_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    db = next(get_db())
    return require_roles(db, credentials, ["admin", "developer"])

@router.post("/login", response_model=Token)
def login(user_credentials: UserLogin, db: Session = Depends(get_db)):

    user = db.query(User).filter(User.username == user_credentials.username).first()
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if user.needs_password_setup:
        pass
    else:
        if not verify_password(user_credentials.password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": UserResponse.from_orm(user)
    }

@router.post("/register", response_model=UserResponse)
def register_user(
    user: UserCreate, 
    current_user: User = Depends(get_admin_or_developer_user),
    db: Session = Depends(get_db)
):

    existing_user = db.query(User).filter(User.username == user.username).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )
    
    if user.email:
        existing_email = db.query(User).filter(User.email == user.email).first()
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
    
    db_user = User(
        username=user.username,
        email=user.email,
        full_name=user.full_name,
        hashed_password="",  # Empty password, user will set it on first login
        role=user.role,
        is_active=user.is_active,
        needs_password_setup=True
    )
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    return UserResponse.from_orm(db_user)

@router.get("/me", response_model=UserResponse)
def get_current_user_info(current_user: User = Depends(get_current_user)):

    return UserResponse.from_orm(current_user)

@router.get("/users", response_model=List[UserResponse])
def get_users(
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):

    users = db.query(User).all()
    return [UserResponse.from_orm(user) for user in users]

@router.put("/users/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    user_update: UserUpdate,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    if user_update.username is not None:
        user.username = user_update.username
    if user_update.email is not None:
        user.email = user_update.email
    if user_update.full_name is not None:
        user.full_name = user_update.full_name
    if user_update.role is not None:
        user.role = user_update.role
    if user_update.is_active is not None:
        user.is_active = user_update.is_active
    if user_update.password is not None:
        user.hashed_password = get_password_hash(user_update.password)
    
    db.commit()
    db.refresh(user)
    
    return UserResponse.from_orm(user)

@router.delete("/users/{user_id}")
def delete_user(
    user_id: int,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    db.delete(user)
    db.commit()
    
    return {"message": "User deleted successfully"}

@router.post("/setup-password", response_model=UserResponse)
def setup_password(
    password_data: PasswordSetup,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):

    current_user = require_auth(db, credentials)
    
    if not current_user.needs_password_setup:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password already set up"
        )
    
    current_user.hashed_password = get_password_hash(password_data.new_password)
    current_user.needs_password_setup = False
    
    db.commit()
    db.refresh(current_user)
    
    return UserResponse.from_orm(current_user)
