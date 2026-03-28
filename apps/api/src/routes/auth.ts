import { logAuthenticationEvent } from '@payer-portal/server';
import type { FastifyInstance } from 'fastify';

import {
  autoLoginByUserId,
  listAutoLoginCatalog,
  login,
  SessionIntegrityError
} from '../services/auth-service';
import {
  AuthenticationError,
  getCurrentUserFromHeaders,
  isPlatformAdmin,
  isTenantAdmin
} from '../services/current-user-service';
import {
  consumePortalAuthHandoff,
  issuePortalAuthHandoff,
  PortalAuthHandoffError
} from '../services/portal-auth-handoff-service';

type LoginBody = {
  email: string;
  password: string;
  tenantId?: string;
  organizationUnitId?: string;
};

type AutoLoginBody = {
  userId: string;
  audience?: 'admin' | 'payer' | 'provider';
  tenantId?: string | null;
  persona?: string;
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
          'Local database unavailable. Start PostgreSQL, run migrations.'
      });
    }
  });

  app.post<{ Body: LoginBody }>('/auth/login', async (request, reply) => {
    try {
      const { email, password, tenantId, organizationUnitId } = request.body;
      const result = await login(
        { email, password, tenantId, organizationUnitId },
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

      if ('organizationUnitSelectionRequired' in result) {
        return reply.status(409).send(result);
      }

      if ('tenantSelectionRequired' in result) {
        return reply.status(409).send(result);
      }

      return {
        token: result.token,
        user: result.user
      };
    } catch (error) {
      if (error instanceof SessionIntegrityError) {
        return reply.status(error.statusCode).send({
          message: error.message
        });
      }

      return reply.status(503).send({
        message:
          'Local database unavailable. Start PostgreSQL, run migrations.'
      });
    }
  });

  app.get('/auth/login/catalog', async (_request, reply) => {
    try {
      const catalog = await listAutoLoginCatalog();
      return reply.send({ audiences: catalog });
    } catch {
      return reply.status(503).send({
        message:
          'Local database unavailable. Start PostgreSQL, run migrations.'
      });
    }
  });

  app.post<{ Body: AutoLoginBody }>('/auth/login/auto', async (request, reply) => {
    try {
      const result = await autoLoginByUserId(
        {
          userId: request.body.userId,
          audience: request.body.audience,
          tenantId: request.body.tenantId,
          persona: request.body.persona
        },
        {
          ipAddress: request.ip,
          userAgent: request.headers['user-agent']
        }
      );

      if (!result) {
        return reply.status(401).send({
          message: 'No active user is available for the selected tenant and persona.'
        });
      }

      return {
        token: result.token,
        user: result.user
      };
    } catch (error) {
      if (error instanceof SessionIntegrityError) {
        return reply.status(error.statusCode).send({
          message: error.message
        });
      }

      return reply.status(503).send({
        message:
          'Local database unavailable. Start PostgreSQL, run migrations.'
      });
    }
  });

  app.post<{ Body: LoginBody }>(
    '/auth/login/provider',
    async (request, reply) => {
      try {
        const { email, password, tenantId, organizationUnitId } = request.body;
        const result = await login(
          { email, password, tenantId, organizationUnitId },
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

        if ('organizationUnitSelectionRequired' in result) {
          return reply.status(409).send(result);
        }

        if ('tenantSelectionRequired' in result) {
          return reply.status(409).send(result);
        }

        return {
          token: result.token,
          user: result.user
        };
      } catch (error) {
        if (error instanceof SessionIntegrityError) {
          return reply.status(error.statusCode).send({
            message: error.message
          });
        }

        return reply.status(503).send({
          message:
            'Local database unavailable. Start PostgreSQL, run migrations.'
        });
      }
    }
  );

  app.post<{ Body: LoginBody }>(
    '/auth/login/employer',
    async (request, reply) => {
      try {
        const { email, password, tenantId, organizationUnitId } = request.body;
        const result = await login(
          { email, password, tenantId, organizationUnitId },
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

        if ('organizationUnitSelectionRequired' in result) {
          return reply.status(409).send(result);
        }

        if ('tenantSelectionRequired' in result) {
          return reply.status(409).send(result);
        }

        return {
          token: result.token,
          user: result.user
        };
      } catch (error) {
        if (error instanceof SessionIntegrityError) {
          return reply.status(error.statusCode).send({
            message: error.message
          });
        }

        return reply.status(503).send({
          message:
            'Local database unavailable. Start PostgreSQL, run migrations.'
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
        await logAuthenticationEvent({
          tenantId: auditTenantId,
          actorUserId: currentUser.id,
          action: 'auth.logout',
          resourceType: 'user',
          resourceId: currentUser.id,
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
          'Local database unavailable. Start PostgreSQL, run migrations.'
      });
    }
  });

  app.post<{
    Body: {
      audience?: string;
      redirectPath?: string;
    };
  }>('/auth/portal-handoffs', async (request, reply) => {
    try {
      const currentUser = await getCurrentUserFromHeaders(request.headers);
      const result = await issuePortalAuthHandoff({
        actorUserId: currentUser.id,
        audience: request.body.audience?.trim() || 'portal-web',
        redirectPath: request.body.redirectPath,
        ipAddress: request.ip,
        userAgent: request.headers['user-agent']
      });

      return result;
    } catch (error) {
      if (error instanceof AuthenticationError) {
        return reply.status(401).send({ message: error.message });
      }

      if (error instanceof PortalAuthHandoffError) {
        return reply.status(error.statusCode).send({ message: error.message });
      }

      if (error instanceof SessionIntegrityError) {
        return reply.status(error.statusCode).send({ message: error.message });
      }

      return reply.status(503).send({
        message:
          'Local database unavailable. Start PostgreSQL, run migrations.'
      });
    }
  });

  app.post<{
    Body: {
      artifact?: string;
      audience?: string;
    };
  }>('/auth/portal-handoffs/consume', async (request, reply) => {
    try {
      const artifact = request.body.artifact?.trim();

      if (!artifact) {
        return reply.status(400).send({ message: 'artifact is required' });
      }

      return await consumePortalAuthHandoff({
        artifact,
        audience: request.body.audience?.trim() || 'portal-web',
        ipAddress: request.ip,
        userAgent: request.headers['user-agent']
      });
    } catch (error) {
      if (error instanceof PortalAuthHandoffError) {
        return reply.status(error.statusCode).send({ message: error.message });
      }

      return reply.status(503).send({
        message:
          'Local database unavailable. Start PostgreSQL, run migrations.'
      });
    }
  });
}
