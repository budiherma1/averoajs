import Router from '@averoa/routes';

const router = Router();
// for more samples, see https://www.npmjs.com/package/@averoa/routes
router.get('/', 'SampleController@sampleMethodView');
router.get('/users', 'SampleController@sampleMethodModel');
router.get('/teacher', 'TeacherController@index');

export default router;
