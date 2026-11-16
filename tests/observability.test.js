// Observability on the real app: health probes, request ids, requestId in errors.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { setTestEnv } from './helpers.js';

setTestEnv({ TRUST_REQUEST_ID: 'true', LOG_CHANNEL: 'stdout' });

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

let server;
let base;
let DB;
let health;

before(async () => {
  const { createApp } = await import('@averoa/core');
  ({ DB } = await import('@averoa/utilities'));
  let app;
  ({ app, health } = await createApp());
  server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  base = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  if (server) {
    server.closeAllConnections?.();
    await new Promise((resolve) => { server.close(resolve); });
  }
  await DB?.destroy();
});

const get = (path, headers = {}) => fetch(base + path, {
  headers, signal: AbortSignal.timeout(5000),
});

test('GET /health answers 200 without a session cookie', async () => {
  const res = await get('/health');
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { status: 'ok' });
  assert.deepEqual(res.headers.getSetCookie(), []);
  assert.match(res.headers.get('x-request-id'), UUID);
});

test('GET /ready checks the database (AppProvider.health keeps the built-in check)', async () => {
  const res = await get('/ready');
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.status, 'ok');
  assert.deepEqual(Object.keys(body.checks), ['database']);
  assert.equal(body.checks.database.status, 'up');
});

test('every response carries X-Request-Id; a valid trusted incoming id is kept, an invalid one replaced', async () => {
  let res = await get('/api', { 'x-request-id': 'lb-7f3a' });
  assert.equal(res.status, 200);
  assert.equal(res.headers.get('x-request-id'), 'lb-7f3a');

  res = await get('/api', { 'x-request-id': 'not valid!' });
  assert.match(res.headers.get('x-request-id'), UUID);
});

test('error responses include the request id', async () => {
  let res = await get('/api/does-not-exist');
  assert.equal(res.status, 404);
  let body = await res.json();
  assert.equal(body.requestId, res.headers.get('x-request-id'));

  res = await get('/api/auth/me');
  assert.equal(res.status, 401);
  body = await res.json();
  assert.equal(body.status, false);
});

test('readiness answers 503 once shutdown starts, liveness stays 200', async () => {
  health.markShuttingDown();
  let res = await get('/ready');
  assert.equal(res.status, 503);
  assert.deepEqual(await res.json(), { status: 'shutting_down' });
  res = await get('/health');
  assert.equal(res.status, 200);
});
