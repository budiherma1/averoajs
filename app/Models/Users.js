import Model from './Model.js';

class Users extends Model {
  static tableName = 'users';
  static timestamp = true;
  static column = {
    id: {
      migration: (args) => args.table.increments(args.column).primary(),
      method: { post: false },
      validation: [{ validator: (args) => args.validator.isEmail(args.value), message: 'email format required' }],
    },
    first_name: {
      migration: (args) => args.table.string(args.column, 50).nullable(),
      seed: (faker) => faker.name.firstName(),
      method: { get: true, post: true },
      validation: [{ validator: (args) => args.validator.isEmail(args.value), message: 'email format required' }],
    },
    last_name: {
      migration: (args) => args.table.string(args.column, 50).nullable(),
      seed: (faker) => faker.name.firstName(),
      method: { get: true, post: true },
      validation: [{ validator: (args) => args.validator.isEmail(args.value), message: 'email format required' }],
    },
    email: {
      migration: (args) => args.table.string(args.column, 50).nullable(),
      seed: (faker) => faker.internet.email(this.column.first_name.value, this.column.last_name.value),
      method: { get: true, post: true },
      validation: [{ validator: (args) => args.validator.isEmail(args.value), message: 'email format required' }, { validator: (args) => !args.validator.isEmpty(args.value), message: 'email can`t be empty' }],
    },
    address: {
      migration: (args) => args.table.string(args.column, 255).nullable(),
      seed: (faker) => faker.address.streetAddress(true),
      method: { get: true, post: true },
      validation: [{ validator: (args) => args.validator.isEmail(args.value), message: 'email format required' }],
    },
    otp: {
      migration: (args) => args.table.string(args.column, 10).nullable(),
      seed: (faker) => faker.name.firstName(),
      method: { get: false },
      validation: [{ validator: (args) => args.validator.isEmail(args.value), message: 'email format required' }],
    },
  }
}

export default Users;