import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const token = searchParams.get('token');

  // URL untuk redirect
  const dashboardUrl = new URL('/dashboard', request.url);
  const loginUrl = new URL('/login?error=GoogleLoginFailed', request.url);

  if (!token) {
    return NextResponse.redirect(loginUrl);
  }

  // Set response yang akan meredirect ke dashboard
  const response = NextResponse.redirect(dashboardUrl);

  // Set secure cookie dengan JWT dari backend
  response.cookies.set({
    name: 'jwt',
    value: token,
    httpOnly: true,
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7 // 1 minggu
  });

  return response;
}
