// Job worker: npm run worker:jobs
//
// Runs the jobs dispatched with SomeJob.dispatch(): every Job subclass exported by
// app/Jobs/index.js, on the queues those jobs use (RABBITMQ_SERVER). Run it as its own
// process next to the web server (several copies to scale out); stop it with SIGTERM or SIGINT.
//
//   JOBS_WORKER_QUEUES=reports,mail-heavy   only these queues (default: the queues of the jobs)
//   JOBS_CONCURRENCY=5                       jobs run at the same time per queue (default 1)
//
// .env must be loaded before @averoa/utilities reads its configuration,
// so env.js is imported first and the utilities are imported dynamically.
import '@averoa/core/env.js';

const {
  startJobWorker, closeQueue, Log, Model, DB, getDB,
} = await import('@averoa/utilities');

const SHUTDOWN_TIMEOUT = Number(process.env.SHUTDOWN_TIMEOUT) || 10000;

// models need the knex instance (the web server binds it in createApp())
try {
  Model.knex(await getDB());
} catch (err) {
  Log.warn(`job worker: no database (${err.message}); jobs that use models will fail`);
}

const queues = (process.env.JOBS_WORKER_QUEUES || '').split(',').map((q) => q.trim()).filter(Boolean);

// signal handlers first, so a signal that arrives while starting still shuts down cleanly
let worker;
let stopping = false;
async function shutdown(signal) {
  if (stopping) return;
  stopping = true;
  Log.info(`job worker: ${signal} received, finishing running jobs`);
  // don't hang forever on a broken broker connection or a stuck job
  const timer = setTimeout(() => {
    Log.error(`job worker: did not stop within ${SHUTDOWN_TIMEOUT} ms, exiting`);
    process.exit(1);
  }, SHUTDOWN_TIMEOUT);
  timer.unref();
  try {
    await worker?.stop(); // undefined while still starting
    await closeQueue();
    await DB.destroy().catch(() => {});
    process.exit(0);
  } catch (err) {
    Log.error(`job worker: error while stopping: ${err.message}`);
    process.exit(1);
  }
}

process.once('SIGTERM', () => shutdown('SIGTERM'));
process.once('SIGINT', () => shutdown('SIGINT'));

try {
  worker = await startJobWorker({
    queues: queues.length ? queues : undefined,
    concurrency: Number(process.env.JOBS_CONCURRENCY) || 1,
  });
} catch (err) {
  Log.error(`job worker: cannot start: ${err.message}`);
  process.exit(1);
}
