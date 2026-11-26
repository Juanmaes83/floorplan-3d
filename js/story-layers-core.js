/* RUBIK SOTA · StoryLayersV1 (Entrega Junior, §8) · núcleo puro, sin DOM ni red.
 *
 * Una «historia» explica al cliente QUÉ cambió entre dos revisiones guardadas y con QUÉ datos se demuestra. No es otro
 * comparador: se construye sobre FloorPlanRevisionCompare.compare (cambios por identificador estable, encuadre común =
 * misma «cámara» en planta para las dos revisiones). Cada dato lleva valor, unidad, fuente, revisión y estado; un dato que
 * falta se muestra AUSENTE, nunca se inventa.
 *
 * Preparación (adaptado en limpio de escaparates-pro/studio/readiness.js @6e6d6ca5): tres preguntas separadas
 *   MEDIO LISTO     — cada imagen se generó y se puede abrir;
 *   HISTORIA GUARDADA — lo que se entrega es lo que el profesional revisó (orden y textos);
 *   HISTORIA VIGENTE  — las dos revisiones guardadas siguen siendo las mismas (huella SHA-256 del proyecto).
 * Una imagen que se abre pero pertenece a otra revisión NO está lista: si cambia el proyecto, la historia queda OBSOLETA
 * y pide revisión antes de entregarse como vigente.
 */
(function (root, factory) {
  const node = typeof module === 'object' && module.exports;
  const api = factory(node ? require('./revision-compare-core.js') : root.FloorPlanRevisionCompare);
  if (node) module.exports = api; else root.FloorPlanStoryLayers = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (Compare) {
  'use strict';
  if (!Compare) throw Error('FloorPlanStoryLayers requiere FloorPlanRevisionCompare.');
  const SCHEMA = 'rubik-sota.story-layers', VERSION = '1.0.0';
  const SEVERITY = Object.freeze({ BLOCKING: 'BLOCKING', WARNING: 'WARNING', SUGGESTION: 'SUGGESTION' });
  const STATE = Object.freeze({ INCOMPLETE: 'INCOMPLETE', OBSOLETE: 'OBSOLETE', READY: 'READY' });
  const enc = new TextEncoder();
  function sortKeys(x) { if (Array.isArray(x)) return x.map(sortKeys); if (x && typeof x === 'object') return Object.fromEntries(Object.keys(x).sort().map(k => [k, sortKeys(x[k])])); return x; }
  const canonical = x => JSON.stringify(sortKeys(x));
  /** Huella de una revisión: SHA-256 del proyecto canónico (lo que se guardó). `digest(bytes) → Promise<hex>`. */
  const fingerprint = (project, digest) => digest(enc.encode(canonical(project)));
  const r2 = x => Math.round(x * 100) / 100;
  const centroid = poly => { let a = 0, cx = 0, cy = 0; for (let i = 0; i < poly.length; i++) { const p = poly[i], q = poly[(i + 1) % poly.length], f = p.x * q.y - q.x * p.y; a += f; cx += (p.x + q.x) * f; cy += (p.y + q.y) * f; }
    return a ? { x: Math.round(cx / (3 * a)), y: Math.round(cy / (3 * a)) } : { x: poly[0].x, y: poly[0].y }; };
  const T = {
    es: { finishes: 'Acabados', floor: 'Suelo de', openings: 'Puertas y ventanas', openingsAdded: 'Huecos nuevos', openingsGone: 'Huecos quitados', textFinish: n => `Cambia el acabado del suelo de «${n}».`, textOpenings: (add, del) => `${add} hueco(s) nuevo(s) y ${del} quitado(s).`, overview: 'Qué cambia', area: 'Superficie de', layout: 'Distribución', netArea: 'Superficie útil total', rooms: 'Estancias', walls: 'Muros añadidos o quitados',
      absent: 'Ausente', calc: 'Calculado del proyecto', same: 'Sin cambios entre las dos revisiones', textOverview: (b, a) => `Comparamos «${b}» con «${a}» con la misma planta, el mismo encuadre y la misma escala.`,
      textArea: n => `La estancia «${n}» cambia de superficie.`, textLayout: (add, del) => `Cambia la distribución: ${add} muro(s) nuevo(s) y ${del} quitado(s) o a demoler.` },
    en: { finishes: 'Finishes', floor: 'Floor of', openings: 'Doors and windows', openingsAdded: 'New openings', openingsGone: 'Removed openings', textFinish: n => `The floor finish of «${n}» changes.`, textOpenings: (add, del) => `${add} new opening(s) and ${del} removed.`, overview: 'What changes', area: 'Area of', layout: 'Layout', netArea: 'Total usable area', rooms: 'Rooms', walls: 'Walls added or removed',
      absent: 'Absent', calc: 'Calculated from the project', same: 'No changes between the two revisions', textOverview: (b, a) => `We compare «${b}» with «${a}» on the same plan, framing and scale.`,
      textArea: n => `The room «${n}» changes its area.`, textLayout: (add, del) => `The layout changes: ${add} new wall(s) and ${del} removed or to be demolished.` },
    zh: { finishes: '饰面', floor: '地面：', openings: '门窗', openingsAdded: '新增洞口', openingsGone: '移除的洞口', textFinish: n => `「${n}」的地面饰面发生变化。`, textOpenings: (add, del) => `新增 ${add} 个洞口，移除 ${del} 个。`, overview: '变化概览', area: '面积：', layout: '布局', netArea: '总使用面积', rooms: '房间', walls: '新增或移除的墙体',
      absent: '缺失', calc: '根据项目计算', same: '两个版本之间没有变化', textOverview: (b, a) => `在相同平面、相同取景和相同比例下比较「${b}」与「${a}」。`,
      textArea: n => `房间「${n}」的面积发生变化。`, textLayout: (add, del) => `布局变化：新增 ${add} 面墙，移除或拆除 ${del} 面墙。` },
  };

  /** Construye la historia. refs: {before:{entryId, fingerprint}, after:{entryId, fingerprint}}; name(room) → nombre VISIBLE
   *  (embudo de RUBIK: nunca el nombre guardado en bruto). Determinista para las mismas entradas. */
  function build({ before, after, refs, relation = 'library-variant', name = r => r.id, material = m => m.id, lang = 'es', labels = {} }) {
    if (!before || !after || !refs?.before?.fingerprint || !refs?.after?.fingerprint) throw Error('build: before, after and both revision fingerprints are required');
    const t = T[lang] || T.es, cmp = Compare.compare(before, after, { relation, beforeLabel: labels.before || 'Antes', afterLabel: labels.after || 'Después' });
    const rev = side => ({ side, entryId: refs[side].entryId ?? null, fingerprint: refs[side].fingerprint, updatedAt: (side === 'before' ? before : after).updatedAt ?? null });
    const datum = (id, label, value, unit, field, side, anchor = null) => ({ id, label, value: value ?? null, unit, state: value === null || value === undefined ? 'absent' : 'calculated',
      source: { module: 'FloorPlanRevisionCompare', schema: cmp.schema + '@' + cmp.version, field }, revision: rev(side), anchor });
    const chapters = [];
    const m = cmp.metrics;
    chapters.push({ id: 'overview', kind: 'overview', title: t.overview, text: cmp.identical ? t.same : t.textOverview(labels.before || 'Antes', labels.after || 'Después'),
      data: [datum('net-before', t.netArea, m.before.netAreaM2, 'm²', 'metrics.before.netAreaM2', 'before'), datum('net-after', t.netArea, m.after.netAreaM2, 'm²', 'metrics.after.netAreaM2', 'after'),
        datum('rooms-before', t.rooms, m.before.rooms, 'u', 'metrics.before.rooms', 'before'), datum('rooms-after', t.rooms, m.after.rooms, 'u', 'metrics.after.rooms', 'after')] });
    // Estancias cuya superficie cambia (modificadas en su polígono, añadidas o quitadas): las tres de mayor cambio.
    const B = new Map(before.rooms.map(r => [r.id, r])), A = new Map(after.rooms.map(r => [r.id, r]));
    const areaOf = r => r && Array.isArray(r.polygon) && r.polygon.length >= 3 ? r2(Compare.area(r.polygon)) : null;
    const rooms = cmp.changes.filter(c => c.entity === 'room' && (c.change !== 'modified' || c.fields.some(f => f.field === 'polygon')))
      .map(c => { const b = B.get(c.entityId), a = A.get(c.entityId); return { c, b, a, before: areaOf(b), after: areaOf(a) }; })
      .sort((x, y) => Math.abs((y.after ?? 0) - (y.before ?? 0)) - Math.abs((x.after ?? 0) - (x.before ?? 0)) || x.c.entityId.localeCompare(y.c.entityId)).slice(0, 3);
    for (const x of rooms) {
      const shown = x.a || x.b, side = x.a ? 'after' : 'before', anchor = { side, kind: 'room', id: x.c.entityId, ...centroid(shown.polygon) };
      chapters.push({ id: 'room-' + x.c.entityId, kind: 'room-area', title: `${t.area} ${name(shown)}`, text: t.textArea(name(shown)),
        data: [datum('area-before', t.area + ' ' + name(shown), x.before, 'm²', `rooms[${x.c.entityId}].polygon → área`, 'before', x.b ? { side: 'before', kind: 'room', id: x.c.entityId, ...centroid(x.b.polygon) } : null),
          datum('area-after', t.area + ' ' + name(shown), x.after, 'm²', `rooms[${x.c.entityId}].polygon → área`, 'after', x.a ? anchor : null)] });
    }
    // Distribución: muros nuevos, quitados o que pasan a «a demoler».
    const wallsAdded = cmp.changes.filter(c => c.entity === 'wall' && c.change === 'added').map(c => c.entityId);
    const wallsGone = cmp.changes.filter(c => c.entity === 'wall' && (c.change === 'removed' || (c.change === 'modified' && c.fields.some(f => f.field === 'status' && f.after === 'demolished')))).map(c => c.entityId);
    if (wallsAdded.length || wallsGone.length) {
      const wb = new Map(before.walls.map(w => [w.id, w])), wa = new Map(after.walls.map(w => [w.id, w]));
      const mid = w => ({ x: Math.round((w.start.x + w.end.x) / 2), y: Math.round((w.start.y + w.end.y) / 2) });
      // Cada dato apunta a SU muro: el nuevo en «después»; el quitado en «antes» (o en «después» si queda «a demoler»).
      const addA = wallsAdded[0] ? { side: 'after', kind: 'wall', id: wallsAdded[0], ...mid(wa.get(wallsAdded[0])) } : null;
      const goneA = wallsGone[0] ? (wa.has(wallsGone[0]) ? { side: 'after', kind: 'wall', id: wallsGone[0], ...mid(wa.get(wallsGone[0])) } : { side: 'before', kind: 'wall', id: wallsGone[0], ...mid(wb.get(wallsGone[0])) }) : null;
      chapters.push({ id: 'layout', kind: 'layout', title: t.layout, text: t.textLayout(wallsAdded.length, wallsGone.length),
        data: [datum('walls-added', t.walls, wallsAdded.length, 'u', 'changes[entity=wall, change=added]', 'after', addA),
          datum('walls-gone', t.walls, wallsGone.length, 'u', 'changes[entity=wall, change=removed|demolished]', goneA ? goneA.side : 'before', goneA)],
        ids: { added: wallsAdded, gone: wallsGone } });
    }
    // Acabados de suelo DECLARADOS por el proyecto (nunca un color por defecto): material antes → después, anclado a la estancia.
    const finish = cmp.materials.filter(x => x.scope === 'room' && x.before && x.after && x.before.id !== x.after.id).slice(0, 2);
    for (const f of finish) {
      const r = A.get(f.entityId) || B.get(f.entityId), an = r ? { side: A.get(f.entityId) ? 'after' : 'before', kind: 'room', id: f.entityId, ...centroid(r.polygon) } : null;
      const mname = v => v ? (v.missing ? null : material({ id: v.id, name: v.name })) : null;
      chapters.push({ id: 'finish-' + f.entityId, kind: 'finish', title: `${t.floor} ${name(r)}`, text: t.textFinish(name(r)),
        data: [datum('floor-before', t.floor + ' ' + name(r), mname(f.before), 'acabado', `rooms[${f.entityId}].floorMaterialId`, 'before', null),
          datum('floor-after', t.floor + ' ' + name(r), mname(f.after), 'acabado', `rooms[${f.entityId}].floorMaterialId`, 'after', an)] });
    }
    // Puertas y ventanas: nuevas o quitadas, ancladas a su posición en el muro.
    const opAt = (p, o) => { const w = (p.walls || []).find(x => x.id === o.wallId); if (!w) return null; const L = Math.hypot(w.end.x - w.start.x, w.end.y - w.start.y) || 1, k = (o.offsetMm + o.widthMm / 2) / L;
      return { x: Math.round(w.start.x + (w.end.x - w.start.x) * k), y: Math.round(w.start.y + (w.end.y - w.start.y) * k) }; };
    const opAdded = cmp.changes.filter(c => c.entity === 'opening' && c.change === 'added').map(c => after.openings.find(o => o.id === c.entityId));
    const opGone = cmp.changes.filter(c => c.entity === 'opening' && c.change === 'removed').map(c => before.openings.find(o => o.id === c.entityId));
    if (opAdded.length || opGone.length) {
      const aA = opAdded[0] && opAt(after, opAdded[0]), gA = opGone[0] && opAt(before, opGone[0]);
      chapters.push({ id: 'openings', kind: 'openings', title: t.openings, text: t.textOpenings(opAdded.length, opGone.length),
        data: [datum('openings-added', t.openingsAdded, opAdded.length, 'u', 'changes[entity=opening, change=added]', 'after', aA ? { side: 'after', kind: 'opening', id: opAdded[0].id, ...aA } : null),
          datum('openings-gone', t.openingsGone, opGone.length, 'u', 'changes[entity=opening, change=removed]', 'before', gA ? { side: 'before', kind: 'opening', id: opGone[0].id, ...gA } : null)] });
    }
    return { schema: SCHEMA, version: VERSION, lang, relation: cmp.relation, revisions: { before: rev('before'), after: rev('after') },
      frame: { viewBox: cmp.perspective.viewBox, statement: cmp.perspective.statement }, limits: cmp.limits, order: chapters.map(c => c.id), chapters, edits: {} };
  }

  /** El profesional ordena capítulos y revisa textos. Devuelve una historia NUEVA (la anterior no cambia). */
  function edit(story, { order, texts } = {}) {
    const ids = story.chapters.map(c => c.id), next = JSON.parse(JSON.stringify(story));
    if (order) { if (order.length !== ids.length || !ids.every(id => order.includes(id))) throw Error('edit: order must be a permutation of the chapters'); next.order = [...order]; }
    if (texts) for (const [id, s] of Object.entries(texts)) { if (!ids.includes(id)) throw Error('edit: unknown chapter ' + id); next.edits[id] = String(s).slice(0, 600); }
    return next;
  }
  const textOf = (story, ch) => story.edits?.[ch.id] ?? ch.text;
  const ordered = story => story.order.map(id => story.chapters.find(c => c.id === id));

  /** Preparación: MEDIO LISTO / HISTORIA GUARDADA / HISTORIA VIGENTE. current: huellas actuales {before, after} de las dos
   *  revisiones; media: {chapterId: {state:'READY'|'ERROR'|'LOADING', revision}}; saved: historia guardada (o null). */
  function readiness(story, { current = {}, media = {}, saved = null } = {}) {
    const items = [], need = (id, label, ok, severity = SEVERITY.BLOCKING, detail = '') => items.push({ id, label, ok: !!ok, severity, detail });
    for (const side of ['before', 'after']) need('revision.' + side, side === 'before' ? 'La revisión «antes» sigue siendo la guardada' : 'La revisión «después» sigue siendo la guardada',
      current[side] && current[side] === story.revisions[side].fingerprint, SEVERITY.BLOCKING, current[side] ? '' : 'revisión no disponible');
    for (const ch of ordered(story)) {
      const md = media[ch.id];
      need('media.' + ch.id, `Imagen de «${ch.title}»`, md && md.state === 'READY' && md.revision === story.revisions.after.fingerprint, SEVERITY.BLOCKING,
        !md ? 'sin generar' : md.state !== 'READY' ? (md.state === 'ERROR' ? 'no se pudo generar' : 'generándose') : md.revision !== story.revisions.after.fingerprint ? 'pertenece a otra revisión' : '');
      for (const d of ch.data) if (d.state === 'absent') need('data.' + ch.id + '.' + d.id, `Dato ausente: ${d.label}`, false, SEVERITY.WARNING, 'se muestra como ausente');
    }
    need('saved', 'Lo que se entrega es lo que el profesional revisó', saved && canonical({ o: saved.order, e: saved.edits, r: saved.revisions }) === canonical({ o: story.order, e: story.edits, r: story.revisions }), SEVERITY.BLOCKING);
    const obsolete = items.some(i => i.id.startsWith('revision.') && !i.ok);
    const state = obsolete ? STATE.OBSOLETE : items.some(i => i.severity === SEVERITY.BLOCKING && !i.ok) ? STATE.INCOMPLETE : STATE.READY;
    return { state, obsolete, items, blocking: items.filter(i => i.severity === SEVERITY.BLOCKING && !i.ok).length };
  }

  /** Manifiesto de la exportación (referencias durables: entradas de biblioteca + huellas + huella de cada imagen). */
  function manifest(story, images) {
    return { schema: SCHEMA + '.export', version: VERSION, revisions: story.revisions, relation: story.relation, frame: story.frame, limits: story.limits,
      chapters: ordered(story).map((ch, i) => ({ n: i + 1, id: ch.id, kind: ch.kind, title: ch.title, text: textOf(story, ch),
        data: ch.data.map(d => ({ id: d.id, label: d.label, value: d.value, unit: d.unit, state: d.state, source: d.source, revision: { side: d.revision.side, fingerprint: d.revision.fingerprint } })),
        image: images.find(x => x.chapterId === ch.id) || null })) };
  }
  return Object.freeze({ SCHEMA, VERSION, SEVERITY, STATE, canonical, fingerprint, build, edit, readiness, manifest, ordered, textOf });
});
