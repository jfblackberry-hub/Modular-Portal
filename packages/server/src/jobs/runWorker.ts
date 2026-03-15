import { createJobWorker } from './jobWorker.js';

const worker = createJobWorker({
  pollIntervalMs: Number(process.env.JOB_WORKER_POLL_INTERVAL_MS ?? 1000)
});

process.on('SIGINT', () => {
  worker.stop();
});

process.on('SIGTERM', () => {
  worker.stop();
});

console.log('[jobs] worker starting');
await worker.start();
