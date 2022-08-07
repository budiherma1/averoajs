import { Users } from '@averoa/models';

export const seed = Users.seeder.bind(Users, 10);
