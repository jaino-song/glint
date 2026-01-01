import { z } from 'zod';

/**
 * YouTube URL 패턴
 * 지원 형식:
 * - youtube.com/watch?v=VIDEO_ID
 * - youtu.be/VIDEO_ID
 * - youtube.com/embed/VIDEO_ID
 * - youtube.com/shorts/VIDEO_ID
 * - youtube.com/live/VIDEO_ID
 * - m.youtube.com/watch?v=VIDEO_ID (모바일)
 * - music.youtube.com/watch?v=VIDEO_ID (YouTube Music)
 */
const youtubeUrlPattern = /^(https?:\/\/)?(www\.|m\.|music\.)?(youtube\.com\/(watch\?v=|embed\/|shorts\/|live\/)|youtu\.be\/)[\w-]{11}([?&].*)?$/;

/**
 * YouTube URL 스키마
 */
export const youtubeUrlSchema = z
  .string()
  .url('Invalid URL')
  .regex(youtubeUrlPattern, 'Invalid YouTube URL');

/**
 * 분석 모드 스키마
 */
export const analysisModeSchema = z.enum(['STANDARD', 'DEEP']);

/**
 * Standard 분석 요청 스키마
 */
export const standardAnalysisSchema = z.object({
  url: youtubeUrlSchema,
  sessionId: z.string().uuid().optional(),
});

/**
 * Deep 분석 요청 스키마
 */
export const deepAnalysisSchema = z.object({
  url: youtubeUrlSchema,
  sessionId: z.string().uuid().optional(),
});

/**
 * YouTube URL에서 Video ID 추출
 */
export function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([\w-]{11})/,
    /(?:youtu\.be\/)([\w-]{11})/,
    /(?:youtube\.com\/embed\/)([\w-]{11})/,
    /(?:youtube\.com\/shorts\/)([\w-]{11})/,
    /(?:youtube\.com\/live\/)([\w-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }

  return null;
}

/**
 * YouTube URL 검증
 */
export function isValidYoutubeUrl(url: string): boolean {
  return youtubeUrlPattern.test(url);
}

export type StandardAnalysisInput = z.infer<typeof standardAnalysisSchema>;
export type DeepAnalysisInput = z.infer<typeof deepAnalysisSchema>;
