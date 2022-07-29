import Router from '@averoa/routes';

const router = Router();
// for another sample, Please check : https://www.npmjs.com/package/@averoa/ave-route
router.get('/', 'SampleController@sampleMethodView');
router.get('/users', 'SampleController@sampleMethodModel');

export default router.router;
