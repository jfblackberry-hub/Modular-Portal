import { PrismaClient } from '@prisma/client';

import { hashPassword, syncTenantTypeDefinitions } from '../src/accessModel.js';

const prisma = new PrismaClient();
const DEFAULT_PLATFORM_ADMIN_EMAIL = 'admin';
const DEFAULT_PLATFORM_ADMIN_PASSWORD = 'demo12345';
const LEGACY_TENANT_ADMIN_EMAIL = 'tenant';

async function ensurePermission(input: {
  code: string;
  name: string;
  description: string;
}) {
  return prisma.permission.upsert({
    where: {
      code: input.code
    },
    update: {
      name: input.name,
      description: input.description
    },
    create: input
  });
}

async function ensurePlatformAdminRole(permissionIds: string[]) {
  const role = await prisma.role.upsert({
    where: {
      code: 'platform_admin'
    },
    update: {
      isPlatformRole: true,
      name: 'Platform Admin',
      description: 'Administrative role with cross-tenant platform access.'
    },
    create: {
      code: 'platform_admin',
      isPlatformRole: true,
      name: 'Platform Admin',
      description: 'Administrative role with cross-tenant platform access.'
    }
  });

  for (const permissionId of permissionIds) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: role.id,
          permissionId
        }
      },
      update: {},
      create: {
        roleId: role.id,
        permissionId
      }
    });
  }

  return role;
}

async function repairPlatformAdminUser() {
  const permissions = await Promise.all([
    ensurePermission({
      code: 'admin.manage',
      name: 'Manage Admin',
      description: 'Allows access to administrative configuration workflows.'
    }),
    ensurePermission({
      code: 'tenant.view',
      name: 'View Tenants',
      description: 'Allows viewing tenant records.'
    }),
    ensurePermission({
      code: 'user.manage',
      name: 'Manage Users',
      description: 'Allows creating and updating user records.'
    })
  ]);

  const role = await ensurePlatformAdminRole(permissions.map((permission) => permission.id));

  const user = await prisma.user.upsert({
    where: {
      email: DEFAULT_PLATFORM_ADMIN_EMAIL
    },
    update: {
      tenantId: null,
      firstName: 'Platform',
      lastName: 'Admin',
      isActive: true,
      status: 'ACTIVE'
    },
    create: {
      email: DEFAULT_PLATFORM_ADMIN_EMAIL,
      tenantId: null,
      firstName: 'Platform',
      lastName: 'Admin',
      isActive: true,
      status: 'ACTIVE'
    }
  });

  await prisma.userCredential.upsert({
    where: {
      userId: user.id
    },
    update: {
      passwordHash: hashPassword(DEFAULT_PLATFORM_ADMIN_PASSWORD),
      mustResetPassword: false,
      passwordSetAt: new Date()
    },
    create: {
      userId: user.id,
      passwordHash: hashPassword(DEFAULT_PLATFORM_ADMIN_PASSWORD),
      mustResetPassword: false,
      passwordSetAt: new Date()
    }
  });

  await prisma.userTenantMembership.deleteMany({
    where: {
      userId: user.id
    }
  });

  await prisma.userOrganizationUnitAssignment.deleteMany({
    where: {
      userId: user.id
    }
  });

  await prisma.userRole.deleteMany({
    where: {
      userId: user.id
    }
  });

  await prisma.userRole.create({
    data: {
      userId: user.id,
      roleId: role.id,
      tenantId: null
    }
  });
}

async function retireLegacyTenantBootstrapUser() {
  const legacyUser = await prisma.user.findUnique({
    where: {
      email: LEGACY_TENANT_ADMIN_EMAIL
    }
  });

  if (!legacyUser) {
    return false;
  }

  await prisma.user.update({
    where: {
      id: legacyUser.id
    },
    data: {
      tenantId: null,
      isActive: false,
      status: 'DISABLED'
    }
  });

  await prisma.userCredential.deleteMany({
    where: {
      userId: legacyUser.id
    }
  });

  await prisma.userRole.deleteMany({
    where: {
      userId: legacyUser.id
    }
  });

  await prisma.userTenantMembership.deleteMany({
    where: {
      userId: legacyUser.id
    }
  });

  await prisma.userOrganizationUnitAssignment.deleteMany({
    where: {
      userId: legacyUser.id
    }
  });

  return true;
}

async function main() {
  await syncTenantTypeDefinitions(prisma);
  await repairPlatformAdminUser();
  const retiredLegacyTenantUser = await retireLegacyTenantBootstrapUser();

  console.log(
    JSON.stringify(
      {
        platformAdminEmail: DEFAULT_PLATFORM_ADMIN_EMAIL,
        platformAdminPassword: DEFAULT_PLATFORM_ADMIN_PASSWORD,
        retiredLegacyTenantUser
      },
      null,
      2
    )
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
