const { Model } = require('objection');

class Users extends Model {
  static tableName = 'users';
}

module.exports = Users;