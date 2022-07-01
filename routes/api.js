import route, {router} from '@averoa/routes';

route.get('/', 'HomeController@getDataTest', ['Middleware']);
route.get('/login', 'HomeController@login');
route.get('/p', 'HomeController@getDataTest', ['AuthMiddleware']);
route.get('/real', 'HomeController@real');
route.get('/test', 'HomeController@getData');
route.get('/obj', 'HomeController@obj');
route.get('/mail', 'HomeController@sendEmail');
route.post('/upload', 'HomeController@upload',['UploadImagesMiddleware']);
export default router