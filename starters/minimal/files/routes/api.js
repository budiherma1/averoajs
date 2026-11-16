import Router from '@averoa/routes';
import auth from './auth.js';

// API routes, mounted under /api. Route syntax, groups, crud() and .doc():
// https://www.npmjs.com/package/@averoa/routes
const router = Router();

router.get('/', (req, res) => res.json({ status: true, name: 'AveroaJS' }));

// authentication: login, registration, refresh tokens, password reset, email verification
auth(router);

// node averoa make:crud posts adds a crud() block here:
//   router.crud('Posts', 'posts', () => {
//     router.get('/', 'PostsController@findAll');
//     router.post('/', 'PostsController@create', ['AuthMiddleware', 'EnsureEmailVerified']);
//   });

export default router;
