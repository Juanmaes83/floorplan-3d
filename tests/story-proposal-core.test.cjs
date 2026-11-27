// StoryLayersV1 · plantilla comercial (§7.3): caso de control Baldosa 800 → Moqueta, lenguaje natural sin campos ni huellas,
// notas internas fuera de todo archivo de cliente, coste trazable o ausente, identidad elegida y ajuste de texto sin truncar.
const { test } = require('node:test'), assert = require('node:assert/strict'), { createHash } = require('node:crypto');
const S = require('../js/story-layers-core.js'), P = require('../js/story-proposal-core.js'), Core = require('../js/project-core.js'), Reference = require('../js/reference-project.js');
const digest = async b => createHash('sha256').update(b).digest('hex');
const NAMES = { rom_living: 'Salón' }, MATS = { mat_tile800: 'Baldosa 800', mat_carpet: 'Moqueta' };
const name = r => NAMES[r.id] || 'Estancia ' + r.id.slice(-3), material = m => MATS[m.id] || m.id;

async function control() {
  const before = Core.clone(Reference); before.id = 'prj_sl-ctrl'; before.updatedAt = '2026-11-20T10:00:00.000Z';
  const after = Core.clone(before); after.updatedAt = '2026-11-26T10:00:00.000Z'; after.rooms.find(r => r.id === 'rom_living').floorMaterialId = 'mat_carpet';
  const refs = { before: { entryId: 'e1', fingerprint: await S.fingerprint(before, digest) }, after: { entryId: 'e2', fingerprint: await S.fingerprint(after, digest) } };
  return { story: S.build({ before, after, refs, name, material }), refs };
}
const TECH = /metrics\.|rooms\[|changes\[|floorMaterialId|FloorPlanRevisionCompare|rom_|mat_/;

test('caso de control Baldosa 800 → Moqueta: qué cambia y qué se conserva, en lenguaje natural', async () => {
  const { story, refs } = await control(), f = P.facts(story, 'es');
  assert.deepEqual(f.changes, ['Suelo de Salón: Baldosa 800 → Moqueta.']);
  assert.ok(f.kept.some(k => /superficie útil se conserva/.test(k)) && f.kept.some(k => /Se conservan las \d+ estancias/.test(k)));
  assert.ok(f.kept.includes('La distribución se conserva: no se añade ni se quita ningún muro.') && f.kept.includes('Puertas y ventanas se conservan.'));
  const doc = P.document({ story, proposal: P.normalize({}), identity: P.identity(null), facts: f, cost: P.cost(null), projectName: 'Vivienda' });
  assert.match(doc.summary, /^Proponemos: Suelo de Salón: Baldosa 800 → Moqueta\./, 'resumen por defecto desde los hechos');
  // Lo que se MUESTRA (las claves estructurales id/hero nunca se dibujan; el manifiesto del cliente se comprueba entero).
  const txt = JSON.stringify(doc, (k, v) => (k === 'id' || k === 'hero' ? undefined : v));
  assert.doesNotMatch(txt, TECH, 'sin identificadores ni rutas de campos'); assert.ok(!txt.includes(refs.after.fingerprint.slice(0, 8)), 'sin huellas de revisión');
  assert.deepEqual(doc.chapters.map(c => c.id), ['finish-rom_living']); assert.match(doc.chapters[0].data[1].text, /^Propuesta · Suelo de Salón: Moqueta$/);
  assert.deepEqual(doc.sections.filter(s => s.pending === true).map(s => s.key), ['why', 'how', 'decision'], 'lo que aporta el profesional, pendiente y dicho');
  assert.equal(doc.sections.find(s => s.key === 'cost').status, 'absent');
});

test('notas: las internas no entran en el documento ni en el manifiesto del cliente; las visibles van a su capítulo o generales', async () => {
  const { story } = await control();
  const pr = P.normalize({ notes: [{ text: 'INTERNA margen 18 % no contar', visibility: 'internal' }, { text: 'Moqueta de lana, color arena', visibility: 'client', anchor: { kind: 'chapter', id: 'finish-rom_living' } },
    { text: 'Visita de obra el martes', visibility: 'client' }, { text: 'sin visibilidad elegida' }] }, { chapterIds: story.order });
  assert.equal(pr.notes.find(n => n.text === 'sin visibilidad elegida').visibility, 'internal', 'sin elección explícita, interna');
  const doc = P.document({ story, proposal: pr, identity: P.identity(null), facts: P.facts(story), cost: P.cost(null) });
  const man = P.clientManifest(doc, [{ file: 'propuesta/01.png', sha256: 'f'.repeat(64), bytes: 1, content: ['x'] }]);
  for (const o of [doc, man]) { const s = JSON.stringify(o); assert.ok(!s.includes('INTERNA') && !s.includes('sin visibilidad elegida'), 'ninguna nota interna'); }
  assert.deepEqual(doc.chapters[0].notes, ['Moqueta de lana, color arena']); assert.deepEqual(doc.generalNotes, ['Visita de obra el martes']);
  assert.doesNotMatch(JSON.stringify(man), TECH);
  // Una nota vinculada al resumen (sin página propia) no se pierde: pasa a las generales.
  const pr2 = P.normalize({ notes: [{ text: 'Sobre el resumen', visibility: 'client', anchor: { kind: 'chapter', id: 'overview' } }] }, { chapterIds: story.order });
  assert.deepEqual(P.document({ story, proposal: pr2, identity: P.identity(null), facts: P.facts(story), cost: P.cost(null) }).generalNotes, ['Sobre el resumen']);
});

test('coste: completo con importes trazables; parcial con lo pendiente; sin presupuesto o incoherente, ausente', () => {
  const side = (net, gross) => ({ net, gross, taxRatePercent: 21, unreviewed: [] });
  const full = P.cost({ before: side(1000, 1210), after: side(1461.54, 1768.46), totals: { status: 'complete', net: { delta: 461.54 } } });
  assert.equal(full.status, 'complete'); assert.deepEqual(full.lines, ['Presupuesto de la propuesta: 1.461,54 € sin IVA · 1.768,46 € con IVA (21 %).', 'Presupuesto del estado actual: 1.000,00 € sin IVA.', 'Diferencia frente al estado actual: +461,54 € sin IVA.']);
  const part = P.cost({ before: side(1000, 1210), after: side(900, 1089), totals: { status: 'partial', comparable: { items: 3, netDelta: -50 }, excluded: [{}, {}] } });
  assert.equal(part.status, 'partial'); assert.match(part.lines[1], /No es la diferencia total/); assert.deepEqual(part.pending, ['2 partida(s) pendientes de valorar.']);
  for (const c of [null, { totals: { status: 'none' } }, { totals: { status: 'incoherent' } }]) { const r = P.cost(c); assert.equal(r.status, 'absent'); assert.equal(r.lines.length, 0); assert.ok(r.pending.length >= 1); }
});

test('identidad: de Mi estudio, solo los campos elegidos; sin identidad, crédito genérico', () => {
  const snap = { profile: { id: 'brd_abc123', name: 'Estudio Norte', person: 'Ana Ruiz', phone: '+34 600 000 000', email: 'ana@norte.es', web: 'https://norte.es', logo: null }, takenAt: 'x' };
  const id = P.identity(snap, { fields: ['person', 'web'] });
  assert.equal(id.contact, 'Ana Ruiz · norte.es'); assert.ok(!id.contact.includes('600')); assert.equal(id.credit, 'Preparado por Estudio Norte con RUBIK SOTA');
  const none = P.identity(null); assert.equal(none.present, false); assert.equal(none.credit, 'Preparado con RUBIK SOTA');
});

test('ajuste de texto y paso de página: nada se trunca, ninguna línea ni página se desborda', () => {
  const measure = s => s.length * 10, long = ('La moqueta de lana mejora el confort acústico del salón y la sensación térmica en invierno. ').repeat(40) + 'Palabraextraordinariamentelargaquenocabeenunalinea'.repeat(3);
  const lines = P.wrap(long, 400, measure);
  assert.ok(lines.every(l => measure(l) <= 400), 'cada línea cabe'); assert.equal(lines.join(' ').replace(/\s+/g, ''), long.replace(/\s+/g, ''), 'el texto completo, sin cortes');
  const pages = P.flow([{ h: 300 }, { h: 1, lines, lh: 30, pad: 10 }, { h: 500 }], 1000);
  assert.ok(pages.length > 2); for (const p of pages) assert.ok(p.reduce((m, it) => Math.max(m, it.y + it.h), 0) <= 1000, 'página dentro del alto');
  assert.equal(pages.flat().filter(it => it.lines).reduce((n, it) => n + it.lines.length, 0), lines.length, 'todas las líneas colocadas');
  assert.ok(pages.flat().some(it => it.cont), 'el texto continúa en la página siguiente');
  // Un título no queda solo al pie de página: pasa a la siguiente con su contenido.
  const kp = P.flow([{ h: 900 }, { h: 60, keep: true }, { h: 1, lines: ['a', 'b', 'c'], lh: 30 }], 1000);
  assert.equal(kp.length, 2); assert.equal(kp[1][0].keep, true, 'el título abre la página siguiente');
});

test('§7.2 · ningún cambio guardado se calla: quitar un mueble es un cambio con su capítulo; lo no detallado se cuenta como «otros ajustes»', async () => {
  const before = Core.clone(Reference); before.id = 'prj_sl-mueble';
  const after = Core.clone(before); const gone = after.objects.shift(); after.walls[0].thicknessMm = (after.walls[0].thicknessMm || 100) + 50;
  const refs = { before: { entryId: 'e1', fingerprint: await S.fingerprint(before, digest) }, after: { entryId: 'e2', fingerprint: await S.fingerprint(after, digest) } };
  const story = S.build({ before, after, refs, name, material }), f = P.facts(story, 'es');
  assert.deepEqual(story.order, ['overview', 'furniture', 'other']);
  const fur = story.chapters.find(c => c.id === 'furniture'), d = fur.data.find(x => x.id === 'objects-gone');
  assert.equal(d.value, 1); assert.deepEqual([d.anchor.kind, d.anchor.id, d.anchor.side], ['object', gone.id, 'before'], 'anclado al mueble quitado, en «antes»');
  assert.deepEqual(f.changes, ['Mobiliario: 0 mueble(s) nuevo(s), 1 quitado(s) y 0 movido(s) o cambiado(s).', 'Otros ajustes en los datos del proyecto: 1.']);
  const doc = P.document({ story, proposal: P.normalize({}), identity: P.identity(null), facts: f, cost: P.cost(null) });
  assert.doesNotMatch(doc.summary, /No hay cambios/, 'el resumen nunca dice «sin cambios» si los hay'); assert.doesNotMatch(JSON.stringify(doc, (k, v) => (k === 'id' || k === 'hero' ? undefined : v)), TECH);
  // Idénticas: sin capítulos de cambio.
  const same = S.build({ before, after: Core.clone(before), refs: { before: refs.before, after: refs.before } });
  assert.deepEqual(same.order, ['overview']); assert.deepEqual(P.facts(same).changes, []);
});
