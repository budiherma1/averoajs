
import { Users } from '@averoa/models';
export let up = Users.migrationUp.bind(Users);
export let down = Users.migrationDown.bind(Users);