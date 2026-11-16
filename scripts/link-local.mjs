#!/usr/bin/env node
/**
 * Dev helper: use local checkouts of the framework packages instead of npm.
 *
 *   node scripts/link-local.mjs [dependencies-dir]      (npm run link:local)
 *
 * For <dependencies-dir>/{AveroaUtilities,AveroaRoute,AveroaCore}
 * (default: ../dependencies next to this app, or $AVEROA_DEPS_DIR):
 *   1. `npm pack` each package
 *   2. `npm install --no-save <tarballs>`: installs the rest of the app's
 *      dependencies plus the packages' own runtime dependencies, even before
 *      the @averoa 2.x/3.x versions are published
 *   3. unpacks each tarball into node_modules/@averoa/<name>, because npm 10
 *      may skip packages that are also peerDependencies of each other
 *
 * package.json and package-lock.json stay untouched. Re-run it after every
 * `npm install` (which goes back to the registry versions).
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const appDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const depsDir = path.resolve(process.argv[2] || process.env.AVEROA_DEPS_DIR || path.join(appDir, '..', 'dependencies'));
const packages = [
  { dir: 'AveroaUtilities', name: 'utilities' },
  { dir: 'AveroaRoute', name: 'routes' },
  { dir: 'AveroaCore', name: 'core' },
];
const shell = process.platform === 'win32';
const npm = shell ? 'npm.cmd' : 'npm';
const run = (cmd, args, cwd, stdio = ['ignore', 'pipe', 'inherit']) => execFileSync(cmd, args, {
  cwd, encoding: 'utf8', shell, stdio,
});

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'averoa-pack-'));
try {
  for (const pkg of packages) {
    const dir = path.join(depsDir, pkg.dir);
    if (!fs.existsSync(path.join(dir, 'package.json'))) {
      throw new Error(`missing ${dir}/package.json (pass the dependencies folder as the first argument)`);
    }
    const out = run(npm, ['pack', '--json', '--pack-destination', tmp], dir);
    const [{ filename, version }] = JSON.parse(out.slice(out.indexOf('[')));
    pkg.tarball = path.join(tmp, path.basename(filename));
    pkg.version = version;
  }

  run(npm, ['install', '--no-save', '--no-audit', '--no-fund', ...packages.map((p) => p.tarball)], appDir, 'inherit');

  for (const pkg of packages) {
    const target = path.join(appDir, 'node_modules', '@averoa', pkg.name);
    fs.rmSync(target, { recursive: true, force: true });
    fs.mkdirSync(target, { recursive: true });
    run('tar', ['-xzf', pkg.tarball, '-C', target, '--strip-components=1'], appDir);
    // eslint-disable-next-line no-console -- CLI script: progress output is the point
    console.log(`linked @averoa/${pkg.name}@${pkg.version} from ${path.join(depsDir, pkg.dir)}`);
  }
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}
