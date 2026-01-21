from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from app.core.security import get_current_user
from app.db.mongodb import db
from app.core.rag import rag
from app.config import settings
from app.models.chat import DocumentInfo
import os
import shutil
from datetime import datetime
from typing import List

router = APIRouter(prefix="/documents", tags=["Documents"])

@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    current_user: str = Depends(get_current_user)
):
    print(f"\n Upload request from: {current_user}")
    print(f" File: {file.filename}")
    
    # Step 1: Validate file type
    if not file.filename.endswith('.pdf'):
        raise HTTPException(
            status_code=400, 
            detail="Only PDF files are allowed"
        )
    
    # Step 2: Create upload directory
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    
    # Step 3: Generate unique document ID
    document_id = f"{current_user}_{datetime.utcnow().timestamp()}"
    
    # Step 4: Save file to disk
    file_path = os.path.join(
        settings.UPLOAD_DIR, 
        f"{document_id}.pdf"
    )
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    print(f" File saved: {file_path}")
    
    # Step 5: Process with RAG pipeline
    try:
        num_chunks = rag.process_pdf(file_path, current_user, document_id)
        print(f" Processed into {num_chunks} chunks")
    except Exception as e:
        # Clean up file if processing fails
        if os.path.exists(file_path):
            os.remove(file_path)
        print(f"❌ Processing failed: {e}")
        raise HTTPException(
            status_code=500, 
            detail=f"Error processing PDF: {str(e)}"
        )
    
    # Step 6: Save metadata to MongoDB
    database = db.get_db()
    documents_collection = database["documents"]
    
    doc_metadata = {
        "_id": document_id,
        "user_id": current_user,
        "filename": file.filename,
        "upload_date": datetime.utcnow(),
        "num_chunks": num_chunks,
        "file_path": file_path
    }
    
    await documents_collection.insert_one(doc_metadata)
    print(f" Metadata saved to MongoDB")
    
    print(f" Upload complete: {document_id}")
    
    return {
        "message": "Document uploaded successfully",
        "document_id": document_id,
        "filename": file.filename,
        "chunks": num_chunks
    }

@router.get("/list", response_model=List[DocumentInfo])
async def list_documents(current_user: str = Depends(get_current_user)):
    
    print(f"\n List documents for: {current_user}")
    
    database = db.get_db()
    documents_collection = database["documents"]
    
    # Find all documents for this user
    cursor = documents_collection.find({"user_id": current_user})
    documents = await cursor.to_list(length=100)
    
    print(f" Found {len(documents)} documents")
    
    return documents

@router.delete("/{document_id}")
async def delete_document(
    document_id: str,
    current_user: str = Depends(get_current_user)
):
    print(f"\n Delete request: {document_id} by {current_user}")
    
    database = db.get_db()
    documents_collection = database["documents"]
    
    # Find document (ensure it belongs to current user)
    document = await documents_collection.find_one({
        "_id": document_id,
        "user_id": current_user
    })
    
    if not document:
        print(f" Document not found or unauthorized")
        raise HTTPException(
            status_code=404, 
            detail="Document not found"
        )
    
    # Delete file from disk
    if os.path.exists(document["file_path"]):
        os.remove(document["file_path"])
        print(f" File deleted: {document['file_path']}")
    
    # Delete from database
    await documents_collection.delete_one({"_id": document_id})
    print(f" Metadata deleted from MongoDB")
    
    # Note: We're not deleting from ChromaDB in this version
    # You could add that functionality here
    
    print(f" Document deleted: {document_id}")
    
    return {"message": "Document deleted successfully"}