import { validate } from '@averoa/utilities';

// Request validation for routes that are not crud routes. Rules use the same
// `{ run, msg }` style as Model columns; any Standard Schema validator (zod,
// valibot, arktype) works as well, e.g. validate({ body: z.object({ ... }) }).
// Failures answer 422 { status: false, data: { column, message, in } }.
class AuthValidator {
  /** POST /api/auth/login */
  login = validate({
    body: {
      email: {
        type: 'string',
        format: 'email',
        example: 'demo@averoa.test',
        validation: [
          { run: (v) => v.validator.isEmail(v.value), msg: 'email format required' },
          { run: (v) => v.validator.isLength(v.value, { max: 254 }), msg: 'must be at most 254 characters' },
        ],
      },
      password: {
        type: 'string',
        example: 'password',
        // bounded: hashing very long passwords is a cheap denial of service
        validation: [{ run: (v) => v.validator.isLength(v.value, { max: 128 }), msg: 'must be at most 128 characters' }],
      },
    },
  });
}

export default new AuthValidator();
