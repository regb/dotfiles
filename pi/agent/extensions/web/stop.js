#!/usr/bin/env node
const { execFileSync } = require('node:child_process');
const { readFileSync, unlinkSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join } = require('node:path');

const statePath = join(tmpdir(), 'pi-browser-state.json');
let state = null;
try {
  state = JSON.parse(readFileSync(statePath, 'utf8'));
} catch {}

let stopped = false;
if (state?.pid) {
  try {
    process.kill(state.pid, 'SIGTERM');
    stopped = true;
  } catch {}
}

try {
  execFileSync('pkill', ['-f', 'google-chrome.*--remote-debugging-port=9222'], { stdio: 'ignore' });
  stopped = true;
} catch {}

try {
  execFileSync('pkill', ['-f', '/opt/google/chrome/chrome.*--remote-debugging-port=9222'], { stdio: 'ignore' });
  stopped = true;
} catch {}

if (state?.userDataDir) {
  try { rmSync(state.userDataDir, { recursive: true, force: true }); } catch {}
}
try { unlinkSync(statePath); } catch {}

console.log(stopped ? 'Stopped Chrome on :9222' : 'No matching Chrome process found');
