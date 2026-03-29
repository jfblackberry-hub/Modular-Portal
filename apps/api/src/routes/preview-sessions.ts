import { prisma } from '@payer-portal/database';
import { logPersonaSwitchEvent } from '@payer-portal/server';
import type { FastifyInstance } from 'fastify';

import { verifyAccessToken } from '../services/access-token-service';
import {
  assertPlatformAdmin,
  AuthenticationError,
  AuthorizationError,
  getCurrentUserFromHeaders
} from '../services/current-user-service';
import {
  createPreviewSession,
  duplicatePreviewSession,
  endPreviewSession,
  getPreviewSessionStateForAdmin,
  getPreviewSessionStateForCurrentUser,
  listPreviewSessionCatalog,
  listPreviewSessions,
  recordPreviewSessionEvent,
  resolvePreviewLaunch
} from '../services/preview-session-service';

type CreatePreviewSessionBody = {
  tenantId: string;
  subTenantId?: string;
  portalType: 'member' | 'provider' | 'broker' | 'employer';
  persona: string;
  mode: 'READ_ONLY' | 'FUNCTIONAL';
};

type PreviewSessionEventBody = {
  type:
    | 'route_changed'
    | 'route_blocked'
    | 'workflow_action_invoked'
    | 'write_attempted'
    | 'write_completed'
    | 'entitlement_mismatch'
    | 'failed_navigation_attempt';
  route: string;
  fromRoute?: string;
  detail?: string;
  statusCode?: number;
};

type PersonaSessionAuditBody = {
  action:
    | 'persona.session.opened'
    | 'persona.session.focused'
    | 'persona.session.closed';
  sessionId: string;
  tenantId: string;
  personaType: string;
  userId: string;
};

function normalizeRequired(value: string, fieldName: string) {
  const normalized = value.trim();

  if (!normalized) {
    throw new Error(`${fieldName} is required.`);
  }

  return normalized;
}

async function assertAuthorizedPersonaAuditTenantScope(
  currentUser: Awaited<ReturnType<typeof getCurrentUserFromHeaders>>,
  tenantId: string
) {
  const targetTenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: {
      id: true,
      isActive: true
    }
  });

  if (!targetTenant?.isActive) {
    throw new AuthorizationError(
      'Target tenant scope is unavailable for persona session auditing.'
    );
  }

  if (
    currentUser.sessionType !== 'platform_admin' &&
    !currentUser.accessibleTenantIds.includes(tenantId)
  ) {
    throw new AuthorizationError(
      'You do not have access to audit persona activity for that tenant.'
    );
  }
}

function getPreviewTokenPayload(authorizationHeader: string | string[] | undefined) {
  const value = Array.isArray(authorizationHeader)
    ? authorizationHeader[0]
    : authorizationHeader;
  const [scheme, token] = value?.trim().split(/\s+/, 2) ?? [];

  if (!scheme || !token || scheme.toLowerCase() !== 'bearer') {
    throw new AuthenticationError();
  }

  const payload = verifyAccessToken(token);

  if (!payload?.previewSessionId) {
    throw new AuthorizationError('Preview session context is required.');
  }

  return payload;
}

function handleRouteError(
  error: unknown,
  reply: { status: (code: number) => { send: (body: unknown) => unknown } }
) {
  if (error instanceof AuthenticationError) {
    return reply.status(401).send({ message: error.message });
  }

  if (error instanceof AuthorizationError) {
    return reply.status(403).send({ message: error.message });
  }

  if (error instanceof Error) {
    return reply.status(400).send({ message: error.message });
  }

  return reply.status(503).send({
    message:
      'Local database unavailable. Start PostgreSQL, run migrations.'
  });
}

export async function previewSessionRoutes(app: FastifyInstance) {
  app.get('/platform-admin/preview-sessions/catalog', async (request, reply) => {
    try {
      const currentUser = await getCurrentUserFromHeaders(request.headers);
      assertPlatformAdmin(currentUser);

      return await listPreviewSessionCatalog();
    } catch (error) {
      return handleRouteError(error, reply);
    }
  });

  app.get('/platform-admin/preview-sessions', async (request, reply) => {
    try {
      const currentUser = await getCurrentUserFromHeaders(request.headers);
      assertPlatformAdmin(currentUser);

      return await listPreviewSessions(currentUser.id);
    } catch (error) {
      return handleRouteError(error, reply);
    }
  });

  app.post<{ Body: CreatePreviewSessionBody }>(
    '/platform-admin/preview-sessions',
    async (request, reply) => {
      try {
        const currentUser = await getCurrentUserFromHeaders(request.headers);
        assertPlatformAdmin(currentUser);

        const session = await createPreviewSession(request.body, {
          actorUserId: currentUser.id,
          ipAddress: request.ip,
          userAgent: request.headers['user-agent']
        });

        return reply.status(201).send(session);
      } catch (error) {
        return handleRouteError(error, reply);
      }
    }
  );

  app.post<{ Body: PersonaSessionAuditBody }>(
    '/platform-admin/persona-sessions/events',
    async (request, reply) => {
      try {
        const currentUser = await getCurrentUserFromHeaders(request.headers);
        assertPlatformAdmin(currentUser);

        const tenantId = normalizeRequired(request.body.tenantId, 'tenantId');
        await assertAuthorizedPersonaAuditTenantScope(currentUser, tenantId);

        await logPersonaSwitchEvent({
          tenantId,
          actorUserId: currentUser.id,
          action: request.body.action,
          resourceType: 'persona_session',
          resourceId: normalizeRequired(request.body.sessionId, 'sessionId'),
          metadata: {
            adminSurface: 'admin_console',
            personaType: normalizeRequired(request.body.personaType, 'personaType'),
            targetUserId: normalizeRequired(request.body.userId, 'userId')
          },
          request: {
            correlationId: request.id,
            method: request.method,
            route: request.routeOptions.url,
            statusCode: 202
          },
          ipAddress: request.ip,
          userAgent: request.headers['user-agent']
        });

        return reply.status(202).send({ ok: true });
      } catch (error) {
        return handleRouteError(error, reply);
      }
    }
  );

  app.post<{ Params: { sessionId: string } }>(
    '/platform-admin/preview-sessions/:sessionId/duplicate',
    async (request, reply) => {
      try {
        const currentUser = await getCurrentUserFromHeaders(request.headers);
        assertPlatformAdmin(currentUser);

        const session = await duplicatePreviewSession(request.params.sessionId, {
          actorUserId: currentUser.id,
          ipAddress: request.ip,
          userAgent: request.headers['user-agent']
        });

        return reply.status(201).send(session);
      } catch (error) {
        return handleRouteError(error, reply);
      }
    }
  );

  app.delete<{ Params: { sessionId: string } }>(
    '/platform-admin/preview-sessions/:sessionId',
    async (request, reply) => {
      try {
        const currentUser = await getCurrentUserFromHeaders(request.headers);
        assertPlatformAdmin(currentUser);

        return await endPreviewSession(request.params.sessionId, {
          actorUserId: currentUser.id,
          ipAddress: request.ip,
          userAgent: request.headers['user-agent']
        });
      } catch (error) {
        return handleRouteError(error, reply);
      }
    }
  );

  app.get<{ Params: { sessionId: string } }>(
    '/platform-admin/preview-sessions/:sessionId/state',
    async (request, reply) => {
      try {
        const currentUser = await getCurrentUserFromHeaders(request.headers);
        assertPlatformAdmin(currentUser);

        return await getPreviewSessionStateForAdmin(request.params.sessionId, currentUser.id);
      } catch (error) {
        return handleRouteError(error, reply);
      }
    }
  );

  app.get<{ Params: { launchToken: string } }>(
    '/preview-sessions/launch/:launchToken',
    async (request, reply) => {
      try {
        return await resolvePreviewLaunch(request.params.launchToken);
      } catch (error) {
        return handleRouteError(error, reply);
      }
    }
  );

  app.get('/preview-sessions/current/state', async (request, reply) => {
    try {
      const currentUser = await getCurrentUserFromHeaders(request.headers);

      if (!currentUser.previewSessionId) {
        throw new AuthorizationError('Preview session context is required.');
      }

      return await getPreviewSessionStateForCurrentUser({
        previewSessionId: currentUser.previewSessionId,
        userId: currentUser.id,
        tenantId: currentUser.tenantId
      });
    } catch (error) {
      return handleRouteError(error, reply);
    }
  });

  app.post<{ Body: PreviewSessionEventBody }>(
    '/preview-sessions/current/events',
    async (request, reply) => {
      try {
        const currentUser = await getCurrentUserFromHeaders(request.headers);
        const tokenPayload = getPreviewTokenPayload(request.headers.authorization);

        if (tokenPayload.sub !== currentUser.id) {
          throw new AuthenticationError('Access token subject mismatch.');
        }

        await recordPreviewSessionEvent({
          previewSessionId: tokenPayload.previewSessionId!,
          actorUserId: currentUser.id,
          tenantId: tokenPayload.tenantId,
          type: request.body.type,
          route: request.body.route,
          fromRoute: request.body.fromRoute,
          detail: request.body.detail,
          statusCode: request.body.statusCode,
          ipAddress: request.ip,
          userAgent: request.headers['user-agent']
        });

        return reply.status(202).send({ ok: true });
      } catch (error) {
        return handleRouteError(error, reply);
      }
    }
  );
}
