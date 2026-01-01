import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import Constants from 'expo-constants';
import { supabase } from '../supabase/client';
import type { ApiResponse, ApiError as ApiErrorType } from '@glint/types';
import { ErrorCode } from '@glint/types';

const API_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:3000';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: `${API_URL}/api/v1`,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor - add auth token
    this.client.interceptors.request.use(
      async (config: InternalAxiosRequestConfig) => {
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.access_token) {
          config.headers.Authorization = `Bearer ${session.access_token}`;
        }

        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor - handle errors
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError<ApiResponse>) => {
        const originalRequest = error.config;

        // Handle 401 - try to refresh token
        if (error.response?.status === 401 && originalRequest) {
          const { data: { session }, error: refreshError } = await supabase.auth.refreshSession();

          if (!refreshError && session) {
            originalRequest.headers.Authorization = `Bearer ${session.access_token}`;
            return this.client(originalRequest);
          }

          // Refresh failed, sign out
          await supabase.auth.signOut();
        }

        return Promise.reject(this.normalizeError(error));
      }
    );
  }

  private normalizeError(error: AxiosError<ApiResponse>): ApiErrorType {
    if (error.response?.data?.error) {
      return error.response.data.error;
    }

    if (error.code === 'ECONNABORTED') {
      return {
        code: ErrorCode.UNKNOWN_ERROR,
        message: 'Request timeout. Please try again.',
      };
    }

    if (!error.response) {
      return {
        code: ErrorCode.UNKNOWN_ERROR,
        message: 'Network error. Please check your connection.',
      };
    }

    return {
      code: ErrorCode.UNKNOWN_ERROR,
      message: error.message || 'An unknown error occurred',
    };
  }

  async get<T>(url: string, params?: Record<string, unknown>): Promise<ApiResponse<T>> {
    const response = await this.client.get<ApiResponse<T>>(url, { params });
    return response.data;
  }

  async post<T>(url: string, data?: unknown): Promise<ApiResponse<T>> {
    const response = await this.client.post<ApiResponse<T>>(url, data);
    return response.data;
  }

  async patch<T>(url: string, data?: unknown): Promise<ApiResponse<T>> {
    const response = await this.client.patch<ApiResponse<T>>(url, data);
    return response.data;
  }

  async delete<T>(url: string): Promise<ApiResponse<T>> {
    const response = await this.client.delete<ApiResponse<T>>(url);
    return response.data;
  }
}

export const api = new ApiClient();
