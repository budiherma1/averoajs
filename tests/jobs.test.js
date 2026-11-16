// Jobs (app/Jobs) and the schedule (app/Console/Kernel.js).
// The unit part runs on in-memory SQLite without RabbitMQ. The worker part starts
// workers/jobs.js and workers/scheduler.js against a real RabbitMQ and is skipped unless
// RABBITMQ_TEST_SERVER is set (e.g. amqp://guest:guest@127.0.0.1:35672).
import {
  describe, test, before, after,
} from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { APP_ROOT, setTestEnv } from './helpers.js';

// a database file, so the worker processes of the RabbitMQ tests see the same rows
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'averoa-app-jobs-'));
const dbFile = path.join(tmpDir, 'jobs.sqlite');
const amqpUrl = process.env.RABBITMQ_TEST_SERVER;
const jobsQueue = `app-test-${randomBytes(4).toString('hex')}`;
setTestEnv({
  DB_NAME: dbFile, JOBS_QUEUE: jobsQueue, ...(amqpUrl ? { RABBITMQ_SERVER: amqpUrl } : {}),
});

let utilities;
let jobs;
let DB;
const DAY = 24 * 60 * 60 * 1000;

before(async () => {
  utilities = await import('@averoa/utilities');
  jobs = await import('#jobs');
  DB = await utilities.getDB();
  utilities.Model.knex(DB);
  await DB.migrate.latest({ directory: path.join(APP_ROOT, 'database/migrations'), loadExtensions: ['.js'] });
  await DB.seed.run({ directory: path.join(APP_ROOT, 'database/seeds'), loadExtensions: ['.js'] });
});

after(async () => {
  await utilities?.closeQueue();
  await DB?.destroy();
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('SendWelcomeEmailJob', () => {
  test('mails the user (escaped name, text part); deleted or unknown users get nothing', async () => {
    const { setTransporter } = await import('@averoa/utilities/Mail.js');
    const sent = [];
    setTransporter({ async sendMail(options) { sent.push(options); return { messageId: '1' }; } });
    const { SendWelcomeEmailJob } = jobs;

    await DB('users').where({ id: 1 }).update({ first_name: '<b>Ada</b>', email: 'ada@example.com' });
    assert.deepEqual(await SendWelcomeEmailJob.dispatchSync({ userId: 1 }), { sent: true });
    assert.equal(sent.length, 1);
    assert.equal(sent[0].to, 'ada@example.com');
    assert.equal(sent[0].subject, 'Welcome to Averoa');
    assert.match(sent[0].html, /Welcome, &lt;b&gt;Ada&lt;\/b&gt;!/);
    assert.match(sent[0].text, /Welcome, <b>Ada<\/b>!/);

    await DB('users').where({ id: 2 }).update({ deleted_at: new Date() });
    assert.deepEqual(await SendWelcomeEmailJob.dispatchSync({ userId: 2 }), { sent: false });
    assert.deepEqual(await SendWelcomeEmailJob.dispatchSync({ userId: 99999 }), { sent: false });
    assert.deepEqual(await SendWelcomeEmailJob.dispatchSync({}), { sent: false });
    assert.equal(sent.length, 1);
  });

  test('is configured for retries', () => {
    const { SendWelcomeEmailJob } = jobs;
    assert.equal(SendWelcomeEmailJob.tries, 5);
    const waits = [1, 2, 3, 4].map(SendWelcomeEmailJob.backoff);
    assert.deepEqual(waits, [10_000, 20_000, 40_000, 80_000]);
  });
});

describe('PruneSoftDeletedJob', () => {
  test('hard-deletes rows soft-deleted more than `days` ago, in every model with timestamps', async () => {
    const { PruneSoftDeletedJob } = jobs;
    const [old, recent, live] = await DB('teacher').orderBy('id').limit(3).pluck('id');
    await DB('teacher').where({ id: old }).update({ deleted_at: new Date(Date.now() - 40 * DAY) });
    await DB('teacher').where({ id: recent }).update({ deleted_at: new Date(Date.now() - 5 * DAY) });
    const rooms = await DB('rooms').count({ n: '*' }).first();

    const result = await PruneSoftDeletedJob.dispatchSync({ days: 30 });
    assert.equal(result.Teacher, 1);
    assert.equal(result.Rooms, 0);
    assert.ok('Users' in result);
    const left = await DB('teacher').whereIn('id', [old, recent, live]).pluck('id');
    assert.deepEqual(left.sort(), [recent, live].sort());
    assert.deepEqual(await DB('rooms').count({ n: '*' }).first(), rooms);
  });

  test('only touches the models it is given; rejects unknown models and bad days', async () => {
    const { PruneSoftDeletedJob } = jobs;
    assert.deepEqual(await PruneSoftDeletedJob.dispatchSync({ models: ['Rooms'] }), { Rooms: 0 });
    await assert.rejects(PruneSoftDeletedJob.dispatchSync({ models: ['users; drop table users'] }), /unknown model/);
    await assert.rejects(PruneSoftDeletedJob.dispatchSync({ models: ['constructor'] }), /unknown model/);
    await assert.rejects(PruneSoftDeletedJob.dispatchSync({ days: 0 }), /invalid days/);
  });
});

describe('job registry and schedule', () => {
  test('the worker discovers the Job classes of app/Jobs (not the other exports)', async () => {
    const { loadJobs } = await import('@averoa/utilities/JobWorker.js');
    const registry = await loadJobs();
    assert.deepEqual([...registry.keys()].sort(), ['PruneSoftDeletedJob', 'SendWelcomeEmailJob']);
  });

  test('app/Console/Kernel.js prunes soft-deleted rows daily at 03:00', async () => {
    const { loadSchedule } = await import('@averoa/utilities/Schedule.js');
    const schedule = await loadSchedule();
    assert.deepEqual(schedule.events.map((e) => [e.description, e.expression]), [['PruneSoftDeletedJob', '0 3 * * *']]);

    const fake = utilities.fakeJobs();
    try {
      assert.deepEqual(await utilities.runScheduleOnce({ at: new Date(2026, 0, 1, 3, 0, 5) }), ['PruneSoftDeletedJob']);
      assert.deepEqual(await utilities.runScheduleOnce({ at: new Date(2026, 0, 1, 4, 0) }), []);
      assert.deepEqual(fake.dispatched.map((d) => [d.job, d.queue, d.payload]), [['PruneSoftDeletedJob', jobsQueue, { days: 30 }]]);
    } finally {
      fake.restore();
    }
  });
});

/** Start a worker script; resolves once `ready` matches its output. */
function startScript(script, ready, args = []) {
  const child = spawn(process.execPath, [path.join(APP_ROOT, script), ...args], {
    cwd: APP_ROOT,
    env: { ...process.env, LOG_LEVEL: 'info', NODE_ENV: 'test' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let output = '';
  const started = new Promise((resolve, reject) => {
    const onData = (chunk) => {
      output += chunk;
      if (ready.test(output)) resolve();
    };
    child.stdout.on('data', onData);
    child.stderr.on('data', onData);
    child.once('exit', (code) => reject(new Error(`${script} exited with ${code}:\n${output}`)));
    setTimeout(() => reject(new Error(`${script} did not start:\n${output}`)), 15_000).unref();
  });
  const exited = new Promise((resolve) => { child.once('exit', (code, signal) => resolve(code ?? signal)); });
  return {
    child, started, exited, output: () => output,
  };
}

describe('workers on RabbitMQ', { skip: !amqpUrl && 'set RABBITMQ_TEST_SERVER to run' }, () => {
  after(async () => {
    const { getConnection } = await import('@averoa/utilities/Queue.js');
    const connection = await getConnection();
    const channel = await connection.createChannel();
    channel.on('error', () => {});
    for (const q of [jobsQueue, `${jobsQueue}.failed`]) {
      try { await channel.deleteQueue(q); } catch { /* not there */ }
    }
    await channel.close().catch(() => {});
  });

  test('npm run worker:jobs runs a dispatched job and stops cleanly on SIGTERM', async () => {
    const { PruneSoftDeletedJob } = jobs;
    const [id] = await DB('rooms').orderBy('id').limit(1).pluck('id');
    await DB('rooms').where({ id }).update({ deleted_at: new Date(Date.now() - 90 * DAY) });

    const worker = startScript('workers/jobs.js', /JobWorker: consuming/);
    try {
      await worker.started;
      await PruneSoftDeletedJob.dispatch({ days: 30, models: ['Rooms'] });
      const end = Date.now() + 10_000;
      while ((await DB('rooms').where({ id }).first()) && Date.now() < end) {
        await new Promise((r) => { setTimeout(r, 50); });
      }
      assert.equal(await DB('rooms').where({ id }).first(), undefined, worker.output());
    } finally {
      worker.child.kill('SIGTERM');
    }
    assert.equal(await worker.exited, 0, worker.output());
  });

  test('npm run schedule:run starts the Kernel schedule and stops cleanly on SIGTERM', async () => {
    const scheduler = startScript('workers/scheduler.js', /PruneSoftDeletedJob \(0 3 \* \* \*\), next run/);
    try {
      await scheduler.started;
    } finally {
      scheduler.child.kill('SIGTERM');
    }
    assert.equal(await scheduler.exited, 0, scheduler.output());

    const once = startScript('workers/scheduler.js', /scheduler: ran/, ['--once']);
    await once.started;
    assert.equal(await once.exited, 0, once.output());
  });

  test('npm run queue:retry moves failed jobs back to the job queue', async () => {
    const { publish, getConnection } = await import('@averoa/utilities/Queue.js');
    const failedQueue = `${jobsQueue}.failed`;
    for (const userId of [1, 2]) {
      await publish(failedQueue, {
        id: `failed-${userId}`, job: 'SendWelcomeEmailJob', queue: jobsQueue, payload: { userId }, attempt: 5, error: { message: 'smtp down' },
      });
    }

    const bad = startScript('workers/retry-failed-jobs.js', /invalid limit/, [jobsQueue, 'x']);
    await bad.started;
    assert.equal(await bad.exited, 1, bad.output());

    const retry = startScript('workers/retry-failed-jobs.js', /queue:retry: 1 job\(s\) re-queued/, [jobsQueue, '1']);
    await retry.started;
    assert.equal(await retry.exited, 0, retry.output());

    const channel = await (await getConnection()).createChannel();
    channel.on('error', () => {});
    try {
      const msg = await channel.get(jobsQueue, { noAck: true });
      assert.ok(msg, 'a job was re-queued');
      const message = JSON.parse(msg.content.toString());
      assert.equal(message.job, 'SendWelcomeEmailJob');
      assert.equal(message.attempt, 0);
      assert.deepEqual(message.payload, { userId: 1 });
      assert.equal((await channel.checkQueue(failedQueue)).messageCount, 1);
    } finally {
      await channel.close().catch(() => {});
    }
  });
});
