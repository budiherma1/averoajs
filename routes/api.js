import averoa from '@averoa/routes';

const router = averoa.Router();
// for another sample, Please check : https://www.npmjs.com/package/@averoa/ave-route
router.get('/', 'SampleController@sampleMethod');
router.post('/users', 'SampleController@sampleMethodModelPost');

export default router.router;
