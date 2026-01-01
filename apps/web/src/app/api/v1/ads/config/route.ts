import { NextRequest } from 'next/server';
import { proxyToBackend } from '@/lib/api/proxy';

// Ads config doesn't require auth (but backend will check user's premium status if token provided)
export async function GET(request: NextRequest) {
  return proxyToBackend(request, '/api/v1/ads/config', { requireAuth: false });
}
