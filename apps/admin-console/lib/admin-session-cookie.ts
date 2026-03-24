import { createHmac, timingSafeEqual } from 'node:crypto';

import { loadAdminConsoleServiceConfig } from '@payer-portal/config';

import type { AdminSession } from './admin-session';
import { hasAdminConsoleAccess } from './admin-session';

export const ADMIN_SESSION_COOKIE = 'admin_session';
export const ADMIN_SESSION_TTL_SECONDS = 60 * 60;

type AdminSessionEnvelope = {
  accessToken: string;
  exp: number;
  iat: number;
  session: AdminSession;
  v: number;
};

const SESSION_COOKIE_VERSION = 1;

function toBase64Url(value: string) {
  return Buffer.from(value, 'utf8').toString('base64url');
}

function fromBase64Url<T>(value: string) {
  return JSON.parse(Buffer.from(value, 'base64url').toString('utf8')) as T;
}

function getAdminSessionSecret() {
  return loadAdminConsoleServiceConfig().sessionSecret;
}

function signSegment(value: string) {
  return createHmac('sha256', getAdminSessionSecret())
    .update(value)
    .digest('base64url');
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === 'string');
}

function isValidAdminSession(value: unknown): value is AdminSession {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }

  const session = value as Record<string, unknown>;

  if (
    typeof session.id !== 'string' ||
    !session.id.trim() ||
    typeof session.email !== 'string' ||
    !session.email.trim() ||
    typeof session.tenantId !== 'string' ||
    !isStringArray(session.roles) ||
    !isStringArray(session.permissions) ||
    typeof session.isPlatformAdmin !== 'boolean' ||
    typeof session.isTenantAdmin !== 'boolean'
  ) {
    return false;
  }

  return hasAdminConsoleAccess({
    isPlatformAdmin: session.isPlatformAdmin,
    isTenantAdmin: session.isTenantAdmin
  });
}

export function createSignedAdminSessionCookieValue(input: {
  accessToken: string;
  maxAgeSeconds?: number;
  session: AdminSession;
}) {
  if (!input.accessToken.trim() || !isValidAdminSession(input.session)) {
    throw new Error('Invalid admin session payload.');
  }

  const maxAgeSeconds = input.maxAgeSeconds ?? ADMIN_SESSION_TTL_SECONDS;
  const now = Math.floor(Date.now() / 1000);
  const envelope: AdminSessionEnvelope = {
    v: SESSION_COOKIE_VERSION,
    iat: now,
    exp: now + maxAgeSeconds,
    accessToken: input.accessToken,
    session: input.session
  };

  const payload = toBase64Url(JSON.stringify(envelope));
  const signature = signSegment(payload);
  return `${payload}.${signature}`;
}

export function readAdminSessionEnvelopeFromCookie(
  cookieValue: string | undefined | null
) {
  if (!cookieValue) {
    return null;
  }

  const [payload, signature] = cookieValue.split('.');

  if (!payload || !signature) {
    return null;
  }

  const expectedSignature = signSegment(payload);

  if (
    signature.length !== expectedSignature.length ||
    !timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))
  ) {
    return null;
  }

  try {
    const envelope = fromBase64Url<AdminSessionEnvelope>(payload);

    if (
      envelope.v !== SESSION_COOKIE_VERSION ||
      typeof envelope.exp !== 'number' ||
      typeof envelope.iat !== 'number' ||
      typeof envelope.accessToken !== 'string' ||
      !envelope.accessToken.trim() ||
      envelope.exp <= Math.floor(Date.now() / 1000) ||
      !isValidAdminSession(envelope.session)
    ) {
      return null;
    }

    return envelope;
  } catch {
    return null;
  }
}

export function getAdminSessionCookieOptions(input?: { maxAge?: number }) {
  const { security } = loadAdminConsoleServiceConfig();

  return {
    httpOnly: true,
    secure: security.secureCookies,
    sameSite: 'strict' as const,
    path: '/',
    maxAge: input?.maxAge ?? ADMIN_SESSION_TTL_SECONDS
  };
}

export function getExpiredAdminSessionCookieOptions() {
  return getAdminSessionCookieOptions({ maxAge: 0 });
}
