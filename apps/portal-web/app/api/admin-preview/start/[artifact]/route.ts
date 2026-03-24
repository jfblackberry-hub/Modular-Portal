import { NextResponse } from 'next/server';

import {
  createSignedPortalSessionCookieValue,
  getPortalSessionCookieOptions
} from '../../../../../lib/portal-session-cookie';
import { config } from '../../../../../lib/server-runtime';
import { PORTAL_SESSION_COOKIE } from '../../../../../lib/session-constants';

export async function GET(
  request: Request,
  context: { params: Promise<{ artifact: string }> }
) {
  const { artifact } = await context.params;
  const launchArtifact = artifact.trim();
  const url = new URL(request.url);

  if (!launchArtifact) {
    return NextResponse.redirect(
      new URL('/preview/error?reason=missing-launch-artifact', url)
    );
  }

  const response = await fetch(
    `${config.apiBaseUrl}/preview-sessions/launch/${encodeURIComponent(launchArtifact)}`,
    {
      cache: 'no-store'
    }
  );

  const payload = (await response.json().catch(() => null)) as
    | {
        session?: {
          sessionId: string;
          launchPath: string;
          createdAt: string;
          expiresAt: string;
        };
        accessToken?: string;
        user?: Record<string, unknown>;
        message?: string;
      }
    | null;

  if (!response.ok || !payload?.session || !payload.accessToken || !payload.user) {
    const redirectUrl = new URL(
      `/preview/error?reason=${encodeURIComponent(payload?.message ?? 'launch-failed')}`,
      url
    );
    return NextResponse.redirect(redirectUrl);
  }

  const maxAge = Math.max(
    60,
    Math.floor(
      (new Date(payload.session.expiresAt).getTime() - Date.now()) / 1000
    )
  );
  const sessionCookieValue = await createSignedPortalSessionCookieValue({
    accessToken: payload.accessToken,
    user: payload.user,
    maxAgeSeconds: maxAge
  });
  const nextResponse = NextResponse.redirect(
    new URL(payload.session.launchPath, url)
  );

  nextResponse.cookies.set(
    PORTAL_SESSION_COOKIE,
    sessionCookieValue,
    getPortalSessionCookieOptions({
      path: payload.session.launchPath,
      maxAge
    })
  );

  return nextResponse;
}
