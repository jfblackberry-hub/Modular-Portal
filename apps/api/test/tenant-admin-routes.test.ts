import assert from 'node:assert/strict';
import { after, beforeEach, test } from 'node:test';

process.env.DATABASE_URL ??=
  'postgresql://dev:dev@127.0.0.1:5432/payer_portal?schema=public';

import { prisma } from '@payer-portal/database';
import Fastify from 'fastify';

import { tenantAdminRoutes } from '../src/routes/tenant-admin.js';

const TEST_PERMISSION_CODE = 'admin.manage';
const TEST_PLATFORM_ADMIN_ROLE_CODE = 'platform_admin';
const TEST_ADMIN_ROLE_CODE = 'test-tenant-admin-role';
const TEST_MEMBER_ROLE_CODE = 'test-tenant-member-role';
const TEST_ASSIGNABLE_ROLE_CODE = 'test-tenant-ops-role';
const TEST_TENANT_SLUG = 'tenant-admin-test';
const TEST_OTHER_TENANT_SLUG = 'tenant-admin-other';
const TEST_ADMIN_EMAIL = 'tenant-admin@example.com';
const TEST_MEMBER_EMAIL = 'tenant-member@example.com';
const TEST_FOREIGN_EMAIL = 'tenant-foreign@example.com';
const TEST_PLATFORM_ADMIN_EMAIL = 'platform-admin@example.com';

async function cleanupTestData() {
  await prisma.job.deleteMany({
    where: {
      type: {
        startsWith: 'tenant-admin.'
      }
    }
  });

  await prisma.auditLog.deleteMany({
    where: {
      action: {
        in: ['tenant.notification-settings.updated']
      }
    }
  });

  await prisma.connectorConfig.deleteMany({
    where: {
      name: {
        in: ['Tenant Admin Webhook', 'Tenant Admin REST']
      }
    }
  });

  await prisma.userRole.deleteMany({
    where: {
      user: {
        email: {
          in: [
            TEST_ADMIN_EMAIL,
            TEST_MEMBER_EMAIL,
            TEST_FOREIGN_EMAIL,
            TEST_PLATFORM_ADMIN_EMAIL
          ]
        }
      }
    }
  });

  await prisma.user.deleteMany({
    where: {
      email: {
        in: [
          TEST_ADMIN_EMAIL,
          TEST_MEMBER_EMAIL,
          TEST_FOREIGN_EMAIL,
          TEST_PLATFORM_ADMIN_EMAIL
        ]
      }
    }
  });

  await prisma.tenant.deleteMany({
    where: {
      slug: {
        in: [TEST_TENANT_SLUG, TEST_OTHER_TENANT_SLUG]
      }
    }
  });

  await prisma.rolePermission.deleteMany({
    where: {
      role: {
        code: {
          in: [
            TEST_ADMIN_ROLE_CODE,
            TEST_MEMBER_ROLE_CODE,
            TEST_ASSIGNABLE_ROLE_CODE
          ]
        }
      }
    }
  });

  await prisma.role.deleteMany({
    where: {
      code: {
        in: [
          TEST_ADMIN_ROLE_CODE,
          TEST_MEMBER_ROLE_CODE,
          TEST_ASSIGNABLE_ROLE_CODE
        ]
      }
    }
  });
}

async function ensurePermission() {
  return prisma.permission.upsert({
    where: { code: TEST_PERMISSION_CODE },
    update: {
      name: 'Manage Admin'
    },
    create: {
      code: TEST_PERMISSION_CODE,
      name: 'Manage Admin'
    }
  });
}

async function createFixtureData() {
  const permission = await ensurePermission();
  const [tenant, otherTenant] = await Promise.all([
    prisma.tenant.create({
      data: {
        name: 'Tenant Admin Test',
        slug: TEST_TENANT_SLUG,
        status: 'ACTIVE',
        brandingConfig: {
          notificationSettings: {
            emailEnabled: true,
            inAppEnabled: true,
            digestEnabled: false
          }
        }
      }
    }),
    prisma.tenant.create({
      data: {
        name: 'Tenant Admin Other',
        slug: TEST_OTHER_TENANT_SLUG,
        status: 'ACTIVE',
        brandingConfig: {}
      }
    })
  ]);

  const [platformAdminRole, adminRole, memberRole, assignableRole] = await Promise.all([
    prisma.role.upsert({
      where: {
        code: TEST_PLATFORM_ADMIN_ROLE_CODE
      },
      update: {
        name: 'Platform Admin'
      },
      create: {
        code: TEST_PLATFORM_ADMIN_ROLE_CODE,
        name: 'Platform Admin'
      }
    }),
    prisma.role.upsert({
      where: {
        code: TEST_ADMIN_ROLE_CODE
      },
      update: {
        name: 'Tenant Admin'
      },
      create: {
        code: TEST_ADMIN_ROLE_CODE,
        name: 'Tenant Admin'
      }
    }),
    prisma.role.upsert({
      where: {
        code: TEST_MEMBER_ROLE_CODE
      },
      update: {
        name: 'Tenant Member'
      },
      create: {
        code: TEST_MEMBER_ROLE_CODE,
        name: 'Tenant Member'
      }
    }),
    prisma.role.upsert({
      where: {
        code: TEST_ASSIGNABLE_ROLE_CODE
      },
      update: {
        name: 'Operations Analyst'
      },
      create: {
        code: TEST_ASSIGNABLE_ROLE_CODE,
        name: 'Operations Analyst'
      }
    })
  ]);

  await prisma.rolePermission.create({
    data: {
      roleId: adminRole.id,
      permissionId: permission.id
    }
  });

  const [platformAdminUser, adminUser, memberUser, foreignUser] = await Promise.all([
    prisma.user.create({
      data: {
        tenantId: otherTenant.id,
        email: TEST_PLATFORM_ADMIN_EMAIL,
        firstName: 'Platform',
        lastName: 'Admin'
      }
    }),
    prisma.user.create({
      data: {
        tenantId: tenant.id,
        email: TEST_ADMIN_EMAIL,
        firstName: 'Tenant',
        lastName: 'Admin'
      }
    }),
    prisma.user.create({
      data: {
        tenantId: tenant.id,
        email: TEST_MEMBER_EMAIL,
        firstName: 'Tenant',
        lastName: 'Member'
      }
    }),
    prisma.user.create({
      data: {
        tenantId: otherTenant.id,
        email: TEST_FOREIGN_EMAIL,
        firstName: 'Foreign',
        lastName: 'User'
      }
    })
  ]);

  await Promise.all([
    prisma.userRole.create({
      data: {
        userId: platformAdminUser.id,
        roleId: platformAdminRole.id
      }
    }),
    prisma.userRole.create({
      data: {
        userId: adminUser.id,
        roleId: adminRole.id
      }
    }),
    prisma.userRole.create({
      data: {
        userId: memberUser.id,
        roleId: memberRole.id
      }
    })
  ]);

  await prisma.connectorConfig.createMany({
    data: [
      {
        tenantId: tenant.id,
        adapterKey: 'rest-api',
        name: 'Tenant Admin REST',
        status: 'ACTIVE',
        config: {
          baseUrl: 'https://api.example.com'
        }
      },
      {
        tenantId: tenant.id,
        adapterKey: 'webhook',
        name: 'Tenant Admin Webhook',
        status: 'ACTIVE',
        config: {
          endpoint_url: 'https://partner.example.com/events',
          event_types: ['user.created']
        }
      }
    ]
  });

  return {
    tenant,
    otherTenant,
    platformAdminUser,
    adminUser,
    memberUser,
    foreignUser,
    assignableRole
  };
}

beforeEach(async () => {
  await cleanupTestData();
});

after(async () => {
  await cleanupTestData();
  await prisma.$disconnect();
});

test('tenant admin settings endpoint returns scoped configuration and updates are persisted', async () => {
  const { tenant, adminUser, memberUser, assignableRole } =
    await createFixtureData();
  const app = Fastify();
  await tenantAdminRoutes(app);

  const settingsResponse = await app.inject({
    method: 'GET',
    url: '/api/tenant-admin/settings',
    headers: {
      'x-user-id': adminUser.id
    }
  });

  assert.equal(settingsResponse.statusCode, 200, settingsResponse.body);
  const settingsPayload = settingsResponse.json();
  assert.equal(settingsPayload.tenant.id, tenant.id);
  assert.equal(settingsPayload.integrations.length, 2);
  assert.equal(settingsPayload.webhooks.length, 1);
  assert.equal(settingsPayload.users.length, 2);
  assert.equal(
    settingsPayload.users.some((user: { id: string }) => user.id === memberUser.id),
    true
  );

  const updateResponse = await app.inject({
    method: 'PUT',
    url: '/api/tenant-admin/notification-settings',
    headers: {
      'x-user-id': adminUser.id,
      'user-agent': 'tenant-admin-test'
    },
    payload: {
      emailEnabled: false,
      inAppEnabled: true,
      digestEnabled: true,
      replyToEmail: 'support@example.com',
      senderName: 'Tenant Ops'
    }
  });

  assert.equal(updateResponse.statusCode, 200);
  assert.equal(updateResponse.json().emailEnabled, false);
  assert.equal(updateResponse.json().digestEnabled, true);

  const refreshedTenant = await prisma.tenant.findUniqueOrThrow({
    where: {
      id: tenant.id
    }
  });
  const brandingConfig = refreshedTenant.brandingConfig as {
    notificationSettings?: {
      emailEnabled?: boolean;
      digestEnabled?: boolean;
      replyToEmail?: string;
      senderName?: string;
    };
  };

  assert.equal(brandingConfig.notificationSettings?.emailEnabled, false);
  assert.equal(brandingConfig.notificationSettings?.digestEnabled, true);
  assert.equal(
    brandingConfig.notificationSettings?.replyToEmail,
    'support@example.com'
  );
  assert.equal(brandingConfig.notificationSettings?.senderName, 'Tenant Ops');

  const roleResponse = await app.inject({
    method: 'POST',
    url: `/api/tenant-admin/users/${memberUser.id}/roles`,
    headers: {
      'x-user-id': adminUser.id
    },
    payload: {
      roleId: assignableRole.id
    }
  });

  assert.equal(roleResponse.statusCode, 201);
  assert.equal(roleResponse.json().roleCode, TEST_ASSIGNABLE_ROLE_CODE);

  const storedAssignment = await prisma.userRole.findFirst({
    where: {
      userId: memberUser.id,
      roleId: assignableRole.id
    }
  });
  assert.ok(storedAssignment);

  await app.close();
});

test('tenant admin routes enforce admin permission and tenant scoping', async () => {
  const { adminUser, memberUser, foreignUser, assignableRole } =
    await createFixtureData();
  const app = Fastify();
  await tenantAdminRoutes(app);

  const forbiddenResponse = await app.inject({
    method: 'GET',
    url: '/api/tenant-admin/settings',
    headers: {
      'x-user-id': memberUser.id
    }
  });

  assert.equal(forbiddenResponse.statusCode, 403);

  const foreignAssignmentResponse = await app.inject({
    method: 'POST',
    url: `/api/tenant-admin/users/${foreignUser.id}/roles`,
    headers: {
      'x-user-id': adminUser.id
    },
    payload: {
      roleId: assignableRole.id
    }
  });

  assert.equal(foreignAssignmentResponse.statusCode, 404);

  await app.close();
});

test('platform admins can switch tenant context on tenant-admin routes', async () => {
  const { tenant, otherTenant, platformAdminUser } = await createFixtureData();
  const app = Fastify();
  await tenantAdminRoutes(app);

  const targetTenantResponse = await app.inject({
    method: 'GET',
    url: `/api/tenant-admin/settings?tenant_id=${tenant.id}`,
    headers: {
      'x-user-id': platformAdminUser.id
    }
  });

  assert.equal(targetTenantResponse.statusCode, 200);
  assert.equal(targetTenantResponse.json().tenant.id, tenant.id);

  const otherTenantResponse = await app.inject({
    method: 'GET',
    url: `/api/tenant-admin/settings?tenant_id=${otherTenant.id}`,
    headers: {
      'x-user-id': platformAdminUser.id
    }
  });

  assert.equal(otherTenantResponse.statusCode, 200);
  assert.equal(otherTenantResponse.json().tenant.id, otherTenant.id);

  await app.close();
});

test('tenant-admin jobs endpoint returns tenant-scoped jobs and respects platform tenant switching', async () => {
  const { tenant, otherTenant, adminUser, platformAdminUser } =
    await createFixtureData();

  await prisma.job.createMany({
    data: [
      {
        tenantId: tenant.id,
        type: 'tenant-admin.connector-sync',
        payload: { connector: 'rest-api' },
        status: 'FAILED',
        attempts: 3,
        maxAttempts: 3,
        lastError: 'Sync timeout'
      },
      {
        tenantId: otherTenant.id,
        type: 'tenant-admin.connector-sync',
        payload: { connector: 'webhook' },
        status: 'PENDING',
        attempts: 0,
        maxAttempts: 3
      }
    ]
  });

  const app = Fastify();
  await tenantAdminRoutes(app);

  const tenantAdminResponse = await app.inject({
    method: 'GET',
    url: '/api/tenant-admin/jobs',
    headers: {
      'x-user-id': adminUser.id
    }
  });

  assert.equal(tenantAdminResponse.statusCode, 200, tenantAdminResponse.body);
  const tenantJobs = tenantAdminResponse.json();
  assert.equal(tenantJobs.length, 1);
  assert.equal(tenantJobs[0].tenantId, tenant.id);
  assert.equal(tenantJobs[0].status, 'FAILED');

  const switchedContextResponse = await app.inject({
    method: 'GET',
    url: `/api/tenant-admin/jobs?tenant_id=${otherTenant.id}&status=PENDING`,
    headers: {
      'x-user-id': platformAdminUser.id
    }
  });

  assert.equal(switchedContextResponse.statusCode, 200, switchedContextResponse.body);
  const switchedJobs = switchedContextResponse.json();
  assert.equal(switchedJobs.length, 1);
  assert.equal(switchedJobs[0].tenantId, otherTenant.id);
  assert.equal(switchedJobs[0].status, 'PENDING');

  await app.close();
});
