import Fastify from 'fastify';
import {
  initializeMonitoring,
  registerBillingEnrollmentAdapters,
  registerIntegrationEventSubscriptions,
  recordApiRequest,
  registerJobEventSubscriptions
} from '@payer-portal/server';

import { verifyAccessToken } from './services/access-token-service';
import { logPreviewSessionActivity } from './services/preview-session-service';
import { registerPlugins } from './plugins';
import { registerRoutes } from './routes';

function getBearerToken(authorizationHeader: string | string[] | undefined) {
  const value = Array.isArray(authorizationHeader)
    ? authorizationHeader[0]
    : authorizationHeader;

  if (!value) {
    return null;
  }

  const [scheme, token] = value.trim().split(/\s+/, 2);
  if (!scheme || !token || scheme.toLowerCase() !== 'bearer') {
    return null;
  }

  return token;
}

export function buildServer() {
  initializeMonitoring();
  registerJobEventSubscriptions();
  registerIntegrationEventSubscriptions();
  registerBillingEnrollmentAdapters();

  const app = Fastify({
    logger: true
  });

  app.addHook('onRequest', async (request, reply) => {
    request.headers['x-request-start-ms'] = String(Date.now());

    const tokenPayload = verifyAccessToken(getBearerToken(request.headers.authorization));
    if (
      tokenPayload?.previewSessionId &&
      !['GET', 'HEAD', 'OPTIONS'].includes(request.method)
    ) {
      await logPreviewSessionActivity({
        previewSessionId: tokenPayload.previewSessionId,
        actorUserId: tokenPayload.sub,
        tenantId: tokenPayload.tenantId,
        action: 'preview.session.write.attempted',
        metadata: {
          method: request.method,
          route: request.url,
          previewMode: tokenPayload.previewMode ?? 'FUNCTIONAL'
        },
        ipAddress: request.ip,
        userAgent: request.headers['user-agent']
      }).catch(() => undefined);
    }

    if (
      tokenPayload?.previewSessionId &&
      tokenPayload.previewMode === 'READ_ONLY' &&
      !['GET', 'HEAD', 'OPTIONS'].includes(request.method) &&
      !request.url.startsWith('/preview-sessions/launch/')
    ) {
      return reply.status(403).send({
        message: 'This preview session is read-only.'
      });
    }
  });

  app.addHook('onResponse', async (request, reply) => {
    const startedAt = Number(request.headers['x-request-start-ms'] ?? Date.now());
    const route = request.routeOptions.url || request.url;

    recordApiRequest({
      durationMs: Date.now() - startedAt,
      method: request.method,
      route,
      statusCode: reply.statusCode
    });

    const tokenPayload = verifyAccessToken(getBearerToken(request.headers.authorization));
    if (tokenPayload?.previewSessionId) {
      const isWrite = !['GET', 'HEAD', 'OPTIONS'].includes(request.method);
      const action =
        isWrite && reply.statusCode < 400
          ? 'preview.session.write.completed'
          : reply.statusCode === 403
            ? 'preview.session.entitlement.mismatch'
            : request.method === 'GET'
              ? 'preview.session.requested'
              : 'preview.session.action.performed';

      await logPreviewSessionActivity({
        previewSessionId: tokenPayload.previewSessionId,
        actorUserId: tokenPayload.sub,
        tenantId: tokenPayload.tenantId,
        action,
        metadata: {
          method: request.method,
          route,
          statusCode: reply.statusCode,
          previewMode: tokenPayload.previewMode ?? 'FUNCTIONAL'
        },
        ipAddress: request.ip,
        userAgent: request.headers['user-agent']
      }).catch(() => undefined);
    }
  });

  registerPlugins(app);
  registerRoutes(app);

  return app;
}

async function start() {
  const app = buildServer();
  const port = Number(process.env.PORT ?? 3002);
  const host = process.env.HOST ?? '0.0.0.0';

  try {
    await app.listen({ port, host });
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
}

if (process.env.PAYER_PORTAL_API_AUTOSTART !== 'false') {
  void start();
}
