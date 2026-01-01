import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

// Protected routes that require authentication
const protectedPaths = ['/chat', '/library', '/settings', '/admin'];

// Auth routes that should redirect if already logged in
const authPaths = ['/login', '/register'];

export async function middleware(request: NextRequest) {
  const { response, user } = await updateSession(request);
  const { pathname } = request.nextUrl;

  // Skip auth check for auth callback route
  if (pathname === '/auth/callback') {
    return response;
  }

  // Check if path is protected
  const isProtectedPath = protectedPaths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );

  // Check if path is auth path
  const isAuthPath = authPaths.some((path) => pathname === path);

  // Use actual user from Supabase (not just cookie existence)
  const isAuthenticated = !!user;

  // Redirect to login if accessing protected route without valid session
  if (isProtectedPath && !isAuthenticated) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect to chat if accessing auth route with valid session
  if (isAuthPath && isAuthenticated) {
    return NextResponse.redirect(new URL('/chat', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
