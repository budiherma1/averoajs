import teachers from './teachers.js';
import test from './test.js';

export default function v2(router) {
  router.prefix('teachers', () => teachers(router));
  router.prefix('test', () => test(router));
}
