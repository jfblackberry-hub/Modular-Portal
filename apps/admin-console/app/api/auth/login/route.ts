import { NextResponse } from 'next/server';

import { apiInternalOrigin, portalPublicOrigin } from '../../../../lib/server-runtime';

function isAdminUser(roles: unknown) {
  return (
    Array.isArray(roles) &&
    roles.some(
      (role) =>
        role === 'tenant_admin' ||
        role === 'platform_admin' ||
        role === 'platform-admin'
    )
  );
}

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const response = await fetch(`${apiInternalOrigin}/auth/login`, {
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
          user?: {
            roles?: string[];
          };
          message?: string;
        }
      | null;

    if (!response.ok || !payload) {
      return NextResponse.json(payload ?? { message: 'Login failed.' }, {
        status: response.status
      });
    }

    if (payload.token && payload.user && !isAdminUser(payload.user.roles)) {
      const handoffResponse = await fetch(`${apiInternalOrigin}/auth/portal-handoffs`, {
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
          handoffUrl: `${portalPublicOrigin}/api/auth/handoff`
        },
        { status: 200 }
      );
    }

    return NextResponse.json(payload, { status: response.status });
  } catch {
    return NextResponse.json(
      { message: 'Local API unavailable. Start the API service and try again.' },
      { status: 503 }
    );
  }
}
