import { NextRequest } from 'next/server';
import { proxyToBackend } from '@/lib/api/proxy';
import { checkRateLimit, rateLimiters } from '@/lib/api/rate-limit';
import { errorJson, requireAuth } from '@/lib/api/helpers';
import { ErrorCode } from '@glint/types';

export async function GET(request: NextRequest) {
  // Rate limiting
  const { user } = await requireAuth();
  if (user) {
    const rateLimit = await checkRateLimit(rateLimiters.general, user.id);
    if (!rateLimit.success) {
      return errorJson(ErrorCode.RATE_LIMITED, 'Too many requests', 429);
    }
  }

  return proxyToBackend(request, '/api/v1/auth/me');
}

export async function PATCH(request: NextRequest) {
  // Rate limiting
  const { user } = await requireAuth();
  if (user) {
    const rateLimit = await checkRateLimit(rateLimiters.general, user.id);
    if (!rateLimit.success) {
      return errorJson(ErrorCode.RATE_LIMITED, 'Too many requests', 429);
    }
  }

  return proxyToBackend(request, '/api/v1/auth/me');
}
