import { Model } from '@averoa/utilities';
import Rooms from './Rooms.js';

class Teacher extends Model {
  static tableName = 'teacher';

  static timestamp = true;

  static column = {
    id: {
      migration: (m) => m.table.increments(m.column).primary(),
      validation: [{ run: (v) => v.validator.isEmail(v.value), msg: 'email format required' }],
      flag: { required: false },
    },
    teacher_name: {
      migration: (m) => m.table.string(m.column, 50).nullable(),
      seed: (f) => f.name.firstName(),
      validation: [{ run: (v) => v.validator.isEmail(v.value), msg: 'email format required' }],
      flag: { required: true },
    },
    type: {
      migration: (m) => m.table.smallint(m.column).nullable(),
      seed: (f) => f.datatype.number({ min: 1, max: 3 }),
      validation: [{ run: (v) => v.validator.isEmail(v.value), msg: 'email format required' }],
      flag: { required: true },
    },
    address: {
      migration: (m) => m.table.string(m.column, 200).nullable(),
      seed: (f) => f.name.firstName(),
      validation: [{ run: (v) => v.validator.isEmail(v.value), msg: 'email format required' }],
      flag: { required: true },
    },
    images: {
      migration: (m) => m.table.string(m.column, 200).nullable(),
      seed: (f) => f.name.firstName(),
      validation: [{ run: (v) => v.validator.isEmail(v.value), msg: 'email format required' }],
      flag: { required: true },
    },
    description: {
      migration: (m) => m.table.string(m.column, 255).nullable(),
      seed: (f) => f.name.firstName(),
      validation: [{ run: (v) => v.validator.isEmail(v.value), msg: 'email format required' }],
      flag: { required: true },
    },
    saldo: {
      migration: (m) => m.table.integer(m.column, 50).nullable(),
      seed: (f) => f.datatype.number({ min: 100000, max: 1000000 }),
      validation: [{ run: (v) => v.validator.isEmail(v.value), msg: 'email format required' }],
      flag: { required: true },
    },
    teacher_class: {
      migration: (m) => m.table.string(m.column, 50).nullable(),
      seed: (f) => f.datatype.number({ min: 1, max: 10 }),
      validation: [{ run: (v) => v.validator.isEmail(v.value), msg: 'email format required' }],
      flag: { required: true },
    },
    user_id: {
      migration: (m) => m.table.integer(m.column, 50).nullable(),
      seed: (f) => f.datatype.number({ min: 1, max: 100 }),
      validation: [{ run: (v) => v.validator.isEmail(v.value), msg: 'email format required' }],
      flag: { required: true },
    },
  };

  static relationMappings = () => ({
    rooms: {
      relation: Model.HasManyRelation,
      modelClass: Rooms,
      join: {
        from: 'teacher.id',
        to: 'rooms.teacher_id',
      },
    },
  });
}

export default Teacher;
