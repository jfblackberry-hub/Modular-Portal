import assert from 'node:assert/strict';
import { after, beforeEach, test } from 'node:test';

process.env.DATABASE_URL ??=
  'postgresql://dev:dev@127.0.0.1:5432/payer_portal?schema=public';

import { hashPassword, prisma, syncTenantTypeDefinitions } from '@payer-portal/database';
import { runNextJob } from '@payer-portal/server';
import Fastify from 'fastify';

import { providerWorkflowRoutes } from '../src/routes/provider-workflows.js';
import { createAccessToken } from '../src/services/access-token-service.js';

const TEST_PROVIDER_TENANT_SLUG = 'provider-workflow-test-tenant';
const TEST_OTHER_PROVIDER_TENANT_SLUG = 'provider-workflow-other-tenant';
const TEST_PROVIDER_EMAIL = 'provider-workflow-user@example.com';
const TEST_PROVIDER_ROLE_CODE = 'provider-workflow-clinic-manager';

async function cleanupProviderWorkflowFixtures() {
  await prisma.$executeRawUnsafe('TRUNCATE TABLE audit_logs');
  await prisma.providerWorkflowExecution.deleteMany({
    where: {
      tenant: {
        slug: {
          in: [TEST_PROVIDER_TENANT_SLUG, TEST_OTHER_PROVIDER_TENANT_SLUG]
        }
      }
    }
  });
  await prisma.job.deleteMany({
    where: {
      type: 'provider.workflow.execute'
    }
  });
  await prisma.userCredential.deleteMany({
    where: {
      user: {
        email: TEST_PROVIDER_EMAIL
      }
    }
  });
  await prisma.userRole.deleteMany({
    where: {
      user: {
        email: TEST_PROVIDER_EMAIL
      }
    }
  });
  await prisma.userOrganizationUnitAssignment.deleteMany({
    where: {
      user: {
        email: TEST_PROVIDER_EMAIL
      }
    }
  });
  await prisma.userTenantMembership.deleteMany({
    where: {
      user: {
        email: TEST_PROVIDER_EMAIL
      }
    }
  });
  await prisma.user.deleteMany({
    where: {
      email: TEST_PROVIDER_EMAIL
    }
  });
  await prisma.organizationUnit.deleteMany({
    where: {
      tenant: {
        slug: {
          in: [TEST_PROVIDER_TENANT_SLUG, TEST_OTHER_PROVIDER_TENANT_SLUG]
        }
      }
    }
  });
  await prisma.tenant.deleteMany({
    where: {
      slug: {
        in: [TEST_PROVIDER_TENANT_SLUG, TEST_OTHER_PROVIDER_TENANT_SLUG]
      }
    }
  });
  await prisma.rolePermission.deleteMany({
    where: {
      role: {
        code: TEST_PROVIDER_ROLE_CODE
      }
    }
  });
  await prisma.role.deleteMany({
    where: {
      code: TEST_PROVIDER_ROLE_CODE
    }
  });
  await prisma.permission.deleteMany({
    where: {
      code: 'provider.view'
    }
  });
}

async function createProviderWorkflowFixture() {
  await syncTenantTypeDefinitions(prisma);

  const permission = await prisma.permission.upsert({
    where: { code: 'provider.view' },
    update: {
      name: 'Provider View'
    },
    create: {
      code: 'provider.view',
      name: 'Provider View'
    }
  });

  const role = await prisma.role.create({
    data: {
      code: TEST_PROVIDER_ROLE_CODE,
      name: 'Provider Workflow Clinic Manager',
      tenantTypeCode: 'PROVIDER'
    }
  });

  await prisma.rolePermission.create({
    data: {
      roleId: role.id,
      permissionId: permission.id
    }
  });

  const tenant = await prisma.tenant.create({
    data: {
      name: 'Provider Workflow Test Tenant',
      slug: TEST_PROVIDER_TENANT_SLUG,
      type: 'PROVIDER',
      tenantTypeCode: 'PROVIDER',
      status: 'ACTIVE',
      isActive: true,
      brandingConfig: {}
    }
  });

  const otherTenant = await prisma.tenant.create({
    data: {
      name: 'Provider Workflow Other Tenant',
      slug: TEST_OTHER_PROVIDER_TENANT_SLUG,
      type: 'PROVIDER',
      tenantTypeCode: 'PROVIDER',
      status: 'ACTIVE',
      isActive: true,
      brandingConfig: {}
    }
  });

  const [defaultOrgUnit, alternateOrgUnit] = await Promise.all([
    prisma.organizationUnit.create({
      data: {
        tenantId: tenant.id,
        name: 'Flint Clinic',
        type: 'LOCATION'
      }
    }),
    prisma.organizationUnit.create({
      data: {
        tenantId: tenant.id,
        name: 'Lansing Clinic',
        type: 'LOCATION'
      }
    })
  ]);

  const user = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      email: TEST_PROVIDER_EMAIL,
      firstName: 'Jordan',
      lastName: 'Lee',
      isActive: true,
      status: 'ACTIVE'
    }
  });

  await prisma.userCredential.create({
    data: {
      userId: user.id,
      passwordHash: hashPassword('demo12345'),
      passwordSetAt: new Date()
    }
  });

  await prisma.userTenantMembership.create({
    data: {
      userId: user.id,
      tenantId: tenant.id,
      organizationUnitId: defaultOrgUnit.id,
      isDefault: true,
      status: 'ACTIVE',
      activatedAt: new Date()
    }
  });

  await prisma.userOrganizationUnitAssignment.createMany({
    data: [
      {
        userId: user.id,
        tenantId: tenant.id,
        organizationUnitId: defaultOrgUnit.id,
        isDefault: true
      },
      {
        userId: user.id,
        tenantId: tenant.id,
        organizationUnitId: alternateOrgUnit.id,
        isDefault: false
      }
    ]
  });

  await prisma.userRole.create({
    data: {
      userId: user.id,
      roleId: role.id,
      tenantId: tenant.id
    }
  });

  const token = createAccessToken({
    userId: user.id,
    email: user.email,
    tenantId: tenant.id,
    sessionType: 'end_user',
    activeOrganizationUnitId: defaultOrgUnit.id,
    activePersonaCode: 'clinic_manager'
  });

  return {
    tenant,
    otherTenant,
    defaultOrgUnit,
    alternateOrgUnit,
    user,
    token
  };
}

beforeEach(async () => {
  await cleanupProviderWorkflowFixtures();
});

after(async () => {
  await cleanupProviderWorkflowFixtures();
  await prisma.$disconnect();
});

test('provider workflow actions are initiated through centralized routing and produce disposition audit records', async () => {
  const fixture = await createProviderWorkflowFixture();
  const app = Fastify();
  await providerWorkflowRoutes(app);

  const createResponse = await app.inject({
    method: 'POST',
    url: '/api/provider/workflows',
    headers: {
      authorization: `Bearer ${fixture.token}`,
      'x-tenant-id': fixture.tenant.id,
      'user-agent': 'provider-workflow-test'
    },
    payload: {
      actionType: 'claim_resubmission',
      capabilityId: 'provider_operations',
      widgetId: 'claims',
      targetType: 'claim',
      targetId: 'CLM-100233',
      targetLabel: 'CLM-100233',
      reason: 'Corrected claim resubmission requested by provider user.',
      payload: {
        correctedCodes: ['99213']
      }
    }
  });

  assert.equal(createResponse.statusCode, 201);
  const createdWorkflow = createResponse.json();
  assert.equal(createdWorkflow.status, 'PENDING');
  assert.equal(createdWorkflow.organizationUnitId, fixture.defaultOrgUnit.id);
  assert.equal(createdWorkflow.personaCode, 'clinic_manager');

  const enqueuedJob = await prisma.job.findFirst({
    where: {
      id: createdWorkflow.jobId
    }
  });

  assert.ok(enqueuedJob);
  assert.equal(enqueuedJob?.type, 'provider.workflow.execute');

  const initiationAudit = await prisma.auditLog.findFirst({
    where: {
      entityId: createdWorkflow.id,
      action: 'provider.workflow.initiated'
    }
  });

  assert.ok(initiationAudit);
  assert.equal(initiationAudit?.tenantId, fixture.tenant.id);

  const processed = await runNextJob({ tenantId: fixture.tenant.id });
  assert.equal(processed, true);

  const getResponse = await app.inject({
    method: 'GET',
    url: `/api/provider/workflows/${createdWorkflow.id}`,
    headers: {
      authorization: `Bearer ${fixture.token}`,
      'x-tenant-id': fixture.tenant.id
    }
  });

  assert.equal(getResponse.statusCode, 200);
  const completedWorkflow = getResponse.json();
  assert.equal(completedWorkflow.status, 'SUCCEEDED');
  assert.equal(
    completedWorkflow.audit.dispositionAction,
    'provider.workflow.disposition.succeeded'
  );

  const completionAudit = await prisma.auditLog.findFirst({
    where: {
      entityId: createdWorkflow.id,
      action: 'provider.workflow.disposition.succeeded'
    }
  });

  assert.ok(completionAudit);
});

test('provider workflow routing refuses mid-session organization unit switching attempts', async () => {
  const fixture = await createProviderWorkflowFixture();
  const app = Fastify();
  await providerWorkflowRoutes(app);

  const response = await app.inject({
    method: 'POST',
    url: '/api/provider/workflows',
    headers: {
      authorization: `Bearer ${fixture.token}`,
      'x-tenant-id': fixture.tenant.id
    },
    payload: {
      actionType: 'authorization_update',
      capabilityId: 'provider_operations',
      widgetId: 'authorizations',
      targetType: 'authorization',
      targetId: 'PA-100233',
      orgUnitId: fixture.alternateOrgUnit.id
    }
  });

  assert.equal(response.statusCode, 403);
  assert.match(
    response.body,
    /Organization Unit scope is fixed for the active session/
  );
});
