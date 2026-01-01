/**
 * 분석 모드
 */
export type AnalysisMode = 'STANDARD' | 'DEEP';

/**
 * 분석 작업 상태
 */
export type AnalysisJobStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

/**
 * 타임라인 항목
 */
export interface TimelineItem {
  timestamp: string;
  description: string;
  details?: string[];
}

/**
 * 시각 정보 (Deep Mode)
 */
export interface VisualAuditItem {
  timestamp: string;
  detail: string;
  type: 'Visual Text' | 'Chart' | 'Code' | 'Product' | 'Other';
}

/**
 * 분석 결과 JSON 구조
 */
export interface AnalysisResultJson {
  title: string;
  summary: string;
  keyTakeaways: string[];
  timeline: TimelineItem[];
  keywords: string[];
  visualAudit?: VisualAuditItem[]; // Deep Mode only
}

/**
 * 분석 결과
 */
export interface AnalysisResult {
  id: string;
  videoId: string;
  videoUrl: string;
  videoTitle: string | null;
  videoThumbnail: string | null;
  videoDurationSeconds: number | null;
  mode: AnalysisMode;
  resultJson: AnalysisResultJson | null;
  transcript: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * 분석 작업
 */
export interface AnalysisJob {
  id: string;
  userId: string;
  sessionId: string | null;
  videoUrl: string;
  videoId: string | null;
  mode: AnalysisMode;
  status: AnalysisJobStatus;
  creditsReserved: number;
  resultId: string | null;
  errorMessage: string | null;
  errorCode: string | null;
  progress: number;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
}

/**
 * 크레딧 비용 계산
 */
export const CREDIT_COSTS = {
  STANDARD: 1,
  DEEP_PER_5MIN: 15,
  CHAT_MESSAGE: 1,
} as const;

/**
 * Deep Mode 크레딧 계산
 */
export function calculateDeepModeCredits(durationMinutes: number): number {
  const units = Math.ceil(durationMinutes / 5);
  return units * CREDIT_COSTS.DEEP_PER_5MIN;
}
