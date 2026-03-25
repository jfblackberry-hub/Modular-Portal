import { PrismaClient } from '@prisma/client';

import {
  seedTestProviderTenant,
  TEST_PROVIDER_TENANT
} from './provider-tenant-seed.js';

const prisma = new PrismaClient();

async function main() {
  const result = await seedTestProviderTenant(prisma);

  console.log(
    `Seeded ${TEST_PROVIDER_TENANT.type} tenant ${result.tenant.name} (${result.tenant.slug}).`
  );
  console.log(`Tenant id: ${result.tenant.id}`);
  console.log(
    `Organization units: ${result.organizationUnits.enterprise.name} -> ${result.organizationUnits.region.name} -> ${result.organizationUnits.flintClinic.name}/${result.organizationUnits.lansingClinic.name}`
  );
  console.log(
    `Seeded users: ${Object.values(TEST_PROVIDER_TENANT.users)
      .map((user) => `${user.roleName} <${user.email}>`)
      .join(', ')}`
  );
}

main()
  .catch(async (error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
