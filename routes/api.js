import Router from '@averoa/routes';
import { can } from '@averoa/utilities';
import { Teacher } from '#models';
import AuthRateLimit from '#app/Middleware/AuthRateLimitMiddleware.js';
import v2 from './v2/index.js';

const router = Router();
// for more samples, see https://www.npmjs.com/package/@averoa/routes
router.get('/', 'SampleController@sampleMethod');
router.prefix('/v2', () => v2(router));

// JWT auth example: POST /api/auth/login,
// then call the routes below with "Authorization: Bearer <token>"
router.post('/auth/login', 'AuthController@login');
router.middleware(['AuthMiddleware'], () => {
  router.get('/auth/me', 'AuthController@me');
  router.post('/users', 'SampleController@sampleMethodModelPost'); // returns users' emails and addresses
});

// ---- Authentication flows: registration, refresh tokens, password reset, email verification ----
// Login answers an access token (JWT_ACCESS_TTL) and a rotating refresh token (JWT_REFRESH_TTL).
// Rate limits (app/Middleware/AuthRateLimitMiddleware.js, AUTH_RATE_LIMIT_*), per IP and endpoint:
// `strict` counts every request (they send email or create rows), `failures` only failed ones.
// Bodies are validated by app/Services/AuthService.js (422 { status: false, data: { column } }).
const strict = [AuthRateLimit.strict.handle];
const failures = [AuthRateLimit.failures.handle];
// { first_name, last_name?, email, password, address? }
router.post('/auth/register', 'AuthController@register', strict);
router.post('/auth/forgot-password', 'PasswordResetController@forgot', strict); // { email }, always the same 200
router.post('/auth/refresh', 'AuthController@refresh', failures); // { refresh_token }
router.post('/auth/reset-password', 'PasswordResetController@reset', failures); // { token, password }
router.get('/auth/verify-email', 'EmailVerificationController@verify', failures); // ?token=
router.post('/auth/verify-email', 'EmailVerificationController@verify', failures); // { token }
router.middleware(['AuthMiddleware'], () => {
  router.post('/auth/logout', 'AuthController@logout'); // ends this session
  router.post('/auth/logout-all', 'AuthController@logoutAll'); // ends every session
  // per-user throttle in AuthService: 429 + Retry-After when the last link is too recent
  router.post('/auth/resend-verification', 'EmailVerificationController@resend');
});
// ---- end of authentication flows ----

// ---- Authorization: can(ability, loader) checks app/Policies/TeacherPolicy.js (registered in
// app/Providers/AuthProvider.js): 401 without a user, 404 for an unknown id, 403 when denied ----
const findTeacher = (req) => (/^\d+$/.test(req.params.id)
  ? Teacher.query().findById(req.params.id).whereNull('deleted_at')
  : null);

// this is prebuild route pattern of averoajs
// reads are public; writes need a JWT (route middleware runs before the crud validation)
router.crud('Teacher', 'teachers', () => { // first parameter is the models name, then the second is the prefix path
  router.get('/', 'TeacherController@findAll');
  router.get('/:id', 'TeacherController@findOne');
  router.post('/', 'TeacherController@create', ['AuthMiddleware', 'EnsureEmailVerified']); // use router.postForm if the request use multipart/form
  router.put('/:id', 'TeacherController@update', ['AuthMiddleware', can('update', findTeacher)]); // use router.putForm router.patchForm if the request use multipart/form
  router.delete('/:id', 'TeacherController@delete', ['AuthMiddleware', can('delete', findTeacher)]);
});

export default router;
