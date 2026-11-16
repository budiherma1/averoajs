// OpenAPI document and request validation of the boilerplate's API routes.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { testApp } from '@averoa/core/testing.js';
import { APP_ROOT, setTestEnv } from './helpers.js';

setTestEnv();
delete process.env.OPENAPI_ENABLED;
delete process.env.OPENAPI_UI;

let app;
let http;
let doc;

before(async () => {
  app = await testApp();
  ({ http } = app);
  const res = await http('GET', '/api/openapi.json');
  assert.equal(res.status, 200, res.text);
  doc = res.body;
});

after(() => app?.close());

test('GET /api/openapi.json describes the app (AppProvider.openapi sets the title)', () => {
  assert.equal(doc.openapi, '3.1.0');
  assert.equal(doc.info.title, 'AveroaJS API');
  // the version of this project's package.json (create-averoa sets its own)
  const { version } = JSON.parse(fs.readFileSync(path.join(APP_ROOT, 'package.json'), 'utf8'));
  assert.equal(doc.info.version, version);
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
