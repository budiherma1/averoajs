// Single-use tokens sent by email (app/Repositories/UserTokenRepository.js):
// type `password_reset` or `email_verification`. Only the SHA-256 hash is stored,
// with the address it was sent to, an expiry and the time it was used.
export async function up(knex) {
  if (await knex.schema.hasTable('user_tokens')) return;
  await knex.schema.createTable('user_tokens', (table) => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().notNullable()
      .references('id').inTable('users').onDelete('CASCADE');
    table.string('type', 30).notNullable();
    table.string('token_hash', 64).notNullable().unique();
    table.string('email', 255).notNullable();
    table.datetime('expires_at').notNullable();
    table.datetime('used_at').nullable();
    table.datetime('created_at').notNullable().defaultTo(knex.fn.now());
    table.index(['user_id', 'type']);
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('user_tokens');
}
