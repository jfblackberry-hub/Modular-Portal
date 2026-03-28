import { createHmac, timingSafeEqual } from 'node:crypto';

import { loadAdminConsoleServiceConfig } from '@payer-portal/config';

import type { AdminSession } from './admin-session';

export const ADMIN_SESSION_HANDOFF_AUDIENCE = 'admin-console';
export const ADMIN_SESSION_HANDOFF_TTL_SECONDS = 60;

type AdminSessionHandoffClaims = {
  accessToken: string;
  aud: string;
  exp: number;
  iat: number;
  session: AdminSession;
};

function toBase64Url(value: string) {
  return Buffer.from(value, 'utf8').toString('base64url');
}

function fromBase64Url<T>(value: string) {
  return JSON.parse(Buffer.from(value, 'base64url').toString('utf8')) as T;
}

function getAdminSessionHandoffSecret() {
  return loadAdminConsoleServiceConfig().sessionSecret;
}

function signSegment(value: string) {
  return createHmac('sha256', getAdminSessionHandoffSecret())
    .update(value)
    .digest('base64url');
}

export function createAdminSessionHandoffArtifact(input: {
  accessToken: string;
  audience?: string;
  expiresAt?: Date;
  issuedAt?: Date;
  session: AdminSession;
}) {
  const issuedAt = input.issuedAt ?? new Date();
  const expiresAt =
    input.expiresAt ??
    new Date(issuedAt.getTime() + ADMIN_SESSION_HANDOFF_TTL_SECONDS * 1_000);

  const claims: AdminSessionHandoffClaims = {
    accessToken: input.accessToken,
    aud: input.audience ?? ADMIN_SESSION_HANDOFF_AUDIENCE,
    exp: Math.floor(expiresAt.getTime() / 1_000),
    iat: Math.floor(issuedAt.getTime() / 1_000),
    session: input.session
  };

  const payload = toBase64Url(JSON.stringify(claims));
  const signature = signSegment(payload);
  return `${payload}.${signature}`;
}

export function storePendingAdminSession(input: {
  accessToken: string;
  session: AdminSession;
}) {
  return createAdminSessionHandoffArtifact({
    accessToken: input.accessToken,
    session: input.session
  });
}

export function consumePendingAdminSession(
  artifact: string,
  expectedAudience = ADMIN_SESSION_HANDOFF_AUDIENCE
) {
  const [payload, signature] = artifact.split('.');

  if (!payload || !signature) {
    throw new Error('Malformed admin session handoff artifact.');
  }

  const expectedSignature = signSegment(payload);

  if (
    signature.length !== expectedSignature.length ||
    !timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))
  ) {
    throw new Error('Invalid admin session handoff signature.');
  }

  const claims = fromBase64Url<AdminSessionHandoffClaims>(payload);

  if (claims.aud !== expectedAudience) {
    throw new Error('Admin session handoff audience mismatch.');
  }

  if (claims.exp * 1_000 <= Date.now()) {
    throw new Error('Admin session handoff expired.');
  }

  if (!claims.accessToken?.trim()) {
    throw new Error('Admin session handoff access token missing.');
  }

  if (!claims.session) {
    throw new Error('Admin session handoff session payload missing.');
  }

  return {
    accessToken: claims.accessToken,
    session: claims.session
  };
}
