import { NextResponse } from 'next/server';

import { createAdminSessionFromAuthUser } from '../../../../lib/admin-session';
import { storePendingAdminSession } from '../../../../lib/admin-session-handoff';
import { config } from '../../../../lib/server-runtime';

type AuthUserPayload = {
  id: string;
  email: string;
  permissions: string[];
  roles: string[];
  tenant?: {
    id?: string;
  };
};

function isAuthUserPayload(value: unknown): value is AuthUserPayload {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }

  const user = value as Record<string, unknown>;

  return (
    typeof user.id === 'string' &&
    typeof user.email === 'string' &&
    Array.isArray(user.roles) &&
    user.roles.every((role) => typeof role === 'string') &&
    Array.isArray(user.permissions) &&
    user.permissions.every((permission) => typeof permission === 'string')
  );
}

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const response = await fetch(`${config.serviceEndpoints.auth}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body,
      cache: 'no-store'
    });

    const payload = (await response.json().catch(() => null)) as
      | {
          token?: string;
          user?: AuthUserPayload;
          message?: string;
        }
      | null;

    if (!response.ok || !payload) {
      return NextResponse.json(payload ?? { message: 'Login failed.' }, {
        status: response.status
      });
    }

    const authUser = isAuthUserPayload(payload?.user) ? payload.user : null;
    const adminSession =
      payload?.token && authUser ? createAdminSessionFromAuthUser(authUser) : null;

    if (payload?.token && authUser && !adminSession) {
      const handoffResponse = await fetch(`${config.serviceEndpoints.auth}/auth/portal-handoffs`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${payload.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          audience: 'portal-web',
          redirectPath: '/dashboard'
        }),
        cache: 'no-store'
      });

      const handoffPayload = (await handoffResponse.json().catch(() => null)) as
        | {
            artifact?: string;
            message?: string;
          }
        | null;

      if (!handoffResponse.ok || !handoffPayload?.artifact) {
        return NextResponse.json(
          {
            message:
              handoffPayload?.message ??
              'Unable to establish secure portal handoff.'
          },
          { status: handoffResponse.status || 502 }
        );
      }

      return NextResponse.json(
        {
          handoffRequired: true,
          artifact: handoffPayload.artifact,
          handoffUrl: `${config.serviceEndpoints.portal}/api/auth/handoff`
        },
        { status: 200 }
      );
    }

    if (!payload?.token || !authUser || !adminSession) {
      return NextResponse.json(
        { message: payload.message ?? 'Unable to establish secure admin session.' },
        { status: 401 }
      );
    }

    const artifact = storePendingAdminSession({
      accessToken: payload.token,
      session: adminSession
    });
    const redirectPath = adminSession.isPlatformAdmin
      ? '/admin/platform/health'
      : '/admin/tenant/health';

    return NextResponse.json(
      {
        sessionHandoff: true,
        artifact,
        handoffPath: '/api/auth/session/handoff',
        redirectPath
      },
      { status: response.status }
    );
  } catch {
    return NextResponse.json(
      { message: 'Local API unavailable. Start the API service and try again.' },
      { status: 503 }
    );
  }
}
