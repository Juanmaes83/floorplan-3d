'use strict';
// Defence in depth for the isolated worker: the main-thread write/network traps of the tests do not reach a worker
// (it loads its own module instances), so the worker locks itself down before computing. Every file write, child
// process and network entry point throws. Reads stay possible (the pure modules load their code), but the worker is
// never given a path: it only receives a clone of the validated project.
const fs = require('node:fs');
const fsp = require('node:fs/promises');
const childProcess = require('node:child_process');
const net = require('node:net');
const http = require('node:http');
const https = require('node:https');
const dgram = require('node:dgram');

const WRITE_FLAGS = /[wa+]/;
function lockdown() {
  const deny = name => function denied() { throw new Error(`Bloqueado en el cálculo aislado de solo lectura: ${name}`); };
  const readOnly = flags => flags === undefined || flags === 'r' || (typeof flags === 'number' && (flags & 3) === 0) || (typeof flags === 'string' && !WRITE_FLAGS.test(flags));
  const wrapOpen = (target, name) => { const orig = target[name]; target[name] = function guarded(p, flags, ...rest) { if (!readOnly(typeof flags === 'function' ? undefined : flags)) throw new Error(`Bloqueado en el cálculo aislado de solo lectura: ${name} con escritura`); return orig.call(this, p, flags, ...rest); }; };
  for (const name of ['writeFile', 'writeFileSync', 'appendFile', 'appendFileSync', 'write', 'writeSync', 'writev', 'writevSync', 'truncate', 'truncateSync', 'ftruncate', 'ftruncateSync', 'unlink', 'unlinkSync', 'rm', 'rmSync', 'rmdir', 'rmdirSync', 'rename', 'renameSync', 'mkdir', 'mkdirSync', 'copyFile', 'copyFileSync', 'cp', 'cpSync', 'symlink', 'symlinkSync', 'link', 'linkSync', 'chmod', 'chmodSync', 'chown', 'chownSync', 'utimes', 'utimesSync', 'createWriteStream'])
    if (typeof fs[name] === 'function') fs[name] = deny('fs.' + name);
  for (const name of ['writeFile', 'appendFile', 'truncate', 'unlink', 'rm', 'rmdir', 'rename', 'mkdir', 'copyFile', 'cp', 'symlink', 'link', 'chmod', 'chown', 'utimes'])
    if (typeof fsp[name] === 'function') fsp[name] = deny('fs/promises.' + name);
  wrapOpen(fs, 'open'); wrapOpen(fs, 'openSync'); wrapOpen(fsp, 'open');
  for (const name of ['spawn', 'spawnSync', 'exec', 'execSync', 'execFile', 'execFileSync', 'fork']) childProcess[name] = deny('child_process.' + name);
  for (const name of ['connect', 'createConnection', 'createServer']) net[name] = deny('net.' + name);
  for (const mod of [http, https]) for (const name of ['request', 'get', 'createServer']) mod[name] = deny('http.' + name);
  dgram.createSocket = deny('dgram.createSocket');
  if (typeof globalThis.fetch === 'function') globalThis.fetch = deny('fetch');
  if (typeof globalThis.WebSocket === 'function') globalThis.WebSocket = deny('WebSocket');
}
module.exports = { lockdown };
