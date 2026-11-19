'use strict';
/* SCULPT OP-10 · Ejecución completa y reproducible del laboratorio (sin render; el render va aparte, ver README).
 * node labs/sculpt/op-10/run.cjs DESTINO-NUEVO --python RUTA-PYTHON-CON-BPY   (env CHROME = Chromium)
 * Pasos: fixtures → captura real en RUBIK (7 escenarios) → fidelidad A↔B → importación Blender → C↔B y C↔A →
 *        reapertura en proceso nuevo → summary.json. Nunca sobrescribe; cada paso registra tiempo y memoria.
 */
const fs = require('node:fs'), path = require('node:path'), { execFileSync } = require('node:child_process');
const Expediente = require('../../../js/expediente-core.js'); // F0 (master): identidad portable del trabajo, solo lectura
const lab = __dirname, Fixtures = require('./fixtures/build.cjs'), Capture = require('./src/capture-browser.cjs');
const { compare, compareBuilding } = require('./src/compare.cjs'), { roundtrip } = require('./src/roundtrip.cjs');
const SCENARIOS = [
  { id: 'f1-rect', fixture: 'f1-rect.json' }, { id: 'f2-rot30', fixture: 'f2-rot30.json' }, { id: 'f3-openings', fixture: 'f3-openings.json' },
  { id: 'f4-active', fixture: 'f4-building.json', scope: 'active', building: true }, { id: 'f4-all', fixture: 'f4-building.json', scope: 'all', building: true },
  { id: 'f5-furniture', fixture: 'f5-furniture.json' }, { id: 'f6-r02r03', fixture: 'f6-r02r03.json' },
];
function measured(report, args) { execFileSync('python3', [path.join(lab, 'tools/measure.py'), report, '--', ...args], { stdio: ['ignore', 'pipe', 'pipe'] }); return JSON.parse(fs.readFileSync(report, 'utf8')); }

async function run(dest, python) {
  if (fs.existsSync(dest)) throw Error('Refusing overwrite: ' + dest);
  const fx = path.join(dest, 'fixtures'); Fixtures.build(fx);
  const summary = { format: 'rubik-sota.op10-run', version: '0.1.0-lab', startedAt: new Date().toISOString(), scenarios: [] };
  for (const s of SCENARIOS) {
    const cap = path.join(dest, 'capture', s.id), out = { id: s.id };
    const m = await Capture.capture(path.join(fx, s.fixture), cap, { scope: s.scope || 'active' });
    // Huellas separadas: proyecto OBSERVADO en el visor (no es una revisión transaccional F0 confirmada) ≠ contentId del fixture.
    const fixtureDoc = JSON.parse(fs.readFileSync(path.join(fx, s.fixture), 'utf8'));
    const subject = s.building ? { kind: 'building', building: fixtureDoc } : { kind: 'project', project: JSON.parse(fs.readFileSync(path.join(cap, 'project.json'), 'utf8')) };
    out.identity = { observedProject: { projectId: m.source.projectId, updatedAt: m.source.projectUpdatedAt, canonicalSha256: m.source.projectCanonicalSha256, meaning: 'project as observed in the viewer at capture time; NOT a confirmed F0 transactional revision' },
      fixtureContentId: await Expediente.contentId(subject, { budgets: {}, reviews: {} }, async () => ''), fixtureContentIdScope: 'synthetic fixtures only: empty documents, no verified image bytes, outside the expediente pack/read path', sceneSha256: m.outputs['scene.json'].sha256,
      note: 'fixtureContentId = js/expediente-core.js contentId() called directly: neutralises the local id but NOT createdAt/updatedAt (verified); compare it only through the same expediente path. scene = observed snapshot + scope; render fingerprint lives in render-report.json' };
    out.capture = { stats: m.stats, excluded: m.excluded, metrics: m.metrics, assets: m.fallbacks.assetStates, sceneSha256: m.outputs['scene.json'].sha256, projectCanonicalSha256: m.source.projectCanonicalSha256 };
    const scene = JSON.parse(fs.readFileSync(path.join(cap, 'scene.json'), 'utf8'));
    const fid = s.building ? compareBuilding(JSON.parse(fs.readFileSync(path.join(fx, s.fixture), 'utf8')), scene, { activeLevelId: scene.frame.activeLevelId })
      : compare(JSON.parse(fs.readFileSync(path.join(cap, 'project.json'), 'utf8')), scene);
    fs.writeFileSync(path.join(cap, 'fidelity-AB.json'), JSON.stringify(fid, null, 1) + '\n', { flag: 'wx' });
    out.fidelityAB = s.building ? fid.levels.map(l => ({ level: l.level, present: l.present, contract: l.contractChecks, failed: l.failed })).concat([{ stairs: fid.stairs }]) : { contract: fid.contractChecks, failed: fid.failed, visual: fid.visualDifferences, unlinked: fid.unlinked.total, associated: fid.unlinked.associatedToOpenings };
    if (python) {
      const imp = path.join(dest, 'blender', s.id);
      out.blenderImport = measured(path.join(dest, 'blender', s.id + '.import-metrics.json'), [python, path.join(lab, 'blender/import_scene.py'), '--', cap, imp]);
      const c = JSON.parse(fs.readFileSync(path.join(imp, 'blender-geometry.json'), 'utf8'));
      const rt = roundtrip(scene, c); fs.writeFileSync(path.join(imp, 'roundtrip-CB.json'), JSON.stringify(rt, null, 1) + '\n', { flag: 'wx' });
      const fidC = s.building ? compareBuilding(JSON.parse(fs.readFileSync(path.join(fx, s.fixture), 'utf8')), c, { activeLevelId: scene.frame.activeLevelId }) : compare(JSON.parse(fs.readFileSync(path.join(cap, 'project.json'), 'utf8')), c);
      fs.writeFileSync(path.join(imp, 'fidelity-CA.json'), JSON.stringify(fidC, null, 1) + '\n', { flag: 'wx' });
      out.roundtripCB = { pass: rt.pass, maxVertexDeviationMm: rt.maxVertexDeviationMm, vertices: rt.vertices, issues: rt.issues.length };
      out.fidelityCA = s.building ? fidC.levels.map(l => ({ level: l.level, contract: l.contractChecks, failed: l.failed })) : { contract: fidC.contractChecks, failed: fidC.failed };
      out.reopen = measured(path.join(dest, 'blender', s.id + '.reopen-metrics.json'), [python, path.join(lab, 'blender/reopen_verify.py'), '--', imp, path.join(dest, 'blender', s.id + '.reopen.json')]);
      out.reopen.result = JSON.parse(fs.readFileSync(path.join(dest, 'blender', s.id + '.reopen.json'), 'utf8')).status;
      out.importReport = JSON.parse(fs.readFileSync(path.join(imp, 'import-report.json'), 'utf8')).status;
    }
    summary.scenarios.push(out); console.log(JSON.stringify({ id: s.id, ab: out.fidelityAB, cb: out.roundtripCB, ca: out.fidelityCA, reopen: out.reopen && out.reopen.result }));
  }
  summary.finishedAt = new Date().toISOString();
  fs.writeFileSync(path.join(dest, 'summary.json'), JSON.stringify(summary, null, 1) + '\n', { flag: 'wx' });
  return summary;
}
module.exports = { run, SCENARIOS };
if (require.main === module) {
  const a = process.argv.slice(2), dest = a[0], i = a.indexOf('--python'), python = i > 0 ? a[i + 1] : null;
  if (!dest) { console.error('Uso: node run.cjs DESTINO-NUEVO --python PY-CON-BPY'); process.exit(1); }
  run(path.resolve(dest), python).catch(e => { console.error(e.stack || e.message); process.exitCode = 1; });
}
