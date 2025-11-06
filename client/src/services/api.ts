import axios from 'axios';
import type {
  AuthResponse,
  Lab,
  Employee,
  MonthlyMetric,
  DashboardOverview,
  LabDashboard,
} from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const authAPI = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const response = await api.post('/api/auth/login', { email, password });
    return response.data;
  },

  register: async (email: string, password: string, name: string): Promise<AuthResponse> => {
    const response = await api.post('/api/auth/register', { email, password, name });
    return response.data;
  },
};

// Labs API
export const labsAPI = {
  getAll: async (): Promise<Lab[]> => {
    const response = await api.get('/api/labs');
    return response.data;
  },

  getById: async (id: string): Promise<Lab> => {
    const response = await api.get(`/api/labs/${id}`);
    return response.data;
  },

  create: async (data: Partial<Lab>): Promise<Lab> => {
    const response = await api.post('/api/labs', data);
    return response.data;
  },

  update: async (id: string, data: Partial<Lab>): Promise<Lab> => {
    const response = await api.put(`/api/labs/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/labs/${id}`);
  },
};

// Employees API
export const employeesAPI = {
  getByLabId: async (labId: string): Promise<Employee[]> => {
    const response = await api.get(`/api/employees/lab/${labId}`);
    return response.data;
  },

  create: async (data: Partial<Employee>): Promise<Employee> => {
    const response = await api.post('/api/employees', data);
    return response.data;
  },

  update: async (id: string, data: Partial<Employee>): Promise<Employee> => {
    const response = await api.put(`/api/employees/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/employees/${id}`);
  },
};

// Metrics API
export const metricsAPI = {
  getByLabId: async (labId: string): Promise<MonthlyMetric[]> => {
    const response = await api.get(`/api/metrics/lab/${labId}`);
    return response.data;
  },

  save: async (data: Partial<MonthlyMetric>): Promise<MonthlyMetric> => {
    const response = await api.post('/api/metrics', data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/metrics/${id}`);
  },
};

// Dashboard API
export const dashboardAPI = {
  getOverview: async (): Promise<DashboardOverview> => {
    const response = await api.get('/api/dashboard/overview');
    return response.data;
  },

  getLabDashboard: async (labId: string): Promise<LabDashboard> => {
    const response = await api.get(`/api/dashboard/lab/${labId}`);
    return response.data;
  },
};

export default api;
