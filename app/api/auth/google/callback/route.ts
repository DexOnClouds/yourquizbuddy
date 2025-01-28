export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

async function upsertUserData(userData: {
  email: string;
  provider: string;
  user_id: string;
  name: string;
}) {
  // Check if user exists
  const { data: existingUser } = await supabase
    .from('userdata')
    .select('*')
    .eq('email', userData.email)
    .single();

  if (!existingUser) {
    // User doesn't exist, insert new user
    const { error: insertError } = await supabase
      .from('userdata')
      .insert([userData]);

    if (insertError) throw insertError;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const baseUrl = request.headers.get('origin') || new URL(request.url).origin;

  if (!code) {
    return NextResponse.json({ error: 'No code provided' }, { status: 400 });
  }

  try {
    // Exchange code for tokens
    const tokens = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code,
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: `${baseUrl}/api/auth/google/callback`,
        grant_type: 'authorization_code',
      }),
    });

    const tokensData = await tokens.json();

    // Get user info using access token
    const userInfo = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${tokensData.access_token}`,
      },
    });

    const user = await userInfo.json();

    // Save or update user data in Supabase
    await upsertUserData({
      email: user.email,
      provider: 'google',
      user_id: user.id,
      name: user.name
    });

    // Rename id to user_id in user object
    const userWithStandardId = {
      ...user,
      user_id: user.id
    };
    delete userWithStandardId.id;

    // Create session cookie
    const response = NextResponse.redirect(new URL('/dashboard', baseUrl));
    response.cookies.set('user', JSON.stringify(userWithStandardId), {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 1 week
    });

    return response;
  } catch (error) {
    console.error('OAuth error:', error);
    return NextResponse.redirect(
      new URL('/auth?error=OAuth failed', baseUrl)
    );
  }
}
