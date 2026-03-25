import type { FastifyInstance } from 'fastify';

import {
  applyRegistryEntryToTenant,
  applyCatalogEntryToTenant,
  listApiCatalogEntries
} from '../services/api-catalog-service';
import {
  createBackendApiCatalogEntry,
  deleteBackendApiCatalogEntry,
  listBackendApiCatalogEntries,
  updateBackendApiCatalogEntry,
  parseApiCatalogCategory
} from '../services/backend-api-catalog-service';
import {
  assertPlatformAdmin,
  AuthenticationError,
  AuthorizationError,
  getCurrentUserFromHeaders
} from '../services/current-user-service';

type ApplyCatalogBody = {
  catalogEntryKey: string;
  tenantId: string;
  name?: string;
  status?: string;
  fieldValues: Record<string, string>;
};

type UpsertPlatformCatalogBody = {
  slug?: string;
  name: string;
  category: string;
  vendor: string;
  description: string;
  endpoint: string;
  version: string;
  inputModels?: string[];
  outputModels?: string[];
  tenantAvailability?: string[];
  sortOrder?: number;
};

type ApplyRegistryBody = {
  entryId: string;
  tenantId: string;
  name?: string;
  status?: string;
  baseUrl: string;
  endpointPath?: string;
  method?: string;
  authenticationType?: string;
  authToken?: string;
  apiKeyHeaderName?: string;
  apiKeyValue?: string;
  basicUsername?: string;
  basicPassword?: string;
  mappingKey?: string;
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
      'Local database unavailable. Start PostgreSQL, run migrations.'
  });
}

export async function apiCatalogRoutes(app: FastifyInstance) {
  app.get<{
    Querystring: {
      category?: string;
    };
  }>('/api-catalog', async (request, reply) => {
    try {
      const currentUser = await getCurrentUserFromHeaders(request.headers);
      const rawCategory = request.query.category;
      const category =
        typeof rawCategory === 'undefined'
          ? null
          : parseApiCatalogCategory(rawCategory);

      if (typeof rawCategory !== 'undefined' && !category) {
        return reply.status(400).send({
          message:
            'Invalid category. Supported values: claims, pharmacy, eligibility, clinical, authorization.'
        });
      }

      return await listBackendApiCatalogEntries({
        category,
        currentUser
      });
    } catch (error) {
      return handleRouteError(error, reply);
    }
  });

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

  app.post<{ Body: ApplyRegistryBody }>(
    '/platform-admin/connectivity/api-catalog/apply-registry',
    async (request, reply) => {
      try {
        const currentUser = await getCurrentUserFromHeaders(request.headers);
        assertPlatformAdmin(currentUser);

        const connector = await applyRegistryEntryToTenant(request.body, {
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

  app.post<{ Body: UpsertPlatformCatalogBody }>(
    '/platform-admin/connectivity/api-catalog',
    async (request, reply) => {
      try {
        const currentUser = await getCurrentUserFromHeaders(request.headers);
        assertPlatformAdmin(currentUser);

        const entry = await createBackendApiCatalogEntry({
          ...request.body,
          category: request.body.category as never
        });

        return reply.status(201).send(entry);
      } catch (error) {
        return handleRouteError(error, reply);
      }
    }
  );

  app.put<{ Params: { id: string }; Body: UpsertPlatformCatalogBody }>(
    '/platform-admin/connectivity/api-catalog/:id',
    async (request, reply) => {
      try {
        const currentUser = await getCurrentUserFromHeaders(request.headers);
        assertPlatformAdmin(currentUser);

        const entry = await updateBackendApiCatalogEntry(request.params.id, {
          ...request.body,
          category: request.body.category as never
        });

        return reply.send(entry);
      } catch (error) {
        return handleRouteError(error, reply);
      }
    }
  );

  app.delete<{ Params: { id: string } }>(
    '/platform-admin/connectivity/api-catalog/:id',
    async (request, reply) => {
      try {
        const currentUser = await getCurrentUserFromHeaders(request.headers);
        assertPlatformAdmin(currentUser);

        await deleteBackendApiCatalogEntry(request.params.id);

        return reply.status(204).send();
      } catch (error) {
        return handleRouteError(error, reply);
      }
    }
  );
}
