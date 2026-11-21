// M03 · Revisión de un render de Blender: verificación de integridad y procedencia, diferencias declaradas y paquete.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const R = require('../js/blender-review-core.js');
const D = require('../js/scene-delivery-core.js');
const Package = require('../js/project-package.js');
const digest = async b => createHash('sha256').update(b).digest('hex');
const enc = new TextEncoder();
const CJK = /[㐀-鿿]/;

// PNG mínimo válido (firma + IHDR) de w×h; el contenido extra hace cada imagen distinta.
function png(w, h, tag) {
  const b = Buffer.alloc(33 + tag.length);
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]).copy(b, 0); b.writeUInt32BE(13, 8); b.write('IHDR', 12); b.writeUInt32BE(w, 16); b.writeUInt32BE(h, 20);
  b.write(tag, 33); return new Uint8Array(b);
}
const project = { id: 'prj_demo', name: 'Demo', rooms: [{ id: 'rom_a', name: 'Salón' }] };
async function folder({ status = 'complete', projectId = 'prj_demo', observed = 'obs-1', glb = 'glb-1', reopen = 'PASS', views = ['viewer', 'axon', 'rom_a'] } = {}) {
  const files = new Map(), rows = [];
  for (const v of views) { const b = png(640, 400, v); files.set(v + '.png', b); rows.push({ view: v, label: v === 'rom_a' ? 'Salón' : v, seconds: 1.5, png: { bytes: b.length, sha256: await digest(b) } }); }
  const ref = png(1280, 800, 'reference');
  const manifest = { format: 'rubik-sota.scene-delivery', source: { projectId, observedProjectSha256: observed }, files: { 'scene.glb': { sha256: glb }, [D.REFERENCE]: { sha256: await digest(ref) } }, fallbacks: { proceduralObjects: 12, texturesNotCopied: 3, assetErrors: [] }, limitations: ['Visual observation.'] };
  const report = { format: 'rubik-sota.blender-render', status, profile: 'preview', resolution: [640, 400], samples: 16, blender: '5.2.1 LTS', renderer: 'Cycles CPU, 16 samples', requestedViews: views,
    input: { glbSha256: 'glb-1', projectId, observedProjectSha256: observed }, derived: ['sun and sky: captured from the viewer', 'room fill: one ceiling area light per room (1)', 'exposure -0.4 EV (derived)', 'textured floors coloured from their project material (2 meshes)'], views: rows };
  files.set(R.MANIFEST, enc.encode(JSON.stringify(manifest))); files.set(R.REFERENCE, ref);
  Object.assign(report.input, { manifestSha256: await digest(files.get(R.MANIFEST)), preparedBlendSha256: 'a'.repeat(64) });
  files.set(R.REPORT, enc.encode(JSON.stringify(report)));
  if (reopen) files.set(R.REOPEN, enc.encode(JSON.stringify({ status: reopen, input: report.input })));
  return files;
}
const codes = r => r.issues.map(i => i.code).sort();
const review = async ({ files, ...options }) => R.verify({ files, originalManifestSha: files.has(R.MANIFEST) ? await digest(files.get(R.MANIFEST)) : null, ...options });

test('M03 · a complete render of this project and scene can be delivered', async () => {
  const r = await review({ files: await folder(), digest, project, projectSha: 'obs-1', labels: { rom_a: 'Salón' } });
  assert.equal(r.canDeliver, true); assert.deepEqual(r.issues, []); assert.equal(r.views.length, 3);
  assert.deepEqual(r.views.map(v => [v.width, v.height]), [[640, 400], [640, 400], [640, 400]]); assert.equal(r.views[2].label, 'Salón');
  assert.equal(r.reopen.status, 'PASS'); assert.equal(r.hasReference, true);
});

test('M03 · every integrity and provenance problem is detected and blocks the delivery', async () => {
  const altered = await folder(); altered.set('axon.png', png(640, 400, 'tampered'));
  for (const [files, code] of [
    [altered, 'ALTERED_IMAGE'],
    [await folder({ projectId: 'prj_other' }), 'OTHER_PROJECT'],
    [await folder({ glb: 'glb-2' }), 'OTHER_SCENE'],
    [await folder({ status: 'partial' }), 'INCOMPLETE'],
    [await folder({ reopen: 'FAIL' }), 'REOPEN_FAILED'],
  ]) { const r = await review({ files, digest, project, projectSha: 'obs-1' }); assert.equal(r.canDeliver, false, code); assert.ok(codes(r).includes(code), code + ' in ' + codes(r)); }
  const missing = await folder(); missing.delete('rom_a.png');
  assert.ok(codes(await review({ files: missing, digest, project, projectSha: 'obs-1' })).includes('MISSING_IMAGE'));
  const none = await review({ files: new Map([['foto.png', png(10, 10, 'x')]]), digest, project, projectSha: 'obs-1' });
  assert.equal(none.canDeliver, false); assert.deepEqual(codes(none), ['NO_REPORT']);
  const bad = await review({ files: new Map([[R.REPORT, enc.encode('{"format":"other"}')]]), digest, project }); assert.deepEqual(codes(bad), ['BAD_REPORT']);
  const notPng = await folder(); const row = JSON.parse(new TextDecoder().decode(notPng.get(R.REPORT))); const junk = enc.encode('not a png at all, really');
  notPng.set('viewer.png', junk); row.views[0].png = { bytes: junk.length, sha256: await digest(junk) }; notPng.set(R.REPORT, enc.encode(JSON.stringify(row)));
  assert.ok(codes(await review({ files: notPng, digest, project, projectSha: 'obs-1' })).includes('ALTERED_IMAGE'), 'a file that is not a PNG is never delivered');
});

test('M03 · stale projects and missing reopen evidence block delivery; reference remains optional', async () => {
  const f = await folder({ reopen: null }); f.delete(R.REFERENCE);
  const r = await review({ files: f, digest, project, projectSha: 'obs-2' });
  assert.equal(r.canDeliver, false); assert.deepEqual(codes(r), ['NO_REFERENCE', 'PROJECT_CHANGED', 'REOPEN_NOT_VERIFIED']);
  for (const lang of ['es', 'en', 'zh']) for (const i of r.issues) { const t = R.explain(i, lang); assert.ok(t.length > (lang === 'zh' ? 8 : 20)); if (lang !== 'zh') assert.doesNotMatch(t, CJK); }
});

test('M03 · declared differences separate project data, added render aids and what does not travel', async () => {
  const r = await review({ files: await folder(), digest, project, projectSha: 'obs-1' });
  for (const lang of ['es', 'en', 'zh']) {
    const d = R.differences(r, lang); assert.deepEqual([...new Set(d.map(x => x.kind))].sort(), ['added', 'kept', 'missing']);
    if (lang !== 'zh') assert.doesNotMatch(JSON.stringify(d), CJK);
  }
  assert.match(R.differences(r, 'es').map(x => x.text).join(' '), /12 muebles.*representación del visor/);
});

test('M03 · delivery package: stable names, originals byte for byte, every file fingerprinted, no contact data', async () => {
  const files = await folder(), r = await review({ files, digest, project, projectSha: 'obs-1', labels: { rom_a: 'Salón' } });
  r.views = R.paths(r.views, 'es');
  assert.deepEqual(r.views.map(v => v.original), ['originales/01-vista-de-rubik-misma-camara.png', 'originales/02-axonometria.png', 'originales/03-salon.png']);
  const entries = new Map();
  for (const v of r.views) { entries.set(v.original, files.get(v.file)); entries.set(v.presentation, png(1600, 1000, 'p-' + v.view)); v.presentationPath = v.presentation; }
  entries.set('LEEME-ENTREGA.txt', enc.encode(R.readme({ verified: r, brand: { name: 'Estudio Norte' }, projectChanged: false, lang: 'es' })));
  const m = await R.deliveryManifest({ verified: r, entries, digest, project, brand: { name: 'Estudio Norte' } });
  entries.set('entrega.json', enc.encode(JSON.stringify(m)));
  for (const [n, f] of Object.entries(m.files)) assert.equal(f.sha256, await digest(entries.get(n)), n);
  assert.equal(m.files['originales/03-salon.png'].sha256, await digest(files.get('rom_a.png')), 'the original is the Cycles PNG, unmodified');
  assert.deepEqual(m.brand, { used: true, name: 'Estudio Norte', contact: 'not included' });
  assert.doesNotMatch(JSON.stringify(m), /phone|email|@/);
  const zip = Package.zip(entries, { check: R.checkName }); assert.ok(zip.size > 100, 'FloorPlanPackage.zip returns a Blob');
  for (const bad of ['../x.png', 'originales/a b.png', 'otros/x.png', 'scene.blend']) assert.throws(() => R.checkName(bad));
  for (const lang of ['es', 'en']) assert.doesNotMatch(R.readme({ verified: r, brand: null, projectChanged: true, lang }), CJK);
  assert.match(R.readme({ verified: r, brand: null, projectChanged: true, lang: 'es' }), /el proyecto cambió/);
});

test('M03 · png header parser', () => {
  assert.deepEqual(R.pngInfo(png(1600, 1000, 'x')), { width: 1600, height: 1000 });
  assert.equal(R.pngInfo(enc.encode('GIF89a not a png file at all')), null); assert.equal(R.pngInfo(null), null);
});

test('M03 · original manifest, project revision, level, views and reopened scene must all belong together', async () => {
  const files = await folder();
  const read = name => JSON.parse(new TextDecoder().decode(files.get(name)));
  const write = (target, name, value) => target.set(name, enc.encode(JSON.stringify(value)));
  const source = { projectId: project.id, observedProjectSha256: 'obs-1' };
  const manifest = { ...read(R.MANIFEST), source, scene: { frame: { activeLevelId: 'upper' } } };
  write(files, R.MANIFEST, manifest);
  const originalManifestSha = await digest(files.get(R.MANIFEST));
  const report = read(R.REPORT);
  Object.assign(report.input, { manifestSha256: originalManifestSha, preparedBlendSha256: 'a'.repeat(64) });
  write(files, R.REPORT, report);
  write(files, R.REOPEN, { status: 'PASS', input: report.input });
  const verify = (f, options = {}) => R.verify({ files:f, digest, project, projectSha:'obs-1', originalManifestSha, levelId:'upper', ...options });
  assert.equal((await verify(files)).canDeliver, true);

  const changedCapture = new Map(files);
  write(changedCapture, R.MANIFEST, { ...manifest, scene: { ...manifest.scene, view: { camera: 'another shot' } } });
  const changedRun = new Map(files);
  write(changedRun, R.REOPEN, { status:'PASS', input: { ...report.input, preparedBlendSha256:'b'.repeat(64) } });
  const missingView = new Map(files);
  write(missingView, R.REPORT, { ...report, views:report.views.slice(0, -1) });
  const repeatedView = new Map(files);
  write(repeatedView, R.REPORT, { ...report, requestedViews:['viewer','viewer'], views:[report.views[0],report.views[0]] });
  for (const [result, reason] of [
    [await verify(changedCapture), 'OTHER_CAPTURE'],
    [await verify(changedRun), 'REOPEN_FAILED'],
    [await verify(missingView), 'INCOMPLETE'],
    [await verify(repeatedView), 'INCOMPLETE'],
    [await verify(files, { originalManifestSha:null }), 'OTHER_CAPTURE'],
    [await verify(files, { projectSha:'obs-2' }), 'PROJECT_CHANGED'],
    [await verify(files, { levelId:'lower' }), 'OTHER_SCENE'],
  ]) {
    assert.equal(result.canDeliver, false);
    assert.ok(codes(result).includes(reason), reason);
  }
  assert.equal(R.pngInfo(png(8192, 8192, 'oversize')), null);
});
