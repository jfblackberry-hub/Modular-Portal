# Backup Strategy

The platform backup strategy covers:

- PostgreSQL application data
- document storage files
- audit logs as a dedicated compliance dataset

Backups are executed through the PostgreSQL-backed job queue using the `backup.run` job type, but schedule seeding is intentionally external to the long-running app processes.

## Configuration

Required environment variables:

- `BACKUP_ENCRYPTION_KEY`: secret used to encrypt backup artifacts with AES-256-GCM

Optional environment variables:

- `BACKUP_STORAGE_DIR` or `BACKUP_DIR`: where encrypted backup artifacts and manifests are written
- `BACKUP_DATABASE_INTERVAL_HOURS`: default `24`
- `BACKUP_DOCUMENTS_INTERVAL_HOURS`: default `24`
- `BACKUP_AUDIT_LOGS_INTERVAL_HOURS`: default `24`

## Scheduling

Configure the scheduled jobs with a one-shot task:

```bash
pnpm --filter @payer-portal/server backups:schedule
```

For production deployment, the intended model is an AWS EventBridge scheduled ECS task that runs:

```bash
pnpm --filter @payer-portal/server backups:configure
```

That command ensures a scheduled `backup.run` job exists for each coverage area:

- `database`
- `documents`
- `audit_logs`

Each successful scheduled backup enqueues its next run based on the configured interval. The long-running `job-worker` service executes the queued jobs; web and admin services do not.

## Backup Artifacts

Every backup run writes storage-backed artifacts under the configured backup profile containing:

- `<coverage>.backup.enc`: encrypted snapshot payload
- `manifest.json`: restore metadata, record counts, and artifact paths
- `verification.json`: backup verification log with expected and actual hashes

## Restore Procedure

### Database Snapshot Restore

1. Stop writes to the platform.
2. Copy the desired backup artifact set from backup storage.
3. Decrypt `database.backup.enc` using the configured `BACKUP_ENCRYPTION_KEY`.
4. Load the JSON snapshot and replay the records into PostgreSQL in dependency order.
5. Validate row counts using `manifest.json`.

### Point-In-Time Restore

Point-in-time restore depends on PostgreSQL WAL archiving or managed database PITR.

1. Restore PostgreSQL to the target timestamp using WAL/PITR support from the database runtime.
2. If document storage also needs rollback, restore the matching document snapshot artifact set.
3. Validate audit-log continuity from the restored `AuditLog` table or the dedicated `audit_logs` snapshot.

The application code in this repo prepares encrypted snapshots and verification logs. WAL retention, archive destinations, and PITR execution must be configured at the PostgreSQL infrastructure layer.

### Document Storage Restore

1. Decrypt `documents.backup.enc`.
2. Recreate each file in the configured storage directory using the stored relative path.
3. Compare restored file hashes against the verification log and manifest.

### Audit Log Restore

1. Decrypt `audit_logs.backup.enc`.
2. Restore audit rows into PostgreSQL if a compliance recovery is required.
3. Prefer PostgreSQL PITR when the requirement is “state as of a timestamp”.
