'use strict';
// SCULPT OP-10 · Verificación dirigida del delta de run.cjs (759d9bb7 → a9895f8c): calcula el bloque `identity` sobre los
// artefactos YA EXISTENTES de una ejecución, sin repetir captura, comparación ni Blender. Solo lee.
// Uso: node identity.cjs CARPETA-DE-EJECUCIÓN  → JSON por stdout
const fs = require('node:fs'), path = require('node:path');
const Expediente = require('../../../../js/expediente-core.js'), { SCENARIOS } = require('../run.cjs');
(async () => {
  const dir = path.resolve(process.argv[2]), rows = [];
  for (const s of SCENARIOS) {
    const cap = path.join(dir, 'capture', s.id), m = JSON.parse(fs.readFileSync(path.join(cap, 'manifest.json'), 'utf8'));
    const fixtureDoc = JSON.parse(fs.readFileSync(path.join(dir, 'fixtures', s.fixture), 'utf8'));
    const subject = s.building ? { kind: 'building', building: fixtureDoc } : { kind: 'project', project: JSON.parse(fs.readFileSync(path.join(cap, 'project.json'), 'utf8')) };
    rows.push({ id: s.id,
      observedProject: { projectId: m.source.projectId, updatedAt: m.source.projectUpdatedAt, canonicalSha256: m.source.projectCanonicalSha256, meaning: 'the project as observed in the viewer at capture time; NOT a confirmed F0 transactional revision' },
      fixtureContentId: await Expediente.contentId(subject, { budgets: {}, reviews: {} }, async () => ''),
      fixtureContentIdScope: 'synthetic fixtures only: empty documents (no budgets, no reviews), no verified image bytes, called outside the expediente pack/read path',
      sceneSha256: m.outputs['scene.json'].sha256 });
  }
  console.log(JSON.stringify({ format: 'rubik-sota.op10-identity', source: dir, runCommit: '759d9bb7', toolNote: 'computed after the run from its files; capture/compare/Blender outputs untouched', scenarios: rows }, null, 1));
})().catch(e => { console.error(e.message); process.exitCode = 1; });
