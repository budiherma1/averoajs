import Router from '@averoa/routes';

const router = Router();
// for another sample, Please check : https://www.npmjs.com/package/@averoa/ave-route
router.get('/', 'SampleController@sampleMethod');
router.post('/users', 'SampleController@sampleMethodModelPost');

// this is prebuild route pattern of averoajs
router.set('Teacher', 'teachers', () => { // first parameter is the models name, then the second is the prefix path
  router.get('/', 'TeacherController@findAll');
  router.get('/:id', 'TeacherController@findOne');
  router.post('/', 'TeacherController@create'); // use router.postForm if the request use multipart/form
  router.patch('/:id', 'TeacherController@update'); // use router.patchForm if the request use multipart/form
  router.delete('/:id', 'TeacherController@delete');
});

export default router.router;
