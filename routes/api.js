import Router from '@averoa/routes';
import v2 from './v2/index.js';

const router = Router();
// for another sample, Please check : https://www.npmjs.com/package/@averoa/ave-route
router.get('/', 'SampleController@sampleMethod');
router.post('/users', 'SampleController@sampleMethodModelPost');
router.prefix('/v2', () => v2(router));

// this is prebuild route pattern of averoajs
router.crud('Teacher', 'teachers', () => { // first parameter is the models name, then the second is the prefix path
  router.get('/', 'TeacherController@findAll');
  router.get('/:id', 'TeacherController@findOne');
  router.post('/', 'TeacherController@create'); // use router.postForm if the request use multipart/form
  router.put('/:id', 'TeacherController@update'); // use router.putForm router.patchForm if the request use multipart/form
  router.delete('/:id', 'TeacherController@delete');
});

export default router;
