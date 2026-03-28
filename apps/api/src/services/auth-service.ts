import type { Prisma } from '@payer-portal/database';
import {
  isProviderClassTenantTypeCode,
  normalizeTenantTypeCode,
  prisma,
  verifyPassword
} from '@payer-portal/database';
import { logAuthenticationEvent } from '@payer-portal/server';

import { createAccessToken } from './access-token-service';
import { PLATFORM_ROOT_SCOPE } from './current-user-service';

type LoginInput = {
  email: string;
  password: string;
  tenantId?: string;
  organizationUnitId?: string;
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

export type AutoLoginAudience = 'admin' | 'payer' | 'provider';

type SessionType = 'tenant_admin' | 'end_user' | 'platform_admin';

type SessionOrganizationUnit = {
  id: string;
  name: string;
  type: string;
};

type SessionOrganizationUnitSelection = {
  id: string;
  tenantId: string;
  isDefault: boolean;
  organizationUnit: SessionOrganizationUnit;
};

type SessionTenantSelection = {
  id: string;
  name: string;
  tenantTypeCode: string;
  isDefault: boolean;
};

type AutoLoginCatalogUser = {
  id: string;
  label: string;
  email: string;
  persona: string;
  personaLabel: string;
};

type AutoLoginCatalogPersona = {
  key: string;
  label: string;
  users: AutoLoginCatalogUser[];
};

type AutoLoginCatalogCompany = {
  key: string;
  tenantId: string | null;
  tenantTypeCode: string;
  name: string;
  personas: AutoLoginCatalogPersona[];
};

export type AutoLoginCatalogAudience = {
  key: AutoLoginAudience;
  label: string;
  companies: AutoLoginCatalogCompany[];
};

type AutoLoginCandidate = {
  audience: AutoLoginAudience;
  companyKey: string;
  tenantId: string | null;
  tenantTypeCode: string;
  companyName: string;
  personaKey: string;
  personaLabel: string;
  user: AutoLoginCatalogUser;
};

const PROVIDER_ROLE_CODES = new Set([
  'provider',
  'clinic_manager',
  'authorization_specialist',
  'billing_specialist',
  'eligibility_coordinator',
  'provider_support'
]);

const PAYER_PROVIDER_ROLE_CODES = new Set([
  'provider',
  'provider_support'
]);

const BROKER_ROLE_CODES = new Set([
  'broker',
  'broker_admin',
  'broker_staff',
  'broker_readonly',
  'broker_read_only'
]);

function getPurchasedModules(brandingConfig: unknown) {
  if (!brandingConfig || typeof brandingConfig !== 'object' || Array.isArray(brandingConfig)) {
    return [];
  }

  const modules = (brandingConfig as Record<string, unknown>).purchasedModules;
  return Array.isArray(modules) ? modules.filter((value): value is string => typeof value === 'string') : [];
}

function humanizeRoleCode(roleCode: string) {
  return roleCode
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

function getUserDisplayLabel(user: UserWithRelations) {
  const fullName = `${user.firstName} ${user.lastName}`.trim();
  return fullName || user.email;
}

function isProviderExperienceTenantContextForTenant(
  user: UserWithRelations,
  tenantId?: string | null
) {
  const scopedAssignments = getScopedRoleAssignmentsForTenant(user, tenantId);
  const scopedRoleCodes = scopedAssignments.map(({ role }) => role.code);
  const permissions = new Set(
    scopedAssignments.flatMap(({ role }) => role.permissions.map(({ permission }) => permission.code))
  );
  const effectiveTenant = getEffectiveTenant(user, tenantId);
  const tenantTypeCode = normalizeTenantTypeCode(
    effectiveTenant?.tenantTypeCode ?? user.tenant?.tenantTypeCode ?? null
  );
  const purchasedModules = getPurchasedModules(effectiveTenant?.brandingConfig);

  if (isProviderClassTenantTypeCode(tenantTypeCode)) {
    return true;
  }

  if (tenantTypeCode === 'PAYER') {
    return (
      scopedRoleCodes.some((code) => PROVIDER_ROLE_CODES.has(code)) ||
      permissions.has('provider.view') ||
      purchasedModules.includes('provider_operations')
    );
  }

  return scopedRoleCodes.some((code) => PROVIDER_ROLE_CODES.has(code));
}

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
  organizationUnitAssignments: {
    include: {
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

function getTenantDisplayName(
  tenant:
    | {
        name: string;
        brandingConfig?: unknown;
        branding?: {
          displayName: string | null;
          primaryColor: string | null;
          secondaryColor: string | null;
          logoUrl: string | null;
          faviconUrl: string | null;
        } | null;
      }
    | null
) {
  if (!tenant) {
    return 'Platform';
  }

  const branding = buildSessionBrandingConfig(
    tenant.brandingConfig,
    tenant.branding ?? null
  ) as { displayName?: unknown };

  return typeof branding.displayName === 'string' && branding.displayName.trim().length > 0
    ? branding.displayName.trim()
    : tenant.name;
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

function getActiveMemberships(user: UserWithRelations) {
  return user.memberships.filter((membership) => membership.status === 'ACTIVE');
}

function getAvailableTenantSelections(user: UserWithRelations): SessionTenantSelection[] {
  const memberships = getActiveMemberships(user);
  const seenTenantIds = new Set<string>();

  return memberships.flatMap((membership) => {
    if (seenTenantIds.has(membership.tenantId)) {
      return [];
    }

    seenTenantIds.add(membership.tenantId);
    return [
      {
        id: membership.tenant.id,
        name: membership.tenant.name,
        tenantTypeCode: membership.tenant.tenantTypeCode,
        isDefault: membership.isDefault
      }
    ];
  });
}

function getEffectiveTenant(
  user: UserWithRelations,
  requestedTenantId?: string | null
) {
  const normalizedRequestedTenantId = requestedTenantId?.trim() || null;
  const activeMemberships = getActiveMemberships(user);

  if (normalizedRequestedTenantId) {
    const matchingMembership = activeMemberships.find(
      (membership) => membership.tenantId === normalizedRequestedTenantId
    );

    if (matchingMembership) {
      return matchingMembership.tenant;
    }

    if (user.tenant?.id === normalizedRequestedTenantId) {
      return user.tenant;
    }

    return null;
  }

  return (
    activeMemberships.find((membership) => membership.isDefault)?.tenant ??
    activeMemberships[0]?.tenant ??
    user.tenant ??
    null
  );
}

function getAvailableOrganizationUnitSelections(
  user: UserWithRelations,
  tenantId: string | null | undefined
): SessionOrganizationUnitSelection[] {
  if (!tenantId) {
    return [];
  }

  const assignments = user.organizationUnitAssignments
    .filter((assignment) => assignment.tenantId === tenantId)
    .map((assignment) => ({
      id: assignment.id,
      tenantId: assignment.tenantId,
      isDefault: assignment.isDefault,
      organizationUnit: {
        id: assignment.organizationUnit.id,
        name: assignment.organizationUnit.name,
        type: assignment.organizationUnit.type
      }
    }));

  if (assignments.length > 0) {
    return assignments;
  }

  return user.memberships
    .filter(
      (membership) =>
        membership.tenantId === tenantId &&
        membership.status === 'ACTIVE' &&
        membership.organizationUnit !== null
    )
    .map((membership) => ({
      id: membership.id,
      tenantId: membership.tenantId,
      isDefault: membership.isDefault,
      organizationUnit: {
        id: membership.organizationUnit!.id,
        name: membership.organizationUnit!.name,
        type: membership.organizationUnit!.type
      }
    }));
}

function getScopedRoleAssignments(user: UserWithRelations) {
  const effectiveTenant = getEffectiveTenant(user);

  return getScopedRoleAssignmentsForTenant(user, effectiveTenant?.id);
}

function getScopedRoleAssignmentsForTenant(
  user: UserWithRelations,
  tenantId: string | null | undefined
) {
  const normalizedTenantId = tenantId?.trim() || null;

  return user.roles.filter((assignment) =>
    normalizedTenantId
      ? assignment.tenantId === normalizedTenantId || assignment.tenantId === null
      : assignment.tenantId === null
  );
}

function getLandingContextForUser(
  user: UserWithRelations,
  requestedTenantId?: string | null
): LandingContext {
  const effectiveTenant = getEffectiveTenant(user, requestedTenantId);
  const scopedAssignments = getScopedRoleAssignmentsForTenant(user, effectiveTenant?.id);
  const scopedRoleCodes = scopedAssignments.map(({ role }) => role.code);

  if (scopedAssignments.some(({ role }) => role.isPlatformRole || role.code === 'platform_admin')) {
    return 'platform_admin';
  }

  if (
    scopedRoleCodes.includes('tenant_admin') ||
    getDefaultMembership(user)?.isTenantAdmin === true
  ) {
    return 'tenant_admin';
  }

  if (isProviderExperienceTenantContextForTenant(user, effectiveTenant?.id)) {
    return 'provider';
  }

  const tenantTypeCode = normalizeTenantTypeCode(
    effectiveTenant?.tenantTypeCode ?? user.tenant?.tenantTypeCode ?? null
  );

  if (scopedRoleCodes.includes('employer_group_admin')) {
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

function getPrimaryPersonaCode(
  landingContext: LandingContext,
  scopedRoleCodes: string[]
) {
  if (landingContext === 'platform_admin') {
    return 'platform_admin';
  }

  if (landingContext === 'tenant_admin') {
    return 'tenant_admin';
  }

  const providerPersona = scopedRoleCodes.find((code) =>
    PROVIDER_ROLE_CODES.has(code)
  );

  if (providerPersona) {
    return providerPersona;
  }

  return scopedRoleCodes[0] ?? landingContext;
}

function getAdminPersonaLabel(user: UserWithRelations) {
  const scopedAssignments = getScopedRoleAssignments(user);

  if (
    scopedAssignments.some(({ role }) => role.isPlatformRole || role.code === 'platform_admin')
  ) {
    return {
      key: 'platform_admin',
      label: 'Platform Admin'
    };
  }

  return {
    key: 'tenant_admin',
    label: 'Tenant Admin'
  };
}

function getPayerPersonaLabel(user: UserWithRelations) {
  const scopedAssignments = getScopedRoleAssignments(user);
  const scopedRoleCodes = scopedAssignments.map(({ role }) => role.code);

  if (scopedRoleCodes.includes('member')) {
    return { key: 'member', label: 'Member' };
  }

  if (scopedRoleCodes.includes('employer_group_admin')) {
    return { key: 'employer_group_admin', label: 'Employer' };
  }

  const brokerRole = scopedRoleCodes.find((code) => BROKER_ROLE_CODES.has(code));
  if (brokerRole) {
    return { key: brokerRole, label: 'Broker' };
  }

  const providerRole = scopedRoleCodes.find((code) => PAYER_PROVIDER_ROLE_CODES.has(code));
  if (providerRole) {
    return { key: providerRole, label: 'Payer Provider' };
  }

  const nonAdminRole = scopedRoleCodes.find(
    (code) => code !== 'tenant_admin' && code !== 'platform_admin'
  );

  return {
    key: nonAdminRole ?? 'payer_user',
    label: humanizeRoleCode(nonAdminRole ?? 'payer_user')
  };
}

function getProviderPersonaLabel(user: UserWithRelations) {
  const scopedAssignments = getScopedRoleAssignments(user);
  const scopedRoleCodes = scopedAssignments.map(({ role }) => role.code);

  if (scopedRoleCodes.includes('clinic_manager')) {
    return { key: 'clinic_manager', label: 'Office Manager' };
  }

  if (scopedRoleCodes.includes('tenant_admin')) {
    return { key: 'tenant_admin', label: 'Practice Manager' };
  }

  if (scopedRoleCodes.includes('authorization_specialist')) {
    return { key: 'authorization_specialist', label: 'Authorization Specialist' };
  }

  if (scopedRoleCodes.includes('billing_specialist')) {
    return { key: 'billing_specialist', label: 'Billing Specialist' };
  }

  if (scopedRoleCodes.includes('eligibility_coordinator')) {
    return { key: 'eligibility_coordinator', label: 'Eligibility Coordinator' };
  }

  if (scopedRoleCodes.includes('provider_support')) {
    return { key: 'provider_support', label: 'Provider Support' };
  }

  if (scopedRoleCodes.includes('provider')) {
    return { key: 'provider', label: 'Clinician' };
  }

  const nonAdminRole = scopedRoleCodes.find((code) => code !== 'platform_admin');
  return {
    key: nonAdminRole ?? 'provider',
    label: nonAdminRole ? humanizeRoleCode(nonAdminRole) : 'Clinic Team'
  };
}

function buildAutoLoginCandidatesForUser(user: UserWithRelations): AutoLoginCandidate[] {
  if (user.status !== 'ACTIVE' || !user.isActive) {
    return [];
  }

  const activeTenant = getEffectiveTenant(user);
  const tenantTypeCode = normalizeTenantTypeCode(
    activeTenant?.tenantTypeCode ?? user.tenant?.tenantTypeCode ?? null
  );
  const userLabel = getUserDisplayLabel(user);
  const baseUser = {
    id: user.id,
    label: userLabel,
    email: user.email
  };

  const candidates: AutoLoginCandidate[] = [];
  const isPlatformAdminUser = getScopedRoleAssignments(user).some(
    ({ role }) => role.isPlatformRole || role.code === 'platform_admin'
  );
  const isTenantAdminUser =
    getScopedRoleAssignments(user).some(({ role }) => role.code === 'tenant_admin') ||
    getDefaultMembership(user)?.isTenantAdmin === true;

  if (isPlatformAdminUser) {
    const persona = getAdminPersonaLabel(user);
    candidates.push({
      audience: 'admin',
      companyKey: 'platform',
      tenantId: null,
      tenantTypeCode: 'PLATFORM',
      companyName: 'averra',
      personaKey: persona.key,
      personaLabel: persona.label,
      user: {
        ...baseUser,
        persona: persona.key,
        personaLabel: persona.label
      }
    });
  }

  if (isTenantAdminUser && activeTenant) {
    const persona = getAdminPersonaLabel(user);
    candidates.push({
      audience: 'admin',
      companyKey: activeTenant.id,
      tenantId: activeTenant.id,
      tenantTypeCode: tenantTypeCode ?? 'UNKNOWN',
      companyName: getTenantDisplayName(activeTenant),
      personaKey: persona.key,
      personaLabel: persona.label,
      user: {
        ...baseUser,
        persona: persona.key,
        personaLabel: persona.label
      }
    });
  }

  if (tenantTypeCode === 'PAYER' && activeTenant) {
    const persona = getPayerPersonaLabel(user);
    candidates.push({
      audience: 'payer',
      companyKey: activeTenant.id,
      tenantId: activeTenant.id,
      tenantTypeCode,
      companyName: getTenantDisplayName(activeTenant),
      personaKey: persona.key,
      personaLabel: persona.label,
      user: {
        ...baseUser,
        persona: persona.key,
        personaLabel: persona.label
      }
    });
  }

  if (isProviderClassTenantTypeCode(tenantTypeCode) && activeTenant) {
    const persona = getProviderPersonaLabel(user);
    candidates.push({
      audience: 'provider',
      companyKey: activeTenant.id,
      tenantId: activeTenant.id,
      tenantTypeCode: tenantTypeCode ?? 'CLINIC',
      companyName: getTenantDisplayName(activeTenant),
      personaKey: persona.key,
      personaLabel: persona.label,
      user: {
        ...baseUser,
        persona: persona.key,
        personaLabel: persona.label
      }
    });
  }

  return candidates;
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

function buildAuthenticatedSessionResult(
  user: UserWithRelations,
  options: {
    tenantId?: string | null;
    activeOrganizationUnitId?: string | null;
  } = {}
) {
  const activeTenant = getEffectiveTenant(user, options.tenantId);
  const landingContext = getLandingContextForUser(user, activeTenant?.id);
  const sessionType = getSessionTypeForLandingContext(landingContext);
  const sessionTenantId =
    sessionType === 'platform_admin'
      ? null
      : requireTenantForSession(sessionType, activeTenant);
  const scopedAssignments = getScopedRoleAssignmentsForTenant(user, activeTenant?.id);
  const scopedRoleCodes = scopedAssignments.map(({ role }) => role.code);
  const activeOrganizationUnits = getAvailableOrganizationUnitSelections(
    user,
    activeTenant?.id
  );
  const activeOrganizationUnit =
    activeOrganizationUnits.find(
      (assignment) =>
        assignment.organizationUnit.id === options.activeOrganizationUnitId
    ) ??
    activeOrganizationUnits.find((assignment) => assignment.isDefault) ??
    activeOrganizationUnits[0] ??
    null;
  const activePersonaCode = getPrimaryPersonaCode(
    landingContext,
    scopedRoleCodes
  );
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
      sessionType,
      activeOrganizationUnitId: activeOrganizationUnit?.organizationUnit.id,
      activePersonaCode
    }),
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      landingContext,
      session: {
        personaType: activePersonaCode,
        type: sessionType,
        tenantId: sessionTenantId,
        roles: scopedRoleCodes,
        permissions,
        activeOrganizationUnit:
          activeOrganizationUnit?.organizationUnit ?? null,
        availableOrganizationUnits: activeOrganizationUnits.map(
          (assignment) => assignment.organizationUnit
        )
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

export async function listAutoLoginCatalog() {
  const users = await prisma.user.findMany({
    where: {
      status: 'ACTIVE',
      isActive: true
    },
    include: userSessionInclude,
    orderBy: [
      { firstName: 'asc' },
      { lastName: 'asc' },
      { email: 'asc' }
    ]
  });

  const grouped = new Map<
    AutoLoginAudience,
    Map<
      string,
      {
        tenantId: string | null;
        tenantTypeCode: string;
        name: string;
        personas: Map<
          string,
          {
            label: string;
            users: Map<string, AutoLoginCatalogUser>;
          }
        >;
      }
    >
  >();

  for (const user of users) {
    const candidates = buildAutoLoginCandidatesForUser(user);

    for (const candidate of candidates) {
      if (!grouped.has(candidate.audience)) {
        grouped.set(candidate.audience, new Map());
      }

      const audienceCompanies = grouped.get(candidate.audience)!;
      if (!audienceCompanies.has(candidate.companyKey)) {
        audienceCompanies.set(candidate.companyKey, {
          tenantId: candidate.tenantId,
          tenantTypeCode: candidate.tenantTypeCode,
          name: candidate.companyName,
          personas: new Map()
        });
      }

      const company = audienceCompanies.get(candidate.companyKey)!;
      if (!company.personas.has(candidate.personaKey)) {
        company.personas.set(candidate.personaKey, {
          label: candidate.personaLabel,
          users: new Map()
        });
      }

      company.personas.get(candidate.personaKey)!.users.set(candidate.user.id, candidate.user);
    }
  }

  const audienceOrder: AutoLoginAudience[] = ['admin', 'payer', 'provider'];
  const audienceLabels: Record<AutoLoginAudience, string> = {
    admin: 'Admin',
    payer: 'Payer',
    provider: 'Clinic'
  };

  return audienceOrder.map((audienceKey) => {
    const companies = Array.from(grouped.get(audienceKey)?.entries() ?? [])
      .map(([key, company]) => ({
        key,
        tenantId: company.tenantId,
        tenantTypeCode: company.tenantTypeCode,
        name: company.name,
        personas: Array.from(company.personas.entries())
          .map(([personaKey, persona]) => ({
            key: personaKey,
            label: persona.label,
            users: Array.from(persona.users.values()).sort((left, right) =>
              left.label.localeCompare(right.label)
            )
          }))
          .sort((left, right) => left.label.localeCompare(right.label))
      }))
      .sort((left, right) => left.name.localeCompare(right.name));

    return {
      key: audienceKey,
      label: audienceLabels[audienceKey],
      companies
    };
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

function buildOrganizationUnitSelectionRequiredResult(user: UserWithRelations) {
  const activeTenant = getEffectiveTenant(user);
  const scopedAssignments = getScopedRoleAssignmentsForTenant(user, activeTenant?.id);
  const scopedRoleCodes = scopedAssignments.map(({ role }) => role.code);
  const landingContext = getLandingContextForUser(user, activeTenant?.id);
  const availableOrganizationUnits = getAvailableOrganizationUnitSelections(
    user,
    activeTenant?.id
  );

  return {
    organizationUnitSelectionRequired: true as const,
    landingContext,
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      roles: scopedRoleCodes,
      personaCode: getPrimaryPersonaCode(landingContext, scopedRoleCodes),
      tenant: activeTenant
        ? {
            id: activeTenant.id,
            name: activeTenant.name,
            tenantTypeCode: activeTenant.tenantTypeCode
          }
        : null,
      availableOrganizationUnits: availableOrganizationUnits.map(
        (assignment) => assignment.organizationUnit
      )
    }
  };
}

function buildTenantSelectionRequiredResult(user: UserWithRelations) {
  const availableTenants = getAvailableTenantSelections(user);

  return {
    tenantSelectionRequired: true as const,
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      availableTenants
    }
  };
}

export async function login(
  { email, password, tenantId, organizationUnitId }: LoginInput,
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
  const availableTenants = getAvailableTenantSelections(user);
  const normalizedTenantId = tenantId?.trim() || null;

  if (
    availableTenants.length > 1 &&
    !normalizedTenantId
  ) {
    return buildTenantSelectionRequiredResult(user);
  }

  if (
    normalizedTenantId &&
    !availableTenants.some((tenant) => tenant.id === normalizedTenantId)
  ) {
    throw new SessionIntegrityError(
      'The selected tenant is not available for this user.',
      403
    );
  }

  const activeTenant = getEffectiveTenant(user, normalizedTenantId);
  const landingContext = getLandingContextForUser(user, activeTenant?.id);
  const availableOrganizationUnits = getAvailableOrganizationUnitSelections(
    user,
    activeTenant?.id
  );

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

  if (
    landingContext === 'provider' &&
    availableOrganizationUnits.length > 1 &&
    !organizationUnitId?.trim()
  ) {
    return buildOrganizationUnitSelectionRequiredResult(user);
  }

  if (organizationUnitId?.trim()) {
    const requestedOrganizationUnitId = organizationUnitId.trim();
    const matchingOrganizationUnit = availableOrganizationUnits.find(
      (assignment) =>
        assignment.organizationUnit.id === requestedOrganizationUnitId
    );

    if (!matchingOrganizationUnit) {
      throw new SessionIntegrityError(
        'The selected Organization Unit is not available for this Provider session.',
        403
      );
    }
  }

  const updatedUser = await recordSuccessfulLogin(user.id);
  const sessionResult = buildAuthenticatedSessionResult(updatedUser, {
    tenantId: activeTenant?.id ?? null,
    activeOrganizationUnitId: organizationUnitId?.trim() ?? null
  });
  const resolvedLandingContext = sessionResult.landingContext;

  if (
    options.requiredLandingContext &&
    resolvedLandingContext !== options.requiredLandingContext
  ) {
    return null;
  }

  const resolvedActiveTenant = getEffectiveTenant(updatedUser);

  if (resolvedActiveTenant) {
    await logAuthenticationEvent({
      tenantId: resolvedActiveTenant.id,
      actorUserId: updatedUser.id,
      action: 'auth.login.success',
      resourceType: 'user',
      resourceId: updatedUser.id,
      beforeState: {
        lastLoginAt: user.lastLoginAt?.toISOString() ?? null
      } satisfies Prisma.InputJsonValue,
      afterState: {
        lastLoginAt: updatedUser.lastLoginAt?.toISOString() ?? null,
        sessionType: sessionResult.sessionType,
        activeOrganizationUnitId:
          sessionResult.user.session.type === 'end_user'
            ? sessionResult.user.session.activeOrganizationUnit?.id ?? null
            : null,
        personaCode: sessionResult.user.session.personaType
      } satisfies Prisma.InputJsonValue,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent
    });
  }

  return sessionResult;
}

export async function autoLoginByUserId(
  input: {
    userId: string;
    audience?: AutoLoginAudience;
    tenantId?: string | null;
    persona?: string;
  },
  context: LoginContext = {}
) {
  const user = await getUserWithRelationsById(input.userId);

  if (!user || user.status !== 'ACTIVE' || !user.isActive) {
    return null;
  }

  const candidates = buildAutoLoginCandidatesForUser(user);
  const matchingCandidate = candidates.find((candidate) => {
    if (input.audience && candidate.audience !== input.audience) {
      return false;
    }

    if (
      typeof input.tenantId === 'string' &&
      input.tenantId.trim() &&
      candidate.tenantId !== input.tenantId.trim()
    ) {
      return false;
    }

    if (input.persona && candidate.personaKey !== input.persona) {
      return false;
    }

    return true;
  });

  if (!matchingCandidate) {
    return null;
  }

  const updatedUser = await recordSuccessfulLogin(user.id);
  const sessionResult = buildAuthenticatedSessionResult(updatedUser, {
    tenantId: matchingCandidate.tenantId ?? null
  });
  const resolvedActiveTenant = getEffectiveTenant(updatedUser);

  if (resolvedActiveTenant) {
    await logAuthenticationEvent({
      tenantId: resolvedActiveTenant.id,
      actorUserId: updatedUser.id,
      action: 'auth.login.success',
      resourceType: 'user',
      resourceId: updatedUser.id,
      beforeState: {
        lastLoginAt: user.lastLoginAt?.toISOString() ?? null
      } satisfies Prisma.InputJsonValue,
      afterState: {
        lastLoginAt: updatedUser.lastLoginAt?.toISOString() ?? null,
        sessionType: sessionResult.sessionType,
        activeOrganizationUnitId:
          sessionResult.user.session.type === 'end_user'
            ? sessionResult.user.session.activeOrganizationUnit?.id ?? null
            : null,
        personaCode: sessionResult.user.session.personaType,
        autoLogin: true
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
