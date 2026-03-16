import { prisma } from '@payer-portal/database';
import { logAuditEvent } from '@payer-portal/server';

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
    firstName: 'Provider',
    lastName: 'One',
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
  broker: {
    email: 'broker',
    firstName: 'Broker',
    lastName: 'User',
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

function createMockToken(email: string) {
  return Buffer.from(
    JSON.stringify({
      sub: email,
      scope: 'local-dev',
      kind: 'mock-jwt'
    })
  ).toString('base64url');
}

async function getUserWithRelations(email: string) {
  return prisma.user.findUnique({
    where: { email },
    include: {
      tenant: {
        include: {
          branding: true
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
    }
  });
}

async function recordSuccessfulLogin(userId: string) {
  return prisma.user.update({
    where: { id: userId },
    data: {
      lastLoginAt: new Date()
    },
    include: {
      tenant: {
        include: {
          branding: true
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
    }
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

async function ensureEmployerUserForKey(employerKey: string) {
  const normalizedKey = employerKey.trim().toLowerCase();
  if (!normalizedKey) {
    return null;
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

  if (!normalizedEmail || !password) {
    return null;
  }

  const normalizedLookup = normalizedEmail.toLowerCase();
  const user =
    options.requiredLandingContext === 'employer'
      ? (await getUserWithRelations(normalizedEmail)) ??
        (await ensureEmployerUserForKey(normalizedLookup))
      : (await getUserWithRelations(normalizedEmail)) ??
        (await ensureLocalLoginUser(normalizedLookup)) ??
        (await ensureEmployerUserForKey(normalizedLookup));

  if (!user) {
    return null;
  }

  const updatedUser = await recordSuccessfulLogin(user.id);
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

  await logAuditEvent({
    tenantId: updatedUser.tenant.id,
    actorUserId: updatedUser.id,
    action: 'auth.login.success',
    entityType: 'user',
    entityId: updatedUser.id,
    ipAddress: context.ipAddress,
    userAgent: context.userAgent
  });

  return {
    token: createMockToken(updatedUser.email),
    user: {
      id: updatedUser.id,
      email: updatedUser.email,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      landingContext,
      tenant: {
        id: updatedUser.tenant.id,
        name: updatedUser.tenant.name,
        brandingConfig: {
          ...(typeof updatedUser.tenant.brandingConfig === 'object' &&
          updatedUser.tenant.brandingConfig !== null &&
          !Array.isArray(updatedUser.tenant.brandingConfig)
            ? updatedUser.tenant.brandingConfig
            : {}),
          ...(updatedUser.tenant.branding
            ? {
                displayName:
                  updatedUser.tenant.branding.displayName ?? updatedUser.tenant.name,
                primaryColor: updatedUser.tenant.branding.primaryColor ?? undefined,
                secondaryColor:
                  updatedUser.tenant.branding.secondaryColor ?? undefined,
                logoUrl: updatedUser.tenant.branding.logoUrl ?? undefined,
                faviconUrl: updatedUser.tenant.branding.faviconUrl ?? undefined
              }
            : {})
        }
      },
      roles: updatedUser.roles.map(({ role }) => role.code),
      permissions
    }
  };
}
