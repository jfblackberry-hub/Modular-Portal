import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';

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

function getAdminSessionHandoffSecret() {
  return loadAdminConsoleServiceConfig().sessionSecret;
}

function getEncryptionKey() {
  return createHash('sha256').update(getAdminSessionHandoffSecret()).digest();
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

  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', getEncryptionKey(), iv);
  const ciphertext = Buffer.concat([
    cipher.update(JSON.stringify(claims), 'utf8'),
    cipher.final()
  ]);
  const authTag = cipher.getAuthTag();

  return `v1.${iv.toString('base64url')}.${ciphertext.toString('base64url')}.${authTag.toString('base64url')}`;
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
  const [version, ivSegment, payloadSegment, authTagSegment] = artifact.split('.');

  if (version !== 'v1' || !ivSegment || !payloadSegment || !authTagSegment) {
    throw new Error('Malformed admin session handoff artifact.');
  }
  let claims: AdminSessionHandoffClaims;

  try {
    const decipher = createDecipheriv(
      'aes-256-gcm',
      getEncryptionKey(),
      Buffer.from(ivSegment, 'base64url')
    );
    decipher.setAuthTag(Buffer.from(authTagSegment, 'base64url'));
    const plaintext = Buffer.concat([
      decipher.update(Buffer.from(payloadSegment, 'base64url')),
      decipher.final()
    ]).toString('utf8');
    claims = JSON.parse(plaintext) as AdminSessionHandoffClaims;
  } catch {
    throw new Error('Invalid admin session handoff signature.');
  }

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
