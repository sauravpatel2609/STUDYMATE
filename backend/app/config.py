from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # API Keys
    GROQ_API_KEY: str  # Changed from OPENAI_API_KEY
    
    # MongoDB
    MONGODB_URL: str = "mongodb://localhost:27017"
    DATABASE_NAME: str = "studymate"
    
    # Security (for JWT)
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # Storage
    UPLOAD_DIR: str = "./uploads"
    CHROMA_DIR: str = "./chroma_db"
    
    # Model settings
    GROQ_MODEL: str = "llama-3.1-70b-versatile"  # Fast and powerful!
    EMBEDDING_MODEL: str = "all-MiniLM-L6-v2"  # Local embeddings
    
    class Config:
        env_file = ".env"

# Create global settings instance
settings = Settings()