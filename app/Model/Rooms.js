const { Model } = require('objection');

class Rooms extends Model {
  static tableName = 'rooms';
}

module.exports = Rooms;