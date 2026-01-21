from sentence_transformers import SentenceTransformer
from pypdf import PdfReader
from langchain.text_splitter import RecursiveCharacterTextSplitter
import chromadb
from chromadb.config import Settings as ChromaSettings
from groq import Groq
from app.config import settings
import os
from typing import List, Tuple

class RAGPipeline:
   
    
    def __init__(self):
        # Initialize embedding model (local, FREE!)
        print(f"Loading embedding model: {settings.EMBEDDING_MODEL}")
        self.embedding_model = SentenceTransformer(settings.EMBEDDING_MODEL)
        print(" Embedding model loaded")
        
        # Initialize Groq client
        self.groq_client = Groq(api_key=settings.GROQ_API_KEY)
        
        # Text splitter for chunking
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,  # Characters per chunk
            chunk_overlap=200,  # Overlap to preserve context
            length_function=len,
        )
        
        # Create ChromaDB client
        os.makedirs(settings.CHROMA_DIR, exist_ok=True)
        self.chroma_client = chromadb.PersistentClient(
            path=settings.CHROMA_DIR,
            settings=ChromaSettings(anonymized_telemetry=False)
        )
        
        print("✅ RAG Pipeline initialized")
    
    def _extract_text_from_pdf(self, file_path: str) -> str:
        
        reader = PdfReader(file_path)
        text = ""
        
        for page_num, page in enumerate(reader.pages):
            text += page.extract_text()
        
        return text
    
    def _create_embeddings(self, texts: List[str]) -> List[List[float]]:

        embeddings = self.embedding_model.encode(texts)
        return embeddings.tolist()  # Convert numpy array to list
    
    def process_pdf(
        self, 
        file_path: str, 
        user_id: str, 
        document_id: str
    ) -> int:
        
        print(f"\n Processing PDF: {file_path}")
        
        # Step 1: Extract text
        text = self._extract_text_from_pdf(file_path)
        print(f" Extracted {len(text)} characters")
        
        # Step 2: Split into chunks
        chunks = self.text_splitter.split_text(text)
        print(f" Created {len(chunks)} chunks")
        
        # Step 3: Create embeddings
        print("Creating embeddings...")
        embeddings = self._create_embeddings(chunks)
        print(f"Created {len(embeddings)} embeddings")
        
        # Step 4: Store in ChromaDB
        # Get or create collection for this user
        collection_name = f"user_{user_id.replace('@', '_').replace('.', '_')}"
        
        try:
            collection = self.chroma_client.get_collection(collection_name)
        except:
            collection = self.chroma_client.create_collection(
                name=collection_name,
                metadata={"user_id": user_id}
            )
        
        # Add chunks to collection
        ids = [f"{document_id}_chunk_{i}" for i in range(len(chunks))]
        metadatas = [
            {
                "document_id": document_id,
                "chunk_index": i,
                "user_id": user_id
            }
            for i in range(len(chunks))
        ]
        
        collection.add(
            documents=chunks,
            embeddings=embeddings,
            metadatas=metadatas,
            ids=ids
        )
        
        print(f" Stored in vector database (collection: {collection_name})")
        
        return len(chunks)
    
    def query(
        self, 
        user_id: str, 
        question: str, 
        document_ids: List[str] = None,
        top_k: int = 3
    ) -> Tuple[str, List[str]]:
       
        print(f"\n❓ Query: {question}")
        
        # Step 1: Create question embedding
        question_embedding = self._create_embeddings([question])[0]
        
        # Step 2: Get user's collection
        collection_name = f"user_{user_id.replace('@', '_').replace('.', '_')}"
        
        try:
            collection = self.chroma_client.get_collection(collection_name)
        except:
            raise Exception(f"No documents found for user {user_id}")
        
        # Step 3: Search for similar chunks
        where_filter = None
        if document_ids:
            where_filter = {"document_id": {"$in": document_ids}}
        
        results = collection.query(
            query_embeddings=[question_embedding],
            n_results=top_k,
            where=where_filter
        )
        
        # Extract chunks and sources
        chunks = results['documents'][0]
        metadatas = results['metadatas'][0]
        sources = list(set(meta['document_id'] for meta in metadatas))
        
        print(f"🔍 Found {len(chunks)} relevant chunks from {len(sources)} documents")
        
        # Step 4: Create context from chunks
        context = "\n\n".join(chunks)
        
        # Step 5: Generate answer with Groq
        print("🤖 Generating answer with Groq...")
        
        response = self.groq_client.chat.completions.create(
            model=settings.GROQ_MODEL,
            messages=[
                {
                    "role": "system",
                    "content": "You are a helpful study assistant. Answer questions based ONLY on the provided context. If the answer is not in the context, say so."
                },
                {
                    "role": "user",
                    "content": f"""Context from documents:
{context}

Question: {question}

Please provide a clear, accurate answer based on the context above."""
                }
            ],
            temperature=0.3,
            max_tokens=500
        )
        
        answer = response.choices[0].message.content
        print(f" Answer generated ({len(answer)} characters)")
        
        return answer, sources

# Global RAG instance
rag = RAGPipeline()