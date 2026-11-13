/* SCULPT-R03 · puente con el editor de RUBIK (corte R1, puro; NO lo carga index.html todavía).
 *
 * Reúne en un solo módulo los cinco puntos de conexión de la propuesta de integración (#202, §5), para que la cirugía de
 * index.html sea de pocas líneas y todo lo que decide esté probado aquí con el núcleo real de RUBIK:
 *   1. abrir el editor de interior de un mueble        → open(project, objectId)
 *   2. guardar dentro del deshacer de RUBIK             → save(project, session)   (se llama dentro de mutate())
 *   3. dibujar el armario exacto en el 3D del editor    → model3D(THREE, project, object)
 *   4. borrar el mueble sin dejar interiores huérfanos  → afterDelete(project)
 *   5. duplicar el mueble con su interior               → afterDuplicate(project, fromId, toId)
 * y una comprobación de carga: afterLoad(project) informa (sin cambiar nada) de interiores huérfanos o ilegibles.
 *
 * Reglas: ninguna función muta su entrada; o devuelve {ok:true, project} completamente validado, o {ok:false, issues,
 * explanation} y el proyecto del que partía sigue intacto. Una sola autoridad geométrica: RubikCabinetCore. Una sola
 * persistencia: extensions['x-r03-cabinet'] (RubikCabinetContract, opción aprobada por el propietario; experimental).
 * Sin DOM, red ni almacenamiento. Nada aquí es fabricación, presupuesto ni medida de un fabricante. */
(function (root) {
  'use strict';
  const node = typeof module === 'object' && typeof require === 'function';
  const K = node ? require('./r03-cabinet-core.js') : root.RubikCabinetCore;
  const X = node ? require('./r03-cabinet-contract.js') : root.RubikCabinetContract;
  const E = node ? require('./r03-cabinet-editor-core.js') : root.RubikCabinetEditor;
  const clone = v => structuredClone(v);
  const EDITABLE = Object.freeze(['none', 'ok', 'adapted', 'stale']);
  // Mensaje para la persona, por estado de lectura (el mismo criterio que el laboratorio de #202).
  const NOTICE = Object.freeze({
    none: { kind: 'info', text: 'Interior por defecto (valores supuestos, no medidos). Edítalo y pulsa «Guardar interior».' },
    adapted: { kind: 'info', text: 'El armario cambió de medidas y su interior se ha adaptado: revísalo y guarda.' },
    stale: { kind: 'error', text: 'El armario cambió de medidas y el interior guardado ya no cabe. Se muestra sin tocarlo: ajústalo y guarda.' },
    invalid: { kind: 'error', text: 'Este interior no se puede editar aquí: los datos guardados están dañados. No se ha cambiado nada.' },
    future: { kind: 'error', text: 'Este interior se guardó con una versión posterior de RUBIK. Solo lectura.' },
  });

  const isCabinet = object => !!object && K.isCabinetType(object.type);

  /* 1 · Abrir. Devuelve la sesión de edición (RubikCabinetEditor) del armario, o por qué no se puede. */
  function open(project, objectId) {
    const r = X.read(project, objectId);
    if (r.status === 'unknown-object') return { ok: false, status: r.status, issues: [{ code: 'unknown-object', message: `No existe el objeto ${objectId}` }] };
    if (r.status === 'not-cabinet') return { ok: false, status: r.status, issues: [{ code: 'not-cabinet', message: `«${r.objectType}» no admite interior paramétrico` }] };
    if (r.status === 'invalid' || r.status === 'future') {
      // Solo lectura: se muestra lo guardado si se puede leer, nunca se repara ni se sobrescribe en silencio.
      const object = (project.objects || []).find(o => o.id === objectId), raw = r.raw;
      const outer = raw?.outer || { w: object.size.widthMm, d: object.size.depthMm };
      const cabinet = raw && !K.validate(outer, raw.cabinet).length ? raw.cabinet : K.defaultCabinet(object.type, { w: object.size.widthMm, d: object.size.depthMm });
      return { ok: true, status: r.status, readOnly: true, notice: NOTICE[r.status], issues: r.issues || [],
        session: E.createSession({ objectId, objectType: object.type, outer, cabinet, provenance: raw?.provenance || null, readOnly: true }) };
    }
    const session = E.createSession({ objectId, objectType: r.object.type, outer: r.outer, cabinet: r.cabinet, provenance: r.provenance, readOnly: false });
    return { ok: true, status: r.status, readOnly: false, saved: r.saved, notice: NOTICE[r.status] || null, issues: r.issues || [], session };
  }

  /* 2 · Guardar. Escribe el interior editado y ajusta las medidas del mueble; para usar dentro de mutate() de RUBIK:
     `mutate(() => { const r = Bridge.save(project, s); if (!r.ok) throw Error(r.explanation.join(' ')); project = r.project; })`.
     Así el guardado entra en el deshacer de RUBIK y, si se rechaza, mutate() restaura el proyecto. */
  function save(project, session) {
    if (!session || session.readOnly) return refuse([{ code: 'read-only', message: 'Este interior es de solo lectura' }]);
    const res = E.result(session);
    if (!res || !res.cabinet) return refuse([{ code: 'state', message: 'La sesión no tiene un interior válido' }]);
    if (res.issues?.length) return refuse(res.issues, session);
    // La procedencia la decide la sesión: solo pasa a «edited» lo que la persona cambió de verdad.
    const w = X.write(project, session.objectId, res.cabinet, { outer: res.outer, provenance: res.provenance });
    return w.ok ? { ok: true, project: w.project, warnings: w.warnings || [] } : refuse(w.issues, session);
  }
  function refuse(issues, session) {
    return { ok: false, issues, explanation: E.explain(issues, session?.state, null) };
  }

  /* 3 · 3D. El armario exacto (zócalo, costados, baldas, barras, cajones, puertas) para buildFurniture, en el marco local
     de los muebles de RUBIK (frente hacia +z, base en y=0, centrado). Devuelve null cuando no hay un interior guardado
     dibujable, y entonces RUBIK dibuja su armario de siempre. `exact:true` = no reescalar por size.heightMm: ya mide eso. */
  function model3D(THREE, project, object, options = {}) {
    if (!isCabinet(object)) return null;
    const r = X.read(project, object.id);
    if (r.status !== 'ok' && r.status !== 'adapted') return null;
    const Three = options.Three || (node ? require('./r03-cabinet-three.js') : root.RubikCabinetThree);
    const group = Three.build(THREE, r.outer, r.cabinet, { color: object.color || undefined });
    group.userData.r03 = { status: r.status, objectId: object.id, heightMm: r.cabinet.height };
    return { group, exact: true, status: r.status, heightMm: r.cabinet.height };
  }

  /* 4 · Borrar. RUBIK quita el mueble de project.objects; aquí se quita su interior para que no quede huérfano.
     Con una extensión futura o dañada no se toca (es de otro lector): ok, con aviso. */
  function afterDelete(project) {
    const ext = X.extension(project);
    if (ext.status === 'future' || ext.status === 'invalid') return { ok: true, project: clone(project), removed: [], kept: ext.status };
    return X.prune(project);
  }

  /* 5 · Duplicar. RUBIK crea la copia con otro id; aquí la copia recibe el interior guardado del original. Sin interior
     guardado (o ilegible) la copia queda como un armario normal: no es un error. */
  function afterDuplicate(project, fromId, toId) {
    const r = X.read(project, fromId);
    if (!r.saved || r.status === 'invalid' || r.status === 'stale' || r.status === 'future') return { ok: true, project: clone(project), copied: false };
    const c = X.copyInterior(project, fromId, toId);
    return c.ok ? { ok: true, project: c.project, copied: true } : { ok: false, issues: c.issues, explanation: E.explain(c.issues, null, null) };
  }

  /* Al abrir un proyecto: qué hay (sin cambiar nada). La app decide si avisar o limpiar con afterDelete. */
  function afterLoad(project) {
    const report = X.validateExtension(project), ext = X.extension(project);
    return { status: ext.status, orphans: X.orphans(project), ok: report.ok, issues: report.ok ? [] : report.issues,
      cabinets: (project.objects || []).filter(isCabinet).map(o => ({ id: o.id, status: X.read(project, o.id).status })) };
  }

  const api = Object.freeze({ EDITABLE, NOTICE, isCabinet, open, save, model3D, afterDelete, afterDuplicate, afterLoad });
  if (node && module.exports) module.exports = api; else root.RubikCabinetBridge = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
