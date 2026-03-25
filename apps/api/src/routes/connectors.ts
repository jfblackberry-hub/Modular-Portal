import type { Prisma } from '@payer-portal/database';
import type { FastifyInstance } from 'fastify';

import {
  createConnectorForTenant,
  enqueueConnectorSyncForTenant,
  listConnectorsForTenant,
  runConnectorHealthCheckForTenant,
  updateConnectorForTenant
} from '../services/connector-service';
import {
  assertTenantAdmin,
  AuthenticationError,
  AuthorizationError
} from '../services/current-user-service';
import {
  enforceTenantAccess,
  getTenantAccessContext,
  handleTenantAccessError
} from '../services/tenant-access-middleware';

type ConnectorBody = {
  adapterKey: string;
  name: string;
  status: string;
  config: Prisma.InputJsonValue;
};

type UpdateConnectorBody = Partial<ConnectorBody>;

function handleRouteError(
  error: unknown,
  reply: { status: (code: number) => { send: (body: unknown) => unknown } }
) {
  const tenantAccessError = handleTenantAccessError(error, reply);
  if (tenantAccessError) {
    return tenantAccessError;
  }

  if (error instanceof AuthenticationError) {
    return reply.status(401).send({ message: error.message });
  }

  if (error instanceof AuthorizationError) {
    return reply.status(403).send({ message: error.message });
  }

  if (error instanceof Error) {
    const status = error.message === 'Connector not found' ? 404 : 400;
    return reply.status(status).send({ message: error.message });
  }

  return reply.status(503).send({
    message: 'Local database unavailable. Start PostgreSQL, run migrations.'
  });
}

export async function connectorRoutes(app: FastifyInstance) {
  await app.register(async (tenantScopedApp) => {
    tenantScopedApp.addHook('preHandler', enforceTenantAccess);

    tenantScopedApp.get('/api/connectors', async (request, reply) => {
      try {
        const { currentUser, tenantId } = getTenantAccessContext(request);
        assertTenantAdmin(currentUser);

        return await listConnectorsForTenant(tenantId);
      } catch (error) {
        return handleRouteError(error, reply);
      }
    });

    tenantScopedApp.post<{ Body: ConnectorBody }>(
      '/api/connectors',
      async (request, reply) => {
        try {
          const { currentUser, tenantId } = getTenantAccessContext(request);
          assertTenantAdmin(currentUser);

          const connector = await createConnectorForTenant(
            tenantId,
            request.body,
            {
              actorUserId: currentUser.id,
              ipAddress: request.ip,
              userAgent: request.headers['user-agent']
            }
          );

          return reply.status(201).send(connector);
        } catch (error) {
          return handleRouteError(error, reply);
        }
      }
    );

    tenantScopedApp.put<{ Params: { id: string }; Body: UpdateConnectorBody }>(
      '/api/connectors/:id',
      async (request, reply) => {
        try {
          const { currentUser, tenantId } = getTenantAccessContext(request);
          assertTenantAdmin(currentUser);

          const connector = await updateConnectorForTenant(
            tenantId,
            request.params.id,
            request.body,
            {
              actorUserId: currentUser.id,
              ipAddress: request.ip,
              userAgent: request.headers['user-agent']
            }
          );

          return reply.send(connector);
        } catch (error) {
          return handleRouteError(error, reply);
        }
      }
    );

    tenantScopedApp.post<{ Params: { id: string } }>(
      '/api/connectors/:id/sync',
      async (request, reply) => {
        try {
          const { currentUser, tenantId } = getTenantAccessContext(request);
          assertTenantAdmin(currentUser);

          const job = await enqueueConnectorSyncForTenant(
            tenantId,
            request.params.id,
            {
              actorUserId: currentUser.id,
              ipAddress: request.ip,
              userAgent: request.headers['user-agent']
            }
          );

          return reply.status(202).send(job);
        } catch (error) {
          return handleRouteError(error, reply);
        }
      }
    );

    tenantScopedApp.post<{ Params: { id: string } }>(
      '/api/connectors/:id/health',
      async (request, reply) => {
        try {
          const { currentUser, tenantId } = getTenantAccessContext(request);
          assertTenantAdmin(currentUser);

          const result = await runConnectorHealthCheckForTenant(
            tenantId,
            request.params.id,
            {
              actorUserId: currentUser.id,
              ipAddress: request.ip,
              userAgent: request.headers['user-agent']
            }
          );

          return reply.send(result);
        } catch (error) {
          return handleRouteError(error, reply);
        }
      }
    );
  });
}
