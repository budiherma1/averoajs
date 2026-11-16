import { start } from '@averoa/core';

try {
  await start();
} catch (err) {
  console.error(err);
  process.exit(1);
}
