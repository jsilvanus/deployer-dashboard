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

// Spawn vite preserving stdio
const args = process.argv.slice(2);
const cmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const child = spawn(cmd, ['vite', ...args], { stdio: 'inherit', shell: false });

child.on('exit', (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code);
});
