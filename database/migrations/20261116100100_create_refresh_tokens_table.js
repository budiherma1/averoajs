// Rotating refresh tokens (app/Repositories/RefreshTokenRepository.js). Only the
// SHA-256 hash of a token is stored. Every login starts a `family`; each refresh
// revokes the presented token and adds the next one to the same family. Presenting
// a revoked (already rotated) token again revokes the whole family.
export async function up(knex) {
  if (await knex.schema.hasTable('refresh_tokens')) return;
  await knex.schema.createTable('refresh_tokens', (table) => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().notNullable()
      .references('id').inTable('users').onDelete('CASCADE');
    table.string('family', 36).notNullable();
    table.string('token_hash', 64).notNullable().unique();
    table.datetime('expires_at').notNullable();
    table.datetime('revoked_at').nullable();
    // rotated | logout | logout_all | reuse_detected | password_reset
    table.string('revoked_reason', 30).nullable();
    table.datetime('created_at').notNullable().defaultTo(knex.fn.now());
    table.index(['family']);
    table.index(['user_id', 'revoked_at']);
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('refresh_tokens');
}
