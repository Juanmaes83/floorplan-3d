'use strict';
/* OP-10 · Validación completa y reproducible de «Escena para Blender» sobre la app real (sustituye a labs/sculpt/op-10/run.cjs).
 * node scripts/interop/scene-run.cjs DESTINO-NUEVO --python PY-CON-BPY [--only f1-rect,f5-furniture] [--browser chromium]
 * Por escenario: fixture → paquete en la app (View3D.captureScene → GLB + manifiesto) → A↔B (contratos, C2/C3) →
 * importación glTF nativa en Blender → C↔B (vértice a vértice, independiente del orden) → C↔A → reapertura en proceso nuevo.
 * Nunca sobrescribe; cada paso de Blender registra tiempo y memoria pico. Escribe summary.json.
 */
const fs = require('node:fs'), path = require('node:path'), { execFileSync } = require('node:child_process');
const here = __dirname, Fixtures = require('../../tests/fixtures/scene-blender/build.cjs'), Capture = require('./scene-capture.cjs');
const { compare, compareBuilding } = require('./scene-fidelity.cjs'), { roundtrip } = require('./scene-roundtrip.cjs'), Core = require('../../js/scene-capture-core.js');
const SCENARIOS = [
  { id: 'f1-rect', fixture: 'f1-rect.json' }, { id: 'f2-rot30', fixture: 'f2-rot30.json' }, { id: 'f3-openings', fixture: 'f3-openings.json' },
  { id: 'f4-active', fixture: 'f4-building.json', scope: 'active', building: true }, { id: 'f4-all', fixture: 'f4-building.json', scope: 'all', building: true },
  { id: 'f5-furniture', fixture: 'f5-furniture.json' }, { id: 'f6-r02r03', fixture: 'f6-r02r03.json' }, { id: 'f7-curved', fixture: 'f7-curved.json', op07State: 'active' },
];
function measured(report, args) { execFileSync('python3', [path.join(here, 'measure.py'), report, '--', ...args], { stdio: ['ignore', 'pipe', 'pipe'] }); return JSON.parse(fs.readFileSync(report, 'utf8')); }
const J = f => JSON.parse(fs.readFileSync(f, 'utf8'));

async function run(dest, { python, only, browser = 'chromium' } = {}) {
  if (fs.existsSync(dest)) throw Error('Refusing overwrite: ' + dest);
  const fx = path.join(dest, 'fixtures'); Fixtures.build(fx);
  const summary = { format: 'rubik-sota.scene-run', version: '1.0.0', browser, startedAt: new Date().toISOString(), scenarios: [] };
  for (const s of SCENARIOS.filter(x => !only || only.includes(x.id))) {
    const cap = path.join(dest, 'package', s.id), out = { id: s.id };
    const m = await Capture.capture(path.join(fx, s.fixture), cap, { scope: s.scope || 'active', browser, ...(s.op07State ? { op07State: s.op07State } : {}) });
    out.capture = { stats: m.stats, excluded: m.excluded, metrics: m.metrics, assets: m.fallbacks.assets, glbSha256: m.outputs['scene.glb'].sha256, sceneJsonSha256: m.outputs['scene.json'].sha256 };
    const scene = J(path.join(cap, 'scene.json')), fixture = J(path.join(fx, s.fixture)), coincident = Core.coincidentFaces(scene);
    out.c3 = { visibleDefects: coincident.defects.length, hiddenByContact: coincident.hiddenByContact, benignSameMaterial: coincident.benignSameMaterial, first: coincident.defects.slice(0, 3) };
    const fid = s.building ? compareBuilding(fixture, scene, { activeLevelId: scene.frame.activeLevelId }) : compare(J(path.join(cap, 'project.json')), scene, { coincident });
    fs.writeFileSync(path.join(cap, 'fidelity-AB.json'), JSON.stringify(fid, null, 1) + '\n', { flag: 'wx' });
    out.fidelityAB = s.building ? fid.levels.map(l => ({ level: l.level, present: l.present, contract: l.contractChecks, failed: l.failed })).concat([{ stairs: fid.stairs }]) : { contract: fid.contractChecks, failed: fid.failed, visual: fid.visualDifferences, unlinked: scene.stats.unlinked };
    if (python) {
      const imp = path.join(dest, 'blender', s.id);
      out.blenderImport = measured(path.join(dest, 'blender', s.id + '.import-metrics.json'), [python, path.join(here, 'blender-scene-import.py'), '--', cap, imp]);
      out.importReport = J(path.join(imp, 'import-report.json')).status;
      const c = J(path.join(imp, 'blender-geometry.json')), rt = roundtrip(scene, c);
      fs.writeFileSync(path.join(imp, 'roundtrip-CB.json'), JSON.stringify(rt, null, 1) + '\n', { flag: 'wx' });
      out.roundtripCB = { pass: rt.pass, maxVertexDeviationMm: rt.maxVertexDeviationMm, vertices: rt.vertices, issues: rt.issueCount };
      const fidC = s.building ? compareBuilding(fixture, c, { activeLevelId: scene.frame.activeLevelId }) : compare(J(path.join(cap, 'project.json')), c);
      fs.writeFileSync(path.join(imp, 'fidelity-CA.json'), JSON.stringify(fidC, null, 1) + '\n', { flag: 'wx' });
      out.fidelityCA = s.building ? fidC.levels.map(l => ({ level: l.level, contract: l.contractChecks, failed: l.failed })) : { contract: fidC.contractChecks, failed: fidC.failed };
      out.reopen = measured(path.join(dest, 'blender', s.id + '.reopen-metrics.json'), [python, path.join(here, 'blender-scene-reopen.py'), '--', imp, path.join(dest, 'blender', s.id + '.reopen.json')]);
      out.reopen.result = J(path.join(dest, 'blender', s.id + '.reopen.json')).status;
    }
    summary.scenarios.push(out);
    console.log(JSON.stringify({ id: s.id, meshes: m.stats.meshes, unlinked: m.stats.unlinked, c3: out.c3.visibleDefects, ab: out.fidelityAB, cb: out.roundtripCB, ca: out.fidelityCA, reopen: out.reopen && out.reopen.result }));
  }
  summary.finishedAt = new Date().toISOString();
  fs.writeFileSync(path.join(dest, 'summary.json'), JSON.stringify(summary, null, 1) + '\n', { flag: 'wx' });
  return summary;
}
module.exports = { run, SCENARIOS };
if (require.main === module) {
  const a = process.argv.slice(2), val = k => { const i = a.indexOf(k); return i > 0 ? a[i + 1] : undefined; };
  if (!a[0]) { console.error('Usage: node scripts/interop/scene-run.cjs NEW-DEST --python PY [--only ids] [--browser chromium]'); process.exit(1); }
  run(path.resolve(a[0]), { python: val('--python'), only: val('--only') && val('--only').split(','), browser: val('--browser') || 'chromium' })
    .catch(e => { console.error(e.stack || e.message); process.exitCode = 1; });
}
