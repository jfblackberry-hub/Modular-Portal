import assert from 'node:assert/strict';
import { after, beforeEach, test } from 'node:test';

process.env.DATABASE_URL ??=
  'postgresql://dev:dev@127.0.0.1:5432/payer_portal?schema=public';

import { prisma } from '@payer-portal/database';
import { getPublicAssetStorageService } from '@payer-portal/server';
import Fastify from 'fastify';

import { registerPlugins } from '../src/plugins/index.js';
import { adminOperationsRoutes } from '../src/routes/admin-operations.js';
import { featureFlagRoutes } from '../src/routes/feature-flags.js';
import { platformBrandingRoutes } from '../src/routes/platform-branding.js';
import { publicAssetRoutes } from '../src/routes/public-assets.js';
import { roleRoutes } from '../src/routes/roles.js';
import { tenantRoutes } from '../src/routes/tenants.js';
import { createAccessToken } from '../src/services/access-token-service.js';

const TEST_PERMISSION_CODE = 'admin.manage';
const TEST_PLATFORM_ADMIN_ROLE_CODE = 'platform_admin';
const TEST_TENANT_ADMIN_ROLE_CODE = 'tenant_admin';
const TEST_PLATFORM_ADMIN_EMAIL = 'platform-plane-admin@example.com';
const TEST_TENANT_ADMIN_EMAIL = 'platform-plane-tenant-admin@example.com';
const TEST_CREATED_PLATFORM_TENANT_USER_EMAIL = 'new.platform-created.tenant.user@test.local';
const TEST_DELETED_TENANT_USER_EMAIL = 'tenant-delete-target@example.com';
const TEST_TENANT_SLUG = 'platform-plane-tenant';
const TEST_PROVIDER_TENANT_SLUG = 'platform-plane-provider-tenant';
const TEST_ISOLATED_TENANT_SLUG = 'platform-plane-isolated-tenant';
const TEST_CLINIC_OU_TENANT_SLUG = 'clinic-ou-admin-tenant';

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
          in: [
            TEST_PLATFORM_ADMIN_EMAIL,
            TEST_TENANT_ADMIN_EMAIL,
            TEST_CREATED_PLATFORM_TENANT_USER_EMAIL,
            TEST_DELETED_TENANT_USER_EMAIL
          ]
        }
      }
    }
  });

  await prisma.user.deleteMany({
    where: {
      email: {
        in: [
          TEST_PLATFORM_ADMIN_EMAIL,
          TEST_TENANT_ADMIN_EMAIL,
          TEST_CREATED_PLATFORM_TENANT_USER_EMAIL,
          TEST_DELETED_TENANT_USER_EMAIL
        ]
      }
    }
  });

  await prisma.tenant.deleteMany({
    where: {
      OR: [
        {
          slug: {
            startsWith: TEST_TENANT_SLUG
          }
        },
        {
          slug: {
            startsWith: TEST_PROVIDER_TENANT_SLUG
          }
        },
        {
          slug: {
            startsWith: TEST_ISOLATED_TENANT_SLUG
          }
        },
        {
          slug: {
            startsWith: TEST_CLINIC_OU_TENANT_SLUG
          }
        }
      ]
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
    tenantAdminUser,
    platformAdminRole,
    tenantAdminRole
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

test('platform admins can create a tenant-scoped user with an initial tenant role', async () => {
  const { tenant, platformAdminUser, tenantAdminRole } = await createFixtureData();
  const app = Fastify();
  await roleRoutes(app);
  const platformToken = createPlatformAdminToken(platformAdminUser);

  const createResponse = await app.inject({
    method: 'POST',
    url: '/platform-admin/users',
    headers: {
      authorization: `Bearer ${platformToken}`
    },
    payload: {
      tenantId: tenant.id,
      email: TEST_CREATED_PLATFORM_TENANT_USER_EMAIL,
      firstName: 'Taylor',
      lastName: 'Scoped',
      password: 'demo12345',
      status: 'ACTIVE',
      roleId: tenantAdminRole.id
    }
  });

  assert.equal(createResponse.statusCode, 201, createResponse.body);
  const createdUser = createResponse.json() as {
    id: string;
    roles: string[];
    tenant: { id: string } | null;
  };

  assert.ok(createdUser.roles.includes(TEST_TENANT_ADMIN_ROLE_CODE));
  assert.equal(createdUser.tenant?.id, tenant.id);

  const membership = await prisma.userTenantMembership.findFirstOrThrow({
    where: {
      userId: createdUser.id,
      tenantId: tenant.id
    }
  });
  assert.equal(membership.isTenantAdmin, true);

  const assignment = await prisma.userRole.findFirstOrThrow({
    where: {
      userId: createdUser.id,
      roleId: tenantAdminRole.id,
      tenantId: tenant.id
    }
  });
  assert.equal(assignment.tenantId, tenant.id);

  await app.close();
});

test('platform admins can archive inactive tenants and then delete them', async () => {
  const { tenant, platformAdminUser, tenantAdminUser, tenantAdminRole } =
    await createFixtureData();
  const app = Fastify();
  await tenantRoutes(app);
  const platformToken = createPlatformAdminToken(platformAdminUser);

  const scopedUser = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      email: TEST_DELETED_TENANT_USER_EMAIL,
      firstName: 'Delete',
      lastName: 'Target',
      isActive: true,
      status: 'ACTIVE'
    }
  });

  await prisma.userRole.create({
    data: {
      userId: scopedUser.id,
      roleId: tenantAdminRole.id,
      tenantId: tenant.id
    }
  });

  await prisma.userTenantMembership.create({
    data: {
      userId: scopedUser.id,
      tenantId: tenant.id,
      isDefault: true,
      isTenantAdmin: false,
      status: 'ACTIVE'
    }
  });

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

  const disabledMembership = await prisma.userTenantMembership.findUniqueOrThrow({
    where: {
      userId_tenantId: {
        userId: scopedUser.id,
        tenantId: tenant.id
      }
    }
  });
  assert.equal(disabledMembership.status, 'DISABLED');
  assert.equal(disabledMembership.isDefault, false);
  assert.equal(disabledMembership.isTenantAdmin, false);

  const removedScopedRoles = await prisma.userRole.findMany({
    where: {
      userId: scopedUser.id,
      tenantId: tenant.id
    }
  });
  assert.equal(removedScopedRoles.length, 0);

  const disabledUser = await prisma.user.findUniqueOrThrow({
    where: {
      id: scopedUser.id
    }
  });
  assert.equal(disabledUser.status, 'DISABLED');
  assert.equal(disabledUser.isActive, false);
  assert.equal(disabledUser.tenantId, null);

  const survivingTenantAdmin = await prisma.user.findUniqueOrThrow({
    where: {
      id: tenantAdminUser.id
    }
  });
  assert.equal(survivingTenantAdmin.status, 'DISABLED');
  assert.equal(survivingTenantAdmin.isActive, false);

  await app.close();
});

test('platform-admin active tenant datasets exclude deleted tenants', async () => {
  const { tenant, platformAdminUser } = await createFixtureData();
  const app = Fastify();
  await tenantRoutes(app);
  await adminOperationsRoutes(app);
  const platformToken = createPlatformAdminToken(platformAdminUser);

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

  const deleteResponse = await app.inject({
    method: 'DELETE',
    url: `/platform-admin/tenants/${tenant.id}`,
    headers: {
      authorization: `Bearer ${platformToken}`
    }
  });

  assert.equal(deleteResponse.statusCode, 200, deleteResponse.body);

  const tenantListResponse = await app.inject({
    method: 'GET',
    url: '/platform-admin/tenants',
    headers: {
      authorization: `Bearer ${platformToken}`
    }
  });

  assert.equal(tenantListResponse.statusCode, 200, tenantListResponse.body);
  assert.equal(
    tenantListResponse.json().some((row: { id: string }) => row.id === tenant.id),
    false
  );

  const summaryResponse = await app.inject({
    method: 'GET',
    url: '/platform-admin/tenant-summaries',
    headers: {
      authorization: `Bearer ${platformToken}`
    }
  });

  assert.equal(summaryResponse.statusCode, 200, summaryResponse.body);
  assert.equal(
    summaryResponse.json().some((row: { tenant: { id: string } }) => row.tenant.id === tenant.id),
    false
  );

  const healthOverviewResponse = await app.inject({
    method: 'GET',
    url: '/platform-admin/health/overview',
    headers: {
      authorization: `Bearer ${platformToken}`
    }
  });

  assert.equal(healthOverviewResponse.statusCode, 200, healthOverviewResponse.body);
  assert.equal(
    healthOverviewResponse
      .json()
      .tenants.some((row: { id: string }) => row.id === tenant.id),
    false
  );

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
      type: 'CLINIC',
      brandingConfig: {}
    }
  });

  assert.equal(response.statusCode, 400, response.body);
  assert.match(response.body, /Tenant slug 'platform-plane-tenant' already exists\./);
  assert.doesNotMatch(response.body, /Unique constraint failed/i);

  await app.close();
});

test('platform admins can provision a clinic tenant and provider-class organization units remain tenant-scoped', async () => {
  const { platformAdminUser } = await createFixtureData();
  const app = Fastify();
  await tenantRoutes(app);
  const platformToken = createPlatformAdminToken(platformAdminUser);

  const createResponse = await app.inject({
    method: 'POST',
    url: '/platform-admin/tenants',
    headers: {
      authorization: `Bearer ${platformToken}`
    },
    payload: {
      name: 'Provider Validation Tenant',
      slug: TEST_PROVIDER_TENANT_SLUG,
      status: 'ACTIVE',
      type: 'CLINIC',
      brandingConfig: {
        displayName: 'Provider Validation Tenant',
        experiences: ['provider'],
        capabilities: ['provider_operations']
      }
    }
  });

  assert.equal(createResponse.statusCode, 201, createResponse.body);
  assert.equal(createResponse.json().type, 'CLINIC');

  const providerTenant = await prisma.tenant.findUniqueOrThrow({
    where: {
      slug: TEST_PROVIDER_TENANT_SLUG
    }
  });

  assert.equal(providerTenant.type, 'CLINIC');
  assert.equal(providerTenant.tenantTypeCode, 'CLINIC');

  const isolatedTenant = await prisma.tenant.create({
    data: {
      name: 'Isolated Tenant',
      slug: TEST_ISOLATED_TENANT_SLUG,
      status: 'ACTIVE',
      type: 'PAYER',
      tenantTypeCode: 'PAYER',
      brandingConfig: {}
    }
  });

  const [enterpriseUnit] = await Promise.all([
    prisma.organizationUnit.create({
      data: {
        tenantId: providerTenant.id,
        type: 'ENTERPRISE',
        name: 'Provider Validation Enterprise'
      }
    }),
    prisma.organizationUnit.create({
      data: {
        tenantId: isolatedTenant.id,
        type: 'ENTERPRISE',
        name: 'Foreign Enterprise'
      }
    })
  ]);

  await prisma.organizationUnit.createMany({
    data: [
      {
        tenantId: providerTenant.id,
        parentId: enterpriseUnit.id,
        type: 'LOCATION',
        name: 'Downtown Clinic'
      },
      {
        tenantId: providerTenant.id,
        parentId: enterpriseUnit.id,
        type: 'DEPARTMENT',
        name: 'Cardiology'
      }
    ]
  });

  const organizationUnitsResponse = await app.inject({
    method: 'GET',
    url: `/platform-admin/tenants/${providerTenant.id}/organization-units`,
    headers: {
      authorization: `Bearer ${platformToken}`
    }
  });

  assert.equal(organizationUnitsResponse.statusCode, 200, organizationUnitsResponse.body);
  const organizationUnits = organizationUnitsResponse.json() as Array<{
    tenantId: string;
    type: string;
    name: string;
  }>;

  assert.equal(organizationUnits.length, 3);
  assert.deepEqual(
    organizationUnits.map((unit) => unit.tenantId),
    [providerTenant.id, providerTenant.id, providerTenant.id]
  );
  assert.deepEqual(
    organizationUnits.map((unit) => unit.type).sort(),
    ['DEPARTMENT', 'ENTERPRISE', 'LOCATION']
  );
  assert.ok(
    organizationUnits.every((unit) =>
      ['Provider Validation Enterprise', 'Downtown Clinic', 'Cardiology'].includes(unit.name)
    )
  );
  assert.ok(
    organizationUnits.every((unit) => unit.tenantId !== isolatedTenant.id)
  );

  await app.close();
});

test('platform admins can import provider office locations from a delimited file into the provider hierarchy', async () => {
  const { platformAdminUser } = await createFixtureData();
  const app = Fastify();
  registerPlugins(app);
  await tenantRoutes(app);
  const platformToken = createPlatformAdminToken(platformAdminUser);

  const createResponse = await app.inject({
    method: 'POST',
    url: '/platform-admin/tenants',
    headers: {
      authorization: `Bearer ${platformToken}`
    },
    payload: {
      name: 'Provider Import Tenant',
      slug: TEST_PROVIDER_TENANT_SLUG,
      status: 'ACTIVE',
      type: 'CLINIC',
      brandingConfig: {
        displayName: 'Provider Import Tenant',
        capabilities: ['provider_operations', 'provider_reporting']
      }
    }
  });

  assert.equal(createResponse.statusCode, 201, createResponse.body);

  const providerTenant = await prisma.tenant.findUniqueOrThrow({
    where: {
      slug: TEST_PROVIDER_TENANT_SLUG
    }
  });

  const boundary = '----codex-provider-office-import-boundary';
  const importBody = buildMultipartBody({
    boundary,
    fieldName: 'file',
    fileName: 'office-locations.psv',
    contentType: 'text/plain',
    content:
      'Company|Location ID|Location Name|Street Address|City|State|Zip|Phone|Notes|Services Offered|Region|Active Flag\n' +
      'Apara Autism Centers|APARA-FLNT-01|Flint North|123 Maple Ave|Flint|MI|48503|810-555-0100|Main intake site|center-based, telehealth|Midwest|yes\n' +
      'Apara Autism Centers||Lansing East|456 Cedar St|Lansing|MI|48933|517-555-0199|Home-based dispatch hub|in-home|Midwest|true\n'
  });

  const importResponse = await app.inject({
    method: 'POST',
    url: `/platform-admin/tenants/${providerTenant.id}/office-locations/import`,
    headers: {
      authorization: `Bearer ${platformToken}`,
      'content-type': `multipart/form-data; boundary=${boundary}`
    },
    payload: importBody
  });

  assert.equal(importResponse.statusCode, 201, importResponse.body);
  assert.equal(importResponse.json().createdCount, 2);

  const organizationUnits = await prisma.organizationUnit.findMany({
    where: {
      tenantId: providerTenant.id
    },
    orderBy: [{ type: 'asc' }, { name: 'asc' }]
  });

  const enterprise = organizationUnits.find((unit) => unit.type === 'ENTERPRISE');
  const region = organizationUnits.find((unit) => unit.type === 'REGION');
  const importedLocations = organizationUnits.filter((unit) => unit.type === 'LOCATION');

  assert.ok(enterprise);
  assert.ok(region);
  assert.equal(region?.parentId, enterprise?.id ?? null);
  assert.equal(importedLocations.length, 2);
  assert.ok(importedLocations.every((unit) => unit.parentId === region?.id));

  const flintLocation = importedLocations.find((unit) => unit.name === 'Flint North');
  const metadata = flintLocation?.metadata as
    | {
        company?: string;
        address?: { city?: string; state?: string; zip?: string; streetAddress?: string };
        phone?: string;
        notes?: string;
      }
    | null
    | undefined;

  assert.equal(metadata?.company, 'Apara Autism Centers');
  assert.equal(metadata?.locationId, 'APARA-FLNT-01');
  assert.equal(metadata?.address?.city, 'Flint');
  assert.equal(metadata?.address?.streetAddress, '123 Maple Ave');
  assert.equal(metadata?.phone, '810-555-0100');
  assert.equal(metadata?.notes, 'Main intake site');
  assert.equal(metadata?.region, 'Midwest');
  assert.deepEqual(metadata?.servicesOffered, ['center-based', 'telehealth']);
  assert.equal(metadata?.activeFlag, true);

  const lansingLocation = importedLocations.find((unit) => unit.name === 'Lansing East');
  const lansingMetadata = lansingLocation?.metadata as
    | {
        activeFlag?: boolean;
        locationId?: string;
        servicesOffered?: string[];
      }
    | null
    | undefined;

  assert.match(lansingMetadata?.locationId ?? '', /^APAR-/);
  assert.deepEqual(lansingMetadata?.servicesOffered, ['in-home']);

  const editResponse = await app.inject({
    method: 'PATCH',
    url: `/platform-admin/tenants/${providerTenant.id}/organization-units/${flintLocation?.id}`,
    headers: {
      authorization: `Bearer ${platformToken}`
    },
    payload: {
      name: 'Flint North Clinic',
      region: 'Texas',
      activeFlag: false,
      servicesOffered: ['center-based', 'telehealth', 'in-home'],
      notes: 'Updated by platform admin'
    }
  });

  assert.equal(editResponse.statusCode, 200, editResponse.body);

  const editedLocation = await prisma.organizationUnit.findUniqueOrThrow({
    where: {
      id: flintLocation!.id
    }
  });
  const editedMetadata = editedLocation.metadata as
    | {
        activeFlag?: boolean;
        notes?: string;
        region?: string;
        servicesOffered?: string[];
      }
    | null
    | undefined;

  assert.equal(editedLocation.name, 'Flint North Clinic');
  assert.equal(editedMetadata?.region, 'Texas');
  assert.equal(editedMetadata?.activeFlag, false);
  assert.deepEqual(editedMetadata?.servicesOffered, [
    'center-based',
    'telehealth',
    'in-home'
  ]);
  assert.equal(editedMetadata?.notes, 'Updated by platform admin');

  await app.close();
});

test('platform admins can create, re-parent, edit, and delete tenant organization units', async () => {
  const { platformAdminUser } = await createFixtureData();
  const app = Fastify();
  registerPlugins(app);
  await tenantRoutes(app);
  const platformToken = createPlatformAdminToken(platformAdminUser);

  const createTenantResponse = await app.inject({
    method: 'POST',
    url: '/platform-admin/tenants',
    headers: {
      authorization: `Bearer ${platformToken}`
    },
    payload: {
      name: 'Clinic OU Admin Tenant',
      slug: TEST_CLINIC_OU_TENANT_SLUG,
      status: 'ACTIVE',
      type: 'CLINIC',
      brandingConfig: {
        displayName: 'Clinic OU Admin Tenant'
      }
    }
  });

  assert.equal(createTenantResponse.statusCode, 201, createTenantResponse.body);

  const tenant = await prisma.tenant.findUniqueOrThrow({
    where: {
      slug: TEST_CLINIC_OU_TENANT_SLUG
    }
  });

  const enterpriseResponse = await app.inject({
    method: 'POST',
    url: `/platform-admin/tenants/${tenant.id}/organization-units`,
    headers: {
      authorization: `Bearer ${platformToken}`
    },
    payload: {
      name: 'Clinic Enterprise',
      type: 'ENTERPRISE'
    }
  });

  assert.equal(enterpriseResponse.statusCode, 201, enterpriseResponse.body);
  const enterpriseUnit = enterpriseResponse.json() as { id: string };

  const locationResponse = await app.inject({
    method: 'POST',
    url: `/platform-admin/tenants/${tenant.id}/organization-units`,
    headers: {
      authorization: `Bearer ${platformToken}`
    },
    payload: {
      name: 'Flint North',
      parentId: enterpriseUnit.id,
      type: 'LOCATION',
      city: 'Flint',
      state: 'MI',
      streetAddress: '123 Maple Ave'
    }
  });

  assert.equal(locationResponse.statusCode, 201, locationResponse.body);
  const locationUnit = locationResponse.json() as { id: string };

  const teamResponse = await app.inject({
    method: 'POST',
    url: `/platform-admin/tenants/${tenant.id}/organization-units`,
    headers: {
      authorization: `Bearer ${platformToken}`
    },
    payload: {
      name: 'Clinical Team',
      parentId: enterpriseUnit.id,
      type: 'TEAM'
    }
  });

  assert.equal(teamResponse.statusCode, 201, teamResponse.body);
  const teamUnit = teamResponse.json() as { id: string };

  const reparentResponse = await app.inject({
    method: 'PATCH',
    url: `/platform-admin/tenants/${tenant.id}/organization-units/${teamUnit.id}`,
    headers: {
      authorization: `Bearer ${platformToken}`
    },
    payload: {
      name: 'Clinical Team Alpha',
      parentId: locationUnit.id,
      type: 'TEAM'
    }
  });

  assert.equal(reparentResponse.statusCode, 200, reparentResponse.body);

  const blockedDeleteResponse = await app.inject({
    method: 'DELETE',
    url: `/platform-admin/tenants/${tenant.id}/organization-units/${locationUnit.id}`,
    headers: {
      authorization: `Bearer ${platformToken}`
    }
  });

  assert.equal(blockedDeleteResponse.statusCode, 400, blockedDeleteResponse.body);
  assert.match(
    blockedDeleteResponse.body,
    /child units/i
  );

  const deleteTeamResponse = await app.inject({
    method: 'DELETE',
    url: `/platform-admin/tenants/${tenant.id}/organization-units/${teamUnit.id}`,
    headers: {
      authorization: `Bearer ${platformToken}`
    }
  });

  assert.equal(deleteTeamResponse.statusCode, 200, deleteTeamResponse.body);

  const deleteLocationResponse = await app.inject({
    method: 'DELETE',
    url: `/platform-admin/tenants/${tenant.id}/organization-units/${locationUnit.id}`,
    headers: {
      authorization: `Bearer ${platformToken}`
    }
  });

  assert.equal(deleteLocationResponse.statusCode, 200, deleteLocationResponse.body);

  const organizationUnitsResponse = await app.inject({
    method: 'GET',
    url: `/platform-admin/tenants/${tenant.id}/organization-units`,
    headers: {
      authorization: `Bearer ${platformToken}`
    }
  });

  assert.equal(organizationUnitsResponse.statusCode, 200, organizationUnitsResponse.body);
  const organizationUnits = organizationUnitsResponse.json() as Array<{
    id: string;
    name: string;
    parentId: string | null;
    type: string;
  }>;

  assert.deepEqual(
    organizationUnits.map((unit) => ({
      id: unit.id,
      name: unit.name,
      parentId: unit.parentId,
      type: unit.type
    })),
    [
      {
        id: enterpriseUnit.id,
        name: 'Clinic Enterprise',
        parentId: null,
        type: 'ENTERPRISE'
      }
    ]
  );

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

test('platform admins can upload tenant logos and the public tenant asset route serves them', async () => {
  const { tenant, platformAdminUser } = await createFixtureData();
  const app = Fastify();
  await registerPlugins(app);
  await tenantRoutes(app);
  await publicAssetRoutes(app);
  const platformToken = createPlatformAdminToken(platformAdminUser);
  const boundary = '----codex-tenant-logo-boundary';
  const svgContent =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" fill="#0f6cbd"/></svg>';

  const uploadResponse = await app.inject({
    method: 'POST',
    url: `/platform-admin/tenants/${tenant.id}/logo`,
    headers: {
      authorization: `Bearer ${platformToken}`,
      'content-type': `multipart/form-data; boundary=${boundary}`
    },
    payload: buildMultipartBody({
      boundary,
      fieldName: 'file',
      fileName: 'logo.svg',
      contentType: 'image/svg+xml',
      content: svgContent
    })
  });

  assert.equal(uploadResponse.statusCode, 201, uploadResponse.body);
  const branding = uploadResponse.json() as {
    tenantId: string;
    logoUrl: string | null;
  };

  assert.equal(branding.tenantId, tenant.id);
  assert.match(
    branding.logoUrl ?? '',
    new RegExp(`^/tenant-assets/tenant/${tenant.id}/logos/tenant-logo\\.svg$`)
  );

  const publicAssetResponse = await app.inject({
    method: 'GET',
    url: branding.logoUrl ?? '/tenant-assets/missing'
  });

  assert.equal(publicAssetResponse.statusCode, 200, publicAssetResponse.body);
  assert.equal(publicAssetResponse.headers['content-type'], 'image/svg+xml');
  assert.match(publicAssetResponse.body, /svg/);

  await app.close();
});
