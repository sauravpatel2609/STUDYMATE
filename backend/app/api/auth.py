from fastapi import APIRouter, HTTPException, status,Depends
from datetime import datetime
from app.models.user import UserCreate, UserLogin, Token
from app.core.security import get_password_hash, verify_password, create_access_token,get_current_user
from app.db.mongodb import db

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=Token)
async def register(user: UserCreate):
    print(f"\n Registration attempt: {user.email}")
    
    database = db.get_db()
    users_collection = database["users"]
    
    existing_user = await users_collection.find_one({"email": user.email})
    if existing_user:
        print(f" User already exists: {user.email}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    hashed_password = get_password_hash(user.password)
    print(f" Password hashed")
    
    user_document = {
        "email": user.email,
        "username": user.username,
        "hashed_password": hashed_password,
        "created_at": datetime.utcnow(),
        "is_active": True
    }
    
    result = await users_collection.insert_one(user_document)
    print(f" User saved with ID: {result.inserted_id}")
    
    access_token = create_access_token(data={"sub": user.email})
    print(f" Token created")
    
    print(f" Registration successful: {user.email}")
    
    return {
        "access_token": access_token,
        "token_type": "bearer"
    }

@router.post("/login", response_model=Token)
async def login(credentials: UserLogin):
    
    print(f"\n Login attempt: {credentials.email}")
    
    database = db.get_db()
    users_collection = database["users"]
    
    user = await users_collection.find_one({"email": credentials.email})
    
    if not user:
        print(f" User not found: {credentials.email}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not verify_password(credentials.password, user["hashed_password"]):
        print(f" Invalid password for: {credentials.email}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    print(f" Password verified")
    
    access_token = create_access_token(data={"sub": credentials.email})
    print(f" Token created")
    
    print(f" Login successful: {credentials.email}")
    
    return {
        "access_token": access_token,
        "token_type": "bearer"
    }

@router.get("/me")
async def get_current_user_info(current_user: str = Depends(get_current_user)):
    return {"email": current_user}