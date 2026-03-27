import assert from 'node:assert/strict';

import { PrismaClient } from '@prisma/client';

import { TEST_PROVIDER_TENANT } from './provider-tenant-seed.js';

const prisma = new PrismaClient();

type CheckResult = {
  name: string;
  status: 'pass' | 'fail' | 'blocked';
  detail: string;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

async function main() {
  const checks: CheckResult[] = [];

  try {
    const tenant = await prisma.tenant.findUnique({
      where: {
        slug: TEST_PROVIDER_TENANT.slug
      },
      include: {
        memberships: {
          include: {
            user: {
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
                }
              }
            }
          }
        },
        featureFlags: true,
        documents: true,
        notifications: true,
        connectorConfigs: true,
        jobs: true,
        organizationUnits: true
      }
    });

    assert.ok(tenant, `Tenant ${TEST_PROVIDER_TENANT.slug} was not found.`);
    checks.push({
      name: 'tenant.exists',
      status: 'pass',
      detail: `${tenant.name} (${tenant.slug}) exists.`
    });

    assert.equal(tenant.type, 'CLINIC');
    assert.equal(tenant.status, 'ACTIVE');
    checks.push({
      name: 'tenant.core-shape',
      status: 'pass',
      detail: 'Tenant type/status match CLINIC + ACTIVE.'
    });

    const brandingConfig = asRecord(tenant.brandingConfig);
    assert.ok(brandingConfig, 'brandingConfig must be an object.');
    const purchasedModules = Array.isArray(brandingConfig.purchasedModules)
      ? brandingConfig.purchasedModules
      : [];
    for (const moduleKey of TEST_PROVIDER_TENANT.purchasedModules) {
      assert.ok(
        purchasedModules.includes(moduleKey),
        `Missing purchased module ${moduleKey}.`
      );
    }
    checks.push({
      name: 'tenant.licensing',
      status: 'pass',
      detail: `Purchased modules include ${TEST_PROVIDER_TENANT.purchasedModules.join(', ')}.`
    });

    const providerPluginFlag = tenant.featureFlags.find(
      (flag) => flag.key === 'plugins.provider.enabled'
    );
    const adminConsoleFlag = tenant.featureFlags.find(
      (flag) => flag.key === 'admin-console-enabled'
    );
    assert.equal(providerPluginFlag?.enabled, true);
    assert.equal(adminConsoleFlag?.enabled, true);
    checks.push({
      name: 'tenant.feature-flags',
      status: 'pass',
      detail: 'Provider plugin and admin-console flags are enabled for the provider tenant.'
    });

    const ouByName = new Map(tenant.organizationUnits.map((unit) => [unit.name, unit]));
    const enterprise = ouByName.get(TEST_PROVIDER_TENANT.organizationUnits.enterprise);
    const region = ouByName.get(TEST_PROVIDER_TENANT.organizationUnits.region);
    const flint = ouByName.get(TEST_PROVIDER_TENANT.organizationUnits.locations.flint);
    const lansing = ouByName.get(TEST_PROVIDER_TENANT.organizationUnits.locations.lansing);
    const primaryCare = ouByName.get(TEST_PROVIDER_TENANT.organizationUnits.departments.primaryCare);
    const cardiology = ouByName.get(TEST_PROVIDER_TENANT.organizationUnits.departments.cardiology);
    const revenueCycle = ouByName.get(TEST_PROVIDER_TENANT.organizationUnits.departments.revenueCycle);

    assert.equal(enterprise?.type, 'ENTERPRISE');
    assert.equal(enterprise?.parentId, null);
    assert.equal(region?.type, 'REGION');
    assert.equal(region?.parentId, enterprise?.id);
    assert.equal(flint?.type, 'LOCATION');
    assert.equal(flint?.parentId, region?.id);
    assert.equal(lansing?.type, 'LOCATION');
    assert.equal(lansing?.parentId, region?.id);
    assert.equal(primaryCare?.type, 'DEPARTMENT');
    assert.equal(primaryCare?.parentId, flint?.id);
    assert.equal(cardiology?.type, 'DEPARTMENT');
    assert.equal(cardiology?.parentId, flint?.id);
    assert.equal(revenueCycle?.type, 'DEPARTMENT');
    assert.equal(revenueCycle?.parentId, lansing?.id);
    checks.push({
      name: 'tenant.organization-units',
      status: 'pass',
      detail: 'Canonical OU hierarchy persisted with valid parent-child relationships.'
    });

    const usersByEmail = new Map(
      tenant.memberships.map((membership) => [membership.user.email, membership])
    );

    for (const seedUser of Object.values(TEST_PROVIDER_TENANT.users)) {
      const membership = usersByEmail.get(seedUser.email);
      assert.ok(membership, `Missing user ${seedUser.email}.`);
      const roleCodes = membership.user.roles.map(({ role }) => role.code);
      assert.ok(
        roleCodes.includes(seedUser.roleCode),
        `User ${seedUser.email} missing role ${seedUser.roleCode}.`
      );

      const permissionCodes = new Set(
        membership.user.roles.flatMap(({ role }) =>
          role.permissions.map(({ permission }) => permission.code)
        )
      );

      for (const permissionCode of seedUser.permissionCodes) {
        assert.ok(
          permissionCodes.has(permissionCode),
          `User ${seedUser.email} missing permission ${permissionCode}.`
        );
      }
    }

    checks.push({
      name: 'tenant.users-and-access',
      status: 'pass',
      detail: 'Seeded provider users, memberships, roles, and permissions match the trusted authorization model.'
    });

    assert.ok(tenant.documents.length >= 3, 'Expected seeded provider documents.');
    assert.ok(tenant.notifications.length >= 3, 'Expected seeded provider notifications.');
    assert.ok(tenant.connectorConfigs.length >= 2, 'Expected seeded provider connectors.');
    assert.ok(tenant.jobs.length >= 3, 'Expected seeded provider jobs.');
    checks.push({
      name: 'tenant.workflow-data',
      status: 'pass',
      detail: 'Provider documents, notifications, connectors, and jobs are present and tenant-scoped.'
    });

    const providerDemoData = asRecord(brandingConfig.providerDemoData);
    assert.ok(providerDemoData, 'Expected brandingConfig.providerDemoData.');
    const demoData = asRecord(providerDemoData.demoData);
    assert.ok(Array.isArray(demoData?.eligibilityResults));
    assert.ok(Array.isArray(demoData?.trackedAuthorizations));
    assert.ok(Array.isArray(demoData?.claimsRows));
    assert.ok(Array.isArray(demoData?.paymentRows));
    checks.push({
      name: 'tenant.provider-demo-data',
      status: 'pass',
      detail: 'Tenant-scoped provider demo data is present for core provider workflow screens.'
    });

    const leakageCount = await prisma.user.count({
      where: {
        email: {
          in: Object.values(TEST_PROVIDER_TENANT.users).map((user) => user.email)
        },
        memberships: {
          some: {
            tenantId: {
              not: tenant.id
            }
          }
        }
      }
    });

    assert.equal(leakageCount, 0);
    checks.push({
      name: 'tenant.isolation',
      status: 'pass',
      detail: 'Seeded provider users are not attached to other tenants.'
    });
  } catch (error) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'name' in error &&
      error.name === 'PrismaClientInitializationError'
    ) {
      checks.push({
        name: 'database.connectivity',
        status: 'blocked',
        detail: 'Database unavailable. Start PostgreSQL and rerun validation.'
      });
    } else {
      checks.push({
        name: 'provider-tenant-validation',
        status: 'fail',
        detail: error instanceof Error ? error.message : 'Unknown validation failure.'
      });
    }
  } finally {
    await prisma.$disconnect();
  }

  for (const check of checks) {
    const label = check.status.toUpperCase().padEnd(7, ' ');
    console.log(`${label} ${check.name} - ${check.detail}`);
  }

  const hasFailure = checks.some((check) => check.status === 'fail');
  if (hasFailure) {
    process.exitCode = 1;
  }
}

await main();
