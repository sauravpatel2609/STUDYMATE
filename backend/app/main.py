from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import auth, documents, chat
from app.db.mongodb import db
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("\n Starting StudyMate API...")
    await db.connect_db()
    print("All systems ready!\n")
    
    yield
    
    # Shutdown
    print("\n Shutting down StudyMate API...")
    await db.close_db()
    print(" Cleanup complete\n")

# Create FastAPI app
app = FastAPI(
    title="StudyMate API",
    description="AI-powered study assistant with RAG using Groq",
    version="1.0.0",
    lifespan=lifespan
)

allowed_origins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "https://study.vercel.app",
]

# CORS middleware (allows frontend to call API)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Change to specific origins in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(documents.router)
app.include_router(chat.router)

@app.get("/")
async def root():
    """Root endpoint - API info"""
    return {
        "message": "Welcome to StudyMate API!",
        "version": "1.0.0",
        "docs": "/docs",
        "status": "running"
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "database": "connected",
        "rag": "initialized"
    }