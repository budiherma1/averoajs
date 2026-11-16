// OpenAPI document and request validation of the boilerplate's API routes.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import path from 'node:path';
import { APP_ROOT, setTestEnv, client } from './helpers.js';

setTestEnv();
delete process.env.OPENAPI_ENABLED;
delete process.env.OPENAPI_UI;

let server;
let DB;
let http;
let doc;

before(async () => {
  const { createApp } = await import('@averoa/core');
  ({ DB } = await import('@averoa/utilities'));
  const { app } = await createApp();
  await DB.migrate.latest({ directory: path.join(APP_ROOT, 'database/migrations'), loadExtensions: ['.js'] });
  await DB.seed.run({ directory: path.join(APP_ROOT, 'database/seeds'), loadExtensions: ['.js'] });
  server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  http = client(`http://127.0.0.1:${server.address().port}`);
  const res = await http('GET', '/api/openapi.json');
  assert.equal(res.status, 200, res.text);
  doc = res.body;
});

after(async () => {
  if (server) {
    server.closeAllConnections?.();
    await new Promise((resolve) => { server.close(resolve); });
  }
  await DB?.destroy();
  const utilities = await import('@averoa/utilities');
  await utilities.closeQueue?.();
});

test('GET /api/openapi.json describes the app (AppProvider.openapi sets the title)', () => {
  assert.equal(doc.openapi, '3.1.0');
  assert.equal(doc.info.title, 'AveroaJS API');
  assert.equal(doc.info.version, '2.1.0');
});

test('teachers CRUD is documented with the model schema, filters and auth on writes', () => {
  const list = doc.paths['/api/teachers'].get;
  assert.equal(list.summary, 'List Teacher');
  assert.ok(list.parameters.some((p) => p.name === 'orderBy'));
  assert.ok(list.parameters.some((p) => p.name === '$relations'));
  assert.equal(list.security, undefined, 'reads are public');
  assert.deepEqual(list.responses[200].content['application/json'].schema.properties.data.items, { $ref: '#/components/schemas/Teacher' });

  assert.deepEqual(Object.keys(doc.paths['/api/teachers/{id}']).sort(), ['delete', 'get', 'put']);
  for (const op of [doc.paths['/api/teachers'].post, doc.paths['/api/teachers/{id}'].put, doc.paths['/api/teachers/{id}'].delete]) {
    assert.deepEqual(op.security, [{ bearerAuth: [] }]);
  }
  assert.deepEqual(doc.paths['/api/teachers'].post.requestBody.content['application/json'].schema, { $ref: '#/components/schemas/TeacherCreate' });

  const teacher = doc.components.schemas.Teacher.properties;
  assert.deepEqual(teacher.id, { type: 'integer' });
  assert.deepEqual(teacher.teacher_name, { type: ['string', 'null'] });
  assert.deepEqual(doc.components.schemas.TeacherCreate.required, ['teacher_name', 'type']);
});

test('auth endpoints: login body from validate(), me behind the bearer scheme', () => {
  const login = doc.paths['/api/auth/login'].post;
  assert.equal(login.summary, 'Log in and get a JWT');
  const body = login.requestBody.content['application/json'].schema;
  assert.deepEqual(body.required, ['email', 'password']);
  assert.equal(body.properties.email.format, 'email');
  assert.ok(login.responses[422]);
  assert.ok(login.responses[401]);
  assert.equal(login.security, undefined);

  assert.deepEqual(doc.paths['/api/auth/me'].get.security, [{ bearerAuth: [] }]);
  assert.equal(doc.components.securitySchemes.bearerAuth.scheme, 'bearer');
});

test('hidden columns never appear in response schemas', () => {
  const users = doc.components.schemas.Users.properties;
  assert.equal('password' in users, false);
  assert.equal('otp' in users, false);
  assert.ok('email' in users);
});

test('POST /api/auth/login validates the body before the controller', async () => {
  const bad = await http('POST', '/api/auth/login', { body: { email: 'not-an-email', password: 'password' } });
  assert.equal(bad.status, 422, bad.text);
  assert.deepEqual(bad.body, { status: false, data: { column: 'email', message: ['email format required'], in: 'body' } });

  const missing = await http('POST', '/api/auth/login', { body: { email: 'demo@averoa.test' } });
  assert.deepEqual(missing.body.data, { column: 'password', message: 'required', in: 'body' });

  const ok = await http('POST', '/api/auth/login', { body: { email: 'demo@averoa.test', password: 'password' } });
  assert.equal(ok.status, 200, ok.text);
  assert.equal(ok.body.data.type, 'Bearer');
});

test('GET /api/docs serves the Swagger UI page', async () => {
  const res = await http('GET', '/api/docs');
  assert.equal(res.status, 200);
  assert.match(res.text, /swagger-ui/);
});
