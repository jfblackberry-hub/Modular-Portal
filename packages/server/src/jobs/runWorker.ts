import { createStructuredLogger } from '../observability/logger.js';
import { createJobWorker } from './jobWorker.js';
import { jobWorkerRuntimeConfig } from './runtime-config.js';

const logger = createStructuredLogger({
  observability: {
    capabilityId: 'platform.jobs',
    failureType: 'none',
    tenantId: 'platform'
  },
  serviceName: jobWorkerRuntimeConfig.observability.serviceName
});

const worker = createJobWorker({
  pollIntervalMs: jobWorkerRuntimeConfig.jobWorkerPollIntervalMs
});

process.on('SIGINT', () => {
  worker.stop();
});

process.on('SIGTERM', () => {
  worker.stop();
});

logger.info('job worker starting', {
  appName: jobWorkerRuntimeConfig.appName,
  nodeEnv: jobWorkerRuntimeConfig.nodeEnv,
  pollIntervalMs: jobWorkerRuntimeConfig.jobWorkerPollIntervalMs
});
await worker.start();
