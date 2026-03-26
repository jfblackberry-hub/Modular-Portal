import assert from 'node:assert/strict';
import { after, beforeEach, test } from 'node:test';

process.env.DATABASE_URL ??=
  'postgresql://dev:dev@127.0.0.1:5432/payer_portal?schema=public';

import { prisma } from '@payer-portal/database';
import { getPublicAssetStorageService } from '@payer-portal/server';
import Fastify from 'fastify';

import { registerPlugins } from '../src/plugins/index.js';
import { platformBrandingRoutes } from '../src/routes/platform-branding.js';
import { featureFlagRoutes } from '../src/routes/feature-flags.js';
import { roleRoutes } from '../src/routes/roles.js';
import { tenantRoutes } from '../src/routes/tenants.js';
import { createAccessToken } from '../src/services/access-token-service.js';

const TEST_PERMISSION_CODE = 'admin.manage';
const TEST_PLATFORM_ADMIN_ROLE_CODE = 'platform_admin';
const TEST_TENANT_ADMIN_ROLE_CODE = 'tenant_admin';
const TEST_PLATFORM_ADMIN_EMAIL = 'platform-plane-admin@example.com';
const TEST_TENANT_ADMIN_EMAIL = 'platform-plane-tenant-admin@example.com';
const TEST_TENANT_SLUG = 'platform-plane-tenant';

async function cleanupTestData() {
  await prisma.$executeRawUnsafe('TRUNCATE TABLE audit_logs');
  await getPublicAssetStorageService()
    .delete('platform/branding/platform-custom.css')
    .catch(() => undefined);

  await prisma.featureFlag.deleteMany({
    where: {
      key: 'platform-plane.test'
    }
  });

  await prisma.userRole.deleteMany({
    where: {
      user: {
        email: {
          in: [TEST_PLATFORM_ADMIN_EMAIL, TEST_TENANT_ADMIN_EMAIL]
        }
      }
    }
  });

  await prisma.user.deleteMany({
    where: {
      email: {
        in: [TEST_PLATFORM_ADMIN_EMAIL, TEST_TENANT_ADMIN_EMAIL]
      }
    }
  });

  await prisma.tenant.deleteMany({
    where: {
      slug: TEST_TENANT_SLUG
    }
  });
}

function buildMultipartBody(input: {
  boundary: string;
  fieldName: string;
  fileName: string;
  contentType: string;
  content: string;
}) {
  return Buffer.from(
    `--${input.boundary}\r\n` +
      `Content-Disposition: form-data; name="${input.fieldName}"; filename="${input.fileName}"\r\n` +
      `Content-Type: ${input.contentType}\r\n\r\n` +
      `${input.content}\r\n` +
      `--${input.boundary}--\r\n`,
    'utf8'
  );
}

async function createFixtureData() {
  const permission = await prisma.permission.upsert({
    where: {
      code: TEST_PERMISSION_CODE
    },
    update: {
      name: 'Manage Admin'
    },
    create: {
      code: TEST_PERMISSION_CODE,
      name: 'Manage Admin'
    }
  });

  const tenant = await prisma.tenant.create({
    data: {
      name: 'Platform Plane Tenant',
      slug: TEST_TENANT_SLUG,
      status: 'ACTIVE',
      brandingConfig: {}
    }
  });

  const [platformAdminRole, tenantAdminRole] = await Promise.all([
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
        code: TEST_TENANT_ADMIN_ROLE_CODE
      },
      update: {
        name: 'Tenant Admin'
      },
      create: {
        code: TEST_TENANT_ADMIN_ROLE_CODE,
        name: 'Tenant Admin'
      }
    })
  ]);

  await prisma.rolePermission.upsert({
    where: {
      roleId_permissionId: {
        roleId: tenantAdminRole.id,
        permissionId: permission.id
      }
    },
    update: {},
    create: {
      roleId: tenantAdminRole.id,
      permissionId: permission.id
    }
  });

  const [platformAdminUser, tenantAdminUser] = await Promise.all([
    prisma.user.create({
      data: {
        tenantId: tenant.id,
        email: TEST_PLATFORM_ADMIN_EMAIL,
        firstName: 'Platform',
        lastName: 'Admin'
      }
    }),
    prisma.user.create({
      data: {
        tenantId: tenant.id,
        email: TEST_TENANT_ADMIN_EMAIL,
        firstName: 'Tenant',
        lastName: 'Admin'
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
        userId: tenantAdminUser.id,
        roleId: tenantAdminRole.id
      }
    })
  ]);

  await prisma.userTenantMembership.createMany({
    data: [
      {
        userId: platformAdminUser.id,
        tenantId: tenant.id,
        isDefault: true,
        isTenantAdmin: true
      },
      {
        userId: tenantAdminUser.id,
        tenantId: tenant.id,
        isDefault: true,
        isTenantAdmin: true
      }
    ]
  });

  return {
    tenant,
    platformAdminUser,
    tenantAdminUser
  };
}

function createPlatformAdminToken(user: { id: string; email: string }) {
  return createAccessToken({
    userId: user.id,
    email: user.email,
    tenantId: 'platform',
    sessionType: 'platform_admin'
  });
}

function createTenantAdminToken(user: { id: string; email: string }, tenantId: string) {
  return createAccessToken({
    userId: user.id,
    email: user.email,
    tenantId,
    sessionType: 'tenant_admin'
  });
}

beforeEach(async () => {
  await cleanupTestData();
});

after(async () => {
  await cleanupTestData();
  await prisma.$disconnect();
});

test('platform-admin routes are restricted to platform admins', async () => {
  const { tenant, platformAdminUser, tenantAdminUser } = await createFixtureData();
  const app = Fastify();
  await tenantRoutes(app);
  await roleRoutes(app);
  await featureFlagRoutes(app);
  const platformToken = createPlatformAdminToken(platformAdminUser);
  const tenantToken = createTenantAdminToken(tenantAdminUser, tenant.id);

  const tenantListResponse = await app.inject({
    method: 'GET',
    url: '/platform-admin/tenants',
    headers: {
      authorization: `Bearer ${platformToken}`
    }
  });

  assert.equal(tenantListResponse.statusCode, 200, tenantListResponse.body);

  const forbiddenTenantListResponse = await app.inject({
    method: 'GET',
    url: '/platform-admin/tenants',
    headers: {
      authorization: `Bearer ${tenantToken}`
    }
  });

  assert.equal(forbiddenTenantListResponse.statusCode, 403);

  const createFlagResponse = await app.inject({
    method: 'POST',
    url: '/platform-admin/feature-flags',
    headers: {
      authorization: `Bearer ${platformToken}`
    },
    payload: {
      key: 'platform-plane.test',
      enabled: true,
      tenantId: null
    }
  });

  assert.equal(createFlagResponse.statusCode, 201);

  const forbiddenRolesResponse = await app.inject({
    method: 'GET',
    url: '/platform-admin/roles',
    headers: {
      authorization: `Bearer ${tenantToken}`
    }
  });

  assert.equal(forbiddenRolesResponse.statusCode, 403);

  await app.close();
});

test('platform admins can archive inactive tenants and then delete them', async () => {
  const { tenant, platformAdminUser } = await createFixtureData();
  const app = Fastify();
  await tenantRoutes(app);
  const platformToken = createPlatformAdminToken(platformAdminUser);

  const activeArchiveResponse = await app.inject({
    method: 'POST',
    url: `/platform-admin/tenants/${tenant.id}/archive`,
    headers: {
      authorization: `Bearer ${platformToken}`
    }
  });

  assert.equal(activeArchiveResponse.statusCode, 400);
  assert.match(
    activeArchiveResponse.json().message,
    /inactive before it can be archived/i
  );

  const inactivateResponse = await app.inject({
    method: 'PATCH',
    url: `/platform-admin/tenants/${tenant.id}`,
    headers: {
      authorization: `Bearer ${platformToken}`
    },
    payload: {
      status: 'INACTIVE'
    }
  });

  assert.equal(inactivateResponse.statusCode, 200, inactivateResponse.body);

  const archiveResponse = await app.inject({
    method: 'POST',
    url: `/platform-admin/tenants/${tenant.id}/archive`,
    headers: {
      authorization: `Bearer ${platformToken}`
    }
  });

  assert.equal(archiveResponse.statusCode, 200, archiveResponse.body);
  assert.equal(archiveResponse.json().isArchived, true);

  const deleteResponse = await app.inject({
    method: 'DELETE',
    url: `/platform-admin/tenants/${tenant.id}`,
    headers: {
      authorization: `Bearer ${platformToken}`
    }
  });

  assert.equal(deleteResponse.statusCode, 200, deleteResponse.body);
  assert.equal(deleteResponse.json().deleted, true);

  const deletedTenant = await prisma.tenant.findUnique({
    where: {
      id: tenant.id
    }
  });

  assert.ok(deletedTenant);
  assert.match(deletedTenant.slug, /^platform-plane-tenant-deleted-/);
  const lifecycle = (deletedTenant.brandingConfig as {
    lifecycle?: {
      deletedAt?: string;
    };
  }).lifecycle;
  assert.ok(typeof lifecycle?.deletedAt === 'string');

  await app.close();
});

test('platform-admin tenant creation returns a friendly error for duplicate slugs', async () => {
  const { platformAdminUser } = await createFixtureData();
  const app = Fastify();
  await tenantRoutes(app);
  const platformToken = createPlatformAdminToken(platformAdminUser);

  const response = await app.inject({
    method: 'POST',
    url: '/platform-admin/tenants',
    headers: {
      authorization: `Bearer ${platformToken}`
    },
    payload: {
      name: 'Duplicate Slug Tenant',
      slug: TEST_TENANT_SLUG,
      status: 'ACTIVE',
      type: 'PROVIDER',
      brandingConfig: {}
    }
  });

  assert.equal(response.statusCode, 400, response.body);
  assert.match(response.body, /Tenant slug 'platform-plane-tenant' already exists\./);
  assert.doesNotMatch(response.body, /Unique constraint failed/i);

  await app.close();
});

test('platform admins can upload platform branding css and public route serves it', async () => {
  const { platformAdminUser } = await createFixtureData();
  const app = Fastify();
  registerPlugins(app);
  await platformBrandingRoutes(app);
  const platformToken = createPlatformAdminToken(platformAdminUser);
  const boundary = '----codex-platform-css-boundary';
  const cssContent = 'body.averra-admin { outline: 1px solid rgb(255, 0, 255); }';

  const uploadResponse = await app.inject({
    method: 'POST',
    url: '/platform-admin/settings/branding/css',
    headers: {
      authorization: `Bearer ${platformToken}`,
      'x-tenant-id': 'platform',
      'content-type': `multipart/form-data; boundary=${boundary}`
    },
    payload: buildMultipartBody({
      boundary,
      fieldName: 'file',
      fileName: 'platform.css',
      contentType: 'text/css',
      content: cssContent
    })
  });

  assert.equal(uploadResponse.statusCode, 201, uploadResponse.body);
  assert.equal(uploadResponse.json().hasCustomCss, true);

  const metadataResponse = await app.inject({
    method: 'GET',
    url: '/platform-admin/settings/branding',
    headers: {
      authorization: `Bearer ${platformToken}`,
      'x-tenant-id': 'platform'
    }
  });

  assert.equal(metadataResponse.statusCode, 200, metadataResponse.body);
  assert.equal(metadataResponse.json().hasCustomCss, true);

  const publicCssResponse = await app.inject({
    method: 'GET',
    url: '/public/platform-branding/custom.css'
  });

  assert.equal(publicCssResponse.statusCode, 200, publicCssResponse.body);
  assert.match(publicCssResponse.body, /body\.averra-admin/);

  await app.close();
});
