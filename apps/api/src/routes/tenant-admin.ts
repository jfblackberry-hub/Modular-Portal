import { listJobs } from '@payer-portal/server';
import type { FastifyInstance } from 'fastify';

import {
  uploadBrandingCssForTenant,
  uploadBrandingLogoForTenant,
  uploadEmployerGroupLogoAssetForTenant
} from '../services/branding-service';
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
import {
  assignRoleToTenantUser,
  createTenantScopedUser,
  deleteTenantScopedUser,
  getTenantAdminSettings,
  removeRoleFromTenantUser,
  saveTenantBillingEnrollmentModuleConfig,
  saveTenantBrandingSettings,
  saveTenantEmployerGroupBrandingSettings,
  saveTenantNotificationSettings,
  saveTenantPurchasedModules,
  updateTenantScopedUser
} from '../services/tenant-admin-service';

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
  customCss?: string | null;
};

type EmployerGroupBrandingSettingsBody = {
  employerGroupName?: string | null;
  employerGroupLogoUrl?: string | null;
};

type AssignRoleBody = {
  roleId: string;
};

type TenantUserBody = {
  roleId?: string | null;
  email: string;
  firstName: string;
  lastName: string;
  isActive?: boolean;
  status?: 'INVITED' | 'ACTIVE' | 'DISABLED';
  password?: string;
  organizationUnitId?: string | null;
  organizationUnitIds?: string[] | null;
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
  employer_key?: string;
};

type TenantAdminJobsQuery = TenantAdminQuery & {
  status?: string;
  type?: string;
};

async function resolveTenantScopeForUserAction(
  tenantId: string,
  userId: string
) {
  return { tenantId, userId };
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
      error.message === 'User not found' || error.message === 'Tenant not found'
        ? 404
        : 400;
    return reply.status(status).send({ message: error.message });
  }

  return reply.status(503).send({
    message: 'Local database unavailable. Start PostgreSQL, run migrations.'
  });
}

export async function tenantAdminRoutes(app: FastifyInstance) {
  await app.register(async (tenantScopedApp) => {
    tenantScopedApp.addHook('preHandler', enforceTenantAccess);

    tenantScopedApp.get<{ Querystring: TenantAdminJobsQuery }>(
      '/api/tenant-admin/jobs',
      async (request, reply) => {
        try {
          const { currentUser, tenantId } = getTenantAccessContext(request);
          assertTenantAdmin(currentUser);

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

    tenantScopedApp.get<{ Querystring: TenantAdminQuery }>(
      '/api/tenant-admin/settings',
      async (request, reply) => {
        try {
          const { currentUser, tenantId } = getTenantAccessContext(request);
          assertTenantAdmin(currentUser);

          return await getTenantAdminSettings(tenantId, {
            employerKey: request.query.employer_key
          });
        } catch (error) {
          return handleRouteError(error, reply);
        }
      }
    );

    tenantScopedApp.put<{
      Body: NotificationSettingsBody;
      Querystring: TenantAdminQuery;
    }>('/api/tenant-admin/notification-settings', async (request, reply) => {
      try {
        const { currentUser, tenantId } = getTenantAccessContext(request);
        assertTenantAdmin(currentUser);

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
    });

    tenantScopedApp.put<{
      Body: BrandingSettingsBody;
      Querystring: TenantAdminQuery;
    }>('/api/tenant-admin/branding', async (request, reply) => {
      try {
        const { currentUser, tenantId } = getTenantAccessContext(request);
        assertTenantAdmin(currentUser);

        const branding = await saveTenantBrandingSettings(
          tenantId,
          {
            displayName: request.body?.displayName,
            primaryColor: request.body?.primaryColor,
            secondaryColor: request.body?.secondaryColor,
            logoUrl: request.body?.logoUrl ?? undefined,
            faviconUrl: request.body?.faviconUrl ?? undefined,
            customCss: request.body?.customCss ?? undefined
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
    });

    tenantScopedApp.post<{ Querystring: TenantAdminQuery }>(
      '/api/tenant-admin/branding/css',
      async (request, reply) => {
        try {
          const { currentUser, tenantId } = getTenantAccessContext(request);
          assertTenantAdmin(currentUser);
          const file = await request.file();

          if (!file) {
            return reply.status(400).send({
              message: 'CSS file is required'
            });
          }

          const branding = await uploadBrandingCssForTenant(tenantId, file, {
            actorUserId: currentUser.id,
            ipAddress: request.ip,
            userAgent: request.headers['user-agent']
          });

          return reply.status(201).send(branding);
        } catch (error) {
          return handleRouteError(error, reply);
        }
      }
    );

    tenantScopedApp.post<{ Querystring: TenantAdminQuery }>(
      '/api/tenant-admin/branding/logo',
      async (request, reply) => {
        try {
          const { currentUser, tenantId } = getTenantAccessContext(request);
          assertTenantAdmin(currentUser);
          const file = await request.file();

          if (!file) {
            return reply.status(400).send({
              message: 'Logo file is required'
            });
          }

          const branding = await uploadBrandingLogoForTenant(tenantId, file, {
            actorUserId: currentUser.id,
            ipAddress: request.ip,
            userAgent: request.headers['user-agent']
          });

          return reply.status(201).send(branding);
        } catch (error) {
          return handleRouteError(error, reply);
        }
      }
    );

    tenantScopedApp.put<{
      Body: EmployerGroupBrandingSettingsBody;
      Querystring: TenantAdminQuery;
    }>('/api/tenant-admin/employer-group-branding', async (request, reply) => {
      try {
        const { currentUser, tenantId } = getTenantAccessContext(request);
        assertTenantAdmin(currentUser);

        const employerGroupBranding =
          await saveTenantEmployerGroupBrandingSettings(
            tenantId,
            {
              employerGroupName: request.body?.employerGroupName ?? undefined,
              employerGroupLogoUrl:
                request.body?.employerGroupLogoUrl ?? undefined
            },
            {
              actorUserId: currentUser.id,
              ipAddress: request.ip,
              userAgent: request.headers['user-agent']
            },
            {
              employerKey: request.query.employer_key
            }
          );

        return reply.send(employerGroupBranding);
      } catch (error) {
        return handleRouteError(error, reply);
      }
    });

    tenantScopedApp.post<{ Querystring: TenantAdminQuery }>(
      '/api/tenant-admin/employer-group-branding/logo',
      async (request, reply) => {
        try {
          const { currentUser, tenantId } = getTenantAccessContext(request);
          assertTenantAdmin(currentUser);
          const file = await request.file();

          if (!file) {
            return reply.status(400).send({
              message: 'Employer group logo file is required'
            });
          }

          const uploadedAsset = await uploadEmployerGroupLogoAssetForTenant(
            tenantId,
            file
          );

          const employerGroupBranding =
            await saveTenantEmployerGroupBrandingSettings(
              tenantId,
              {
                employerGroupLogoUrl: uploadedAsset.logoUrl ?? undefined
              },
              {
                actorUserId: currentUser.id,
                ipAddress: request.ip,
                userAgent: request.headers['user-agent']
              },
              {
                employerKey: request.query.employer_key
              }
            );

          return reply.status(201).send(employerGroupBranding);
        } catch (error) {
          return handleRouteError(error, reply);
        }
      }
    );

    tenantScopedApp.put<{ Body: PurchasedModulesBody }>(
      '/api/tenant-admin/purchased-modules',
      async (request, reply) => {
        try {
          const { currentUser, tenantId } = getTenantAccessContext(request);
          assertTenantAdmin(currentUser);

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

    tenantScopedApp.put<{ Body: BillingEnrollmentModuleConfigBody }>(
      '/api/tenant-admin/billing-enrollment-module-config',
      async (request, reply) => {
        try {
          const { currentUser, tenantId } = getTenantAccessContext(request);
          assertTenantAdmin(currentUser);

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

    tenantScopedApp.post<{ Params: { userId: string }; Body: AssignRoleBody }>(
      '/api/tenant-admin/users/:userId/roles',
      async (request, reply) => {
        try {
          const { currentUser, tenantId } = getTenantAccessContext(request);
          assertTenantAdmin(currentUser);
          const scopedAction = await resolveTenantScopeForUserAction(
            tenantId,
            request.params.userId
          );

          const assignment = await assignRoleToTenantUser(
            scopedAction.tenantId,
            scopedAction.userId,
            request.body.roleId,
            {
              actorUserId: currentUser.id,
              ipAddress: request.ip,
              userAgent: request.headers['user-agent']
            }
          );

          return reply.status(201).send(assignment);
        } catch (error) {
          return handleRouteError(error, reply);
        }
      }
    );

    tenantScopedApp.delete<{ Params: { userId: string; roleId: string } }>(
      '/api/tenant-admin/users/:userId/roles/:roleId',
      async (request, reply) => {
        try {
          const { currentUser, tenantId } = getTenantAccessContext(request);
          assertTenantAdmin(currentUser);
          const scopedAction = await resolveTenantScopeForUserAction(
            tenantId,
            request.params.userId
          );

          const result = await removeRoleFromTenantUser(
            scopedAction.tenantId,
            scopedAction.userId,
            request.params.roleId,
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

    tenantScopedApp.post<{ Body: TenantUserBody }>(
      '/api/tenant-admin/users',
      async (request, reply) => {
        try {
          const { currentUser, tenantId } = getTenantAccessContext(request);
          assertTenantAdmin(currentUser);

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

    tenantScopedApp.patch<{ Params: { userId: string }; Body: TenantUserBody }>(
      '/api/tenant-admin/users/:userId',
      async (request, reply) => {
        try {
          const { currentUser, tenantId } = getTenantAccessContext(request);
          assertTenantAdmin(currentUser);
          const scopedAction = await resolveTenantScopeForUserAction(
            tenantId,
            request.params.userId
          );

          const user = await updateTenantScopedUser(
            scopedAction.tenantId,
            scopedAction.userId,
            request.body,
            {
              actorUserId: currentUser.id,
              ipAddress: request.ip,
              userAgent: request.headers['user-agent']
            }
          );

          return reply.send(user);
        } catch (error) {
          return handleRouteError(error, reply);
        }
      }
    );

    tenantScopedApp.delete<{ Params: { userId: string } }>(
      '/api/tenant-admin/users/:userId',
      async (request, reply) => {
        try {
          const { currentUser, tenantId } = getTenantAccessContext(request);
          assertTenantAdmin(currentUser);
          const scopedAction = await resolveTenantScopeForUserAction(
            tenantId,
            request.params.userId
          );

          const deletedUser = await deleteTenantScopedUser(
            scopedAction.tenantId,
            scopedAction.userId,
            {
              actorUserId: currentUser.id,
              ipAddress: request.ip,
              userAgent: request.headers['user-agent']
            }
          );

          return reply.send(deletedUser);
        } catch (error) {
          return handleRouteError(error, reply);
        }
      }
    );
  });
}
