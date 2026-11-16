/**
 * Knex configuration, read by @averoa/utilities (DB) and the knex CLI.
 *
 * DB_CLIENT: mysql2 (default) | pg | better-sqlite3 | sqlite3
 *   sqlite clients use DB_NAME as the file name (default ':memory:').
 */
export default (proc = process) => {
  const { env } = proc;
  let client = env.DB_CLIENT || 'mysql2';
  // the legacy `mysql` driver is no longer installed; mysql2 is a drop-in replacement
  if (client === 'mysql') client = 'mysql2';

  if (client === 'better-sqlite3' || client === 'sqlite3') {
    return {
      client,
      connection: { filename: env.DB_NAME || ':memory:' },
      useNullAsDefault: true,
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

  return { client, connection };
};
