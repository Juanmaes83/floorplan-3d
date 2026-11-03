import { readFile, writeFile, access, stat, readdir } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const evidence = path.join(root, 'docs/product/evidence/donor-runtime-audit-2026-11-02');
const pack = path.join(root, 'docs/product/donor-runtime-audit');
const BASE = '0f9c6ead9732901681498efec326d1ca92e42ffe';
const DONOR = 'd7b9b69753d3af679535ee56695a05c8d955c3c6';
const IDS = ['01-a-the-board','01-b-unfolded-room','01-c-floor-by-floor','02-demo-section-sweep','03-a-open-the-lens','03-c-down-the-stair','04-demo-build-time-lapse','05-a-the-programme','05-b-1-1-site-sheet','05-c-site-camera','06-demo-card-model','07-a-one-door','07-b-the-row','07-c-the-face'];
const DIMS = { desktop: [1440, 900], portrait: [390, 844], landscape: [844, 390] };
const CROSS = ['semanticData','geometry','representation','materialsLight','camera','transition','scrollProgress','ui','mobile','lifecycleRestore','outputs','qa'];
const GATES = Array.from({ length: 21 }, (_, i) => `T${String(i + 1).padStart(2, '0')}`);
const allowedPrefixes = ['docs/product/donor-runtime-audit/', 'docs/product/evidence/donor-runtime-audit-2026-11-02/', 'scripts/audit/'];
const failures = [];
const say = (kind, label, detail = '') => console.log(`${kind} ${label}${detail ? ': ' + detail : ''}`);
const readJson = async p => JSON.parse(await readFile(p, 'utf8'));
const exists = async p => !!(await access(p).then(() => true, () => false));
const git = (...args) => {
  const r = spawnSync('git', ['-C', root, ...args], { encoding: 'utf8' });
  if (r.status !== 0) throw new Error(`git ${args.join(' ')}: ${r.stderr.trim()}`);
  return r.stdout.trim();
};
const sha256 = async p => {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(p)) hash.update(chunk);
  return hash.digest('hex');
};
const isUrl = x => {
  try { const u = new URL(x); return u.protocol === 'https:' || u.protocol === 'http:'; }
  catch { return false; }
};
function productionDiff() {
  const modified = git('diff', '--name-only', BASE).split(/\r?\n/).filter(Boolean);
  const untracked = git('ls-files', '--others', '--exclude-standard').split(/\r?\n/).filter(Boolean);
  return [...new Set([...modified, ...untracked])].filter(p => !allowedPrefixes.some(prefix => p.replaceAll('\\', '/').startsWith(prefix)));
}
function schemaCheck(value, schema, rootSchema, location = '$', errors = []) {
  if (schema.$ref) {
    const parts = schema.$ref.replace(/^#\//, '').split('/');
    let target = rootSchema; for (const p of parts) target = target[p];
    return schemaCheck(value, target, rootSchema, location, errors);
  }
  if ('const' in schema && value !== schema.const) errors.push(`${location}: const mismatch`);
  if (schema.enum && !schema.enum.includes(value)) errors.push(`${location}: invalid enum ${JSON.stringify(value)}`);
  if (schema.type) {
    const types = Array.isArray(schema.type) ? schema.type : [schema.type];
    const actual = value === null ? 'null' : Array.isArray(value) ? 'array' : Number.isInteger(value) ? 'integer' : typeof value;
    if (!types.includes(actual) && !(actual === 'integer' && types.includes('number'))) {
      errors.push(`${location}: expected ${types.join('|')}, got ${actual}`);
      return errors;
    }
  }
  if (typeof value === 'string') {
    if (schema.minLength && value.length < schema.minLength) errors.push(`${location}: empty string`);
    if (schema.pattern && !(new RegExp(schema.pattern)).test(value)) errors.push(`${location}: pattern mismatch`);
    if (schema.format === 'uri' && !isUrl(value)) errors.push(`${location}: invalid URL`);
  }
  if (typeof value === 'number') {
    if (schema.minimum !== undefined && value < schema.minimum) errors.push(`${location}: below minimum`);
    if (schema.maximum !== undefined && value > schema.maximum) errors.push(`${location}: above maximum`);
    if (schema.exclusiveMinimum !== undefined && value <= schema.exclusiveMinimum) errors.push(`${location}: below exclusive minimum`);
  }
  if (Array.isArray(value)) {
    if (schema.minItems && value.length < schema.minItems) errors.push(`${location}: too few items`);
    if (schema.items) value.forEach((v, i) => schemaCheck(v, schema.items, rootSchema, `${location}[${i}]`, errors));
  }
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    if (schema.minProperties && Object.keys(value).length < schema.minProperties) errors.push(`${location}: empty object`);
    for (const key of schema.required || []) if (!(key in value)) errors.push(`${location}: missing ${key}`);
    if (schema.additionalProperties === false) for (const key of Object.keys(value)) if (!(key in (schema.properties || {}))) errors.push(`${location}: extra ${key}`);
    for (const [key, sub] of Object.entries(schema.properties || {})) if (key in value) schemaCheck(value[key], sub, rootSchema, `${location}.${key}`, errors);
  }
  return errors;
}
const nonInference = items => Array.isArray(items) && items.some(e => e?.class && e.class !== 'INFERENCE');
const assetPath = p => path.isAbsolute(p) ? p : path.join(root, p);
async function verifyAssets(items) {
  if (!Array.isArray(items) || !items.length) return false;
  for (const a of items) {
    const p = assetPath(a.path);
    if (!(await exists(p))) return false;
    if ((await stat(p)).size <= 0) return false;
    if ((await sha256(p)) !== a.sha256) return false;
    if (a.kind === 'VIDEO') {
      const r = spawnSync('ffprobe', ['-v','error','-show_entries','format=duration:stream=codec_name,width,height','-of','json',p], { encoding:'utf8' });
      if (r.status !== 0) return false;
      let v; try { v = JSON.parse(r.stdout); } catch { return false; }
      const dim = DIMS[a.viewport];
      if (!dim || Number(v.format?.duration) <= 0 || !v.streams?.some(s => s.width === dim[0] && s.height === dim[1] && s.codec_name)) return false;
    }
  }
  return true;
}
async function preparation() {
  const checks = {};
  const check = async (key, fn) => { try { checks[key] = !!(await fn()); } catch (e) { checks[key] = false; failures.push(`${key}: ${e.message}`); } say(checks[key] ? 'PASS' : 'FAIL', key); };
  await check('BASELINE_VERIFIED', () => git('merge-base', 'HEAD', BASE) === BASE && git('cat-file', '-t', BASE) === 'commit');
  await check('AUDIT_BRANCH', () => git('branch', '--show-current') === 'audit/donor-runtime-7x14-2026-11-02');
  await check('AUDIT_WORKTREE_CLEAN_AT_START', async () => (await readJson(path.join(evidence, 'preparation.json'))).cleanAtStart === true);
  await check('AUDIT_PACK_PRESENT', async () => (await Promise.all(['00-MISSION.md','01-AUTHORITIES-AND-INVENTORY.md','02-CAPTURE-PROTOCOL.md','03-RECONCILIATION-PROTOCOL.md','04-DEFINITION-OF-DONE.md','05-RUN-STATE-PROTOCOL.md','manifest.schema.json'].map(f => exists(path.join(pack, f))))).every(Boolean));
  await check('AUTHORITIES_READ', async () => {
    const p = await readJson(path.join(evidence, 'preparation.json'));
    return Array.isArray(p.authoritiesRead) && p.authoritiesRead.length >= 10 && p.authoritiesRead.every(x => x.locator && x.note);
  });
  const inv = await readJson(path.join(evidence, 'reference-inventory.json'));
  await check('14_REFERENCES_INVENTORIED', () => inv.baseSha === BASE && inv.references.length === 14 && inv.references.every((r, i) => r.id === IDS[i] && r.inventoryIndex === i + 1 && r.group && r.take && r.donorCommit === DONOR && r.sourceEntrypoint));
  await check('14_URLS_RESOLVED', () => inv.references.every(r => isUrl(r.selectorUrl) && isUrl(r.standaloneUrl) && isUrl(r.resolvedUrl) && r.loadStatus === 'HTTP_VERIFIED_NOT_RUNTIME_LOADED' && r.httpStatus === 200 && nonInference(r.evidence)));
  await check('AGENT_BROWSER_VERIFIED', async () => (await readJson(path.join(evidence, 'preparation.json'))).tooling.agentBrowser === '0.41.1');
  await check('VIDEO_CAPTURE_PATH_VERIFIED', async () => {
    const p = await readJson(path.join(evidence, 'preparation.json'));
    const f = p.videoTest;
    if (!f || !(await exists(f.path)) || (await sha256(f.path)) !== f.sha256) return false;
    const r = spawnSync('ffprobe', ['-v','error','-show_entries','format=duration:stream=codec_name,width,height','-of','json',f.path], { encoding:'utf8' });
    if (r.status !== 0) return false;
    const v = JSON.parse(r.stdout);
    return Number(v.format?.duration) > 0 && v.streams?.some(s => s.codec_name === 'vp8' && s.width === 1440 && s.height === 900);
  });
  await check('RAW_STORAGE_VERIFIED', async () => {
    const s = await readJson(path.join(evidence, 'audit-run-state.json'));
    return s.baseSha === BASE && (await stat(s.rawFolder)).isDirectory();
  });
  await check('VALIDATOR_BOOTSTRAPPED', () => exists(path.join(root, 'scripts/audit/validate-donor-runtime-audit.mjs')));
  await check('RUN_STATE_INITIALIZED', async () => {
    const s = await readJson(path.join(evidence, 'audit-run-state.json'));
    return s.schemaVersion === 'rubik-donor-runtime-audit.run-state.v1' && s.baseSha === BASE && Object.keys(s.takes).length === 14 && IDS.every(id => id in s.takes);
  });
  await check('PRODUCTION_DIFF_ZERO', () => productionDiff().length === 0);
  const pass = Object.values(checks).every(Boolean);
  say(pass ? 'PASS' : 'FAIL', 'PREPARATION', `${Object.values(checks).filter(Boolean).length}/${Object.keys(checks).length}`);
  return { pass, checks };
}
async function takeValidation(id, inv, schema) {
  const result = { id, gates: Object.fromEntries(GATES.map(g => [g, false])), errors: [] };
  const record = inv.references.find(r => r.id === id);
  const file = path.join(evidence, 'takes', id, 'manifest.json');
  if (!(await exists(file))) { result.errors.push('manifest absent'); return result; }
  let m; try { m = await readJson(file); } catch (e) { result.errors.push(e.message); return result; }
  result.errors.push(...schemaCheck(m, schema, schema));
  const g = result.gates;
  g.T01 = m.take?.id === id && m.take?.inventoryIndex === IDS.indexOf(id)+1 && m.take?.group === record.group && m.take?.title === record.take;
  g.T02 = !!record.resolvedUrl && m.reference?.standaloneUrl === record.standaloneUrl && m.reference?.resolvedUrl === record.resolvedUrl && nonInference(m.reference?.urlDiscoveryEvidence);
  g.T03 = m.reference?.donorCommit === DONOR && m.reference?.donorRepo === record.donorRepo && m.reference?.entrypoint === record.sourceEntrypoint;
  g.T04 = m.baseline?.approvedSha === BASE && m.baseline?.repository === 'Juanmaes83/floorplan-3d';
  g.T05 = !!(m.tooling?.os && m.tooling?.codexCli && m.tooling?.agentBrowser && m.tooling?.browser && m.tooling?.ffmpeg);
  const vp = m.viewports || {};
  g.T06 = vp.desktop?.forwardResult?.complete === true && !!vp.desktop.forwardResult.video && nonInference(m.evidenceLedger);
  g.T07 = vp.desktop?.reverseResult?.attempted === true && (vp.desktop.reverseResult.complete === true || vp.desktop.restoreVerdict === 'NO_REVERSE_BEHAVIOR') && nonInference(m.evidenceLedger);
  g.T08 = vp.portrait?.forwardResult?.assessed === true && vp.portrait?.reverseResult?.attempted === true && ['SUPPORTED','DONOR_LIMITATION'].includes(vp.portrait.runtimeSupport);
  g.T09 = vp.landscape?.forwardResult?.assessed === true && vp.landscape?.reverseResult?.attempted === true && ['SUPPORTED','DONOR_LIMITATION'].includes(vp.landscape.runtimeSupport);
  g.T10 = Object.values(vp).every(v => v?.startState?.screenshot && v?.endState?.screenshot);
  g.T11 = Object.values(vp).every(v => v?.forwardResult?.semanticPassComplete === true && Array.isArray(v?.milestones) && v.milestones.length > 0);
  g.T12 = Object.values(vp).every(v => v?.forwardResult?.video && v?.reverseResult?.video && v?.forwardResult?.videoVerified === true && v?.reverseResult?.videoVerified === true);
  g.T13 = Object.values(vp).every(v => v?.milestones?.every(mm => mm.evidence?.some(e => e.class === 'OBSERVED_RUNTIME' && /png|webm#t=/.test(e.locator))) && v?.forwardResult?.semanticScreenshotsVerified === true);
  g.T14 = Object.values(vp).every(v => v?.restoreVerdict && v.restoreVerdict !== 'UNRESOLVED' && v?.reverseResult?.comparison);
  g.T15 = Array.isArray(m.continuityInvariants) && m.continuityInvariants.length > 0 && m.continuityInvariants.every(x => nonInference(x.evidence));
  g.T16 = Array.isArray(m.donorSourceLocators) && m.donorSourceLocators.length > 0 && m.donorSourceLocators.some(x => x.classification === 'SOURCE_CONFIRMED' || x.classification === 'SOURCE_PARTIAL');
  g.T17 = Array.isArray(m.cutsAtlas) && m.cutsAtlas.length > 0 && m.cutsAtlas.every(x => x.relationToRuntime && nonInference(x.evidence));
  g.T18 = Object.keys(m.rubikCrosswalk || {}).length === 12 && CROSS.every(k => {
    const c = m.rubikCrosswalk[k]; return c && c.status && c.claim && (['EXISTS','PARTIAL'].includes(c.status) ? c.evidence?.some(e => e.class === 'RUBIK_CURRENT' && e.locator) : true);
  });
  g.T19 = Array.isArray(m.unresolved) && Array.isArray(m.evidenceLedger) && m.evidenceLedger.every(e => e.class !== 'INFERENCE' || (e.basedOn?.length && e.inferenceStatus)) && !m.unresolved.some(x => x.severity === 'BLOCKING');
  g.T20 = await verifyAssets(m.assets);
  g.T21 = productionDiff().length === 0 && m.integrity?.productionDiffZero === true;
  for (const [name, [w, h]] of Object.entries(DIMS)) {
    if (vp[name]?.width !== w || vp[name]?.height !== h || !(vp[name]?.dpr > 0)) result.errors.push(`${name} dimensions/DPR invalid`);
  }
  if (!['AUDITED','AUDITED_WITH_DONOR_LIMITATION'].includes(m.status)) result.errors.push(`status ${m.status} does not count`);
  if (m.status === 'AUDITED_WITH_DONOR_LIMITATION' && !Object.values(vp).some(v => v.runtimeSupport === 'DONOR_LIMITATION')) result.errors.push('donor limitation status without viewport limitation');
  if (!(await exists(path.join(evidence, 'takes', id, 'audit.md')))) result.errors.push('audit.md absent');
  if (m.completion?.validatorResult !== 'PASS' && process.argv.includes('--global')) result.errors.push('take has no individual PASS checkpoint');
  return result;
}
async function main() {
  const args = process.argv.slice(2);
  const prep = await preparation();
  if (args.includes('--prepare')) { if (!prep.pass) process.exitCode = 1; return; }
  const inv = await readJson(path.join(evidence, 'reference-inventory.json'));
  const schema = await readJson(path.join(pack, 'manifest.schema.json'));
  const requested = args.find(x => x.startsWith('--take='))?.slice(7);
  if (requested && !IDS.includes(requested)) throw new Error('Unknown take ID');
  const ids = requested ? [requested] : IDS;
  const results = [];
  for (const id of ids) {
    const r = await takeValidation(id, inv, schema);
    results.push(r);
    const passed = Object.values(r.gates).filter(Boolean).length;
    say(passed === 21 && !r.errors.length ? 'PASS' : 'FAIL', id, `${passed}/21 gates${r.errors.length ? '; ' + r.errors.join('; ') : ''}`);
  }
  const passed = results.reduce((n, r) => n + Object.values(r.gates).filter(Boolean).length, 0);
  say('RESULT', 'per-take hard gates', `${passed}/${ids.length * 21}`);
  if (requested) {
    if (!prep.pass || passed !== 21 || results[0].errors.length) { process.exitCode = 1; return; }
    const stamp = new Date().toISOString();
    const manifestPath = path.join(evidence, 'takes', requested, 'manifest.json');
    const manifest = await readJson(manifestPath);
    manifest.completion = {
      gates: Object.fromEntries(GATES.map(g => [g, 'PASS'])),
      validatorResult: 'PASS',
      validatedAt: stamp
    };
    await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
    const statePath = path.join(evidence, 'audit-run-state.json');
    const state = await readJson(statePath);
    state.phase = 'RUNTIME_AUDIT';
    state.takes[requested].validationStatus = 'COMPLETE';
    state.takes[requested].lastSuccessfulStage = 'VALIDATED_CHECKPOINT';
    state.takes[requested].timestamps.updatedAt = stamp;
    state.updatedAt = stamp;
    await writeFile(statePath, JSON.stringify(state, null, 2) + '\n');
    say('PASS', 'CHECKPOINT', `${requested} at ${stamp}`);
    return;
  }
  const globalFiles = ['master-manifest.json','conflicts.json','unresolved.json','capability-map.json','dependency-graph.json','shared-mechanisms.json','reports/reconciliation.md','raw-package-manifest.json','raw-inventory.json'];
  const globalExist = (await Promise.all(globalFiles.map(f => exists(path.join(evidence, f))))).every(Boolean);
  if (!globalExist) { say('FAIL', 'GLOBAL', 'required aggregate file absent'); process.exitCode = 1; return; }
  const [master, conflicts, unresolved, capability, graph, shared, pkg, inventory, state] = await Promise.all(['master-manifest.json','conflicts.json','unresolved.json','capability-map.json','dependency-graph.json','shared-mechanisms.json','raw-package-manifest.json','raw-inventory.json','audit-run-state.json'].map(f => readJson(path.join(evidence, f))));
  const report = await readFile(path.join(evidence, 'reports/reconciliation.md'), 'utf8');
  const manifests = await Promise.all(IDS.map(id => readJson(path.join(evidence, 'takes', id, 'manifest.json'))));
  const ref = inv.references;
  const everyViewport = fn => manifests.every(m => Object.entries(DIMS).every(([name, dim]) => fn(m.viewports[name], name, dim)));
  const unique = arr => new Set(arr).size === arr.length;
  const rawFileLines = inventory.files?.map(f => `${f.sha256}  ${f.bytes}  ${f.path}\n`).join('') || '';
  const rawContentHash = createHash('sha256').update(rawFileLines).digest('hex');
  const rawValid = pkg.schemaVersion === 'rubik-donor-runtime-audit.raw-package.v1' && pkg.memberPathsAndCRCsVerified === true && pkg.originalRawPreserved === true && pkg.format === 'ZIP_STORED_ZIP64' && pkg.rawFileCount === inventory.fileCount && pkg.rawBytes === inventory.totalBytes && pkg.rawPackageContentSha256 === inventory.packageContentSha256 && rawContentHash === inventory.packageContentSha256 && inventory.files.length === inventory.fileCount && unique(inventory.files.map(f => f.path)) && pkg.rawInventorySha256 === await sha256(path.join(evidence, 'raw-inventory.json')) && await exists(pkg.packagePath) && (await stat(pkg.packagePath)).size === pkg.bytes && await sha256(pkg.packagePath) === pkg.sha256;
  const noInferenceOnly = manifests.every(m => m.continuityInvariants.every(x => nonInference(x.evidence)) && m.cutsAtlas.every(x => nonInference(x.evidence)) && m.viewports && Object.values(m.viewports).every(v => v.milestones.every(mm => mm.evidence?.some(e => e.class === 'OBSERVED_RUNTIME'))));
  const globalGates = {
    A01: ref.length === 14 && unique(ref.map(r => r.id)) && ref.every((r,i) => r.id === IDS[i]) && master.references?.length === 14 && master.references.every((r,i) => r.id === IDS[i]),
    A02: manifests.length === 14 && manifests.every(m => ['AUDITED','AUDITED_WITH_DONOR_LIMITATION'].includes(m.status)) && master.validatedReferences === 14,
    A03: passed === 294 && results.every(r => !r.errors.length && Object.values(r.gates).every(Boolean)) && master.individualHardGatesPassed === 294 && master.individualHardGatesExpected === 294,
    A04: ref.every((r,i) => isUrl(r.standaloneUrl) && isUrl(r.resolvedUrl) && r.httpStatus === 200 && manifests[i].reference.standaloneUrl === r.standaloneUrl && manifests[i].reference.resolvedUrl === r.resolvedUrl),
    A05: everyViewport((v,name) => name !== 'desktop' || v.forwardResult.complete === true && v.forwardResult.videoVerified === true),
    A06: everyViewport((v,name) => name !== 'desktop' || v.reverseResult.attempted === true && v.restoreVerdict !== 'UNRESOLVED'),
    A07: everyViewport((v,name) => name !== 'portrait' || v.forwardResult.assessed === true && v.reverseResult.attempted === true && ['SUPPORTED','DONOR_LIMITATION'].includes(v.runtimeSupport)),
    A08: everyViewport((v,name) => name !== 'landscape' || v.forwardResult.assessed === true && v.reverseResult.attempted === true && ['SUPPORTED','DONOR_LIMITATION'].includes(v.runtimeSupport)),
    A09: everyViewport(v => v.forwardResult.videoVerified === true && v.reverseResult.videoVerified === true && v.forwardResult.semanticPassComplete === true),
    A10: everyViewport(v => v.milestones.length > 0 && v.forwardResult.semanticScreenshotsVerified === true && v.milestones.every(mm => mm.evidence?.some(e => e.class === 'OBSERVED_RUNTIME'))),
    A11: manifests.every(m => m.donorSourceLocators.length > 0 && m.cutsAtlas.length > 0 && m.cutsAtlas.every(c => c.relationToRuntime)),
    A12: Object.keys(capability.byTake || {}).length === 14 && IDS.every(id => Object.keys(capability.byTake[id]?.crosswalk || {}).length === 12 && CROSS.every(k => capability.byTake[id].crosswalk[k]?.status === manifests[IDS.indexOf(id)].rubikCrosswalk[k]?.status)),
    A13: results.every(r => r.gates.T20) && inventory.fileCount > 0 && rawContentHash === inventory.packageContentSha256,
    A14: rawValid && master.rawPackage?.sha256 === pkg.sha256,
    A15: productionDiff().length === 0,
    A16: noInferenceOnly,
    A17: unresolved.items?.every(u => u.severity === 'NON_BLOCKING') && manifests.every(m => m.unresolved.every(u => u.severity !== 'BLOCKING')) && master.blockingUnresolvedCount === 0,
    A18: report.includes('## Fourteen references and professional services') && IDS.every(id => report.includes(id)) && report.includes('## Dependencies and QA') && report.includes('## Conflicts and unresolved') && !/\b(?:P0|P1|P2|Sprint|implement next|must build first)\b/i.test(report) && shared.items?.length > 0 && shared.items.every(s => s.takesUsedBy.length > 1 && s.professionalServiceIdentity?.length === s.takesUsedBy.length) && graph.nodes?.length > 0 && graph.edges?.length > 0 && graph.edges.every(e => e.from !== e.to && graph.nodes.some(n => n.id === e.from) && graph.nodes.some(n => n.id === e.to) && graph.edgeTypes.includes(e.type)) && Array.isArray(conflicts.items) && conflicts.items.every(c => c.evidence?.length && c.statements?.length && c.severity && c.status) && state.baseSha === BASE && IDS.every(id => state.takes[id]?.validationStatus === 'COMPLETE')
  };
  for (const [gate, ok] of Object.entries(globalGates)) say(ok ? 'PASS' : 'FAIL', gate);
  const full = prep.pass && Object.values(globalGates).every(Boolean);
  say(full ? 'PASS' : 'FAIL', 'GLOBAL', `${Object.values(globalGates).filter(Boolean).length}/18 global gates; ${passed}/294 take gates; blocking ${unresolved.items.filter(x => x.severity === 'BLOCKING').length}; production diff ${productionDiff().length}`);
  if (full) {
    if (master.status !== 'VALIDATED_COMPLETE') {
      master.status = 'VALIDATED_COMPLETE';
      master.globalValidator = { result: 'PASS', gates: 18, references: 14, perTakeHardGates: 294, validatedAt: new Date().toISOString() };
      await writeFile(path.join(evidence, 'master-manifest.json'), JSON.stringify(master, null, 2) + '\n');
    }
    if (state.phase !== 'GLOBAL_VALIDATED') {
      state.phase = 'GLOBAL_VALIDATED';
      state.updatedAt = new Date().toISOString();
      await writeFile(path.join(evidence, 'audit-run-state.json'), JSON.stringify(state, null, 2) + '\n');
    }
    console.log('AUDIT 14/14 COMPLETE');
  }
  else process.exitCode = 1;
}
main().catch(e => { console.error('VALIDATOR ERROR:', e.message); process.exitCode = 1; });
