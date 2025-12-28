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

// ============= INTERFACES =============

// Transaction type - DEBIT (expense) or CREDIT (income)
export type TransactionType = 'DEBIT' | 'CREDIT';

export interface User {
  id: number;
  username: string;
  email: string;
  full_name?: string;
  avatar?: string;
  created_at?: string;
}

export interface Expense {
  id: number;
  amount: number | string;
  category: number | null;
  category_name?: string;
  description: string;
  date: string;
  transaction_type: TransactionType;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ExpenseInput {
  amount: number;
  category: number | null;
  description: string;
  date: string;
  transaction_type: TransactionType;
  notes?: string;
}

export interface Category {
  id: number;
  name: string;
  icon?: string;
  color?: string;
  is_default?: boolean;
}

export interface CategoryRule {
  id: number;
  description_keyword: string;
  category: number;
  category_name?: string;
  created_at: string;
}

export interface Budget {
  id: number;
  category: number;
  category_name?: string;
  amount: number;
  month: string;
  spent?: number;
  remaining?: number;
  is_over_budget?: boolean;
}

export interface AnalyticsSummary {
  period: { start: string; end: string };
  total_income: number;
  total_expenses: number;
  net_balance: number;
  total_transactions: number;
}

export interface MonthlyData {
  month: string;
  income: number;
  expenses: number;
}

export interface CategoryAnalytics {
  category: string;
  category_id?: number;
  amount: number;
  percentage: number;
  color?: string;
}

export interface UploadPreview {
  transactions: Expense[];
  total_count: number;
  categorized_count: number;
}

// ============= AUTH API =============

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  password2: string;
}

export interface LoginData {
  username: string;
  password: string;
}

export const authAPI = {
  register: (data: RegisterData) =>
    api.post('/api/auth/register/', data),
  
  login: (data: LoginData) =>
    api.post('/api/auth/login/', data),
  
  logout: () => api.post('/api/auth/logout/'),
  
  getMe: () => api.get<User>('/api/auth/me/'),
};

// ============= USER API =============

export const userAPI = {
  getProfile: () => api.get<User>('/api/users/me/'),
  
  updateProfile: (data: { full_name?: string; avatar?: string }) =>
    api.patch('/api/users/me/', data),
};

// ============= EXPENSES API =============

export interface ExpenseFilters {
  page?: number;
  type?: TransactionType;
  category?: number;
  start_date?: string;
  end_date?: string;
}

export const expensesAPI = {
  getAll: (params?: ExpenseFilters) =>
    api.get('/api/expenses/', { params }),
  
  getById: (id: number) => api.get<Expense>(`/api/expenses/${id}/`),
  
  create: (data: ExpenseInput) => api.post<Expense>('/api/expenses/', data),
  
  update: (id: number, data: Partial<ExpenseInput>) =>
    api.patch<Expense>(`/api/expenses/${id}/`, data),
  
  delete: (id: number) => api.delete(`/api/expenses/${id}/`),

  // Upload CSV/Excel - returns preview
  upload: (file: File, onProgress?: (progress: number) => void) => {
    const formData = new FormData();
    formData.append('file', file);
    
    return api.post<UploadPreview>('/api/expenses/upload/', formData, {
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

  // Bulk create after upload preview
  bulkCreate: (transactions: ExpenseInput[]) =>
    api.post('/api/expenses/bulk_create/', { transactions }),

  // Update category with optional rule creation
  updateCategory: (id: number, data: { category: number; create_rule?: boolean }) =>
    api.patch<Expense>(`/api/expenses/${id}/update_category/`, data),
};

// ============= CATEGORIES API =============

export const categoriesAPI = {
  getAll: () => api.get<Category[]>('/api/categories/'),
  
  create: (data: { name: string; icon?: string; color?: string }) =>
    api.post<Category>('/api/categories/', data),

  update: (id: number, data: { name?: string; icon?: string; color?: string }) =>
    api.patch<Category>(`/api/categories/${id}/`, data),

  delete: (id: number) => api.delete(`/api/categories/${id}/`),
};

// ============= CATEGORY RULES API =============

export const categoryRulesAPI = {
  getAll: () => api.get<CategoryRule[]>('/api/category-rules/'),
  
  create: (data: { description_keyword: string; category: number }) =>
    api.post<CategoryRule>('/api/category-rules/', data),

  update: (id: number, data: { description_keyword?: string; category?: number }) =>
    api.patch<CategoryRule>(`/api/category-rules/${id}/`, data),

  delete: (id: number) => api.delete(`/api/category-rules/${id}/`),
};

// ============= BUDGETS API =============

export const budgetsAPI = {
  getAll: () => api.get<Budget[]>('/api/budgets/'),
  
  create: (data: { category: number; amount: number; month: string }) =>
    api.post<Budget>('/api/budgets/', data),

  update: (id: number, data: { category?: number; amount?: number; month?: string }) =>
    api.patch<Budget>(`/api/budgets/${id}/`, data),

  delete: (id: number) => api.delete(`/api/budgets/${id}/`),
};

// ============= ANALYTICS API =============

export interface AnalyticsParams {
  start_date?: string;
  end_date?: string;
}

export interface CategoryAnalyticsParams extends AnalyticsParams {
  type?: TransactionType;
}

export const analyticsAPI = {
  getSummary: (params?: AnalyticsParams) => 
    api.get<AnalyticsSummary>('/api/analytics/summary/', { params }),
  
  getByCategory: (params?: CategoryAnalyticsParams) =>
    api.get<CategoryAnalytics[]>('/api/analytics/by-category/', { params }),
  
  getByMonth: (params?: { months?: number }) =>
    api.get<MonthlyData[]>('/api/analytics/by-month/', { params }),
};

export default api;
