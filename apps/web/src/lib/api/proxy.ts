import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ErrorCode, ErrorMessages } from '@glint/types';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000';

interface ProxyOptions {
  requireAuth?: boolean;
  timeout?: number;
}

/**
 * Proxy request to NestJS backend
 * Handles auth token passthrough and error normalization
 */
export async function proxyToBackend(
  request: NextRequest,
  path: string,
  options: ProxyOptions = {}
): Promise<NextResponse> {
  const { requireAuth = true, timeout = 30000 } = options;

  try {
    // Get auth token if required
    let authHeader: string | undefined;

    if (requireAuth) {
      const supabase = await createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.access_token) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: ErrorCode.AUTH_UNAUTHORIZED,
              message: ErrorMessages[ErrorCode.AUTH_UNAUTHORIZED],
            },
          },
          { status: 401 }
        );
      }

      authHeader = `Bearer ${session.access_token}`;
    }

    // Build headers
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (authHeader) {
      headers['Authorization'] = authHeader;
    }

    // Forward additional headers
    const forwardHeaders = ['x-user-id', 'x-session-id', 'accept-language'];
    forwardHeaders.forEach((header) => {
      const value = request.headers.get(header);
      if (value) {
        headers[header] = value;
      }
    });

    // Build request URL with query params
    const url = new URL(request.url);
    const backendUrl = `${BACKEND_URL}${path}${url.search}`;

    // Get request body for non-GET requests
    let body: string | undefined;
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      try {
        const text = await request.text();
        if (text) {
          body = text;
        }
      } catch {
        // No body
      }
    }

    // Make request to backend with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(backendUrl, {
      method: request.method,
      headers,
      body,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Get response data
    const data = await response.json();

    // Return response with same status
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Proxy error:', error);

    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCode.UNKNOWN_ERROR,
            message: 'Request timeout',
          },
        },
        { status: 504 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: ErrorCode.INTERNAL_ERROR,
          message: 'Failed to connect to backend',
        },
      },
      { status: 502 }
    );
  }
}

/**
 * Create a proxy handler for a specific backend path
 */
export function createProxyHandler(
  backendPath: string,
  options: ProxyOptions = {}
) {
  return async (request: NextRequest) => {
    return proxyToBackend(request, backendPath, options);
  };
}

/**
 * Create a proxy handler with dynamic path parameter
 */
export function createDynamicProxyHandler(
  buildPath: (params: Record<string, string>) => string,
  options: ProxyOptions = {}
) {
  return async (
    request: NextRequest,
    { params }: { params: Promise<Record<string, string>> }
  ) => {
    const resolvedParams = await params;
    const path = buildPath(resolvedParams);
    return proxyToBackend(request, path, options);
  };
}
