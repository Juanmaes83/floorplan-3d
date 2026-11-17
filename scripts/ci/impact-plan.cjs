'use strict';

const crypto = require('node:crypto');

function fingerprint(files, contents, environment) {
 const hash = crypto.createHash('sha256');
 hash.update(JSON.stringify(environment));
 for (const file of [...files].sort()) {
  if (typeof contents[file] !== 'string') return null;
  hash.update(JSON.stringify([file, contents[file]]));
 }
 return hash.digest('hex');
}

function closure(start, dependencies) {
 const visited = new Set();
 const pending = [start];
 while (pending.length) {
  const file = pending.pop();
  if (visited.has(file)) continue;
  visited.add(file);
  pending.push(...(dependencies[file] || []));
 }
 return visited;
}

function validPath(file) {
 return typeof file === 'string' && file.length > 0 && !file.startsWith('/') &&
  !file.includes('\\') && !file.split('/').includes('..');
}

function plan({changes, baseSha, headSha, tests, dependencies, previousDependencies = {},
 ownership, criticalFiles = [], uncertainFiles = [], informationalDocuments = [],
 contents = {}, environment = {}, forceFull = false}) {
 const allTests = [...tests].sort();
 const allWorkflows = [...new Set(Object.values(ownership).flat())].sort();
 const full = reason => ({level:3, baseSha, headSha, reason, tests:allTests,
  workflows:allWorkflows, notRequired:[], evidenceStatus:'current results required'});

 if (!/^[a-f0-9]{40}$/.test(baseSha || '') || !/^[a-f0-9]{40}$/.test(headSha || '')) {
  return full('missing or invalid source identity');
 }
 if (forceFull) return full('explicit integral or periodic validation');
 if (!Array.isArray(changes) || changes.some(file => !validPath(file))) {
  return full('untrusted or unresolved changed-file inventory');
 }
 if (changes.length === 0) return full('empty diff requires explicit interpretation');

 const critical = new Set(criticalFiles);
 const isCritical = file => critical.has(file) || file === 'index.html' || file === 'vercel.json' ||
  file.startsWith('api/') || file.startsWith('.github/') || file.startsWith('scripts/ci/') || file.startsWith('vendor/') ||
  /(^|\/)(package(-lock)?\.json|.*lock.*|.*-core\.js|.*geometry.*|.*schema.*)$/.test(file) ||
  file.startsWith('docs/contracts/') || file.startsWith('docs/security/') ||
  file.startsWith('tests/helpers/');
 if (changes.some(isCritical)) return full('security, shared runtime, workflow or fundamental contract changed');

 const informational = new Set(informationalDocuments);
 const documentConsumed = changes.some(file => tests.some(test =>
  closure(test, dependencies).has(file) || closure(test, previousDependencies).has(file)));
 const documentationOnly = !documentConsumed && changes.every(file =>
  /\.md$/.test(file) && file.startsWith('docs/') && informational.has(file));
 if (documentationOnly) {
  return {level:1, baseSha, headSha, reason:'documentation outside executable and fundamental contract paths',
   tests:[], workflows:[], requiredFastChecks:['diff-integrity','documentation-links','coverage-manifest'],
   notRequired:allTests.map(test => ({test, reason:'source and execution contract outside changed documentation'})),
   evidenceStatus:'historical evidence remains historical; no current test execution claimed'};
 }

 const combined = {};
 for (const file of new Set([...Object.keys(dependencies), ...Object.keys(previousDependencies)])) {
  combined[file] = [...new Set([...(dependencies[file] || []), ...(previousDependencies[file] || [])])];
 }
 const changed = new Set(changes);
 if (changes.some(file => !tests.includes(file) && !(file in combined))) {
  return full('changed file has no audited dependency entry');
 }
 const footprints = new Map(allTests.map(test => [test, closure(test, combined)]));
 const selected = allTests.filter(test => [...footprints.get(test)].some(file => changed.has(file)));
 if (selected.length === 0) return full('no test accounts for the changed module');
 const uncertain = new Set(uncertainFiles);
 if (selected.some(test => [...footprints.get(test)].some(file => uncertain.has(file)))) {
  return full('affected dependency closure contains unresolved or dynamic edges');
 }
 if (selected.some(test => !(ownership[test] || []).length)) {
  return full('affected test lacks an executable workflow owner');
 }
 const notRequired = allTests.filter(test => !selected.includes(test)).map(test => ({test,
  reason:'unchanged source closure in both base and candidate',
  dependencyFingerprint:fingerprint(footprints.get(test), contents, environment),
  status:'not executed on candidate; no PASS inferred'}));
 if (notRequired.some(row => row.dependencyFingerprint === null)) {
  return full('incomplete content evidence for a potentially reusable dependency closure');
 }
 return {level:2, baseSha, headSha, reason:'direct and transitive dependency impact over base and candidate',
  tests:selected, workflows:[...new Set(selected.flatMap(test => ownership[test]))].sort(),
  requiredFastChecks:['diff-integrity','syntax','coverage-manifest','shared-initialization-smoke'],
  notRequired, evidenceStatus:'selected tests require current execution; approvals keep original source and scope'};
}

module.exports = {plan, fingerprint, closure};
