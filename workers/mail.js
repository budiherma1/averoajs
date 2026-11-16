// Mail worker: npm run worker:mail
//
// Consumes the mail queue (MAIL_QUEUE, default `mail`) on RABBITMQ_SERVER and sends
// every message queued with Mail.init()...queue().send() through config/mail.js.
// Run it as its own process next to the web server; stop it with SIGTERM or SIGINT.
//
// .env must be loaded before @averoa/utilities reads its configuration,
// so env.js is imported first and the utilities are imported dynamically.
import '@averoa/core/env.js';

const { startMailWorker, closeQueue, Log } = await import('@averoa/utilities');

const SHUTDOWN_TIMEOUT = Number(process.env.SHUTDOWN_TIMEOUT) || 10000;

let worker;
try {
  // queue: config/mail.js `queue`, MAIL_QUEUE or `mail`; options: { queue, prefetch, maxRetries }
  worker = await startMailWorker();
} catch (err) {
  Log.error(`mail worker: cannot start: ${err.message}`);
  process.exit(1);
}

let stopping = false;
async function shutdown(signal) {
  if (stopping) return;
  stopping = true;
  Log.info(`mail worker: ${signal} received, finishing in-flight mails`);
  // don't hang forever on a broken broker connection
  const timer = setTimeout(() => {
    Log.error(`mail worker: did not stop within ${SHUTDOWN_TIMEOUT} ms, exiting`);
    process.exit(1);
  }, SHUTDOWN_TIMEOUT);
  timer.unref();
  try {
    await worker.stop();
    await closeQueue();
    process.exit(0);
  } catch (err) {
    Log.error(`mail worker: error while stopping: ${err.message}`);
    process.exit(1);
  }
}

process.once('SIGTERM', () => shutdown('SIGTERM'));
process.once('SIGINT', () => shutdown('SIGINT'));
