import { createHmac, timingSafeEqual } from 'node:crypto';

import { loadPortalSessionConfig } from './index.js';

export const PORTAL_AUTH_HANDOFF_AUDIENCE = 'portal-web';
export const PORTAL_AUTH_HANDOFF_TTL_SECONDS = 60;

type PortalAuthHandoffClaims = {
  aud: string;
  exp: number;
  handoffId: string;
  iat: number;
};

function toBase64Url(value: string) {
  return Buffer.from(value, 'utf8').toString('base64url');
}

function fromBase64Url<T>(value: string) {
  return JSON.parse(Buffer.from(value, 'base64url').toString('utf8')) as T;
}

function getPortalAuthHandoffSecret() {
  return loadPortalSessionConfig().portalSessionSecret;
}

function signSegment(value: string) {
  return createHmac('sha256', getPortalAuthHandoffSecret())
    .update(value)
    .digest('base64url');
}

export function createPortalAuthHandoffArtifact(input: {
  audience?: string;
  expiresAt?: Date;
  handoffId: string;
  issuedAt?: Date;
}) {
  const issuedAt = input.issuedAt ?? new Date();
  const expiresAt =
    input.expiresAt ??
    new Date(issuedAt.getTime() + PORTAL_AUTH_HANDOFF_TTL_SECONDS * 1_000);

  const claims: PortalAuthHandoffClaims = {
    aud: input.audience ?? PORTAL_AUTH_HANDOFF_AUDIENCE,
    exp: Math.floor(expiresAt.getTime() / 1_000),
    handoffId: input.handoffId,
    iat: Math.floor(issuedAt.getTime() / 1_000)
  };

  const payload = toBase64Url(JSON.stringify(claims));
  const signature = signSegment(payload);

  return `${payload}.${signature}`;
}

export function readPortalAuthHandoffArtifact(
  artifact: string,
  expectedAudience = PORTAL_AUTH_HANDOFF_AUDIENCE
) {
  const [payload, signature] = artifact.split('.');

  if (!payload || !signature) {
    throw new Error('Malformed portal auth handoff artifact.');
  }

  const expectedSignature = signSegment(payload);

  if (
    signature.length !== expectedSignature.length ||
    !timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))
  ) {
    throw new Error('Invalid portal auth handoff signature.');
  }

  const claims = fromBase64Url<PortalAuthHandoffClaims>(payload);

  if (claims.aud !== expectedAudience) {
    throw new Error('Portal auth handoff audience mismatch.');
  }

  if (!claims.handoffId?.trim()) {
    throw new Error('Portal auth handoff identifier missing.');
  }

  if (claims.exp * 1_000 <= Date.now()) {
    throw new Error('Portal auth handoff expired.');
  }

  return claims;
}
