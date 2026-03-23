import { NextResponse } from 'next/server';

import { buildPortalApiHeaders } from '../../../../lib/api-request';
import { getPortalSession } from '../../../../lib/portal-session';
import { apiInternalOrigin as apiBaseUrl } from '../../../../lib/server-runtime';

export async function POST(request: Request) {
  const session = await getPortalSession();

  if (!session?.accessToken || !session.user.previewSession?.id) {
    return NextResponse.json(
      { message: 'Preview session context is unavailable.' },
      { status: 401 }
    );
  }

  const body = await request.json().catch(() => null);

  const response = await fetch(`${apiBaseUrl}/preview-sessions/current/events`, {
    method: 'POST',
    headers: await buildPortalApiHeaders(
      {
        'Content-Type': 'application/json'
      },
      {
        accessToken: session.accessToken,
        tenantId: session.user.session.tenantId ?? session.user.tenant.id
      }
    ),
    body: JSON.stringify(body)
  });

  const payload = await response.json().catch(() => null);

  return NextResponse.json(payload, {
    status: response.status
  });
}
