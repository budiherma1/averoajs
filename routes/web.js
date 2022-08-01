import Router from '@averoa/routes';

const router = Router();
// for another sample, Please check : https://www.npmjs.com/package/@averoa/ave-route
router.get('/', 'SampleController@sampleMethodView');
router.get('/users', 'SampleController@sampleMethodModel');

router.set('Teacher', 'teachers', () => {
  router.get('/', 'TeacherController@findAll');
  router.get('/:id', 'TeacherController@findOne');
  router.postForm('/', 'TeacherController@create');
  router.patchForm('/:id', 'TeacherController@update');
  router.delete('/:id', 'TeacherController@delete');
});

export default router.router;
