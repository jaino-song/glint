import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'event', level: 'info' },
        { emit: 'event', level: 'warn' },
        { emit: 'event', level: 'error' },
      ],
    });

    // 쿼리 로그 (개발 환경에서만 상세 출력)
    if (process.env.NODE_ENV === 'development') {
      (this as any).$on('query', (e: Prisma.QueryEvent) => {
        this.logger.debug(`Query: ${e.query}`);
        this.logger.debug(`Params: ${e.params}`);
        this.logger.debug(`Duration: ${e.duration}ms`);
      });
    }

    // 에러 로그 (항상 출력)
    (this as any).$on('error', (e: Prisma.LogEvent) => {
      this.logger.error(`Prisma Error: ${e.message}`, e.target);
    });

    // 경고 로그
    (this as any).$on('warn', (e: Prisma.LogEvent) => {
      this.logger.warn(`Prisma Warning: ${e.message}`);
    });

    // 정보 로그
    (this as any).$on('info', (e: Prisma.LogEvent) => {
      this.logger.log(`Prisma Info: ${e.message}`);
    });
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Prisma connected to database');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Prisma disconnected from database');
  }

  /**
   * Prisma 에러를 사람이 읽기 쉬운 메시지로 변환
   */
  static formatPrismaError(error: unknown): { code: string; message: string; details?: Record<string, unknown> } {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      switch (error.code) {
        case 'P2002':
          return {
            code: 'UNIQUE_CONSTRAINT_VIOLATION',
            message: `이미 존재하는 데이터입니다: ${(error.meta?.target as string[])?.join(', ') || 'unknown field'}`,
            details: { fields: error.meta?.target },
          };
        case 'P2003':
          return {
            code: 'FOREIGN_KEY_CONSTRAINT_VIOLATION',
            message: '참조하는 데이터가 존재하지 않습니다',
            details: { field: error.meta?.field_name },
          };
        case 'P2025':
          return {
            code: 'RECORD_NOT_FOUND',
            message: '요청한 데이터를 찾을 수 없습니다',
            details: { cause: error.meta?.cause },
          };
        default:
          return {
            code: `PRISMA_ERROR_${error.code}`,
            message: error.message,
            details: { meta: error.meta },
          };
      }
    }

    if (error instanceof Prisma.PrismaClientValidationError) {
      return {
        code: 'VALIDATION_ERROR',
        message: '데이터 유효성 검사 실패',
        details: { message: error.message },
      };
    }

    if (error instanceof Prisma.PrismaClientInitializationError) {
      return {
        code: 'DATABASE_CONNECTION_ERROR',
        message: '데이터베이스 연결에 실패했습니다',
        details: { errorCode: error.errorCode },
      };
    }

    if (error instanceof Error) {
      return {
        code: 'UNKNOWN_ERROR',
        message: error.message,
      };
    }

    return {
      code: 'UNKNOWN_ERROR',
      message: 'An unexpected error occurred',
    };
  }
}
