import { NextResponse } from 'next/server';

import {
  ADMIN_SESSION_COOKIE,
  getExpiredAdminSessionCookieOptions,
  readAdminSessionEnvelopeFromCookie
} from '../../../../lib/admin-session-cookie';
import { config } from '../../../../lib/server-runtime';

export async function POST(request: Request) {
  const nextResponse = NextResponse.json({ ok: true }, { status: 200 });
  nextResponse.cookies.set(
    ADMIN_SESSION_COOKIE,
    '',
    getExpiredAdminSessionCookieOptions()
  );

  try {
    const sessionEnvelope = readAdminSessionEnvelopeFromCookie(
      request.headers.get('cookie')
        ?.split(';')
        .map((entry) => entry.trim())
        .find((entry) => entry.startsWith(`${ADMIN_SESSION_COOKIE}=`))
        ?.slice(`${ADMIN_SESSION_COOKIE}=`.length)
    );
    const tenantId = request.headers.get('x-tenant-id');

    if (sessionEnvelope?.accessToken) {
      await fetch(`${config.serviceEndpoints.auth}/auth/logout`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${sessionEnvelope.accessToken}`,
          ...(tenantId
            ? {
                'x-tenant-id': tenantId
              }
            : {})
        },
        cache: 'no-store'
      }).catch(() => null);
    }

    return nextResponse;
  } catch {
    return nextResponse;
  }
}
