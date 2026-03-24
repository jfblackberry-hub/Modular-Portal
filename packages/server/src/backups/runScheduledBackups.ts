import { createStructuredLogger } from '../observability/logger.js';
import { jobWorkerRuntimeConfig } from '../jobs/runtime-config.js';
import { configureBackupJobs } from './backupService.js';

const logger = createStructuredLogger({
  serviceName: jobWorkerRuntimeConfig.observability.serviceName
});

async function main() {
  const jobs = await configureBackupJobs();

  logger.info('configured backup jobs', {
    count: jobs.length,
    jobIds: jobs.map((job) => job.id)
  });
}

main().catch((error) => {
  logger.error('failed to configure backup jobs', {
    errorMessage: error instanceof Error ? error.message : String(error)
  });
  process.exit(1);
});
