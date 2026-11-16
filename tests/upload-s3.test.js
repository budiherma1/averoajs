// UploadProvider with UPLOAD_DRIVER=s3 against a mocked @aws-sdk/client-s3 (no network).
import {
  describe, test, before, after, beforeEach,
} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { APP_ROOT, setTestEnv } from './helpers.js';

const tmpRoot = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'averoa-app-s3-')));
fs.cpSync(path.join(APP_ROOT, 'config'), path.join(tmpRoot, 'config'), { recursive: true });
fs.writeFileSync(path.join(tmpRoot, 'package.json'), '{ "type": "module" }');
setTestEnv({ AVEROA_ROOT: tmpRoot });

const S3_ENV = [
  'UPLOAD_DRIVER', 'S3_ENDPOINT', 'S3_REGION', 'S3_BUCKET', 'S3_ACCESS_KEY_ID',
  'S3_SECRET_ACCESS_KEY', 'S3_FORCE_PATH_STYLE', 'S3_PUBLIC_URL', 'UPLOAD_INLINE_EXTENSIONS',
];

/** Minimal stand-in for the SDK: records clients and the commands they send. */
function fakeSdk({ failDelete = false } = {}) {
  const clients = [];
  class Command {
    constructor(input) { this.input = input; }
  }
  class PutObjectCommand extends Command {}
  class DeleteObjectCommand extends Command {}
  class S3Client {
    constructor(config) {
      this.config = config;
      this.sent = [];
      clients.push(this);
    }

    async send(command) {
      this.sent.push(command);
      if (failDelete && command instanceof DeleteObjectCommand) throw new Error('network down');
      return {};
    }

    destroy() { this.destroyed = true; }
  }
  return {
    clients, S3Client, PutObjectCommand, DeleteObjectCommand,
  };
}

let UploadProvider;
const file = (name, body = 'x') => ({ originalname: name, buffer: Buffer.from(body) });

before(async () => {
  ({ UploadProvider } = await import('#providers'));
});

after(() => {
  fs.rmSync(tmpRoot, { recursive: true, force: true });
});

beforeEach(() => {
  for (const key of S3_ENV) delete process.env[key];
  Object.assign(process.env, {
    UPLOAD_DRIVER: 's3',
    S3_BUCKET: 'media',
    S3_REGION: 'eu-west-1',
    S3_ACCESS_KEY_ID: 'test-key',
    S3_SECRET_ACCESS_KEY: 'test-secret',
  });
  UploadProvider.s3SdkModule = '@aws-sdk/client-s3';
  UploadProvider.s3Sdk = fakeSdk();
});

describe('UploadProvider driver selection', () => {
  test('defaults to local and rejects unknown drivers', async () => {
    delete process.env.UPLOAD_DRIVER;
    assert.equal(UploadProvider.driver(), 'local');
    process.env.UPLOAD_DRIVER = ' S3 ';
    assert.equal(UploadProvider.driver(), 's3');
    process.env.UPLOAD_DRIVER = 'ftp';
    assert.throws(() => UploadProvider.driver(), /UPLOAD_DRIVER must be one of local, s3/);
    await assert.rejects(UploadProvider.upload(file('a.png'), 'teachers'), /UPLOAD_DRIVER/);
  });

  test('local driver still writes to storages/upload', async () => {
    process.env.UPLOAD_DRIVER = 'local';
    const stored = await UploadProvider.upload(file('a.png'), 'teachers');
    assert.ok(fs.existsSync(path.join(tmpRoot, 'storages', 'upload', stored)));
    assert.equal(UploadProvider.s3Sdk.clients.length, 0, 'no S3 client for the local driver');
  });
});

describe('UploadProvider s3 driver', () => {
  test('stores a sanitised key and returns it; client built from the S3_* settings', async () => {
    const key = await UploadProvider.upload(file('../../my photo.PNG', 'png-bytes'), '../teachers/../x');
    assert.match(key, /^teachers\/x\/[0-9a-f-]{36}-my_photo\.PNG$/);

    const [client] = UploadProvider.s3Sdk.clients;
    assert.deepEqual(client.config, {
      region: 'eu-west-1',
      endpoint: undefined,
      forcePathStyle: false,
      credentials: { accessKeyId: 'test-key', secretAccessKey: 'test-secret' },
    });
    const [put] = client.sent;
    assert.ok(put instanceof UploadProvider.s3Sdk.PutObjectCommand);
    assert.equal(put.input.Bucket, 'media');
    assert.equal(put.input.Key, key);
    assert.equal(put.input.Body.toString(), 'png-bytes');
    assert.equal(put.input.ContentLength, 9);
    assert.equal(put.input.ContentType, 'image/png', 'type from the extension, case-insensitive');
    assert.equal(put.input.ContentDisposition, undefined, 'raster images stay inline');
  });

  test('S3-compatible endpoint: path style, relaxed checksums, default credential chain', async () => {
    Object.assign(process.env, {
      S3_ENDPOINT: 'http://minio:9000/', S3_FORCE_PATH_STYLE: 'true', S3_REGION: '',
    });
    delete process.env.S3_ACCESS_KEY_ID;
    delete process.env.S3_SECRET_ACCESS_KEY;
    await UploadProvider.upload(file('a.jpg'), 'x');
    assert.deepEqual(UploadProvider.s3Sdk.clients[0].config, {
      region: 'us-east-1',
      endpoint: 'http://minio:9000',
      forcePathStyle: true,
      credentials: undefined,
      requestChecksumCalculation: 'WHEN_REQUIRED',
      responseChecksumValidation: 'WHEN_REQUIRED',
    });
  });

  test('reuses the client until the settings change', async () => {
    await UploadProvider.upload(file('a.png'), 'x');
    await UploadProvider.upload(file('b.png'), 'x');
    assert.equal(UploadProvider.s3Sdk.clients.length, 1);
    process.env.S3_BUCKET = 'other';
    await UploadProvider.upload(file('c.png'), 'x');
    const { clients } = UploadProvider.s3Sdk;
    assert.equal(clients.length, 2);
    assert.equal(clients[0].destroyed, true);
    assert.equal(clients[1].sent[0].input.Bucket, 'other');
  });

  test('non-image files are downloads; active content is never typed as a document', async () => {
    const cases = {
      'report.pdf': ['application/pdf', true],
      'notes.txt': ['text/plain; charset=utf-8', true],
      'page.html': ['application/octet-stream', true],
      'logo.svg': ['application/octet-stream', true],
      'app.js': ['application/octet-stream', true],
      'blob.unknownext': ['application/octet-stream', true],
      noextension: ['application/octet-stream', true],
      'pic.webp': ['image/webp', false],
    };
    for (const [name, [type, attachment]] of Object.entries(cases)) {
      const key = await UploadProvider.upload(file(name), 'docs');
      const { input } = UploadProvider.s3Sdk.clients[0].sent.at(-1);
      assert.equal(input.ContentType, type, name);
      assert.equal(
        input.ContentDisposition,
        attachment ? `attachment; filename="${path.posix.basename(key)}"` : undefined,
        name,
      );
    }
  });

  test('UPLOAD_INLINE_EXTENSIONS changes the inline allowlist like /upload', async () => {
    process.env.UPLOAD_INLINE_EXTENSIONS = 'pdf,svg';
    await UploadProvider.upload(file('a.pdf'), 'x');
    await UploadProvider.upload(file('b.svg'), 'x');
    await UploadProvider.upload(file('c.png'), 'x');
    const [pdf, svg, png] = UploadProvider.s3Sdk.clients[0].sent.map((c) => c.input);
    assert.equal(pdf.ContentType, 'application/pdf');
    assert.equal(pdf.ContentDisposition, undefined);
    assert.equal(svg.ContentType, 'image/svg+xml', 'explicitly allowlisted');
    assert.equal(svg.ContentDisposition, undefined);
    assert.match(png.ContentDisposition, /^attachment;/, 'png is no longer on the list');
  });

  test('replacing deletes the old object after the new one is stored', async () => {
    const first = await UploadProvider.upload(file('a.png'), 'teachers');
    const second = await UploadProvider.upload(file('b.png'), 'teachers', first);
    const sent = UploadProvider.s3Sdk.clients[0].sent;
    assert.deepEqual(sent.map((c) => c.constructor.name), ['PutObjectCommand', 'PutObjectCommand', 'DeleteObjectCommand']);
    assert.equal(sent[1].input.Key, second);
    assert.deepEqual(sent[2].input, { Bucket: 'media', Key: first });
  });

  test('a failed delete of the old object does not fail the upload', async () => {
    UploadProvider.s3Sdk = fakeSdk({ failDelete: true });
    const key = await UploadProvider.upload(file('b.png'), 'teachers', 'teachers/old.png');
    assert.match(key, /^teachers\//);
    await assert.rejects(UploadProvider.remove('teachers/old.png'), /network down/);
  });

  test('remove() ignores keys upload() cannot produce', async () => {
    for (const bad of ['', '../secret', '/etc/passwd', 'a/../b', 'a//b', './a', 'a\\b', 'a b', null, 42]) {
      assert.equal(await UploadProvider.remove(bad), false, String(bad));
    }
    assert.equal(UploadProvider.s3Sdk.clients.length, 0, 'nothing sent');
    assert.equal(await UploadProvider.remove('teachers/0c5e-a.png'), true);
    assert.equal(UploadProvider.s3Sdk.clients[0].sent[0].input.Key, 'teachers/0c5e-a.png');
  });

  test('configuration errors are explicit', async () => {
    delete process.env.S3_BUCKET;
    await assert.rejects(UploadProvider.upload(file('a.png'), 'x'), /S3_BUCKET is required/);
    process.env.S3_BUCKET = 'media';
    delete process.env.S3_SECRET_ACCESS_KEY;
    await assert.rejects(UploadProvider.upload(file('a.png'), 'x'), /both S3_ACCESS_KEY_ID and S3_SECRET_ACCESS_KEY/);
    process.env.S3_SECRET_ACCESS_KEY = 'test-secret';
    await assert.rejects(UploadProvider.upload({ originalname: 'a.png' }, 'x'), /file\.buffer/);
  });

  test('a clear error when the SDK is not installed', async () => {
    UploadProvider.s3Sdk = null;
    UploadProvider.s3SdkModule = '@averoa-missing/client-s3';
    await assert.rejects(
      UploadProvider.upload(file('a.png'), 'x'),
      /UPLOAD_DRIVER=s3 needs the @averoa-missing\/client-s3 package \(an optionalDependency; was it installed with --omit=optional\?\): npm install @averoa-missing\/client-s3/,
    );
  });

  test('url() for each driver', () => {
    const key = 'teachers/0c5e-my_photo.png';
    assert.equal(UploadProvider.url(key), `https://media.s3.eu-west-1.amazonaws.com/${key}`);

    process.env.S3_ENDPOINT = 'https://storage.example.com';
    assert.equal(UploadProvider.url(key), `https://media.storage.example.com/${key}`, 'virtual-hosted style');

    process.env.S3_FORCE_PATH_STYLE = '1';
    assert.equal(UploadProvider.url(key), `https://storage.example.com/media/${key}`, 'path style');

    process.env.S3_PUBLIC_URL = 'https://cdn.example.com/media/';
    assert.equal(UploadProvider.url(key), `https://cdn.example.com/media/${key}`);

    assert.equal(UploadProvider.url('../x'), null);
    assert.equal(UploadProvider.url(''), null);

    process.env.UPLOAD_DRIVER = 'local';
    assert.equal(UploadProvider.url(key), `/upload/${key}`);
  });
});
