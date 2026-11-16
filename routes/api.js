import Router from '@averoa/routes';
import { can } from '@averoa/utilities';
import { Teacher } from '#models';
import auth from './auth.js';
import v2 from './v2/index.js';

const router = Router();
// for more samples, see https://www.npmjs.com/package/@averoa/routes
router.get('/', 'SampleController@sampleMethod');
router.prefix('/v2', () => v2(router));

// authentication: login, registration, refresh tokens, password reset, email verification
auth(router);

router.middleware(['AuthMiddleware'], () => {
  // admin-only sample (verified email + the 'admin' ability): it lists users with their emails
  router.post('/users', 'SampleController@sampleMethodModelPost', ['EnsureEmailVerified', can('admin')]);
});

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
