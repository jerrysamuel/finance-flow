import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = 'https://trackr-backend-latest-2.onrender.com';

// Token management
const TOKEN_KEY = 'trackr_access_token';
const REFRESH_TOKEN_KEY = 'trackr_refresh_token';

export const getAccessToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

export const getRefreshToken = (): string | null => {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
};

export const setTokens = (access: string, refresh?: string): void => {
  localStorage.setItem(TOKEN_KEY, access);
  if (refresh) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
  }
};

export const clearTokens = (): void => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
};

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for token refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      const refreshToken = getRefreshToken();
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_BASE_URL}/api/auth/token/refresh/`, {
            refresh: refreshToken,
          });
          
          const { access } = response.data;
          setTokens(access);
          
          originalRequest.headers.Authorization = `Bearer ${access}`;
          return api(originalRequest);
        } catch (refreshError) {
          clearTokens();
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      } else {
        clearTokens();
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data: { email: string; password: string; full_name?: string }) =>
    api.post('/api/auth/register/', data),
  
  login: (data: { email: string; password: string }) =>
    api.post('/api/auth/login/', data),
  
  logout: () => api.post('/api/auth/logout/'),
  
  getMe: () => api.get('/api/auth/me/'),
};

// User API
export const userAPI = {
  getProfile: () => api.get('/api/users/me/'),
  
  updateProfile: (data: { full_name?: string; avatar?: string }) =>
    api.patch('/api/users/me/', data),
};

// Expenses API
export interface Expense {
  id: number;
  amount: string | number;
  category: string;
  category_name?: string;
  description: string;
  date: string;
  type: 'income' | 'expense';
  created_at?: string;
  updated_at?: string;
}

export interface ExpenseInput {
  amount: number;
  category: number | string;
  description: string;
  date: string;
  type: 'income' | 'expense';
}

export const expensesAPI = {
  getAll: (params?: { page?: number; type?: string; category?: string }) =>
    api.get('/api/expenses/', { params }),
  
  getById: (id: number) => api.get(`/api/expenses/${id}/`),
  
  create: (data: ExpenseInput) => api.post('/api/expenses/', data),
  
  update: (id: number, data: Partial<ExpenseInput>) =>
    api.patch(`/api/expenses/${id}/`, data),
  
  delete: (id: number) => api.delete(`/api/expenses/${id}/`),
};

// Categories API
export interface Category {
  id: number;
  name: string;
  icon?: string;
  color?: string;
}

export const categoriesAPI = {
  getAll: () => api.get('/api/categories/'),
  
  create: (data: { name: string; icon?: string; color?: string }) =>
    api.post('/api/categories/', data),
};

// Analytics API
export interface AnalyticsSummary {
  total_income: number;
  total_expenses: number;
  net_balance: number;
  expense_count: number;
  income_count: number;
}

export interface MonthlyData {
  month: string;
  income: number;
  expenses: number;
}

export interface CategoryData {
  category: string;
  amount: number;
  percentage: number;
  color?: string;
}

export const analyticsAPI = {
  getSummary: () => api.get<AnalyticsSummary>('/api/analytics/summary/'),
  
  getMonthly: (params?: { year?: number }) =>
    api.get<MonthlyData[]>('/api/analytics/monthly/', { params }),
  
  getByCategories: () => api.get<CategoryData[]>('/api/analytics/categories/'),
};

// Statements API
export const statementsAPI = {
  upload: (file: File, onProgress?: (progress: number) => void) => {
    const formData = new FormData();
    formData.append('file', file);
    
    return api.post('/api/statements/upload/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    });
  },
};

export default api;
