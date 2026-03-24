import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const defaultSnapshotPath = path.resolve(
  process.cwd(),
  'backups/golden/2026-03-23-regression-pass/database-snapshot.json'
);

const creationOrder = [
  'Tenant',
  'TenantBranding',
  'Permission',
  'Role',
  'RolePermission',
  'EmployerGroup',
  'User',
  'UserRole',
  'UserTenantMembership',
  'FeatureFlag',
  'AuditLog',
  'Job',
  'Document',
  'Notification',
  'ConnectorConfig',
  'IntegrationExecution',
  'ApiCatalogEntry',
  'EventRecord',
  'EventDelivery',
  'PortalAuthHandoff',
  'PreviewSession'
];

function delegateName(modelName) {
  return modelName.charAt(0).toLowerCase() + modelName.slice(1);
}

function chunk(array, size = 500) {
  const output = [];

  for (let index = 0; index < array.length; index += size) {
    output.push(array.slice(index, index + size));
  }

  return output;
}

async function truncateAllTables() {
  const quotedTables = creationOrder
    .slice()
    .reverse()
    .map((modelName) => `"${modelName}"`)
    .join(', ');

  await prisma.$executeRawUnsafe(
    `TRUNCATE TABLE ${quotedTables} RESTART IDENTITY CASCADE;`
  );
}

async function restoreModel(modelName, rows) {
  if (!rows || rows.length === 0) {
    return;
  }

  const delegate = prisma[delegateName(modelName)];

  if (!delegate || typeof delegate.createMany !== 'function') {
    throw new Error(`Prisma delegate unavailable for ${modelName}.`);
  }

  for (const batch of chunk(rows)) {
    await delegate.createMany({
      data: batch
    });
  }
}

async function main() {
  const snapshotPath = process.argv[2]
    ? path.resolve(process.cwd(), process.argv[2])
    : defaultSnapshotPath;
  const raw = await readFile(snapshotPath, 'utf8');
  const snapshot = JSON.parse(raw);

  if (snapshot.format !== 'prisma-json-snapshot') {
    throw new Error(`Unsupported golden dataset format: ${snapshot.format}`);
  }

  await truncateAllTables();

  for (const modelName of creationOrder) {
    await restoreModel(modelName, snapshot.models?.[modelName] ?? []);
  }

  console.log(`Golden dataset restored from ${snapshotPath}`);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
