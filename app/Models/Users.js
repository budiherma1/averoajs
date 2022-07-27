import Model from './Model.js';

class Users extends Model {
  static tableName = 'users';

  static timestamp = true;

  static column = {
    id: {
      migration: (m) => m.table.increments(m.column).primary(),
      method: { post: false },
      validation: [{ run: (v) => v.validator.isEmail(v.value), msg: 'email format required' }],
    },
    first_name: {
      migration: (m) => m.table.string(m.column, 50).nullable(),
      seed: (f) => f.name.firstName(),
      method: { get: true, post: true },
      validation: [{ run: (v) => v.validator.isEmail(v.value), msg: 'email format required' }],
    },
    last_name: {
      migration: (m) => m.table.string(m.column, 50).nullable(),
      seed: (f) => f.name.firstName(),
      method: { get: true, post: true },
      validation: [{ run: (v) => v.validator.isEmail(v.value), msg: 'email format required' }],
    },
    email: {
      migration: (m) => m.table.string(m.column, 50).nullable(),
      seed: (f) => f.internet.email(this.column.first_name.value, this.column.last_name.value),
      method: { get: true, post: true },
      validation: [{ run: (v) => v.validator.isEmail(v.value), msg: 'email format required' }, { run: (v) => !v.validator.isEmpty(v.value), msg: 'email can`t be empty' }],
    },
    address: {
      migration: (m) => m.table.string(m.column, 255).nullable(),
      seed: (f) => f.address.streetAddress(true),
      method: { get: true, post: true },
      validation: [{ run: (v) => v.validator.isEmail(v.value), msg: 'email format required' }],
    },
    otp: {
      migration: (m) => m.table.string(m.column, 10).nullable(),
      seed: (f) => f.name.firstName(),
      method: { get: false },
      validation: [{ run: (v) => v.validator.isEmail(v.value), msg: 'email format required' }],
    },
  };
}

export default Users;
