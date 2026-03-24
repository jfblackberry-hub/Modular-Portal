# Migration Rehearsal Plan

## Goal

Prove that the deployment, migration, and validation sequence works end to end before production cutover.

## Rehearsal Steps

1. Snapshot the staging database.
2. Deploy the target application version to staging.
3. Run database migrations.
4. Run release validation:
   - `pnpm run validate:release`
5. Run smoke and integration tests:
   - `pnpm run test:smoke`
   - `pnpm run test:integration`
6. Verify:
   - portal login
   - admin login
   - tenant-admin routes
   - platform-admin routes
   - worker is consuming jobs
   - backup configuration task succeeds
7. Review logs and metrics for:
   - 5xx spikes
   - auth failures
   - job failures
   - storage failures

## Exit Criteria

- migrations complete without manual intervention
- release validation passes
- smoke and integration suites pass
- no blocking auth/session regressions
- no worker backlog growth caused by the deployment
