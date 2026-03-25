import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const PAYER_TENANT_SLUG = 'blue-horizon-health';

const employerGroups = [
  {
    employerKey: 'EMP-0316043829906172-001',
    name: 'Northstar Manufacturing',
    logoUrl: '/tenant-assets/northstar-logo.svg'
  },
  {
    employerKey: 'EMP-0316043829906172-002',
    name: 'Lakeside Retail Group',
    logoUrl: '/tenant-assets/lakeside-retail-group-logo.png'
  }
] as const;

async function main() {
  const tenant = await prisma.tenant.findUnique({
    where: { slug: PAYER_TENANT_SLUG },
    select: { id: true, slug: true, name: true }
  });

  if (!tenant) {
    throw new Error(
      `Tenant ${PAYER_TENANT_SLUG} not found. Run the base database seed before seeding employer groups.`
    );
  }

  const seededGroups = await Promise.all(
    employerGroups.map((group) =>
      prisma.employerGroup.upsert({
        where: {
          tenantId_employerKey: {
            tenantId: tenant.id,
            employerKey: group.employerKey
          }
        },
        update: {
          name: group.name,
          logoUrl: group.logoUrl,
          isActive: true,
          brandingConfig: {
            employerGroupName: group.name,
            employerGroupLogoUrl: group.logoUrl
          }
        },
        create: {
          tenantId: tenant.id,
          employerKey: group.employerKey,
          name: group.name,
          logoUrl: group.logoUrl,
          isActive: true,
          brandingConfig: {
            employerGroupName: group.name,
            employerGroupLogoUrl: group.logoUrl
          }
        }
      })
    )
  );

  console.log(
    JSON.stringify(
      seededGroups.map((group) => ({
        employerKey: group.employerKey,
        name: group.name,
        isActive: group.isActive
      })),
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
