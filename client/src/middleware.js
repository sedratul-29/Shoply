import { NextResponse } from 'next/server';

// Lightweight gate: sends visitors without a session cookie to the login page.
// This is only a UX convenience. Real authentication and authorization
// (including the admin role check) are enforced by the Express API on every request.
export function middleware(req) {
  const hasSession = req.cookies.get('token');
  if (!hasSession) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.search = `?next=${encodeURIComponent(req.nextUrl.pathname)}`;
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/checkout', '/orders/:path*', '/orders', '/profile'],
};
