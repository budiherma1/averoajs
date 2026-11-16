import Router from '@averoa/routes';
import AuthValidator from '#app/Validators/AuthValidator.js';
import v2 from './v2/index.js';

const router = Router();
// for more samples, see https://www.npmjs.com/package/@averoa/routes
router.get('/', 'SampleController@sampleMethod');
router.prefix('/v2', () => v2(router));

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
            properties: { token: { type: 'string' }, type: { const: 'Bearer' }, expires_in: { type: 'string' } },
          },
        },
      },
    },
    401: 'Invalid email or password',
  },
});
router.middleware(['AuthMiddleware'], () => {
  router.get('/auth/me', 'AuthController@me').doc({ summary: 'The authenticated user', tags: ['Auth'] });
  router.post('/users', 'SampleController@sampleMethodModelPost'); // returns users' emails and addresses
});

// this is prebuild route pattern of averoajs
// reads are public; writes need a JWT (route middleware runs before the crud validation)
router.crud('Teacher', 'teachers', () => { // first parameter is the models name, then the second is the prefix path
  router.get('/', 'TeacherController@findAll');
  router.get('/:id', 'TeacherController@findOne');
  router.post('/', 'TeacherController@create', ['AuthMiddleware']); // use router.postForm if the request use multipart/form
  router.put('/:id', 'TeacherController@update', ['AuthMiddleware']); // use router.putForm router.patchForm if the request use multipart/form
  router.delete('/:id', 'TeacherController@delete', ['AuthMiddleware']);
});

export default router;
