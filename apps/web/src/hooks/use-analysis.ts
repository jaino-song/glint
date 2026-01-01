'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { AnalysisResult, AnalysisJob } from '@glint/types';

export const analysisKeys = {
  all: ['analysis'] as const,
  result: (id: string) => [...analysisKeys.all, 'result', id] as const,
  job: (id: string) => [...analysisKeys.all, 'job', id] as const,
};

export function useAnalysisResult(id: string) {
  return useQuery({
    queryKey: analysisKeys.result(id),
    queryFn: async () => {
      const response = await api.analysis.getResult(id);
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error('Analysis not found');
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5분
  });
}

export function useAnalysisJob(jobId: string) {
  return useQuery({
    queryKey: analysisKeys.job(jobId),
    queryFn: async () => {
      const response = await api.analysis.getJob(jobId);
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error('Job not found');
    },
    enabled: !!jobId,
    // Poll every 2 seconds if job is pending/processing
    refetchInterval: (query) => {
      const job = query.state.data;
      if (job && (job.status === 'PENDING' || job.status === 'PROCESSING')) {
        return 2000;
      }
      return false;
    },
  });
}

export function useStandardAnalysis() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ url, sessionId }: { url: string; sessionId?: string }) => {
      const response = await api.analysis.standard({ url, sessionId });
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.error?.message || 'Analysis failed');
    },
    onSuccess: () => {
      // 세션 데이터 새로고침
      queryClient.invalidateQueries({ queryKey: ['chat'] });
    },
  });
}
