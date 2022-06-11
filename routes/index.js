const averoute = require('@averoa/ave-route');
const router = averoute.router;

averoute.config({
	controller: {path: 'app/Controllers/'},
	middleware: {path: 'app/Middleware/', method: 'handle'},
});

averoute.get('/', 'HomeController@getDataTest', ['Middleware']);
averoute.get('/login', 'HomeController@login');
averoute.get('/p', 'HomeController@getDataTest', ['AuthMiddleware']);
averoute.get('/real', 'HomeController@real');
averoute.get('/test', 'HomeController@getData');
averoute.get('/obj', 'HomeController@obj');

// router.get('/22', (req, res) => home.getData(req, res))

module.exports = router