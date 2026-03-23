import type { FastifyInstance } from 'fastify';

import {
  getPlatformAdapterInventory,
  getPlatformConnectivityStatusRows,
  getPlatformHealthOverview,
  listPlatformTenantSummaries
} from '../services/admin-operations-service';
import {
  assertPlatformAdmin,
  AuthenticationError,
  AuthorizationError,
  getCurrentUserFromHeaders
} from '../services/current-user-service';

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

export async function adminOperationsRoutes(app: FastifyInstance) {
  app.get('/platform-admin/health/overview', async (request, reply) => {
    try {
      const currentUser = await getCurrentUserFromHeaders(request.headers);
      assertPlatformAdmin(currentUser);

      return await getPlatformHealthOverview();
    } catch (error) {
      return handleRouteError(error, reply);
    }
  });

  app.get('/platform-admin/tenant-summaries', async (request, reply) => {
    try {
      const currentUser = await getCurrentUserFromHeaders(request.headers);
      assertPlatformAdmin(currentUser);

      return await listPlatformTenantSummaries();
    } catch (error) {
      return handleRouteError(error, reply);
    }
  });

  app.get('/platform-admin/connectivity/adapter-inventory', async (request, reply) => {
    try {
      const currentUser = await getCurrentUserFromHeaders(request.headers);
      assertPlatformAdmin(currentUser);

      return await getPlatformAdapterInventory();
    } catch (error) {
      return handleRouteError(error, reply);
    }
  });

  app.get('/platform-admin/connectivity/status', async (request, reply) => {
    try {
      const currentUser = await getCurrentUserFromHeaders(request.headers);
      assertPlatformAdmin(currentUser);

      return await getPlatformConnectivityStatusRows();
    } catch (error) {
      return handleRouteError(error, reply);
    }
  });
}
