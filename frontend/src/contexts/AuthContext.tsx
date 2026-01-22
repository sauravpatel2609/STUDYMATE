// ===================================
// Authentication Context
// Manages user authentication state throughout the app
// ===================================

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { authApi, setAuthToken, getAuthToken } from '@/services/api';
import { User, LoginRequest, RegisterRequest, ApiError } from '@/types/api';
import { useToast } from '@/hooks/use-toast';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthContextType extends AuthState {
  login: (data: LoginRequest) => Promise<boolean>;
  register: (data: RegisterRequest) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Decode JWT token to extract user info (basic decode, not verification)
const decodeToken = (token: string): User | null => {
  try {
    const payload = token.split('.')[1];
    const decoded = JSON.parse(atob(payload));
    return {
      email: decoded.email || decoded.sub || '',
      username: decoded.username || decoded.name || decoded.email?.split('@')[0] || 'User',
    };
  } catch {
    return null;
  }
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });
  const { toast } = useToast();

  // Initialize auth state from stored token
  useEffect(() => {
    const initAuth = () => {
      const token = getAuthToken();
      if (token) {
        const user = decodeToken(token);
        if (user) {
          setState({
            user,
            isAuthenticated: true,
            isLoading: false,
          });
          return;
        }
      }
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    };

    initAuth();
  }, []);

  const login = useCallback(async (data: LoginRequest): Promise<boolean> => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      const response = await authApi.login(data);
      setAuthToken(response.access_token);
      
      const user = decodeToken(response.access_token);
      setState({
        user,
        isAuthenticated: true,
        isLoading: false,
      });

      toast({
        title: 'Welcome back!',
        description: `Logged in as ${user?.username || data.email}`,
      });

      return true;
    } catch (error) {
      const apiError = error as ApiError;
      setState(prev => ({ ...prev, isLoading: false }));
      
      toast({
        title: 'Login failed',
        description: apiError.message,
        variant: 'destructive',
      });

      return false;
    }
  }, [toast]);

  const register = useCallback(async (data: RegisterRequest): Promise<boolean> => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      const response = await authApi.register(data);
      setAuthToken(response.access_token);
      
      const user = decodeToken(response.access_token);
      setState({
        user: user || { email: data.email, username: data.username },
        isAuthenticated: true,
        isLoading: false,
      });

      toast({
        title: 'Account created!',
        description: `Welcome to StudyMate, ${data.username}!`,
      });

      return true;
    } catch (error) {
      const apiError = error as ApiError;
      setState(prev => ({ ...prev, isLoading: false }));
      
      toast({
        title: 'Registration failed',
        description: apiError.message,
        variant: 'destructive',
      });

      return false;
    }
  }, [toast]);

  const logout = useCallback(() => {
    setAuthToken(null);
    setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });

    toast({
      title: 'Logged out',
      description: 'See you next time!',
    });
  }, [toast]);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
