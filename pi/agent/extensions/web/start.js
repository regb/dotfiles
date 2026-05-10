#!/usr/bin/env node
const { spawn } = require('node:child_process');
const { mkdtempSync, writeFileSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join } = require('node:path');

function argValue(name, fallback) {
  const i = process.argv.indexOf(name);
  if (i >= 0 && process.argv[i + 1]) return process.argv[i + 1];
  return fallback;
}

const width = Number(argValue('--width', '1280'));
const height = Number(argValue('--height', '720'));
const chromePath = process.env.CHROMIUM_PATH || '/usr/bin/google-chrome';
const dir = mkdtempSync(join(tmpdir(), 'chrome-fresh-'));
const statePath = join(tmpdir(), 'pi-browser-state.json');

const child = spawn(chromePath, [
  '--headless=new',
  '--remote-debugging-port=9222',
  '--no-sandbox',
  '--disable-dev-shm-usage',
  '--no-first-run',
  '--no-default-browser-check',
  `--user-data-dir=${dir}`,
  `--window-size=${width},${height}`,
  'about:blank',
], { detached: true, stdio: 'ignore' });
child.unref();

writeFileSync(statePath, JSON.stringify({ width, height, pid: child.pid, userDataDir: dir }, null, 2));

console.log(`Chrome started on :9222 (pid=${child.pid})`);
console.log(`User data dir: ${dir}`);
console.log(`Viewport: ${width}x${height}`);
