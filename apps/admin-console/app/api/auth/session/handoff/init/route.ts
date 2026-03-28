import { NextResponse } from 'next/server';

import { createAdminSessionFromAuthUser } from '../../../../../../lib/admin-session';
import { storePendingAdminSession } from '../../../../../../lib/admin-session-handoff';
import { config } from '../../../../../../lib/server-runtime';

type AuthMePayload = {
  id: string;
  email: string;
  tenantId?: string | null;
  permissions: string[];
  roles: string[];
  landingContext?: string | null;
  session?: {
    type?: string | null;
    tenantId?: string | null;
    roles?: string[] | null;
    permissions?: string[] | null;
  } | null;
};

function getBearerToken(request: Request) {
  const value = request.headers.get('authorization')?.trim() ?? '';
  const [scheme, token] = value.split(/\s+/, 2);

  if (scheme?.toLowerCase() !== 'bearer' || !token?.trim()) {
    return null;
  }

  return token.trim();
}

export async function POST(request: Request) {
  const accessToken = getBearerToken(request);

  if (!accessToken) {
    return NextResponse.json(
      { message: 'Authorization token required for admin session handoff.' },
      { status: 401 }
    );
  }

  const body = (await request.json().catch(() => null)) as
    | {
        redirectPath?: string;
      }
    | null;

  try {
    const authResponse = await fetch(`${config.serviceEndpoints.auth}/auth/me`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`
      },
      cache: 'no-store'
    });

    const payload = (await authResponse.json().catch(() => null)) as
      | (AuthMePayload & { message?: string })
      | null;

    if (!authResponse.ok || !payload) {
      return NextResponse.json(
        { message: payload?.message ?? 'Unable to verify admin session handoff.' },
        { status: authResponse.status || 502 }
      );
    }

    const adminSession = createAdminSessionFromAuthUser(payload);

    if (!adminSession) {
      return NextResponse.json(
        { message: 'Selected user does not have admin console access.' },
        { status: 403 }
      );
    }

    const artifact = storePendingAdminSession({
      accessToken,
      session: adminSession
    });

    return NextResponse.json(
      {
        artifact,
        redirectPath:
          body?.redirectPath ||
          (adminSession.isPlatformAdmin
            ? '/admin/overview/health'
            : adminSession.tenantId
              ? `/admin/tenants/${adminSession.tenantId}/organization`
              : '/admin')
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { message: 'Local API unavailable. Start the API service and try again.' },
      { status: 503 }
    );
  }
}
