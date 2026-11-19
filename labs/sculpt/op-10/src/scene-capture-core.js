/* SCULPT OP-10 · Núcleo de captura de la escena 3D visible (laboratorio, no producción).
 *
 * Escultura de openPlan3D@771c9e1 `src/lib/utils/portableRenderScene.ts` (MIT, © 2026 theLodgeStudio).
 * KEEP: recorrido con visibilidad heredada, mallas indexadas y no indexadas, draw ranges, matrices anidadas,
 *       inversión del orden de triángulos con determinante negativo, validación de índices y coordenadas,
 *       límites de recursos, determinismo y ausencia de mutaciones.
 * GENERALISE: sin dependencia de `three` (lee objetos por su forma); InstancedMesh expandido con límite;
 *       geometrías con grupos y varios materiales; identidad por ID canónico de RUBIK; política de exclusión explícita.
 * REPLACE: el factor 0,01 del donante (centímetros). RUBIK ya trabaja en metros: `unitsToMetres` es obligatorio
 *       y se declara en el resultado. No hay conversión implícita.
 * REMOVE: la losa de soporte sintética se mueve a una opción declarada (`supportSlab`), apagada por defecto.
 *
 * Lo capturado es una OBSERVACIÓN VISUAL de la escena en un instante. No es geometría contractual: la autoridad
 * sigue siendo FloorPlanProjectV1. Cada malla se vincula a su entidad canónica cuando existe un ID en sus ancestros.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.RubikSceneCapture = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const SCHEMA = 'rubik-sota.observed-scene', VERSION = '0.1.0-lab';
  const LIMITS = Object.freeze({ meshes: 10000, vertices: 300000, faces: 300000, instances: 20000, bytes: 64 * 1024 * 1024, coordinateMetres: 10000 });

  // Política explícita. Cada exclusión tiene un motivo que se cuenta en el resultado.
  // Solo se exportan triángulos de Mesh/InstancedMesh visibles; líneas, puntos y sprites no son superficie.
  const EXCLUDE_USERDATA = Object.freeze([
    ['renderExclude', 'excluded-by-marker'],              // marcador genérico (compatible con el donante)
    ['presentationOutline', 'presentation-outline'],     // contorno de la presentación
    ['presentationSection', 'presentation-section'],     // grupo de sección (cutaway de presentación)
    ['sectionCap', 'section-cap'],                       // tapas de corte: efecto de vista, no construcción
    ['contactRoomId', 'contact-shadow-decal'],           // sombras de contacto (shader, sin geometría propia)
    ['territorialContext', 'territorial-context'],       // contexto territorial: opcional (includeTerritory)
  ]);
  const EXCLUDE_NAMES = Object.freeze([
    ['smart-furnishing-preview', 'unapplied-proposal'],  // UX-12: propuesta sin aplicar, nunca es la vivienda
  ]);
  // Ancestros que vinculan una malla a una entidad canónica (el más cercano gana).
  const ENTITY_KEYS = Object.freeze([
    ['fid', 'object'], ['r02aItem', 'ceiling-element'], ['r02aCurtain', 'ceiling-element'], ['door', 'opening-leaf'], ['wallId', 'wall'], ['slabRoom', 'room-slab'], ['ceilRoom', 'ceiling'],
    ['roomId', 'room'], ['room', 'room'], ['stairId', 'stair'], ['roof', 'roof'], ['exteriorVolume', 'exterior'], ['levelId', 'level'],
  ]);

  function fail(code, message) { const e = new Error(message); e.code = code; throw e; }
  const round = v => { const r = Math.round(v * 1e6) / 1e6; return Object.is(r, -0) ? 0 : r; };

  // Matrices 4×4 en orden de columnas (como Three.js `elements`).
  function multiply(a, b) {
    const o = new Array(16);
    for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) {
      let s = 0; for (let k = 0; k < 4; k++) s += a[k * 4 + r] * b[c * 4 + k]; o[c * 4 + r] = s;
    }
    return o;
  }
  function det3(m) { // determinante de la parte lineal (basta para el signo de orientación y la invertibilidad)
    return m[0] * (m[5] * m[10] - m[9] * m[6]) - m[4] * (m[1] * m[10] - m[9] * m[2]) + m[8] * (m[1] * m[6] - m[5] * m[2]);
  }
  function apply(m, x, y, z) {
    const w = m[3] * x + m[7] * y + m[11] * z + m[15] || 1;
    return [(m[0] * x + m[4] * y + m[8] * z + m[12]) / w, (m[1] * x + m[5] * y + m[9] * z + m[13]) / w, (m[2] * x + m[6] * y + m[10] * z + m[14]) / w];
  }

  function entityOf(node) {
    for (let n = node; n; n = n.parent) {
      const u = n.userData || {};
      for (const [key, role] of ENTITY_KEYS) {
        if (u[key] === undefined || u[key] === null || u[key] === false) continue;
        let id = u[key];
        if (key === 'door') id = u.door && u.door.id;
        else if (key === 'exteriorVolume') id = u.exteriorVolume && (u.exteriorVolume.id || u.exteriorVolume.levelId);
        else if (key === 'roof') id = typeof u.roof === 'string' ? u.roof : 'derived-roof';
        if (typeof id !== 'string' || !id) continue;
        return { id, role };
      }
    }
    return { id: null, role: 'unlinked' };
  }
  function levelOf(node) { for (let n = node; n; n = n.parent) if (n.userData && typeof n.userData.levelId === 'string') return n.userData.levelId; return null; }

  function materialInfo(m) {
    if (!m) return { kind: 'none' };
    const hex = c => (c && typeof c.getHexString === 'function') ? '#' + c.getHexString() : null;
    const glass = !!m.transparent && typeof m.opacity === 'number' && m.opacity < 0.6;
    return {
      kind: glass ? 'glass' : (m.isShaderMaterial ? 'shader' : 'surface'), type: m.type || null, name: m.name || null,
      color: hex(m.color), roughness: typeof m.roughness === 'number' ? round(m.roughness) : null,
      metalness: typeof m.metalness === 'number' ? round(m.metalness) : null,
      opacity: typeof m.opacity === 'number' ? round(m.opacity) : 1, transparent: !!m.transparent,
      // Nunca se copian imágenes ni URL: solo se declara que el visor usa un mapa (la textura queda como fallback de color).
      hasMap: !!m.map, hasNormalMap: !!m.normalMap,
    };
  }

  /** Captura la escena visible. `root` es la escena (o un subárbol). No muta nada. */
  function capture(root, options) {
    const o = options || {};
    if (typeof o.unitsToMetres !== 'number' || !(o.unitsToMetres > 0)) fail('UNITS', 'unitsToMetres is required and must be positive (RUBIK viewer: 1).');
    const k = o.unitsToMetres, limits = Object.assign({}, LIMITS, o.limits || {});
    const excludeUser = o.includeTerritory ? EXCLUDE_USERDATA.filter(([key]) => key !== 'territorialContext') : EXCLUDE_USERDATA;
    const meshes = [], excluded = {}, skipped = {};
    let vertexTotal = 0, faceTotal = 0, instanceTotal = 0;
    const lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
    const count = (bag, reason) => { bag[reason] = (bag[reason] || 0) + 1; };
    if (typeof root.updateMatrixWorld === 'function') root.updateMatrixWorld(true); // recalcula derivados, no cambia datos del proyecto

    function emit(node, matrix, groupMaterial, range, instanceIndex) {
      const geometry = node.geometry, position = geometry && geometry.getAttribute && geometry.getAttribute('position');
      if (!position || position.itemSize !== 3) fail('VERTEX_DATA', 'A mesh has unsupported vertex data.');
      const index = geometry.getIndex ? geometry.getIndex() : null, total = index ? index.count : position.count;
      const start = range.start, end = Math.min(total, range.start + range.count);
      if (!Number.isInteger(start) || start < 0 || start % 3 || !Number.isInteger(end) || (end - start) % 3) fail('DRAW_RANGE', 'A mesh has an unsupported triangle draw range.');
      if (start >= end) return;
      const determinant = det3(matrix);
      if (!Number.isFinite(determinant) || Math.abs(determinant) < 1e-12) fail('TRANSFORM', 'A mesh has an invalid transform.');
      if (meshes.length >= limits.meshes || faceTotal + (end - start) / 3 > limits.faces) fail('FACE_BUDGET', 'Scene exceeds the geometry budget.');
      const vertices = [], faces = [], remap = new Map();
      for (let offset = start; offset < end; offset += 3) {
        const face = [];
        for (let corner = 0; corner < 3; corner++) {
          const source = index ? index.getX(offset + corner) : offset + corner;
          if (!Number.isInteger(source) || source < 0 || source >= position.count) fail('INDICES', 'A mesh has invalid triangle indices.');
          let target = remap.get(source);
          if (target === undefined) {
            if (vertexTotal + vertices.length >= limits.vertices) fail('VERTEX_BUDGET', 'Scene exceeds the vertex budget.');
            const p = apply(matrix, position.getX(source), position.getY(source), position.getZ(source)).map(v => v * k);
            if (p.some(v => !Number.isFinite(v) || Math.abs(v) > limits.coordinateMetres)) fail('COORDINATES', 'A mesh has invalid or out-of-range coordinates.');
            const value = p.map(round);
            for (let a = 0; a < 3; a++) { if (value[a] < lo[a]) lo[a] = value[a]; if (value[a] > hi[a]) hi[a] = value[a]; }
            target = vertices.length; vertices.push(value); remap.set(source, target);
          }
          face.push(target);
        }
        if (new Set(face).size !== 3) { count(skipped, 'degenerate-triangle'); continue; }
        if (determinant < 0) face.reverse();
        faces.push(face);
      }
      if (!faces.length) return;
      vertexTotal += vertices.length; faceTotal += faces.length;
      const entity = entityOf(node), mat = materialInfo(groupMaterial);
      const bounds = vertices.reduce((b, v) => { for (let a = 0; a < 3; a++) { b.min[a] = Math.min(b.min[a], v[a]); b.max[a] = Math.max(b.max[a], v[a]); } return b; },
        { min: [Infinity, Infinity, Infinity], max: [-Infinity, -Infinity, -Infinity] });
      meshes.push({
        name: `${entity.role}:${entity.id || 'none'}:${meshes.length}`, entity, level: levelOf(node),
        source: { type: node.type, name: node.name || null, instance: instanceIndex, mirrored: determinant < 0 },
        material: mat, vertices, faces, bounds,
      });
    }

    // Exclusiones por nodo concreto, decididas por quien llama y declaradas (p. ej. el suelo decorativo del visor).
    // Se pasan como Map(nodo → motivo) para no tener que marcar ni mutar objetos de la escena.
    const excludeNodes = o.excludeNodes instanceof Map ? o.excludeNodes : new Map();
    function visit(node) {
      if (!node.visible) { count(excluded, 'hidden'); return; }
      if (excludeNodes.has(node)) { count(excluded, excludeNodes.get(node)); return; }
      const u = node.userData || {};
      for (const [key, reason] of excludeUser) if (u[key] !== undefined && u[key] !== null && u[key] !== false) { count(excluded, reason); return; }
      for (const [name, reason] of EXCLUDE_NAMES) if (node.name === name) { count(excluded, reason); return; }
      if (node.isSkinnedMesh) fail('ANIMATED', 'This scene contains skinned geometry that cannot be exported.');
      if (node.isMesh) {
        if (Array.isArray(node.morphTargetInfluences) && node.morphTargetInfluences.some(v => v !== 0)) fail('ANIMATED', 'This scene contains actively morphed geometry that cannot be exported.');
        const g = node.geometry, base = node.matrixWorld.elements, mats = Array.isArray(node.material) ? node.material : null;
        const ranges = mats && g.groups && g.groups.length
          ? g.groups.map(gr => ({ start: Math.max(gr.start, g.drawRange.start), count: Math.min(gr.start + gr.count, g.drawRange.start + g.drawRange.count) - Math.max(gr.start, g.drawRange.start), material: mats[gr.materialIndex] })).filter(r => r.count > 0)
          : [{ start: g.drawRange.start, count: g.drawRange.count, material: mats ? mats[0] : node.material }];
        if (node.isInstancedMesh) {
          if (instanceTotal + node.count > limits.instances) fail('INSTANCE_BUDGET', 'Scene exceeds the instance budget.');
          instanceTotal += node.count;
          const arr = node.instanceMatrix.array;
          for (let i = 0; i < node.count; i++) {
            const m = multiply(base, Array.prototype.slice.call(arr, i * 16, i * 16 + 16));
            for (const r of ranges) emit(node, m, r.material, r, i);
          }
        } else for (const r of ranges) emit(node, base, r.material, r, null);
      } else if (node.isLine || node.isLineSegments || node.isPoints || node.isSprite) count(skipped, node.isSprite ? 'sprite' : node.isPoints ? 'points' : 'line');
      for (const child of node.children || []) visit(child);
    }
    visit(root);
    if (!meshes.length) fail('EMPTY', 'There is no displayed geometry to export.');

    if (o.supportSlab) { // derivado declarado (opción del donante): una losa neutra bajo la envolvente con 20 cm de margen
      const m = 0.2, y0 = lo[1] - 0.1, y1 = lo[1], x0 = lo[0] - m, x1 = hi[0] + m, z0 = lo[2] - m, z1 = hi[2] + m;
      const v = [[x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0], [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]].map(p => p.map(round));
      const f = [[0, 3, 2], [0, 2, 1], [4, 5, 6], [4, 6, 7], [0, 1, 5], [0, 5, 4], [3, 7, 6], [3, 6, 2], [0, 4, 7], [0, 7, 3], [1, 2, 6], [1, 6, 5]];
      meshes.push({ name: `support:none:${meshes.length}`, entity: { id: null, role: 'derived-support' }, level: null, source: { type: 'derived', name: 'support-slab', instance: null, mirrored: false },
        material: { kind: 'surface', type: 'derived', name: 'support', color: null, roughness: null, metalness: null, opacity: 1, transparent: false, hasMap: false, hasNormalMap: false },
        vertices: v, faces: f, bounds: { min: v[0], max: v[6] } });
    }

    const roles = {}; for (const m of meshes) roles[m.entity.role] = (roles[m.entity.role] || 0) + 1;
    const entities = [...new Set(meshes.filter(m => m.entity.id).map(m => m.entity.role + ':' + m.entity.id))].sort();
    return {
      schema: SCHEMA, version: VERSION, status: 'experimental-lab',
      representation: 'observed-visual-snapshot', contractual: false,
      units: 'metres', axes: 'three-y-up', unitsToMetresApplied: k,
      scope: o.scope || null, frame: o.frame || null,
      policy: { excludedUserData: excludeUser.map(([key, reason]) => ({ key, reason })), excludedNames: EXCLUDE_NAMES.map(([name, reason]) => ({ name, reason })),
        surfacesOnly: 'Mesh and InstancedMesh triangles; lines, points and sprites skipped', supportSlab: !!o.supportSlab, textures: 'never copied; hasMap declared' },
      stats: { meshes: meshes.length, vertices: vertexTotal, faces: faceTotal, instancesExpanded: instanceTotal, roles, entities: entities.length,
        bounds: { min: lo.map(round), max: hi.map(round) } },
      excluded, skipped, entities, meshes,
    };
  }

  /** Serialización canónica y acotada (bytes deterministas). */
  function toJSON(doc, limits) {
    const json = JSON.stringify(doc);
    const bytes = typeof TextEncoder !== 'undefined' ? new TextEncoder().encode(json).length : Buffer.byteLength(json);
    if (bytes > ((limits && limits.bytes) || LIMITS.bytes)) fail('BYTES', 'Scene exceeds 64 MiB.');
    return json;
  }

  /** Vista compatible con el contrato del donante `openplan3d-render-scene` v1 (KEEP del contrato). */
  function toOpenPlan3D(doc) {
    const kind = m => (m.entity.role === 'wall' ? 'wall' : (m.entity.role === 'room-slab' || m.entity.role === 'room' || m.entity.role === 'derived-support') ? 'floor' : 'proxy');
    return { schema: 'openplan3d-render-scene', version: 1, coordinates: 'arkit-metres-y-up', geometry: 'edited-web-preview', scope: doc.scope === 'stacked-levels' ? 'stacked-floors' : 'active-floor',
      limitations: ['Converted from a RUBIK observed-scene snapshot; see its manifest for entity correspondence.'],
      meshes: doc.meshes.filter(m => m.material.kind !== 'glass').map((m, i) => ({ name: `${kind(m)}-${i}`, material: kind(m), vertices: m.vertices, faces: m.faces })) };
  }

  return Object.freeze({ SCHEMA, VERSION, LIMITS, capture, toJSON, toOpenPlan3D, _internal: { multiply, det3, apply, entityOf } });
});
