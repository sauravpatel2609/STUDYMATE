// ===================================
// StudyMate API Service
// Handles all API communication with the backend
// ===================================

import axios, { AxiosInstance, AxiosError } from 'axios';
import {
  AuthResponse,
  RegisterRequest,
  LoginRequest,
  Document,
  UploadResponse,
  ChatQuery,
  ChatResponse,
  ChatHistoryItem,
  ApiError,
} from '@/types/api';

// Base URL for the API - can be configured via environment variable
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Create axios instance with default config
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 second timeout
});

// Token management
let authToken: string | null = null;

export const setAuthToken = (token: string | null) => {
  authToken = token;
  if (token) {
    localStorage.setItem('studymate_token', token);
  } else {
    localStorage.removeItem('studymate_token');
  }
};

export const getAuthToken = (): string | null => {
  if (!authToken) {
    authToken = localStorage.getItem('studymate_token');
  }
  return authToken;
};

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ detail?: string }>) => {
    const apiError: ApiError = {
      message: error.response?.data?.detail || error.message || 'An unexpected error occurred',
      status: error.response?.status,
    };
    
    // Handle 401 Unauthorized - clear token and redirect
    if (error.response?.status === 401) {
      setAuthToken(null);
      // Only redirect if not already on auth page
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(apiError);
  }
);

// ===================================
// Authentication API
// ===================================

export const authApi = {
  /**
   * Register a new user
   */
  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/register', data);
    return response.data;
  },

  /**
   * Login an existing user
   */
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/login', data);
    return response.data;
  },
};

// ===================================
// Documents API
// ===================================

export const documentsApi = {
  /**
   * Upload a PDF document
   */
  upload: async (file: File): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await apiClient.post<UploadResponse>('/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * List all uploaded documents
   */
  list: async (): Promise<Document[]> => {
    const response = await apiClient.get<Document[]>('/documents/list');
    return response.data;
  },

  /**
   * Delete a document by ID
   */
  delete: async (documentId: string): Promise<void> => {
    await apiClient.delete(`/documents/${documentId}`);
  },
};

// ===================================
// Chat API
// ===================================

export const chatApi = {
  /**
   * Send a query to the AI
   */
  query: async (data: ChatQuery): Promise<ChatResponse> => {
    const response = await apiClient.post<ChatResponse>('/chat/query', data);
    return response.data;
  },

  /**
   * Get chat history
   */
  history: async (): Promise<ChatHistoryItem[]> => {
    const response = await apiClient.get<ChatHistoryItem[]>('/chat/history');
    return response.data;
  },
};

export default apiClient;
