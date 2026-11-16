import { Users } from '#models';
import { PasswordHelper } from '#helpers';

// Development data only. Every seeded user has the password "password".
export const DEMO_USER = { email: 'demo@averoa.test', password: 'password' };

export async function seed(knex) {
  await Users.seeder(10, knex);

  // a known account for trying POST /api/auth/login
  await knex(Users.tableName).insert({
    first_name: 'Demo',
    last_name: 'User',
    email: DEMO_USER.email,
    password: PasswordHelper.hashSync(DEMO_USER.password),
  });
}
