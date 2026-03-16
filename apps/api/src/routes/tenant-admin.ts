import { listJobs } from '@payer-portal/server';
import type { FastifyInstance } from 'fastify';

import {
  assertTenantAdmin,
  AuthenticationError,
  AuthorizationError,
  getCurrentUserFromHeaders,
  isPlatformAdmin,
  resolveTenantScope
} from '../services/current-user-service';
import { prisma } from '@payer-portal/database';
import {
  assignRoleToTenantUser,
  createTenantScopedUser,
  deleteTenantScopedUser,
  getTenantAdminSettings,
  saveTenantBrandingSettings,
  saveTenantBillingEnrollmentModuleConfig,
  saveTenantPurchasedModules,
  saveTenantNotificationSettings,
  updateTenantScopedUser
} from '../services/tenant-admin-service';
import { uploadBrandingLogoForTenant } from '../services/branding-service';

type NotificationSettingsBody = {
  emailEnabled?: boolean;
  inAppEnabled?: boolean;
  digestEnabled?: boolean;
  replyToEmail?: string | null;
  senderName?: string | null;
};

type BrandingSettingsBody = {
  displayName?: string;
  primaryColor?: string;
  secondaryColor?: string;
  logoUrl?: string | null;
  faviconUrl?: string | null;
};

type AssignRoleBody = {
  roleId: string;
};

type TenantUserBody = {
  email: string;
  firstName: string;
  lastName: string;
  isActive?: boolean;
};

type PurchasedModulesBody = {
  modules?: string[];
};

type BillingEnrollmentModuleConfigBody = {
  variant?: 'commercial' | 'medicare' | 'medicaid' | 'employer_group';
  featureFlags?: {
    enrollmentEnabled?: boolean;
    paymentsEnabled?: boolean;
    noticesEnabled?: boolean;
    supportEnabled?: boolean;
    brokerAssistEnabled?: boolean;
  };
  paymentOptions?: {
    allowCard?: boolean;
    allowBankAccount?: boolean;
    allowPaperCheck?: boolean;
    allowEmployerInvoice?: boolean;
  };
  autopay?: {
    enabled?: boolean;
    allowCardAutopay?: boolean;
    allowBankAutopay?: boolean;
  };
  documentRequirements?: {
    requireIdentityProof?: boolean;
    requireIncomeProof?: boolean;
    requireResidencyProof?: boolean;
    requireDependentVerification?: boolean;
  };
  supportContactContent?: {
    enrollmentPhone?: string;
    enrollmentEmail?: string;
    billingPhone?: string;
    billingEmail?: string;
    helpCenterUrl?: string;
  };
  renewalMessaging?: {
    headline?: string;
    body?: string;
    ctaLabel?: string;
  };
};

type TenantAdminQuery = {
  tenant_id?: string;
};

type TenantAdminJobsQuery = TenantAdminQuery & {
  status?: string;
  type?: string;
};

async function resolveTenantScopeForUserAction(
  currentUser: Awaited<ReturnType<typeof getCurrentUserFromHeaders>>,
  requestedTenantId: string | undefined,
  userId: string
) {
  const normalizedRequestedTenantId = requestedTenantId?.trim();

  if (normalizedRequestedTenantId) {
    return resolveTenantScope(currentUser, normalizedRequestedTenantId);
  }

  if (!isPlatformAdmin(currentUser)) {
    return resolveTenantScope(currentUser, normalizedRequestedTenantId);
  }

  const targetUser = await prisma.user.findUnique({
    where: {
      id: userId
    },
    select: {
      tenantId: true
    }
  });

  if (!targetUser) {
    throw new Error('User not found');
  }

  return targetUser.tenantId;
}

function handleRouteError(
  error: unknown,
  reply: { status: (code: number) => { send: (body: unknown) => unknown } }
) {
  if (error instanceof AuthenticationError) {
    return reply.status(401).send({ message: error.message });
  }

  if (error instanceof AuthorizationError) {
    return reply.status(403).send({ message: error.message });
  }

  if (error instanceof Error) {
    const status = error.message === 'User not found' || error.message === 'Tenant not found'
      ? 404
      : 400;
    return reply.status(status).send({ message: error.message });
  }

  return reply.status(503).send({
    message:
      'Local database unavailable. Start PostgreSQL, run migrations, and seed data.'
  });
}

export async function tenantAdminRoutes(app: FastifyInstance) {
  app.get<{ Querystring: TenantAdminJobsQuery }>(
    '/api/tenant-admin/jobs',
    async (request, reply) => {
      try {
        const currentUser = await getCurrentUserFromHeaders(request.headers);
        assertTenantAdmin(currentUser);
        const tenantId = resolveTenantScope(currentUser, request.query.tenant_id);

        return await listJobs({
          tenantId,
          status: request.query.status,
          type: request.query.type
        });
      } catch (error) {
        return handleRouteError(error, reply);
      }
    }
  );

  app.get<{ Querystring: TenantAdminQuery }>(
    '/api/tenant-admin/settings',
    async (request, reply) => {
    try {
      const currentUser = await getCurrentUserFromHeaders(request.headers);
      assertTenantAdmin(currentUser);
      const tenantId = resolveTenantScope(currentUser, request.query.tenant_id);

      return await getTenantAdminSettings(tenantId);
    } catch (error) {
      return handleRouteError(error, reply);
    }
    }
  );

  app.put<{ Body: NotificationSettingsBody; Querystring: TenantAdminQuery }>(
    '/api/tenant-admin/notification-settings',
    async (request, reply) => {
      try {
        const currentUser = await getCurrentUserFromHeaders(request.headers);
        assertTenantAdmin(currentUser);
        const tenantId = resolveTenantScope(currentUser, request.query.tenant_id);

        const settings = await saveTenantNotificationSettings(
          tenantId,
          request.body ?? {},
          {
            actorUserId: currentUser.id,
            ipAddress: request.ip,
            userAgent: request.headers['user-agent']
          }
        );

        return reply.send(settings);
      } catch (error) {
        return handleRouteError(error, reply);
      }
    }
  );

  app.put<{ Body: BrandingSettingsBody; Querystring: TenantAdminQuery }>(
    '/api/tenant-admin/branding',
    async (request, reply) => {
      try {
        const currentUser = await getCurrentUserFromHeaders(request.headers);
        assertTenantAdmin(currentUser);
        const tenantId = resolveTenantScope(currentUser, request.query.tenant_id);

        const branding = await saveTenantBrandingSettings(
          tenantId,
          {
            displayName: request.body?.displayName,
            primaryColor: request.body?.primaryColor,
            secondaryColor: request.body?.secondaryColor,
            logoUrl: request.body?.logoUrl ?? undefined,
            faviconUrl: request.body?.faviconUrl ?? undefined
          },
          {
            actorUserId: currentUser.id,
            ipAddress: request.ip,
            userAgent: request.headers['user-agent']
          }
        );

        return reply.send(branding);
      } catch (error) {
        return handleRouteError(error, reply);
      }
    }
  );

  app.post<{ Querystring: TenantAdminQuery }>(
    '/api/tenant-admin/branding/logo',
    async (request, reply) => {
      try {
        const currentUser = await getCurrentUserFromHeaders(request.headers);
        assertTenantAdmin(currentUser);
        const tenantId = resolveTenantScope(currentUser, request.query.tenant_id);
        const file = await request.file();

        if (!file) {
          return reply.status(400).send({
            message: 'Logo file is required'
          });
        }

        const branding = await uploadBrandingLogoForTenant(
          tenantId,
          file,
          {
            actorUserId: currentUser.id,
            ipAddress: request.ip,
            userAgent: request.headers['user-agent']
          }
        );

        return reply.status(201).send(branding);
      } catch (error) {
        return handleRouteError(error, reply);
      }
    }
  );

  app.put<{ Body: PurchasedModulesBody; Querystring: TenantAdminQuery }>(
    '/api/tenant-admin/purchased-modules',
    async (request, reply) => {
      try {
        const currentUser = await getCurrentUserFromHeaders(request.headers);
        assertTenantAdmin(currentUser);
        const tenantId = resolveTenantScope(currentUser, request.query.tenant_id);

        const modules = Array.isArray(request.body?.modules)
          ? request.body.modules
          : [];

        const updatedModules = await saveTenantPurchasedModules(
          tenantId,
          modules,
          {
            actorUserId: currentUser.id,
            ipAddress: request.ip,
            userAgent: request.headers['user-agent']
          }
        );

        return reply.send({ modules: updatedModules });
      } catch (error) {
        return handleRouteError(error, reply);
      }
    }
  );

  app.put<{ Body: BillingEnrollmentModuleConfigBody; Querystring: TenantAdminQuery }>(
    '/api/tenant-admin/billing-enrollment-module-config',
    async (request, reply) => {
      try {
        const currentUser = await getCurrentUserFromHeaders(request.headers);
        assertTenantAdmin(currentUser);
        const tenantId = resolveTenantScope(currentUser, request.query.tenant_id);

        const moduleConfig = await saveTenantBillingEnrollmentModuleConfig(
          tenantId,
          request.body ?? {},
          {
            actorUserId: currentUser.id,
            ipAddress: request.ip,
            userAgent: request.headers['user-agent']
          }
        );

        return reply.send(moduleConfig);
      } catch (error) {
        return handleRouteError(error, reply);
      }
    }
  );

  app.post<{ Params: { userId: string }; Body: AssignRoleBody; Querystring: TenantAdminQuery }>(
    '/api/tenant-admin/users/:userId/roles',
    async (request, reply) => {
      try {
        const currentUser = await getCurrentUserFromHeaders(request.headers);
        assertTenantAdmin(currentUser);
        const tenantId = await resolveTenantScopeForUserAction(
          currentUser,
          request.query.tenant_id,
          request.params.userId
        );

        const assignment = await assignRoleToTenantUser(
          tenantId,
          request.params.userId,
          request.body.roleId
        );

        return reply.status(201).send(assignment);
      } catch (error) {
        return handleRouteError(error, reply);
      }
    }
  );

  app.post<{ Body: TenantUserBody; Querystring: TenantAdminQuery }>(
    '/api/tenant-admin/users',
    async (request, reply) => {
      try {
        const currentUser = await getCurrentUserFromHeaders(request.headers);
        assertTenantAdmin(currentUser);
        const tenantId = resolveTenantScope(currentUser, request.query.tenant_id);

        const user = await createTenantScopedUser(tenantId, request.body, {
          actorUserId: currentUser.id,
          ipAddress: request.ip,
          userAgent: request.headers['user-agent']
        });

        return reply.status(201).send(user);
      } catch (error) {
        return handleRouteError(error, reply);
      }
    }
  );

  app.patch<{ Params: { userId: string }; Body: TenantUserBody; Querystring: TenantAdminQuery }>(
    '/api/tenant-admin/users/:userId',
    async (request, reply) => {
      try {
        const currentUser = await getCurrentUserFromHeaders(request.headers);
        assertTenantAdmin(currentUser);
        const tenantId = await resolveTenantScopeForUserAction(
          currentUser,
          request.query.tenant_id,
          request.params.userId
        );

        const user = await updateTenantScopedUser(
          tenantId,
          request.params.userId,
          request.body
        );

        return reply.send(user);
      } catch (error) {
        return handleRouteError(error, reply);
      }
    }
  );

  app.delete<{ Params: { userId: string }; Querystring: TenantAdminQuery }>(
    '/api/tenant-admin/users/:userId',
    async (request, reply) => {
      try {
        const currentUser = await getCurrentUserFromHeaders(request.headers);
        assertTenantAdmin(currentUser);
        const tenantId = await resolveTenantScopeForUserAction(
          currentUser,
          request.query.tenant_id,
          request.params.userId
        );

        const deletedUser = await deleteTenantScopedUser(
          tenantId,
          request.params.userId
        );

        return reply.send(deletedUser);
      } catch (error) {
        return handleRouteError(error, reply);
      }
    }
  );
}
