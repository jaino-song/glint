import { NextRequest } from 'next/server';
import { proxyToBackend } from '@/lib/api/proxy';
import { checkRateLimit, rateLimiters } from '@/lib/api/rate-limit';
import { errorJson, requireAuth } from '@/lib/api/helpers';
import { ErrorCode } from '@glint/types';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { user } = await requireAuth();
  if (user) {
    const rateLimit = await checkRateLimit(rateLimiters.chat, user.id);
    if (!rateLimit.success) {
      return errorJson(ErrorCode.RATE_LIMITED, 'Too many messages', 429);
    }
  }

  const { id } = await params;
  return proxyToBackend(request, `/api/v1/chat/sessions/${id}/messages`);
}
