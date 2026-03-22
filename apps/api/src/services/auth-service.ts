import { prisma } from '@payer-portal/database';
import { logAuditEvent } from '@payer-portal/server';
import { createAccessToken } from './access-token-service';
import { PLATFORM_ROOT_SCOPE } from './current-user-service';

const DEFAULT_TENANT_SLUG = 'blue-horizon-health';
const DEFAULT_TENANT_NAME = 'Blue Horizon Health';
const DEFAULT_TENANT_BRANDING = {
  primaryColor: '#0f6cbd',
  secondaryColor: '#ffffff',
  logoUrl: '/logos/blue-horizon-health.svg'
};
const DEFAULT_MEMBER_LOGIN = 'maria';
const LEGACY_MEMBER_LOGIN = 'user';
const DEFAULT_MEMBER_ALIASES = new Set(['user', DEFAULT_MEMBER_LOGIN]);

const LOCAL_LOGIN_PROFILES = {
  [DEFAULT_MEMBER_LOGIN]: {
    email: DEFAULT_MEMBER_LOGIN,
    firstName: 'Maria',
    lastName: 'Lopez',
    landingContext: 'member',
    roleCode: 'member',
    roleName: 'Member',
    roleDescription: 'Default member-facing access role.'
  },
  chris: {
    email: 'chris',
    firstName: 'Chris',
    lastName: 'Gallagher',
    landingContext: 'member',
    roleCode: 'member',
    roleName: 'Member',
    roleDescription: 'Individual shopper demo access role.'
  },
  tenant: {
    email: 'tenant',
    firstName: 'Tenant',
    lastName: 'Admin',
    landingContext: 'tenant_admin',
    roleCode: 'tenant_admin',
    roleName: 'Tenant Admin',
    roleDescription: 'Administrative role restricted to a single tenant scope.'
  },
  admin: {
    email: 'admin',
    firstName: 'Platform',
    lastName: 'Admin',
    landingContext: 'platform_admin',
    roleCode: 'platform_admin',
    roleName: 'Platform Admin',
    roleDescription: 'Administrative role with cross-tenant platform access.'
  },
  provider1: {
    email: 'provider1',
    firstName: 'Dr.',
    lastName: 'Lee',
    landingContext: 'provider',
    roleCode: 'provider',
    roleName: 'Provider',
    roleDescription: 'Provider portal access role for practice workflows.'
  },
  employer: {
    email: 'employer',
    firstName: 'Employer',
    lastName: 'Admin',
    landingContext: 'employer',
    roleCode: 'employer_group_admin',
    roleName: 'Employer Group Admin',
    roleDescription: 'Employer group admin role for enrollment and billing administration.'
  },
  'william.schultz': {
    email: 'william.schultz',
    firstName: 'William',
    lastName: 'Schultz',
    landingContext: 'member',
    roleCode: 'broker',
    roleName: 'Broker',
    roleDescription: 'Broker role for enrollment and billing support workflows.'
  },
  broker: {
    email: 'william.schultz',
    firstName: 'William',
    lastName: 'Schultz',
    landingContext: 'member',
    roleCode: 'broker',
    roleName: 'Broker',
    roleDescription: 'Broker role for enrollment and billing support workflows.'
  },
  ops: {
    email: 'ops',
    firstName: 'Internal',
    lastName: 'Operations',
    landingContext: 'member',
    roleCode: 'internal_operations',
    roleName: 'Internal Operations',
    roleDescription: 'Internal operations role for enrollment and billing execution.'
  }
} as const;

const DEFAULT_PERMISSIONS = [
  {
    code: 'admin.manage',
    name: 'Manage Admin',
    description: 'Allows access to administrative configuration workflows.'
  },
  {
    code: 'tenant.view',
    name: 'View Tenants',
    description: 'Allows viewing tenant records.'
  },
  {
    code: 'member.view',
    name: 'View Member Portal',
    description: 'Allows access to member-facing portal experiences.'
  },
  {
    code: 'provider.view',
    name: 'View Provider Portal',
    description: 'Allows access to provider-facing portal experiences.'
  },
  {
    code: 'user.manage',
    name: 'Manage Users',
    description: 'Allows creating and updating user records.'
  },
  {
    code: 'billing_enrollment.view',
    name: 'View Billing and Enrollment',
    description: 'Allows access to billing and enrollment experiences.'
  },
  {
    code: 'billing_enrollment.manage',
    name: 'Manage Billing and Enrollment',
    description: 'Allows operational and administrative updates in billing and enrollment.'
  }
] as const;

type LoginInput = {
  email: string;
  password: string;
};

type LoginContext = {
  ipAddress?: string;
  userAgent?: string;
};

type LandingContext =
  | 'member'
  | 'provider'
  | 'employer'
  | 'tenant_admin'
  | 'platform_admin';

function getPermissionCodesForRole(roleCode: string) {
  switch (roleCode) {
    case 'member':
      return ['member.view', 'billing_enrollment.view'];
    case 'provider':
      return ['provider.view', 'tenant.view'];
    case 'employer_group_admin':
      return ['member.view', 'tenant.view', 'billing_enrollment.view'];
    case 'broker':
      return ['tenant.view', 'billing_enrollment.view'];
    case 'internal_operations':
      return [
        'tenant.view',
        'billing_enrollment.view',
        'billing_enrollment.manage',
        'admin.manage',
        'user.manage'
      ];
    default:
      return DEFAULT_PERMISSIONS.map((permission) => permission.code);
  }
}

function buildSessionBrandingConfig(
  tenantBrandingConfig: unknown,
  tenantBranding?: {
    displayName: string | null;
    primaryColor: string | null;
    secondaryColor: string | null;
    logoUrl: string | null;
    faviconUrl: string | null;
  } | null,
  employerGroup?: {
    employerKey: string;
    name: string;
    logoUrl: string | null;
  } | null
) {
  const baseConfig =
    typeof tenantBrandingConfig === 'object' &&
    tenantBrandingConfig !== null &&
    !Array.isArray(tenantBrandingConfig)
      ? { ...(tenantBrandingConfig as Record<string, unknown>) }
      : {};

  delete baseConfig.customCss;

  return {
    ...baseConfig,
    ...(tenantBranding
      ? {
          displayName: tenantBranding.displayName ?? undefined,
          primaryColor: tenantBranding.primaryColor ?? undefined,
          secondaryColor: tenantBranding.secondaryColor ?? undefined,
          logoUrl: tenantBranding.logoUrl ?? undefined,
          faviconUrl: tenantBranding.faviconUrl ?? undefined
        }
      : {}),
    ...(employerGroup
      ? {
          employerKey: employerGroup.employerKey,
          employerGroupName: employerGroup.name,
          employerGroupLogoUrl: employerGroup.logoUrl ?? undefined
        }
      : {})
  };
}

const userSessionInclude = {
  employerGroup: true,
  tenant: {
    include: {
      branding: true
    }
  },
  memberships: {
    include: {
      tenant: {
        include: {
          branding: true
        }
      }
    },
    orderBy: [{ isDefault: 'desc' as const }, { createdAt: 'asc' as const }]
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
} satisfies Parameters<typeof prisma.user.findUnique>[0]['include'];

function getActiveTenantForSession(
  user: Awaited<ReturnType<typeof getUserWithRelations>>
) {
  return user?.tenant ?? user?.memberships[0]?.tenant ?? null;
}

async function getUserWithRelations(email: string) {
  return prisma.user.findUnique({
    where: { email },
    include: userSessionInclude
  });
}

async function getUserWithRelationsById(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    include: userSessionInclude
  });
}

async function getUserByLoginIdentifier(identifier: string) {
  const trimmedIdentifier = identifier.trim();

  if (!trimmedIdentifier) {
    return null;
  }

  const exactEmailMatch = await getUserWithRelations(trimmedIdentifier);
  if (exactEmailMatch) {
    return exactEmailMatch;
  }

  const normalizedLookup = trimmedIdentifier.toLowerCase();
  const nameParts = trimmedIdentifier
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean);
  const [firstNamePart, ...remainingNameParts] = nameParts;
  const lastNamePart = remainingNameParts.join(' ');

  const matches = await prisma.user.findMany({
    where: {
      isActive: true,
      OR: [
        {
          email: {
            equals: normalizedLookup,
            mode: 'insensitive' as const
          }
        },
        {
          firstName: {
            equals: normalizedLookup,
            mode: 'insensitive' as const
          }
        },
        ...(firstNamePart && lastNamePart
          ? [
              {
                AND: [
                  {
                    firstName: {
                      equals: firstNamePart,
                      mode: 'insensitive' as const
                    }
                  },
                  {
                    lastName: {
                      equals: lastNamePart,
                      mode: 'insensitive' as const
                    }
                  }
                ]
              }
            ]
          : [])
      ]
    },
    select: {
      id: true
    },
    take: 2
  });

  if (matches.length !== 1) {
    return null;
  }

  return getUserWithRelationsById(matches[0].id);
}

async function recordSuccessfulLogin(userId: string) {
  return prisma.user.update({
    where: { id: userId },
    data: {
      lastLoginAt: new Date()
    },
    include: userSessionInclude
  });
}

async function ensureLocalLoginUser(identifier: string) {
  const normalizedIdentifier = DEFAULT_MEMBER_ALIASES.has(identifier)
    ? DEFAULT_MEMBER_LOGIN
    : identifier;
  const profile =
    LOCAL_LOGIN_PROFILES[
      normalizedIdentifier as keyof typeof LOCAL_LOGIN_PROFILES
    ];

  if (!profile) {
    return null;
  }

  const tenant = await prisma.tenant.upsert({
    where: {
      slug: DEFAULT_TENANT_SLUG
    },
    update: {
      status: 'ACTIVE',
      isActive: true,
      brandingConfig: DEFAULT_TENANT_BRANDING
    },
    create: {
      slug: DEFAULT_TENANT_SLUG,
      name: DEFAULT_TENANT_NAME,
      status: 'ACTIVE',
      isActive: true,
      brandingConfig: DEFAULT_TENANT_BRANDING
    }
  });

  await prisma.tenantBranding.upsert({
    where: {
      tenantId: tenant.id
    },
    update: {
      displayName: DEFAULT_TENANT_NAME,
      primaryColor: DEFAULT_TENANT_BRANDING.primaryColor,
      secondaryColor: DEFAULT_TENANT_BRANDING.secondaryColor,
      logoUrl: DEFAULT_TENANT_BRANDING.logoUrl
    },
    create: {
      tenantId: tenant.id,
      displayName: DEFAULT_TENANT_NAME,
      primaryColor: DEFAULT_TENANT_BRANDING.primaryColor,
      secondaryColor: DEFAULT_TENANT_BRANDING.secondaryColor,
      logoUrl: DEFAULT_TENANT_BRANDING.logoUrl
    }
  });

  for (const permission of DEFAULT_PERMISSIONS) {
    await prisma.permission.upsert({
      where: {
        code: permission.code
      },
      update: {
        name: permission.name,
        description: permission.description
      },
      create: permission
    });
  }

  const role = await prisma.role.upsert({
    where: {
      code: profile.roleCode
    },
    update: {
      name: profile.roleName,
      description: profile.roleDescription
    },
    create: {
      code: profile.roleCode,
      name: profile.roleName,
      description: profile.roleDescription
    }
  });

  const permissionCodes = new Set(getPermissionCodesForRole(profile.roleCode));
  const permissions = DEFAULT_PERMISSIONS.filter((permission) =>
    permissionCodes.has(permission.code)
  );

  if (profile.roleCode === 'member' && normalizedIdentifier !== LEGACY_MEMBER_LOGIN) {
    const legacyUser = await prisma.user.findUnique({
      where: {
        email: LEGACY_MEMBER_LOGIN
      }
    });

    if (legacyUser) {
      await prisma.user.update({
        where: {
          id: legacyUser.id
        },
        data: {
          email: profile.email,
          tenantId: tenant.id,
          isActive: true,
          firstName: profile.firstName,
          lastName: profile.lastName
        }
      });
    }
  }

  for (const permission of permissions) {
    const storedPermission = await prisma.permission.findUniqueOrThrow({
      where: {
        code: permission.code
      }
    });

    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: role.id,
          permissionId: storedPermission.id
        }
      },
      update: {},
      create: {
        roleId: role.id,
        permissionId: storedPermission.id
      }
    });
  }

  const user = await prisma.user.upsert({
    where: {
      email: profile.email
    },
    update: {
      tenantId: tenant.id,
      isActive: true,
      firstName: profile.firstName,
      lastName: profile.lastName
    },
    create: {
      tenantId: tenant.id,
      email: profile.email,
      firstName: profile.firstName,
      lastName: profile.lastName,
      isActive: true
    }
  });

  await prisma.userTenantMembership.upsert({
    where: {
      userId_tenantId: {
        userId: user.id,
        tenantId: tenant.id
      }
    },
    update: {
      isDefault: true,
      isTenantAdmin: profile.roleCode === 'tenant_admin'
    },
    create: {
      userId: user.id,
      tenantId: tenant.id,
      isDefault: true,
      isTenantAdmin: profile.roleCode === 'tenant_admin'
    }
  });

  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: user.id,
        roleId: role.id
      }
    },
    update: {},
    create: {
      userId: user.id,
      roleId: role.id
    }
  });

  return getUserWithRelations(profile.email);
}

async function ensureRolePermissions(roleCode: string) {
  for (const permission of DEFAULT_PERMISSIONS) {
    await prisma.permission.upsert({
      where: {
        code: permission.code
      },
      update: {
        name: permission.name,
        description: permission.description
      },
      create: permission
    });
  }

  const roleProfile =
    roleCode === 'employer_group_admin'
      ? {
          roleName: 'Employer Group Admin',
          roleDescription: 'Employer group admin role for enrollment and billing administration.'
        }
      : {
          roleName: roleCode,
          roleDescription: `Auto-provisioned role ${roleCode}.`
        };

  const role = await prisma.role.upsert({
    where: {
      code: roleCode
    },
    update: {
      name: roleProfile.roleName,
      description: roleProfile.roleDescription
    },
    create: {
      code: roleCode,
      name: roleProfile.roleName,
      description: roleProfile.roleDescription
    }
  });

  const permissionCodes = new Set(getPermissionCodesForRole(roleCode));

  for (const permissionCode of permissionCodes) {
    const permission = await prisma.permission.findUnique({
      where: { code: permissionCode }
    });

    if (!permission) {
      continue;
    }

    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: role.id,
          permissionId: permission.id
        }
      },
      update: {},
      create: {
        roleId: role.id,
        permissionId: permission.id
      }
    });
  }

  return role;
}

async function getEmployerUserByTenant(tenantId: string) {
  const user = await prisma.user.findFirst({
    where: {
      tenantId,
      roles: {
        some: {
          role: {
            code: 'employer_group_admin'
          }
        }
      }
    },
    select: {
      email: true
    }
  });

  if (!user) {
    return null;
  }

  return getUserWithRelations(user.email);
}

async function getEmployerUserByGroup(employerGroupId: string) {
  const user = await prisma.user.findFirst({
    where: {
      employerGroupId,
      roles: {
        some: {
          role: {
            code: 'employer_group_admin'
          }
        }
      }
    },
    select: {
      email: true
    }
  });

  if (!user) {
    return null;
  }

  return getUserWithRelations(user.email);
}

async function ensureEmployerUserForKey(employerKey: string) {
  const normalizedKey = employerKey.trim().toLowerCase();
  if (!normalizedKey) {
    return null;
  }

  const employerGroup = await prisma.employerGroup.findFirst({
    where: {
      employerKey: {
        equals: employerKey.trim(),
        mode: 'insensitive'
      },
      isActive: true
    },
    select: {
      id: true,
      tenantId: true,
      employerKey: true,
      name: true
    }
  });

  if (employerGroup) {
    const role = await ensureRolePermissions('employer_group_admin');
    const existingEmployerUser = await getEmployerUserByGroup(employerGroup.id);

    if (existingEmployerUser) {
      return existingEmployerUser;
    }

    const normalizedEmail = `employer+${employerGroup.employerKey.toLowerCase()}@local`;
    const user = await prisma.user.upsert({
      where: { email: normalizedEmail },
      update: {
        tenantId: employerGroup.tenantId,
        employerGroupId: employerGroup.id,
        isActive: true,
        firstName: employerGroup.name,
        lastName: 'Employer Admin'
      },
      create: {
        tenantId: employerGroup.tenantId,
        employerGroupId: employerGroup.id,
        email: normalizedEmail,
        firstName: employerGroup.name,
        lastName: 'Employer Admin',
        isActive: true
      }
    });

    await prisma.userTenantMembership.upsert({
      where: {
        userId_tenantId: {
          userId: user.id,
          tenantId: employerGroup.tenantId
        }
      },
      update: {
        isDefault: true
      },
      create: {
        userId: user.id,
        tenantId: employerGroup.tenantId,
        isDefault: true
      }
    });

    await prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId: user.id,
          roleId: role.id
        }
      },
      update: {},
      create: {
        userId: user.id,
        roleId: role.id
      }
    });

    return getUserWithRelations(normalizedEmail);
  }

  const directTenantMatch =
    (await prisma.tenant.findUnique({
      where: { slug: normalizedKey }
    })) ??
    (await prisma.tenant.findFirst({
      where: {
        name: {
          equals: employerKey.trim(),
          mode: 'insensitive'
        }
      }
    }));

  const tenant =
    directTenantMatch ??
    (await prisma.tenant
      .findMany({
        select: {
          id: true,
          slug: true,
          name: true,
          brandingConfig: true
        }
      })
      .then((tenants) =>
        tenants.find((candidate) => {
          if (
            typeof candidate.brandingConfig !== 'object' ||
            candidate.brandingConfig === null ||
            Array.isArray(candidate.brandingConfig)
          ) {
            return false;
          }

          const config = candidate.brandingConfig as Record<string, unknown>;
          const possibleKeys = [
            config.employerKey,
            config.employer_key,
            config.employerId,
            config.employer_id,
            config.groupKey,
            config.group_key
          ];

          return possibleKeys.some(
            (value) =>
              typeof value === 'string' &&
              value.trim().toLowerCase() === normalizedKey
          );
        }) ?? null
      ));

  if (!tenant) {
    return null;
  }

  const role = await ensureRolePermissions('employer_group_admin');
  const existingEmployerUser = await getEmployerUserByTenant(tenant.id);

  if (existingEmployerUser) {
    return existingEmployerUser;
  }

  const normalizedEmail = `employer+${tenant.slug}@local`;
  const user = await prisma.user.upsert({
    where: { email: normalizedEmail },
    update: {
      tenantId: tenant.id,
      isActive: true,
      firstName: tenant.name,
      lastName: 'Employer Admin'
    },
    create: {
      tenantId: tenant.id,
      email: normalizedEmail,
      firstName: tenant.name,
      lastName: 'Employer Admin',
      isActive: true
    }
  });

  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: user.id,
        roleId: role.id
      }
    },
    update: {},
    create: {
      userId: user.id,
      roleId: role.id
    }
  });

  return getUserWithRelations(normalizedEmail);
}

export async function login(
  { email, password }: LoginInput,
  context: LoginContext = {},
  options: {
    requiredLandingContext?: LandingContext;
  } = {}
) {
  const normalizedEmail = email.trim();

  if (!normalizedEmail) {
    return null;
  }

  const normalizedLookup = normalizedEmail.toLowerCase();
  const user =
    options.requiredLandingContext === 'employer'
      ? (await getUserWithRelations(normalizedEmail)) ??
        (await ensureEmployerUserForKey(normalizedLookup))
      : (await getUserByLoginIdentifier(normalizedEmail)) ??
        (await ensureLocalLoginUser(normalizedLookup)) ??
        (await ensureEmployerUserForKey(normalizedLookup));

  if (!user) {
    return null;
  }

  const updatedUser = await recordSuccessfulLogin(user.id);
  const activeTenant = getActiveTenantForSession(updatedUser);
  const landingContext: LandingContext =
    updatedUser.roles.some(({ role }) => role.code === 'platform_admin' || role.code === 'platform-admin')
      ? 'platform_admin'
      : updatedUser.roles.some(({ role }) => role.code === 'tenant_admin')
        ? 'tenant_admin'
      : updatedUser.roles.some(({ role }) => role.code === 'employer_group_admin')
        ? 'employer'
        : updatedUser.roles.some(({ role }) => role.code === 'provider')
          ? 'provider'
        : 'member';

  if (
    options.requiredLandingContext &&
    landingContext !== options.requiredLandingContext
  ) {
    return null;
  }

  const permissions = Array.from(
    new Set(
      updatedUser.roles.flatMap(({ role }) =>
        role.permissions.map(({ permission }) => permission.code)
      )
    )
  );

  if (activeTenant) {
    await logAuditEvent({
      tenantId: activeTenant.id,
      actorUserId: updatedUser.id,
      action: 'auth.login.success',
      entityType: 'user',
      entityId: updatedUser.id,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent
    });
  }

  return {
    token: createAccessToken({
      userId: updatedUser.id,
      email: updatedUser.email,
      tenantId: activeTenant?.id ?? PLATFORM_ROOT_SCOPE
    }),
    user: {
      id: updatedUser.id,
      email: updatedUser.email,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      landingContext,
      tenant: {
        id: activeTenant?.id ?? 'platform',
        name: activeTenant?.name ?? 'Platform',
        brandingConfig: buildSessionBrandingConfig(
          activeTenant?.brandingConfig,
          activeTenant?.branding
            ? {
                displayName: activeTenant.branding.displayName ?? activeTenant.name,
                primaryColor: activeTenant.branding.primaryColor ?? null,
                secondaryColor: activeTenant.branding.secondaryColor ?? null,
                logoUrl: activeTenant.branding.logoUrl ?? null,
                faviconUrl: activeTenant.branding.faviconUrl ?? null
              }
            : null,
          updatedUser.employerGroup
            ? {
                employerKey: updatedUser.employerGroup.employerKey,
                name: updatedUser.employerGroup.name,
                logoUrl: updatedUser.employerGroup.logoUrl ?? null
              }
            : null
        )
      },
      roles: updatedUser.roles.map(({ role }) => role.code),
      permissions
    }
  };
}
