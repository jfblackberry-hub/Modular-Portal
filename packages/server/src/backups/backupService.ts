import { randomUUID, createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

import { prisma } from '@payer-portal/database';

import { enqueueJob } from '../jobs/jobQueue.js';
import { getStorageDirectory, readFile } from '../storage/localStorage.js';

export const BACKUP_COVERAGE = {
  DATABASE: 'database',
  DOCUMENTS: 'documents',
  AUDIT_LOGS: 'audit_logs'
} as const;

export type BackupCoverage =
  (typeof BACKUP_COVERAGE)[keyof typeof BACKUP_COVERAGE];

export type BackupSchedule = {
  intervalHours: number;
};

export type BackupRunPayload = {
  coverage: BackupCoverage;
  schedule?: BackupSchedule | null;
  trigger?: 'MANUAL' | 'SCHEDULED';
};

export type BackupManifest = {
  backupId: string;
  coverage: BackupCoverage;
  createdAt: string;
  trigger: 'MANUAL' | 'SCHEDULED';
  encryptedFile: string;
  verificationLog: string;
  keyId: string;
  hashSha256: string;
  recordCounts: Record<string, number>;
  restore: {
    snapshotProcedure: string;
    pointInTimeRestore: string | null;
  };
};

function normalizeIntervalHours(value: string | undefined, fallback: number) {
  const parsed = Number.parseInt(value ?? '', 10);

  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }

  return parsed;
}

function getBackupRootDirectory() {
  return path.resolve(
    process.cwd(),
    process.env.BACKUP_STORAGE_DIR ?? process.env.BACKUP_DIR ?? 'backups'
  );
}

function getEncryptionMaterial() {
  const secret = process.env.BACKUP_ENCRYPTION_KEY?.trim();

  if (!secret) {
    throw new Error('BACKUP_ENCRYPTION_KEY is required for encrypted backups');
  }

  const key = createHash('sha256').update(secret).digest();
  const keyId = createHash('sha256').update(secret).digest('hex').slice(0, 12);

  return { key, keyId };
}

async function collectDatabaseSnapshot() {
  const [
    tenants,
    tenantBranding,
    users,
    userRoles,
    roles,
    permissions,
    rolePermissions,
    featureFlags,
    documents,
    notifications,
    connectorConfigs,
    integrationExecutions,
    jobs,
    auditLogs,
    eventRecords,
    eventDeliveries
  ] = await Promise.all([
    prisma.tenant.findMany({ orderBy: { createdAt: 'asc' } }),
    prisma.tenantBranding.findMany({ orderBy: { createdAt: 'asc' } }),
    prisma.user.findMany({ orderBy: { createdAt: 'asc' } }),
    prisma.userRole.findMany(),
    prisma.role.findMany({ orderBy: { createdAt: 'asc' } }),
    prisma.permission.findMany({ orderBy: { createdAt: 'asc' } }),
    prisma.rolePermission.findMany(),
    prisma.featureFlag.findMany({ orderBy: { createdAt: 'asc' } }),
    prisma.document.findMany({ orderBy: { createdAt: 'asc' } }),
    prisma.notification.findMany({ orderBy: { createdAt: 'asc' } }),
    prisma.connectorConfig.findMany({ orderBy: { createdAt: 'asc' } }),
    prisma.integrationExecution.findMany({ orderBy: { startedAt: 'asc' } }),
    prisma.job.findMany({ orderBy: { createdAt: 'asc' } }),
    prisma.auditLog.findMany({ orderBy: { createdAt: 'asc' } }),
    prisma.eventRecord.findMany({ orderBy: { createdAt: 'asc' } }),
    prisma.eventDelivery.findMany({ orderBy: { createdAt: 'asc' } })
  ]);

  return {
    snapshot: {
      tenants,
      tenantBranding,
      users,
      userRoles,
      roles,
      permissions,
      rolePermissions,
      featureFlags,
      documents,
      notifications,
      connectorConfigs,
      integrationExecutions,
      jobs,
      auditLogs,
      eventRecords,
      eventDeliveries
    },
    recordCounts: {
      tenants: tenants.length,
      tenantBranding: tenantBranding.length,
      users: users.length,
      userRoles: userRoles.length,
      roles: roles.length,
      permissions: permissions.length,
      rolePermissions: rolePermissions.length,
      featureFlags: featureFlags.length,
      documents: documents.length,
      notifications: notifications.length,
      connectorConfigs: connectorConfigs.length,
      integrationExecutions: integrationExecutions.length,
      jobs: jobs.length,
      auditLogs: auditLogs.length,
      eventRecords: eventRecords.length,
      eventDeliveries: eventDeliveries.length
    }
  };
}

async function listFilesRecursive(directory: string): Promise<string[]> {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(directory, entry.name);

      if (entry.isDirectory()) {
        return listFilesRecursive(fullPath);
      }

      return [fullPath];
    })
  );

  return files.flat();
}

async function collectDocumentsSnapshot() {
  const storageDirectory = getStorageDirectory();
  await fs.mkdir(storageDirectory, { recursive: true });
  const files = await listFilesRecursive(storageDirectory);

  const snapshotFiles = await Promise.all(
    files.map(async (filePath) => {
      const relativePath = path.relative(storageDirectory, filePath);
      const buffer = await readFile(relativePath);

      return {
        path: relativePath,
        sizeBytes: buffer.byteLength,
        sha256: createHash('sha256').update(buffer).digest('hex'),
        contentsBase64: buffer.toString('base64')
      };
    })
  );

  return {
    snapshot: {
      storageDirectory,
      files: snapshotFiles
    },
    recordCounts: {
      files: snapshotFiles.length
    }
  };
}

async function collectAuditLogSnapshot() {
  const auditLogs = await prisma.auditLog.findMany({
    orderBy: { createdAt: 'asc' }
  });

  return {
    snapshot: {
      auditLogs
    },
    recordCounts: {
      auditLogs: auditLogs.length
    }
  };
}

async function collectCoverageSnapshot(coverage: BackupCoverage) {
  switch (coverage) {
    case BACKUP_COVERAGE.DATABASE:
      return collectDatabaseSnapshot();
    case BACKUP_COVERAGE.DOCUMENTS:
      return collectDocumentsSnapshot();
    case BACKUP_COVERAGE.AUDIT_LOGS:
      return collectAuditLogSnapshot();
    default:
      throw new Error(`Unsupported backup coverage: ${coverage satisfies never}`);
  }
}

function encryptPayload(payload: Buffer) {
  const { key, keyId } = getEncryptionMaterial();
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(payload), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return {
    keyId,
    payload: Buffer.concat([iv, authTag, encrypted])
  };
}

function decryptPayload(encryptedPayload: Buffer) {
  const { key } = getEncryptionMaterial();
  const iv = encryptedPayload.subarray(0, 12);
  const authTag = encryptedPayload.subarray(12, 28);
  const encrypted = encryptedPayload.subarray(28);
  const decipher = createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);

  return Buffer.concat([decipher.update(encrypted), decipher.final()]);
}

function getRestoreProcedure(coverage: BackupCoverage) {
  if (coverage === BACKUP_COVERAGE.DATABASE) {
    return {
      snapshotProcedure:
        'Restore the encrypted snapshot artifact, decrypt it with BACKUP_ENCRYPTION_KEY, then replay the JSON dataset into PostgreSQL in dependency order.',
      pointInTimeRestore:
        'Use PostgreSQL WAL archiving or managed-service PITR to restore the database to a target timestamp before replaying any snapshot delta.'
    };
  }

  if (coverage === BACKUP_COVERAGE.DOCUMENTS) {
    return {
      snapshotProcedure:
        'Decrypt the documents backup artifact and write each file back to the configured storage directory using its relative path.',
      pointInTimeRestore: null
    };
  }

  return {
    snapshotProcedure:
      'Decrypt the audit-log artifact and restore the ordered audit rows into PostgreSQL if a compliance recovery is required.',
    pointInTimeRestore:
      'For timestamp-specific recovery, restore PostgreSQL to the target time with WAL/PITR and query the AuditLog table from that restored instance.'
  };
}

export async function runBackup(input: BackupRunPayload) {
  const coverage = input.coverage;
  const createdAt = new Date();
  const backupId = `${createdAt.toISOString().replace(/[:.]/g, '-')}-${coverage}-${randomUUID()}`;
  const backupDirectory = path.join(
    getBackupRootDirectory(),
    createdAt.toISOString().slice(0, 10),
    backupId
  );

  await fs.mkdir(backupDirectory, { recursive: true });

  const snapshotResult = await collectCoverageSnapshot(coverage);
  const plaintext = Buffer.from(
    JSON.stringify(
      {
        backupId,
        coverage,
        createdAt: createdAt.toISOString(),
        data: snapshotResult.snapshot
      },
      null,
      2
    ),
    'utf8'
  );
  const hashSha256 = createHash('sha256').update(plaintext).digest('hex');
  const encrypted = encryptPayload(plaintext);
  const encryptedFilePath = path.join(backupDirectory, `${coverage}.backup.enc`);

  await fs.writeFile(encryptedFilePath, encrypted.payload);

  const decrypted = decryptPayload(await fs.readFile(encryptedFilePath));
  const verifiedHash = createHash('sha256').update(decrypted).digest('hex');
  const verified = verifiedHash === hashSha256;

  const verificationLog = {
    backupId,
    coverage,
    verified,
    verifiedAt: new Date().toISOString(),
    expectedHashSha256: hashSha256,
    actualHashSha256: verifiedHash
  };
  const verificationFilePath = path.join(backupDirectory, 'verification.json');
  await fs.writeFile(
    verificationFilePath,
    JSON.stringify(verificationLog, null, 2),
    'utf8'
  );

  if (!verified) {
    throw new Error(`Backup verification failed for ${coverage}`);
  }

  const manifest: BackupManifest = {
    backupId,
    coverage,
    createdAt: createdAt.toISOString(),
    trigger: input.trigger ?? 'SCHEDULED',
    encryptedFile: path.relative(getBackupRootDirectory(), encryptedFilePath),
    verificationLog: path.relative(getBackupRootDirectory(), verificationFilePath),
    keyId: encrypted.keyId,
    hashSha256,
    recordCounts: snapshotResult.recordCounts,
    restore: getRestoreProcedure(coverage)
  };

  await fs.writeFile(
    path.join(backupDirectory, 'manifest.json'),
    JSON.stringify(manifest, null, 2),
    'utf8'
  );

  return manifest;
}

async function findExistingScheduledJob(coverage: BackupCoverage) {
  return prisma.job.findFirst({
    where: {
      type: 'backup.run',
      status: {
        in: ['PENDING', 'RUNNING']
      },
      payload: {
        path: ['coverage'],
        equals: coverage
      }
    }
  });
}

export async function configureBackupJobs(referenceTime = new Date()) {
  const schedules: Array<{ coverage: BackupCoverage; intervalHours: number }> = [
    {
      coverage: BACKUP_COVERAGE.DATABASE,
      intervalHours: normalizeIntervalHours(
        process.env.BACKUP_DATABASE_INTERVAL_HOURS,
        24
      )
    },
    {
      coverage: BACKUP_COVERAGE.DOCUMENTS,
      intervalHours: normalizeIntervalHours(
        process.env.BACKUP_DOCUMENTS_INTERVAL_HOURS,
        24
      )
    },
    {
      coverage: BACKUP_COVERAGE.AUDIT_LOGS,
      intervalHours: normalizeIntervalHours(
        process.env.BACKUP_AUDIT_LOGS_INTERVAL_HOURS,
        24
      )
    }
  ];

  const configuredJobs = [];

  for (const schedule of schedules) {
    const existing = await findExistingScheduledJob(schedule.coverage);

    if (existing) {
      continue;
    }

    const job = await enqueueJob({
      type: 'backup.run',
      payload: {
        coverage: schedule.coverage,
        schedule: {
          intervalHours: schedule.intervalHours
        },
        trigger: 'SCHEDULED'
      },
      runAt: referenceTime,
      maxAttempts: 5
    });

    configuredJobs.push(job);
  }

  return configuredJobs;
}

export async function scheduleNextBackupRun(
  payload: BackupRunPayload,
  referenceTime = new Date()
) {
  const intervalHours = payload.schedule?.intervalHours;

  if (!intervalHours || intervalHours < 1) {
    return null;
  }

  return enqueueJob({
    type: 'backup.run',
    payload: {
      coverage: payload.coverage,
      schedule: payload.schedule,
      trigger: 'SCHEDULED'
    },
    runAt: new Date(referenceTime.getTime() + intervalHours * 60 * 60 * 1000),
    maxAttempts: 5
  });
}
