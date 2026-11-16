import { Model } from '@averoa/utilities';
import Rooms from './Rooms.js';

class Teacher extends Model {
  static tableName = 'teacher';

  static timestamp = true;

  static column = {
    id: {
      migration: (m) => m.table.increments(m.column).primary(),
      flag: { required: false },
    },
    teacher_name: {
      migration: (m) => m.table.string(m.column, 50).nullable(),
      seed: (f) => f.person.firstName(),
      validation: [{ run: (v) => v.validator.isLength(String(v.value).trim(), { min: 1, max: 50 }), msg: 'must be 1-50 characters' }],
      flag: { required: true },
    },
    type: {
      migration: (m) => m.table.smallint(m.column).nullable(),
      seed: (f) => f.number.int({ min: 1, max: 3 }),
      validation: [{ run: (v) => v.validator.isInt(String(v.value), { min: 1, max: 3 }), msg: 'must be an integer between 1 and 3' }],
      flag: { required: true },
    },
    address: {
      migration: (m) => m.table.string(m.column, 200).nullable(),
      seed: (f) => f.location.streetAddress(true),
      validation: [{ run: (v) => v.validator.isLength(String(v.value), { max: 200 }), msg: 'must be at most 200 characters' }],
      flag: { required: false },
    },
    images: {
      migration: (m) => m.table.string(m.column, 200).nullable(),
      validation: [{ run: (v) => v.validator.isLength(String(v.value), { max: 200 }), msg: 'must be at most 200 characters' }],
      flag: { required: false, search: false },
    },
    description: {
      migration: (m) => m.table.string(m.column, 255).nullable(),
      seed: (f) => f.lorem.sentence(),
      validation: [{ run: (v) => v.validator.isLength(String(v.value), { max: 255 }), msg: 'must be at most 255 characters' }],
      flag: { required: false },
    },
    saldo: {
      migration: (m) => m.table.integer(m.column, 50).nullable(),
      seed: (f) => f.number.int({ min: 100000, max: 1000000 }),
      validation: [{ run: (v) => v.validator.isInt(String(v.value), { min: 0 }), msg: 'must be a non-negative integer' }],
      flag: { required: false },
    },
    teacher_class: {
      migration: (m) => m.table.string(m.column, 50).nullable(),
      seed: (f) => String(f.number.int({ min: 1, max: 10 })),
      validation: [{ run: (v) => v.validator.isLength(String(v.value), { max: 50 }), msg: 'must be at most 50 characters' }],
      flag: { required: false },
    },
    user_id: {
      migration: (m) => m.table.integer(m.column, 50).nullable(),
      seed: (f) => f.number.int({ min: 1, max: 10 }),
      validation: [{ run: (v) => v.validator.isInt(String(v.value), { min: 1 }), msg: 'must be a positive integer' }],
      flag: { required: false },
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
