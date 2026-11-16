import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Knex configuration, read by @averoa/utilities (DB) and the knex CLI.
 *
 * DB_CLIENT: mysql2 (default) | pg | better-sqlite3 | sqlite3
 *   sqlite clients use DB_NAME as the file name (default ':memory:'); a relative
 *   name is resolved against the application root, so the app and the knex CLI
 *   open the same file.
 * DB_TIMEZONE (mysql2 only): Z (default, UTC) | an offset such as +07:00 | local
 *   Sets both the driver's `timezone` (JS Dates written by the app) and the
 *   session `time_zone` (CURRENT_TIMESTAMP, TIMESTAMP columns), so created_at
 *   filled by MySQL and deleted_at written by Crud use the same zone. `local`
 *   keeps the old behaviour (Node.js time zone for the driver, server default
 *   for the session), which mixes zones when the two differ.
 */

const appRoot = fileURLToPath(new URL('..', import.meta.url));
const sqliteFile = (name) => (!name || name === ':memory:' || name.startsWith('file:')
  ? name || ':memory:'
  : path.resolve(appRoot, name));

// ES module templates for `npm run migrate:make` / `seed:make` (knex's own stubs are
// CommonJS). Absolute paths: the knex CLI runs from node_modules/@averoa/core.
const stub = (name) => path.join(appRoot, 'database', 'stubs', name);
const stubs = {
  migrations: { stub: stub('migration.stub') },
  seeds: { stub: stub('seed.stub') },
};

function mysqlTimezone(value) {
  const tz = String(value ?? '').trim();
  if (!tz || tz === 'Z' || tz.toUpperCase() === 'UTC') return { driver: 'Z', session: '+00:00' };
  if (tz.toLowerCase() === 'local') return null;
  if (/^[+-](0\d|1[0-4]):[0-5]\d$/.test(tz)) return { driver: tz, session: tz };
  throw new Error(`DB_TIMEZONE must be Z, UTC, local or an offset such as +07:00 (got "${tz}")`);
}

export default (proc = process) => {
  const { env } = proc;
  let client = env.DB_CLIENT || 'mysql2';
  // the legacy `mysql` driver is no longer installed; mysql2 is a drop-in replacement
  if (client === 'mysql') client = 'mysql2';

  if (client === 'better-sqlite3' || client === 'sqlite3') {
    return {
      client,
      connection: { filename: sqliteFile(env.DB_NAME) },
      useNullAsDefault: true,
      ...stubs,
    };
  }

  const connection = {
    host: env.DB_HOST,
    port: env.DB_PORT ? Number(env.DB_PORT) : undefined,
    user: env.DB_USER,
    password: env.DB_PASS,
    database: env.DB_NAME,
  };
  const config = { client, connection, ...stubs };
  if (client === 'mysql2') {
    connection.dateStrings = true;
    const tz = mysqlTimezone(env.DB_TIMEZONE);
    if (tz) {
      connection.timezone = tz.driver;
      config.pool = {
        afterCreate: (conn, done) => conn.query('SET time_zone = ?', [tz.session], (err) => done(err, conn)),
      };
    }
  }

  return config;
};
