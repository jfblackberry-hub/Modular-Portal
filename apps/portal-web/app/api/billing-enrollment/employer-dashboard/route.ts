import { NextResponse } from 'next/server';

import { buildPortalApiHeaders } from '../../../../lib/api-request';
import {
  getPortalSession,
  getPortalSessionUser
} from '../../../../lib/portal-session';
import { config } from '../../../../lib/server-runtime';

export async function GET() {
  const user = await getPortalSessionUser();
  const session = await getPortalSession();

  if (!user || !session?.accessToken) {
    return NextResponse.json({ message: 'Authentication required.' }, { status: 401 });
  }

  try {
    const response = await fetch(`${config.apiBaseUrl}/api/v1/billing-enrollment/employer/dashboard`, {
      cache: 'no-store',
      headers: await buildPortalApiHeaders({}, {
        accessToken: session.accessToken,
        tenantId: user.session.tenantId ?? user.tenant.id
      })
    });

    const payload = await response.text();

    return new NextResponse(payload, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('content-type') ?? 'application/json'
      }
    });
  } catch {
    return NextResponse.json(
      { message: 'Unable to load employer dashboard data from API.' },
      { status: 503 }
    );
  }
}
