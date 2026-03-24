import { NextResponse } from 'next/server';

import {
  ADMIN_SESSION_COOKIE,
  readAdminSessionEnvelopeFromCookie
} from '../../../../lib/admin-session-cookie';

export async function GET(request: Request) {
  try {
    const sessionEnvelope = readAdminSessionEnvelopeFromCookie(
      request.headers.get('cookie')
        ?.split(';')
        .map((entry) => entry.trim())
        .find((entry) => entry.startsWith(`${ADMIN_SESSION_COOKIE}=`))
        ?.slice(`${ADMIN_SESSION_COOKIE}=`.length)
    );

    if (!sessionEnvelope) {
      return NextResponse.json(
        { message: 'Authenticated admin session required.' },
        { status: 401 }
      );
    }

    return NextResponse.json(sessionEnvelope.session, { status: 200 });
  } catch {
    return NextResponse.json(
      { message: 'Local API unavailable. Start the API service and try again.' },
      { status: 503 }
    );
  }
}
