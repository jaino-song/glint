'use client';

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useChatStore } from '@/stores';
import type { ChatSession, ChatMessage } from '@glint/types';

export const chatKeys = {
  all: ['chat'] as const,
  sessions: () => [...chatKeys.all, 'sessions'] as const,
  session: (id: string) => [...chatKeys.all, 'session', id] as const,
  messages: (sessionId: string) => [...chatKeys.all, 'messages', sessionId] as const,
};

export function useChatSessions() {
  return useQuery({
    queryKey: chatKeys.sessions(),
    queryFn: async () => {
      const response = await api.chat.getSessions();
      if (response.success && response.data) {
        return response.data;
      }
      return [];
    },
    staleTime: 30 * 1000, // 30초
  });
}

export function useChatSession(sessionId: string) {
  return useQuery({
    queryKey: chatKeys.session(sessionId),
    queryFn: async () => {
      const response = await api.chat.getSession(sessionId);
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error('Session not found');
    },
    enabled: !!sessionId,
  });
}

export function useCreateSession() {
  const queryClient = useQueryClient();
  const { setCurrentSessionId } = useChatStore();

  return useMutation({
    mutationFn: async (title?: string) => {
      const response = await api.chat.createSession(title ? { title } : undefined);
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error('Failed to create session');
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: chatKeys.sessions() });
      setCurrentSessionId(data.id);
    },
  });
}

export function useUpdateSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, title }: { id: string; title: string }) => {
      const response = await api.chat.updateSession(id, { title });
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error('Failed to update session');
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: chatKeys.sessions() });
      queryClient.invalidateQueries({ queryKey: chatKeys.session(variables.id) });
    },
  });
}

export function useDeleteSession() {
  const queryClient = useQueryClient();
  const { currentSessionId, setCurrentSessionId } = useChatStore();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.chat.deleteSession(id);
      if (!response.success) {
        throw new Error('Failed to delete session');
      }
      return id;
    },
    onSuccess: (deletedId) => {
      queryClient.invalidateQueries({ queryKey: chatKeys.sessions() });
      if (currentSessionId === deletedId) {
        setCurrentSessionId(null);
      }
    },
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  const { addPendingMessage } = useChatStore();

  return useMutation({
    mutationFn: async ({
      sessionId,
      content,
    }: {
      sessionId: string;
      content: string;
    }) => {
      const response = await api.chat.sendMessage(sessionId, { content });
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error('Failed to send message');
    },
    onMutate: async ({ sessionId, content }) => {
      // Optimistic update: 사용자 메시지 먼저 표시
      const optimisticMessage: ChatMessage = {
        id: `temp-${Date.now()}`,
        sessionId,
        role: 'user',
        type: 'text',
        content,
        analysisRefId: null,
        createdAt: new Date().toISOString(),
      };
      addPendingMessage(optimisticMessage);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: chatKeys.session(variables.sessionId) });
      queryClient.invalidateQueries({ queryKey: chatKeys.sessions() });
    },
  });
}
