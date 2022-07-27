import route, { router } from '@averoa/routes';

// for another sample, Please check : https://www.npmjs.com/package/@averoa/ave-route
route.get('/', 'SampleController@sampleMethodView');
route.get('/users', 'SampleController@sampleMethodModel');
route.get('/utils', 'SampleController@sampleMethodUtils');

export default router;
