import { ErrorCode } from '../errors';

/**
 * 표준 API 에러 응답
 */
export interface ApiError {
  code: ErrorCode;
  message: string;
  details?: Record<string, unknown>;
}

/**
 * 표준 API 응답
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: ApiMeta;
}

/**
 * 페이지네이션 메타데이터
 */
export interface ApiMeta {
  page?: number;
  limit?: number;
  total?: number;
  hasMore?: boolean;
}

/**
 * 성공 응답 생성 헬퍼
 */
export function successResponse<T>(data: T, meta?: ApiMeta): ApiResponse<T> {
  return {
    success: true,
    data,
    ...(meta && { meta }),
  };
}

/**
 * 에러 응답 생성 헬퍼
 */
export function errorResponse(
  code: ErrorCode,
  message: string,
  details?: Record<string, unknown>
): ApiResponse<never> {
  return {
    success: false,
    error: {
      code,
      message,
      ...(details && { details }),
    },
  };
}
