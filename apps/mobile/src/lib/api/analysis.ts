import { api } from './client';
import type { AnalysisResult, AnalysisJob, AnalysisMode } from '@glint/types';

export interface AnalyzeResponse {
  job: AnalysisJob;
}

export interface AnalysisResultResponse {
  result: AnalysisResult;
}

export interface JobStatusResponse {
  job: AnalysisJob;
}

export interface CanAnalyzeResponse {
  allowed: boolean;
  reason?: string;
  credits: number;
  creditsRequired: number;
}

/**
 * Analysis API functions
 */
export const analysisApi = {
  /**
   * Check if analysis is allowed
   */
  checkCanAnalyze: async (videoUrl: string, mode: AnalysisMode = 'STANDARD') => {
    return api.get<CanAnalyzeResponse>('/analysis/check', { videoUrl, mode });
  },

  /**
   * Start standard analysis
   */
  analyzeStandard: async (videoUrl: string, sessionId?: string) => {
    return api.post<AnalyzeResponse>('/analysis/standard', { videoUrl, sessionId });
  },

  /**
   * Start deep analysis (Pro/Business only)
   */
  analyzeDeep: async (videoUrl: string, sessionId?: string) => {
    return api.post<AnalyzeResponse>('/analysis/deep', { videoUrl, sessionId });
  },

  /**
   * Get analysis result by ID
   */
  getResult: async (resultId: string) => {
    return api.get<AnalysisResultResponse>(`/analysis/${resultId}`);
  },

  /**
   * Get analysis result by video ID
   */
  getResultByVideoId: async (videoId: string, mode: AnalysisMode = 'STANDARD') => {
    return api.get<AnalysisResultResponse>(`/analysis/video/${videoId}`, { mode });
  },

  /**
   * Get job status
   */
  getJobStatus: async (jobId: string) => {
    return api.get<JobStatusResponse>(`/analysis/jobs/${jobId}`);
  },
};
