import route, {router} from '@averoa/routes';

route.get('/home', 'HomeController@home', ['Middleware']);
route.get('/edge', 'HomeController@homeEdge');
route.get('/error', 'HomeController@home',['ErrorMiddleware']);

export default router