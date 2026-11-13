#!/usr/bin/env node
// SCULPT-R03 · the verbatim donor files kept in workshop/ must be byte-identical to SOURCE EXACT.
//   node verify-workshop.cjs              checks each file against its line in SOURCE-EXACT.sha256
//   node verify-workshop.cjs SNAPSHOT_DIR also compares byte by byte with a snapshot built by fetch-source-exact.sh
// Reads files only; writes nothing; runs no donor code.
'use strict';
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const HERE = __dirname, WS = path.join(HERE, 'workshop');
const VERBATIM = Object.freeze(['design.js', 'cabinet-model.js', 'tests/design.test.cjs']);
const sha = b => crypto.createHash('sha256').update(b).digest('hex');
function manifest() {
  const m = new Map();
  for (const line of fs.readFileSync(path.join(HERE, 'SOURCE-EXACT.sha256'), 'utf8').split('\n')) { const r = line.match(/^([0-9a-f]{64}) {2}(.+)$/); if (r) m.set(r[2], r[1]); }
  return m;
}
function verify(snapshot = null) {
  const m = manifest(), problems = [];
  for (const f of VERBATIM) {
    const p = path.join(WS, f);
    if (!fs.existsSync(p)) { problems.push(f + ': missing in workshop'); continue; }
    const b = fs.readFileSync(p);
    if (m.get(f) !== sha(b)) problems.push(f + ': differs from SOURCE-EXACT.sha256');
    if (snapshot && !b.equals(fs.readFileSync(path.join(snapshot, f)))) problems.push(f + ': differs from ' + snapshot);
  }
  return problems;
}
if (require.main === module) {
  const p = verify(process.argv[2] || null);
  if (p.length) { console.error(p.join('\n')); process.exit(5); }
  console.log(`workshop verbatim files verified (${VERBATIM.length})${process.argv[2] ? ' against ' + process.argv[2] : ''}`);
}
module.exports = { VERBATIM, manifest, verify };
