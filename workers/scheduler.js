// Scheduler: npm run schedule:run
//
// Runs the schedule of app/Console/Kernel.js until SIGTERM / SIGINT. Run exactly ONE
// scheduler process per application: every running scheduler fires every task.
// Scheduled jobs are dispatched to RabbitMQ and run on `npm run worker:jobs`.
//
//   npm run schedule:run -- --once   run the tasks due in the current minute and exit
//                                    (for a system cron or a Kubernetes CronJob every minute)
//   SCHEDULE_TIMEZONE=Asia/Jakarta   default time zone of the schedule
//
// .env must be loaded before @averoa/utilities reads its configuration,
// so env.js is imported first and the utilities are imported dynamically.
import '@averoa/core/env.js';

const {
  startScheduler, runScheduleOnce, closeQueue, Log, Model, DB, getDB,
} = await import('@averoa/utilities');

const SHUTDOWN_TIMEOUT = Number(process.env.SHUTDOWN_TIMEOUT) || 10000;

// tasks given to schedule.call() may use models
try {
  Model.knex(await getDB());
} catch (err) {
  Log.warn(`scheduler: no database (${err.message}); scheduled functions that use models will fail`);
}

async function close() {
  await closeQueue();
  await DB.destroy().catch(() => {});
}

if (process.argv.includes('--once')) {
  try {
    const ran = await runScheduleOnce();
    Log.info(`scheduler: ran ${ran.length ? ran.join(', ') : 'nothing'}`);
    await close();
    process.exit(0);
  } catch (err) {
    Log.error(`scheduler: ${err.message}`);
    process.exit(1);
  }
}

// signal handlers first, so a signal that arrives while starting still shuts down cleanly
let scheduler;
let stopping = false;
async function shutdown(signal) {
  if (stopping) return;
  stopping = true;
  Log.info(`scheduler: ${signal} received, waiting for running tasks`);
  const timer = setTimeout(() => {
    Log.error(`scheduler: did not stop within ${SHUTDOWN_TIMEOUT} ms, exiting`);
    process.exit(1);
  }, SHUTDOWN_TIMEOUT);
  timer.unref();
  try {
    await scheduler?.stop(); // undefined while still starting
    await close();
    process.exit(0);
  } catch (err) {
    Log.error(`scheduler: error while stopping: ${err.message}`);
    process.exit(1);
  }
}

process.once('SIGTERM', () => shutdown('SIGTERM'));
process.once('SIGINT', () => shutdown('SIGINT'));

try {
  scheduler = await startScheduler();
  for (const event of scheduler.events) {
    Log.info(`scheduler: ${event.name} (${event.expression}${event.timezone ? ` ${event.timezone}` : ''}), next run ${event.nextRun?.toISOString()}`);
  }
} catch (err) {
  Log.error(`scheduler: cannot start: ${err.message}`);
  process.exit(1);
}
