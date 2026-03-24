import { randomUUID } from 'node:crypto';

import { createPortalAuthHandoffArtifact, readPortalAuthHandoffArtifact } from '@payer-portal/config/portal-handoff';
import { type Prisma,prisma } from '@payer-portal/database';
import { logAuditEvent } from '@payer-portal/server';

import { getAuthenticatedSessionResultByUserId } from './auth-service';

const DEFAULT_PORTAL_AUTH_HANDOFF_REDIRECT_PATH = '/dashboard';

export class PortalAuthHandoffError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = 'PortalAuthHandoffError';
    this.statusCode = statusCode;
  }
}

function normalizeRedirectPath(value: string | undefined) {
  const normalized = value?.trim();

  if (!normalized) {
    return DEFAULT_PORTAL_AUTH_HANDOFF_REDIRECT_PATH;
  }

  if (!normalized.startsWith('/') || normalized.startsWith('//')) {
    throw new PortalAuthHandoffError('Invalid portal auth handoff redirect path.', 400);
  }

  return normalized;
}

function toJsonValue(value: Record<string, unknown>) {
  return value as Prisma.InputJsonValue;
}

export async function issuePortalAuthHandoff(input: {
  actorUserId: string;
  audience: string;
  ipAddress?: string;
  redirectPath?: string;
  userAgent?: string;
}) {
  const sessionResult = await getAuthenticatedSessionResultByUserId(input.actorUserId);
  const tenantId = sessionResult.user.session.tenantId;

  if (!tenantId || sessionResult.user.session.type !== 'end_user') {
    throw new PortalAuthHandoffError(
      'Portal auth handoff is only available for end-user portal sessions.',
      403
    );
  }

  const redirectPath = normalizeRedirectPath(input.redirectPath);
  const expiresAt = new Date(Date.now() + 60_000);
  const handoff = await prisma.portalAuthHandoff.create({
    data: {
      id: randomUUID(),
      tenantId,
      userId: sessionResult.user.id,
      audience: input.audience,
      redirectPath,
      accessToken: sessionResult.token,
      userSnapshot: toJsonValue(sessionResult.user as Record<string, unknown>),
      expiresAt
    }
  });

  const artifact = createPortalAuthHandoffArtifact({
    audience: input.audience,
    expiresAt,
    handoffId: handoff.id
  });

  await logAuditEvent({
    tenantId,
    actorUserId: sessionResult.user.id,
    action: 'auth.portal_handoff.issued',
    entityType: 'PortalAuthHandoff',
    entityId: handoff.id,
    metadata: {
      audience: input.audience,
      redirectPath
    },
    ipAddress: input.ipAddress,
    userAgent: input.userAgent
  }).catch(() => undefined);

  return {
    artifact,
    expiresAt,
    redirectPath
  };
}

export async function consumePortalAuthHandoff(input: {
  artifact: string;
  audience: string;
  ipAddress?: string;
  userAgent?: string;
}) {
  let handoffId: string | null = null;

  try {
    const claims = readPortalAuthHandoffArtifact(input.artifact, input.audience);
    handoffId = claims.handoffId;
  } catch (error) {
    throw new PortalAuthHandoffError(
      error instanceof Error ? error.message : 'Invalid portal auth handoff artifact.',
      401
    );
  }

  const handoff = await prisma.portalAuthHandoff.findFirst({
    where: {
      id: handoffId,
      audience: input.audience
    }
  });

  if (!handoff) {
    throw new PortalAuthHandoffError('Portal auth handoff not found.', 404);
  }

  const now = new Date();

  if (handoff.expiresAt.getTime() <= now.getTime()) {
    await logAuditEvent({
      tenantId: handoff.tenantId,
      actorUserId: handoff.userId,
      action: 'auth.portal_handoff.rejected',
      entityType: 'PortalAuthHandoff',
      entityId: handoff.id,
      metadata: {
        audience: input.audience,
        reason: 'expired'
      },
      ipAddress: input.ipAddress,
      userAgent: input.userAgent
    }).catch(() => undefined);

    throw new PortalAuthHandoffError('Portal auth handoff expired.', 401);
  }

  if (handoff.consumedAt) {
    await logAuditEvent({
      tenantId: handoff.tenantId,
      actorUserId: handoff.userId,
      action: 'auth.portal_handoff.rejected',
      entityType: 'PortalAuthHandoff',
      entityId: handoff.id,
      metadata: {
        audience: input.audience,
        reason: 'replayed'
      },
      ipAddress: input.ipAddress,
      userAgent: input.userAgent
    }).catch(() => undefined);

    throw new PortalAuthHandoffError('Portal auth handoff already consumed.', 401);
  }

  const consumeResult = await prisma.portalAuthHandoff.updateMany({
    where: {
      id: handoff.id,
      consumedAt: null,
      expiresAt: {
        gt: now
      }
    },
    data: {
      consumedAt: now
    }
  });

  if (consumeResult.count === 0) {
    throw new PortalAuthHandoffError('Portal auth handoff already consumed.', 401);
  }

  await logAuditEvent({
    tenantId: handoff.tenantId,
    actorUserId: handoff.userId,
    action: 'auth.portal_handoff.consumed',
    entityType: 'PortalAuthHandoff',
    entityId: handoff.id,
    metadata: {
      audience: input.audience,
      redirectPath: handoff.redirectPath
    },
    ipAddress: input.ipAddress,
    userAgent: input.userAgent
  }).catch(() => undefined);

  return {
    accessToken: handoff.accessToken,
    redirectPath: handoff.redirectPath,
    user: handoff.userSnapshot as Record<string, unknown>
  };
}
