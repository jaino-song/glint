import { z } from 'zod';

/**
 * 세션 생성 스키마
 */
export const createSessionSchema = z.object({
  title: z.string().max(200).optional(),
});

/**
 * 세션 업데이트 스키마
 */
export const updateSessionSchema = z.object({
  title: z.string().min(1).max(200),
});

/**
 * 메시지 전송 스키마
 */
export const sendMessageSchema = z.object({
  content: z.string().min(1, 'Message cannot be empty').max(10000, 'Message is too long'),
});

/**
 * URL 또는 텍스트 판별
 */
export function isUrl(input: string): boolean {
  try {
    new URL(input);
    return true;
  } catch {
    return false;
  }
}

/**
 * 입력 타입 판별 (분석 요청 vs 일반 채팅)
 */
export type InputType = 'analysis' | 'chat';

export function determineInputType(input: string): InputType {
  const trimmed = input.trim();

  // YouTube URL 패턴 체크
  const youtubePattern = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\//;
  if (youtubePattern.test(trimmed)) {
    return 'analysis';
  }

  return 'chat';
}

export type CreateSessionInput = z.infer<typeof createSessionSchema>;
export type UpdateSessionInput = z.infer<typeof updateSessionSchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
