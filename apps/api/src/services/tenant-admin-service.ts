import { prisma } from '@payer-portal/database';
import {
  getBillingEnrollmentModuleConfigForTenant,
  getPurchasedModulesForTenant,
  getNotificationSettingsForTenant,
  updateBillingEnrollmentModuleConfigForTenant,
  updatePurchasedModulesForTenant,
  updateNotificationSettingsForTenant,
  type BillingEnrollmentModuleConfigUpdateInput,
  type TenantNotificationSettings
} from '@payer-portal/server';

import { getBrandingForTenant } from './branding-service';
import { updateBrandingForTenant } from './branding-service';
import { listConnectorsForTenant } from './connector-service';
import { assignRoleToUser, createUser, deleteUser, listRoles, updateUser } from './role-service';

type AuditContext = {
  actorUserId: string;
  ipAddress?: string;
  userAgent?: string;
};

type TenantUserRecord = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  tenant: {
    id: string;
    name: string;
  };
  roles: Array<{
    role: {
      code: string;
      permissions: Array<{
        permission: {
          code: string;
        };
      }>;
    };
  }>;
};

function mapTenantUser(user: TenantUserRecord) {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    isActive: user.isActive,
    tenant: user.tenant,
    roles: user.roles.map(({ role }) => role.code),
    permissions: Array.from(
      new Set(
        user.roles.flatMap(({ role }) =>
          role.permissions.map(({ permission }) => permission.code)
        )
      )
    )
  };
}

function isPlatformAdminUser(user: ReturnType<typeof mapTenantUser>) {
  return user.roles.some((role) => {
    const normalized = role.toLowerCase();
    return normalized === 'platform_admin' || normalized === 'platform-admin';
  });
}

export async function getTenantAdminSettings(tenantId: string) {
  const [tenant, branding, notificationSettings, purchasedModules, billingEnrollmentModuleConfig, connectors, roles, users] =
    await Promise.all([
      prisma.tenant.findUnique({
        where: { id: tenantId },
        select: {
          id: true,
          name: true,
          slug: true,
          status: true
        }
      }),
      getBrandingForTenant(tenantId),
      getNotificationSettingsForTenant(tenantId),
      getPurchasedModulesForTenant(tenantId),
      getBillingEnrollmentModuleConfigForTenant(tenantId),
      listConnectorsForTenant(tenantId),
      listRoles(),
      prisma.user.findMany({
        where: {
          tenantId
        },
        include: {
          tenant: {
            select: {
              id: true,
              name: true
            }
          },
          roles: {
            include: {
              role: {
                include: {
                  permissions: {
                    include: {
                      permission: true
                    }
                  }
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      })
    ]);

  if (!tenant) {
    throw new Error('Tenant not found');
  }

  const webhookConfigs = connectors.filter(
    (connector) => connector.adapterKey === 'webhook'
  );

  return {
    tenant,
    branding,
    notificationSettings,
    purchasedModules,
    billingEnrollmentModuleConfig,
    integrations: connectors,
    webhooks: webhookConfigs,
    roles,
    users: users.map(mapTenantUser).filter((user) => !isPlatformAdminUser(user))
  };
}

export async function saveTenantBillingEnrollmentModuleConfig(
  tenantId: string,
  input: BillingEnrollmentModuleConfigUpdateInput,
  context: AuditContext
) {
  return updateBillingEnrollmentModuleConfigForTenant(tenantId, input, context);
}

export async function saveTenantNotificationSettings(
  tenantId: string,
  input: Partial<TenantNotificationSettings>,
  context: AuditContext
) {
  return updateNotificationSettingsForTenant(tenantId, input, context);
}

export async function saveTenantBrandingSettings(
  tenantId: string,
  input: {
    displayName?: string;
    primaryColor?: string;
    secondaryColor?: string;
    logoUrl?: string;
    faviconUrl?: string;
  },
  context: AuditContext
) {
  return updateBrandingForTenant(tenantId, input, context);
}

export async function saveTenantPurchasedModules(
  tenantId: string,
  modules: string[],
  context: AuditContext
) {
  return updatePurchasedModulesForTenant(tenantId, modules, context);
}

export async function assignRoleToTenantUser(
  tenantId: string,
  userId: string,
  roleId: string
) {
  const user = await prisma.user.findFirst({
    where: {
      id: userId,
      tenantId
    }
  });

  if (!user) {
    throw new Error('User not found');
  }

  return assignRoleToUser(userId, roleId);
}

type TenantUserInput = {
  email: string;
  firstName: string;
  lastName: string;
  isActive?: boolean;
};

export async function createTenantScopedUser(
  tenantId: string,
  input: TenantUserInput,
  context: AuditContext
) {
  return createUser(
    {
      tenantId,
      ...input
    },
    context
  );
}

export async function updateTenantScopedUser(
  tenantId: string,
  userId: string,
  input: TenantUserInput
) {
  const user = await prisma.user.findFirst({
    where: {
      id: userId,
      tenantId
    }
  });

  if (!user) {
    throw new Error('User not found');
  }

  return updateUser(userId, {
    tenantId,
    ...input
  });
}

export async function deleteTenantScopedUser(tenantId: string, userId: string) {
  const user = await prisma.user.findFirst({
    where: {
      id: userId,
      tenantId
    }
  });

  if (!user) {
    throw new Error('User not found');
  }

  return deleteUser(userId);
}
