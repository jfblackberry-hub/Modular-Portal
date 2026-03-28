import { NextResponse } from 'next/server';

import { clearLegacyPortalAuthCookies } from '../../../../../lib/legacy-auth-cookies';
import {
  createSignedPortalSessionCookieValue,
  getPortalSessionCookieOptions,
  getSessionMaxAge
} from '../../../../../lib/portal-session-cookie';
import { config } from '../../../../../lib/server-runtime';
import { PORTAL_SESSION_COOKIE } from '../../../../../lib/session-constants';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      userId?: string;
      audience?: 'admin' | 'payer' | 'provider';
      tenantId?: string | null;
      persona?: string;
      rememberMe?: boolean;
    };
    const rememberMe = body.rememberMe !== false;

    const response = await fetch(`${config.serviceEndpoints.auth}/auth/login/auto`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId: body.userId ?? '',
        audience: body.audience,
        tenantId: body.tenantId ?? null,
        persona: body.persona
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

    nextResponse.cookies.set(
      PORTAL_SESSION_COOKIE,
      sessionCookieValue,
      getPortalSessionCookieOptions({
        maxAge
      })
    );
    clearLegacyPortalAuthCookies(nextResponse);

    return nextResponse;
  } catch {
    return NextResponse.json(
      { message: 'Local API unavailable. Start the API service and try again.' },
      { status: 503 }
    );
  }
}
