from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class ChatRequest(BaseModel):
    message: str
    document_ids: Optional[List[str]] = None  # Which docs to search (optional)

class ChatResponse(BaseModel):
    answer: str
    sources: List[str]  # Which documents were used
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class DocumentInfo(BaseModel):
    id: str = Field(alias="_id")
    filename: str
    upload_date: datetime
    num_chunks: int
    
    class Config:
        populate_by_name = True