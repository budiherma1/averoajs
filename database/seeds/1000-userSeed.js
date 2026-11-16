import { Users } from '#models';
import { PasswordHelper } from '#helpers';

// Development data only. Every seeded user has the password "password".
export const DEMO_USER = { email: 'demo@averoa.test', password: 'password' };
// a verified account without the admin role
export const MEMBER_USER = { email: 'member@averoa.test', password: 'password' };

export async function seed(knex) {
  await Users.seeder(10, knex);

  // known accounts for trying POST /api/auth/login
  const now = new Date();
  await knex(Users.tableName).insert([
    {
      first_name: 'Demo',
      last_name: 'User',
      email: DEMO_USER.email,
      password: PasswordHelper.hashSync(DEMO_USER.password),
      email_verified_at: now,
      is_admin: true,
    },
    {
      first_name: 'Member',
      last_name: 'User',
      email: MEMBER_USER.email,
      password: PasswordHelper.hashSync(MEMBER_USER.password),
      email_verified_at: now,
      is_admin: false,
    },
  ]);
}
