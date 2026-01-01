import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * OAuth callback handler for Supabase authentication
 *
 * This route handles the redirect from OAuth providers (Google, Kakao)
 * after successful authentication. It exchanges the authorization code
 * for a session and redirects to the appropriate page.
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');
  const errorDescription = requestUrl.searchParams.get('error_description');

  // OAuth 에러 처리
  if (error) {
    console.error('[OAuth Callback] Error:', error, errorDescription);
    const loginUrl = new URL('/login', requestUrl.origin);
    loginUrl.searchParams.set('error', errorDescription || error);
    return NextResponse.redirect(loginUrl);
  }

  // Authorization code가 없는 경우
  if (!code) {
    console.error('[OAuth Callback] No authorization code provided');
    const loginUrl = new URL('/login', requestUrl.origin);
    loginUrl.searchParams.set('error', 'No authorization code received');
    return NextResponse.redirect(loginUrl);
  }

  try {
    const supabase = await createClient();

    // Authorization code를 세션으로 교환
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      console.error('[OAuth Callback] Code exchange failed:', exchangeError.message);
      const loginUrl = new URL('/login', requestUrl.origin);
      loginUrl.searchParams.set('error', 'Authentication failed. Please try again.');
      return NextResponse.redirect(loginUrl);
    }

    // 인증 성공 - 채팅 페이지로 리다이렉트
    return NextResponse.redirect(new URL('/chat', requestUrl.origin));
  } catch (err) {
    console.error('[OAuth Callback] Unexpected error:', err);
    const loginUrl = new URL('/login', requestUrl.origin);
    loginUrl.searchParams.set('error', 'An unexpected error occurred');
    return NextResponse.redirect(loginUrl);
  }
}
