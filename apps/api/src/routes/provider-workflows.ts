import { prisma } from '@payer-portal/database';
import type { ProviderWorkflowActionRequest } from '@payer-portal/api-contracts';
import {
  createProviderWorkflowExecution,
  getProviderWorkflowExecutionById
} from '@payer-portal/server';
import type { FastifyInstance } from 'fastify';

import {
  AuthenticationError,
  AuthorizationError
} from '../services/current-user-service';
import {
  enforceTenantAccess,
  getTenantAccessContext,
  handleTenantAccessError
} from '../services/tenant-access-middleware';

type CreateProviderWorkflowBody = ProviderWorkflowActionRequest & {
  orgUnitId?: string;
};

async function assertProviderTenantAccess(tenantId: string) {
  const tenant = await prisma.tenant.findFirst({
    where: {
      id: tenantId
    },
    select: {
      id: true,
      tenantTypeCode: true
    }
  });

  if (!tenant) {
    throw new Error('Tenant not found');
  }

  if (tenant.tenantTypeCode !== 'PROVIDER') {
    throw new AuthorizationError(
      'Provider workflow actions are only available inside Provider tenants.'
    );
  }
}

function assertProviderWorkflowActor(input: {
  permissions: string[];
  roles: string[];
  activePersonaCode?: string | null;
}) {
  const hasProviderAccess =
    input.permissions.includes('provider.view') ||
    input.roles.includes('provider') ||
    Boolean(input.activePersonaCode?.trim());

  if (!hasProviderAccess) {
    throw new AuthorizationError(
      'Provider workflow actions require a Provider session context.'
    );
  }
}

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
    const status =
      error.message === 'Tenant not found' ||
      error.message === 'Provider workflow execution not found.'
        ? 404
        : 400;
    return reply.status(status).send({ message: error.message });
  }

  return reply.status(503).send({
    message: 'Local database unavailable. Start PostgreSQL, run migrations.'
  });
}

export async function providerWorkflowRoutes(app: FastifyInstance) {
  await app.register(async (tenantScopedApp) => {
    tenantScopedApp.addHook('preHandler', enforceTenantAccess);

    tenantScopedApp.post<{ Body: CreateProviderWorkflowBody }>(
      '/api/provider/workflows',
      async (request, reply) => {
        try {
          const { currentUser, orgUnitId, tenantId } = getTenantAccessContext(request);
          await assertProviderTenantAccess(tenantId);
          assertProviderWorkflowActor(currentUser);

          const workflowExecution = await createProviderWorkflowExecution({
            tenantId,
            organizationUnitId: orgUnitId,
            initiatedByUserId: currentUser.id,
            personaCode: currentUser.activePersonaCode ?? null,
            ipAddress: request.ip,
            userAgent: request.headers['user-agent'],
            request: request.body
          });

          return reply.status(201).send(workflowExecution);
        } catch (error) {
          return handleRouteError(error, reply);
        }
      }
    );

    tenantScopedApp.get<{ Params: { id: string } }>(
      '/api/provider/workflows/:id',
      async (request, reply) => {
        try {
          const { currentUser, tenantId } = getTenantAccessContext(request);
          await assertProviderTenantAccess(tenantId);
          assertProviderWorkflowActor(currentUser);

          const workflowExecution = await getProviderWorkflowExecutionById(
            tenantId,
            request.params.id
          );

          if (!workflowExecution) {
            return reply.status(404).send({
              message: 'Provider workflow execution not found.'
            });
          }

          return reply.send(workflowExecution);
        } catch (error) {
          return handleRouteError(error, reply);
        }
      }
    );
  });
}
