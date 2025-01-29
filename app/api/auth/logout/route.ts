export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  const response = NextResponse.json({ success: true });
  
  // List of cookies we know we need to clear
  const cookieNames = [
    'user',
    'sb-access-token',
    'sb-refresh-token',
    'supabase-auth-token',
    '__session',
    'next-auth.session-token',
    'next-auth.csrf-token',
    'next-auth.callback-url',
  ];
  
  // Clear each cookie
  cookieNames.forEach(name => {
    response.cookies.set(name, '', {
      expires: new Date(0),
      path: '/',
    });
  });

  return response;
}

// Keep GET for backward compatibility
export async function GET(request: Request) {
  const response = NextResponse.redirect(new URL('/', new URL(request.url).origin));
  
  const cookieNames = [
    'user',
    'sb-access-token',
    'sb-refresh-token',
    'supabase-auth-token',
    '__session',
    'next-auth.session-token',
    'next-auth.csrf-token',
    'next-auth.callback-url',
  ];
  
  cookieNames.forEach(name => {
    response.cookies.set(name, '', {
      expires: new Date(0),
      path: '/',
    });
  });

  return response;
}
