const averoute = require('@averoa/ave-route');
const router = averoute.router;
const multer  = require('multer')
const upload = multer({ dest: './storages/tmp/' })

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
averoute.get('/mail', 'HomeController@sendEmail');
averoute.post('/upload', 'HomeController@upload',['UploadImagesMiddleware']);
module.exports = router