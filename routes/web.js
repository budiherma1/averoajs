import route, {router} from '@averoa/routes';

route.post('/home', 'HomeController@home', ['Middleware']);
route.get('/home', 'HomeController@homeView', ['Middleware']);
route.get('/edge', 'HomeController@homeEdge');
route.get('/error', 'HomeController@home',['ErrorMiddleware']);

export default router