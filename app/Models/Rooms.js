import { Model } from '@averoa/utilities';

class Rooms extends Model {
  static tableName = 'rooms';

  static timestamp = true;

  static column = {
    id: {
      migration: (m) => m.table.increments(m.column).primary(),
      flag: { required: false },
    },
    room_name: {
      migration: (m) => m.table.string(m.column, 50).nullable(),
      seed: (f) => `Room ${f.person.firstName()}`,
      flag: { required: true },
      validation: [{ run: (v) => v.validator.isLength(String(v.value).trim(), { min: 1, max: 50 }), msg: 'must be 1-50 characters' }],
    },
    teacher_id: {
      migration: (m) => m.table.integer(m.column, 50).nullable(),
      flag: { required: true },
      validation: [{ run: (v) => v.validator.isInt(String(v.value), { min: 1 }), msg: 'must be a positive integer' }],
    },
  };
}

export default Rooms;
