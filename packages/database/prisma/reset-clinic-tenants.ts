import { rm } from 'node:fs/promises';
import path from 'node:path';

import { PrismaClient, type Prisma } from '@prisma/client';
import { hashPassword } from '../src/accessModel.js';

const prisma = new PrismaClient();
const DEFAULT_DEMO_PASSWORD = 'demo12345';

const repoRoot = path.resolve(process.cwd(), '../..');
const storageRoot = path.join(repoRoot, 'storage');
const portalTenantAssetsRoot = path.join(
  repoRoot,
  'apps/portal-web/public/tenant-assets/tenant'
);
const apiPortalTenantAssetsRoot = path.join(
  repoRoot,
  'apps/api/apps/portal-web/public/tenant-assets/tenant'
);

const clinicTenantTypes = new Set(['CLINIC', 'PHYSICIAN_GROUP', 'HOSPITAL']);

function readRequiredEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is required.`);
  }

  return value;
}

function readOptionalListEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) {
    return [];
  }

  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function readOptionalEnv(name: string) {
  return process.env[name]?.trim() || null;
}

function asObject(value: Prisma.JsonValue | null | undefined) {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? ({ ...value } as Record<string, unknown>)
    : {};
}

function sanitizeBrandingConfig(
  config: Prisma.JsonValue | null | undefined,
  targetName: string
) {
  const next = asObject(config);
  const controlPlane = asObject(next.control_plane as Prisma.JsonValue | undefined);

  if (Object.keys(controlPlane).length > 0) {
    delete controlPlane.tenant_id;
    controlPlane.scope = 'tenant';
    next.control_plane = controlPlane;
  }

  next.displayName = targetName;
  return next as Prisma.InputJsonValue;
}

async function safeRemove(targetPath: string) {
  await rm(targetPath, { recursive: true, force: true }).catch(() => undefined);
}

async function ensureClinicAccessModel(tx: Prisma.TransactionClient) {
  const permissionSeeds = [
    ['tenant.view', 'View Tenants', 'Tenant-scoped read access.'],
    ['provider.view', 'View Clinic Portal', 'Clinic portal access.'],
    ['provider.admin.manage', 'Manage Clinic Administration', 'Manage clinic administrative settings.'],
    ['provider.authorizations.view', 'View Clinic Authorizations', 'View clinic authorizations.'],
    ['provider.claims.view', 'View Clinic Claims', 'View clinic claims and payments.'],
    ['provider.documents.view', 'View Clinic Documents', 'View clinic documents.'],
    ['provider.eligibility.view', 'View Clinic Eligibility', 'View clinic eligibility workflows.'],
    ['provider.messages.view', 'View Clinic Messages', 'View clinic messages.'],
    ['provider.patients.view', 'View Clinic Patients', 'View clinic patients.'],
    ['provider.support.view', 'View Clinic Support', 'View clinic support workflows.']
  ] as const;

  const permissionByCode = new Map<string, string>();

  for (const [code, name, description] of permissionSeeds) {
    const permission = await tx.permission.upsert({
      where: { code },
      update: { name, description },
      create: { code, name, description }
    });
    permissionByCode.set(code, permission.id);
  }

  const roleSeeds = [
    {
      code: 'provider',
      name: 'Provider',
      description: 'Baseline clinic portal access.',
      permissionCodes: ['tenant.view', 'provider.view']
    },
    {
      code: 'clinic_manager',
      name: 'Clinic Manager',
      description: 'Clinic operations leadership access.',
      permissionCodes: [
        'tenant.view',
        'provider.view',
        'provider.admin.manage',
        'provider.authorizations.view',
        'provider.claims.view',
        'provider.documents.view',
        'provider.eligibility.view',
        'provider.messages.view',
        'provider.patients.view',
        'provider.support.view'
      ]
    },
    {
      code: 'authorization_specialist',
      name: 'Authorization Specialist',
      description: 'Clinic authorization workflow access.',
      permissionCodes: [
        'tenant.view',
        'provider.view',
        'provider.authorizations.view',
        'provider.documents.view',
        'provider.messages.view'
      ]
    },
    {
      code: 'billing_specialist',
      name: 'Billing Specialist',
      description: 'Clinic claims and billing access.',
      permissionCodes: [
        'tenant.view',
        'provider.view',
        'provider.claims.view',
        'provider.documents.view',
        'provider.messages.view'
      ]
    },
    {
      code: 'eligibility_coordinator',
      name: 'Eligibility Coordinator',
      description: 'Clinic eligibility workflow access.',
      permissionCodes: [
        'tenant.view',
        'provider.view',
        'provider.eligibility.view',
        'provider.messages.view',
        'provider.support.view'
      ]
    },
    {
      code: 'provider_support',
      name: 'Clinic Support',
      description: 'Clinic support and training access.',
      permissionCodes: [
        'tenant.view',
        'provider.view',
        'provider.support.view',
        'provider.messages.view',
        'provider.documents.view'
      ]
    }
  ] as const;

  const roleByCode = new Map<string, string>();

  for (const roleSeed of roleSeeds) {
    const role = await tx.role.upsert({
      where: { code: roleSeed.code },
      update: {
        name: roleSeed.name,
        description: roleSeed.description,
        tenantTypeCode: 'CLINIC',
        appliesToAllTenantTypes: false,
        isPlatformRole: false
      },
      create: {
        code: roleSeed.code,
        name: roleSeed.name,
        description: roleSeed.description,
        tenantTypeCode: 'CLINIC',
        appliesToAllTenantTypes: false,
        isPlatformRole: false
      }
    });

    roleByCode.set(roleSeed.code, role.id);

    await tx.rolePermission.deleteMany({
      where: { roleId: role.id }
    });

    await tx.rolePermission.createMany({
      data: roleSeed.permissionCodes.map((permissionCode) => ({
        roleId: role.id,
        permissionId: permissionByCode.get(permissionCode)!
      }))
    });
  }

  return roleByCode;
}

async function main() {
  const sourceSlug = readRequiredEnv('CLINIC_SOURCE_SLUG');
  const targetName = readRequiredEnv('CLINIC_TARGET_NAME');
  const targetSlug = readRequiredEnv('CLINIC_TARGET_SLUG');
  const carriedUserEmails = readOptionalListEnv('CLINIC_USER_EMAILS');
  const defaultClinicRoleCode = readOptionalEnv('CLINIC_DEFAULT_ROLE_CODE') ?? 'provider';
  const defaultUserPassword =
    readOptionalEnv('CLINIC_CARRIED_USER_PASSWORD') ?? DEFAULT_DEMO_PASSWORD;

  const sourceTenant = await prisma.tenant.findUnique({
    where: { slug: sourceSlug },
    include: {
      branding: true,
      organizationUnits: {
        orderBy: [{ createdAt: 'asc' }]
      },
      connectorConfigs: {
        orderBy: [{ createdAt: 'asc' }]
      },
      featureFlags: {
        orderBy: [{ createdAt: 'asc' }]
      },
      experiences: {
        orderBy: [{ createdAt: 'asc' }]
      },
      capabilityConfigs: {
        orderBy: [{ createdAt: 'asc' }]
      }
    }
  });

  if (!sourceTenant) {
    throw new Error(`Source clinic tenant ${sourceSlug} was not found.`);
  }

  if (!clinicTenantTypes.has(sourceTenant.tenantTypeCode)) {
    throw new Error(
      `Source tenant ${sourceSlug} is not a clinic-class tenant.`
    );
  }

  const carrierUsers = carriedUserEmails.length
    ? await prisma.user.findMany({
        where: {
          email: {
            in: carriedUserEmails
          }
        },
        include: {
          roles: {
            include: {
              role: true
            }
          }
        }
      })
    : [];

  const carrierUsersByEmail = new Map(
    carrierUsers.map((user) => [user.email.toLowerCase(), user])
  );

  const missingCarrierEmails = carriedUserEmails.filter(
    (email) => !carrierUsersByEmail.has(email.toLowerCase())
  );

  if (missingCarrierEmails.length > 0) {
    throw new Error(
      `Unable to carry users because these emails were not found: ${missingCarrierEmails.join(
        ', '
      )}`
    );
  }

  const clinicTenants = await prisma.tenant.findMany({
    where: {
      tenantTypeCode: {
        in: Array.from(clinicTenantTypes)
      }
    },
    include: {
      documents: {
        select: {
          storageKey: true
        }
      },
      memberships: {
        select: {
          userId: true
        }
      }
    }
  });

  const targetTenant = await prisma.$transaction(async (tx) => {
    const roleByCode = await ensureClinicAccessModel(tx);

    const existingTarget = await tx.tenant.findUnique({
      where: { slug: targetSlug },
      select: { id: true }
    });

    if (existingTarget) {
      throw new Error(
        `Target clinic tenant slug ${targetSlug} already exists.`
      );
    }

    const createdTenant = await tx.tenant.create({
      data: {
        name: targetName,
        slug: targetSlug,
        status: 'ACTIVE',
        isActive: true,
        type: sourceTenant.type,
        tenantTypeCode: sourceTenant.tenantTypeCode,
        templateId: sourceTenant.templateId,
        brandingConfig: sanitizeBrandingConfig(
          sourceTenant.brandingConfig,
          targetName
        )
      }
    });

    if (sourceTenant.branding) {
      await tx.tenantBranding.create({
        data: {
          tenantId: createdTenant.id,
          displayName: targetName,
          primaryColor: sourceTenant.branding.primaryColor,
          secondaryColor: sourceTenant.branding.secondaryColor,
          logoUrl: sourceTenant.branding.logoUrl,
          faviconUrl: sourceTenant.branding.faviconUrl
        }
      });
    }

    for (const featureFlag of sourceTenant.featureFlags) {
      await tx.featureFlag.create({
        data: {
          tenantId: createdTenant.id,
          key: featureFlag.key,
          name: featureFlag.name,
          description: featureFlag.description,
          enabled: featureFlag.enabled
        }
      });
    }

    for (const connector of sourceTenant.connectorConfigs) {
      await tx.connectorConfig.create({
        data: {
          tenantId: createdTenant.id,
          adapterKey: connector.adapterKey,
          name: connector.name,
          status: connector.status,
          config: connector.config,
          lastSyncAt: connector.lastSyncAt,
          lastHealthCheckAt: connector.lastHealthCheckAt
        }
      });
    }

    const organizationUnitIdMap = new Map<string, string>();

    for (const organizationUnit of sourceTenant.organizationUnits) {
      const createdOrganizationUnit = await tx.organizationUnit.create({
        data: {
          tenantId: createdTenant.id,
          parentId: organizationUnit.parentId
            ? organizationUnitIdMap.get(organizationUnit.parentId) ?? null
            : null,
          type: organizationUnit.type,
          name: organizationUnit.name,
          metadata: organizationUnit.metadata ?? undefined
        }
      });

      organizationUnitIdMap.set(organizationUnit.id, createdOrganizationUnit.id);
    }

    const experienceIdMap = new Map<string, string>();

    for (const experience of sourceTenant.experiences) {
      const createdExperience = await tx.tenantExperience.create({
        data: {
          tenantId: createdTenant.id,
          tenantTypeCode: experience.tenantTypeCode,
          key: experience.key,
          name: experience.name,
          description: experience.description,
          scope: experience.scope,
          layout: experience.layout
        }
      });

      experienceIdMap.set(experience.id, createdExperience.id);
    }

    for (const capabilityConfig of sourceTenant.capabilityConfigs) {
      const mappedExperienceId = experienceIdMap.get(capabilityConfig.experienceId);

      if (!mappedExperienceId) {
        continue;
      }

      await tx.tenantCapabilityConfig.create({
        data: {
          tenantId: createdTenant.id,
          tenantTypeCode: capabilityConfig.tenantTypeCode,
          experienceId: mappedExperienceId,
          capabilityId: capabilityConfig.capabilityId,
          enabled: capabilityConfig.enabled,
          scope: capabilityConfig.scope,
          displayOrder: capabilityConfig.displayOrder,
          config: capabilityConfig.config
        }
      });
    }

    const defaultOrganizationUnitId =
      Array.from(organizationUnitIdMap.values())[0] ?? null;

    for (const carrierEmail of carriedUserEmails) {
      const user = carrierUsersByEmail.get(carrierEmail.toLowerCase());

      if (!user) {
        continue;
      }

      const carriedRoleAssignments = user.roles.filter(
        (assignment) =>
          assignment.tenantId !== null &&
          clinicTenantTypes.has(assignment.role.tenantTypeCode ?? '')
      );
      const targetRoleAssignments =
        carriedRoleAssignments.length > 0
          ? carriedRoleAssignments.map((assignment) => ({
              roleId: assignment.roleId,
              roleCode: assignment.role.code
            }))
          : roleByCode.has(defaultClinicRoleCode)
            ? [
                {
                  roleId: roleByCode.get(defaultClinicRoleCode)!,
                  roleCode: defaultClinicRoleCode
                }
              ]
            : [];

      await tx.userOrganizationUnitAssignment.deleteMany({
        where: {
          userId: user.id
        }
      });

      await tx.userRole.deleteMany({
        where: {
          userId: user.id,
          tenantId: {
            not: null
          }
        }
      });

      await tx.userTenantMembership.deleteMany({
        where: {
          userId: user.id
        }
      });

      await tx.user.update({
        where: {
          id: user.id
        },
        data: {
          tenantId: createdTenant.id,
          isActive: true,
          status: 'ACTIVE'
        }
      });

      await tx.userCredential.upsert({
        where: {
          userId: user.id
        },
        update: {
          passwordHash: hashPassword(defaultUserPassword),
          mustResetPassword: false,
          passwordSetAt: new Date()
        },
        create: {
          userId: user.id,
          passwordHash: hashPassword(defaultUserPassword),
          mustResetPassword: false,
          passwordSetAt: new Date()
        }
      });

      await tx.userTenantMembership.create({
        data: {
          userId: user.id,
          tenantId: createdTenant.id,
          organizationUnitId: defaultOrganizationUnitId,
          status: 'ACTIVE',
          isDefault: true,
          isTenantAdmin: targetRoleAssignments.some(
            (assignment) => assignment.roleCode === 'tenant_admin'
          ),
          activatedAt: new Date()
        }
      });

      if (defaultOrganizationUnitId) {
        await tx.userOrganizationUnitAssignment.create({
          data: {
            userId: user.id,
            tenantId: createdTenant.id,
            organizationUnitId: defaultOrganizationUnitId,
            isDefault: true
          }
        });
      }

      for (const assignment of targetRoleAssignments) {
        await tx.userRole.create({
          data: {
            userId: user.id,
            tenantId: createdTenant.id,
            roleId: assignment.roleId
          }
        });
      }
    }

    const retiredClinicTenantIds = clinicTenants
      .map((tenant) => tenant.id)
      .filter((tenantId) => tenantId !== createdTenant.id);

    const affectedUserIds = Array.from(
      new Set(
        clinicTenants
          .filter((tenant) => tenant.id !== createdTenant.id)
          .flatMap((tenant) => tenant.memberships.map((membership) => membership.userId))
      )
    );

    if (retiredClinicTenantIds.length > 0) {
      await tx.userOrganizationUnitAssignment.deleteMany({
        where: {
          tenantId: {
            in: retiredClinicTenantIds
          }
        }
      });

      await tx.userRole.deleteMany({
        where: {
          tenantId: {
            in: retiredClinicTenantIds
          }
        }
      });

      await tx.userTenantMembership.deleteMany({
        where: {
          tenantId: {
            in: retiredClinicTenantIds
          }
        }
      });

      for (const retiredTenant of clinicTenants.filter(
        (tenant) => retiredClinicTenantIds.includes(tenant.id)
      )) {
        const currentBrandingConfig = asObject(
          retiredTenant.brandingConfig as Prisma.JsonValue | undefined
        );
        const currentLifecycle = asObject(
          currentBrandingConfig.lifecycle as Prisma.JsonValue | undefined
        );

        await tx.tenant.update({
          where: {
            id: retiredTenant.id
          },
          data: {
            name: `${retiredTenant.name} (Retired)`,
            slug: `${retiredTenant.slug}-retired-${retiredTenant.id.slice(0, 8)}`,
            status: 'INACTIVE',
            isActive: false,
            brandingConfig: {
              ...currentBrandingConfig,
              lifecycle: {
                ...currentLifecycle,
                retiredAt: new Date().toISOString()
              }
            } satisfies Prisma.InputJsonValue
          }
        });
      }
    }

    for (const userId of affectedUserIds) {
      const [remainingMemberships, hasPlatformRole] = await Promise.all([
        tx.userTenantMembership.findMany({
          where: {
            userId,
            status: 'ACTIVE',
            tenant: {
              status: 'ACTIVE',
              isActive: true
            }
          },
          orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }]
        }),
        tx.userRole.findFirst({
          where: {
            userId,
            tenantId: null,
            role: {
              isPlatformRole: true
            }
          },
          select: {
            id: true
          }
        })
      ]);

      if (remainingMemberships.length > 0) {
        const defaultMembership =
          remainingMemberships.find((membership) => membership.isDefault) ??
          remainingMemberships[0]!;

        await tx.userTenantMembership.updateMany({
          where: {
            userId,
            tenantId: {
              in: remainingMemberships.map((membership) => membership.tenantId)
            }
          },
          data: {
            isDefault: false
          }
        });

        await tx.userTenantMembership.update({
          where: {
            userId_tenantId: {
              userId,
              tenantId: defaultMembership.tenantId
            }
          },
          data: {
            isDefault: true
          }
        });

        await tx.user.update({
          where: { id: userId },
          data: {
            tenantId: defaultMembership.tenantId,
            isActive: true,
            status: 'ACTIVE'
          }
        });
      } else if (hasPlatformRole) {
        await tx.user.update({
          where: { id: userId },
          data: {
            tenantId: null,
            isActive: true,
            status: 'ACTIVE'
          }
        });
      } else {
        await tx.user.update({
          where: { id: userId },
          data: {
            tenantId: null,
            isActive: false,
            status: 'DISABLED'
          }
        });
      }
    }

    return createdTenant;
  });

  for (const tenant of clinicTenants) {
    if (tenant.id === targetTenant.id) {
      continue;
    }

    await Promise.all([
      safeRemove(path.join(portalTenantAssetsRoot, tenant.id)),
      safeRemove(path.join(apiPortalTenantAssetsRoot, tenant.id))
    ]);

    for (const document of tenant.documents) {
      await safeRemove(path.join(storageRoot, document.storageKey));
    }
  }

  console.log(
    JSON.stringify(
      {
        reset: true,
        targetTenant: {
          id: targetTenant.id,
          name: targetTenant.name,
          slug: targetTenant.slug
        },
        removedClinicTenantIds: clinicTenants
          .map((tenant) => tenant.id)
          .filter((tenantId) => tenantId !== targetTenant.id),
        carriedUserEmails
      },
      null,
      2
    )
  );
}

main()
  .catch(async (error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
