import type { FastifyInstance } from 'fastify';
import type { Prisma } from '@payer-portal/database';

import {
  assertTenantAdmin,
  AuthenticationError,
  AuthorizationError,
  getCurrentUserFromHeaders
} from '../services/current-user-service';
import {
  createConnectorForTenant,
  enqueueConnectorSyncForTenant,
  listConnectorsForTenant,
  runConnectorHealthCheckForTenant,
  updateConnectorForTenant
} from '../services/connector-service';

type ConnectorBody = {
  adapterKey: string;
  name: string;
  status: string;
  config: Prisma.InputJsonValue;
};

type UpdateConnectorBody = Partial<ConnectorBody>;

function handleRouteError(error: unknown, reply: { status: (code: number) => { send: (body: unknown) => unknown } }) {
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
    message:
      'Local database unavailable. Start PostgreSQL, run migrations, and seed data.'
  });
}

export async function connectorRoutes(app: FastifyInstance) {
  app.get('/api/connectors', async (request, reply) => {
    try {
      const currentUser = await getCurrentUserFromHeaders(request.headers);
      assertTenantAdmin(currentUser);

      return await listConnectorsForTenant(currentUser.tenantId);
    } catch (error) {
      return handleRouteError(error, reply);
    }
  });

  app.post<{ Body: ConnectorBody }>('/api/connectors', async (request, reply) => {
    try {
      const currentUser = await getCurrentUserFromHeaders(request.headers);
      assertTenantAdmin(currentUser);

      const connector = await createConnectorForTenant(
        currentUser.tenantId,
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
  });

  app.put<{ Params: { id: string }; Body: UpdateConnectorBody }>(
    '/api/connectors/:id',
    async (request, reply) => {
      try {
        const currentUser = await getCurrentUserFromHeaders(request.headers);
        assertTenantAdmin(currentUser);

        const connector = await updateConnectorForTenant(
          currentUser.tenantId,
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

  app.post<{ Params: { id: string } }>(
    '/api/connectors/:id/sync',
    async (request, reply) => {
      try {
        const currentUser = await getCurrentUserFromHeaders(request.headers);
        assertTenantAdmin(currentUser);

        const job = await enqueueConnectorSyncForTenant(
          currentUser.tenantId,
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

  app.post<{ Params: { id: string } }>(
    '/api/connectors/:id/health',
    async (request, reply) => {
      try {
        const currentUser = await getCurrentUserFromHeaders(request.headers);
        assertTenantAdmin(currentUser);

        const result = await runConnectorHealthCheckForTenant(
          currentUser.tenantId,
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
}
