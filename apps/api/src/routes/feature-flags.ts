import type { FastifyInstance } from 'fastify';

import {
  assertPlatformAdmin,
  AuthenticationError,
  AuthorizationError,
  getCurrentUserFromHeaders
} from '../services/current-user-service';
import {
  createFeatureFlag,
  listFeatureFlags,
  updateFeatureFlag
} from '../services/feature-flag-service';

type FeatureFlagBody = {
  key: string;
  enabled: boolean;
  tenantId?: string | null;
  description?: string;
};

type FeatureFlagPatchBody = {
  enabled?: boolean;
  tenantId?: string | null;
  description?: string;
};

export async function featureFlagRoutes(app: FastifyInstance) {
  app.get('/platform-admin/feature-flags', async (request, reply) => {
    try {
      const currentUser = await getCurrentUserFromHeaders(request.headers);
      assertPlatformAdmin(currentUser);

      return await listFeatureFlags();
    } catch (error) {
      if (error instanceof AuthenticationError) {
        return reply.status(401).send({ message: error.message });
      }

      if (error instanceof AuthorizationError) {
        return reply.status(403).send({ message: error.message });
      }

      return reply.status(503).send({
        message:
          'Local database unavailable. Start PostgreSQL, run migrations.'
      });
    }
  });

  app.post<{ Body: FeatureFlagBody }>(
    '/platform-admin/feature-flags',
    async (request, reply) => {
      try {
        const currentUser = await getCurrentUserFromHeaders(request.headers);
        assertPlatformAdmin(currentUser);

        const featureFlag = await createFeatureFlag(request.body);
        return reply.status(201).send(featureFlag);
      } catch (error) {
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
    }
  );

  app.patch<{ Params: { id: string }; Body: FeatureFlagPatchBody }>(
    '/platform-admin/feature-flags/:id',
    async (request, reply) => {
      try {
        const currentUser = await getCurrentUserFromHeaders(request.headers);
        assertPlatformAdmin(currentUser);

        const featureFlag = await updateFeatureFlag(
          request.params.id,
          request.body
        );
        return featureFlag;
      } catch (error) {
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
    }
  );
}
