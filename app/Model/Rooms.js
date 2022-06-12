const { Model } = require('objection');

class Rooms extends Model {
  static get tableName() {
    return 'rooms';
  }
}

module.exports = Rooms;