import { NextResponse } from 'next/server';

import {
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_TTL_SECONDS,
  createSignedAdminSessionCookieValue,
  getAdminSessionCookieOptions
} from '../../../../../lib/admin-session-cookie';
import { consumePendingAdminSession } from '../../../../../lib/admin-session-handoff';

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as
    | {
        artifact?: string;
        redirectPath?: string;
      }
    | null;
  const artifact = payload?.artifact?.trim();

  if (!artifact) {
    return NextResponse.json(
      { message: 'Admin session handoff artifact missing.' },
      { status: 400 }
    );
  }

  try {
    const pendingSession = consumePendingAdminSession(artifact);
    const cookieValue = createSignedAdminSessionCookieValue({
      accessToken: pendingSession.accessToken,
      session: pendingSession.session,
      maxAgeSeconds: ADMIN_SESSION_TTL_SECONDS
    });
    const response = NextResponse.json(
      {
        session: pendingSession.session,
        redirectPath: payload?.redirectPath || '/admin'
      },
      { status: 200 }
    );

    response.cookies.set(
      ADMIN_SESSION_COOKIE,
      cookieValue,
      getAdminSessionCookieOptions({ maxAge: ADMIN_SESSION_TTL_SECONDS })
    );

    return response;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Admin session handoff rejected.';

    return NextResponse.json({ message }, { status: 401 });
  }
}
