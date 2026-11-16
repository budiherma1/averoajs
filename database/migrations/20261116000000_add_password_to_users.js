// Adds the `password` column (scrypt hash, see app/Helpers/PasswordHelper.js) to `users`.
export async function up(knex) {
  if (await knex.schema.hasColumn('users', 'password')) return;
  await knex.schema.alterTable('users', (table) => {
    table.string('password', 255).nullable();
  });
}

export async function down(knex) {
  if (!(await knex.schema.hasColumn('users', 'password'))) return;
  await knex.schema.alterTable('users', (table) => {
    table.dropColumn('password');
  });
}
