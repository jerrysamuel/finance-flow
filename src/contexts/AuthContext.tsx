import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI, userAPI, setTokens, clearTokens, getAccessToken } from '@/lib/api';

interface User {
  id: number;
  email: string;
  full_name?: string;
  avatar?: string;
  created_at?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string, fullName?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const token = getAccessToken();
      if (!token) {
        setUser(null);
        setIsLoading(false);
        return;
      }

      const response = await authAPI.getMe();
      setUser(response.data);
    } catch (error) {
      setUser(null);
      clearTokens();
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (email: string, password: string) => {
    try {
      const response = await authAPI.login({ email, password });
      const { access, refresh } = response.data;
      
      setTokens(access, refresh);
      
      // Fetch user data
      const userResponse = await authAPI.getMe();
      setUser(userResponse.data);
      
      return { success: true };
    } catch (error: any) {
      const message = error.response?.data?.detail || 
                      error.response?.data?.message ||
                      error.response?.data?.non_field_errors?.[0] ||
                      'Invalid email or password';
      return { success: false, error: message };
    }
  };

  const register = async (email: string, password: string, fullName?: string) => {
    try {
      const response = await authAPI.register({ 
        email, 
        password, 
        full_name: fullName 
      });
      
      // Some APIs return tokens on register, some require login
      if (response.data.access) {
        const { access, refresh } = response.data;
        setTokens(access, refresh);
        
        const userResponse = await authAPI.getMe();
        setUser(userResponse.data);
      }
      
      return { success: true };
    } catch (error: any) {
      const errorData = error.response?.data;
      let message = 'Registration failed';
      
      if (errorData) {
        if (errorData.email) {
          message = Array.isArray(errorData.email) ? errorData.email[0] : errorData.email;
        } else if (errorData.password) {
          message = Array.isArray(errorData.password) ? errorData.password[0] : errorData.password;
        } else if (errorData.detail) {
          message = errorData.detail;
        } else if (errorData.message) {
          message = errorData.message;
        }
      }
      
      return { success: false, error: message };
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      // Ignore logout errors
    } finally {
      clearTokens();
      setUser(null);
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
