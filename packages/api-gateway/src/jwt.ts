import { createHmac, timingSafeEqual } from 'node:crypto';

import { apiGatewayRuntimeConfig } from './runtime-config.js';
import type { GatewayJwtClaims } from './types.js';

const JWT_ALGORITHM = 'HS256';
const JWT_ISSUER = 'payer-portal-api-gateway';
const DEFAULT_TOKEN_TTL_SECONDS = 60 * 60;

type JwtUser = {
  id: string;
  email: string;
  tenant: {
    id: string;
  };
  roles: string[];
  permissions: string[];
};

function encodeBase64Url(value: string) {
  return Buffer.from(value).toString('base64url');
}

function decodeBase64Url(value: string) {
  return Buffer.from(value, 'base64url').toString('utf8');
}

function getJwtSecret() {
  return apiGatewayRuntimeConfig.apiGatewayJwtSecret;
}

function signSegment(value: string) {
  return createHmac('sha256', getJwtSecret()).update(value).digest('base64url');
}

export function createGatewayToken(user: JwtUser): string {
  const issuedAt = Math.floor(Date.now() / 1000);
  const expiresAt =
    issuedAt + (apiGatewayRuntimeConfig.jwtTtlSeconds ?? DEFAULT_TOKEN_TTL_SECONDS);

  const header = encodeBase64Url(
    JSON.stringify({
      alg: JWT_ALGORITHM,
      typ: 'JWT'
    })
  );

  const payload = encodeBase64Url(
    JSON.stringify({
      sub: user.id,
      email: user.email,
      tenantId: user.tenant.id,
      roles: user.roles,
      permissions: user.permissions,
      iat: issuedAt,
      exp: expiresAt,
      iss: JWT_ISSUER
    } satisfies GatewayJwtClaims)
  );

  const signature = signSegment(`${header}.${payload}`);

  return `${header}.${payload}.${signature}`;
}

export function verifyGatewayToken(token: string): GatewayJwtClaims {
  const [header, payload, signature] = token.split('.');

  if (!header || !payload || !signature) {
    throw new Error('Malformed JWT');
  }

  const expectedSignature = signSegment(`${header}.${payload}`);
  const actualSignature = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (
    actualSignature.length !== expectedBuffer.length ||
    !timingSafeEqual(actualSignature, expectedBuffer)
  ) {
    throw new Error('Invalid JWT signature');
  }

  const decodedHeader = JSON.parse(decodeBase64Url(header)) as {
    alg?: string;
    typ?: string;
  };

  if (decodedHeader.alg !== JWT_ALGORITHM || decodedHeader.typ !== 'JWT') {
    throw new Error('Unsupported JWT header');
  }

  const claims = JSON.parse(decodeBase64Url(payload)) as GatewayJwtClaims;
  const now = Math.floor(Date.now() / 1000);

  if (claims.iss !== JWT_ISSUER) {
    throw new Error('Invalid JWT issuer');
  }

  if (claims.exp <= now) {
    throw new Error('JWT expired');
  }

  return claims;
}
