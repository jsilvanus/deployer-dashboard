#!/usr/bin/env node
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

function findRepoRoot(start) {
  let dir = start;
  while (dir && dir !== path.parse(dir).root) {
    if (fs.existsSync(path.join(dir, 'package.json'))) return dir;
    dir = path.dirname(dir);
  }
  return start;
}

const cwd = process.cwd();
const repoRoot = findRepoRoot(cwd);
let realRepoRoot;
try {
  realRepoRoot = fs.realpathSync(repoRoot);
} catch (e) {
  realRepoRoot = repoRoot;
}

if (realRepoRoot !== cwd) {
  console.log(`Notice: switching from ${cwd} to realpath ${realRepoRoot}`);
  try {
    process.chdir(realRepoRoot);
  } catch (err) {
    console.error('Failed to chdir to real repo root:', err);
    process.exit(1);
  }
}

// Spawn vite preserving stdio. Prefer local node_modules/.bin/vite to avoid
// relying on global npx resolution which can behave differently on Windows.
const args = process.argv.slice(2);
const viteBin = path.join(process.cwd(), 'node_modules', '.bin', process.platform === 'win32' ? 'vite.cmd' : 'vite');
let child;
if (process.platform === 'win32') {
  // On Windows the shim in node_modules/.bin is a .cmd file; run it through cmd.exe
  child = spawn('cmd', ['/c', viteBin, ...args], { stdio: 'inherit' });
} else {
  child = spawn(viteBin, args, { stdio: 'inherit' });
}

child.on('exit', (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code);
});
