import type { FastifyInstance } from 'fastify';

import {
  assertPlatformAdmin,
  AuthenticationError,
  AuthorizationError,
  getCurrentUserFromHeaders
} from '../services/current-user-service';
import {
  createTenant,
  getTenantById,
  listTenants,
  updateTenant
} from '../services/tenant-service';
import { uploadBrandingLogoForTenant } from '../services/branding-service';

type TenantBody = {
  name: string;
  slug: string;
  status: 'ACTIVE' | 'ONBOARDING' | 'INACTIVE';
  brandingConfig: Record<string, unknown>;
};

type TenantUpdateBody = {
  status?: 'ACTIVE' | 'ONBOARDING' | 'INACTIVE';
  quotaUsers?: number;
  quotaMembers?: number;
  quotaStorageGb?: number;
};

export async function tenantRoutes(app: FastifyInstance) {
  app.get('/platform-admin/tenants', async (request, reply) => {
    try {
      const currentUser = await getCurrentUserFromHeaders(request.headers);
      assertPlatformAdmin(currentUser);

      return await listTenants();
    } catch (error) {
      if (error instanceof AuthenticationError) {
        return reply.status(401).send({ message: error.message });
      }

      if (error instanceof AuthorizationError) {
        return reply.status(403).send({ message: error.message });
      }

      return reply.status(503).send({
        message:
          'Local database unavailable. Start PostgreSQL, run migrations, and seed data.'
      });
    }
  });

  app.post<{ Body: TenantBody }>('/platform-admin/tenants', async (request, reply) => {
    try {
      const currentUser = await getCurrentUserFromHeaders(request.headers);
      assertPlatformAdmin(currentUser);

      const tenant = await createTenant(request.body, {
        actorUserId: currentUser.id,
        ipAddress: request.ip,
        userAgent: request.headers['user-agent']
      });
      return reply.status(201).send(tenant);
    } catch (error) {
      if (error instanceof Error) {
        if (error instanceof AuthenticationError) {
          return reply.status(401).send({ message: error.message });
        }

        if (error instanceof AuthorizationError) {
          return reply.status(403).send({ message: error.message });
        }

        return reply.status(400).send({ message: error.message });
      }

      return reply.status(503).send({
        message:
          'Local database unavailable. Start PostgreSQL, run migrations, and seed data.'
      });
    }
  });

  app.get<{ Params: { id: string } }>(
    '/platform-admin/tenants/:id',
    async (request, reply) => {
      try {
        const currentUser = await getCurrentUserFromHeaders(request.headers);
        assertPlatformAdmin(currentUser);

        const tenant = await getTenantById(request.params.id);

        if (!tenant) {
          return reply.status(404).send({
            message: 'Tenant not found'
          });
        }

        return tenant;
      } catch (error) {
        if (error instanceof AuthenticationError) {
          return reply.status(401).send({ message: error.message });
        }

        if (error instanceof AuthorizationError) {
          return reply.status(403).send({ message: error.message });
        }

        return reply.status(503).send({
          message:
            'Local database unavailable. Start PostgreSQL, run migrations, and seed data.'
        });
      }
    }
  );

  app.patch<{ Params: { id: string }; Body: TenantUpdateBody }>(
    '/platform-admin/tenants/:id',
    async (request, reply) => {
      try {
        const currentUser = await getCurrentUserFromHeaders(request.headers);
        assertPlatformAdmin(currentUser);

        const tenant = await updateTenant(request.params.id, request.body ?? {}, {
          actorUserId: currentUser.id,
          ipAddress: request.ip,
          userAgent: request.headers['user-agent']
        });

        return reply.send(tenant);
      } catch (error) {
        if (error instanceof Error) {
          if (error instanceof AuthenticationError) {
            return reply.status(401).send({ message: error.message });
          }

          if (error instanceof AuthorizationError) {
            return reply.status(403).send({ message: error.message });
          }

          const status = error.message === 'Tenant not found' ? 404 : 400;
          return reply.status(status).send({ message: error.message });
        }

        return reply.status(503).send({
          message:
            'Local database unavailable. Start PostgreSQL, run migrations, and seed data.'
        });
      }
    }
  );

  app.post<{ Params: { id: string } }>(
    '/platform-admin/tenants/:id/logo',
    async (request, reply) => {
      try {
        const currentUser = await getCurrentUserFromHeaders(request.headers);
        assertPlatformAdmin(currentUser);

        const file = await request.file();

        if (!file) {
          return reply.status(400).send({
            message: 'Logo file is required'
          });
        }

        const tenant = await uploadBrandingLogoForTenant(request.params.id, file, {
          actorUserId: currentUser.id,
          ipAddress: request.ip,
          userAgent: request.headers['user-agent']
        });
        return reply.status(201).send(tenant);
      } catch (error) {
        if (error instanceof Error) {
          if (error instanceof AuthenticationError) {
            return reply.status(401).send({ message: error.message });
          }

          if (error instanceof AuthorizationError) {
            return reply.status(403).send({ message: error.message });
          }

          const status = error.message === 'Tenant not found' ? 404 : 400;
          return reply.status(status).send({ message: error.message });
        }

        return reply.status(503).send({
          message:
            'Local database unavailable. Start PostgreSQL, run migrations, and seed data.'
        });
      }
    }
  );
}
