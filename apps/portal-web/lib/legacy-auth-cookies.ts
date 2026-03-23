import type { NextResponse } from 'next/server';

import { portalWebSecurityConfig } from './server-runtime';
import {
  PORTAL_TOKEN_COOKIE,
  PORTAL_USER_COOKIE
} from './session-constants';

export function clearLegacyPortalAuthCookies(response: NextResponse) {
  const options = {
    httpOnly: false,
    secure: portalWebSecurityConfig.secureCookies,
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 0
  };

  response.cookies.set(PORTAL_TOKEN_COOKIE, '', options);
  response.cookies.set(PORTAL_USER_COOKIE, '', options);
}
