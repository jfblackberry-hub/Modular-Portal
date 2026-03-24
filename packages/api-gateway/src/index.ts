import './types.js';

import crypto from 'node:crypto';

import multipart from '@fastify/multipart';
import { prisma } from '@payer-portal/database';
import {
  createNotification,
  getUserNotifications,
  initializeMonitoring,
  markNotificationRead,
  recordApiRequest,
  registerIntegrationEventSubscriptions,
  registerJobEventSubscriptions
} from '@payer-portal/server';
import Fastify, { type FastifyInstance, type FastifyReply, type FastifyRequest } from 'fastify';

// @ts-expect-error compiled service module has no local type declarations
import * as authService from '../../../apps/api/dist/services/auth-service.js';
// @ts-expect-error compiled service module has no local type declarations
import * as currentUserService from '../../../apps/api/dist/services/current-user-service.js';
// @ts-expect-error compiled service module has no local type declarations
import * as documentService from '../../../apps/api/dist/services/document-service.js';
// @ts-expect-error compiled service module has no local type declarations
import * as roleService from '../../../apps/api/dist/services/role-service.js';
// @ts-expect-error compiled service module has no local type declarations
import * as searchService from '../../../apps/api/dist/services/search-service.js';
// @ts-expect-error compiled service module has no local type declarations
import * as tenantService from '../../../apps/api/dist/services/tenant-service.js';
import { createGatewayToken, verifyGatewayToken } from './jwt.js';
import { getOpenApiDocument } from './openapi.js';
import { apiGatewayRuntimeConfig } from './runtime-config.js';

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

type SearchQuery = {
  q?: string;
};

type NotificationQuery = {
  channel?: string;
  limit?: number;
};

type TenantBody = {
  name: string;
  slug: string;
  status: 'ACTIVE' | 'ONBOARDING' | 'INACTIVE';
  brandingConfig: Record<string, unknown>;
};

type CreateNotificationBody = {
  userId?: string;
  channel: string;
  template: string;
  subject?: string;
  body: string;
};

type LoginBody = {
  email: string;
  password: string;
};

type CreateUserBody = {
  tenantId: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive?: boolean;
};

type UpdateUserBody = {
  tenantId?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  isActive?: boolean;
};

type AssignRoleBody = {
  roleId: string;
};

const requestBuckets = new Map<string, RateLimitEntry>();

function isNamedError(error: unknown, name: string): error is Error {
  return error instanceof Error && error.name === name;
}

function getRateLimitConfig() {
  return {
    max: Number(process.env.API_GATEWAY_RATE_LIMIT_MAX ?? 100),
    windowMs: Number(process.env.API_GATEWAY_RATE_LIMIT_WINDOW_MS ?? 60_000)
  };
}

function getOpenApiResponse() {
  return {
    openapi: getOpenApiDocument()
  };
}

async function getGatewayReadiness() {
  const timestamp = new Date().toISOString();

  try {
    await prisma.$queryRaw`SELECT 1`;

    return {
      ready: true,
      response: {
        checks: {
          database: {
            status: 'pass'
          }
        },
        service: 'api-gateway',
        status: 'ok',
        timestamp
      }
    } as const;
  } catch (error) {
    return {
      ready: false,
      response: {
        checks: {
          database: {
            error: error instanceof Error ? error.message : 'Database check failed',
            status: 'fail'
          }
        },
        service: 'api-gateway',
        status: 'degraded',
        timestamp
      }
    } as const;
  }
}

async function enforceRateLimit(request: FastifyRequest, reply: FastifyReply) {
  const { max, windowMs } = getRateLimitConfig();

  if (max <= 0 || windowMs <= 0) {
    return;
  }

  const userKey = request.gatewayAuth?.currentUser.id ?? request.ip;
  const bucketKey = `${request.method}:${request.routeOptions.url ?? request.url}:${userKey}`;
  const now = Date.now();
  const bucket = requestBuckets.get(bucketKey);

  if (!bucket || bucket.resetAt <= now) {
    requestBuckets.set(bucketKey, {
      count: 1,
      resetAt: now + windowMs
    });
    return;
  }

  if (bucket.count >= max) {
    reply
      .status(429)
      .header('Retry-After', Math.ceil((bucket.resetAt - now) / 1000))
      .send({
        message: 'Rate limit exceeded'
      });
    return reply;
  }

  bucket.count += 1;
}

async function authenticateRequest(request: FastifyRequest, reply: FastifyReply) {
  const authorization = request.headers.authorization;

  if (!authorization?.startsWith('Bearer ')) {
    return reply.status(401).send({
      message: 'Bearer token required'
    });
  }

  try {
    const token = verifyGatewayToken(authorization.slice('Bearer '.length));
    const isPlatformToken =
      token.roles.includes('platform_admin') ||
      token.roles.includes('platform-admin');
    const headerTenantId =
      typeof request.headers['x-tenant-id'] === 'string'
        ? request.headers['x-tenant-id'].trim()
        : undefined;
    const requestedTenantId = headerTenantId || token.tenantId;

    if (!requestedTenantId) {
      return reply.status(401).send({
        message:
          'Tenant context required. Provide x-tenant-id or a tenant-scoped bearer token.'
      });
    }

    if (
      headerTenantId &&
      !isPlatformToken &&
      token.tenantId !== currentUserService.PLATFORM_ROOT_SCOPE &&
      headerTenantId !== token.tenantId
    ) {
      return reply.status(403).send({
        message:
          'Tenant context mismatch. x-tenant-id must match the authenticated tenant scope.'
      });
    }

    const currentUser = await currentUserService.getCurrentUserFromGatewayClaims({
      sub: token.sub,
      email: token.email,
      tenantId: isPlatformToken
        ? currentUserService.PLATFORM_ROOT_SCOPE
        : token.tenantId
    });
    const tenantId = currentUserService.resolveTenantScope(
      currentUser,
      requestedTenantId
    );

    request.headers['x-tenant-id'] = tenantId;
    request.gatewayAuth = {
      currentUser,
      tenantId,
      token
    };

    reply.header('x-tenant-id', tenantId);
  } catch (error) {
    if (isNamedError(error, 'AuthorizationError')) {
      return reply.status(403).send({ message: error.message });
    }

    const message =
      error instanceof Error ? error.message : 'Unable to authenticate request';
    return reply.status(401).send({ message });
  }
}

function ensureGatewayAuth(request: FastifyRequest) {
  if (!request.gatewayAuth) {
    throw new currentUserService.AuthenticationError(
      'Authenticated gateway request required.'
    );
  }

  return request.gatewayAuth;
}

async function handleServiceError(reply: FastifyReply, error: unknown) {
  if (isNamedError(error, 'AuthenticationError')) {
    return reply.status(401).send({ message: error.message });
  }

  if (isNamedError(error, 'AuthorizationError')) {
    return reply.status(403).send({ message: error.message });
  }

  if (isNamedError(error, 'DocumentFileNotFoundError')) {
    return reply.status(404).send({ message: 'Document not found.' });
  }

  if (error instanceof Error) {
    const status =
      error.message === 'Tenant not found' || error.message === 'Notification not found'
        ? 404
        : 400;
    return reply.status(status).send({ message: error.message });
  }

  return reply.status(503).send({
    message:
      'Local database unavailable. Start PostgreSQL, run migrations.'
  });
}

function getValidationSchema() {
  return {
    login: {
      body: {
        type: 'object',
        required: ['email', 'password'],
        additionalProperties: false,
        properties: {
          email: { type: 'string', minLength: 1 },
          password: { type: 'string', minLength: 1 }
        }
      }
    },
    tenant: {
      body: {
        type: 'object',
        required: ['name', 'slug', 'status', 'brandingConfig'],
        additionalProperties: false,
        properties: {
          name: { type: 'string', minLength: 1 },
          slug: { type: 'string', minLength: 1 },
          status: {
            type: 'string',
            enum: ['ACTIVE', 'ONBOARDING', 'INACTIVE']
          },
          brandingConfig: { type: 'object' }
        }
      }
    },
    createUser: {
      body: {
        type: 'object',
        required: ['tenantId', 'email', 'firstName', 'lastName'],
        additionalProperties: false,
        properties: {
          tenantId: { type: 'string', minLength: 1 },
          email: { type: 'string', minLength: 1 },
          firstName: { type: 'string', minLength: 1 },
          lastName: { type: 'string', minLength: 1 },
          isActive: { type: 'boolean' }
        }
      }
    },
    updateUser: {
      body: {
        type: 'object',
        additionalProperties: false,
        properties: {
          tenantId: { type: 'string', minLength: 1 },
          email: { type: 'string', minLength: 1 },
          firstName: { type: 'string', minLength: 1 },
          lastName: { type: 'string', minLength: 1 },
          isActive: { type: 'boolean' }
        }
      }
    },
    assignRole: {
      body: {
        type: 'object',
        required: ['roleId'],
        additionalProperties: false,
        properties: {
          roleId: { type: 'string', minLength: 1 }
        }
      }
    },
    search: {
      querystring: {
        type: 'object',
        additionalProperties: false,
        properties: {
          q: { type: 'string' }
        }
      }
    },
    notification: {
      body: {
        type: 'object',
        required: ['channel', 'template', 'body'],
        additionalProperties: false,
        properties: {
          userId: { type: 'string' },
          channel: { type: 'string', minLength: 1 },
          template: { type: 'string', minLength: 1 },
          subject: { type: 'string' },
          body: { type: 'string', minLength: 1 }
        }
      }
    },
    notificationQuery: {
      querystring: {
        type: 'object',
        additionalProperties: false,
        properties: {
          channel: { type: 'string' },
          limit: { type: 'number', minimum: 1 }
        }
      }
    }
  } as const;
}

function registerGatewayRoutes(app: FastifyInstance, prefix: '/api' | '/api/v1') {
  const schema = getValidationSchema();

  app.get(`${prefix}/openapi.json`, async () => getOpenApiResponse());

  app.post<{ Body: LoginBody }>(
    `${prefix}/auth/login`,
    { schema: schema.login, preHandler: enforceRateLimit },
    async (request, reply) => {
      try {
        const result = await authService.login(request.body, {
          ipAddress: request.ip,
          userAgent: request.headers['user-agent']
        });

        if (!result) {
          return reply.status(401).send({
            message: 'Invalid login for local development'
          });
        }

        return {
          token: createGatewayToken(result.user),
          user: result.user
        };
      } catch {
        return reply.status(503).send({
          message:
            'Local database unavailable. Start PostgreSQL, run migrations.'
        });
      }
    }
  );

  app.get(
    `${prefix}/documents`,
    { preHandler: [authenticateRequest, enforceRateLimit] },
    async (request, reply) => {
      try {
        const { currentUser } = ensureGatewayAuth(request);
        return await documentService.listDocuments({ userId: currentUser.id });
      } catch (error) {
        return handleServiceError(reply, error);
      }
    }
  );

  app.get<{ Params: { id: string } }>(
    `${prefix}/documents/:id/download`,
    { preHandler: [authenticateRequest, enforceRateLimit] },
    async (request, reply) => {
      try {
        const { currentUser } = ensureGatewayAuth(request);
        const result = await documentService.downloadDocument({
          documentId: request.params.id,
          userId: currentUser.id,
          ipAddress: request.ip,
          userAgent: request.headers['user-agent']
        });

        return reply
          .header('Content-Type', result.document.mimeType)
          .header(
            'Content-Disposition',
            `attachment; filename="${result.document.filename}"`
          )
          .send(result.fileBuffer);
      } catch (error) {
        return handleServiceError(reply, error);
      }
    }
  );

  app.post(
    `${prefix}/documents`,
    { preHandler: [authenticateRequest, enforceRateLimit] },
    async (request, reply) => {
      try {
        const { currentUser } = ensureGatewayAuth(request);
        const file = await request.file();

        if (!file) {
          return reply.status(400).send({
            message: 'File is required.'
          });
        }

        const statusField = file.fields.status;
        const tagsField = file.fields.tags;
        const document = await documentService.uploadDocument({
          file,
          userId: currentUser.id,
          status:
            statusField && 'value' in statusField && typeof statusField.value === 'string'
              ? statusField.value
              : undefined,
          tags:
            tagsField && 'value' in tagsField && typeof tagsField.value === 'string'
              ? JSON.parse(tagsField.value)
              : undefined,
          ipAddress: request.ip,
          userAgent: request.headers['user-agent']
        });

        return reply.status(201).send(document);
      } catch (error) {
        if (error instanceof SyntaxError) {
          return reply.status(400).send({ message: 'tags must be valid JSON' });
        }

        return handleServiceError(reply, error);
      }
    }
  );

  app.get<{ Querystring: SearchQuery }>(
    `${prefix}/search`,
    { schema: schema.search, preHandler: [authenticateRequest, enforceRateLimit] },
    async (request, reply) => {
      try {
        const { currentUser } = ensureGatewayAuth(request);
        return await searchService.searchTenantData({
          query: request.query.q ?? '',
          userId: currentUser.id
        });
      } catch (error) {
        return handleServiceError(reply, error);
      }
    }
  );

  app.get(
    `${prefix}/users`,
    { preHandler: [authenticateRequest, enforceRateLimit] },
    async (request, reply) => {
      try {
        const { currentUser } = ensureGatewayAuth(request);
        currentUserService.assertPlatformAdmin(currentUser);
        return await roleService.listUsers();
      } catch (error) {
        return handleServiceError(reply, error);
      }
    }
  );

  app.post<{ Body: CreateUserBody }>(
    `${prefix}/users`,
    { schema: schema.createUser, preHandler: [authenticateRequest, enforceRateLimit] },
    async (request, reply) => {
      try {
        const { currentUser } = ensureGatewayAuth(request);
        currentUserService.assertPlatformAdmin(currentUser);
        const user = await roleService.createUser(request.body, {
          actorUserId: currentUser.id,
          ipAddress: request.ip,
          userAgent: request.headers['user-agent']
        });

        return reply.status(201).send(user);
      } catch (error) {
        return handleServiceError(reply, error);
      }
    }
  );

  app.patch<{ Params: { userId: string }; Body: UpdateUserBody }>(
    `${prefix}/users/:userId`,
    { schema: schema.updateUser, preHandler: [authenticateRequest, enforceRateLimit] },
    async (request, reply) => {
      try {
        const { currentUser } = ensureGatewayAuth(request);
        currentUserService.assertPlatformAdmin(currentUser);
        return await roleService.updateUser(request.params.userId, request.body);
      } catch (error) {
        return handleServiceError(reply, error);
      }
    }
  );

  app.delete<{ Params: { userId: string } }>(
    `${prefix}/users/:userId`,
    { preHandler: [authenticateRequest, enforceRateLimit] },
    async (request, reply) => {
      try {
        const { currentUser } = ensureGatewayAuth(request);
        currentUserService.assertPlatformAdmin(currentUser);
        return await roleService.deleteUser(request.params.userId);
      } catch (error) {
        return handleServiceError(reply, error);
      }
    }
  );

  app.post<{ Params: { userId: string }; Body: AssignRoleBody }>(
    `${prefix}/users/:userId/roles`,
    { schema: schema.assignRole, preHandler: [authenticateRequest, enforceRateLimit] },
    async (request, reply) => {
      try {
        const { currentUser } = ensureGatewayAuth(request);
        currentUserService.assertPlatformAdmin(currentUser);
        const assignment = await roleService.assignRoleToUser(
          request.params.userId,
          request.body.roleId
        );
        return reply.status(201).send(assignment);
      } catch (error) {
        return handleServiceError(reply, error);
      }
    }
  );

  app.get(
    `${prefix}/tenants`,
    { preHandler: [authenticateRequest, enforceRateLimit] },
    async (request, reply) => {
      try {
        const { currentUser } = ensureGatewayAuth(request);
        currentUserService.assertPlatformAdmin(currentUser);
        return await tenantService.listTenants();
      } catch (error) {
        return handleServiceError(reply, error);
      }
    }
  );

  app.post<{ Body: TenantBody }>(
    `${prefix}/tenants`,
    { schema: schema.tenant, preHandler: [authenticateRequest, enforceRateLimit] },
    async (request, reply) => {
      try {
        const { currentUser } = ensureGatewayAuth(request);
        currentUserService.assertPlatformAdmin(currentUser);
        const tenant = await tenantService.createTenant(request.body, {
          actorUserId: currentUser.id,
          ipAddress: request.ip,
          userAgent: request.headers['user-agent']
        });
        return reply.status(201).send(tenant);
      } catch (error) {
        return handleServiceError(reply, error);
      }
    }
  );

  app.get<{ Params: { id: string } }>(
    `${prefix}/tenants/:id`,
    { preHandler: [authenticateRequest, enforceRateLimit] },
    async (request, reply) => {
      try {
        const { currentUser } = ensureGatewayAuth(request);
        currentUserService.assertPlatformAdmin(currentUser);
        const tenant = await tenantService.getTenantById(request.params.id);

        if (!tenant) {
          return reply.status(404).send({ message: 'Tenant not found' });
        }

        return tenant;
      } catch (error) {
        return handleServiceError(reply, error);
      }
    }
  );

  app.get<{ Querystring: NotificationQuery }>(
    `${prefix}/notifications`,
    {
      schema: schema.notificationQuery,
      preHandler: [authenticateRequest, enforceRateLimit]
    },
    async (request, reply) => {
      try {
        const { currentUser, tenantId } = ensureGatewayAuth(request);
        return await getUserNotifications({
          tenantId,
          userId: currentUser.id,
          channel: request.query.channel,
          limit: request.query.limit
        });
      } catch (error) {
        return handleServiceError(reply, error);
      }
    }
  );

  app.post<{ Body: CreateNotificationBody }>(
    `${prefix}/notifications`,
    {
      schema: schema.notification,
      preHandler: [authenticateRequest, enforceRateLimit]
    },
    async (request, reply) => {
      try {
        const { currentUser, tenantId } = ensureGatewayAuth(request);
        const requestedUserId = request.body.userId?.trim();

        if (requestedUserId && requestedUserId !== currentUser.id) {
          currentUserService.assertTenantAdmin(currentUser);
        }

        const notification = await createNotification({
          tenantId,
          userId: requestedUserId ?? currentUser.id,
          channel: request.body.channel,
          template: request.body.template,
          subject: request.body.subject,
          body: request.body.body
        });

        return reply.status(201).send(notification);
      } catch (error) {
        return handleServiceError(reply, error);
      }
    }
  );

  app.patch<{ Params: { id: string } }>(
    `${prefix}/notifications/:id/read`,
    { preHandler: [authenticateRequest, enforceRateLimit] },
    async (request, reply) => {
      try {
        const { currentUser, tenantId } = ensureGatewayAuth(request);
        return await markNotificationRead(request.params.id, {
          tenantId,
          userId: currentUser.id
        });
      } catch (error) {
        return handleServiceError(reply, error);
      }
    }
  );
}

export function buildApiGateway() {
  initializeMonitoring();
  registerJobEventSubscriptions();
  registerIntegrationEventSubscriptions();

  const app = Fastify({
    logger: true,
    genReqId: () => crypto.randomUUID()
  });

  app.setErrorHandler((error, request, reply) => {
    if ((error as { validation?: unknown }).validation) {
      return reply.status(400).send({
        message: error instanceof Error ? error.message : 'Request validation failed'
      });
    }

    request.log.error(error);
    return reply.status(500).send({
      message: 'Unexpected gateway error'
    });
  });

  app.addHook('onRequest', async (request, reply) => {
    request.headers['x-request-start-ms'] = String(Date.now());
    reply.header('x-request-id', request.id);
    request.log.info(
      {
        method: request.method,
        url: request.url
      },
      'gateway request started'
    );
  });

  app.addHook('onResponse', async (request, reply) => {
    const startedAt = Number(request.headers['x-request-start-ms'] ?? Date.now());
    recordApiRequest({
      durationMs: Date.now() - startedAt,
      method: request.method,
      route: request.routeOptions.url || request.url,
      statusCode: reply.statusCode
    });

    request.log.info(
      {
        statusCode: reply.statusCode,
        durationMs: Date.now() - startedAt
      },
      'gateway request completed'
    );
  });

  app.get('/liveness', async () => ({
    checks: {
      process: {
        pid: process.pid,
        uptimeSeconds: Math.round(process.uptime())
      }
    },
    service: 'api-gateway',
    status: 'ok',
    timestamp: new Date().toISOString()
  }));

  app.get('/readiness', async (_request, reply) => {
    const result = await getGatewayReadiness();

    return reply.status(result.ready ? 200 : 503).send(result.response);
  });

  app.get('/health', async (_request, reply) => {
    const result = await getGatewayReadiness();

    return reply.status(result.ready ? 200 : 503).send(result.response);
  });

  app.register(multipart);
  registerGatewayRoutes(app, '/api');
  registerGatewayRoutes(app, '/api/v1');

  return app;
}

export async function startApiGateway() {
  const app = buildApiGateway();
  const port =
    apiGatewayRuntimeConfig.port ??
    apiGatewayRuntimeConfig.runtimeModel.ports.apiGateway;
  const host = apiGatewayRuntimeConfig.host;
  await app.listen({ port, host });
  return app;
}
