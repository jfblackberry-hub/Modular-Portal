# Production Cutover Runbook

## Pre-Cutover

1. Confirm the migration rehearsal passed on staging.
2. Confirm backups are current.
3. Confirm the deployment artifact versions for:
   - `portal-web`
   - `admin-console`
   - `api`
   - `job-worker`
4. Confirm required production env vars and secrets are present.
5. Confirm the rollback owner and approver are assigned.

## Cutover Steps

1. Announce the deployment window.
2. Scale down non-essential write activity if needed.
3. Deploy `api` and `job-worker`.
4. Run database migrations.
5. Run deploy-time validation against production targets.
6. Deploy `portal-web` and `admin-console`.
7. Verify:
   - `/health/live`
   - `/health/ready`
   - portal login page
   - admin login page
   - key admin routes
8. Run focused smoke and session checks.
9. Monitor logs, metrics, alarms, and queue backlog for at least 30 minutes.

## Rollback Trigger Conditions

- migrations fail or leave schema in an unknown state
- portal/admin login unavailable
- health endpoints fail after deployment
- worker failure rate spikes
- sustained 5xx increase

## Post-Cutover

1. Confirm alarms are quiet.
2. Confirm worker queue depth is stable.
3. Confirm support/demo accounts behave as expected.
4. Close the deployment window.
