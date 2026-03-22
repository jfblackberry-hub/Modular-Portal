import type { FastifyInstance } from 'fastify';

import {
  assertPlatformAdmin,
  AuthenticationError,
  AuthorizationError,
  getCurrentUserFromHeaders
} from '../services/current-user-service';
import { verifyAccessToken } from '../services/access-token-service';
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
  portalType: 'member' | 'provider' | 'broker' | 'employer' | 'tenant_admin';
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
      'Local database unavailable. Start PostgreSQL, run migrations, and seed data.'
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
        userId: currentUser.id
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
