import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';

import { loadAdminConsoleServiceConfig } from '@payer-portal/config';

import type { AdminSession } from './admin-session';

export const ADMIN_SESSION_HANDOFF_AUDIENCE = 'admin-console';
export const ADMIN_SESSION_HANDOFF_TTL_SECONDS = 60;

type AdminSessionHandoffClaims = {
  aud: string;
  exp: number;
  handoffId: string;
  iat: number;
};

type PendingAdminSession = {
  accessToken: string;
  expiresAt: number;
  session: AdminSession;
};

const pendingAdminSessions = new Map<string, PendingAdminSession>();

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

function pruneExpiredPendingSessions() {
  const now = Date.now();

  for (const [handoffId, pendingSession] of pendingAdminSessions.entries()) {
    if (pendingSession.expiresAt <= now) {
      pendingAdminSessions.delete(handoffId);
    }
  }
}

export function createAdminSessionHandoffArtifact(input: {
  audience?: string;
  expiresAt?: Date;
  handoffId: string;
  issuedAt?: Date;
}) {
  const issuedAt = input.issuedAt ?? new Date();
  const expiresAt =
    input.expiresAt ??
    new Date(issuedAt.getTime() + ADMIN_SESSION_HANDOFF_TTL_SECONDS * 1_000);

  const claims: AdminSessionHandoffClaims = {
    aud: input.audience ?? ADMIN_SESSION_HANDOFF_AUDIENCE,
    exp: Math.floor(expiresAt.getTime() / 1_000),
    handoffId: input.handoffId,
    iat: Math.floor(issuedAt.getTime() / 1_000)
  };

  const payload = toBase64Url(JSON.stringify(claims));
  const signature = signSegment(payload);
  return `${payload}.${signature}`;
}

export function storePendingAdminSession(input: {
  accessToken: string;
  session: AdminSession;
}) {
  pruneExpiredPendingSessions();

  const handoffId = randomUUID();
  const expiresAt = Date.now() + ADMIN_SESSION_HANDOFF_TTL_SECONDS * 1_000;

  pendingAdminSessions.set(handoffId, {
    accessToken: input.accessToken,
    expiresAt,
    session: input.session
  });

  return createAdminSessionHandoffArtifact({ handoffId });
}

export function consumePendingAdminSession(
  artifact: string,
  expectedAudience = ADMIN_SESSION_HANDOFF_AUDIENCE
) {
  pruneExpiredPendingSessions();

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

  if (!claims.handoffId?.trim()) {
    throw new Error('Admin session handoff identifier missing.');
  }

  if (claims.exp * 1_000 <= Date.now()) {
    throw new Error('Admin session handoff expired.');
  }

  const pendingSession = pendingAdminSessions.get(claims.handoffId);

  if (!pendingSession || pendingSession.expiresAt <= Date.now()) {
    pendingAdminSessions.delete(claims.handoffId);
    throw new Error('Admin session handoff is unavailable.');
  }

  pendingAdminSessions.delete(claims.handoffId);
  return pendingSession;
}
