import { Model } from '@averoa/utilities';

class Users extends Model {
  static tableName = 'users';

  static timestamp = true;

  static column = {
    id: {
      migration: (m) => m.table.increments(m.column).primary(),
      flag: { required: false },
      validation: [{ run: (v) => v.validator.isEmail(v.value), msg: 'email format required' }],
    },
    first_name: {
      migration: (m) => m.table.string(m.column, 50).nullable(),
      seed: (f) => f.name.firstName(),
      flag: { required: true },
      validation: [{ run: (v) => v.validator.isEmail(v.value), msg: 'email format required' }],
    },
    last_name: {
      migration: (m) => m.table.string(m.column, 50).nullable(),
      seed: (f) => f.name.firstName(),
      flag: { required: true },
      validation: [{ run: (v) => v.validator.isEmail(v.value), msg: 'email format required' }],
    },
    email: {
      migration: (m) => m.table.string(m.column, 50).nullable(),
      seed: (f) => f.internet.email(this.column.first_name.value, this.column.last_name.value),
      flag: { required: true },
      validation: [{ run: (v) => v.validator.isEmail(v.value), msg: 'email format required' }, { run: (v) => !v.validator.isEmpty(v.value), msg: 'email can`t be empty' }],
    },
    address: {
      migration: (m) => m.table.string(m.column, 255).nullable(),
      seed: (f) => f.address.streetAddress(true),
      flag: { required: true },
      validation: [{ run: (v) => v.validator.isEmail(v.value), msg: 'email format required' }],
    },
    otp: {
      migration: (m) => m.table.string(m.column, 20).nullable(),
      seed: (f) => f.name.firstName(),
      flag: { required: true },
      validation: [{ run: (v) => v.validator.isEmail(v.value), msg: 'email format required' }],
    },
  };
}

export default Users;
