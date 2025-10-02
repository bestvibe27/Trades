/**
 * API request/response type definitions
 */

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

export interface HealthCheckResponse {
  status: 'ok' | 'error';
  version: string;
  uptime: number;
  timestamp: string;
  services: {
    database: 'connected' | 'disconnected';
    broker: 'connected' | 'disconnected';
    marketData: 'connected' | 'disconnected';
  };
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: {
    id: string;
    email: string;
    roles: string[];
  };
}

export interface UserProfile {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  roles: string[];
  createdAt: string;
  lastLogin?: string;
}

export interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
}










