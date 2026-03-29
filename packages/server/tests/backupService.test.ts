import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { after, beforeEach, test } from 'node:test';

process.env.DATABASE_URL ??=
  'postgresql://dev:dev@127.0.0.1:5432/payer_portal?schema=public';
process.env.BACKUP_ENCRYPTION_KEY = 'backup-test-secret';
process.env.BACKUP_STORAGE_DIR = '.tmp-backup-artifacts';
process.env.LOCAL_STORAGE_DIR = '.tmp-backup-storage';

import { prisma } from '@payer-portal/database';

import { configureBackupJobs } from '../src/backups/backupService.js';
import { listJobs } from '../src/jobs/jobQueue.js';
import { clearJobHandlers } from '../src/jobs/jobRegistry.js';
import { JOB_STATUS } from '../src/jobs/jobTypes.js';
import { runNextJob } from '../src/jobs/jobWorker.js';
import { createStorageService } from '../src/storage/service.js';
import { saveFile } from '../src/storage/localStorage.js';

const backupRootDirectory = path.resolve(
  process.cwd(),
  process.env.BACKUP_STORAGE_DIR ?? '.tmp-backup-artifacts'
);
const storageRootDirectory = path.resolve(
  process.cwd(),
  process.env.LOCAL_STORAGE_DIR ?? '.tmp-backup-storage'
);

async function cleanupBackupArtifacts() {
  await fs.rm(backupRootDirectory, { recursive: true, force: true });
  await fs.rm(storageRootDirectory, { recursive: true, force: true });
}

async function cleanupBackupJobs() {
  await prisma.job.deleteMany({
    where: {
      type: 'backup.run'
    }
  });
}

async function suspendSeedJobs() {
  await prisma.job.updateMany({
    where: {
      type: {
        not: 'backup.run'
      },
      status: JOB_STATUS.PENDING
    },
    data: {
      runAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    }
  });
}

async function cleanupTestData() {
  await prisma.$executeRawUnsafe('TRUNCATE TABLE audit_logs');

  await prisma.document.deleteMany({
    where: {
      storageKey: 'documents/backup-test/restore-me.txt'
    }
  });
}

beforeEach(async () => {
  clearJobHandlers();
  await cleanupBackupJobs();
  await cleanupBackupArtifacts();
  await cleanupTestData();
  await suspendSeedJobs();
});

after(async () => {
  clearJobHandlers();
  await cleanupBackupJobs();
  await cleanupBackupArtifacts();
  await cleanupTestData();
  await prisma.$disconnect();
});

test('scheduled backup jobs create encrypted artifacts and verification logs', async () => {
  const user = await prisma.user.findFirstOrThrow({
    include: {
      tenant: true
    }
  });

  await saveFile(
    Buffer.from('document backup test', 'utf8'),
    'documents/backup-test/restore-me.txt'
  );

  await prisma.document.create({
    data: {
      tenantId: user.tenantId,
      uploadedByUserId: user.id,
      filename: 'restore-me.txt',
      mimeType: 'text/plain',
      sizeBytes: 20,
      storageKey: 'documents/backup-test/restore-me.txt',
      status: 'AVAILABLE'
    }
  });

  await prisma.auditLog.create({
    data: {
      tenantId: user.tenantId,
      actorUserId: user.id,
      action: 'backup.test.audit',
      entityType: 'BackupTest',
      entityId: 'backup-test-1'
    }
  });

  const configuredJobs = await configureBackupJobs(new Date());
  assert.equal(configuredJobs.length, 3);

  assert.equal(await runNextJob(), true);
  assert.equal(await runNextJob(), true);
  assert.equal(await runNextJob(), true);

  const manifestPaths: string[] = [];

  async function collectManifests(directory: string) {
    const entries = await fs.readdir(directory, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(directory, entry.name);

      if (entry.isDirectory()) {
        await collectManifests(fullPath);
        continue;
      }

      if (entry.name === 'manifest.json') {
        manifestPaths.push(fullPath);
      }
    }
  }

  await collectManifests(backupRootDirectory);
  assert.equal(manifestPaths.length, 3);

  const manifests = await Promise.all(
    manifestPaths.map(async (manifestPath) => {
      const contents = await fs.readFile(manifestPath, 'utf8');
      return JSON.parse(contents) as {
        coverage: string;
        encryptedFile: string;
        verificationLog: string;
        recordCounts: Record<string, number>;
      };
    })
  );

  const coverages = manifests.map((manifest) => manifest.coverage).sort();
  assert.deepEqual(coverages, ['audit_logs', 'database', 'documents']);

  for (const manifestPath of manifestPaths) {
    const directory = path.dirname(manifestPath);
    const verificationLog = JSON.parse(
      await fs.readFile(path.join(directory, 'verification.json'), 'utf8')
    ) as { verified: boolean };

    assert.equal(verificationLog.verified, true);
  }

  const documentManifest = manifests.find(
    (manifest) => manifest.coverage === 'documents'
  );
  const auditManifest = manifests.find(
    (manifest) => manifest.coverage === 'audit_logs'
  );

  assert.ok(documentManifest);
  assert.ok(auditManifest);
  assert.equal(documentManifest?.recordCounts.files, 1);
  assert.equal((auditManifest?.recordCounts.auditLogs ?? 0) >= 1, true);

  const pendingFollowUpJobs = await listJobs({
    type: 'backup.run',
    status: JOB_STATUS.PENDING
  });

  assert.equal(pendingFollowUpJobs.length, 3);
  assert.equal(
    pendingFollowUpJobs.every((job) => job.runAt.getTime() > Date.now()),
    true
  );
});

test('storage services resolve local directories from the workspace root instead of the current package cwd', async () => {
  const originalCwd = process.cwd();

  process.env.LOCAL_PUBLIC_ASSET_DIR = 'apps/portal-web/public/tenant-assets';

  try {
    process.chdir(path.resolve(originalCwd, 'apps/api'));

    const publicAssetStorage = createStorageService('public-assets');
    const defaultStorage = createStorageService('default');

    assert.equal(
      publicAssetStorage.getRootDescriptor(),
      path.resolve(originalCwd, 'apps/portal-web/public/tenant-assets')
    );
    assert.equal(
      defaultStorage.getRootDescriptor(),
      path.resolve(originalCwd, process.env.LOCAL_STORAGE_DIR ?? '.tmp-backup-storage')
    );
  } finally {
    process.chdir(originalCwd);
  }
});
