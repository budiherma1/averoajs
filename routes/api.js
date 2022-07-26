import route, {router} from '@averoa/routes';

// for another sample, Please check : https://www.npmjs.com/package/@averoa/ave-route
route.get('/', 'SampleController@sampleMethod');
route.post('/users', 'SampleController@sampleMethodModelPost');
export default router