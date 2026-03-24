import './lib/runtime-config';

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (
    pathname === '/api/auth/login' ||
    pathname === '/api/auth/me' ||
    pathname === '/api/auth/session/handoff' ||
    pathname === '/api/auth/logout'
  ) {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*']
};
