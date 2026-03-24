import type { NextResponse } from 'next/server';

import { portalWebSecurityConfig } from './server-runtime';
import {
  LEGACY_PORTAL_SESSION_COOKIE,
  LEGACY_PORTAL_TOKEN_COOKIE,
  LEGACY_PORTAL_USER_COOKIE
} from './session-constants';

export function clearLegacyPortalAuthCookies(response: NextResponse) {
  const options = {
    httpOnly: false,
    secure: portalWebSecurityConfig.secureCookies,
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 0
  };

  response.cookies.set(LEGACY_PORTAL_TOKEN_COOKIE, '', options);
  response.cookies.set(LEGACY_PORTAL_USER_COOKIE, '', options);
  response.cookies.set(LEGACY_PORTAL_SESSION_COOKIE, '', {
    ...options,
    httpOnly: true
  });
}
