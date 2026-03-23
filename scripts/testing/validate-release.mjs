import { spawnSync } from 'node:child_process';

import {
  expectHttpStatus,
  printCheck
} from './local-stack-harness.mjs';
import { resolveReleaseOrigins } from './release-validation-config.mjs';
import {
  formatAuthenticatedCoverageSummary,
  validateReleaseWorkflows
} from './release-workflows.mjs';

const origins = resolveReleaseOrigins(process.env);

const rollbackCommand = process.env.RELEASE_ROLLBACK_COMMAND?.trim() ?? '';

function runCommand(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: process.cwd(),
    stdio: 'inherit',
    env: process.env,
    ...options
  });

  if (result.status !== 0) {
    throw new Error(`Command failed: ${command} ${args.join(' ')}`);
  }
}

function runMigrationDeploy() {
  console.log('Running release migration step with prisma migrate deploy.');
  runCommand('pnpm', [
    '--filter',
    '@payer-portal/database',
    'exec',
    'prisma',
    'migrate',
    'deploy',
    '--schema',
    './prisma/schema.prisma'
  ]);
  printCheck('database migrations', 'prisma migrate deploy completed');

  runCommand('pnpm', [
    '--filter',
    '@payer-portal/database',
    'exec',
    'prisma',
    'migrate',
    'status',
    '--schema',
    './prisma/schema.prisma'
  ]);
  printCheck('database migration status', 'all migrations applied successfully');
}

async function assertServiceReachable(name, url, expectedStatuses = [200]) {
  const response = await expectHttpStatus(url, expectedStatuses);
  printCheck(`${name} reachable`, `${response.status} ${url}`);
}

async function validateServiceReachability() {
  await assertServiceReachable('api liveness', `${origins.api}/liveness`);
  await assertServiceReachable('portal liveness', `${origins.portal}/liveness`);
  await assertServiceReachable('admin liveness', `${origins.admin}/liveness`);
}

async function validateHealthChecks() {
  await assertServiceReachable('api readiness', `${origins.api}/readiness`);
  await assertServiceReachable('api overall health', `${origins.api}/health`);
  await assertServiceReachable('portal readiness', `${origins.portal}/readiness`);
  await assertServiceReachable('portal overall health', `${origins.portal}/health`);
  await assertServiceReachable('admin readiness', `${origins.admin}/readiness`);
  await assertServiceReachable('admin overall health', `${origins.admin}/health`);
}

function shouldTriggerRollback(stage) {
  return ['migration', 'reachability', 'health', 'workflow'].includes(stage);
}

function triggerRollback(stage, error) {
  if (!rollbackCommand) {
    console.error(
      `Rollback trigger skipped for ${stage} failure because RELEASE_ROLLBACK_COMMAND is not configured.`
    );
    return;
  }

  console.error(
    `Triggering rollback because ${stage} validation failed: ${
      error instanceof Error ? error.message : String(error)
    }`
  );

  const result = spawnSync('bash', ['-lc', rollbackCommand], {
    cwd: process.cwd(),
    stdio: 'inherit',
    env: {
      ...process.env,
      RELEASE_FAILURE_STAGE: stage,
      RELEASE_FAILURE_MESSAGE:
        error instanceof Error ? error.message : String(error)
    }
  });

  if (result.status !== 0) {
    console.error(
      `Rollback command failed with exit code ${result.status ?? 'unknown'}.`
    );
  }
}

async function main() {
  let stage = 'migration';
  let coverageSummary = 'AUTHENTICATED_RELEASE_COVERAGE status=SKIPPED missing=unknown';

  try {
    runMigrationDeploy();

    stage = 'reachability';
    await validateServiceReachability();

    stage = 'health';
    await validateHealthChecks();

    stage = 'workflow';
    const coverage = await validateReleaseWorkflows(origins);
    coverageSummary = formatAuthenticatedCoverageSummary(coverage);

    console.log(`Release validation passed. ${coverageSummary}`);
  } catch (error) {
    if (shouldTriggerRollback(stage)) {
      triggerRollback(stage, error);
    }

    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

main();
