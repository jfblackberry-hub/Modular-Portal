import type { FastifyInstance } from 'fastify';

import {
  AuthenticationError,
  getCurrentUserFromHeaders,
  isPlatformAdmin,
  isTenantAdmin
} from '../services/current-user-service';
import { login } from '../services/auth-service';

type LoginBody = {
  email: string;
  password: string;
};

export async function authRoutes(app: FastifyInstance) {
  app.get('/auth/me', async (request, reply) => {
    try {
      const user = await getCurrentUserFromHeaders(request.headers);

      return {
        id: user.id,
        email: user.email,
        tenantId: user.tenantId,
        roles: user.roles,
        permissions: user.permissions,
        isPlatformAdmin: isPlatformAdmin(user),
        isTenantAdmin: isTenantAdmin(user)
      };
    } catch (error) {
      if (error instanceof AuthenticationError) {
        return reply.status(401).send({ message: error.message });
      }

      return reply.status(503).send({
        message:
          'Local database unavailable. Start PostgreSQL, run migrations, and seed data.'
      });
    }
  });

  app.post<{ Body: LoginBody }>('/auth/login', async (request, reply) => {
    try {
      const { email, password } = request.body;
      const result = await login(
        { email, password },
        {
          ipAddress: request.ip,
          userAgent: request.headers['user-agent']
        }
      );

      if (!result) {
        return reply.status(401).send({
          message: 'Invalid login for local development'
        });
      }

      return {
        token: result.token,
        user: result.user
      };
    } catch {
      return reply.status(503).send({
        message:
          'Local database unavailable. Start PostgreSQL, run migrations, and seed data.'
      });
    }
  });

  app.post<{ Body: LoginBody }>(
    '/auth/login/provider',
    async (request, reply) => {
      try {
        const { email, password } = request.body;
        const result = await login(
          { email, password },
          {
            ipAddress: request.ip,
            userAgent: request.headers['user-agent']
          },
          {
            requiredLandingContext: 'provider'
          }
        );

        if (!result) {
          return reply.status(401).send({
            message: 'Invalid provider login for local development'
          });
        }

        return {
          token: result.token,
          user: result.user
        };
      } catch {
        return reply.status(503).send({
          message:
            'Local database unavailable. Start PostgreSQL, run migrations, and seed data.'
        });
      }
    }
  );

  app.post<{ Body: LoginBody }>(
    '/auth/login/employer',
    async (request, reply) => {
      try {
        const { email, password } = request.body;
        const result = await login(
          { email, password },
          {
            ipAddress: request.ip,
            userAgent: request.headers['user-agent']
          },
          {
            requiredLandingContext: 'employer'
          }
        );

        if (!result) {
          return reply.status(401).send({
            message: 'Invalid employer login for local development'
          });
        }

        return {
          token: result.token,
          user: result.user
        };
      } catch {
        return reply.status(503).send({
          message:
            'Local database unavailable. Start PostgreSQL, run migrations, and seed data.'
        });
      }
    }
  );
}
