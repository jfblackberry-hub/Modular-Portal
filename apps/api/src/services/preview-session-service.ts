import { randomUUID } from 'node:crypto';

import type { Prisma } from '@payer-portal/database';
import { prisma } from '@payer-portal/database';
import { logAuditEvent } from '@payer-portal/server';

import { createAccessToken } from './access-token-service';

export type PreviewPortalType =
  | 'member'
  | 'provider'
  | 'broker'
  | 'employer'
  | 'tenant_admin';

export type PreviewSessionMode = 'READ_ONLY' | 'FUNCTIONAL';

type AuditContext = {
  actorUserId: string;
  ipAddress?: string;
  userAgent?: string;
};

type PreviewRouteHistoryEntry = {
  route: string;
  occurredAt: string;
  type:
    | 'route_changed'
    | 'route_blocked'
    | 'workflow_action_invoked'
    | 'write_attempted'
    | 'write_completed'
    | 'entitlement_mismatch'
    | 'failed_navigation_attempt';
  fromRoute?: string;
  statusCode?: number;
  detail?: string;
};

type CreatePreviewSessionInput = {
  tenantId: string;
  subTenantId?: string;
  portalType: PreviewPortalType;
  persona: string;
  mode: PreviewSessionMode;
};

type PersonaCandidate = {
  userId: string;
  label: string;
  portalType: PreviewPortalType;
  persona: string;
  roleCode: string;
  tenantId: string;
};

const portalRoleCodes: Record<PreviewPortalType, string[]> = {
  member: ['member'],
  provider: ['provider'],
  broker: ['broker', 'broker_admin', 'broker_staff', 'broker_readonly', 'broker_read_only'],
  employer: ['employer_group_admin'],
  tenant_admin: ['tenant_admin']
};

const MAX_ROUTE_HISTORY = 40;

function readRouteHistory(history: Prisma.JsonValue | null | undefined) {
  if (!Array.isArray(history)) {
    return [] as PreviewRouteHistoryEntry[];
  }

  return history.filter((entry): entry is PreviewRouteHistoryEntry => {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
      return false;
    }

    return typeof entry.route === 'string' && typeof entry.occurredAt === 'string';
  });
}

function normalizePreviewRoute(route: string | undefined | null) {
  const value = route?.trim();

  if (!value) {
    return null;
  }

  if (value.startsWith('/preview/')) {
    const [, , , ...rest] = value.split('/');
    return `/${rest.join('/')}` || '/';
  }

  return value.startsWith('/') ? value : `/${value}`;
}

function buildSessionRecord(session: {
  id: string;
  adminUserId: string;
  adminUser: { email: string };
  tenantId: string;
  tenant: { name: string };
  subTenantId: string | null;
  portalType: string;
  persona: string;
  mode: PreviewSessionMode;
  createdAt: Date;
  expiresAt: Date;
  currentRoute: string | null;
  currentRouteUpdatedAt: Date | null;
  routeHistory: Prisma.JsonValue;
  launchToken: string;
  targetUser: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
}) {
  return {
    sessionId: session.id,
    adminUserId: session.adminUserId,
    adminUserEmail: session.adminUser.email,
    tenantId: session.tenantId,
    tenantName: session.tenant.name,
    subTenantId: session.subTenantId,
    portalType: session.portalType,
    persona: session.persona,
    mode: session.mode,
    createdAt: session.createdAt,
    expiresAt: session.expiresAt,
    currentRoute: session.currentRoute,
    currentRouteUpdatedAt: session.currentRouteUpdatedAt,
    routeHistory: readRouteHistory(session.routeHistory),
    targetUser: {
      id: session.targetUser.id,
      email: session.targetUser.email,
      firstName: session.targetUser.firstName,
      lastName: session.targetUser.lastName
    },
    launchUrl: `/api/admin-preview/start?token=${encodeURIComponent(session.launchToken)}`
  };
}

function getPersonaCandidatesForTenant(
  users: Array<{
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    roles: Array<{
      role: {
        code: string;
      };
    }>;
    memberships: Array<{
      tenantId: string;
    }>;
  }>,
  tenantId: string
) {
  const candidates: PersonaCandidate[] = [];

  for (const user of users) {
    const roleCodes = user.roles.map(({ role }) => role.code);
    if (!user.memberships.some((membership) => membership.tenantId === tenantId)) {
      continue;
    }

    for (const [portalType, supportedRoleCodes] of Object.entries(portalRoleCodes) as Array<
      [PreviewPortalType, string[]]
    >) {
      const matchedRoleCode = supportedRoleCodes.find((code) => roleCodes.includes(code));
      if (!matchedRoleCode) {
        continue;
      }

      candidates.push({
        userId: user.id,
        label: `${user.firstName} ${user.lastName}`.trim() || user.email,
        portalType,
        persona: matchedRoleCode,
        roleCode: matchedRoleCode,
        tenantId
      });
    }
  }

  return candidates;
}

function getPreviewHomePath(portalType: PreviewPortalType) {
  switch (portalType) {
    case 'provider':
      return '/provider/dashboard';
    case 'broker':
      return '/broker';
    case 'employer':
      return '/employer';
    case 'tenant_admin':
      return '/tenant-admin/dashboard';
    case 'member':
    default:
      return '/dashboard';
  }
}

function buildPreviewUserSnapshot(
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    tenant: {
      id: string;
      name: string;
      brandingConfig: unknown;
      branding: {
        displayName: string | null;
        primaryColor: string | null;
        secondaryColor: string | null;
        logoUrl: string | null;
        faviconUrl: string | null;
      } | null;
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
  },
  previewSession: {
    id: string;
    adminUserEmail: string;
    portalType: PreviewPortalType;
    persona: string;
    mode: PreviewSessionMode;
    createdAt: Date;
    expiresAt: Date;
  }
) {
  const roles = user.roles.map(({ role }) => role.code);
  const permissions = Array.from(
    new Set(
      user.roles.flatMap(({ role }) =>
        role.permissions.map(({ permission }) => permission.code)
      )
    )
  );

  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    landingContext: previewSession.portalType,
    session: {
      type: 'end_user' as const,
      tenantId: user.tenant.id,
      roles,
      permissions
    },
    tenant: {
      id: user.tenant.id,
      name: user.tenant.name,
      brandingConfig:
        typeof user.tenant.brandingConfig === 'object' &&
        user.tenant.brandingConfig !== null &&
        !Array.isArray(user.tenant.brandingConfig)
          ? {
              ...(user.tenant.brandingConfig as Record<string, unknown>),
              displayName:
                user.tenant.branding?.displayName ?? user.tenant.name,
              primaryColor: user.tenant.branding?.primaryColor ?? undefined,
              secondaryColor: user.tenant.branding?.secondaryColor ?? undefined,
              logoUrl: user.tenant.branding?.logoUrl ?? undefined,
              faviconUrl: user.tenant.branding?.faviconUrl ?? undefined
            }
          : {
              displayName: user.tenant.branding?.displayName ?? user.tenant.name,
              primaryColor: user.tenant.branding?.primaryColor ?? undefined,
              secondaryColor: user.tenant.branding?.secondaryColor ?? undefined,
              logoUrl: user.tenant.branding?.logoUrl ?? undefined,
              faviconUrl: user.tenant.branding?.faviconUrl ?? undefined
            }
    },
    roles,
    permissions,
    previewSession: {
      id: previewSession.id,
      portalType: previewSession.portalType,
      persona: previewSession.persona,
      mode: previewSession.mode,
      adminUserEmail: previewSession.adminUserEmail,
      createdAt: previewSession.createdAt.toISOString(),
      expiresAt: previewSession.expiresAt.toISOString(),
      homePath: getPreviewHomePath(previewSession.portalType)
    }
  };
}

export async function listPreviewSessionCatalog() {
  const [tenants, users] = await Promise.all([
    prisma.tenant.findMany({
      where: {
        isActive: true
      },
      orderBy: {
        name: 'asc'
      },
      select: {
        id: true,
        name: true,
        slug: true
      }
    }),
    prisma.user.findMany({
      where: {
        isActive: true
      },
      include: {
        memberships: {
          select: {
            tenantId: true
          }
        },
        roles: {
          include: {
            role: {
              select: {
                code: true
              }
            }
          }
        }
      }
    })
  ]);

  return {
    tenants: tenants.map((tenant) => ({
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      personas: getPersonaCandidatesForTenant(users, tenant.id)
    }))
  };
}

export async function listPreviewSessions(adminUserId: string) {
  const sessions = await prisma.previewSession.findMany({
    where: {
      adminUserId,
      endedAt: null,
      expiresAt: {
        gt: new Date()
      }
    },
    include: {
      adminUser: {
        select: {
          email: true
        }
      },
      tenant: {
        select: {
          id: true,
          name: true
        }
      },
      targetUser: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  return sessions.map((session) => buildSessionRecord(session));
}

export async function createPreviewSession(
  input: CreatePreviewSessionInput,
  context: AuditContext
) {
  const tenant = await prisma.tenant.findUnique({
    where: { id: input.tenantId },
    select: {
      id: true,
      name: true
    }
  });

  if (!tenant) {
    throw new Error('Tenant not found');
  }

  const candidateUsers = await prisma.user.findMany({
    where: {
      isActive: true,
      memberships: {
        some: {
          tenantId: input.tenantId
        }
      },
      roles: {
        some: {
          role: {
            code: {
              in: portalRoleCodes[input.portalType]
            }
          }
        }
      }
    },
    include: {
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
      },
      tenant: {
        include: {
          branding: true
        }
      },
      memberships: {
        select: {
          tenantId: true
        }
      }
    }
  });

  const matchingUser = candidateUsers.find((user) =>
    user.roles.some(({ role }) => role.code === input.persona)
  );

  if (!matchingUser || !matchingUser.tenant) {
    throw new Error('No active user is available for that tenant persona.');
  }

  const launchToken = randomUUID();
  const createdAt = new Date();
  const expiresAt = new Date(createdAt.getTime() + 1000 * 60 * 60);

  const session = await prisma.previewSession.create({
    data: {
      adminUserId: context.actorUserId,
      tenantId: input.tenantId,
      targetUserId: matchingUser.id,
      subTenantId: input.subTenantId?.trim() || null,
      portalType: input.portalType,
      persona: input.persona,
      mode: input.mode,
      launchToken,
      createdAt,
      expiresAt,
      currentRoute: getPreviewHomePath(input.portalType),
      currentRouteUpdatedAt: createdAt,
      routeHistory: [
        {
          route: getPreviewHomePath(input.portalType),
          occurredAt: createdAt.toISOString(),
          type: 'route_changed'
        }
      ]
    },
    include: {
      adminUser: {
        select: {
          email: true
        }
      },
      tenant: {
        select: {
          name: true
        }
      },
      targetUser: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true
        }
      }
    }
  });

  await logAuditEvent({
    tenantId: input.tenantId,
    actorUserId: context.actorUserId,
    action: 'preview.session.created',
    entityType: 'PreviewSession',
    entityId: session.id,
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
    metadata: {
      portalType: input.portalType,
      persona: input.persona,
      mode: input.mode,
      targetUserId: session.targetUser.id
    }
  });

  return buildSessionRecord(session);
}

export async function duplicatePreviewSession(
  sessionId: string,
  context: AuditContext
) {
  const session = await prisma.previewSession.findUnique({
    where: {
      id: sessionId
    }
  });

  if (!session || session.endedAt) {
    throw new Error('Preview session not found');
  }

  return createPreviewSession(
    {
      tenantId: session.tenantId,
      subTenantId: session.subTenantId ?? undefined,
      portalType: session.portalType as PreviewPortalType,
      persona: session.persona,
      mode: session.mode
    },
    context
  );
}

export async function endPreviewSession(
  sessionId: string,
  context: AuditContext
) {
  const session = await prisma.previewSession.findUnique({
    where: {
      id: sessionId
    }
  });

  if (!session) {
    throw new Error('Preview session not found');
  }

  const ended = await prisma.previewSession.update({
    where: {
      id: sessionId
    },
    data: {
      endedAt: new Date()
    }
  });

  await logAuditEvent({
    tenantId: ended.tenantId,
    actorUserId: context.actorUserId,
    action: 'preview.session.ended',
    entityType: 'PreviewSession',
    entityId: ended.id,
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
    metadata: {
      portalType: ended.portalType,
      persona: ended.persona,
      mode: ended.mode
    }
  });

  return {
    ended: true
  };
}

export async function resolvePreviewLaunch(launchToken: string) {
  const session = await prisma.previewSession.findUnique({
    where: {
      launchToken
    },
    include: {
      adminUser: {
        select: {
          email: true
        }
      },
      targetUser: {
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
      }
    }
  });

  if (!session || session.endedAt || session.expiresAt.getTime() <= Date.now()) {
    throw new Error('Preview session expired or unavailable');
  }

  if (!session.targetUser.tenant) {
    throw new Error('Preview session target user is missing an active tenant.');
  }

  await prisma.previewSession.update({
    where: {
      id: session.id
    },
    data: {
      lastAccessedAt: new Date()
    }
  });

  await logAuditEvent({
    tenantId: session.tenantId,
    actorUserId: session.adminUserId,
    action: 'preview.session.launched',
    entityType: 'PreviewSession',
    entityId: session.id,
    metadata: {
      portalType: session.portalType,
      persona: session.persona,
      mode: session.mode
    }
  });

  const accessToken = createAccessToken({
    userId: session.targetUser.id,
    email: session.targetUser.email,
    tenantId: session.targetUser.tenant.id,
    sessionType: 'end_user',
    previewSessionId: session.id,
    previewMode: session.mode
  });

  return {
    session: {
      sessionId: session.id,
      tenantId: session.tenantId,
      tenantName: session.targetUser.tenant.name,
      subTenantId: session.subTenantId,
      portalType: session.portalType,
      persona: session.persona,
      mode: session.mode,
      createdAt: session.createdAt,
      expiresAt: session.expiresAt,
      currentRoute: session.currentRoute,
      adminUserEmail: session.adminUser.email,
      launchPath: `/preview/${session.id}`
    },
    accessToken,
      user: buildPreviewUserSnapshot(session.targetUser as typeof session.targetUser & {
        tenant: NonNullable<typeof session.targetUser.tenant>;
      }, {
      id: session.id,
      adminUserEmail: session.adminUser.email,
      portalType: session.portalType as PreviewPortalType,
      persona: session.persona,
      mode: session.mode,
      createdAt: session.createdAt,
      expiresAt: session.expiresAt
    })
  };
}

export async function getPreviewSessionStateForAdmin(
  sessionId: string,
  adminUserId: string
) {
  const session = await prisma.previewSession.findFirst({
    where: {
      id: sessionId,
      adminUserId
    },
    include: {
      adminUser: {
        select: {
          email: true
        }
      },
      tenant: {
        select: {
          name: true
        }
      },
      targetUser: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true
        }
      }
    }
  });

  if (!session) {
    throw new Error('Preview session not found');
  }

  return buildSessionRecord(session);
}

export async function getPreviewSessionStateForCurrentUser(input: {
  previewSessionId: string;
  userId: string;
}) {
  const session = await prisma.previewSession.findFirst({
    where: {
      id: input.previewSessionId,
      targetUserId: input.userId,
      endedAt: null
    },
    select: {
      id: true,
      portalType: true,
      persona: true,
      mode: true,
      createdAt: true,
      expiresAt: true,
      currentRoute: true,
      currentRouteUpdatedAt: true,
      routeHistory: true
    }
  });

  if (!session) {
    throw new Error('Preview session not found');
  }

  return {
    sessionId: session.id,
    portalType: session.portalType,
    persona: session.persona,
    mode: session.mode,
    createdAt: session.createdAt,
    expiresAt: session.expiresAt,
    currentRoute: session.currentRoute,
    currentRouteUpdatedAt: session.currentRouteUpdatedAt,
    routeHistory: readRouteHistory(session.routeHistory)
  };
}

export async function recordPreviewSessionEvent(input: {
  previewSessionId: string;
  actorUserId: string;
  tenantId: string;
  type:
    | 'route_changed'
    | 'route_blocked'
    | 'workflow_action_invoked'
    | 'write_attempted'
    | 'write_completed'
    | 'entitlement_mismatch'
    | 'failed_navigation_attempt';
  route: string;
  fromRoute?: string;
  detail?: string;
  statusCode?: number;
  ipAddress?: string;
  userAgent?: string;
}) {
  const session = await prisma.previewSession.findUnique({
    where: {
      id: input.previewSessionId
    },
    select: {
      id: true,
      routeHistory: true
    }
  });

  if (!session) {
    throw new Error('Preview session not found');
  }

  const occurredAt = new Date();
  const normalizedRoute = normalizePreviewRoute(input.route);
  const normalizedFromRoute = normalizePreviewRoute(input.fromRoute);
  const nextHistoryEntry: PreviewRouteHistoryEntry = {
    route: normalizedRoute ?? '/',
    fromRoute: normalizedFromRoute ?? undefined,
    occurredAt: occurredAt.toISOString(),
    type: input.type,
    statusCode: input.statusCode,
    detail: input.detail
  };
  const nextHistory = [...readRouteHistory(session.routeHistory), nextHistoryEntry].slice(
    -MAX_ROUTE_HISTORY
  );

  await prisma.previewSession.update({
    where: {
      id: input.previewSessionId
    },
    data: {
      currentRoute: normalizedRoute,
      currentRouteUpdatedAt: occurredAt,
      routeHistory: nextHistory as unknown as Prisma.InputJsonValue
    }
  });

  const auditActionByType: Record<typeof input.type, string> = {
    route_changed: 'preview.session.route.changed',
    route_blocked: 'preview.session.route.blocked',
    workflow_action_invoked: 'preview.session.workflow.action.invoked',
    write_attempted: 'preview.session.write.attempted',
    write_completed: 'preview.session.write.completed',
    entitlement_mismatch: 'preview.session.entitlement.mismatch',
    failed_navigation_attempt: 'preview.session.navigation.failed'
  };

  await logAuditEvent({
    tenantId: input.tenantId,
    actorUserId: input.actorUserId,
    action: auditActionByType[input.type],
    entityType: 'PreviewSession',
    entityId: input.previewSessionId,
    metadata: {
      route: normalizedRoute,
      fromRoute: normalizedFromRoute,
      detail: input.detail,
      statusCode: input.statusCode
    },
    ipAddress: input.ipAddress,
    userAgent: input.userAgent
  });
}

export async function logPreviewSessionActivity(input: {
  previewSessionId: string;
  actorUserId: string;
  tenantId: string;
  action: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}) {
  await logAuditEvent({
    tenantId: input.tenantId,
    actorUserId: input.actorUserId,
    action: input.action,
    entityType: 'PreviewSession',
    entityId: input.previewSessionId,
    metadata: input.metadata as Prisma.InputJsonValue | undefined,
    ipAddress: input.ipAddress,
    userAgent: input.userAgent
  });
}
