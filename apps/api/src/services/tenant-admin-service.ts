import type { Prisma } from '@payer-portal/database';
import { prisma } from '@payer-portal/database';
import {
  type BillingEnrollmentModuleConfigUpdateInput,
  getBillingEnrollmentModuleConfigForTenant,
  getNotificationSettingsForTenant,
  getPurchasedModulesForTenant,
  logAuditEvent,
  type TenantNotificationSettings,
  updateBillingEnrollmentModuleConfigForTenant,
  updateNotificationSettingsForTenant,
  updatePurchasedModulesForTenant
} from '@payer-portal/server';

import { getBrandingForTenant } from './branding-service';
import { updateBrandingForTenant } from './branding-service';
import { listConnectorsForTenant } from './connector-service';
import {
  assignRoleToUser,
  createUser,
  deleteUser,
  listRoles,
  removeRoleFromUser,
  updateUser
} from './role-service';

type AuditContext = {
  actorUserId: string;
  ipAddress?: string;
  userAgent?: string;
};

type EmployerGroupBrandingSettings = {
  employerKey?: string | null;
  employerGroupName: string | null;
  employerGroupLogoUrl: string | null;
  availableEmployerKeys?: string[];
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
  } | null;
  memberships: Array<{
    status: 'INVITED' | 'ACTIVE' | 'DISABLED';
    isDefault: boolean;
    isTenantAdmin: boolean;
    tenant: {
      id: string;
      name: string;
    };
  }>;
  roles: Array<{
    tenantId: string | null;
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
  const scopedTenant =
    user.memberships.find((membership) => membership.isDefault)?.tenant ??
    user.memberships[0]?.tenant ??
    user.tenant;
  const scopedRoles = user.roles.filter(
    (assignment) =>
      assignment.tenantId === scopedTenant?.id || assignment.tenantId === null
  );

  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    isActive: user.isActive,
    tenant: scopedTenant,
    roles: scopedRoles.map(({ role }) => role.code),
    permissions: Array.from(
      new Set(
        scopedRoles.flatMap(({ role }) =>
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

function normalizeEmployerKey(value: string | null | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized.toUpperCase() : null;
}

function readEmployerGroupBrandingMap(brandingConfig: Record<string, unknown>) {
  const mapCandidate = brandingConfig.employerGroups;
  if (
    typeof mapCandidate !== 'object' ||
    mapCandidate === null ||
    Array.isArray(mapCandidate)
  ) {
    return {};
  }

  const entries = Object.entries(mapCandidate as Record<string, unknown>);
  const mapped = entries.flatMap(([key, value]) => {
    if (!key.trim()) {
      return [];
    }

    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      return [];
    }

    const record = value as Record<string, unknown>;
    const employerGroupName =
      typeof record.employerGroupName === 'string'
        ? record.employerGroupName
        : null;
    const employerGroupLogoUrl =
      typeof record.employerGroupLogoUrl === 'string'
        ? record.employerGroupLogoUrl
        : null;

    return [
      [
        normalizeEmployerKey(key) ?? key,
        {
          employerGroupName,
          employerGroupLogoUrl
        }
      ] as const
    ];
  });

  return Object.fromEntries(mapped);
}

export async function getTenantAdminSettings(
  tenantId: string,
  options: {
    employerKey?: string;
  } = {}
) {
  const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        name: true,
        slug: true,
        type: true,
        tenantTypeCode: true,
        status: true,
        brandingConfig: true
      }
    });

  if (!tenant) {
    throw new Error('Tenant not found');
  }

  const [
    branding,
    notificationSettings,
    purchasedModules,
    billingEnrollmentModuleConfig,
    connectors,
    roles,
    users,
    employerGroups
  ] = await Promise.all([
    getBrandingForTenant(tenantId),
    getNotificationSettingsForTenant(tenantId),
    getPurchasedModulesForTenant(tenantId),
    getBillingEnrollmentModuleConfigForTenant(tenantId),
    listConnectorsForTenant(tenantId),
    listRoles({
      tenantTypeCode: tenant.tenantTypeCode,
      includePlatformRoles: false
    }),
    prisma.user.findMany({
      where: {
        memberships: {
          some: {
            tenantId,
            status: 'ACTIVE'
          }
        }
      },
      include: {
        tenant: {
          select: {
            id: true,
            name: true
          }
        },
        memberships: {
          where: {
            tenantId
          },
          select: {
            status: true,
            isDefault: true,
            isTenantAdmin: true,
            tenant: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        roles: {
          where: {
            OR: [{ tenantId }, { tenantId: null }]
          },
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
    }),
    prisma.employerGroup.findMany({
      where: { tenantId },
      select: {
        employerKey: true,
        name: true,
        logoUrl: true
      },
      orderBy: {
        employerKey: 'asc'
      }
    })
  ]);

  const tenantBrandingConfig =
    typeof tenant.brandingConfig === 'object' &&
    tenant.brandingConfig !== null &&
    !Array.isArray(tenant.brandingConfig)
      ? (tenant.brandingConfig as Record<string, unknown>)
      : {};
  const employerGroupBrandingMap =
    readEmployerGroupBrandingMap(tenantBrandingConfig);
  const requestedEmployerKey = normalizeEmployerKey(options.employerKey);
  const scopedEmployerGroupFromTable = requestedEmployerKey
    ? (employerGroups.find(
        (group) =>
          normalizeEmployerKey(group.employerKey) === requestedEmployerKey
      ) ?? null)
    : null;
  const scopedEmployerGroupBranding = requestedEmployerKey
    ? employerGroupBrandingMap[requestedEmployerKey]
    : null;

  const employerGroupName =
    typeof scopedEmployerGroupFromTable?.name === 'string'
      ? scopedEmployerGroupFromTable.name
      : typeof scopedEmployerGroupBranding?.employerGroupName === 'string'
        ? scopedEmployerGroupBranding.employerGroupName
        : typeof tenantBrandingConfig.employerGroupName === 'string'
          ? tenantBrandingConfig.employerGroupName
          : typeof tenantBrandingConfig.employerName === 'string'
            ? tenantBrandingConfig.employerName
            : typeof tenantBrandingConfig.groupName === 'string'
              ? tenantBrandingConfig.groupName
              : null;
  const employerGroupLogoUrl =
    typeof scopedEmployerGroupFromTable?.logoUrl === 'string'
      ? scopedEmployerGroupFromTable.logoUrl
      : typeof scopedEmployerGroupBranding?.employerGroupLogoUrl === 'string'
        ? scopedEmployerGroupBranding.employerGroupLogoUrl
        : typeof tenantBrandingConfig.employerGroupLogoUrl === 'string'
          ? tenantBrandingConfig.employerGroupLogoUrl
          : typeof tenantBrandingConfig.employerLogoUrl === 'string'
            ? tenantBrandingConfig.employerLogoUrl
            : null;

  const webhookConfigs = connectors.filter(
    (connector) => connector.adapterKey === 'webhook'
  );

  return {
    tenant,
    branding,
    employerGroupBranding: {
      employerKey: requestedEmployerKey,
      employerGroupName,
      employerGroupLogoUrl,
      availableEmployerKeys: Array.from(
        new Set([
          ...Object.keys(employerGroupBrandingMap).map(
            (key) => normalizeEmployerKey(key) ?? key
          ),
          ...employerGroups.map(
            (group) =>
              normalizeEmployerKey(group.employerKey) ?? group.employerKey
          )
        ])
      ).sort()
    },
    notificationSettings,
    purchasedModules,
    billingEnrollmentModuleConfig,
    integrations: connectors,
    webhooks: webhookConfigs,
    roles,
    users: users.map(mapTenantUser).filter((user) => !isPlatformAdminUser(user))
  };
}

function normalizeOptionalString(value: string | null | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function validateOptionalLogoUrl(value: string | null) {
  if (!value) {
    return null;
  }

  if (value.startsWith('/')) {
    return value;
  }

  try {
    const url = new URL(value);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      throw new Error('unsupported protocol');
    }
    return value;
  } catch {
    throw new Error('employerGroupLogoUrl must be a valid URL');
  }
}

export async function saveTenantEmployerGroupBrandingSettings(
  tenantId: string,
  input: Partial<EmployerGroupBrandingSettings>,
  context: AuditContext,
  options: {
    employerKey?: string;
  } = {}
) {
  void context;
  const providedFields = (
    ['employerGroupName', 'employerGroupLogoUrl'] as const
  ).filter((field) => field in input);

  if (providedFields.length === 0) {
    throw new Error('At least one employer group branding field is required');
  }

  const updated = await prisma.$transaction(async (tx) => {
    const tenant = await tx.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true, brandingConfig: true }
    });

    if (!tenant) {
      throw new Error('Tenant not found');
    }

    const currentBrandingConfig =
      typeof tenant.brandingConfig === 'object' &&
      tenant.brandingConfig !== null &&
      !Array.isArray(tenant.brandingConfig)
        ? (tenant.brandingConfig as Record<string, unknown>)
        : {};
    const existingEmployerGroupBrandingMap = readEmployerGroupBrandingMap(
      currentBrandingConfig
    );

    const nextEmployerGroupName = normalizeOptionalString(
      input.employerGroupName ??
        (typeof currentBrandingConfig.employerGroupName === 'string'
          ? currentBrandingConfig.employerGroupName
          : typeof currentBrandingConfig.employerName === 'string'
            ? currentBrandingConfig.employerName
            : typeof currentBrandingConfig.groupName === 'string'
              ? currentBrandingConfig.groupName
              : null)
    );
    const nextEmployerGroupLogoUrl = validateOptionalLogoUrl(
      normalizeOptionalString(
        input.employerGroupLogoUrl ??
          (typeof currentBrandingConfig.employerGroupLogoUrl === 'string'
            ? currentBrandingConfig.employerGroupLogoUrl
            : typeof currentBrandingConfig.employerLogoUrl === 'string'
              ? currentBrandingConfig.employerLogoUrl
              : null)
      )
    );

    const brandingConfig = {
      ...currentBrandingConfig
    } as Record<string, unknown>;
    const targetEmployerKey = normalizeEmployerKey(options.employerKey);
    const beforeState = targetEmployerKey
      ? (existingEmployerGroupBrandingMap[targetEmployerKey] ?? null)
      : {
          employerGroupName:
            typeof currentBrandingConfig.employerGroupName === 'string'
              ? currentBrandingConfig.employerGroupName
              : null,
          employerGroupLogoUrl:
            typeof currentBrandingConfig.employerGroupLogoUrl === 'string'
              ? currentBrandingConfig.employerGroupLogoUrl
              : null
        };

    if (targetEmployerKey) {
      const existingEmployerGroup = await tx.employerGroup.findFirst({
        where: {
          tenantId: tenant.id,
          employerKey: {
            equals: targetEmployerKey,
            mode: 'insensitive'
          }
        },
        select: {
          id: true,
          employerKey: true,
          brandingConfig: true
        }
      });

      const employerGroupBrandingConfig =
        existingEmployerGroup &&
        typeof existingEmployerGroup.brandingConfig === 'object' &&
        existingEmployerGroup.brandingConfig !== null &&
        !Array.isArray(existingEmployerGroup.brandingConfig)
          ? (existingEmployerGroup.brandingConfig as Record<string, unknown>)
          : {};

      await tx.employerGroup.upsert({
        where: {
          tenantId_employerKey: {
            tenantId: tenant.id,
            employerKey: existingEmployerGroup?.employerKey ?? targetEmployerKey
          }
        },
        update: {
          name:
            nextEmployerGroupName ??
            existingEmployerGroup?.employerKey ??
            targetEmployerKey,
          logoUrl: nextEmployerGroupLogoUrl ?? null,
          brandingConfig: {
            ...employerGroupBrandingConfig,
            ...(nextEmployerGroupName
              ? { employerGroupName: nextEmployerGroupName }
              : {}),
            ...(nextEmployerGroupLogoUrl
              ? { employerGroupLogoUrl: nextEmployerGroupLogoUrl }
              : {})
          } satisfies Prisma.InputJsonValue
        },
        create: {
          tenantId: tenant.id,
          employerKey: targetEmployerKey,
          name: nextEmployerGroupName ?? targetEmployerKey,
          logoUrl: nextEmployerGroupLogoUrl ?? null,
          isActive: true,
          brandingConfig: {
            ...(nextEmployerGroupName
              ? { employerGroupName: nextEmployerGroupName }
              : {}),
            ...(nextEmployerGroupLogoUrl
              ? { employerGroupLogoUrl: nextEmployerGroupLogoUrl }
              : {})
          } satisfies Prisma.InputJsonValue
        }
      });

      const employerGroupBrandingMap = readEmployerGroupBrandingMap(
        currentBrandingConfig
      );
      const nextEmployerGroupBrandingEntry = {
        ...(employerGroupBrandingMap[targetEmployerKey] ?? {})
      } as {
        employerGroupName: string | null;
        employerGroupLogoUrl: string | null;
      };

      nextEmployerGroupBrandingEntry.employerGroupName = nextEmployerGroupName;
      nextEmployerGroupBrandingEntry.employerGroupLogoUrl =
        nextEmployerGroupLogoUrl;

      if (
        !nextEmployerGroupBrandingEntry.employerGroupName &&
        !nextEmployerGroupBrandingEntry.employerGroupLogoUrl
      ) {
        delete employerGroupBrandingMap[targetEmployerKey];
      } else {
        employerGroupBrandingMap[targetEmployerKey] =
          nextEmployerGroupBrandingEntry;
      }

      if (Object.keys(employerGroupBrandingMap).length > 0) {
        brandingConfig.employerGroups = employerGroupBrandingMap;
      } else {
        delete brandingConfig.employerGroups;
      }
    } else if (nextEmployerGroupName) {
      brandingConfig.employerGroupName = nextEmployerGroupName;
    } else {
      delete brandingConfig.employerGroupName;
    }

    if (targetEmployerKey) {
      if (!nextEmployerGroupName && !nextEmployerGroupLogoUrl) {
        delete brandingConfig.employerGroupName;
        delete brandingConfig.employerGroupLogoUrl;
      }
    } else if (nextEmployerGroupLogoUrl) {
      brandingConfig.employerGroupLogoUrl = nextEmployerGroupLogoUrl;
    } else {
      delete brandingConfig.employerGroupLogoUrl;
    }

    await tx.tenant.update({
      where: { id: tenant.id },
      data: {
        brandingConfig: brandingConfig as Prisma.InputJsonValue
      }
    });

    await logAuditEvent({
      client: tx,
      tenantId: tenant.id,
      actorUserId: context.actorUserId,
      action: 'tenant.subtenant.updated',
      entityType: 'subtenant',
      entityId: targetEmployerKey ?? tenant.id,
      beforeState: beforeState as Prisma.InputJsonValue | undefined,
      afterState: {
        employerKey: targetEmployerKey,
        employerGroupName: nextEmployerGroupName,
        employerGroupLogoUrl: nextEmployerGroupLogoUrl
      } satisfies Prisma.InputJsonValue,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      metadata: {
        updatedFields: providedFields,
        scope: targetEmployerKey ? 'employer_group' : 'tenant'
      }
    });

    return {
      employerKey: targetEmployerKey,
      employerGroupName: nextEmployerGroupName,
      employerGroupLogoUrl: nextEmployerGroupLogoUrl
    };
  });

  return updated;
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
    customCss?: string;
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
  roleId: string,
  context: AuditContext
) {
  const user = await prisma.user.findFirst({
    where: {
      id: userId,
      memberships: {
        some: {
          tenantId
        }
      }
    }
  });

  if (!user) {
    throw new Error('User not found');
  }

  return assignRoleToUser(userId, roleId, context, { tenantId });
}

export async function removeRoleFromTenantUser(
  tenantId: string,
  userId: string,
  roleId: string,
  context: AuditContext
) {
  const user = await prisma.user.findFirst({
    where: {
      id: userId,
      memberships: {
        some: {
          tenantId
        }
      }
    }
  });

  if (!user) {
    throw new Error('User not found');
  }

  return removeRoleFromUser(userId, roleId, context, { tenantId });
}

type TenantUserInput = {
  email: string;
  firstName: string;
  lastName: string;
  isActive?: boolean;
  status?: 'INVITED' | 'ACTIVE' | 'DISABLED';
  password?: string;
  organizationUnitId?: string | null;
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
  input: TenantUserInput,
  context: AuditContext
) {
  const user = await prisma.user.findFirst({
    where: {
      id: userId,
      memberships: {
        some: {
          tenantId
        }
      }
    }
  });

  if (!user) {
    throw new Error('User not found');
  }

  return updateUser(
    userId,
    {
      tenantId,
      ...input
    },
    context
  );
}

export async function deleteTenantScopedUser(
  tenantId: string,
  userId: string,
  context: AuditContext
) {
  const user = await prisma.user.findFirst({
    where: {
      id: userId,
      memberships: {
        some: {
          tenantId
        }
      }
    }
  });

  if (!user) {
    throw new Error('User not found');
  }

  return deleteUser(userId, context);
}
