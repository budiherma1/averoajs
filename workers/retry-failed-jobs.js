// Re-queue failed jobs: npm run queue:retry [-- <queue> [limit]]
//
// Moves the records of jobs that failed for good from `<queue>.failed` back to `<queue>`
// with a fresh attempt count. <queue> defaults to JOBS_QUEUE (or `jobs`).
import '@averoa/core/env.js';

const { retryFailedJobs, closeQueue, Log } = await import('@averoa/utilities');

const [queue, limit] = process.argv.slice(2);
if (limit !== undefined && !(Number.isInteger(Number(limit)) && Number(limit) > 0)) {
  Log.error(`queue:retry: invalid limit "${limit}" (a positive integer)`);
  process.exit(1);
}

try {
  const moved = await retryFailedJobs({
    queue: queue || undefined,
    limit: limit ? Number(limit) : undefined,
  });
  Log.info(`queue:retry: ${moved} job(s) re-queued`);
  await closeQueue();
  process.exit(0);
} catch (err) {
  Log.error(`queue:retry: ${err.message}`);
  process.exit(1);
}
