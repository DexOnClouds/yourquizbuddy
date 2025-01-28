import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Paths that require authentication
const protectedPaths = ['/dashboard', '/create-quiz', '/browse-quizzes'];
// Paths that should redirect to dashboard if user is authenticated
const authPaths = ['/auth'];

export function middleware(request: NextRequest) {
  const token = request.cookies.get('firebase-token');
  const { pathname } = request.nextUrl;

  // If accessing protected routes without token, redirect to auth
  if (protectedPaths.some(path => pathname.startsWith(path)) && !token) {
    const url = new URL('/auth', request.url);
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  // If accessing auth pages with token, redirect to dashboard
  if (authPaths.includes(pathname) && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [...protectedPaths, ...authPaths],
};
