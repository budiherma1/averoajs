import { Users } from '@averoa/models';

export const seed = Users.seederCustom.bind(Users, 10, () => ({ first_name: `${Math.floor(Math.random() * 5) + 1}a`, email: 'wewewew' }));
