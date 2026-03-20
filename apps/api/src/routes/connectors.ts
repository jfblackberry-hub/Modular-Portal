import type { FastifyInstance } from 'fastify';
import type { Prisma } from '@payer-portal/database';

import {
  assertTenantAdmin,
  AuthenticationError,
  AuthorizationError,
  getCurrentUserFromHeaders,
  resolveTenantScope
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
type ConnectorQuery = {
  tenant_id?: string;
};

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
  app.get<{ Querystring: ConnectorQuery }>('/api/connectors', async (request, reply) => {
    try {
      const currentUser = await getCurrentUserFromHeaders(request.headers);
      assertTenantAdmin(currentUser);
      const tenantId = resolveTenantScope(currentUser, request.query.tenant_id);

      return await listConnectorsForTenant(tenantId);
    } catch (error) {
      return handleRouteError(error, reply);
    }
  });

  app.post<{ Body: ConnectorBody; Querystring: ConnectorQuery }>('/api/connectors', async (request, reply) => {
    try {
      const currentUser = await getCurrentUserFromHeaders(request.headers);
      assertTenantAdmin(currentUser);
      const tenantId = resolveTenantScope(currentUser, request.query.tenant_id);

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
  });

  app.put<{ Params: { id: string }; Body: UpdateConnectorBody; Querystring: ConnectorQuery }>(
    '/api/connectors/:id',
    async (request, reply) => {
      try {
        const currentUser = await getCurrentUserFromHeaders(request.headers);
        assertTenantAdmin(currentUser);
        const tenantId = resolveTenantScope(currentUser, request.query.tenant_id);

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

  app.post<{ Params: { id: string }; Querystring: ConnectorQuery }>(
    '/api/connectors/:id/sync',
    async (request, reply) => {
      try {
        const currentUser = await getCurrentUserFromHeaders(request.headers);
        assertTenantAdmin(currentUser);
        const tenantId = resolveTenantScope(currentUser, request.query.tenant_id);

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

  app.post<{ Params: { id: string }; Querystring: ConnectorQuery }>(
    '/api/connectors/:id/health',
    async (request, reply) => {
      try {
        const currentUser = await getCurrentUserFromHeaders(request.headers);
        assertTenantAdmin(currentUser);
        const tenantId = resolveTenantScope(currentUser, request.query.tenant_id);

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
}
