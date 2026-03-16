import { NextResponse } from 'next/server';

import {
  PORTAL_SESSION_COOKIE,
  PORTAL_TOKEN_COOKIE,
  PORTAL_USER_COOKIE
} from '../../../../lib/session-constants';

export async function POST() {
  const response = NextResponse.json({ success: true });

  response.cookies.set(PORTAL_SESSION_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0
  });
  response.cookies.set(PORTAL_TOKEN_COOKIE, '', {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0
  });
  response.cookies.set(PORTAL_USER_COOKIE, '', {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0
  });

  return response;
}
