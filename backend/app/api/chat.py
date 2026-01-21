from fastapi import APIRouter, Depends, HTTPException
from app.core.security import get_current_user
from app.models.chat import ChatRequest, ChatResponse
from app.core.rag import rag
from app.db.mongodb import db
from datetime import datetime

router = APIRouter(prefix="/chat", tags=["Chat"])

@router.post("/query", response_model=ChatResponse)
async def chat_query(
    request: ChatRequest,
    current_user: str = Depends(get_current_user)
):
    print(f"\n💬 Chat query from: {current_user}")
    print(f"❓ Question: {request.message}")
    
    try:
        # Step 1: Query RAG system
        answer, sources = rag.query(
            user_id=current_user,
            question=request.message,
            document_ids=request.document_ids
        )
        
        print(f" Answer generated from {len(sources)} sources")
        
        # Step 2: Save to chat history
        database = db.get_db()
        chat_collection = database["chat_history"]
        
        chat_entry = {
            "user_id": current_user,
            "question": request.message,
            "answer": answer,
            "sources": sources,
            "document_ids": request.document_ids,
            "timestamp": datetime.utcnow()
        }
        
        await chat_collection.insert_one(chat_entry)
        print(f" Saved to chat history")
        
        # Step 3: Return response
        return ChatResponse(
            answer=answer,
            sources=sources,
            timestamp=datetime.utcnow()
        )
    
    except Exception as e:
        print(f"❌ Error: {e}")
        raise HTTPException(
            status_code=500, 
            detail=f"Error processing query: {str(e)}"
        )

@router.get("/history")
async def get_chat_history(
    current_user: str = Depends(get_current_user),
    limit: int = 50
):
   
    print(f"\n Chat history request from: {current_user}")
    
    database = db.get_db()
    chat_collection = database["chat_history"]
    
    # Find chat history, sorted by newest first
    cursor = chat_collection.find(
        {"user_id": current_user}
    ).sort("timestamp", -1).limit(limit)
    
    history = await cursor.to_list(length=limit)
    
    # Convert ObjectId to string for JSON serialization
    for item in history:
        item["_id"] = str(item["_id"])
    
    print(f" Found {len(history)} messages")
    
    return history