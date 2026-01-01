import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { ErrorCode, ErrorMessages } from '@glint/types';
import { PrismaService } from '../../prisma/prisma.service';

interface ErrorResponse {
  success: false;
  error: {
    code: ErrorCode | string;
    message: string;
    details?: Record<string, unknown>;
  };
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorCode: ErrorCode | string = ErrorCode.INTERNAL_ERROR;
    let message = ErrorMessages[ErrorCode.INTERNAL_ERROR];
    let details: Record<string, unknown> | undefined;

    // Prisma 에러 처리
    if (this.isPrismaError(exception)) {
      const prismaError = PrismaService.formatPrismaError(exception);
      errorCode = prismaError.code;
      message = prismaError.message;
      details = prismaError.details;
      status = this.getPrismaErrorStatus(exception);

      // 상세 에러 로그 출력
      this.logger.error(
        `[Prisma Error] ${prismaError.code}: ${prismaError.message}`,
        JSON.stringify({
          path: request.url,
          method: request.method,
          userId: (request as any).user?.id,
          details: prismaError.details,
          stack: exception instanceof Error ? exception.stack : undefined,
        }),
      );
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const resp = exceptionResponse as Record<string, unknown>;

        // Check if it's our custom error format
        if (resp.code && typeof resp.code === 'string') {
          errorCode = resp.code as ErrorCode;
          message = (resp.message as string) || ErrorMessages[errorCode as ErrorCode] || message;
          details = resp.details as Record<string, unknown>;
        } else {
          // NestJS default format
          message = (resp.message as string) || exception.message;

          // Map HTTP status to error code
          errorCode = this.mapStatusToErrorCode(status);

          // Handle validation errors
          if (Array.isArray(resp.message)) {
            errorCode = ErrorCode.VALIDATION_ERROR;
            details = { errors: resp.message };
            message = 'Validation failed';
          }
        }
      } else {
        message = String(exceptionResponse);
      }

      // HTTP 에러도 로그 출력 (4xx는 warn, 5xx는 error)
      if (status >= 500) {
        this.logger.error(
          `[HTTP ${status}] ${request.method} ${request.url}: ${message}`,
          exception.stack,
        );
      } else if (status >= 400) {
        const detailsStr = details ? ` | Details: ${JSON.stringify(details)}` : '';
        this.logger.warn(`[HTTP ${status}] ${request.method} ${request.url}: ${message}${detailsStr}`);
      }
    } else if (exception instanceof Error) {
      // 일반 Error 객체 - 상세 로그 출력
      this.logger.error(
        `[Unhandled Error] ${exception.name}: ${exception.message}`,
        JSON.stringify({
          path: request.url,
          method: request.method,
          userId: (request as any).user?.id,
          stack: exception.stack,
        }),
      );
      message = 'An unexpected error occurred';
    } else {
      // 알 수 없는 타입의 에러
      this.logger.error(
        `[Unknown Error] ${JSON.stringify(exception)}`,
        JSON.stringify({ path: request.url, method: request.method }),
      );
    }

    const errorResponse: ErrorResponse = {
      success: false,
      error: {
        code: errorCode,
        message,
        ...(details && { details }),
      },
    };

    response.status(status).json(errorResponse);
  }

  /**
   * Prisma 에러인지 확인
   */
  private isPrismaError(exception: unknown): boolean {
    return (
      exception instanceof Prisma.PrismaClientKnownRequestError ||
      exception instanceof Prisma.PrismaClientValidationError ||
      exception instanceof Prisma.PrismaClientInitializationError ||
      exception instanceof Prisma.PrismaClientRustPanicError ||
      exception instanceof Prisma.PrismaClientUnknownRequestError
    );
  }

  /**
   * Prisma 에러에 대한 HTTP 상태 코드 결정
   */
  private getPrismaErrorStatus(exception: unknown): number {
    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      switch (exception.code) {
        case 'P2002': // Unique constraint violation
          return HttpStatus.CONFLICT;
        case 'P2003': // Foreign key constraint violation
        case 'P2025': // Record not found
          return HttpStatus.NOT_FOUND;
        default:
          return HttpStatus.BAD_REQUEST;
      }
    }

    if (exception instanceof Prisma.PrismaClientValidationError) {
      return HttpStatus.BAD_REQUEST;
    }

    if (exception instanceof Prisma.PrismaClientInitializationError) {
      return HttpStatus.SERVICE_UNAVAILABLE;
    }

    return HttpStatus.INTERNAL_SERVER_ERROR;
  }

  private mapStatusToErrorCode(status: number): ErrorCode {
    switch (status) {
      case HttpStatus.UNAUTHORIZED:
        return ErrorCode.AUTH_UNAUTHORIZED;
      case HttpStatus.NOT_FOUND:
        return ErrorCode.NOT_FOUND;
      case HttpStatus.BAD_REQUEST:
        return ErrorCode.VALIDATION_ERROR;
      case HttpStatus.TOO_MANY_REQUESTS:
        return ErrorCode.RATE_LIMITED;
      default:
        return ErrorCode.INTERNAL_ERROR;
    }
  }
}
