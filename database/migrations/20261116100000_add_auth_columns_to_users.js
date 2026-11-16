// Columns used by the authentication flows (app/Services/AuthService.js):
// - email_verified_at: set once the user opened the verification link (EnsureEmailVerified)
// - token_version: part of every access token; incremented by logout-all and password
//   resets, which invalidates every access token issued before (app/Strategies/JwtStrategy.js)
// - is_admin: role flag for authorization (the 'admin' ability and policies' before())
const COLUMNS = {
  email_verified_at: (table) => table.datetime('email_verified_at').nullable(),
  token_version: (table) => table.integer('token_version').notNullable().defaultTo(0),
  is_admin: (table) => table.boolean('is_admin').notNullable().defaultTo(false),
};

export async function up(knex) {
  for (const [column, add] of Object.entries(COLUMNS)) {
    if (await knex.schema.hasColumn('users', column)) continue;
    await knex.schema.alterTable('users', (table) => { add(table); });
  }
}

export async function down(knex) {
  for (const column of Object.keys(COLUMNS).reverse()) {
    if (!(await knex.schema.hasColumn('users', column))) continue;
    await knex.schema.alterTable('users', (table) => { table.dropColumn(column); });
  }
}
