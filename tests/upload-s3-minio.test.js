// UploadProvider with UPLOAD_DRIVER=s3 against a real S3-compatible server (MinIO).
// Skipped unless S3_TEST_ENDPOINT is set, e.g.:
//
//   docker run -d --rm --name averoa-minio -p 127.0.0.1:9000:9000 \
//     -e MINIO_ROOT_USER=averoa -e MINIO_ROOT_PASSWORD=averoa-secret \
//     pgsty/minio:RELEASE.2026-08-04T00-00-00Z server /data
//   S3_TEST_ENDPOINT=http://127.0.0.1:9000 S3_TEST_ACCESS_KEY_ID=averoa \
//     S3_TEST_SECRET_ACCESS_KEY=averoa-secret npm test
//
// The bucket (S3_TEST_BUCKET, default averoa-test) is created when missing.
import {
  describe, test, before, after,
} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { APP_ROOT, setTestEnv } from './helpers.js';

const endpoint = process.env.S3_TEST_ENDPOINT;
let sdk = null;
if (endpoint) {
  try {
    sdk = await import('@aws-sdk/client-s3');
  } catch {
    sdk = null;
  }
}
const skip = !endpoint ? 'S3_TEST_ENDPOINT not set'
  : (!sdk && '@aws-sdk/client-s3 is not installed');

describe('UploadProvider s3 driver against MinIO', { skip }, () => {
  const bucket = process.env.S3_TEST_BUCKET || 'averoa-test';
  let tmpRoot;
  let UploadProvider;
  let client;

  const head = (Key) => client.send(new sdk.HeadObjectCommand({ Bucket: bucket, Key }));
  const exists = async (Key) => {
    try {
      await head(Key);
      return true;
    } catch (err) {
      if (err.$metadata?.httpStatusCode === 404) return false;
      throw err;
    }
  };

  before(async () => {
    tmpRoot = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'averoa-app-minio-')));
    fs.cpSync(path.join(APP_ROOT, 'config'), path.join(tmpRoot, 'config'), { recursive: true });
    fs.writeFileSync(path.join(tmpRoot, 'package.json'), '{ "type": "module" }');
    setTestEnv({
      AVEROA_ROOT: tmpRoot,
      UPLOAD_DRIVER: 's3',
      S3_ENDPOINT: endpoint,
      S3_REGION: process.env.S3_TEST_REGION || 'us-east-1',
      S3_BUCKET: bucket,
      S3_ACCESS_KEY_ID: process.env.S3_TEST_ACCESS_KEY_ID ?? '',
      S3_SECRET_ACCESS_KEY: process.env.S3_TEST_SECRET_ACCESS_KEY ?? '',
      S3_FORCE_PATH_STYLE: 'true',
      S3_PUBLIC_URL: '',
      UPLOAD_INLINE_EXTENSIONS: '',
    });
    ({ UploadProvider } = await import('#providers'));
    ({ client } = await UploadProvider.s3());
    try {
      await client.send(new sdk.HeadBucketCommand({ Bucket: bucket }));
    } catch {
      await client.send(new sdk.CreateBucketCommand({ Bucket: bucket }));
    }
  });

  after(() => {
    if (tmpRoot) fs.rmSync(tmpRoot, { recursive: true, force: true });
  });

  test('stores an image with its type, inline', async () => {
    const png = Buffer.from('89504e470d0a1a0a0000', 'hex');
    const key = await UploadProvider.upload({ originalname: 'photo.png', buffer: png }, 'teachers');
    assert.match(key, /^teachers\/[0-9a-f-]{36}-photo\.png$/);

    const meta = await head(key);
    assert.equal(meta.ContentType, 'image/png');
    assert.equal(meta.ContentLength, png.length);
    assert.equal(meta.ContentDisposition, undefined);

    const got = await client.send(new sdk.GetObjectCommand({ Bucket: bucket, Key: key }));
    assert.deepEqual(Buffer.from(await got.Body.transformToByteArray()), png);
    await UploadProvider.remove(key);
  });

  test('stores other files as attachments', async () => {
    const key = await UploadProvider.upload({ originalname: 'x.html', buffer: Buffer.from('<script>1</script>') }, 'docs');
    const meta = await head(key);
    assert.equal(meta.ContentType, 'application/octet-stream');
    assert.equal(meta.ContentDisposition, `attachment; filename="${path.posix.basename(key)}"`);
    await UploadProvider.remove(key);
  });

  test('replacing deletes the old object; remove() deletes', async () => {
    const first = await UploadProvider.upload({ originalname: 'a.pdf', buffer: Buffer.from('a') }, 'teachers');
    const second = await UploadProvider.upload({ originalname: 'b.pdf', buffer: Buffer.from('b') }, 'teachers', first);
    assert.equal(await exists(first), false, 'old object deleted');
    assert.equal(await exists(second), true);
    assert.equal((await head(second)).ContentType, 'application/pdf');

    assert.equal(await UploadProvider.remove(second), true);
    assert.equal(await exists(second), false);
    assert.equal(await UploadProvider.remove('../escape'), false);
  });

  test('url() points at the object (path style)', () => {
    assert.equal(
      UploadProvider.url('teachers/a.png'),
      `${endpoint.replace(/\/+$/, '')}/${bucket}/teachers/a.png`,
    );
  });
});
