import { NextResponse } from 'next/server';

import { buildPortalApiHeaders } from '../../../../lib/api-request';
import { clearLegacyPortalAuthCookies } from '../../../../lib/legacy-auth-cookies';
import { getExpiredPortalSessionCookieOptions } from '../../../../lib/portal-session-cookie';
import { apiInternalOrigin as apiBaseUrl } from '../../../../lib/server-runtime';
import { PORTAL_SESSION_COOKIE } from '../../../../lib/session-constants';

export async function POST() {
  const headers = await buildPortalApiHeaders();

  if (headers.get('authorization')) {
    try {
      const upstreamResponse = await fetch(`${apiBaseUrl}/auth/logout`, {
        method: 'POST',
        headers,
        cache: 'no-store'
      });

      if (!upstreamResponse.ok) {
        const payload = (await upstreamResponse.json().catch(() => null)) as
          | {
              message?: string;
            }
          | null;

        return NextResponse.json(
          {
            message:
              payload?.message ??
              'Unable to complete portal logout audit processing.'
          },
          {
            status: upstreamResponse.status
          }
        );
      }
    } catch {
      return NextResponse.json(
        {
          message: 'Unable to reach the logout service right now.'
        },
        {
          status: 503
        }
      );
    }
  }

  const response = NextResponse.json({ success: true });

  response.cookies.set(
    PORTAL_SESSION_COOKIE,
    '',
    getExpiredPortalSessionCookieOptions()
  );
  clearLegacyPortalAuthCookies(response);

  return response;
}
