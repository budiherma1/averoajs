import Router from '@averoa/routes';

// Web routes (Edge views in resources/views, CSRF protected). Route syntax:
// https://www.npmjs.com/package/@averoa/routes
const router = Router();

router.get('/', (req, res) => res.render('welcome', { name: 'AveroaJS' }));

export default router;
