import { Model } from 'objection';

class Users extends Model {
  static tableName = 'users';
}

export default Users;