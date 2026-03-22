import type { FastifyInstance } from 'fastify';

import { logAuditEvent } from '@payer-portal/server';

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
        accessibleTenantIds: user.accessibleTenantIds,
        tenantAdminTenantIds: user.tenantAdminTenantIds,
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

  app.post('/auth/logout', async (request, reply) => {
    try {
      const currentUser = await getCurrentUserFromHeaders(request.headers);
      const auditTenantId =
        currentUser.tenantId && currentUser.tenantId !== 'platform'
          ? currentUser.tenantId
          : currentUser.accessibleTenantIds[0] ?? null;

      if (auditTenantId) {
        await logAuditEvent({
          tenantId: auditTenantId,
          actorUserId: currentUser.id,
          action: 'auth.logout',
          entityType: 'user',
          entityId: currentUser.id,
          beforeState: {
            sessionType: currentUser.sessionType,
            tenantId: currentUser.tenantId
          },
          afterState: {
            sessionActive: false
          },
          ipAddress: request.ip,
          userAgent: request.headers['user-agent']
        });
      }

      return { success: true };
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
}
