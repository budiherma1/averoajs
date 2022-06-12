const averoute = require('@averoa/ave-route');
const router = averoute.router;

averoute.get('/home', 'HomeController@home');
averoute.get('/error', 'HomeController@home',['ErrorMiddleware']);

module.exports = router