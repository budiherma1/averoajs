import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Knex configuration, read by @averoa/utilities (DB) and the knex CLI.
 *
 * DB_CLIENT: mysql2 (default) | pg | better-sqlite3 | sqlite3
 *   sqlite clients use DB_NAME as the file name (default ':memory:'); a relative
 *   name is resolved against the application root, so the app and the knex CLI
 *   open the same file.
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
  if (client === 'mysql2') connection.dateStrings = true;

  return { client, connection, ...stubs };
};
