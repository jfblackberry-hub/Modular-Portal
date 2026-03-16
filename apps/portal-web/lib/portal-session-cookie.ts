import { PORTAL_SESSION_COOKIE } from './session-constants';

const SESSION_COOKIE_VERSION = 1;
const DEFAULT_SESSION_SECRET = 'local-dev-portal-session-secret-change-me';

type SessionEnvelope = {
  accessToken: string;
  exp: number;
  iat: number;
  user: Record<string, unknown>;
  v: number;
};

function getSessionSecret() {
  return process.env.PORTAL_SESSION_SECRET ?? DEFAULT_SESSION_SECRET;
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
      Array.isArray(parsed.user)
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
