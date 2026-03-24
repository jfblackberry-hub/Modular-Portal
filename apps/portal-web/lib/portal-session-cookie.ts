import { loadPortalSessionConfig } from '@payer-portal/config';

import {
  LEGACY_PORTAL_SESSION_COOKIE,
  PORTAL_SESSION_COOKIE
} from './session-constants';

const SESSION_COOKIE_VERSION = 1;

type SessionEnvelope = {
  accessToken: string;
  exp: number;
  iat: number;
  user: Record<string, unknown>;
  v: number;
};

const SESSION_TYPES = new Set(['tenant_admin', 'end_user', 'platform_admin']);
const LANDING_CONTEXTS = new Set([
  'member',
  'provider',
  'broker',
  'employer',
  'tenant_admin',
  'platform_admin'
]);

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === 'string');
}

function hasValidPortalSessionUser(user: Record<string, unknown>) {
  if (
    typeof user.id !== 'string' ||
    !user.id.trim() ||
    typeof user.email !== 'string' ||
    !user.email.trim() ||
    typeof user.firstName !== 'string' ||
    typeof user.lastName !== 'string' ||
    !isStringArray(user.roles) ||
    !isStringArray(user.permissions)
  ) {
    return false;
  }

  if (
    !user.tenant ||
    typeof user.tenant !== 'object' ||
    Array.isArray(user.tenant) ||
    typeof (user.tenant as Record<string, unknown>).id !== 'string' ||
    !((user.tenant as Record<string, unknown>).id as string).trim() ||
    typeof (user.tenant as Record<string, unknown>).name !== 'string' ||
    !((user.tenant as Record<string, unknown>).name as string).trim()
  ) {
    return false;
  }

  if (
    user.landingContext !== undefined &&
    (typeof user.landingContext !== 'string' || !LANDING_CONTEXTS.has(user.landingContext))
  ) {
    return false;
  }

  if (
    !user.session ||
    typeof user.session !== 'object' ||
    Array.isArray(user.session)
  ) {
    return false;
  }

  const session = user.session as Record<string, unknown>;

  if (
    typeof session.personaType !== 'string' ||
    !SESSION_TYPES.has(session.personaType)
  ) {
    return false;
  }

  if (
    typeof session.type !== 'string' ||
    !SESSION_TYPES.has(session.type) ||
    !isStringArray(session.roles) ||
    !isStringArray(session.permissions) ||
    (session.tenantId !== null &&
      (typeof session.tenantId !== 'string' || !(session.tenantId as string).trim())) ||
    session.personaType !== session.type
  ) {
    return false;
  }

  if (session.type === 'tenant_admin' || session.type === 'end_user') {
    if (
      session.tenantId === null ||
      (session.type === 'tenant_admin' &&
        (user.landingContext !== 'tenant_admin' ||
          (user as Record<string, unknown>).previewSession !== undefined))
    ) {
      return false;
    }
  }

  if (session.type === 'platform_admin') {
    if (
      user.landingContext !== 'platform_admin' ||
      (user as Record<string, unknown>).previewSession !== undefined
    ) {
      return false;
    }
  }

  if (
    session.type === 'end_user' &&
    user.landingContext !== undefined &&
    (user.landingContext === 'tenant_admin' || user.landingContext === 'platform_admin')
  ) {
    return false;
  }

  if ((user as Record<string, unknown>).previewSession !== undefined) {
    const previewSession = (user as Record<string, unknown>).previewSession;

    if (
      !previewSession ||
      typeof previewSession !== 'object' ||
      Array.isArray(previewSession)
    ) {
      return false;
    }

    const preview = previewSession as Record<string, unknown>;

    if (
      session.type !== 'end_user' ||
      typeof preview.id !== 'string' ||
      !preview.id.trim() ||
      typeof preview.portalType !== 'string' ||
      typeof preview.persona !== 'string' ||
      typeof preview.mode !== 'string' ||
      typeof preview.adminUserEmail !== 'string' ||
      typeof preview.createdAt !== 'string' ||
      typeof preview.expiresAt !== 'string' ||
      typeof preview.homePath !== 'string'
    ) {
      return false;
    }
  }

  return true;
}

function getSessionSecret() {
  return loadPortalSessionConfig().portalSessionSecret;
}

function normalizeBase64(base64url: string) {
  const withBase64Chars = base64url.replace(/-/g, '+').replace(/_/g, '/');
  const paddingLength = (4 - (withBase64Chars.length % 4)) % 4;
  return withBase64Chars + '='.repeat(paddingLength);
}

function toBase64Url(bytes: Uint8Array) {
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  const base64 =
    typeof btoa === 'function'
      ? btoa(binary)
      : Buffer.from(binary, 'binary').toString('base64');

  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function fromBase64Url(base64url: string) {
  const normalized = normalizeBase64(base64url);
  const binary =
    typeof atob === 'function'
      ? atob(normalized)
      : Buffer.from(normalized, 'base64').toString('binary');

  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

async function importSigningKey() {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(getSessionSecret()),
    {
      name: 'HMAC',
      hash: 'SHA-256'
    },
    false,
    ['sign', 'verify']
  );
}

async function signPayload(payloadBase64Url: string) {
  const key = await importSigningKey();
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(payloadBase64Url)
  );

  return toBase64Url(new Uint8Array(signature));
}

async function verifySignature(payloadBase64Url: string, signatureBase64Url: string) {
  const key = await importSigningKey();
  return crypto.subtle.verify(
    'HMAC',
    key,
    fromBase64Url(signatureBase64Url),
    new TextEncoder().encode(payloadBase64Url)
  );
}

export function getSessionMaxAge(rememberMe: boolean) {
  return rememberMe ? 60 * 60 * 8 : 60 * 60;
}

export async function createSignedPortalSessionCookieValue(input: {
  accessToken: string;
  maxAgeSeconds: number;
  user: Record<string, unknown>;
}) {
  if (!hasValidPortalSessionUser(input.user)) {
    throw new Error('Invalid portal session payload.');
  }

  const now = Math.floor(Date.now() / 1000);
  const payload: SessionEnvelope = {
    v: SESSION_COOKIE_VERSION,
    iat: now,
    exp: now + input.maxAgeSeconds,
    accessToken: input.accessToken,
    user: input.user
  };

  const payloadBase64Url = toBase64Url(
    new TextEncoder().encode(JSON.stringify(payload))
  );
  const signatureBase64Url = await signPayload(payloadBase64Url);

  return `${payloadBase64Url}.${signatureBase64Url}`;
}

export async function readPortalSessionEnvelopeFromCookie(
  cookieValue: string | undefined | null
) {
  if (!cookieValue) {
    return null;
  }

  const [payloadBase64Url, signatureBase64Url] = cookieValue.split('.');
  if (!payloadBase64Url || !signatureBase64Url) {
    return null;
  }

  const valid = await verifySignature(payloadBase64Url, signatureBase64Url);
  if (!valid) {
    return null;
  }

  try {
    const decodedPayload = new TextDecoder().decode(fromBase64Url(payloadBase64Url));
    const parsed = JSON.parse(decodedPayload) as SessionEnvelope;

    if (
      parsed.v !== SESSION_COOKIE_VERSION ||
      typeof parsed.exp !== 'number' ||
      typeof parsed.iat !== 'number' ||
      typeof parsed.accessToken !== 'string' ||
      !parsed.accessToken.trim() ||
      parsed.exp <= Math.floor(Date.now() / 1000) ||
      !parsed.user ||
      typeof parsed.user !== 'object' ||
      Array.isArray(parsed.user) ||
      !hasValidPortalSessionUser(parsed.user)
    ) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export async function readPortalSessionFromCookie(
  cookieValue: string | undefined | null
) {
  const envelope = await readPortalSessionEnvelopeFromCookie(cookieValue);
  return envelope?.user ?? null;
}

export function getPortalSessionCookieName() {
  return PORTAL_SESSION_COOKIE;
}

export function getPortalSessionCookieNames() {
  return [PORTAL_SESSION_COOKIE, LEGACY_PORTAL_SESSION_COOKIE] as const;
}

export function getPortalSessionCookieOptions(input: {
  maxAge: number;
  path?: string;
}) {
  const { security } = loadPortalSessionConfig();

  return {
    httpOnly: true,
    secure: security.secureCookies,
    sameSite: security.portalSessionCookieSameSite,
    path: input.path ?? '/',
    maxAge: input.maxAge,
    ...(security.portalSessionCookieDomain
      ? {
          domain: security.portalSessionCookieDomain
        }
      : {})
  } as const;
}

export function getExpiredPortalSessionCookieOptions(input?: { path?: string }) {
  return getPortalSessionCookieOptions({
    maxAge: 0,
    path: input?.path ?? '/'
  });
}
