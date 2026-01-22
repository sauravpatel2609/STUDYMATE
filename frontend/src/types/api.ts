// ===================================
// StudyMate API Types
// ===================================

// Authentication Types
export interface AuthResponse {
  access_token: string;
  token_type: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

// User Types
export interface User {
  email: string;
  username: string;
}

// Document Types
export interface Document {
  id: string;
  filename: string;
  upload_date: string;
  num_chunks: number;
}

export interface UploadResponse {
  document_id: string;
  filename: string;
  chunks: number;
}

// Chat Types
export interface ChatQuery {
  message: string;
  document_ids?: string[];
}

export interface ChatSource {
  document_id: string;
  filename: string;
  chunk_id: number;
  content: string;
}

export interface ChatResponse {
  answer: string;
  sources: ChatSource[];
  timestamp: string;
}

export interface ChatHistoryItem {
  question: string;
  answer: string;
  sources: ChatSource[];
  timestamp: string;
}

// API Error Type
export interface ApiError {
  message: string;
  status?: number;
}
