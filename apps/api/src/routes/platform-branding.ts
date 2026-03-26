import type { FastifyInstance } from 'fastify';

import {
  assertPlatformAdmin,
  AuthenticationError,
  AuthorizationError,
  getCurrentUserFromHeaders
} from '../services/current-user-service';
import {
  deletePlatformBrandingCss,
  getPlatformBrandingCssContent,
  getPlatformBrandingCssMetadata,
  uploadPlatformBrandingCss
} from '../services/platform-branding-service';

export async function platformBrandingRoutes(app: FastifyInstance) {
  app.get('/public/platform-branding/custom.css', async (_request, reply) => {
    const css = await getPlatformBrandingCssContent();

    reply.header('cache-control', 'no-store');
    return reply.type('text/css; charset=utf-8').send(css);
  });

  app.get('/platform-admin/settings/branding', async (request, reply) => {
    try {
      const currentUser = await getCurrentUserFromHeaders(request.headers);
      assertPlatformAdmin(currentUser);

      return reply.send(await getPlatformBrandingCssMetadata());
    } catch (error) {
      if (error instanceof AuthenticationError) {
        return reply.status(401).send({ message: error.message });
      }

      if (error instanceof AuthorizationError) {
        return reply.status(403).send({ message: error.message });
      }

      return reply.status(500).send({
        message:
          error instanceof Error
            ? error.message
            : 'Unable to load platform branding settings.'
      });
    }
  });

  app.post('/platform-admin/settings/branding/css', async (request, reply) => {
    try {
      const currentUser = await getCurrentUserFromHeaders(request.headers);
      assertPlatformAdmin(currentUser);
      const file = await request.file();

      if (!file) {
        return reply.status(400).send({
          message: 'CSS file is required'
        });
      }

      const metadata = await uploadPlatformBrandingCss(file, {
        actorUserId: currentUser.id,
        ipAddress: request.ip,
        userAgent: request.headers['user-agent'],
        tenantId: currentUser.tenantId ?? 'platform'
      });

      return reply.status(201).send(metadata);
    } catch (error) {
      if (error instanceof AuthenticationError) {
        return reply.status(401).send({ message: error.message });
      }

      if (error instanceof AuthorizationError) {
        return reply.status(403).send({ message: error.message });
      }

      return reply.status(400).send({
        message:
          error instanceof Error
            ? error.message
            : 'Unable to upload platform branding CSS.'
      });
    }
  });

  app.delete('/platform-admin/settings/branding/css', async (request, reply) => {
    try {
      const currentUser = await getCurrentUserFromHeaders(request.headers);
      assertPlatformAdmin(currentUser);

      const metadata = await deletePlatformBrandingCss({
        actorUserId: currentUser.id,
        ipAddress: request.ip,
        userAgent: request.headers['user-agent'],
        tenantId: currentUser.tenantId ?? 'platform'
      });

      return reply.send(metadata);
    } catch (error) {
      if (error instanceof AuthenticationError) {
        return reply.status(401).send({ message: error.message });
      }

      if (error instanceof AuthorizationError) {
        return reply.status(403).send({ message: error.message });
      }

      return reply.status(500).send({
        message:
          error instanceof Error
            ? error.message
            : 'Unable to remove platform branding CSS.'
      });
    }
  });
}
