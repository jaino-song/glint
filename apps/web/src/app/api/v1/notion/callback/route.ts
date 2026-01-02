import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000';

/**
 * Notion OAuth 콜백 핸들러
 * 백엔드로 요청을 전달하고 리다이렉션 응답을 그대로 반환
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const backendUrl = `${BACKEND_URL}/api/v1/notion/callback${url.search}`;

  try {
    const response = await fetch(backendUrl, {
      method: 'GET',
      redirect: 'manual', // 리다이렉트를 직접 처리
    });

    // 백엔드가 리다이렉트를 반환하면 그대로 전달
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      if (location) {
        return NextResponse.redirect(location);
      }
    }

    // 일반 응답인 경우
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Notion callback proxy error:', error);
    // 에러 발생 시 설정 페이지로 리다이렉트
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    return NextResponse.redirect(`${appUrl}/settings?notion_error=connection_failed`);
  }
}
