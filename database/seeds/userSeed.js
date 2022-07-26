import { Users } from '@averoa/models';
export let seed = Users.seederCustom.bind(Users, 10, () => { 
	return {first_name: Math.floor(Math.random() * 5) + 1 + 'a', email: 'wewewew'}
});