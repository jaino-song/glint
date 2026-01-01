import { NextResponse } from 'next/server';
import { errorResponse, successResponse, ErrorCode, ErrorMessages } from '@glint/types';
import type { ApiResponse } from '@glint/types';
import { createClient as createServerClient } from '@/lib/supabase/server';
import type { ZodSchema } from 'zod';

/**
 * API 응답 헬퍼
 */
export function jsonResponse<T>(data: ApiResponse<T>, status: number = 200) {
  return NextResponse.json(data, { status });
}

export function successJson<T>(data: T, status: number = 200) {
  return jsonResponse(successResponse(data), status);
}

export function errorJson(
  code: ErrorCode,
  message?: string,
  status: number = 400,
  details?: Record<string, unknown>
) {
  return jsonResponse(
    errorResponse(code, message || ErrorMessages[code], details),
    status
  );
}

/**
 * 인증 확인 헬퍼
 */
export async function requireAuth() {
  const supabase = await createServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { user: null, error: ErrorCode.AUTH_UNAUTHORIZED };
  }

  return { user, error: null };
}

/**
 * 프로필 조회 헬퍼
 */
export async function getProfile(userId: string) {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  return { profile: data, error };
}

/**
 * 입력 검증 헬퍼
 */
export function validateInput<T>(schema: ZodSchema<T>, data: unknown): { data: T | null; error: string | null } {
  const result = schema.safeParse(data);
  if (!result.success) {
    const firstError = result.error.errors[0];
    return {
      data: null,
      error: `${firstError.path.join('.')}: ${firstError.message}`,
    };
  }
  return { data: result.data, error: null };
}

/**
 * API 핸들러 래퍼 (에러 처리 포함)
 */
export function withErrorHandler(
  handler: (req: Request, context?: { params: Record<string, string> }) => Promise<Response>
) {
  return async (req: Request, context?: { params: Record<string, string> }) => {
    try {
      return await handler(req, context);
    } catch (error) {
      console.error('API Error:', error);
      return errorJson(
        ErrorCode.INTERNAL_ERROR,
        error instanceof Error ? error.message : 'Internal server error',
        500
      );
    }
  };
}
