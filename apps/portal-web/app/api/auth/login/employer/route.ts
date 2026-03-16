import { NextResponse } from 'next/server';

import {
  createSignedPortalSessionCookieValue,
  getSessionMaxAge
} from '../../../../../lib/portal-session-cookie';
import {
  PORTAL_SESSION_COOKIE,
  PORTAL_TOKEN_COOKIE,
  PORTAL_USER_COOKIE
} from '../../../../../lib/session-constants';

const apiBaseUrl =
  process.env.API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  'http://localhost:3002';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      email?: string;
      password?: string;
      rememberMe?: boolean;
    };
    const rememberMe = body.rememberMe !== false;
    const response = await fetch(`${apiBaseUrl}/auth/login/employer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: body.email ?? '',
        password: body.password ?? ''
      }),
      cache: 'no-store'
    });

    const payload = (await response.json()) as {
      token?: string;
      user?: Record<string, unknown>;
      message?: string;
    };

    if (!response.ok || !payload.user || !payload.token) {
      return NextResponse.json(payload, { status: response.status });
    }

    const maxAge = getSessionMaxAge(rememberMe);
    const sessionCookieValue = await createSignedPortalSessionCookieValue({
      accessToken: payload.token,
      user: payload.user,
      maxAgeSeconds: maxAge
    });

    const nextResponse = NextResponse.json(
      {
        user: payload.user,
        sessionEstablished: true
      },
      { status: response.status }
    );

    nextResponse.cookies.set(PORTAL_SESSION_COOKIE, sessionCookieValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge
    });
    nextResponse.cookies.set(PORTAL_TOKEN_COOKIE, '', {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0
    });
    nextResponse.cookies.set(PORTAL_USER_COOKIE, '', {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0
    });

    return nextResponse;
  } catch {
    return NextResponse.json(
      { message: 'Local API unavailable. Start the API service and try again.' },
      { status: 503 }
    );
  }
}
