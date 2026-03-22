import { NextResponse } from 'next/server';

import {
  createSignedPortalSessionCookieValue,
  getSessionMaxAge
} from '../../../../lib/portal-session-cookie';
import { PORTAL_SESSION_COOKIE } from '../../../../lib/session-constants';

const apiBaseUrl =
  process.env.API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  'http://localhost:3002';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get('token')?.trim();

  if (!token) {
    return NextResponse.redirect(new URL('/preview/error?reason=missing-token', url));
  }

  const response = await fetch(
    `${apiBaseUrl}/preview-sessions/launch/${encodeURIComponent(token)}`,
    {
      cache: 'no-store'
    }
  );

  const payload = (await response.json().catch(() => null)) as
    | {
        session?: {
          sessionId: string;
          launchPath: string;
          createdAt: string;
          expiresAt: string;
        };
        accessToken?: string;
        user?: Record<string, unknown>;
        message?: string;
      }
    | null;

  if (!response.ok || !payload?.session || !payload.accessToken || !payload.user) {
    const redirectUrl = new URL(
      `/preview/error?reason=${encodeURIComponent(payload?.message ?? 'launch-failed')}`,
      url
    );
    return NextResponse.redirect(redirectUrl);
  }

  const maxAge = Math.max(
    60,
    Math.floor(
      (new Date(payload.session.expiresAt).getTime() - Date.now()) / 1000
    )
  );
  const sessionCookieValue = await createSignedPortalSessionCookieValue({
    accessToken: payload.accessToken,
    user: payload.user,
    maxAgeSeconds: maxAge
  });
  const nextResponse = NextResponse.redirect(
    new URL(payload.session.launchPath, url)
  );

  nextResponse.cookies.set(PORTAL_SESSION_COOKIE, sessionCookieValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: payload.session.launchPath,
    maxAge: getSessionMaxAge(true)
  });

  return nextResponse;
}
