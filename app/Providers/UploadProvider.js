import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { appPath } from '@averoa/utilities/paths';

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

/** Absolute path for a stored relative name, or null when it would escape the upload root. */
const insideUploadRoot = (relativeName) => {
  const root = uploadRoot();
  const target = path.resolve(root, String(relativeName));
  const rel = path.relative(root, target);
  if (!rel || rel.startsWith('..') || path.isAbsolute(rel)) return null;
  return target;
};

class UploadProvider {
  /**
   * [main method to upload file, please change the selection based on the choosen method]
   *
   * @param   {[object]}  file     [multer object (memory storage, needs file.buffer)]
   * @param   {[string]}  route    [sub folder inside storages/upload]
   * @param   {[string]}  oldFile  [previously stored name to delete, as returned by upload()]
   *
   * @return  {[string]}           [new stored name, relative to storages/upload]
   */
  async upload(file, route, oldFile = '') {
    return this.local(file, route, oldFile);
  }

  /**
   * [upload file on local storage]
   */
  async local(file, route, oldFile) {
    if (!file?.buffer) throw new Error('UploadProvider expects a multer file kept in memory (file.buffer)');

    const folder = safeRoute(route);
    const fileName = safeFileName(file.originalname);
    const relativeName = folder ? `${folder}/${fileName}` : fileName;
    const target = insideUploadRoot(relativeName);
    if (!target) throw new Error('Invalid upload path');

    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, file.buffer, { flag: 'wx' });

    if (oldFile) await this.remove(oldFile);

    return relativeName;
  }

  /** Deletes a stored file; ignores names outside storages/upload and missing files. */
  async remove(relativeName) {
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

  async awsS3(file, route, oldFile) {
    //
  }
}

export default new UploadProvider();
