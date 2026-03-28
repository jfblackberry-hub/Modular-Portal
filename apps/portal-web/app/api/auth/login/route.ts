import { NextResponse } from 'next/server';

import {
  createAdminSessionHandoff,
  requiresAdminSessionHandoff
} from '../../../../lib/admin-session-handoff';
import { clearLegacyPortalAuthCookies } from '../../../../lib/legacy-auth-cookies';
import {
  createSignedPortalSessionCookieValue,
  getPortalSessionCookieOptions,
  getSessionMaxAge
} from '../../../../lib/portal-session-cookie';
import { config } from '../../../../lib/server-runtime';
import { PORTAL_SESSION_COOKIE } from '../../../../lib/session-constants';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      email?: string;
      password?: string;
      rememberMe?: boolean;
      tenantId?: string;
      organizationUnitId?: string;
    };
    const rememberMe = body.rememberMe !== false;
    const response = await fetch(`${config.serviceEndpoints.auth}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: body.email ?? '',
        password: body.password ?? '',
        ...(body.tenantId?.trim()
          ? { tenantId: body.tenantId.trim() }
          : {}),
        ...(body.organizationUnitId?.trim()
          ? { organizationUnitId: body.organizationUnitId.trim() }
          : {})
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

    if (requiresAdminSessionHandoff(payload.user as never)) {
      const handoff = await createAdminSessionHandoff({
        accessToken: payload.token,
        user: payload.user as never
      });

      return NextResponse.json(handoff, { status: 200 });
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
      { message: 'Local sign-in unavailable. Start the local services and try again.' },
      { status: 503 }
    );
  }
}
