/* SCULPT-R02-A normalized · CANDIDATE persistence for confirmed ceiling items and vertical references. NOT canonical,
 * NOT loaded by index.html: the owner must choose the data model first (docs/technical/sculpt-r02a-normalized-2026-11-12.md §B.4).
 *   project.extensions["x-r02a-ceiling"] = { version: 1,
 *     verticalReferences: [ { scope: 'project' | 'room', roomId?, clearHeightMm, reference: 'finished-floor'|'level-floor', source } ],
 *     items: [ { id, type, roomId, position, rotationDeg, size, sizeSource, dropMm, curtainLengthMm, review: 'human-confirmed', confirmedAt } ] }
 * Valid today for every 1.x reader (patternProperties ^x-…), strict building levels included (no key looks multi-level).
 * Nothing is written without an explicit human confirmation, and a confirmation never trusts a stored evaluation: the
 * item is RE-EVALUATED through RubikCeilingSession/RubikCeilingLayoutEvidence against the project's stored references
 * and the items already confirmed; only 'candidate-reviewable' is accepted. Pure and atomic. */
(function (root) {
  'use strict';
  const node = typeof module === 'object' && typeof require === 'function';
  const S = node ? require('./r02a-ceiling-session.js') : root.RubikCeilingSession;
  const Core = node ? require('./project-core.js') : root.FloorPlanCore;
  const KEY = 'x-r02a-ceiling', VERSION = 1;
  const isObj = v => v !== null && typeof v === 'object' && !Array.isArray(v);
  const isInt = Number.isInteger;
  const clone = v => structuredClone(v);
  const ID = /^cei_[A-Za-z0-9][A-Za-z0-9_-]{2,63}$/;
  const issue = (code, message, path) => ({ code, message, ...(path ? { path } : {}) });
  const REF_KEYS = ['scope', 'roomId', 'clearHeightMm', 'reference', 'source'], ITEM_KEYS = ['id', 'type', 'roomId', 'position', 'rotationDeg', 'size', 'sizeSource', 'dropMm', 'curtainLengthMm', 'review', 'confirmedAt'];

  function extension(project) {
    const e = project?.extensions?.[KEY];
    if (e === undefined) return { status: 'absent', verticalReferences: [], items: [] };
    if (!isObj(e) || !isInt(e.version)) return { status: 'invalid', verticalReferences: [], items: [], issues: [issue('shape', `${KEY} sin versión entera`)] };
    if (e.version > VERSION) return { status: 'future', version: e.version, verticalReferences: [], items: [] };
    if (e.version !== VERSION || !Array.isArray(e.verticalReferences) || !Array.isArray(e.items)) return { status: 'invalid', verticalReferences: [], items: [], issues: [issue('shape', `${KEY}: versión o listas no válidas`)] };
    return { status: 'present', verticalReferences: e.verticalReferences, items: e.items };
  }
  function validateExtension(project) {
    const ext = extension(project), out = [...(ext.issues || [])];
    if (ext.status !== 'present') return { ok: !out.length, status: ext.status, issues: out };
    const rooms = new Set((project.rooms || []).map(r => r.id)), ids = new Set([project.id, ...['walls', 'openings', 'rooms', 'materials', 'objects', 'measurements', 'sourceImages'].flatMap(k => (project[k] || []).map(x => x.id))]);
    const scopes = new Set();
    ext.verticalReferences.forEach((r, i) => {
      const p = `/extensions/${KEY}/verticalReferences/${i}`;
      if (!isObj(r)) return out.push(issue('shape', 'referencia no válida', p));
      for (const k of Object.keys(r)) if (!REF_KEYS.includes(k)) out.push(issue('unknown-field', k, `${p}/${k}`));
      if (r.scope !== 'project' && r.scope !== 'room') out.push(issue('scope', 'scope project|room', p));
      if (r.scope === 'room' && !rooms.has(r.roomId)) out.push(issue('orphan', `estancia inexistente ${r.roomId}`, p));
      if (r.scope === 'project' && r.roomId !== undefined) out.push(issue('scope', 'una referencia de proyecto no lleva roomId', p));
      if (!isInt(r.clearHeightMm) || r.clearHeightMm < 1 || r.clearHeightMm > 100000) out.push(issue('number', 'clearHeightMm entero', p));
      if (r.reference !== 'finished-floor' && r.reference !== 'level-floor') out.push(issue('reference', 'reference no válida', p));
      if (typeof r.source !== 'string' || !r.source.trim() || r.source.length > 200) out.push(issue('source', 'la referencia debe indicar su fuente', p));
      const key = r.scope + ':' + (r.roomId || ''); if (scopes.has(key)) out.push(issue('duplicate', `dos referencias para ${key}`, p)); scopes.add(key);
    });
    const seen = new Set();
    ext.items.forEach((it, i) => {
      const p = `/extensions/${KEY}/items/${i}`;
      if (!isObj(it)) return out.push(issue('shape', 'elemento no válido', p));
      for (const k of Object.keys(it)) if (!ITEM_KEYS.includes(k)) out.push(issue('unknown-field', k, `${p}/${k}`));
      if (typeof it.id !== 'string' || !ID.test(it.id)) out.push(issue('id', 'id cei_…', p));
      else { if (seen.has(it.id) || ids.has(it.id)) out.push(issue('duplicate', `id repetido ${it.id}`, p)); seen.add(it.id); }
      if (!S.CATALOG[it.type]) out.push(issue('type', `tipo desconocido ${it.type}`, p));
      if (!rooms.has(it.roomId)) out.push(issue('orphan', `estancia inexistente ${it.roomId}`, p));
      if (!isObj(it.position) || !isInt(it.position.x) || !isInt(it.position.y)) out.push(issue('number', 'posición en mm enteros', p));
      if (!isInt(it.rotationDeg) || it.rotationDeg < 0 || it.rotationDeg > 359) out.push(issue('number', 'rotationDeg 0–359', p));
      if (!isObj(it.size) || !['widthMm', 'depthMm', 'heightMm'].every(k => isInt(it.size[k]) && it.size[k] > 0)) out.push(issue('number', 'tamaño en mm enteros', p));
      if (!isInt(it.dropMm) || it.dropMm < 0) out.push(issue('number', 'dropMm entero ≥ 0 (dato confirmado)', p));
      if (it.curtainLengthMm !== null && !isInt(it.curtainLengthMm)) out.push(issue('number', 'curtainLengthMm entero o null', p));
      if (it.review !== 'human-confirmed') out.push(issue('review', 'solo elementos confirmados por una persona', p));
      if (typeof it.confirmedAt !== 'string' || !Number.isFinite(Date.parse(it.confirmedAt))) out.push(issue('date', 'confirmedAt ISO', p));
    });
    return { ok: !out.length, status: 'present', issues: out };
  }
  // The reference that applies to a room: its own, else the project's, else none (never a default).
  function verticalFor(project, roomId) {
    const ext = extension(project); if (ext.status !== 'present') return null;
    const r = ext.verticalReferences.find(v => v.scope === 'room' && v.roomId === roomId) || ext.verticalReferences.find(v => v.scope === 'project');
    return r ? { clearHeightMm: r.clearHeightMm, reference: r.reference, source: r.source } : null;
  }
  const refuse = issues => ({ ok: false, issues });
  function withExt(project, refs, items) {
    const next = clone(project); if (!isObj(next.extensions)) next.extensions = {};
    if (refs.length || items.length) next.extensions[KEY] = { version: VERSION, verticalReferences: refs, items }; else { delete next.extensions[KEY]; if (!Object.keys(next.extensions).length) delete next.extensions; }
    const rep = validateExtension(next); if (!rep.ok) return refuse(rep.issues);
    try { Core.validate(next); } catch (e) { return refuse([issue('project', e.message)]); }
    return { ok: true, project: next };
  }
  function writable(project) { const ext = extension(project); if (ext.status === 'future') return refuse([issue('future', `${KEY} versión ${ext.version}: solo lectura`)]); if (ext.status === 'invalid') return refuse(ext.issues); const rep = validateExtension(project); return rep.ok ? null : refuse(rep.issues); }
  function setVerticalReference(project, ref) {
    const blocked = writable(project); if (blocked) return blocked;
    const ext = extension(project), r = { scope: ref.scope, ...(ref.scope === 'room' ? { roomId: ref.roomId } : {}), clearHeightMm: ref.clearHeightMm, reference: ref.reference, source: ref.source };
    const refs = ext.verticalReferences.filter(v => !(v.scope === r.scope && (v.roomId || '') === (r.roomId || ''))).concat([r]);
    return withExt(project, refs, ext.items);
  }
  /* Confirms ONE item after a human said so. Re-evaluated here, with the stored references and the confirmed items. */
  function confirmItem(project, request, { confirm = false, confirmedAt = new Date().toISOString() } = {}) {
    if (confirm !== true) return refuse([issue('confirmation-required', 'Hace falta la confirmación expresa de una persona.')]);
    const blocked = writable(project); if (blocked) return blocked;
    const ext = extension(project);
    if (!request || typeof request.id !== 'string' || !ID.test(request.id)) return refuse([issue('id', 'id cei_…')]);
    const accepted = ext.items.map(it => ({ id: it.id, type: it.type, position: it.position, rotationDeg: it.rotationDeg, size: it.size, dropMm: it.dropMm, ...(it.curtainLengthMm !== null ? { curtainLengthMm: it.curtainLengthMm } : {}) }));
    const probe = S.evaluate({ project, request, accepted });
    if (!probe.ok) return refuse([issue('request', probe.explanation.join(' '))]);
    const ceiling = verticalFor(project, probe.proposal.roomId);
    const ev = S.evaluate({ project, ceiling, request, accepted });
    if (!ev.ok) return refuse([issue('request', ev.explanation.join(' '))]);
    if (ev.state !== 'candidate-reviewable' || ev.diff.relocated) return refuse([issue('not-reviewable', ev.explanation.join(' '))]);
    const p = ev.proposal;
    if (!isInt(p.size.widthMm) || !isInt(p.size.depthMm) || !isInt(p.size.heightMm) || !isInt(p.mount.dropMm)) return refuse([issue('number', 'medidas y descuelgue en mm enteros')]);
    const item = { id: p.id, type: p.type, roomId: p.roomId, position: { ...p.position }, rotationDeg: p.rotationDeg, size: { ...p.size }, sizeSource: p.sizeSource, dropMm: p.mount.dropMm, curtainLengthMm: p.kind === 'curtain' ? p.mount.curtainLengthMm : null, review: 'human-confirmed', confirmedAt };
    return withExt(project, ext.verticalReferences, ext.items.filter(x => x.id !== item.id).concat([item]));
  }
  function removeItem(project, id) { const blocked = writable(project); if (blocked) return blocked; const ext = extension(project); return withExt(project, ext.verticalReferences, ext.items.filter(x => x.id !== id)); }
  // Entries whose room no longer exists (a reader that ignores the extension may delete rooms).
  function orphans(project) { const ext = extension(project), rooms = new Set((project.rooms || []).map(r => r.id)); return ext.status !== 'present' ? [] : [...ext.items.filter(i => isObj(i) && !rooms.has(i.roomId)).map(i => i.id), ...ext.verticalReferences.filter(r => isObj(r) && r.scope === 'room' && !rooms.has(r.roomId)).map(r => 'ref:' + r.roomId)]; }
  function prune(project) { const ext = extension(project), rooms = new Set((project.rooms || []).map(r => r.id)); if (ext.status !== 'present') return { ok: true, project: clone(project), removed: [] }; const gone = orphans(project); return { ...withExt(project, ext.verticalReferences.filter(r => r.scope !== 'room' || rooms.has(r.roomId)), ext.items.filter(i => rooms.has(i.roomId))), removed: gone }; }
  // The confirmed items as session requests (to show them, or to evaluate a new one against them).
  const asRequests = project => extension(project).items.map(it => ({ id: it.id, type: it.type, position: it.position, rotationDeg: it.rotationDeg, size: it.size, dropMm: it.dropMm, ...(it.curtainLengthMm !== null ? { curtainLengthMm: it.curtainLengthMm } : {}) }));
  /* Reopening never trusts what was stored: every confirmed item is RE-EVALUATED with the references and the other
   * confirmed items as they are in this file now. Read-only: nothing is moved, fixed or deleted; an item that no longer
   * holds is reported with the reason so a person decides. */
  function recheck(project, { labelOf } = {}) {
    const ext = extension(project);
    if (ext.status !== 'present') return { status: ext.status, items: [], holding: 0, failing: 0, orphans: [], ...(ext.issues ? { issues: ext.issues } : {}) };
    // Orphans (room deleted by a reader that ignores the extension) are reported per item below; any other damage
    // means the stored data cannot be trusted at all.
    const damage = validateExtension(project).issues.filter(x => x.code !== 'orphan');
    if (damage.length) return { status: 'invalid', items: [], holding: 0, failing: 0, orphans: [], issues: damage };
    const reqs = asRequests(project), gone = new Set(orphans(project));
    const items = ext.items.map((it, i) => {
      if (gone.has(it.id)) return { id: it.id, type: it.type, roomId: it.roomId, position: { ...it.position }, holds: false, state: 'orphan', explanation: ['La estancia de este elemento ya no existe en el proyecto.'] };
      const accepted = reqs.filter((_, j) => j !== i), ceiling = verticalFor(project, it.roomId);
      const ev = S.evaluate({ project, ceiling, request: reqs[i], accepted, ...(labelOf ? { labelOf } : {}) });
      const movedRoom = ev.ok && ev.proposal.roomId !== it.roomId;
      const holds = ev.ok && ev.state === 'candidate-reviewable' && !ev.diff.relocated && !movedRoom;
      return { id: it.id, type: it.type, roomId: it.roomId, position: { ...it.position }, holds, state: ev.ok ? ev.state : 'invalid',
        explanation: movedRoom ? ['El elemento ya no queda dentro de su estancia guardada.'].concat(ev.explanation) : ev.explanation };
    });
    const holding = items.filter(x => x.holds).length;
    return { status: 'present', items, holding, failing: items.length - holding, orphans: [...gone] };
  }
  const api = { KEY, VERSION, extension, validateExtension, verticalFor, setVerticalReference, confirmItem, removeItem, orphans, prune, asRequests, recheck };
  if (node && module.exports) module.exports = api; else root.RubikCeilingContract = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
