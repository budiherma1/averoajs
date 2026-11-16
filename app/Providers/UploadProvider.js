import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { appPath } from '@averoa/utilities/paths';
import { Log } from '@averoa/utilities';
import { resolveInlineExtensions } from '@averoa/core/uploads.js';
import AppProvider from './AppProvider.js';

const DRIVERS = ['local', 's3'];

const uploadRoot = () => path.resolve(appPath('storages', 'upload'));

/** Keeps only [A-Za-z0-9_-] path segments, so a route can never leave storages/upload. */
const safeRoute = (route = '') => String(route)
  .split(/[\\/]+/)
  .map((segment) => segment.replace(/[^A-Za-z0-9_-]/g, ''))
  .filter(Boolean)
  .join('/');

/** basename only, safe characters, bounded length, random prefix. */
const safeFileName = (originalName = '') => {
  const base = path.basename(String(originalName).replace(/\\/g, '/'))
    .replace(/[^A-Za-z0-9._-]/g, '_')
    .replace(/^\.+/, '')
    .slice(-100);
  return `${randomUUID()}-${base || 'file'}`;
};

/** `<route>/<uuid>-<name>`: the stored name for both drivers (relative path or object key). */
const storedName = (file, route) => {
  const folder = safeRoute(route);
  const fileName = safeFileName(file.originalname);
  return folder ? `${folder}/${fileName}` : fileName;
};

/** Absolute path for a stored relative name, or null when it would escape the upload root. */
const insideUploadRoot = (relativeName) => {
  const root = uploadRoot();
  const target = path.resolve(root, String(relativeName));
  const rel = path.relative(root, target);
  if (!rel || rel.startsWith('..') || path.isAbsolute(rel)) return null;
  return target;
};

/** True for names upload() can produce: safe segments, no `.`/`..`, no leading slash. */
const isSafeKey = (key) => typeof key === 'string'
  && key.length > 0
  && key.length <= 1024
  && key.split('/').every((segment) => /^[A-Za-z0-9._-]+$/.test(segment) && !/^\.+$/.test(segment));

const extensionOf = (name) => path.extname(String(name)).slice(1).toLowerCase();

const truthy = (value) => ['1', 'true', 'yes', 'on'].includes(String(value ?? '').trim().toLowerCase());

/** Content-Type by extension (never the client-supplied mimetype). Unknown: octet-stream. */
const CONTENT_TYPES = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  avif: 'image/avif',
  bmp: 'image/bmp',
  ico: 'image/x-icon',
  svg: 'image/svg+xml',
  heic: 'image/heic',
  pdf: 'application/pdf',
  txt: 'text/plain; charset=utf-8',
  csv: 'text/csv; charset=utf-8',
  md: 'text/markdown; charset=utf-8',
  json: 'application/json',
  zip: 'application/zip',
  gz: 'application/gzip',
  rtf: 'application/rtf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  odt: 'application/vnd.oasis.opendocument.text',
  ods: 'application/vnd.oasis.opendocument.spreadsheet',
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  ogg: 'audio/ogg',
  mp4: 'video/mp4',
  webm: 'video/webm',
  mov: 'video/quicktime',
};

/**
 * Types a browser would run as a document or script. A bucket cannot add the
 * sandbox CSP that /upload sends, so unless their extension is on the inline
 * allowlist they are stored as application/octet-stream.
 */
const ACTIVE_EXTENSIONS = new Set(['html', 'htm', 'xhtml', 'shtml', 'svg', 'svgz', 'xml', 'xsl', 'js', 'mjs', 'css']);

class UploadProvider {
  /** Module name of the optional S3 SDK, loaded on first use of the s3 driver. */
  s3SdkModule = '@aws-sdk/client-s3';

  /** The loaded SDK module ({ S3Client, PutObjectCommand, DeleteObjectCommand }). */
  s3Sdk = null;

  #s3Client = null;

  #s3ClientKey = '';

  #s3ClientSdk = null;

  /**
   * [main method to upload file; the storage is chosen with UPLOAD_DRIVER (local | s3)]
   *
   * @param   {[object]}  file     [multer object (memory storage, needs file.buffer)]
   * @param   {[string]}  route    [sub folder inside storages/upload, or key prefix in the bucket]
   * @param   {[string]}  oldFile  [previously stored name to delete, as returned by upload()]
   *
   * @return  {[string]}           [new stored name `<route>/<uuid>-<name>`: a path relative to
   *                                storages/upload (local) or the object key (s3); see url()]
   */
  async upload(file, route, oldFile = '') {
    return this.driver() === 's3'
      ? this.awsS3(file, route, oldFile)
      : this.local(file, route, oldFile);
  }

  /** Active driver from UPLOAD_DRIVER (default `local`); throws on an unknown value. */
  driver() {
    const name = String(process.env.UPLOAD_DRIVER ?? '').trim().toLowerCase() || 'local';
    if (!DRIVERS.includes(name)) {
      throw new Error(`UPLOAD_DRIVER must be one of ${DRIVERS.join(', ')} (got "${name}")`);
    }
    return name;
  }

  /**
   * [upload file on local storage]
   */
  async local(file, route, oldFile) {
    if (!file?.buffer) throw new Error('UploadProvider expects a multer file kept in memory (file.buffer)');

    const relativeName = storedName(file, route);
    const target = insideUploadRoot(relativeName);
    if (!target) throw new Error('Invalid upload path');

    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, file.buffer, { flag: 'wx' });

    if (oldFile) await this.removeLocal(oldFile);

    return relativeName;
  }

  /**
   * [upload file to AWS S3 or an S3-compatible service (MinIO, R2, Spaces, ...)]
   *
   * The object key is the same `<route>/<uuid>-<name>` the local driver stores.
   * Content-Type comes from the extension; files whose extension is not on the
   * inline allowlist (raster images by default, UPLOAD_INLINE_EXTENSIONS) get
   * `Content-Disposition: attachment`, like /upload.
   */
  async awsS3(file, route, oldFile) {
    if (!file?.buffer) throw new Error('UploadProvider expects a multer file kept in memory (file.buffer)');

    const { client, sdk, config } = await this.s3();
    const key = storedName(file, route);
    const headers = await this.objectHeaders(key);

    await client.send(new sdk.PutObjectCommand({
      Bucket: config.bucket,
      Key: key,
      Body: file.buffer,
      ContentLength: file.buffer.length,
      ...headers,
    }));

    if (oldFile) {
      // the new object is stored; a failed delete only leaves the old one behind
      try {
        await this.removeS3(oldFile);
      } catch (err) {
        Log.warn(`UploadProvider: could not delete old object "${oldFile}": ${err.message}`);
      }
    }

    return key;
  }

  /** Deletes a stored file with the active driver; ignores unsafe names and missing files. */
  async remove(relativeName) {
    return this.driver() === 's3' ? this.removeS3(relativeName) : this.removeLocal(relativeName);
  }

  /** Deletes a file in storages/upload; ignores names outside it and missing files. */
  async removeLocal(relativeName) {
    const target = insideUploadRoot(relativeName);
    if (!target) return false;
    try {
      await fs.unlink(target);
      return true;
    } catch (err) {
      if (err.code === 'ENOENT') return false;
      throw err;
    }
  }

  /** Deletes an object in S3_BUCKET; keys upload() cannot produce are ignored (false). */
  async removeS3(key) {
    if (!isSafeKey(key)) return false;
    const { client, sdk, config } = await this.s3();
    await client.send(new sdk.DeleteObjectCommand({ Bucket: config.bucket, Key: key }));
    return true;
  }

  /**
   * Public URL of a stored name: `/upload/<name>` for local, S3_PUBLIC_URL/<key>
   * (or the bucket's endpoint URL) for s3. null for an empty or unsafe name.
   * The s3 URL only works for objects the bucket (or CDN) serves publicly.
   */
  url(stored) {
    if (!isSafeKey(stored)) return null;
    const encoded = stored.split('/').map(encodeURIComponent).join('/');
    if (this.driver() !== 's3') return `/upload/${encoded}`;
    return `${this.s3BaseUrl(this.s3Config())}/${encoded}`;
  }

  /** S3 settings from the environment, validated. */
  s3Config() {
    const env = process.env;
    const bucket = (env.S3_BUCKET ?? '').trim();
    if (!bucket) throw new Error('S3_BUCKET is required when UPLOAD_DRIVER=s3');

    const accessKeyId = env.S3_ACCESS_KEY_ID || '';
    const secretAccessKey = env.S3_SECRET_ACCESS_KEY || '';
    if (Boolean(accessKeyId) !== Boolean(secretAccessKey)) {
      throw new Error('Set both S3_ACCESS_KEY_ID and S3_SECRET_ACCESS_KEY, or neither (default AWS credential chain)');
    }

    return {
      bucket,
      region: (env.S3_REGION ?? '').trim() || 'us-east-1',
      endpoint: (env.S3_ENDPOINT ?? '').trim().replace(/\/+$/, '') || undefined,
      forcePathStyle: truthy(env.S3_FORCE_PATH_STYLE),
      credentials: accessKeyId ? { accessKeyId, secretAccessKey } : undefined,
      publicUrl: (env.S3_PUBLIC_URL ?? '').trim().replace(/\/+$/, '') || undefined,
    };
  }

  /** Base URL objects are served from (no trailing slash). */
  s3BaseUrl(config) {
    if (config.publicUrl) return config.publicUrl;
    if (!config.endpoint) return `https://${config.bucket}.s3.${config.region}.amazonaws.com`;
    if (config.forcePathStyle) return `${config.endpoint}/${encodeURIComponent(config.bucket)}`;
    const endpoint = new URL(config.endpoint);
    endpoint.hostname = `${config.bucket}.${endpoint.hostname}`;
    return endpoint.href.replace(/\/+$/, '');
  }

  /** Loads @aws-sdk/client-s3 on first use; a clear error when it is not installed. */
  async loadS3Sdk() {
    if (this.s3Sdk) return this.s3Sdk;
    try {
      this.s3Sdk = await import(this.s3SdkModule);
    } catch (err) {
      if (err?.code === 'ERR_MODULE_NOT_FOUND' && String(err.message).includes(this.s3SdkModule)) {
        throw new Error(
          `UPLOAD_DRIVER=s3 needs the ${this.s3SdkModule} package (an optionalDependency; was it installed with --omit=optional?): npm install ${this.s3SdkModule}`,
          { cause: err },
        );
      }
      throw err;
    }
    return this.s3Sdk;
  }

  /** S3 client for the current settings (rebuilt when they change). */
  async s3() {
    const config = this.s3Config();
    const sdk = await this.loadS3Sdk();
    const cacheKey = JSON.stringify(config);
    if (!this.#s3Client || this.#s3ClientKey !== cacheKey || this.#s3ClientSdk !== sdk) {
      this.#s3Client?.destroy?.();
      this.#s3Client = new sdk.S3Client({
        region: config.region,
        endpoint: config.endpoint,
        forcePathStyle: config.forcePathStyle,
        credentials: config.credentials,
        // S3-compatible services do not all accept the default CRC checksums
        ...(config.endpoint ? {
          requestChecksumCalculation: 'WHEN_REQUIRED',
          responseChecksumValidation: 'WHEN_REQUIRED',
        } : {}),
      });
      this.#s3ClientKey = cacheKey;
      this.#s3ClientSdk = sdk;
    }
    return { client: this.#s3Client, sdk, config };
  }

  /** Content-Type and, outside the inline allowlist, Content-Disposition: attachment. */
  async objectHeaders(key) {
    const ext = extensionOf(key);
    const options = typeof AppProvider.uploads === 'function' ? await AppProvider.uploads() : undefined;
    const inline = resolveInlineExtensions(options && typeof options === 'object' ? options : {});
    const isInline = ext !== '' && inline.has(ext);

    const headers = {
      ContentType: (!isInline && ACTIVE_EXTENSIONS.has(ext))
        ? 'application/octet-stream'
        : (CONTENT_TYPES[ext] ?? 'application/octet-stream'),
    };
    if (!isInline) headers.ContentDisposition = `attachment; filename="${path.posix.basename(key)}"`;
    return headers;
  }
}

export default new UploadProvider();
