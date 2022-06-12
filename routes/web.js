const averoute = require('@averoa/ave-route');
const router = averoute.router;

averoute.config({
	controller: {path: 'app/Controllers/'},
	middleware: {path: 'app/Middleware/', method: 'handle'},
});

averoute.get('/home', 'HomeController@home');
averoute.get('/error', 'HomeController@home',['ErrorMiddleware']);

module.exports = router