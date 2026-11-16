import { Model } from '@averoa/utilities';
import { PasswordHelper } from '#helpers';

const optional = (run) => (v) => v.value == null || v.value === '' || v.value === 'null' || v.value === 'undefined' || run(v);

class Users extends Model {
  static tableName = 'users';

  static timestamp = true;

  // never serialized and never selectable through `$select`
  static hidden = ['password', 'otp', 'token_version'];

  // email_verified_at, token_version and is_admin (added by the migration
  // 20261116100000_add_auth_columns_to_users.js) are deliberately not in `column`:
  // clients can never write them through Crud or validation.

  static column = {
    id: {
      migration: (m) => m.table.increments(m.column).primary(),
      flag: { required: false },
    },
    first_name: {
      migration: (m) => m.table.string(m.column, 50).nullable(),
      seed: (f) => f.person.firstName(),
      flag: { required: true },
      validation: [{ run: (v) => v.validator.isLength(String(v.value).trim(), { min: 1, max: 50 }), msg: 'must be 1-50 characters' }],
    },
    last_name: {
      migration: (m) => m.table.string(m.column, 50).nullable(),
      seed: (f) => f.person.lastName(),
      flag: { required: false },
      validation: [{ run: (v) => v.validator.isLength(String(v.value), { max: 50 }), msg: 'must be at most 50 characters' }],
    },
    email: {
      migration: (m) => m.table.string(m.column, 50).nullable(),
      seed: (f) => f.internet.email({
        firstName: this.column.first_name.value,
        lastName: this.column.last_name.value,
      }).toLowerCase(),
      flag: { required: true, unique: true },
      validation: [
        { run: (v) => !v.validator.isEmpty(String(v.value)), msg: 'email can`t be empty' },
        { run: (v) => v.validator.isEmail(String(v.value)), msg: 'email format required' },
        { run: (v) => v.validator.isLength(String(v.value), { max: 50 }), msg: 'must be at most 50 characters' },
      ],
    },
    // The column is created by database/migrations/20261116000000_add_password_to_users.js
    // (no `migration` key here, so the original users migration keeps creating the same table).
    password: {
      // seeders insert through raw knex (no model hooks), so the seed value is hashed already
      seed: () => PasswordHelper.hashSync('password'),
      // hidden, but clients may set it (hashed in $beforeInsert/$beforeUpdate)
      flag: { required: true, search: false, writable: true },
      validation: [{ run: (v) => v.validator.isLength(String(v.value), { min: 8, max: 128 }), msg: 'must be 8-128 characters' }],
    },
    address: {
      migration: (m) => m.table.string(m.column, 255).nullable(),
      seed: (f) => f.location.streetAddress(true),
      flag: { required: false },
      validation: [{ run: (v) => v.validator.isLength(String(v.value), { max: 255 }), msg: 'must be at most 255 characters' }],
    },
    otp: {
      migration: (m) => m.table.string(m.column, 20).nullable(),
      flag: { required: false, search: false },
      validation: [{ run: optional((v) => v.validator.isNumeric(String(v.value), { no_symbols: true }) && String(v.value).length <= 20), msg: 'must be numeric, at most 20 digits' }],
    },
  };

  /** Role flag of the authorization examples (TeacherPolicy). */
  isAdmin() {
    return Number(this.is_admin) === 1;
  }

  /** True once the email address was verified (EnsureEmailVerified middleware). */
  hasVerifiedEmail() {
    return this.email_verified_at != null;
  }

  normalizeEmail() {
    if (typeof this.email === 'string') this.email = this.email.trim().toLowerCase();
  }

  async hashPassword() {
    if (typeof this.password === 'string' && this.password !== '' && !PasswordHelper.isHash(this.password)) {
      this.password = await PasswordHelper.hash(this.password);
    }
  }

  async $beforeInsert(queryContext) {
    await super.$beforeInsert(queryContext);
    this.normalizeEmail();
    await this.hashPassword();
  }

  async $beforeUpdate(opt, queryContext) {
    await super.$beforeUpdate(opt, queryContext);
    this.normalizeEmail();
    await this.hashPassword();
  }
}

export default Users;
