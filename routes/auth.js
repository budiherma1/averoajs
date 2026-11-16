import AuthValidator from '#app/Validators/AuthValidator.js';
import AuthRateLimit from '#app/Middleware/AuthRateLimitMiddleware.js';

/**
 * Authentication routes, mounted under /api by routes/api.js: login, the current user,
 * registration, refresh tokens, logout, password reset and email verification.
 *
 * @param {import('@averoa/routes').AveroaRouter} router
 */
export default function auth(router) {
  // JWT auth example: POST /api/auth/login,
  // then call the routes below with "Authorization: Bearer <token>"
  // the login limiter (429 after repeated failures, LOGIN_RATE_LIMIT_*) runs before validation
  const loginMiddleware = ['LoginRateLimitMiddleware', AuthValidator.login];
  router.post('/auth/login', 'AuthController@login', loginMiddleware).doc({
    summary: 'Log in and get a JWT',
    tags: ['Auth'],
    responses: {
      200: {
        description: 'Bearer token for the Authorization header',
        schema: {
          type: 'object',
          properties: {
            status: { const: true },
            data: {
              type: 'object',
              properties: {
                token: { type: 'string' },
                type: { const: 'Bearer' },
                expires_in: { type: 'integer', description: 'Access token lifetime in seconds' },
                refresh_token: { type: 'string' },
                refresh_expires_in: { type: 'integer', description: 'Refresh token lifetime in seconds' },
              },
            },
          },
        },
      },
      401: 'Invalid email or password',
    },
  });
  router.middleware(['AuthMiddleware'], () => {
    router.get('/auth/me', 'AuthController@me').doc({ summary: 'The authenticated user', tags: ['Auth'] });
  });

  // ---- registration, refresh tokens, password reset, email verification ----
  // Login answers an access token (JWT_ACCESS_TTL) and a rotating refresh token (JWT_REFRESH_TTL).
  // Rate limits (app/Middleware/AuthRateLimitMiddleware.js, AUTH_RATE_LIMIT_*), per IP and
  // endpoint, in the RATE_LIMIT_STORE store: `strict` counts every request (they send email or
  // create rows), `failures` only failed ones. The limiter runs before validation, so malformed
  // requests count too.
  const strict = [AuthRateLimit.strict.handle];
  const failures = [AuthRateLimit.failures.handle];
  const tags = ['Auth'];
  router.post('/auth/register', 'AuthController@register', [...strict, AuthValidator.register]).doc({
    summary: 'Create an account; a verification email is sent', tags, responses: { 201: 'Created, with a token pair', 422: 'Invalid field or email taken', 429: 'Too many requests' },
  });
  router.post('/auth/forgot-password', 'PasswordResetController@forgot', [...strict, AuthValidator.forgotPassword]).doc({
    summary: 'Email a password reset link', description: 'Always the same 200, whether or not the account exists.', tags, responses: { 200: 'Accepted', 429: 'Too many requests' },
  });
  router.post('/auth/refresh', 'AuthController@refresh', [...failures, AuthValidator.refresh]).doc({
    summary: 'Exchange a refresh token for a new token pair', description: 'The old refresh token is revoked; reusing it revokes the whole session.', tags, responses: { 200: 'New token pair', 401: 'Invalid, expired or reused refresh token', 429: 'Too many failed attempts' },
  });
  router.post('/auth/reset-password', 'PasswordResetController@reset', [...failures, AuthValidator.resetPassword]).doc({
    summary: 'Set a new password with a reset token', description: 'Ends every session of the user.', tags, responses: { 200: 'Password changed', 400: 'Invalid or expired token', 429: 'Too many failed attempts' },
  });
  router.get('/auth/verify-email', 'EmailVerificationController@verify', [...failures, AuthValidator.verifyEmailQuery]).doc({
    summary: 'Verify an email address (link without a front end)', tags, responses: { 200: 'Verified', 400: 'Invalid or expired token', 429: 'Too many failed attempts' },
  });
  router.post('/auth/verify-email', 'EmailVerificationController@verify', [...failures, AuthValidator.verifyEmailBody]).doc({
    summary: 'Verify an email address', tags, responses: { 200: 'Verified', 400: 'Invalid or expired token', 429: 'Too many failed attempts' },
  });
  router.middleware(['AuthMiddleware'], () => {
    router.post('/auth/logout', 'AuthController@logout').doc({ summary: 'End this session', tags });
    router.post('/auth/logout-all', 'AuthController@logoutAll').doc({ summary: 'End every session of the user', tags });
    // per-user throttle in AuthService: 429 + Retry-After when the last link is too recent
    router.post('/auth/resend-verification', 'EmailVerificationController@resend').doc({
      summary: 'Send the verification email again', tags, responses: { 200: 'Sent (or already verified)', 429: 'Last link sent too recently' },
    });
  });
}
