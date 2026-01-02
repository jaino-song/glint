'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { NotionStatus, NotionSyncResult } from '@glint/types';

export const notionKeys = {
  all: ['notion'] as const,
  status: () => [...notionKeys.all, 'status'] as const,
};

/**
 * Notion 연동 상태 조회 훅
 */
export function useNotionStatus() {
  return useQuery({
    queryKey: notionKeys.status(),
    queryFn: async () => {
      const response = await api.notion.getStatus();
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.error?.message || 'Failed to get Notion status');
    },
    staleTime: 30 * 1000, // 30초
  });
}

/**
 * Notion OAuth 연결 시작 훅
 */
export function useNotionConnect() {
  return useMutation({
    mutationFn: async () => {
      const response = await api.notion.getAuthUrl();
      if (response.success && response.data) {
        // OAuth 페이지로 리다이렉트
        window.location.href = response.data.authUrl;
        return response.data;
      }
      throw new Error(response.error?.message || 'Failed to get auth URL');
    },
  });
}

/**
 * Notion 연동 해제 훅
 */
export function useNotionDisconnect() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await api.notion.disconnect();
      if (response.success) {
        return response.data;
      }
      throw new Error(response.error?.message || 'Failed to disconnect');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notionKeys.status() });
    },
  });
}

/**
 * 분석 결과 Notion 내보내기 훅
 */
export function useNotionExport() {
  return useMutation({
    mutationFn: async (analysisId: string) => {
      const response = await api.notion.exportAnalysis(analysisId);
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.error?.message || 'Failed to export to Notion');
    },
  });
}

/**
 * 분석 결과 Notion 동기화 훅
 */
export function useNotionSync() {
  return useMutation({
    mutationFn: async (analysisId: string) => {
      const response = await api.notion.syncAnalysis(analysisId);
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.error?.message || 'Failed to sync with Notion');
    },
  });
}
