/* BP-DP PREMIUM · MODELO DE COMPONENTES (UMD, puro). Común a Blueprint y Despiece.
 *
 * A partir de un paquete de escena (real de RUBIK o sintético) construye:
 *   componentes = piezas explicables con identidad (id canónico), sistema constructivo, nivel, mallas y límites;
 *   sistemas    = capas seleccionables, en orden constructivo, con disponibilidad (presente / no modelado);
 *   ausencias   = lo que el proyecto NO modela (se declara, nunca se dibuja ni se inventa).
 * Regla de identidad (lección G1): la clave de pieza es «sistema:entidad»; una estancia aporta su suelo y su techo como
 * dos piezas distintas de la misma entidad. Una malla nunca se cuenta como componente.
 */
(function (root, factory) { const api = factory(); if (typeof module === 'object' && module.exports) module.exports = api; else root.BpdpModel = api; })(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  // Sistemas en orden constructivo (abajo → arriba, estructura → acabados). `fixed`: referencia del montaje.
  const SYSTEMS = [
    { id: 'foundation', label: 'Cimentación', fixed: true },
    { id: 'floors', label: 'Suelos de estancias', fixed: true },
    { id: 'slab', label: 'Soleras y forjados' },
    { id: 'structure', label: 'Estructura (pilares y vigas)' },
    { id: 'walls', label: 'Muros' },
    { id: 'envelope', label: 'Cerramientos' },
    { id: 'partitions', label: 'Particiones' },
    { id: 'openings', label: 'Carpinterías y huecos' },
    { id: 'ceilings', label: 'Techos' },
    { id: 'fixtures', label: 'Luminarias' },
    { id: 'roof-structure', label: 'Estructura de cubierta' },
    { id: 'roof', label: 'Faldones de cubierta' },
    { id: 'roof-finish', label: 'Cobertura de cubierta' },
    { id: 'finishes', label: 'Acabados de suelo' },
    { id: 'furniture', label: 'Mobiliario' }];
  const SYS = Object.fromEntries(SYSTEMS.map((s, i) => [s.id, { ...s, order: i }]));
  // Lo que un proyecto de RUBIK no modela hoy: se declara Desconocido / No modelado.
  const NOT_MODELLED_REAL = [
    { id: 'foundation', label: 'Cimentación', reason: 'El proyecto de RUBIK no modela cimentación.' },
    { id: 'structure', label: 'Pilares y vigas', reason: 'No hay elementos estructurales modelados; el tipo de muro es un dato de plantilla sin declarar.' },
    { id: 'slab', label: 'Forjados y soleras', reason: 'No hay forjados modelados; los «suelos» son superficies de estancia.' },
    { id: 'roof', label: 'Cubierta', reason: 'El proyecto de ejemplo no tiene cubierta modelada.' },
    { id: 'services', label: 'Instalaciones', reason: 'No hay instalaciones modeladas.' },
    { id: 'layers', label: 'Capas de muro', reason: 'Los muros son volúmenes con espesor, sin capas constructivas.' }];
  const NOT_MODELLED_SYN = [
    { id: 'stairs', label: 'Escalera', reason: 'La escena sintética no incluye escalera.' },
    { id: 'services', label: 'Instalaciones', reason: 'La escena sintética no incluye instalaciones.' },
    { id: 'layers', label: 'Capas de cerramiento', reason: 'Los cerramientos sintéticos son volúmenes monolíticos.' }];
  const ROLE_SYS_REAL = { room: 'floors', wall: 'walls', opening: 'openings', 'opening-leaf': 'openings', ceiling: 'ceilings', fixture: 'fixtures', object: 'furniture' };
  const OPENING = { door: 'Puerta', 'sliding-door': 'Puerta corredera', window: 'Ventana', void: 'Hueco de paso' };
  const union = (a, b) => { for (let i = 0; i < 3; i++) { a.min[i] = Math.min(a.min[i], b.min[i]); a.max[i] = Math.max(a.max[i], b.max[i]); } return a; };
  const empty = () => ({ min: [Infinity, Infinity, Infinity], max: [-Infinity, -Infinity, -Infinity] });

  function build(pkg) {
    if (!pkg || !Array.isArray(pkg.meshes) || !pkg.project) throw Error('model: paquete de escena inválido');
    const synthetic = pkg.scenario === 'synthetic';
    const P = pkg.project, byId = new Map();
    for (const k of ['walls', 'openings', 'rooms', 'objects']) for (const e of P[k] || []) byId.set(e.id, { ...e, _kind: k });
    const names = pkg.displayNames || {};
    const comps = new Map(), unclassified = [];
    pkg.meshes.forEach((m, i) => {
      const role = m.entity && m.entity.role, id = m.entity && m.entity.id || null;
      const meta = synthetic && id ? pkg.components[id] : null;
      const sys = synthetic ? (meta ? meta.system : null) : ROLE_SYS_REAL[role];
      if (!sys || !SYS[sys]) { unclassified.push(i); return; }
      const key = `${sys}:${id || 'aux-' + role}`;
      let c = comps.get(key);
      if (!c) { const canon = id ? byId.get(id) : null;
        c = { key, entityId: id, system: sys, roles: new Set(), meshIdx: [], bounds: empty(), level: meta ? meta.level : (m.level || null),
          canonical: !!canon || !!meta, synthetic, auxiliary: !(canon || meta), meta: meta || null, entity: canon || null };
        comps.set(key, c); }
      c.roles.add(role); c.meshIdx.push(i); union(c.bounds, m.bounds);
    });
    const list = [...comps.values()].map(c => {
      c.roles = [...c.roles].sort(); c.center = [0, 1, 2].map(i => (c.bounds.min[i] + c.bounds.max[i]) / 2);
      c.name = c.meta ? c.meta.name : nameOf(c, names); return c; })
      .sort((a, b) => SYS[a.system].order - SYS[b.system].order || a.key.localeCompare(b.key));
    const systems = SYSTEMS.map(s => { const cs = list.filter(c => c.system === s.id); return { ...s, order: SYS[s.id].order, available: cs.length > 0, count: cs.filter(c => c.canonical).length,
      auxiliary: cs.filter(c => c.auxiliary).length, meshes: cs.reduce((n, c) => n + c.meshIdx.length, 0), components: cs.map(c => c.key) }; }).filter(s => s.available);
    const levels = synthetic ? (P.levels || []).map(l => ({ id: l.id, name: l.name })).concat([{ id: 'roof', name: 'Cubierta' }]) : [{ id: null, name: 'Planta única' }];
    return Object.freeze({ scenario: pkg.scenario, synthetic, label: pkg.label, notice: pkg.notice || null, revision: pkg.revision, projectId: pkg.projectId || P.id,
      components: list, byKey: new Map(list.map(c => [c.key, c])), systems, levels, unclassifiedMeshes: unclassified.length,
      notModelled: synthetic ? NOT_MODELLED_SYN : NOT_MODELLED_REAL,
      summary: { visualMeshes: pkg.meshes.length, components: list.length, canonicalEntities: new Set(list.filter(c => c.canonical).map(c => c.entityId)).size,
        auxiliary: list.filter(c => c.auxiliary).length, systems: systems.length } });

    function nameOf(c, names) {
      const e = c.entity;
      if (c.system === 'walls' && e) { const L = Math.hypot(e.end.x - e.start.x, e.end.y - e.start.y); return `Muro de ${(L / 1000).toFixed(2)} m`; }
      if (c.system === 'openings' && e) return `${OPENING[e.kind] || 'Hueco'} de ${(e.widthMm / 1000).toFixed(2)} m`;
      if ((c.system === 'floors' || c.system === 'ceilings') && e) return `${c.system === 'floors' ? 'Suelo' : 'Techo'} · ${names[e.id] || 'Estancia'}`;
      if (c.system === 'furniture' && e) return names[e.id] || 'Mueble';
      if (c.system === 'fixtures') return 'Luminaria (generada por el visor)';
      return SYS[c.system].label;
    }
  }
  return Object.freeze({ build, SYSTEMS, SYS });
});
