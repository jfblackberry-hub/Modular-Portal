import { NextResponse } from 'next/server';

import { getPortalSession } from '../../../../lib/portal-session';

const apiBaseUrl =
  process.env.API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  'http://localhost:3002';

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
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.accessToken}`
    },
    body: JSON.stringify(body)
  });

  const payload = await response.json().catch(() => null);

  return NextResponse.json(payload, {
    status: response.status
  });
}
