import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  if (!clientId) {
    return NextResponse.json({ error: 'Missing GOOGLE_CLIENT_ID' }, { status: 500 });
  }

  // Determine the base URL dynamically based on the request
  const url = new URL(request.url);
  const redirectUri = `${url.origin}/api/auth/callback`;

  // Generate a random state for CSRF protection
  const state = Math.random().toString(36).substring(2, 15);

  const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  googleAuthUrl.searchParams.append('client_id', clientId);
  googleAuthUrl.searchParams.append('redirect_uri', redirectUri);
  googleAuthUrl.searchParams.append('response_type', 'code');
  googleAuthUrl.searchParams.append('scope', 'https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile');
  googleAuthUrl.searchParams.append('state', state);

  const response = NextResponse.redirect(googleAuthUrl.toString());

  // Save state in a secure cookie
  response.cookies.set({
    name: 'google_oauth_state',
    value: state,
    httpOnly: true,
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 10 // 10 minutes
  });

  return response;
}
