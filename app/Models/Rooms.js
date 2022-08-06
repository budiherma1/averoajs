import { Model } from '@averoa/utilities';

class Rooms extends Model {
  static tableName = 'rooms';

  static timestamp = true;

  static column = {
    id: {
      migration: (m) => m.table.increments(m.column).primary(),
      flag: { required: false },
      validation: [{ run: (v) => v.validator.isEmail(v.value), msg: 'email format required' }],
    },
    room_name: {
      migration: (m) => m.table.string(m.column, 50).nullable(),
      seed: (f) => f.name.firstName(),
      flag: { required: true },
      validation: [{ run: (v) => v.validator.isEmail(v.value), msg: 'email format required' }],
    },
    teacher_id: {
      migration: (m) => m.table.integer(m.column, 50).nullable(),
      flag: { required: true },
      //   seed: (f) => f.name.firstName(),
      //   method: { get: true, post: true },
      //   validation: [{ run: (v) => v.validator.isEmail(v.value), msg: 'email format required' }],
    },
  };
}

export default Rooms;
