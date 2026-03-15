import { configureBackupJobs } from './backupService.js';

async function main() {
  const jobs = await configureBackupJobs();

  console.log('[backups] configured backup jobs', {
    count: jobs.length,
    jobIds: jobs.map((job) => job.id)
  });
}

main().catch((error) => {
  console.error('[backups] failed to configure backup jobs', error);
  process.exit(1);
});
