// One account per email address. The application checks for duplicates before
// it inserts (Users.isDuplicate), but two registrations at the same moment both
// pass that check; this index makes the database refuse the second one
// (AuthService.register answers 422 "email is already registered").
// NULL emails are allowed several times on MySQL, PostgreSQL and SQLite.
const INDEX = 'users_email_unique';

export async function up(knex) {
  const duplicates = await knex('users')
    .select('email')
    .whereNotNull('email')
    .groupBy('email')
    .havingRaw('count(*) > 1')
    .limit(5);
  if (duplicates.length) {
    const list = duplicates.map((row) => row.email).join(', ');
    throw new Error(`users.email has duplicates (${list}${duplicates.length === 5 ? ', ...' : ''}). `
      + 'Merge or rename them, then run the migration again.');
  }
  await knex.schema.alterTable('users', (table) => { table.unique(['email'], { indexName: INDEX }); });
}

export async function down(knex) {
  await knex.schema.alterTable('users', (table) => { table.dropUnique(['email'], INDEX); });
}
