import type { Prisma } from '@payer-portal/database';
import { prisma, verifyPassword } from '@payer-portal/database';
import { logAuthenticationEvent } from '@payer-portal/server';

import { createAccessToken } from './access-token-service';
import { PLATFORM_ROOT_SCOPE } from './current-user-service';

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

type SessionType = 'tenant_admin' | 'end_user' | 'platform_admin';

const PROVIDER_ROLE_CODES = new Set([
  'provider',
  'clinic_manager',
  'authorization_specialist',
  'billing_specialist',
  'eligibility_coordinator',
  'provider_support'
]);

export class SessionIntegrityError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 403) {
    super(message);
    this.name = 'SessionIntegrityError';
    this.statusCode = statusCode;
  }
}

const userSessionInclude = {
  credential: true,
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
      },
      organizationUnit: true
    },
    orderBy: [{ isDefault: 'desc' as const }, { createdAt: 'asc' as const }]
  },
  roles: {
    include: {
      tenant: true,
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
  delete baseConfig.providerDemoData;

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

type UserWithRelations = NonNullable<Awaited<ReturnType<typeof getUserWithRelationsByEmail>>>;

function getDefaultMembership(user: UserWithRelations) {
  const activeMemberships = user.memberships.filter(
    (membership) => membership.status === 'ACTIVE'
  );

  return (
    activeMemberships.find((membership) => membership.isDefault) ??
    activeMemberships[0] ??
    null
  );
}

function getEffectiveTenant(user: UserWithRelations) {
  return getDefaultMembership(user)?.tenant ?? user.tenant ?? null;
}

function getScopedRoleAssignments(user: UserWithRelations) {
  const effectiveTenant = getEffectiveTenant(user);

  return user.roles.filter((assignment) =>
    effectiveTenant
      ? assignment.tenantId === effectiveTenant.id || assignment.tenantId === null
      : assignment.tenantId === null
  );
}

function getLandingContextForUser(user: UserWithRelations): LandingContext {
  const scopedAssignments = getScopedRoleAssignments(user);
  const scopedRoleCodes = scopedAssignments.map(({ role }) => role.code);
  const effectiveTenant = getEffectiveTenant(user);
  const tenantTypeCode = effectiveTenant?.tenantTypeCode ?? user.tenant?.tenantTypeCode ?? null;

  if (scopedAssignments.some(({ role }) => role.isPlatformRole || role.code === 'platform_admin')) {
    return 'platform_admin';
  }

  if (
    scopedRoleCodes.includes('tenant_admin') ||
    getDefaultMembership(user)?.isTenantAdmin === true
  ) {
    return 'tenant_admin';
  }

  if (tenantTypeCode === 'PROVIDER' || scopedRoleCodes.some((code) => PROVIDER_ROLE_CODES.has(code))) {
    return 'provider';
  }

  if (tenantTypeCode === 'EMPLOYER' || scopedRoleCodes.includes('employer_group_admin')) {
    return 'employer';
  }

  return 'member';
}

function getSessionTypeForLandingContext(
  landingContext: LandingContext
): SessionType {
  return landingContext === 'platform_admin'
    ? 'platform_admin'
    : landingContext === 'tenant_admin'
      ? 'tenant_admin'
      : 'end_user';
}

function requireTenantForSession(
  sessionType: SessionType,
  activeTenant: ReturnType<typeof getEffectiveTenant>
) {
  if (sessionType === 'platform_admin') {
    return null;
  }

  const tenantId = activeTenant?.id?.trim();

  if (!tenantId) {
    throw new SessionIntegrityError(
      'Tenant context is required for tenant-scoped sessions.',
      403
    );
  }

  return tenantId;
}

function buildAuthenticatedSessionResult(user: UserWithRelations) {
  const activeTenant = getEffectiveTenant(user);
  const landingContext = getLandingContextForUser(user);
  const sessionType = getSessionTypeForLandingContext(landingContext);
  const sessionTenantId =
    sessionType === 'platform_admin'
      ? null
      : requireTenantForSession(sessionType, activeTenant);
  const scopedAssignments = getScopedRoleAssignments(user);
  const permissions = Array.from(
    new Set(
      scopedAssignments.flatMap(({ role }) =>
        role.permissions.map(({ permission }) => permission.code)
      )
    )
  );

  return {
    landingContext,
    sessionType,
    token: createAccessToken({
      userId: user.id,
      email: user.email,
      tenantId:
        sessionType === 'platform_admin' ? PLATFORM_ROOT_SCOPE : sessionTenantId!,
      sessionType
    }),
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      landingContext,
      session: {
        personaType: sessionType,
        type: sessionType,
        tenantId: sessionTenantId,
        roles: scopedAssignments.map(({ role }) => role.code),
        permissions
      },
      tenant: {
        id: activeTenant?.id ?? 'platform',
        name: activeTenant?.name ?? 'Platform',
        tenantTypeCode: activeTenant?.tenantTypeCode ?? 'PLATFORM',
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
          user.employerGroup
            ? {
                employerKey: user.employerGroup.employerKey,
                name: user.employerGroup.name,
                logoUrl: user.employerGroup.logoUrl ?? null
              }
            : null
        )
      },
      memberships: user.memberships
        .filter((membership) => membership.status === 'ACTIVE')
        .map((membership) => ({
          id: membership.id,
          tenant: {
            id: membership.tenant.id,
            name: membership.tenant.name,
            tenantTypeCode: membership.tenant.tenantTypeCode
          },
          isDefault: membership.isDefault,
          isTenantAdmin: membership.isTenantAdmin,
          organizationUnit: membership.organizationUnit
            ? {
                id: membership.organizationUnit.id,
                name: membership.organizationUnit.name,
                type: membership.organizationUnit.type
              }
            : null
        })),
      roles: scopedAssignments.map(({ role }) => role.code),
      permissions
    }
  };
}

async function getUserWithRelationsByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email: email.toLowerCase() },
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
  const normalizedIdentifier = identifier.trim().toLowerCase();

  if (!normalizedIdentifier) {
    return null;
  }

  const exactMatch = await getUserWithRelationsByEmail(normalizedIdentifier);

  if (exactMatch) {
    return exactMatch;
  }

  const matches = await prisma.user.findMany({
    where: {
      status: 'ACTIVE',
      OR: [
        {
          email: {
            equals: normalizedIdentifier,
            mode: 'insensitive' as const
          }
        },
        {
          AND: normalizedIdentifier.includes(' ')
            ? normalizedIdentifier.split(/\s+/, 2).map((part, index) =>
                index === 0
                  ? {
                      firstName: {
                        equals: part,
                        mode: 'insensitive' as const
                      }
                    }
                  : {
                      lastName: {
                        equals: part,
                        mode: 'insensitive' as const
                      }
                    }
              )
            : []
        }
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

  return getUserWithRelationsById(matches[0]!.id);
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

export async function login(
  { email, password }: LoginInput,
  context: LoginContext = {},
  options: {
    requiredLandingContext?: LandingContext;
  } = {}
) {
  const normalizedIdentifier = email.trim();

  if (!normalizedIdentifier) {
    return null;
  }

  const user = await getUserByLoginIdentifier(normalizedIdentifier);

  if (!user || user.status !== 'ACTIVE' || !user.isActive) {
    return null;
  }

  if (!user.credential || !verifyPassword(password, user.credential.passwordHash)) {
    return null;
  }

  const activeMembership = getDefaultMembership(user);

  if (
    user.roles.every((assignment) => assignment.role.isPlatformRole === false) &&
    !activeMembership &&
    user.tenantId !== null
  ) {
    throw new SessionIntegrityError(
      'No active Tenant membership is available for this user.',
      403
    );
  }

  const updatedUser = await recordSuccessfulLogin(user.id);
  const sessionResult = buildAuthenticatedSessionResult(updatedUser);
  const landingContext = sessionResult.landingContext;

  if (
    options.requiredLandingContext &&
    landingContext !== options.requiredLandingContext
  ) {
    return null;
  }

  const activeTenant = getEffectiveTenant(updatedUser);

  if (activeTenant) {
    await logAuthenticationEvent({
      tenantId: activeTenant.id,
      actorUserId: updatedUser.id,
      action: 'auth.login.success',
      resourceType: 'user',
      resourceId: updatedUser.id,
      beforeState: {
        lastLoginAt: user.lastLoginAt?.toISOString() ?? null
      } satisfies Prisma.InputJsonValue,
      afterState: {
        lastLoginAt: updatedUser.lastLoginAt?.toISOString() ?? null,
        sessionType: sessionResult.sessionType
      } satisfies Prisma.InputJsonValue,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent
    });
  }

  return sessionResult;
}

export async function getAuthenticatedSessionResultByUserId(userId: string) {
  const user = await getUserWithRelationsById(userId);

  if (!user) {
    throw new Error('Authenticated user not found.');
  }

  return buildAuthenticatedSessionResult(user);
}
