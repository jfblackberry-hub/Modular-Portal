import type { FastifyInstance } from 'fastify';

import {
  assertTenantAdmin,
  AuthenticationError,
  AuthorizationError,
  getCurrentUserFromHeaders
} from '../services/current-user-service';
import {
  getBrandingForTenant,
  updateBrandingForTenant,
  uploadBrandingLogoForTenant
} from '../services/branding-service';

type UpdateBrandingBody = {
  displayName?: string;
  primaryColor?: string;
  secondaryColor?: string;
  logoUrl?: string;
  faviconUrl?: string;
};

export async function brandingRoutes(app: FastifyInstance) {
  app.get('/api/branding', async (request, reply) => {
    try {
      const currentUser = await getCurrentUserFromHeaders(request.headers);
      return await getBrandingForTenant(currentUser.tenantId);
    } catch (error) {
      if (error instanceof AuthenticationError) {
        return reply.status(401).send({ message: error.message });
      }

      if (error instanceof Error) {
        const status = error.message === 'Tenant not found' ? 404 : 400;
        return reply.status(status).send({ message: error.message });
      }

      return reply.status(503).send({
        message:
          'Local database unavailable. Start PostgreSQL, run migrations, and seed data.'
      });
    }
  });

  app.put<{ Body: UpdateBrandingBody }>('/api/branding', async (request, reply) => {
    try {
      const currentUser = await getCurrentUserFromHeaders(request.headers);
      assertTenantAdmin(currentUser);

      const branding = await updateBrandingForTenant(
        currentUser.tenantId,
        request.body ?? {},
        {
          actorUserId: currentUser.id,
          ipAddress: request.ip,
          userAgent: request.headers['user-agent']
        }
      );

      return reply.send(branding);
    } catch (error) {
      if (error instanceof AuthenticationError) {
        return reply.status(401).send({ message: error.message });
      }

      if (error instanceof AuthorizationError) {
        return reply.status(403).send({ message: error.message });
      }

      if (error instanceof Error) {
        const status = error.message === 'Tenant not found' ? 404 : 400;
        return reply.status(status).send({ message: error.message });
      }

      return reply.status(503).send({
        message:
          'Local database unavailable. Start PostgreSQL, run migrations, and seed data.'
      });
    }
  });

  app.post('/api/branding/logo', async (request, reply) => {
    try {
      const currentUser = await getCurrentUserFromHeaders(request.headers);
      assertTenantAdmin(currentUser);

      const file = await request.file();

      if (!file) {
        return reply.status(400).send({
          message: 'Logo file is required'
        });
      }

      const branding = await uploadBrandingLogoForTenant(
        currentUser.tenantId,
        file,
        {
          actorUserId: currentUser.id,
          ipAddress: request.ip,
          userAgent: request.headers['user-agent']
        }
      );

      return reply.status(201).send(branding);
    } catch (error) {
      if (error instanceof AuthenticationError) {
        return reply.status(401).send({ message: error.message });
      }

      if (error instanceof AuthorizationError) {
        return reply.status(403).send({ message: error.message });
      }

      if (error instanceof Error) {
        const status = error.message === 'Tenant not found' ? 404 : 400;
        return reply.status(status).send({ message: error.message });
      }

      return reply.status(503).send({
        message:
          'Local database unavailable. Start PostgreSQL, run migrations, and seed data.'
      });
    }
  });
}
