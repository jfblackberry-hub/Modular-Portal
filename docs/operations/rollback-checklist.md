# Rollback Checklist

## Immediate Actions

1. Pause further deployments.
2. Confirm current failure mode:
   - app boot failure
   - migration failure
   - session/auth regression
   - worker/job regression
3. Notify stakeholders that rollback is starting.
4. If release automation is configured, confirm `RELEASE_ROLLBACK_COMMAND` points to the rollback entrypoint for the target environment.

## Rollback Procedure

1. Revert application services to the last known good build:
   - `portal-web`
   - `admin-console`
   - `api`
   - `job-worker`
2. If the issue is migration-related:
   - decide whether rollback is application-only or data rollback is required
   - note that deploy validation uses `prisma migrate deploy`, which is idempotent and safe to re-run when diagnosing partial rollout failures
   - restore from the most recent verified backup if necessary
3. Re-run:
   - health checks
   - smoke checks
   - critical login/session validation

## Validation After Rollback

1. `/health/live` is healthy
2. `/health/ready` is healthy
3. portal login works
4. admin login works
5. worker resumes normal job throughput
6. no new 5xx spike is visible
