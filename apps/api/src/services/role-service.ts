import { randomUUID } from 'node:crypto';

import type { Permission, Role, User } from '@payer-portal/database';
import { Prisma, prisma } from '@payer-portal/database';
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
};

type CreateUserInput = {
  tenantId?: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive?: boolean;
};

type UpdateUserInput = {
  tenantId?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  isActive?: boolean;
};

type AuditContext = {
  actorUserId?: string | null;
  ipAddress?: string;
  userAgent?: string;
};

const userInclude = {
  tenant: true,
  memberships: {
    include: {
      tenant: {
        select: {
          id: true,
          name: true
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
};

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

function normalizeOptional(value: string | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

function mapUser(
  user: User & {
    tenant: {
      id: string;
      name: string;
    } | null;
    memberships: Array<{
      tenantId: string;
      isDefault: boolean;
      isTenantAdmin: boolean;
      tenant: {
        id: string;
        name: string;
      };
    }>;
    roles: Array<{
      role: Role & {
        permissions: Array<{
          permission: Permission;
        }>;
      };
    }>;
  }
) {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    isActive: user.isActive,
    lastLoginAt: user.lastLoginAt,
    tenant: (() => {
      const resolvedTenant = user.tenant ?? user.memberships[0]?.tenant ?? null;

      return resolvedTenant
        ? {
            id: resolvedTenant.id,
            name: resolvedTenant.name
          }
        : null;
    })(),
    memberships: user.memberships.map((membership) => ({
      tenant: membership.tenant,
      isDefault: membership.isDefault,
      isTenantAdmin: membership.isTenantAdmin
    })),
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

function mapRole(
  role: Role & {
    permissions: Array<{
      permission: Permission;
    }>;
    users: Array<{
      user: User;
    }>;
  }
) {
  return {
    id: role.id,
    code: role.code,
    name: role.name,
    description: role.description,
    permissions: role.permissions.map(({ permission }) => permission.code),
    users: role.users.map(({ user }) => ({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName
    })),
    createdAt: role.createdAt,
    updatedAt: role.updatedAt
  };
}

export async function listRoles() {
  const roles = await prisma.role.findMany({
    include: {
      permissions: {
        include: {
          permission: true
        }
      },
      users: {
        include: {
          user: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  return roles.map(mapRole);
}

export async function createRole(input: CreateRoleInput) {
  const code = normalizeCode(input.code);
  const name = input.name.trim();
  const permissionCodes = input.permissions.map(normalizeCode).filter(Boolean);

  if (!code) {
    throw new Error('Role code is required');
  }

  if (!name) {
    throw new Error('Role name is required');
  }

  if (permissionCodes.length === 0) {
    throw new Error('At least one permission is required');
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
      description: input.description?.trim() || null
    },
    create: {
      code,
      name,
      description: input.description?.trim() || null
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
          user: true
        }
      }
    }
  });

  return mapRole(hydratedRole);
}

export async function assignRoleToUser(userId: string, roleId: string, context: AuditContext = {}) {
  const [user, role] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId }
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

  const tenantId = user.tenantId;
  const beforeState = {
    roleIds: await prisma.userRole.findMany({
      where: { userId },
      select: { roleId: true }
    }).then((items) => items.map((item) => item.roleId))
  };

  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId,
        roleId
      }
    },
    update: {},
    create: {
      userId,
      roleId
    }
  });

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
  const afterRoleIds = await prisma.userRole.findMany({
    where: { userId },
    select: { roleId: true }
  });

  if (tenantId) {
    await logAdminAction({
      tenantId,
      actorUserId: context.actorUserId ?? null,
      action: 'tenant.role-assignment.updated',
      resourceType: 'user-role',
      resourceId: `${userId}:${roleId}`,
      beforeState: beforeState as unknown as Prisma.InputJsonValue,
      afterState: {
        roleIds: afterRoleIds.map((item) => item.roleId),
        assignedRoleId: roleId,
        assignedRoleCode: role.code
      } satisfies Prisma.InputJsonValue,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      metadata: {
        userId,
        roleId,
        roleCode: role.code
      }
    });
  }

  return {
    userId,
    roleId,
    roleCode: role.code,
    permissions: permissions.map((permission) => permission.code)
  };
}

export async function removeRoleFromUser(userId: string, roleId: string, context: AuditContext = {}) {
  const [user, role, assignment] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId }
    }),
    prisma.role.findUnique({
      where: { id: roleId }
    }),
    prisma.userRole.findUnique({
      where: {
        userId_roleId: {
          userId,
          roleId
        }
      }
    })
  ]);

  if (!user) {
    throw new Error('User not found');
  }

  if (!role) {
    throw new Error('Role not found');
  }

  if (!assignment) {
    throw new Error('Role assignment not found');
  }

  const beforeRoleIds = await prisma.userRole.findMany({
    where: { userId },
    select: { roleId: true }
  });

  await prisma.userRole.delete({
    where: {
      userId_roleId: {
        userId,
        roleId
      }
    }
  });

  const afterRoleIds = await prisma.userRole.findMany({
    where: { userId },
    select: { roleId: true }
  });

  if (user.tenantId) {
    await logAdminAction({
      tenantId: user.tenantId,
      actorUserId: context.actorUserId ?? null,
      action: 'tenant.role-assignment.removed',
      resourceType: 'user-role',
      resourceId: `${userId}:${roleId}`,
      beforeState: {
        roleIds: beforeRoleIds.map((item) => item.roleId)
      } satisfies Prisma.InputJsonValue,
      afterState: {
        roleIds: afterRoleIds.map((item) => item.roleId),
        removedRoleId: roleId,
        removedRoleCode: role.code
      } satisfies Prisma.InputJsonValue,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      metadata: {
        userId,
        roleId,
        roleCode: role.code
      }
    });
  }

  return {
    userId,
    roleId,
    roleCode: role.code,
    removed: true
  };
}

export async function listUsers() {
  const users = await prisma.user.findMany({
    include: userInclude,
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
  const email = normalizeRequired(input.email, 'Email').toLowerCase();
  const firstName = normalizeRequired(input.firstName, 'First name');
  const lastName = normalizeRequired(input.lastName, 'Last name');
  const tenantId = normalizeOptional(input.tenantId);

  const user = await prisma.$transaction(async (tx) => {
    if (tenantId) {
      const tenant = await tx.tenant.findUnique({
        where: { id: tenantId }
      });

      if (!tenant) {
        throw new Error('Tenant not found');
      }
    }

    const createdUser = await tx.user.create({
      data: {
        tenantId,
        email,
        firstName,
        lastName,
        isActive: input.isActive ?? true
      },
      include: userInclude
    });

    if (tenantId) {
      await tx.userTenantMembership.upsert({
        where: {
          userId_tenantId: {
            userId: createdUser.id,
            tenantId
          }
        },
        update: {
          isDefault: true
        },
        create: {
          userId: createdUser.id,
          tenantId,
          isDefault: true
        }
      });
    }

    if (createdUser.tenantId) {
      await logAdminAction({
        client: tx,
        tenantId: createdUser.tenantId,
        actorUserId: context.actorUserId ?? null,
        action: 'user.created',
        resourceType: 'user',
        resourceId: createdUser.id,
        beforeState: Prisma.JsonNull as unknown as Prisma.InputJsonValue,
        afterState: {
          email,
          firstName,
          lastName,
          isActive: input.isActive ?? true,
          tenantId
        } satisfies Prisma.InputJsonValue,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent
      });
    }

    return tx.user.findUniqueOrThrow({
      where: { id: createdUser.id },
      include: userInclude
    });
  });

  if (user.tenant?.id) {
    await createNotification({
      tenantId: user.tenant.id,
      userId: user.id,
      channel: 'EMAIL',
      template: 'user-welcome',
      subject: 'Welcome to the portal',
      body: `Welcome ${user.firstName}. Your portal account is ready.`
    });

    publishInBackground('user.created', {
      capabilityId: 'platform.access',
      id: randomUUID(),
      correlationId: randomUUID(),
      failureType: 'none',
      orgUnitId: null,
      timestamp: new Date(),
      tenantId: user.tenant.id,
      type: 'user.created',
      payload: {
        userId: user.id,
        tenantId: user.tenant.id,
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
    where: { id }
  });

  if (!existingUser) {
    throw new Error('User not found');
  }

  const tenantId = normalizeOptional(input.tenantId) ?? existingUser.tenantId ?? undefined;
  const email =
    normalizeOptional(input.email)?.toLowerCase() ?? existingUser.email;
  const firstName =
    normalizeOptional(input.firstName) ?? existingUser.firstName;
  const lastName = normalizeOptional(input.lastName) ?? existingUser.lastName;
  const isActive = input.isActive ?? existingUser.isActive;

  if (!email) {
    throw new Error('Email is required');
  }

  if (!firstName) {
    throw new Error('First name is required');
  }

  if (!lastName) {
    throw new Error('Last name is required');
  }

  const user = await prisma.$transaction(async (tx) => {
    if (tenantId) {
      const tenant = await tx.tenant.findUnique({
        where: { id: tenantId }
      });

      if (!tenant) {
        throw new Error('Tenant not found');
      }
    }

    const beforeState = {
      tenantId: existingUser.tenantId,
      email: existingUser.email,
      firstName: existingUser.firstName,
      lastName: existingUser.lastName,
      isActive: existingUser.isActive
    };

    const updatedUser = await tx.user.update({
      where: { id },
      data: {
        tenantId: tenantId ?? null,
        email,
        firstName,
        lastName,
        isActive
      },
      include: userInclude
    });

    if (tenantId) {
      await tx.userTenantMembership.upsert({
        where: {
          userId_tenantId: {
            userId: id,
            tenantId
          }
        },
        update: {
          isDefault: true
        },
        create: {
          userId: id,
          tenantId,
          isDefault: true
        }
      });

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
    }

    if (tenantId) {
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
          isActive
        } satisfies Prisma.InputJsonValue,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent
      });
    }

    return tx.user.findUniqueOrThrow({
      where: { id: updatedUser.id },
      include: userInclude
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
          role: true
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
          roles: existingUser.roles.map(({ role }) => role.code)
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
