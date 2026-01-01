import type { ApiResponse, ApiError } from '@glint/types';
import { ErrorCode, ErrorMessages } from '@glint/types';

const API_BASE_URL = '/api/v1';

export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || {
            code: ErrorCode.UNKNOWN_ERROR,
            message: ErrorMessages[ErrorCode.UNKNOWN_ERROR],
          },
        };
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      return {
        success: false,
        error: {
          code: ErrorCode.UNKNOWN_ERROR,
          message: error instanceof Error ? error.message : 'Network error',
        },
      };
    }
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async patch<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();

// Type-safe API 함수들
export const api = {
  // Auth
  auth: {
    me: () => apiClient.get<import('@glint/types').Profile>('/auth/me'),
    logout: () => apiClient.post('/auth/logout'),
  },

  // Chat
  chat: {
    getSessions: (params?: { page?: number; limit?: number }) => {
      const query = params ? `?page=${params.page || 1}&limit=${params.limit || 20}` : '';
      return apiClient.get<import('@glint/types').ChatSession[]>(`/chat/sessions${query}`);
    },
    createSession: (data?: { title?: string }) =>
      apiClient.post<import('@glint/types').ChatSession>('/chat/sessions', data),
    getSession: (id: string) =>
      apiClient.get<import('@glint/types').ChatSession & { messages: import('@glint/types').ChatMessage[] }>(
        `/chat/sessions/${id}`
      ),
    updateSession: (id: string, data: { title: string }) =>
      apiClient.patch<import('@glint/types').ChatSession>(`/chat/sessions/${id}`, data),
    deleteSession: (id: string) => apiClient.delete(`/chat/sessions/${id}`),
    sendMessage: (sessionId: string, data: { content: string }) =>
      apiClient.post<import('@glint/types').ChatMessage>(`/chat/sessions/${sessionId}/messages`, data),
  },

  // Analysis
  analysis: {
    standard: (data: { url: string; sessionId?: string }) =>
      apiClient.post<import('@glint/types').AnalysisJob>('/analysis/standard', data),
    getResult: (id: string) =>
      apiClient.get<import('@glint/types').AnalysisResult>(`/analysis/${id}`),
  },

  // Credits
  credits: {
    get: () => apiClient.get<{ credits: number; plan: string }>('/credits'),
  },

  // Ads
  ads: {
    getConfig: () =>
      apiClient.get<import('@glint/types').AdConfigResponse>('/ads/config'),
  },
};
