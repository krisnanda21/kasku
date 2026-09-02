import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');

  // Verify State to prevent CSRF
  const savedState = request.cookies.get('google_oauth_state')?.value;
  if (!state || state !== savedState) {
    return NextResponse.redirect(new URL('/login?error=InvalidState', request.url));
  }

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=MissingCode', request.url));
  }

  const redirectUri = `${request.nextUrl.origin}/api/auth/callback`;

  // Server-to-Server token exchange
  try {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';
    const res = await fetch(`${backendUrl}/auth/google/exchange`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code: code,
        redirect_uri: redirectUri,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('Backend exchange failed:', errText);
      // Append the actual error text to the URL for debugging
      const encodedErr = encodeURIComponent(errText);
      return NextResponse.redirect(new URL(`/login?error=ExchangeFailed&detail=${encodedErr}`, request.url));
    }

    const data = await res.json();
    const token = data.token;

    if (!token) {
      return NextResponse.redirect(new URL('/login?error=NoToken', request.url));
    }

    const response = NextResponse.redirect(new URL('/dashboard', request.url));
    
    // Clear the state cookie
    response.cookies.delete('google_oauth_state');

    response.cookies.set({
      name: 'jwt',
      value: token,
      httpOnly: true,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7 // 1 week
    });

    return response;
  } catch (error) {
    console.error('Auth callback error:', error);
    return NextResponse.redirect(new URL('/login?error=ServerError', request.url));
  }
}

