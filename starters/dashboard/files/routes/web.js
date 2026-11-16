import Router from '@averoa/routes';

// Web routes: server-rendered pages (resources/views) with a session login.
// Every POST form carries the CSRF token (_csrf); see resources/views/components/layout.edge.
// Route syntax: https://www.npmjs.com/package/@averoa/routes
const router = Router();

router.get('/', (req, res) => res.redirect(req.user ? '/dashboard' : '/login'));

// failed logins count against LOGIN_RATE_LIMIT_* like POST /api/auth/login
router.get('/login', 'SessionController@create', ['RedirectIfAuthenticated']);
router.post('/login', 'SessionController@store', ['LoginRateLimitMiddleware', 'RedirectIfAuthenticated']);
router.post('/logout', 'SessionController@destroy');

router.middleware(['WebAuthMiddleware'], () => {
  router.get('/dashboard', 'DashboardController@index');
  router.get('/dashboard/profile', 'ProfileController@edit');
  router.post('/dashboard/profile', 'ProfileController@update');
  router.post('/dashboard/password', 'ProfileController@password');
  router.get('/dashboard/users', 'AdminUserController@index', ['EnsureAdmin']);
});

export default router;
