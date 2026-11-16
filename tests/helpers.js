import { randomBytes } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const APP_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/**
 * Environment for the tests. Must run before anything imports @averoa/*
 * (DB is built from config/database.js when utilities is loaded), so callers
 * import the framework dynamically afterwards.
 */
export function setTestEnv(overrides = {}) {
  Object.assign(process.env, {
    NODE_ENV: 'test',
    AVEROA_ROOT: APP_ROOT,
    DB_CLIENT: 'better-sqlite3',
    DB_NAME: ':memory:',
    TOKEN_SECRET: randomBytes(32).toString('hex'),
    TOKEN_EXPIRES_IN: '5m',
    SESSION_SECRET: randomBytes(32).toString('hex'),
    CSRF_ENABLED: 'true',
    LOG_LEVEL: 'error',
    ...overrides,
  });
}

/** fetch wrapper with a hard timeout, so a hanging route fails the test instead of the run. */
export function client(baseUrl, timeoutMs = 5000) {
  return async (method, url, { body, token, headers = {} } = {}) => {
    const init = { method, headers: { ...headers }, signal: AbortSignal.timeout(timeoutMs) };
    if (body !== undefined) {
      init.headers['content-type'] = 'application/json';
      init.body = JSON.stringify(body);
    }
    if (token) init.headers.authorization = `Bearer ${token}`;

    let res;
    try {
      res = await fetch(baseUrl + url, init);
    } catch (err) {
      if (err.name === 'TimeoutError') {
        throw new Error(`${method} ${url} did not respond within ${timeoutMs}ms (handler hangs)`, { cause: err });
      }
      throw err;
    }
    const text = await res.text();
    let json;
    try { json = JSON.parse(text); } catch { json = undefined; }
    return { status: res.status, body: json, text };
  };
}
