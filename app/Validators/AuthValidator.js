import { validate } from '@averoa/utilities';

// Request validation for routes that are not crud routes. Rules use the same
// `{ run, msg }` style as Model columns; any Standard Schema validator (zod,
// valibot, arktype) works as well, e.g. validate({ body: z.object({ ... }) }).
// Failures answer 422 { status: false, data: { column, message, in } }.
//
// Deeper rules (password length, name format, a taken email) stay in the Users
// model and AuthService; these rules bound the input and document it for OpenAPI.

const maxLength = (max) => ({
  run: (v) => v.validator.isLength(v.value, { max }), msg: `must be at most ${max} characters`,
});

/**
 * A string field of a JSON body. `type: 'string'` alone would turn 123 or true
 * into '123' / 'true'; credentials and tokens must arrive as real strings.
 */
const text = (name, { max, rules = [], ...def } = {}) => ({
  type: 'string',
  ...def,
  validation: [
    { run: (v) => typeof v.data[name] === 'string', msg: 'must be a string' },
    ...(max ? [maxLength(max)] : []),
    ...rules,
  ],
});

const email = text('email', {
  format: 'email',
  example: 'demo@averoa.test',
  max: 254,
  // surrounding spaces and case are normalised by UserRepository (and the login limiter)
  rules: [{ run: (v) => v.validator.isEmail(v.value.trim()), msg: 'email format required' }],
});

// bounded: hashing very long passwords is a cheap denial of service
const password = text('password', { description: '8-128 characters', example: 'password', max: 128 });

// tokens are 43-character base64url strings; anything much longer is not a token
const token = text('token', { description: 'Token from the emailed link', max: 128 });

class AuthValidator {
  /** POST /api/auth/login */
  login = validate({ body: { email, password } });

  /** POST /api/auth/register */
  register = validate({
    body: {
      first_name: text('first_name', { example: 'Ada', max: 50 }),
      last_name: text('last_name', { required: false, max: 50 }),
      email,
      password,
      address: text('address', { required: false, max: 255 }),
    },
  });

  /** POST /api/auth/forgot-password */
  forgotPassword = validate({ body: { email } });

  /** POST /api/auth/reset-password */
  resetPassword = validate({ body: { token, password } });

  /** POST /api/auth/refresh */
  refresh = validate({ body: { refresh_token: text('refresh_token', { max: 128 }) } });

  /** POST /api/auth/verify-email */
  verifyEmailBody = validate({ body: { token } });

  /** GET /api/auth/verify-email?token= (query values are always strings) */
  verifyEmailQuery = validate({
    query: { token: { type: 'string', description: 'Token from the emailed link', validation: [maxLength(128)] } },
  });
}

export default new AuthValidator();
