import { Users } from '@averoa/models';

export const up = Users.migrationUp.bind(Users);
export const down = Users.migrationDown.bind(Users);
