// StoryLayersV1 · núcleo: historia de dos revisiones con datos trazables, ausentes declarados, revisión profesional,
// preparación (medio / guardada / vigente) y obsolescencia. Las cifras se comprueban contra una FICHA INDEPENDIENTE
// calculada aquí (fórmula del polígono escrita en la prueba, sin usar el código de RUBIK).
const { test } = require('node:test'), assert = require('node:assert/strict'), { createHash } = require('node:crypto');
const S = require('../js/story-layers-core.js'), Core = require('../js/project-core.js'), Reference = require('../js/reference-project.js');
const digest = async b => createHash('sha256').update(b).digest('hex');
const CJK = /[㐀-鿿]/;
// Ficha independiente: área por la fórmula del lazo, en m², a dos decimales.
const fichaArea = poly => { let s = 0; for (let i = 0; i < poly.length; i++) { const a = poly[i], b = poly[(i + 1) % poly.length]; s += a.x * b.y - b.x * a.y; } return Math.round(Math.abs(s) / 2 / 1e6 * 100) / 100; };

// Dos revisiones sintéticas declaradas: «después» amplía una estancia (desplaza un lado 600 mm) y quita un muro interior.
function pair() {
  const before = Core.clone(Reference); before.id = 'prj_story-a'; before.updatedAt = '2026-11-20T10:00:00.000Z';
  const after = Core.clone(before); after.updatedAt = '2026-11-26T10:00:00.000Z';
  const room = after.rooms.slice().sort((a, b) => fichaArea(b.polygon) - fichaArea(a.polygon))[0];
  const maxX = Math.max(...room.polygon.map(p => p.x)); for (const p of room.polygon) if (p.x === maxX) p.x += 600;
  const used = new Set(after.openings.map(o => o.wallId)), inner = after.walls.find(w => !used.has(w.id) && w.structure !== 'load-bearing');
  after.walls = after.walls.filter(w => w !== inner);
  return { before, after, roomId: room.id, wallId: inner.id };
}
const name = r => /[㐀-鿿]/.test(r.name || '') ? 'Estancia ' + r.id.slice(-4) : r.name;

test('historia de dos revisiones: misma cámara en planta, ≥2 datos anclados a elementos visibles, cifras = ficha independiente', async () => {
  const { before, after, roomId, wallId } = pair();
  const refs = { before: { entryId: 'e1', fingerprint: await S.fingerprint(before, digest) }, after: { entryId: 'e2', fingerprint: await S.fingerprint(after, digest) } };
  const s = S.build({ before, after, refs, relation: 'same-project', name });
  assert.equal(s.schema, 'rubik-sota.story-layers'); assert.match(s.frame.statement, /mismo encuadre y misma escala/);
  const room = s.chapters.find(c => c.id === 'room-' + roomId); assert.ok(room, 'capítulo de la estancia ampliada');
  const [b, a] = room.data;
  assert.equal(b.value, fichaArea(before.rooms.find(r => r.id === roomId).polygon), 'área antes = ficha independiente');
  assert.equal(a.value, fichaArea(after.rooms.find(r => r.id === roomId).polygon), 'área después = ficha independiente');
  assert.ok(a.value > b.value); assert.equal(a.unit, 'm²'); assert.equal(a.state, 'calculated');
  assert.deepEqual([a.revision.side, a.revision.fingerprint], ['after', refs.after.fingerprint], 'cada dato dice de qué revisión sale');
  assert.match(a.source.field, /polygon/); assert.deepEqual([a.anchor.kind, a.anchor.id, a.anchor.side], ['room', roomId, 'after']);
  const lay = s.chapters.find(c => c.id === 'layout'); assert.deepEqual(lay.ids.gone, [wallId]); assert.equal(lay.data.find(d => d.id === 'walls-gone').value, 1);
  assert.ok(lay.data.some(d => d.anchor && d.anchor.kind === 'wall' && d.anchor.id === wallId), 'el dato de distribución apunta al muro quitado');
  const anchored = s.chapters.flatMap(c => c.data).filter(d => d.anchor); assert.ok(anchored.length >= 2, '≥ 2 rótulos anclados');
  assert.doesNotMatch(JSON.stringify(s.chapters.map(c => [c.title, c.text])), CJK, 'sin chino en ES');
  assert.deepEqual(S.build({ before, after, refs, relation: 'same-project', name }), s, 'determinista');
});

test('dato ausente: una estancia nueva no tiene «antes» → se muestra AUSENTE, no 0', async () => {
  const { before, after } = pair(); const extra = Core.clone(after.rooms[0]); extra.id = 'rom_story-nueva'; extra.name = 'Despacho';
  extra.polygon = [{ x: 90000, y: 90000 }, { x: 93000, y: 90000 }, { x: 93000, y: 92500 }, { x: 90000, y: 92500 }]; after.rooms.push(extra);
  const refs = { before: { fingerprint: 'a'.repeat(64) }, after: { fingerprint: 'b'.repeat(64) } };
  const ch = S.build({ before, after, refs, relation: 'same-project', name }).chapters.find(c => c.id === 'room-rom_story-nueva');
  assert.ok(ch); assert.equal(ch.data[0].value, null); assert.equal(ch.data[0].state, 'absent'); assert.equal(ch.data[1].value, 7.5);
  const r = S.readiness(S.build({ before, after, refs, relation: 'same-project', name }), { current: { before: 'a'.repeat(64), after: 'b'.repeat(64) } });
  assert.ok(r.items.some(i => i.id === 'data.room-rom_story-nueva.area-before' && i.severity === 'WARNING'), 'lo ausente se avisa, no bloquea');
});

test('revisión profesional: ordenar y editar no cambia los datos; orden inválido rechazado', async () => {
  const { before, after } = pair(); const refs = { before: { fingerprint: 'a'.repeat(64) }, after: { fingerprint: 'b'.repeat(64) } };
  const s = S.build({ before, after, refs, relation: 'same-project', name }), rev = [...s.order].reverse();
  const e = S.edit(s, { order: rev, texts: { overview: 'Texto revisado por el estudio' } });
  assert.deepEqual(e.order, rev); assert.equal(S.textOf(e, e.chapters[0]), 'Texto revisado por el estudio'); assert.deepEqual(e.chapters, s.chapters, 'los datos no cambian');
  assert.deepEqual(s.order, rev.slice().reverse(), 'la historia original no se modifica');
  assert.throws(() => S.edit(s, { order: ['overview'] })); assert.throws(() => S.edit(s, { texts: { nope: 'x' } }));
});

test('preparación y obsolescencia: medio listo ≠ guardada ≠ vigente; si cambia el proyecto, la historia queda OBSOLETA', async () => {
  const { before, after } = pair(); const fb = await S.fingerprint(before, digest), fa = await S.fingerprint(after, digest);
  const s = S.build({ before, after, refs: { before: { fingerprint: fb }, after: { fingerprint: fa } }, relation: 'same-project', name });
  const media = Object.fromEntries(s.order.map(id => [id, { state: 'READY', revision: fa }]));
  assert.equal(S.readiness(s, { current: { before: fb, after: fa }, media }).state, 'INCOMPLETE', 'sin guardar no está lista');
  assert.equal(S.readiness(s, { current: { before: fb, after: fa }, media, saved: s }).state, 'READY');
  const wrongMedia = { ...media, overview: { state: 'READY', revision: 'c'.repeat(64) } };
  const r1 = S.readiness(s, { current: { before: fb, after: fa }, media: wrongMedia, saved: s });
  assert.equal(r1.state, 'INCOMPLETE'); assert.match(r1.items.find(i => i.id === 'media.overview').detail, /otra revisión/, 'una imagen que abre pero es de otra revisión no vale');
  const changed = Core.clone(after); changed.name = after.name + ' (editado)';
  const r2 = S.readiness(s, { current: { before: fb, after: await S.fingerprint(changed, digest) }, media, saved: s });
  assert.equal(r2.state, 'OBSOLETE'); assert.equal(r2.obsolete, true);
  const edited = S.edit(s, { texts: { overview: 'otro' } });
  assert.equal(S.readiness(edited, { current: { before: fb, after: fa }, media, saved: s }).state, 'INCOMPLETE', 'editar tras guardar exige guardar de nuevo');
});

test('manifiesto de exportación: referencias durables (entradas + huellas) y huella de cada imagen', async () => {
  const { before, after } = pair(); const refs = { before: { entryId: 'e1', fingerprint: 'a'.repeat(64) }, after: { entryId: 'e2', fingerprint: 'b'.repeat(64) } };
  const s = S.build({ before, after, refs, relation: 'same-project', name });
  const m = S.manifest(s, s.order.map(id => ({ chapterId: id, file: id + '.png', sha256: 'f'.repeat(64), bytes: 10 })));
  assert.equal(m.revisions.after.entryId, 'e2'); assert.equal(m.chapters.length, s.chapters.length);
  for (const c of m.chapters) { assert.ok(c.image.sha256); for (const d of c.data) assert.ok(d.source && d.revision.fingerprint && d.unit); }
});
