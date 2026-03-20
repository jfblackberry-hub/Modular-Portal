import type { FastifyInstance } from 'fastify';

import {
  assertPlatformAdmin,
  AuthenticationError,
  AuthorizationError,
  getCurrentUserFromHeaders
} from '../services/current-user-service';
import {
  applyCatalogEntryToTenant,
  listApiCatalogEntries
} from '../services/api-catalog-service';

type ApplyCatalogBody = {
  catalogEntryKey: string;
  tenantId: string;
  name?: string;
  status?: string;
  fieldValues: Record<string, string>;
};

function handleRouteError(error: unknown, reply: { status: (code: number) => { send: (body: unknown) => unknown } }) {
  if (error instanceof AuthenticationError) {
    return reply.status(401).send({ message: error.message });
  }

  if (error instanceof AuthorizationError) {
    return reply.status(403).send({ message: error.message });
  }

  if (error instanceof Error) {
    const status =
      error.message === 'Catalog entry not found'
        ? 404
        : 400;
    return reply.status(status).send({ message: error.message });
  }

  return reply.status(503).send({
    message:
      'Local database unavailable. Start PostgreSQL, run migrations, and seed data.'
  });
}

export async function apiCatalogRoutes(app: FastifyInstance) {
  app.get('/platform-admin/connectivity/api-catalog', async (request, reply) => {
    try {
      const currentUser = await getCurrentUserFromHeaders(request.headers);
      assertPlatformAdmin(currentUser);

      return await listApiCatalogEntries();
    } catch (error) {
      return handleRouteError(error, reply);
    }
  });

  app.post<{ Body: ApplyCatalogBody }>(
    '/platform-admin/connectivity/api-catalog/apply',
    async (request, reply) => {
      try {
        const currentUser = await getCurrentUserFromHeaders(request.headers);
        assertPlatformAdmin(currentUser);

        const connector = await applyCatalogEntryToTenant(request.body, {
          actorUserId: currentUser.id,
          ipAddress: request.ip,
          userAgent: request.headers['user-agent']
        });

        return reply.status(201).send(connector);
      } catch (error) {
        return handleRouteError(error, reply);
      }
    }
  );
}
