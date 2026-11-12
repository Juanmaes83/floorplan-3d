/* SCULPT-R03 · I1 CANDIDATE contract for parametric cabinet interiors. NOT the canonical contract; NOT loaded by
 * index.html. The owner must choose the persistence option (see docs/technical/sculpt-r03-complete-2026-11-12.md §A1)
 * before any product code writes it.
 *
 * Candidate persistence (option 2 of the brief): the experimental namespace FloorPlanProjectV1 already defines,
 *   project.extensions["x-r03-cabinet"] = { version: 1, entries: [ { objectId, objectType, outer:{w,d}, cabinet, provenance, updatedAt } ] }
 *  - valid today for every 1.x reader, strict mode included (patternProperties ^x-…), so no schema change;
 *  - entries are an ARRAY keyed by `objectId` as a VALUE: FloorPlanBuildingV1 rejects any extension KEY that looks like
 *    multi-level data (/level|floor|stair|…/i) and object ids such as "obj_floor-lamp" would otherwise poison a level;
 *  - readers that do not know the extension keep it (contract §7) and draw the ordinary wardrobe: no silent loss.
 * One validation authority: RubikCabinetCore.validate (js/r03-cabinet-core.js). This module adds only the data-shape and
 * reference rules of the persisted document; it never re-implements a geometric rule.
 * Pure: no DOM, storage or network; every function returns a new project or a report and never mutates its inputs. */
(function (root) {
  'use strict';
  const node = typeof module === 'object' && typeof require === 'function';
  const K = node ? require('./r03-cabinet-core.js') : root.RubikCabinetCore;
  const Core = node ? require('./project-core.js') : root.FloorPlanCore;
  const KEY = 'x-r03-cabinet', VERSION = 1;
  const CABINET_KEYS = Object.freeze(['height', 'thickness', 'back', 'frontGap', 'plinth', 'locked', 'front', 'doorCount', 'columns']);
  const COLUMN_KEYS = Object.freeze(['width', 'kind', 'shelves', 'rod', 'drawers', 'drawerHeight']);
  const ENTRY_KEYS = Object.freeze(['objectId', 'objectType', 'outer', 'cabinet', 'provenance', 'updatedAt']);
  // Where each group of values comes from. 'assumed' = the donor default (RubikCabinetCore.ASSUMED), never a measurement.
  const PROVENANCE = Object.freeze({
    height: Object.freeze(['object-height', 'assumed-type-default', 'edited']),
    boards: Object.freeze(['assumed', 'edited']),
    layout: Object.freeze(['default', 'edited'])
  });
  const STATUS = Object.freeze(['not-cabinet', 'none', 'ok', 'adapted', 'stale', 'invalid', 'future', 'unknown-object']);
  const LIMITS = Object.freeze({ entries: 500, valueAbsMm: 100000 });
  const isObj = v => v !== null && typeof v === 'object' && !Array.isArray(v);
  const clone = v => structuredClone(v);
  const issue = (code, message, path) => (path ? { code, message, path } : { code, message });
  const nowIso = () => new Date().toISOString();

  // ---- shape of the persisted data (types only; ranges and geometry belong to RubikCabinetCore) ----
  function exact(value, keys, path, out, optional = []) {
    if (!isObj(value)) { out.push(issue('shape', 'Se esperaba un objeto', path)); return false; }
    for (const k of Object.keys(value)) if (!keys.includes(k) && !optional.includes(k)) out.push(issue('unknown-field', `Campo no definido en la versión ${VERSION}: ${k}`, `${path}/${k}`));
    for (const k of keys) if (!Object.hasOwn(value, k)) out.push(issue('missing-field', `Falta ${k}`, `${path}/${k}`));
    return true;
  }
  const finiteMm = v => typeof v === 'number' && Number.isFinite(v) && Math.abs(v) <= LIMITS.valueAbsMm;
  function cabinetShape(c, path, out) {
    if (!exact(c, CABINET_KEYS, path, out)) return;
    for (const k of ['height', 'thickness', 'back', 'frontGap', 'plinth']) if (Object.hasOwn(c, k) && !finiteMm(c[k])) out.push(issue('number', `${k} debe ser un número finito en mm`, `${path}/${k}`));
    if (Object.hasOwn(c, 'doorCount') && !Number.isInteger(c.doorCount)) out.push(issue('number', 'doorCount debe ser entero', `${path}/doorCount`));
    if (Object.hasOwn(c, 'locked') && typeof c.locked !== 'boolean') out.push(issue('type', 'locked debe ser booleano', `${path}/locked`));
    if (Object.hasOwn(c, 'front') && typeof c.front !== 'string') out.push(issue('type', 'front debe ser texto', `${path}/front`));
    if (!Array.isArray(c.columns)) { if (Object.hasOwn(c, 'columns')) out.push(issue('type', 'columns debe ser una lista', `${path}/columns`)); return; }
    c.columns.forEach((col, i) => {
      const p = `${path}/columns/${i}`;
      if (!exact(col, COLUMN_KEYS, p, out)) return;
      if (!finiteMm(col.width)) out.push(issue('number', 'width debe ser un número finito en mm', `${p}/width`));
      if (typeof col.kind !== 'string') out.push(issue('type', 'kind debe ser texto', `${p}/kind`));
      if (!Array.isArray(col.shelves) || col.shelves.some(y => !finiteMm(y))) out.push(issue('number', 'shelves debe ser una lista de mm finitos', `${p}/shelves`));
      if (col.rod !== null && !finiteMm(col.rod)) out.push(issue('number', 'rod debe ser null o mm finitos', `${p}/rod`));
      if (!Number.isInteger(col.drawers)) out.push(issue('number', 'drawers debe ser entero', `${p}/drawers`));
      if (!finiteMm(col.drawerHeight)) out.push(issue('number', 'drawerHeight debe ser mm finitos', `${p}/drawerHeight`));
    });
  }
  function entryShape(e, path, out) {
    if (!exact(e, ENTRY_KEYS, path, out)) return;
    if (typeof e.objectId !== 'string' || !e.objectId) out.push(issue('type', 'objectId debe ser texto', `${path}/objectId`));
    if (!K.isCabinetType(e.objectType)) out.push(issue('object-type', `Tipo no paramétrico: ${e.objectType}`, `${path}/objectType`));
    if (exact(e.outer, ['w', 'd'], `${path}/outer`, out)) for (const k of ['w', 'd']) if (Object.hasOwn(e.outer, k) && !(Number.isInteger(e.outer[k]) && e.outer[k] > 0 && e.outer[k] <= LIMITS.valueAbsMm)) out.push(issue('number', `outer.${k} debe ser entero positivo en mm`, `${path}/outer/${k}`));
    cabinetShape(e.cabinet, `${path}/cabinet`, out);
    if (exact(e.provenance, Object.keys(PROVENANCE), `${path}/provenance`, out)) for (const [k, allowed] of Object.entries(PROVENANCE)) if (Object.hasOwn(e.provenance, k) && !allowed.includes(e.provenance[k])) out.push(issue('provenance', `provenance.${k} no válido`, `${path}/provenance/${k}`));
    if (typeof e.updatedAt !== 'string' || !Number.isFinite(Date.parse(e.updatedAt))) out.push(issue('type', 'updatedAt debe ser una fecha ISO', `${path}/updatedAt`));
  }

  // ---- reading ----
  function extension(project) {
    const ext = project?.extensions?.[KEY];
    if (ext === undefined) return { status: 'absent', entries: [] };
    if (!isObj(ext) || !Number.isInteger(ext.version)) return { status: 'invalid', entries: [], issues: [issue('shape', `${KEY} sin versión entera`, `/extensions/${KEY}`)] };
    if (ext.version > VERSION) return { status: 'future', version: ext.version, entries: [] };
    if (ext.version !== VERSION || !Array.isArray(ext.entries)) return { status: 'invalid', entries: [], issues: [issue('shape', `${KEY}: versión ${ext.version} o entries no válidos`, `/extensions/${KEY}`)] };
    return { status: 'present', entries: ext.entries };
  }
  const findObject = (project, id) => (project.objects || []).find(o => o.id === id);
  const outerOf = object => ({ w: object.size.widthMm, d: object.size.depthMm });

  /* The whole extension, as a report. Never throws for bad data: a reader must keep working on someone else's file. */
  function validateExtension(project) {
    const ext = extension(project), issues = [...(ext.issues || [])], warnings = [];
    if (ext.status === 'future') return { ok: true, status: 'future', issues, warnings: [`${KEY} versión ${ext.version}: se conserva sin leerla ni modificarla`] };
    if (ext.status !== 'present') return { ok: !issues.length, status: ext.status, issues, warnings };
    if (ext.entries.length > LIMITS.entries) issues.push(issue('entries', `Más de ${LIMITS.entries} armarios`, `/extensions/${KEY}/entries`));
    const seen = new Set();
    ext.entries.forEach((e, i) => {
      const path = `/extensions/${KEY}/entries/${i}`, before = issues.length;
      entryShape(e, path, issues);
      if (issues.length > before) return;
      if (seen.has(e.objectId)) issues.push(issue('duplicate', `Dos interiores para ${e.objectId}`, `${path}/objectId`));
      seen.add(e.objectId);
      const object = findObject(project, e.objectId);
      if (!object) { issues.push(issue('orphan', `El objeto ${e.objectId} ya no existe`, `${path}/objectId`)); return; }
      if (object.type !== e.objectType) issues.push(issue('type-changed', `El objeto ${e.objectId} es ahora ${object.type}`, `${path}/objectType`));
      for (const x of K.validate(e.outer, e.cabinet)) issues.push(issue('cabinet:' + x.code, x.message, x.bay == null ? `${path}/cabinet` : `${path}/cabinet/columns/${x.bay}`));
      if (object.size.widthMm !== e.outer.w || object.size.depthMm !== e.outer.d) warnings.push(`${e.objectId}: el objeto cambió de medidas; el interior se adaptará al abrirlo`);
      if (object.size.heightMm !== undefined && object.size.heightMm !== e.cabinet.height) warnings.push(`${e.objectId}: altura del objeto ${object.size.heightMm} mm ≠ armario ${e.cabinet.height} mm`);
    });
    return { ok: !issues.length, status: 'present', issues, warnings };
  }

  /* The interior of one object, ready for the editor and the 3D. Statuses:
     not-cabinet · unknown-object · none (no saved interior: a proposed default, provenance assumed) · ok · adapted (the
     object was resized: the saved interior follows the new size through RubikCabinetCore.resize, to be reviewed and saved)
     · stale (resized and the saved interior no longer fits: kept untouched, never replaced silently) · invalid · future. */
  function read(project, objectId) {
    const object = findObject(project, objectId);
    if (!object) return { status: 'unknown-object', objectId };
    if (!K.isCabinetType(object.type)) return { status: 'not-cabinet', objectId, objectType: object.type };
    const outer = outerOf(object), ext = extension(project);
    if (ext.status === 'future') return { status: 'future', objectId, version: ext.version, readOnly: true };
    if (ext.status === 'invalid') return { status: 'invalid', objectId, issues: ext.issues, readOnly: true };
    const matches = ext.entries.filter(e => isObj(e) && e.objectId === objectId);
    if (!matches.length) {
      const height = object.size.heightMm, base = K.defaultCabinet(object.type, outer);
      let cabinet = base, provenance = { height: 'assumed-type-default', boards: 'assumed', layout: 'default' }, issues = K.validate(outer, cabinet);
      if (height !== undefined && height !== base.height) {
        const r = K.resize(outer, base, { height });
        // The object's own height wins; if no default layout fits it, say so instead of drawing another height.
        if (r.ok) { cabinet = r.cabinet; provenance.height = 'object-height'; issues = []; }
        else issues = [issue('object-height-unfit', `Ninguna distribución por defecto cabe en ${height} mm de altura`), ...r.issues];
      } else if (height !== undefined) provenance.height = 'object-height';
      return { status: 'none', objectId, object: clone(object), outer, cabinet, provenance, issues, saved: false };
    }
    const shape = [];
    if (matches.length > 1) shape.push(issue('duplicate', `Dos interiores para ${objectId}`));
    entryShape(matches[0], `/extensions/${KEY}/entries/${ext.entries.indexOf(matches[0])}`, shape);
    if (shape.length) return { status: 'invalid', objectId, issues: shape, readOnly: true, raw: clone(matches[0]) };
    const e = matches[0];
    if (e.objectType !== object.type) return { status: 'invalid', objectId, issues: [issue('type-changed', `El objeto es ahora ${object.type}`)], readOnly: true, raw: clone(e) };
    const own = K.validate(e.outer, e.cabinet);
    if (own.length) return { status: 'invalid', objectId, issues: own, readOnly: true, raw: clone(e) };
    const sameSize = e.outer.w === outer.w && e.outer.d === outer.d;
    const heightTarget = object.size.heightMm !== undefined && object.size.heightMm !== e.cabinet.height ? object.size.heightMm : undefined;
    if (sameSize && heightTarget === undefined) return { status: 'ok', objectId, object: clone(object), outer, cabinet: clone(e.cabinet), provenance: clone(e.provenance), issues: [], saved: true, updatedAt: e.updatedAt };
    const r = K.resize(e.outer, e.cabinet, { w: outer.w, d: outer.d, ...(heightTarget === undefined ? {} : { height: heightTarget }) });
    if (r.ok) return { status: 'adapted', objectId, object: clone(object), outer, cabinet: r.cabinet, provenance: clone(e.provenance), issues: [], saved: true, from: { outer: clone(e.outer), height: e.cabinet.height }, savedCabinet: clone(e.cabinet) };
    return { status: 'stale', objectId, object: clone(object), outer, cabinet: clone(e.cabinet), savedOuter: clone(e.outer), provenance: clone(e.provenance), issues: r.issues, saved: true, readOnly: false };
  }

  // ---- writing (atomic: the result is fully validated, or nothing is returned) ----
  const refuse = issues => ({ ok: false, issues });
  function withExtension(project, entries) {
    const next = clone(project);
    if (!isObj(next.extensions)) next.extensions = {};
    if (entries.length) next.extensions[KEY] = { version: VERSION, entries };
    else { delete next.extensions[KEY]; if (!Object.keys(next.extensions).length) delete next.extensions; }
    return next;
  }
  function finalCheck(next) {
    const report = validateExtension(next);
    if (!report.ok) return refuse(report.issues);
    try { Core.validate(next); } catch (error) { return refuse([issue('project', error.message)]); }
    return { ok: true, project: next, warnings: report.warnings };
  }
  /* Saves `cabinet` as the interior of `objectId`. The object's size follows the cabinet (heightMm = cabinet height, width
     and depth = outer) so plan, elevation and 3D share one state. Refused, with nothing changed, when: the extension is
     from a future version or unreadable, another entry of the document is invalid, the object is not a cabinet, the
     cabinet is invalid for RubikCabinetCore, or the project would stop validating. */
  function write(project, objectId, cabinet, { outer, provenance, updatedAt = nowIso() } = {}) {
    const ext = extension(project);
    if (ext.status === 'future') return refuse([issue('future', `${KEY} versión ${ext.version}: solo lectura en esta versión`)]);
    if (ext.status === 'invalid') return refuse(ext.issues);
    const object = findObject(project, objectId);
    if (!object) return refuse([issue('unknown-object', `No existe el objeto ${objectId}`)]);
    if (!K.isCabinetType(object.type)) return refuse([issue('not-cabinet', `${object.type} no admite interior paramétrico`)]);
    const o = outer ? { w: outer.w, d: outer.d } : outerOf(object);
    if (!Number.isInteger(o.w) || !Number.isInteger(o.d) || o.w < 1 || o.d < 1) return refuse([issue('outer', 'Las medidas exteriores deben ser mm enteros')]);
    if (!Number.isInteger(cabinet?.height)) return refuse([issue('height', 'La altura del armario debe ser un número entero de mm')]);
    const own = K.validate(o, cabinet);
    if (own.length) return refuse(own);
    const p = { height: 'edited', boards: 'edited', layout: 'edited', ...(provenance || {}) };
    const entry = { objectId, objectType: object.type, outer: o, cabinet: clone(cabinet), provenance: p, updatedAt };
    const shape = []; entryShape(entry, '/entry', shape);
    if (shape.length) return refuse(shape);
    const entries = ext.entries.filter(e => !(isObj(e) && e.objectId === objectId)).concat([entry]);
    const next = withExtension(project, entries), target = next.objects.find(x => x.id === objectId);
    target.size = { ...target.size, widthMm: o.w, depthMm: o.d, heightMm: cabinet.height };
    return finalCheck(next);
  }
  // Removes the interior only (the wardrobe stays, drawn as the ordinary RUBIK wardrobe).
  function remove(project, objectId) {
    const ext = extension(project);
    if (ext.status === 'future') return refuse([issue('future', `${KEY} versión ${ext.version}: solo lectura`)]);
    if (ext.status !== 'present') return { ok: true, project: clone(project), removed: 0 };
    const entries = ext.entries.filter(e => !(isObj(e) && e.objectId === objectId));
    const removed = ext.entries.length - entries.length;
    return removed ? { ...finalCheck(withExtension(project, entries)), removed } : { ok: true, project: clone(project), removed: 0 };
  }
  /* What the app's delete path must do for a cabinet (proposal for the integration surgery; the app is not touched here):
     the object and its interior go in one step, so no orphan is ever written. */
  function removeObject(project, objectId) {
    if (!findObject(project, objectId)) return refuse([issue('unknown-object', `No existe el objeto ${objectId}`)]);
    const ext = extension(project);
    if (ext.status === 'future' || ext.status === 'invalid') {
      // The object may still be deleted; an unreadable/future extension is kept verbatim for its own reader.
      const next = clone(project); next.objects = next.objects.filter(o => o.id !== objectId);
      try { Core.validate(next); } catch (error) { return refuse([issue('project', error.message)]); }
      return { ok: true, project: next, interiorKept: true };
    }
    const next = withExtension(project, ext.entries.filter(e => !(isObj(e) && e.objectId === objectId)));
    next.objects = next.objects.filter(o => o.id !== objectId);
    return finalCheck(next);
  }
  // Entries whose object no longer exists (e.g. deleted by a reader that does not know this extension).
  function orphans(project) {
    const ext = extension(project);
    return ext.status === 'present' ? ext.entries.filter(e => isObj(e) && typeof e.objectId === 'string' && !findObject(project, e.objectId)).map(e => e.objectId) : [];
  }
  function prune(project) {
    const ext = extension(project), gone = new Set(orphans(project));
    if (!gone.size) return { ok: true, project: clone(project), removed: [] };
    return { ...finalCheck(withExtension(project, ext.entries.filter(e => !gone.has(e.objectId)))), removed: [...gone] };
  }
  /* Duplicating a wardrobe in RUBIK creates a new object id; this copies its saved interior to the copy (proposal for the
     integration surgery, so a duplicate does not silently fall back to the default layout). */
  function copyInterior(project, fromId, toId) {
    const r = read(project, fromId);
    if (!r.saved || r.status === 'invalid' || r.status === 'stale') return refuse([issue('no-interior', `${fromId} no tiene un interior guardado válido`)]);
    return write(project, toId, r.cabinet, { provenance: r.provenance, updatedAt: nowIso() });
  }

  const api = { KEY, VERSION, STATUS, PROVENANCE, LIMITS, CABINET_KEYS, COLUMN_KEYS, ENTRY_KEYS, extension, validateExtension, read, write, remove, removeObject, orphans, prune, copyInterior };
  if (node && module.exports) module.exports = api; else root.RubikCabinetContract = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
