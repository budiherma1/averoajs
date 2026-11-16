import { randomBytes } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const APP_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const URL_CLIENTS = {
  'mysql:': 'mysql2', 'mysql2:': 'mysql2', 'postgres:': 'pg', 'postgresql:': 'pg',
};

/**
 * DB_* variables for the test database. Default: in-memory better-sqlite3.
 * With AVEROA_TEST_DB_URL (mysql://user:pass@host:port/db or
 * postgres://user:pass@host:port/db) the suite runs against that server
 * instead; it rolls back every migration first, so use a throwaway database.
 */
export function testDatabaseEnv(url = process.env.AVEROA_TEST_DB_URL) {
  if (!url) return { DB_CLIENT: 'better-sqlite3', DB_NAME: ':memory:' };
  const u = new URL(url);
  const dbClient = URL_CLIENTS[u.protocol];
  if (!dbClient) throw new Error(`AVEROA_TEST_DB_URL: unsupported protocol ${u.protocol} (use mysql:// or postgres://)`);
  return {
    DB_CLIENT: dbClient,
    DB_HOST: u.hostname,
    DB_PORT: u.port || (dbClient === 'pg' ? '5432' : '3306'),
    DB_USER: decodeURIComponent(u.username),
    DB_PASS: decodeURIComponent(u.password),
    DB_NAME: decodeURIComponent(u.pathname.replace(/^\//, '')),
  };
}

/** True when the tests run against AVEROA_TEST_DB_URL rather than in-memory SQLite. */
export const usesTestDatabaseUrl = () => Boolean(process.env.AVEROA_TEST_DB_URL);

/**
 * Environment for the tests. Must run before anything imports @averoa/*
 * (DB is built from config/database.js when utilities is loaded), so callers
 * import the framework dynamically afterwards.
 */
export function setTestEnv(overrides = {}) {
  Object.assign(process.env, {
    NODE_ENV: 'test',
    AVEROA_ROOT: APP_ROOT,
    ...testDatabaseEnv(),
    TOKEN_SECRET: randomBytes(32).toString('hex'),
    // JWT_* blank: a project's .env (copied from .env.example) must not change the token lifetimes
    JWT_ACCESS_TTL: '',
    JWT_REFRESH_TTL: '',
    TOKEN_EXPIRES_IN: '5m',
    SESSION_SECRET: randomBytes(32).toString('hex'),
    CSRF_ENABLED: 'true',
    LOG_LEVEL: 'error',
    ...overrides,
  });
}

// HTTP tests: testApp() and client() from @averoa/core/testing.js.
