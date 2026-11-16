// Unit tests that need no database server and no HTTP.
import {
  describe, test, before, after,
} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { APP_ROOT, setTestEnv } from './helpers.js';

// uploads go to a throw-away app root, not into this repository
const tmpRoot = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'averoa-app-unit-')));
fs.cpSync(path.join(APP_ROOT, 'config'), path.join(tmpRoot, 'config'), { recursive: true });
fs.writeFileSync(path.join(tmpRoot, 'package.json'), '{ "type": "module" }');
setTestEnv({ AVEROA_ROOT: tmpRoot });

let PasswordHelper;
let UploadProvider;

before(async () => {
  ({ PasswordHelper } = await import('#helpers'));
  ({ UploadProvider } = await import('#providers'));
});

after(() => {
  fs.rmSync(tmpRoot, { recursive: true, force: true });
});

describe('PasswordHelper', () => {
  test('hash / verify', async () => {
    const hash = await PasswordHelper.hash('correct horse');
    assert.match(hash, /^scrypt\$16384\$8\$1\$/);
    assert.notEqual(hash, await PasswordHelper.hash('correct horse'), 'salted');
    assert.equal(await PasswordHelper.verify('correct horse', hash), true);
    assert.equal(await PasswordHelper.verify('wrong horse', hash), false);
    assert.equal(await PasswordHelper.verify('correct horse', PasswordHelper.hashSync('correct horse')), true);
  });

  test('verify never throws on garbage', async () => {
    assert.equal(await PasswordHelper.verify('x', undefined), false);
    assert.equal(await PasswordHelper.verify('x', 'plain-text'), false);
    assert.equal(await PasswordHelper.verify('x', 'scrypt$1$1$1$$'), false);
    assert.equal(await PasswordHelper.verify(undefined, PasswordHelper.hashSync('x')), false);
  });
});

describe('UploadProvider', () => {
  const uploadRoot = () => path.join(tmpRoot, 'storages', 'upload');

  test('sanitizes file name and route (no path traversal)', async () => {
    const stored = await UploadProvider.upload({ originalname: '../../../evil name.js', buffer: Buffer.from('x') }, '../../etc/../teachers');
    assert.match(stored, /^etc\/teachers\/[0-9a-f-]{36}-evil_name\.js$/);
    const abs = path.join(uploadRoot(), stored);
    assert.ok(fs.existsSync(abs));
    assert.ok(path.resolve(abs).startsWith(uploadRoot()));
  });

  test('replaces the old file but never deletes outside storages/upload', async () => {
    const outside = path.join(tmpRoot, 'package.json');

    const first = await UploadProvider.upload({ originalname: 'a.png', buffer: Buffer.from('a') }, 'teachers');
    const second = await UploadProvider.upload({ originalname: 'b.png', buffer: Buffer.from('b') }, 'teachers', first);
    assert.equal(fs.existsSync(path.join(uploadRoot(), first)), false, 'old file removed');
    assert.equal(fs.existsSync(path.join(uploadRoot(), second)), true);

    assert.equal(await UploadProvider.remove('../../package.json'), false);
    assert.equal(await UploadProvider.remove(outside), false);
    assert.ok(fs.existsSync(outside), 'file outside the upload root is untouched');
  });
});

describe('JwtStrategy', () => {
  test('fails fast when TOKEN_SECRET is missing', async () => {
    const { JwtStrategy } = await import('#strategies');
    const saved = process.env.TOKEN_SECRET;
    delete process.env.TOKEN_SECRET;
    try {
      assert.throws(() => JwtStrategy.config(), /TOKEN_SECRET/);
    } finally {
      process.env.TOKEN_SECRET = saved;
    }
  });
});
