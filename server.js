import { start } from '@averoa/core';

try {
  await start();
} catch (err) {
  // a startup failure must reach stderr: in production Log only writes to a file
  // eslint-disable-next-line no-console -- see above
  console.error(err);
  process.exit(1);
}
