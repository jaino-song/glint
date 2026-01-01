import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse, ApiMeta } from '@glint/types';

export interface ResponseWithMeta<T> {
  data: T;
  meta?: ApiMeta;
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(
    _context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((data) => {
        // If response already has success property, return as is
        if (data && typeof data === 'object' && 'success' in data) {
          return data;
        }

        // Check if data has meta property (for paginated responses)
        if (data && typeof data === 'object' && 'data' in data && 'meta' in data) {
          const responseWithMeta = data as ResponseWithMeta<T>;
          return {
            success: true,
            data: responseWithMeta.data,
            meta: responseWithMeta.meta,
          };
        }

        // Wrap data in success response
        return {
          success: true,
          data,
        };
      }),
    );
  }
}
