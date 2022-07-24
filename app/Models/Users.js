import Model from './Model.js';

class Users extends Model {
  static tableName = 'users';
  static timestamp = true;
  static seedRow = 20;
  static column = {
    id: {
      migration: (args) => args.table.increments(args.column).primary(),
      post: false,
      validation: (args) => 'coming soon',
    },
    first_name: {
      migration: (args) => args.table.string(args.column, 50).nullable(),
      seed: (faker) => faker.name.firstName(),
      get: true,
      post: true,
      validation: (args) => 'coming soon',
    },
    last_name: {
      migration: (args) => args.table.string(args.column, 50).nullable(),
      seed: (faker) => faker.name.firstName(),
      get: true,
      post: true,
      validation: (args) => 'coming soon',
    },
    email: {
      migration: (args) => args.table.string(args.column, 50).nullable(),
      seed: (faker) => faker.internet.email(Users.column.first_name.value, Users.column.last_name.value),
      get: true,
      post: true,
      validation: (args) => 'coming soon',
    },
    address: {
      migration: (args) => args.table.string(args.column, 255).nullable(),
      seed: (faker) => faker.address.streetAddress(true),
      get: true,
      post: true,
      validation: (args) => 'coming soon',
    },
    otp: {
      migration: (args) => args.table.string(args.column, 10).nullable(),
      seed: (faker) => faker.name.firstName(),
      get: false,
      validation: (args) => 'coming soon',
    },
  }
}

export default Users;