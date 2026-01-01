import { api } from './client';
import type { ChatSession, ChatMessage } from '@glint/types';

export interface CreateSessionResponse {
  session: ChatSession;
}

export interface SessionsResponse {
  sessions: ChatSession[];
}

export interface SessionDetailResponse {
  session: ChatSession;
  messages: ChatMessage[];
}

export interface SendMessageResponse {
  message: ChatMessage;
}

/**
 * Chat API functions
 */
export const chatApi = {
  /**
   * Get all chat sessions
   */
  getSessions: async () => {
    return api.get<SessionsResponse>('/chat/sessions');
  },

  /**
   * Create a new chat session
   */
  createSession: async (title?: string) => {
    return api.post<CreateSessionResponse>('/chat/sessions', { title });
  },

  /**
   * Get session details with messages
   */
  getSession: async (sessionId: string) => {
    return api.get<SessionDetailResponse>(`/chat/sessions/${sessionId}`);
  },

  /**
   * Update session title
   */
  updateSession: async (sessionId: string, title: string) => {
    return api.patch<{ session: ChatSession }>(`/chat/sessions/${sessionId}`, { title });
  },

  /**
   * Delete a session
   */
  deleteSession: async (sessionId: string) => {
    return api.delete(`/chat/sessions/${sessionId}`);
  },

  /**
   * Send a message
   */
  sendMessage: async (sessionId: string, content: string) => {
    return api.post<SendMessageResponse>(`/chat/sessions/${sessionId}/messages`, { content });
  },
};
