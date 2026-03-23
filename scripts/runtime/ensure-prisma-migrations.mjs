#!/usr/bin/env node

import { spawnSync } from 'node:child_process';

const serviceName = process.argv[2] ?? process.env.APP_NAME ?? 'service';
const nodeEnv = process.env.NODE_ENV ?? 'development';
const requireCheck =
  (process.env.REQUIRE_PRISMA_MIGRATIONS ?? (nodeEnv === 'production' || nodeEnv === 'staging' ? 'true' : 'false'))
    .trim()
    .toLowerCase();

if (!['1', 'true', 'yes', 'on'].includes(requireCheck)) {
  process.exit(0);
}

if (!process.env.DATABASE_URL?.trim()) {
  console.error(
    `[${serviceName}] DATABASE_URL is required when Prisma migration checks are enabled.`
  );
  process.exit(1);
}

const result = spawnSync(
  process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm',
  [
    '--filter',
    '@payer-portal/database',
    'exec',
    'prisma',
    'migrate',
    'status',
    '--schema',
    './prisma/schema.prisma'
  ],
  {
    cwd: process.cwd(),
    env: process.env,
    stdio: 'inherit'
  }
);

if (result.status !== 0) {
  console.error(
    `[${serviceName}] Prisma migrations are not fully applied. Run prisma migrate deploy before startup.`
  );
  process.exit(result.status ?? 1);
}
