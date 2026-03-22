import { NextResponse } from 'next/server';

import { getPortalSessionAccessToken } from '../../../../lib/portal-session';
import {
  PORTAL_SESSION_COOKIE,
  PORTAL_TOKEN_COOKIE,
  PORTAL_USER_COOKIE
} from '../../../../lib/session-constants';

const apiBaseUrl =
  process.env.API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  'http://localhost:3002';

export async function POST() {
  const accessToken = await getPortalSessionAccessToken();

  if (accessToken) {
    try {
      await fetch(`${apiBaseUrl}/auth/logout`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`
        },
        cache: 'no-store'
      });
    } catch {
      // Ignore audit logging failures and continue clearing local session state.
    }
  }

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
