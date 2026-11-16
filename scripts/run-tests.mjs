#!/usr/bin/env node
/**
 * `npm test`: runs every tests/*.test.js file with the built-in node:test runner.
 *
 * The file list is built here instead of by the shell, because cmd.exe and
 * PowerShell don't expand `tests/*.test.js`, and Node.js 20 doesn't expand
 * glob arguments itself. Extra arguments are passed to `node --test`:
 *
 *   npm test -- --test-name-pattern=UploadProvider
 *   npm test -- tests/unit.test.js          (only the files given)
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const testsDir = path.join(root, 'tests');

const args = process.argv.slice(2);
const isFile = (arg) => !arg.startsWith('-') && /\.[cm]?js$/.test(arg);
const options = args.filter((arg) => !isFile(arg)); // e.g. --test-name-pattern=x, --test-only
let files = args.filter(isFile);
if (files.length === 0) {
  files = fs.readdirSync(testsDir)
    .filter((name) => name.endsWith('.test.js'))
    .sort()
    .map((name) => path.join('tests', name));
}

const child = spawn(process.execPath, ['--test', ...options, ...files], { cwd: root, stdio: 'inherit' });
child.on('exit', (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  else process.exit(code ?? 1);
});
