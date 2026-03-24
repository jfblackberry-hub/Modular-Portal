import { NextResponse } from 'next/server';

import { clearLegacyPortalAuthCookies } from '../../../../lib/legacy-auth-cookies';
import {
  createSignedPortalSessionCookieValue,
  getPortalSessionCookieOptions,
  getSessionMaxAge
} from '../../../../lib/portal-session-cookie';
import { config } from '../../../../lib/server-runtime';
import { PORTAL_SESSION_COOKIE } from '../../../../lib/session-constants';

function buildCorsHeaders(origin: string | null) {
  if (!origin || origin !== config.serviceEndpoints.admin) {
    return null;
  }

  return {
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'OPTIONS, POST',
    'Access-Control-Allow-Origin': origin,
    Vary: 'Origin'
  } as const;
}

export async function OPTIONS(request: Request) {
  const headers = buildCorsHeaders(request.headers.get('origin'));

  if (!headers) {
    return new NextResponse(null, { status: 403 });
  }

  return new NextResponse(null, {
    status: 204,
    headers
  });
}

export async function POST(request: Request) {
  const headers = buildCorsHeaders(request.headers.get('origin'));

  if (!headers) {
    return NextResponse.json(
      { message: 'Portal handoff origin rejected.' },
      { status: 403 }
    );
  }

  const payload = (await request.json().catch(() => null)) as
    | {
        artifact?: string;
      }
    | null;
  const artifact = payload?.artifact?.trim();

  if (!artifact) {
    return NextResponse.json(
      { message: 'Portal handoff artifact missing.' },
      { status: 400, headers }
    );
  }

  try {
    const response = await fetch(`${config.serviceEndpoints.auth}/auth/portal-handoffs/consume`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        artifact,
        audience: 'portal-web'
      }),
      cache: 'no-store'
    });

    const payload = (await response.json().catch(() => null)) as
      | {
          accessToken?: string;
          redirectPath?: string;
          user?: Record<string, unknown>;
        }
      | null;

    if (!response.ok || !payload?.accessToken || !payload.user) {
      return NextResponse.json(
        { message: 'Portal handoff rejected.' },
        { status: 401, headers }
      );
    }

    const maxAge = getSessionMaxAge(true);
    const sessionCookieValue = await createSignedPortalSessionCookieValue({
      accessToken: payload.accessToken,
      user: payload.user,
      maxAgeSeconds: maxAge
    });
    const redirectUrl = new URL(payload.redirectPath || '/dashboard', request.url);
    const nextResponse = NextResponse.json(
      {
        redirectPath: `${redirectUrl.pathname}${redirectUrl.search}${redirectUrl.hash}`
      },
      { status: 200, headers }
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
      { message: 'Portal handoff unavailable.' },
      { status: 503, headers }
    );
  }
}
