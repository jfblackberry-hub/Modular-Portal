import { NextResponse } from 'next/server';

import {
  getPortalSessionAccessToken,
  getPortalSessionUser
} from '../../../../lib/portal-session';

const apiBaseUrl =
  process.env.API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  'http://localhost:3002';

export async function GET() {
  const user = await getPortalSessionUser();
  const accessToken = await getPortalSessionAccessToken();

  if (!user || !accessToken) {
    return NextResponse.json({ message: 'Authentication required.' }, { status: 401 });
  }

  try {
    const response = await fetch(`${apiBaseUrl}/api/v1/billing-enrollment/employer/dashboard`, {
      cache: 'no-store',
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
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
