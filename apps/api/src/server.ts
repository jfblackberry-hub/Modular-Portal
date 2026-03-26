import { randomUUID } from 'node:crypto';

import { readProcessEnv } from '@payer-portal/config';
import { clearTenantContext, setTenantContext } from '@payer-portal/database';
import {
  createStructuredLogger,
  initializeMonitoring,
  logAuthenticationEvent,
  logAuthorizationFailure,
  recordApiRequest,
  recordAuthenticatedSessionActivity,
  registerBillingEnrollmentAdapters
} from '@payer-portal/server';
import Fastify from 'fastify';

import { registerPlugins } from './plugins';
import { registerRoutes } from './routes';
import { apiRuntimeConfig } from './runtime-config';
import { verifyAccessToken } from './services/access-token-service';
import { logPreviewSessionActivity } from './services/preview-session-service';
import { resolveOptionalTenantContext } from './services/tenant-context-service';

const serviceLogger = createStructuredLogger({
  observability: {
    capabilityId: 'platform.api',
    failureType: 'none',
    tenantId: 'platform'
  },
  serviceName: apiRuntimeConfig.observability.serviceName
});

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

function resolveAuditTenantId(
  tokenPayload: ReturnType<typeof verifyAccessToken>
) {
  if (tokenPayload?.tenantId && tokenPayload.tenantId !== 'platform') {
    return tokenPayload.tenantId;
  }

  return null;
}

function isTenantContextExemptRoute(url: string) {
  return (
    url === '/liveness' ||
    url === '/readiness' ||
    url === '/health' ||
    url.startsWith('/health/') ||
    url.startsWith('/api/health/') ||
    url === '/public/platform-branding/custom.css' ||
    url === '/metrics' ||
    url === '/auth/login' ||
    url === '/auth/login/provider' ||
    url === '/auth/login/employer' ||
    url === '/auth/portal-handoffs/consume' ||
    url.startsWith('/preview-sessions/launch/')
  );
}

export function buildServer() {
  initializeMonitoring();
  registerBillingEnrollmentAdapters();

  const app = Fastify({
    trustProxy: apiRuntimeConfig.security.trustProxy,
    logger: {
      level: apiRuntimeConfig.observability.logLevel,
      base: {
        service: apiRuntimeConfig.observability.serviceName
      },
      messageKey: 'message'
    },
    genReqId(request) {
      const headerValue = request.headers['x-correlation-id'];
      const correlationId =
        typeof headerValue === 'string'
          ? headerValue
          : Array.isArray(headerValue)
            ? headerValue[0]
            : undefined;

      return correlationId?.trim() || randomUUID();
    },
    requestIdHeader: 'x-correlation-id'
  });

  app.addHook('onRequest', async (request, reply) => {
    clearTenantContext();
    request.headers['x-request-start-ms'] = String(Date.now());
    reply.header('x-correlation-id', request.id);

    try {
      const tenantContext = resolveOptionalTenantContext(request.headers);

      if (!tenantContext) {
        if (!isTenantContextExemptRoute(request.url)) {
          return reply.status(401).send({
            message:
              'Tenant context required. Provide a tenant-scoped bearer token.'
          });
        }
      } else {
        clearTenantContext();
        // Attach the tenant to async request-local DB context immediately so all
        // downstream Prisma access stays bound to the authenticated tenant.
        setTenantContext(tenantContext);
      }
    } catch (error) {
      return reply.status(403).send({
        message:
          error instanceof Error ? error.message : 'Tenant context mismatch.'
      });
    }

    const tokenPayload = verifyAccessToken(
      getBearerToken(request.headers.authorization)
    );
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
    const startedAt = Number(
      request.headers['x-request-start-ms'] ?? Date.now()
    );
    const route = request.routeOptions.url || request.url;
    const durationMs = Date.now() - startedAt;

    recordApiRequest({
      durationMs,
      method: request.method,
      route,
      statusCode: reply.statusCode
    });

    const tokenPayload = verifyAccessToken(
      getBearerToken(request.headers.authorization)
    );

    const bearerToken = getBearerToken(request.headers.authorization);
    if (tokenPayload && bearerToken) {
      recordAuthenticatedSessionActivity({
        token: bearerToken,
        userId: tokenPayload.sub,
        tenantId: tokenPayload.tenantId,
        sessionType: tokenPayload.sessionType
      });
    }

    request.log.info(
      {
        capabilityId: 'platform.api',
        correlationId: request.id,
        durationMs,
        failureType: 'none',
        method: request.method,
        orgUnitId: undefined,
        route,
        statusCode: reply.statusCode,
        tenantId:
          tokenPayload?.tenantId && tokenPayload.tenantId !== 'platform'
            ? tokenPayload.tenantId
            : 'platform'
      },
      'request completed'
    );

    if (reply.statusCode === 401 || reply.statusCode === 403) {
      const tenantId = resolveAuditTenantId(tokenPayload);

      if (tenantId) {
        const auditInput = {
          tenantId,
          actorUserId: tokenPayload?.sub ?? null,
          resourceType: 'route',
          resourceId: route,
          request: {
            correlationId: request.id,
            method: request.method,
            route,
            statusCode: reply.statusCode
          },
          metadata: {
            outcome:
              reply.statusCode === 401
                ? 'authentication_failed'
                : 'authorization_failed'
          },
          ipAddress: request.ip,
          userAgent: request.headers['user-agent']
        } as const;

        const auditPromise =
          reply.statusCode === 401
            ? logAuthenticationEvent({
                ...auditInput,
                action: 'auth.authentication.failed'
              })
            : logAuthorizationFailure(auditInput);

        await auditPromise.catch(() => undefined);
      }
    }

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

    clearTenantContext();
  });

  app.addHook('onError', async () => {
    clearTenantContext();
  });

  app.setErrorHandler((error, request, reply) => {
    const resolvedError =
      error instanceof Error ? error : new Error(String(error));
    const tokenPayload = verifyAccessToken(
      getBearerToken(request.headers.authorization)
    );
    const statusCode =
      typeof (error as { statusCode?: unknown }).statusCode === 'number' &&
      (error as { statusCode?: number }).statusCode! >= 400
        ? (error as { statusCode?: number }).statusCode!
        : 500;

    request.log.error(
      {
        capabilityId: 'platform.api',
        correlationId: request.id,
        errorMessage: resolvedError.message,
        errorName: resolvedError.name,
        failureType: statusCode >= 500 ? 'system' : 'validation',
        method: request.method,
        orgUnitId: undefined,
        route: request.routeOptions.url || request.url,
        stack: resolvedError.stack,
        tenantId:
          tokenPayload?.tenantId && tokenPayload.tenantId !== 'platform'
            ? tokenPayload.tenantId
            : 'platform'
      },
      'request failed'
    );

    if (reply.sent) {
      clearTenantContext();
      return;
    }

    reply.status(statusCode).send({
      message:
        statusCode >= 500 ? 'Internal server error' : resolvedError.message,
      correlationId: request.id
    });

    clearTenantContext();
  });

  registerPlugins(app);
  registerRoutes(app);

  return app;
}

async function start() {
  const app = buildServer();
  const port = apiRuntimeConfig.port ?? apiRuntimeConfig.runtimeModel.ports.api;
  const host = apiRuntimeConfig.host;

  try {
    await app.listen({ port, host });
    serviceLogger.info('api service started', {
      correlationId: resolveStartupCorrelationId(),
      host,
      port,
      tenantId: 'platform'
    });
  } catch (error) {
    serviceLogger.error('api service failed to start', {
      correlationId: resolveStartupCorrelationId(),
      failureType: 'system',
      errorMessage: error instanceof Error ? error.message : String(error)
    });
    process.exit(1);
  }
}

function resolveStartupCorrelationId() {
  return readProcessEnv('STARTUP_CORRELATION_ID') || randomUUID();
}

if (readProcessEnv('PAYER_PORTAL_API_AUTOSTART') !== 'false') {
  void start();
}
