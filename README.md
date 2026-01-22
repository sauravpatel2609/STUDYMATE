# StudyMate - AI-Powered Study Assistant

StudyMate is an intelligent study companion that leverages RAG (Retrieval-Augmented Generation) and AI to help you learn more effectively. Upload your study materials, ask questions, and get accurate answers based on your documents.

##  Features

- **Document Management**: Upload and organize PDF study materials
- **RAG-Powered Q&A**: Ask questions and get answers grounded in your documents
- **Chat History**: Access previous conversations for reference
- **User Authentication**: Secure login and registration system
- **Vector Search**: Fast similarity-based document retrieval using Chroma
- **AI-Powered Responses**: Groq API for fast, intelligent answer generation
- **Responsive UI**: Beautiful dark/light theme support

##  Tech Stack

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type-safe development
- **Vite** - Lightning-fast build tool
- **Tailwind CSS** - Utility-first styling
- **ShadcnUI** - High-quality component library
- **Axios** - HTTP client
- **React Router** - Navigation
- **TanStack Query** - Data fetching

### Backend
- **FastAPI** - Modern Python web framework
- **MongoDB** - Document database
- **ChromaDB** - Vector database for embeddings
- **Groq API** - Fast LLM inference
- **Sentence Transformers** - Local embeddings
- **LangChain** - Text processing and splitting
- **PyPDF** - PDF document processing

## 🏗️ Project Structure

```
studymate/
├── frontend/                 # React + TypeScript frontend
│   ├── src/
│   │   ├── components/      # Reusable React components
│   │   ├── pages/           # Page components
│   │   ├── services/        # API integration
│   │   ├── contexts/        # React contexts (Auth, Theme)
│   │   ├── hooks/           # Custom React hooks
│   │   ├── types/           # TypeScript types
│   │   └── lib/             # Utility functions
│   └── package.json
│
└── backend/                  # FastAPI backend
    ├── app/
    │   ├── api/             # API routes (auth, chat, documents)
    │   ├── core/            # RAG pipeline and security
    │   ├── db/              # Database connections
    │   ├── models/          # Pydantic models
    │   ├── utils/           # Utility functions
    │   ├── config.py        # Configuration settings
    │   └── main.py          # FastAPI app initialization
    ├── chroma_db/           # Vector database storage
    ├── uploads/             # Uploaded PDF files
    └── run.py               # Entry point
```
##  Prerequisites

- **Node.js** 18+ and npm (or bun)
- **Python** 3.8+
- **MongoDB** (running locally or remote URL)
- **Groq API Key** (free at https://console.groq.com)

##  Installation & Setup

### Backend Setup

1. **Navigate to backend directory**
```bash
cd backend
```

2. **Create `.env` file**
```bash
GROQ_API_KEY=your_groq_api_key_here
MONGODB_URL=mongodb://localhost:27017
DATABASE_NAME=studymate
SECRET_KEY=your_secret_key_here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
UPLOAD_DIR=./uploads
CHROMA_DIR=./chroma_db
GROQ_MODEL=llama-3.1-70b-versatile
EMBEDDING_MODEL=all-MiniLM-L6-v2
```

3. **Install dependencies**
```bash
pip install -r requirements.txt
```

4. **Run the server**
```bash
python run.py
```
The backend will start on `http://localhost:8000`

### Frontend Setup

1. **Navigate to frontend directory**
```bash
cd frontend
```

2. **Install dependencies**
```bash
npm install
# or
bun install
```

3. **Start development server**
```bash
npm run dev
# or
bun run dev
```
The frontend will start on `http://localhost:8080`

## 🔌 API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login and get access token
- `GET /auth/me` - Get current user info

### Documents
- `POST /documents/upload` - Upload PDF document
- `GET /documents/list` - List user's documents
- `DELETE /documents/{document_id}` - Delete document

### Chat
- `POST /chat/query` - Ask a question about documents
- `GET /chat/history` - Get chat conversation history

### Health
- `GET /health` - Health check
- `GET /` - API info

##  Authentication

StudyMate uses JWT (JSON Web Tokens) for secure authentication:

1. User registers or logs in
2. Server returns an access token
3. Token is stored in localStorage (frontend)
4. Token is sent in `Authorization: Bearer <token>` header for protected routes
5. Token expires after 30 minutes (configurable)

##  How It Works

### RAG Pipeline

1. **Upload**: PDF documents are uploaded and stored
2. **Extract**: Text is extracted from PDFs
3. **Chunk**: Text is split into manageable chunks (1000 chars with 200 char overlap)
4. **Embed**: Each chunk is converted to embeddings using SentenceTransformers
5. **Store**: Embeddings are stored in ChromaDB with metadata
6. **Query**: User questions are embedded and matched against stored chunks
7. **Generate**: Groq LLM generates answers based on relevant chunks
8. **Return**: Answer and source documents are returned to user

##  Features Breakdown

### Authentication
- Secure password hashing with bcrypt
- JWT token-based authentication
- User registration and login
- Protected routes and endpoints

### Document Management
- Upload PDF files
- Automatic text extraction
- Chunking and embedding
- Vector storage in ChromaDB
- Document metadata in MongoDB

### Chat & Q&A
- Real-time question answering
- Multi-turn chat support
- Source attribution
- Chat history persistence
- Document-filtered queries

### User Experience
- Dark/Light theme toggle
- Responsive design
- Loading states
- Error handling
- Clean UI with ShadcnUI components

##  Usage

1. **Register/Login**
   - Create a new account or log in with existing credentials

2. **Upload Documents**
   - Go to Documents page
   - Click "Upload PDF" and select files
   - Wait for processing to complete

3. **Ask Questions**
   - Go to Chat page
   - Type your question
   - Optionally select specific documents to search
   - Get AI-powered answers with source attribution

4. **View History**
   - Access previous conversations
   - See which documents were used

##  Troubleshooting

**MongoDB Connection Failed**
- Ensure MongoDB is running locally or update `MONGODB_URL` in `.env`

**Groq API Key Error**
- Verify your API key at https://console.groq.com
- Check that `GROQ_API_KEY` is correctly set in `.env`

**Frontend Can't Connect to Backend**
- Ensure backend is running on `http://localhost:8000`
- Check CORS settings in `backend/app/main.py`

**PDF Upload Fails**
- Only PDF files are supported
- Check file permissions in uploads directory
- Ensure sufficient disk space

##  Environment Variables

### Backend (.env)
```
GROQ_API_KEY=               # Groq API key for LLM
MONGODB_URL=                # MongoDB connection string
DATABASE_NAME=              # MongoDB database name
SECRET_KEY=                 # JWT secret key
ALGORITHM=                  # JWT algorithm (HS256)
ACCESS_TOKEN_EXPIRE_MINUTES=# Token expiration time
UPLOAD_DIR=                 # Directory for uploaded files
CHROMA_DIR=                 # ChromaDB data directory
GROQ_MODEL=                 # Groq model to use
EMBEDDING_MODEL=            # Sentence transformer model
```

### Frontend
- No `.env` file needed - API URL is hardcoded in `src/services/api.ts`

##  Performance Notes

- **Embeddings**: Using local `all-MiniLM-L6-v2` model (27MB, fast)
- **LLM**: Groq's Llama 3.1 70B (super fast inference)
- **Vector Search**: ChromaDB with cosine similarity (instant)
- **Typical Response Time**: 1-2 seconds end-to-end

##  Contributing

Contributions are welcome! Please feel free to submit pull requests or open issues for bugs and feature requests.

##  License

This project is open source and available under the MIT License.

##  Support

For issues, questions, or suggestions, please open an issue on the repository.

---

**Happy Studying!** 
