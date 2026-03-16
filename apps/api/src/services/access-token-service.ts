import { createHmac, timingSafeEqual } from 'node:crypto';

const ACCESS_TOKEN_VERSION = 1;
const ACCESS_TOKEN_KIND = 'portal-access';
const DEFAULT_ACCESS_TOKEN_SECRET = 'local-dev-api-access-token-secret-change-me';
const DEFAULT_ACCESS_TOKEN_TTL_SECONDS = 60 * 60 * 8;

type AccessTokenPayload = {
  v: number;
  kind: string;
  sub: string;
  email: string;
  tenantId: string;
  iat: number;
  exp: number;
};

function getAccessTokenSecret() {
  return process.env.API_AUTH_TOKEN_SECRET ?? DEFAULT_ACCESS_TOKEN_SECRET;
}

function signPayload(payloadBase64Url: string) {
  return createHmac('sha256', getAccessTokenSecret())
    .update(payloadBase64Url)
    .digest('base64url');
}

function safeEqualSignature(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

export function createAccessToken(input: {
  userId: string;
  email: string;
  tenantId: string;
  ttlSeconds?: number;
}) {
  const now = Math.floor(Date.now() / 1000);
  const payload: AccessTokenPayload = {
    v: ACCESS_TOKEN_VERSION,
    kind: ACCESS_TOKEN_KIND,
    sub: input.userId,
    email: input.email,
    tenantId: input.tenantId,
    iat: now,
    exp: now + (input.ttlSeconds ?? DEFAULT_ACCESS_TOKEN_TTL_SECONDS)
  };

  const payloadBase64Url = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signatureBase64Url = signPayload(payloadBase64Url);
  return `${payloadBase64Url}.${signatureBase64Url}`;
}

export function verifyAccessToken(token: string | null | undefined) {
  if (!token) {
    return null;
  }

  const [payloadBase64Url, signatureBase64Url] = token.split('.');
  if (!payloadBase64Url || !signatureBase64Url) {
    return null;
  }

  const expectedSignatureBase64Url = signPayload(payloadBase64Url);
  if (!safeEqualSignature(signatureBase64Url, expectedSignatureBase64Url)) {
    return null;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(payloadBase64Url, 'base64url').toString('utf8')
    ) as AccessTokenPayload;

    if (
      payload.v !== ACCESS_TOKEN_VERSION ||
      payload.kind !== ACCESS_TOKEN_KIND ||
      typeof payload.sub !== 'string' ||
      !payload.sub.trim() ||
      typeof payload.email !== 'string' ||
      !payload.email.trim() ||
      typeof payload.tenantId !== 'string' ||
      !payload.tenantId.trim() ||
      typeof payload.iat !== 'number' ||
      typeof payload.exp !== 'number' ||
      payload.exp <= Math.floor(Date.now() / 1000)
    ) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}
