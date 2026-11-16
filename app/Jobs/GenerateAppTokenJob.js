import { randomBytes } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/** Returns a random 64-byte hex secret, suitable for TOKEN_SECRET / SESSION_SECRET. */
const exec = () => randomBytes(64).toString('hex');

// `npm run generate:token` (node app/Jobs/GenerateAppTokenJob.js) prints one;
// importing this module (e.g. through `#jobs`) has no side effect.
const self = fileURLToPath(import.meta.url).replace(/\.js$/, '');
if (process.argv[1] && path.resolve(process.argv[1]).replace(/\.js$/, '') === self) {
  console.log(exec());
}

export default exec;
