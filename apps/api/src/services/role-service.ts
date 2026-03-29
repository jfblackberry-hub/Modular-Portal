import { randomUUID } from 'node:crypto';

import type { TenantType, UserLifecycleStatus } from '@payer-portal/database';
import {
  getCompatibleTenantTypeCodes,
  hashPassword,
  normalizeTenantTypeCode,
  normalizeUserLifecycleStatus,
  Prisma,
  prisma,
  syncTenantTypeDefinitions
} from '@payer-portal/database';
import {
  createNotification,
  logAdminAction,
  publishInBackground
} from '@payer-portal/server';

type CreateRoleInput = {
  code: string;
  name: string;
  description?: string;
  permissions: string[];
  tenantTypeCode?: string;
  appliesToAllTenantTypes?: boolean;
  isPlatformRole?: boolean;
};

type CreateUserInput = {
  tenantId?: string;
  roleId?: string | null;
  email: string;
  firstName: string;
  lastName: string;
  isActive?: boolean;
  status?: UserLifecycleStatus | string;
  password?: string;
  organizationUnitId?: string | null;
  organizationUnitIds?: string[] | null;
};

type UpdateUserInput = {
  tenantId?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  isActive?: boolean;
  status?: UserLifecycleStatus | string;
  password?: string;
  organizationUnitId?: string | null;
  organizationUnitIds?: string[] | null;
};

type AuditContext = {
  actorUserId?: string | null;
  ipAddress?: string;
  userAgent?: string;
};

const userWithAccessArgs = Prisma.validator<Prisma.UserDefaultArgs>()({
  include: {
    credential: true,
    tenant: {
      select: {
        id: true,
        name: true,
        tenantTypeCode: true
      }
    },
    memberships: {
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            tenantTypeCode: true
          }
        },
        organizationUnit: {
          select: {
            id: true,
            name: true,
            type: true
          }
        }
      },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }]
    },
    organizationUnitAssignments: {
      include: {
        organizationUnit: {
          select: {
            id: true,
            name: true,
            type: true
          }
        }
      },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }]
    },
    roles: {
      include: {
        tenant: {
          select: {
            id: true,
            name: true
          }
        },
        role: {
          include: {
            permissions: {
              include: {
                permission: true
              }
            }
          }
        }
      },
      orderBy: [{ assignedAt: 'desc' }]
    }
  }
});

function normalizeCode(value: string) {
  return value.trim().toLowerCase();
}

function normalizeRequired(value: string, fieldName: string) {
  const normalized = value.trim();

  if (!normalized) {
    throw new Error(`${fieldName} is required`);
  }

  return normalized;
}

function normalizeOptional(value: string | undefined | null) {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

function normalizeOrganizationUnitIds(
  organizationUnitIds?: string[] | null,
  fallbackOrganizationUnitId?: string | null
) {
  if (organizationUnitIds === null) {
    return [];
  }

  const normalizedIds = (organizationUnitIds ?? [])
    .map((value) => value?.trim())
    .filter((value): value is string => Boolean(value));

  if (normalizedIds.length === 0) {
    const fallback = normalizeOptional(fallbackOrganizationUnitId);
    return fallback ? [fallback] : [];
  }

  return Array.from(new Set(normalizedIds));
}

function resolveLifecycleStatus(input: {
  status?: UserLifecycleStatus | string;
  isActive?: boolean;
}) {
  if (input.status !== undefined) {
    return normalizeUserLifecycleStatus(input.status);
  }

  if (input.isActive === false) {
    return 'DISABLED' as const;
  }

  return 'ACTIVE' as const;
}

function getEffectiveMembership(
  user: UserRecordWithRelations,
  tenantId?: string | null
) {
  if (tenantId) {
    return (
      user.memberships.find(
        (membership) => membership.tenantId === tenantId && membership.status === 'ACTIVE'
      ) ?? null
    );
  }

  return (
    user.memberships.find(
      (membership) => membership.isDefault && membership.status === 'ACTIVE'
    ) ??
    user.memberships.find((membership) => membership.status === 'ACTIVE') ??
    null
  );
}

type UserRecordWithRelations = Prisma.UserGetPayload<typeof userWithAccessArgs>;

function mapUser(user: UserRecordWithRelations) {
  const effectiveMembership = getEffectiveMembership(user, user.tenantId);
  const effectiveTenant = effectiveMembership?.tenant ?? user.tenant ?? null;
  const effectiveRoleAssignments = user.roles.filter((assignment) =>
    effectiveTenant
      ? assignment.tenantId === effectiveTenant.id || assignment.tenantId === null
      : assignment.tenantId === null
  );

  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    isActive: user.isActive,
    status: user.status,
    lastLoginAt: user.lastLoginAt,
    tenant: effectiveTenant
      ? {
          id: effectiveTenant.id,
          name: effectiveTenant.name
        }
      : null,
    memberships: user.memberships.map((membership) => ({
      id: membership.id,
      tenant: membership.tenant,
      tenantTypeCode: membership.tenant.tenantTypeCode,
      isDefault: membership.isDefault,
      isTenantAdmin: membership.isTenantAdmin,
      status: membership.status,
      organizationUnit: membership.organizationUnit
        ? {
            id: membership.organizationUnit.id,
            name: membership.organizationUnit.name,
            type: membership.organizationUnit.type
          }
        : null
    })),
    organizationUnitAssignments: user.organizationUnitAssignments.map(
      (assignment) => ({
        id: assignment.id,
        tenantId: assignment.tenantId,
        isDefault: assignment.isDefault,
        organizationUnit: {
          id: assignment.organizationUnit.id,
          name: assignment.organizationUnit.name,
          type: assignment.organizationUnit.type
        }
      })
    ),
    roles: effectiveRoleAssignments.map(({ role }) => role.code),
    roleAssignments: user.roles.map((assignment) => ({
      id: assignment.id,
      tenantId: assignment.tenantId,
      tenant: assignment.tenant,
      role: {
        id: assignment.role.id,
        code: assignment.role.code,
        name: assignment.role.name,
        tenantTypeCode: assignment.role.tenantTypeCode,
        isPlatformRole: assignment.role.isPlatformRole,
        appliesToAllTenantTypes: assignment.role.appliesToAllTenantTypes
      }
    })),
    permissions: Array.from(
      new Set(
        effectiveRoleAssignments.flatMap(({ role }) =>
          role.permissions.map(({ permission }) => permission.code)
        )
      )
    ),
    credentials: {
      hasPassword: Boolean(user.credential),
      mustResetPassword: user.credential?.mustResetPassword ?? false,
      passwordSetAt: user.credential?.passwordSetAt ?? null
    }
  };
}

function mapRole(
  role: Prisma.RoleGetPayload<{
    include: {
      permissions: {
        include: {
          permission: true;
        };
      };
      users: {
        include: {
          user: true;
          tenant: {
            select: {
              id: true;
              name: true;
            };
          };
        };
      };
    };
  }>
) {
  return {
    id: role.id,
    code: role.code,
    tenantTypeCode: role.tenantTypeCode,
    appliesToAllTenantTypes: role.appliesToAllTenantTypes,
    isPlatformRole: role.isPlatformRole,
    name: role.name,
    description: role.description,
    permissions: role.permissions.map(({ permission }) => permission.code),
    users: role.users.map(({ user, tenant }) => ({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      tenant
    })),
    createdAt: role.createdAt,
    updatedAt: role.updatedAt
  };
}

async function resolveTenantContextForUser(
  tenantId?: string,
  organizationUnitId?: string | null,
  organizationUnitIds?: string[]
) {
  if (!tenantId) {
    if (organizationUnitId || (organizationUnitIds?.length ?? 0) > 0) {
      throw new Error('Organization Unit requires a tenant.');
    }

    return null;
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: {
      id: true,
      name: true,
      tenantTypeCode: true
    }
  });

  if (!tenant) {
    throw new Error('Tenant not found');
  }

  const resolvedOrganizationUnitIds = normalizeOrganizationUnitIds(
    organizationUnitIds,
    organizationUnitId
  );

  if (resolvedOrganizationUnitIds.length > 0) {
    const organizationUnits = await prisma.organizationUnit.findMany({
      where: {
        id: {
          in: resolvedOrganizationUnitIds
        },
        tenantId
      },
      select: {
        id: true
      }
    });

    if (organizationUnits.length !== resolvedOrganizationUnitIds.length) {
      throw new Error('Organization Unit not found for tenant.');
    }
  }

  return tenant;
}

export async function listRoles(options: {
  tenantTypeCode?: string;
  includePlatformRoles?: boolean;
} = {}) {
  const normalizedTenantTypeCode = normalizeTenantTypeCode(options.tenantTypeCode);
  const roles = await prisma.role.findMany({
    where: normalizedTenantTypeCode
      ? {
          OR: [
            {
              tenantTypeCode: {
                in: getCompatibleTenantTypeCodes(normalizedTenantTypeCode)
              }
            },
            { appliesToAllTenantTypes: true },
            ...(options.includePlatformRoles ? [{ isPlatformRole: true }] : [])
          ]
        }
      : undefined,
    include: {
      permissions: {
        include: {
          permission: true
        }
      },
      users: {
        include: {
          user: true,
          tenant: {
            select: {
              id: true,
              name: true
            }
          }
        }
      }
    },
    orderBy: [{ isPlatformRole: 'desc' }, { name: 'asc' }]
  });

  return roles.map(mapRole);
}

export async function createRole(input: CreateRoleInput) {
  const code = normalizeCode(input.code);
  const name = input.name.trim();
  const permissionCodes = input.permissions.map(normalizeCode).filter(Boolean);
  const tenantTypeCode = normalizeTenantTypeCode(input.tenantTypeCode);

  if (!code) {
    throw new Error('Role code is required');
  }

  if (!name) {
    throw new Error('Role name is required');
  }

  if (permissionCodes.length === 0) {
    throw new Error('At least one permission is required');
  }

  await syncTenantTypeDefinitions(prisma);

  if (tenantTypeCode) {
    const tenantType = await prisma.tenantTypeDefinition.findUnique({
      where: { code: tenantTypeCode }
    });

    if (!tenantType) {
      throw new Error('Tenant Type not found');
    }
  }

  const permissions = await Promise.all(
    permissionCodes.map((permissionCode) =>
      prisma.permission.upsert({
        where: { code: permissionCode },
        update: {
          name: permissionCode
        },
        create: {
          code: permissionCode,
          name: permissionCode
        }
      })
    )
  );

  const role = await prisma.role.upsert({
    where: { code },
    update: {
      name,
      description: input.description?.trim() || null,
      tenantTypeCode: tenantTypeCode ?? null,
      appliesToAllTenantTypes: input.appliesToAllTenantTypes ?? false,
      isPlatformRole: input.isPlatformRole ?? false
    },
    create: {
      code,
      name,
      description: input.description?.trim() || null,
      tenantTypeCode: tenantTypeCode ?? null,
      appliesToAllTenantTypes: input.appliesToAllTenantTypes ?? false,
      isPlatformRole: input.isPlatformRole ?? false
    }
  });

  await Promise.all(
    permissions.map((permission) =>
      prisma.rolePermission.upsert({
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
      })
    )
  );

  const hydratedRole = await prisma.role.findUniqueOrThrow({
    where: { id: role.id },
    include: {
      permissions: {
        include: {
          permission: true
        }
      },
      users: {
        include: {
          user: true,
          tenant: {
            select: {
              id: true,
              name: true
            }
          }
        }
      }
    }
  });

  return mapRole(hydratedRole);
}

export async function assignRoleToUser(
  userId: string,
  roleId: string,
  context: AuditContext = {},
  options: {
    tenantId?: string | null;
  } = {}
) {
  const [user, role] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      include: {
        memberships: true
      }
    }),
    prisma.role.findUnique({
      where: { id: roleId }
    })
  ]);

  if (!user) {
    throw new Error('User not found');
  }

  if (!role) {
    throw new Error('Role not found');
  }

  const tenantId =
    options.tenantId === undefined
      ? user.memberships.find((membership) => membership.isDefault)?.tenantId ??
        user.tenantId ??
        null
      : options.tenantId;

  if (role.isPlatformRole) {
    if (tenantId !== null) {
      throw new Error('Platform roles cannot be assigned to a tenant.');
    }
  } else if (!tenantId) {
    throw new Error('Tenant-scoped roles require a tenant assignment.');
  } else {
    const membership = user.memberships.find((candidate) => candidate.tenantId === tenantId);

    if (!membership) {
      throw new Error('User is not a member of the selected tenant.');
    }

    const tenant = await prisma.tenant.findUnique({
      where: {
        id: tenantId
      },
      select: {
        tenantTypeCode: true
      }
    });

    if (!tenant) {
      throw new Error('Tenant not found');
    }

    const normalizedRoleTenantTypeCode = normalizeTenantTypeCode(role.tenantTypeCode);
    const roleAllowedForTenant =
      role.appliesToAllTenantTypes ||
      role.tenantTypeCode === null ||
      (normalizedRoleTenantTypeCode !== undefined &&
        getCompatibleTenantTypeCodes(tenant.tenantTypeCode).includes(
          normalizedRoleTenantTypeCode
        ));

    if (!roleAllowedForTenant) {
      throw new Error('Role is not allowed for this Tenant Type.');
    }
  }

  const beforeState = {
    assignments: await prisma.userRole.findMany({
      where: { userId },
      select: {
        roleId: true,
        tenantId: true
      }
    })
  };

  const existingAssignment = await prisma.userRole.findFirst({
    where: {
      userId,
      roleId,
      tenantId
    }
  });
  const assignment =
    existingAssignment ??
    (await prisma.userRole.create({
      data: {
        userId,
        roleId,
        tenantId
      }
    }));

  const permissions = await prisma.permission.findMany({
    where: {
      roles: {
        some: {
          roleId
        }
      }
    },
    orderBy: {
      code: 'asc'
    }
  });

  if (tenantId) {
    await logAdminAction({
      tenantId,
      actorUserId: context.actorUserId ?? null,
      action: 'tenant.role-assignment.updated',
      resourceType: 'user-role',
      resourceId: assignment.id,
      beforeState: beforeState as Prisma.InputJsonValue,
      afterState: {
        tenantId,
        userId,
        roleId,
        roleCode: role.code
      } satisfies Prisma.InputJsonValue,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent
    });
  }

  return {
    userId,
    roleId,
    roleCode: role.code,
    tenantId,
    permissions: permissions.map((permission) => permission.code)
  };
}

export async function removeRoleFromUser(
  userId: string,
  roleId: string,
  context: AuditContext = {},
  options: {
    tenantId?: string | null;
  } = {}
) {
  const assignments = await prisma.userRole.findMany({
    where: {
      userId,
      roleId,
      ...(options.tenantId === undefined ? {} : { tenantId: options.tenantId })
    },
    include: {
      role: true
    }
  });

  if (assignments.length === 0) {
    throw new Error('Role assignment not found');
  }

  if (assignments.length > 1 && options.tenantId === undefined) {
    throw new Error('Role exists in multiple tenant scopes. Tenant selection is required.');
  }

  const assignment = assignments[0]!;
  await prisma.userRole.delete({
    where: {
      id: assignment.id
    }
  });

  if (assignment.tenantId) {
    await logAdminAction({
      tenantId: assignment.tenantId,
      actorUserId: context.actorUserId ?? null,
      action: 'tenant.role-assignment.removed',
      resourceType: 'user-role',
      resourceId: assignment.id,
      beforeState: {
        userId,
        roleId,
        tenantId: assignment.tenantId
      } satisfies Prisma.InputJsonValue,
      afterState: Prisma.JsonNull as unknown as Prisma.InputJsonValue,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent
    });
  }

  return {
    userId,
    roleId,
    roleCode: assignment.role.code,
    tenantId: assignment.tenantId,
    removed: true
  };
}

export async function listUsers() {
  const users = await prisma.user.findMany({
    include: userWithAccessArgs.include,
    orderBy: {
      createdAt: 'desc'
    }
  });

  return users.map(mapUser);
}

export async function createUser(
  input: CreateUserInput,
  context: AuditContext = {}
) {
  await syncTenantTypeDefinitions(prisma);

  const email = normalizeRequired(input.email, 'Email').toLowerCase();
  const firstName = normalizeRequired(input.firstName, 'First name');
  const lastName = normalizeRequired(input.lastName, 'Last name');
  const tenantId = normalizeOptional(input.tenantId);
  const roleId = normalizeOptional(input.roleId ?? undefined) ?? null;
  const organizationUnitIds = normalizeOrganizationUnitIds(
    input.organizationUnitIds,
    input.organizationUnitId
  );
  const organizationUnitId = organizationUnitIds[0] ?? null;
  const status = resolveLifecycleStatus(input);
  const isActive = status === 'ACTIVE';
  const tenant = await resolveTenantContextForUser(
    tenantId,
    organizationUnitId,
    organizationUnitIds
  );

  const user = await prisma.$transaction(async (tx) => {
    let initialRoleCode: string | null = null;
    let initialRoleIsTenantAdmin = false;

    if (roleId) {
      const role = await tx.role.findUnique({
        where: { id: roleId }
      });

      if (!role) {
        throw new Error('Role not found');
      }

      if (role.isPlatformRole) {
        if (tenantId !== null) {
          throw new Error('Platform roles cannot be assigned to a tenant.');
        }
      } else {
        if (!tenantId || !tenant) {
          throw new Error('Tenant-scoped roles require a tenant assignment.');
        }

        const normalizedRoleTenantTypeCode = normalizeTenantTypeCode(role.tenantTypeCode);
        const roleAllowedForTenant =
          role.appliesToAllTenantTypes ||
          role.tenantTypeCode === null ||
          (normalizedRoleTenantTypeCode !== undefined &&
            getCompatibleTenantTypeCodes(tenant.tenantTypeCode).includes(
              normalizedRoleTenantTypeCode
            ));

        if (!roleAllowedForTenant) {
          throw new Error('Role is not allowed for this Tenant Type.');
        }
      }

      initialRoleCode = role.code;
      initialRoleIsTenantAdmin = role.code === 'tenant_admin';
    }

    const createdUser = await tx.user.create({
      data: {
        tenantId: tenantId ?? null,
        email,
        firstName,
        lastName,
        isActive,
        status,
      }
    });

    if (input.password?.trim()) {
      await tx.userCredential.create({
        data: {
          userId: createdUser.id,
          passwordHash: hashPassword(input.password),
          mustResetPassword: status === 'INVITED',
          passwordSetAt: new Date()
        }
      });
    }

    if (tenantId) {
      await tx.userTenantMembership.create({
        data: {
          userId: createdUser.id,
          tenantId,
          organizationUnitId: organizationUnitId ?? null,
          isDefault: true,
          isTenantAdmin: initialRoleIsTenantAdmin,
          status,
          invitedAt: status === 'INVITED' ? new Date() : null,
          activatedAt: status === 'ACTIVE' ? new Date() : null,
          disabledAt: status === 'DISABLED' ? new Date() : null
        }
      });

      if (organizationUnitIds.length > 0) {
        await tx.userOrganizationUnitAssignment.createMany({
          data: organizationUnitIds.map((id, index) => ({
            userId: createdUser.id,
            tenantId,
            organizationUnitId: id,
            isDefault: index === 0
          }))
        });
      }

      if (roleId) {
        await tx.userRole.create({
          data: {
            userId: createdUser.id,
            roleId,
            tenantId
          }
        });
      }

      await logAdminAction({
        client: tx,
        tenantId,
        actorUserId: context.actorUserId ?? null,
        action: 'user.created',
        resourceType: 'user',
        resourceId: createdUser.id,
        beforeState: Prisma.JsonNull as unknown as Prisma.InputJsonValue,
        afterState: {
          email,
          firstName,
          lastName,
          status,
          tenantId,
          roleId,
          roleCode: initialRoleCode,
          organizationUnitId: organizationUnitId ?? null,
          organizationUnitIds
        } satisfies Prisma.InputJsonValue,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent
      });
    }

    return tx.user.findUniqueOrThrow({
      where: { id: createdUser.id },
      include: userWithAccessArgs.include
    });
  });

  if (tenant?.id) {
    await createNotification({
      tenantId: tenant.id,
      userId: user.id,
      channel: 'EMAIL',
      template: status === 'INVITED' ? 'user-invited' : 'user-welcome',
      subject:
        status === 'INVITED'
          ? 'Your portal invitation is ready'
          : 'Welcome to the portal',
      body:
        status === 'INVITED'
          ? `An account has been created for ${user.firstName}. Activate it by setting credentials.`
          : `Welcome ${user.firstName}. Your portal account is ready.`
    });

    publishInBackground('user.created', {
      capabilityId: 'platform.access',
      id: randomUUID(),
      correlationId: randomUUID(),
      failureType: 'none',
      orgUnitId: organizationUnitId ?? null,
      timestamp: new Date(),
      tenantId: tenant.id,
      type: 'user.created',
      payload: {
        userId: user.id,
        tenantId: tenant.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isActive: user.isActive
      }
    });
  }

  return mapUser(user);
}

export async function updateUser(id: string, input: UpdateUserInput, context: AuditContext = {}) {
  const existingUser = await prisma.user.findUnique({
    where: { id },
    include: {
      memberships: {
        orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }]
      },
      organizationUnitAssignments: {
        orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }]
      }
    }
  });

  if (!existingUser) {
    throw new Error('User not found');
  }

  const tenantId =
    normalizeOptional(input.tenantId) ??
    existingUser.memberships.find((membership) => membership.isDefault)?.tenantId ??
    existingUser.tenantId ??
    undefined;
  const existingDefaultMembership =
    existingUser.memberships.find((membership) => membership.isDefault) ??
    existingUser.memberships[0] ??
    null;
  const existingAssignmentIds = existingUser.organizationUnitAssignments
    .filter((assignment) => assignment.tenantId === tenantId)
    .map((assignment) => assignment.organizationUnitId);
  const organizationUnitIds =
    input.organizationUnitIds === null
      ? []
      : normalizeOrganizationUnitIds(
          input.organizationUnitIds,
          input.organizationUnitId === null
            ? null
            : input.organizationUnitId ??
                existingAssignmentIds[0] ??
                existingDefaultMembership?.organizationUnitId ??
                null
        );
  const organizationUnitId = organizationUnitIds[0] ?? null;
  const email = normalizeOptional(input.email)?.toLowerCase() ?? existingUser.email;
  const firstName = normalizeOptional(input.firstName) ?? existingUser.firstName;
  const lastName = normalizeOptional(input.lastName) ?? existingUser.lastName;
  const status = resolveLifecycleStatus({
    status: input.status,
    isActive: input.isActive ?? existingUser.isActive
  });
  const isActive = status === 'ACTIVE';
  const tenant = await resolveTenantContextForUser(
    tenantId,
    organizationUnitId,
    organizationUnitIds
  );

  const user = await prisma.$transaction(async (tx) => {
    const beforeState = {
      tenantId: existingUser.tenantId,
      email: existingUser.email,
      firstName: existingUser.firstName,
      lastName: existingUser.lastName,
      isActive: existingUser.isActive,
      status: existingUser.status
    };

    const updatedUser = await tx.user.update({
      where: { id },
      data: {
        tenantId: tenantId ?? null,
        email,
        firstName,
        lastName,
        isActive,
        status
      }
    });

    if (input.password?.trim()) {
      await tx.userCredential.upsert({
        where: {
          userId: id
        },
        update: {
          passwordHash: hashPassword(input.password),
          mustResetPassword: status === 'INVITED',
          passwordSetAt: new Date()
        },
        create: {
          userId: id,
          passwordHash: hashPassword(input.password),
          mustResetPassword: status === 'INVITED',
          passwordSetAt: new Date()
        }
      });
    }

    if (tenantId) {
      await tx.userTenantMembership.upsert({
        where: {
          userId_tenantId: {
            userId: id,
            tenantId
          }
        },
        update: {
          organizationUnitId,
          isDefault: true,
          status,
          activatedAt: status === 'ACTIVE' ? new Date() : null,
          disabledAt: status === 'DISABLED' ? new Date() : null
        },
        create: {
          userId: id,
          tenantId,
          organizationUnitId,
          isDefault: true,
          status,
          invitedAt: status === 'INVITED' ? new Date() : null,
          activatedAt: status === 'ACTIVE' ? new Date() : null,
          disabledAt: status === 'DISABLED' ? new Date() : null
        }
      });

      await tx.userOrganizationUnitAssignment.deleteMany({
        where: {
          userId: id,
          tenantId
        }
      });

      if (organizationUnitIds.length > 0) {
        await tx.userOrganizationUnitAssignment.createMany({
          data: organizationUnitIds.map((assignmentId, index) => ({
            userId: id,
            tenantId,
            organizationUnitId: assignmentId,
            isDefault: index === 0
          }))
        });
      }

      await tx.userTenantMembership.updateMany({
        where: {
          userId: id,
          tenantId: {
            not: tenantId
          }
        },
        data: {
          isDefault: false
        }
      });

      await logAdminAction({
        client: tx,
        tenantId,
        actorUserId: context.actorUserId ?? null,
        action: 'user.updated',
        resourceType: 'user',
        resourceId: id,
        beforeState: beforeState as Prisma.InputJsonValue,
        afterState: {
          tenantId: tenantId ?? null,
          email,
          firstName,
          lastName,
          isActive,
          status,
          organizationUnitId,
          organizationUnitIds
        } satisfies Prisma.InputJsonValue,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent
      });
    }

    return tx.user.findUniqueOrThrow({
      where: { id: updatedUser.id },
      include: userWithAccessArgs.include
    });
  });

  return mapUser(user);
}

export async function deleteUser(id: string, context: AuditContext = {}) {
  const existingUser = await prisma.user.findUnique({
    where: { id },
    include: {
      tenant: true,
      roles: {
        include: {
          role: true,
          tenant: true
        }
      }
    }
  });

  if (!existingUser) {
    throw new Error('User not found');
  }

  await prisma.$transaction(async (tx) => {
    if (existingUser.tenantId) {
      await logAdminAction({
        client: tx,
        tenantId: existingUser.tenantId,
        actorUserId: context.actorUserId ?? null,
        action: 'user.deleted',
        resourceType: 'user',
        resourceId: existingUser.id,
        beforeState: {
          email: existingUser.email,
          firstName: existingUser.firstName,
          lastName: existingUser.lastName,
          tenantId: existingUser.tenantId,
          roles: existingUser.roles.map(({ role, tenant }) => ({
            code: role.code,
            tenantId: tenant?.id ?? null
          }))
        } satisfies Prisma.InputJsonValue,
        afterState: Prisma.JsonNull as unknown as Prisma.InputJsonValue,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent
      });
    }

    await tx.user.delete({
      where: { id }
    });
  });

  return {
    id: existingUser.id,
    email: existingUser.email,
    firstName: existingUser.firstName,
    lastName: existingUser.lastName,
    tenant: existingUser.tenant
      ? {
          id: existingUser.tenant.id,
          name: existingUser.tenant.name
        }
      : null,
    roles: existingUser.roles.map(({ role }) => role.code)
  };
}
