/* RUBIK SOTA · Escena 3D → Blender (OP-10, candidata de integración). Núcleo puro de captura y codificación.
 *
 * Origen: SCULPT OP-10 `labs/sculpt/op-10/src/scene-capture-core.js` (0.1.0-lab, 2.038 comprobaciones A↔B sin fallos), escultura
 * de openPlan3D@771c9e1 `src/lib/utils/portableRenderScene.ts` (MIT, © 2026 theLodgeStudio; copia inmutable y hashes en
 * labs/sculpt/op-10/upstream/). Sin dependencia de `three`: lee los objetos por su forma.
 *
 * Qué añade la candidata 1.0.0 respecto al laboratorio:
 *  - C2 · identidad de huecos (`userData.openingId` → rol `opening`) y de luminarias (`userData.fixture` → rol `fixture`).
 *  - Normales de vértice transformadas (matriz normal), para que Blender sombree igual que el visor.
 *  - C7 · `view`: pose de cámara y luz del visor declaradas en la captura (no se inventan; null si no se pasan).
 *  - C4 · `toGLB`: el mismo contenedor GLB 2.0 que `scripts/interop/glb.cjs#pack` (bytes idénticos, comprobado en pruebas),
 *    un nodo por malla observada con `extras` de identidad, sin extensiones, sin texturas ni imágenes.
 *  - C3 · `coincidentFaces`: detector de caras coplanarias superpuestas (defecto de trazado de rayos).
 *
 * Lo capturado es una OBSERVACIÓN VISUAL de la escena en un instante, no geometría contractual: la autoridad sigue siendo
 * FloorPlanProjectV1 y el exportador canónico del proyecto sigue siendo scripts/interop/export.cjs. No muta nada.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.RubikSceneCapture = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const SCHEMA = 'rubik-sota.observed-scene', VERSION = '1.0.0';
  // Perfil RUBIK medido en el laboratorio (docs/04): el del donante (300 k) rechaza el ejemplo con 46 muebles.
  const LIMITS = Object.freeze({ meshes: 20000, vertices: 1500000, faces: 1500000, instances: 50000, bytes: 128 * 1024 * 1024, coordinateMetres: 10000 });

  const EXCLUDE_USERDATA = Object.freeze([
    ['renderExclude', 'excluded-by-marker'],
    ['presentationOutline', 'presentation-outline'],
    ['presentationSection', 'presentation-section'],
    ['sectionCap', 'section-cap'],
    ['contactRoomId', 'contact-shadow-decal'],
    ['territorialContext', 'territorial-context'],
  ]);
  const EXCLUDE_NAMES = Object.freeze([
    ['smart-furnishing-preview', 'unapplied-proposal'],
  ]);
  // Ancestro más cercano con ID canónico. En un mismo nodo, el orden de esta lista decide.
  const ENTITY_KEYS = Object.freeze([
    ['fid', 'object'], ['r02aItem', 'ceiling-element'], ['r02aCurtain', 'ceiling-element'], ['door', 'opening-leaf'],
    ['openingId', 'opening'], ['fixture', 'fixture'], ['wallId', 'wall'], ['slabRoom', 'room-slab'], ['ceilRoom', 'ceiling'],
    ['roomId', 'room'], ['room', 'room'], ['stairId', 'stair'], ['roof', 'roof'], ['exteriorVolume', 'exterior'], ['levelId', 'level'],
  ]);

  function fail(code, message) { const e = new Error(message); e.code = code; throw e; }
  const round = v => { const r = Math.round(v * 1e6) / 1e6; return Object.is(r, -0) ? 0 : r; };

  function multiply(a, b) {
    const o = new Array(16);
    for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) {
      let s = 0; for (let k = 0; k < 4; k++) s += a[k * 4 + r] * b[c * 4 + k]; o[c * 4 + r] = s;
    }
    return o;
  }
  function det3(m) {
    return m[0] * (m[5] * m[10] - m[9] * m[6]) - m[4] * (m[1] * m[10] - m[9] * m[2]) + m[8] * (m[1] * m[6] - m[5] * m[2]);
  }
  function apply(m, x, y, z) {
    const w = m[3] * x + m[7] * y + m[11] * z + m[15] || 1;
    return [(m[0] * x + m[4] * y + m[8] * z + m[12]) / w, (m[1] * x + m[5] * y + m[9] * z + m[13]) / w, (m[2] * x + m[6] * y + m[10] * z + m[14]) / w];
  }
  // Matriz normal (inversa traspuesta de la parte lineal), en filas: n' = N · n.
  function normalMatrix(m) {
    const a = m[0], b = m[4], c = m[8], d = m[1], e = m[5], f = m[9], g = m[2], h = m[6], i = m[10];
    const A = e * i - f * h, B = -(d * i - f * g), C = d * h - e * g, D = -(b * i - c * h), E = a * i - c * g, F = -(a * h - b * g), G = b * f - c * e, H = -(a * f - c * d), I = a * e - b * d;
    const det = a * A + b * B + c * C;
    return [A / det, B / det, C / det, D / det, E / det, F / det, G / det, H / det, I / det]; // = (M⁻¹)ᵀ en filas
  }
  function applyNormal(n, x, y, z) {
    const v = [n[0] * x + n[1] * y + n[2] * z, n[3] * x + n[4] * y + n[5] * z, n[6] * x + n[7] * y + n[8] * z], l = Math.hypot(v[0], v[1], v[2]);
    return l > 1e-12 ? v.map(t => round(t / l)) : null;
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
    const emissive = m.emissive && typeof m.emissiveIntensity === 'number' && m.emissiveIntensity > 0 ? hex(m.emissive) : null;
    return {
      kind: glass ? 'glass' : (m.isShaderMaterial ? 'shader' : 'surface'), type: m.type || null, name: m.name || null,
      color: hex(m.color), roughness: typeof m.roughness === 'number' ? round(m.roughness) : null,
      metalness: typeof m.metalness === 'number' ? round(m.metalness) : null,
      opacity: typeof m.opacity === 'number' ? round(m.opacity) : 1, transparent: !!m.transparent,
      emissive: emissive && emissive !== '#000000' ? emissive : null,
      // Cara visible: el visor (WebGL) descarta la cara trasera de los materiales de una cara; Blender debe reproducirlo.
      side: m.side === 2 ? 'double' : m.side === 1 ? 'back' : 'front',
      hasMap: !!m.map, hasNormalMap: !!m.normalMap,
    };
  }

  /** Captura la escena visible. `root` es la escena (o un subárbol). No muta nada. */
  function capture(root, options) {
    const o = options || {};
    if (typeof o.unitsToMetres !== 'number' || !(o.unitsToMetres > 0)) fail('UNITS', 'unitsToMetres is required and must be positive (RUBIK viewer: 1).');
    const k = o.unitsToMetres, limits = Object.assign({}, LIMITS, o.limits || {}), withNormals = o.normals !== false;
    const excludeUser = o.includeTerritory ? EXCLUDE_USERDATA.filter(([key]) => key !== 'territorialContext') : EXCLUDE_USERDATA;
    const meshes = [], excluded = {}, skipped = {};
    let vertexTotal = 0, faceTotal = 0, instanceTotal = 0;
    const lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
    const count = (bag, reason) => { bag[reason] = (bag[reason] || 0) + 1; };
    if (typeof root.updateMatrixWorld === 'function') root.updateMatrixWorld(true);

    function emit(node, matrix, groupMaterial, range, instanceIndex) {
      const geometry = node.geometry, position = geometry && geometry.getAttribute && geometry.getAttribute('position');
      if (!position || position.itemSize !== 3) fail('VERTEX_DATA', 'A mesh has unsupported vertex data.');
      const normal = withNormals && geometry.getAttribute('normal');
      const index = geometry.getIndex ? geometry.getIndex() : null, total = index ? index.count : position.count;
      const start = range.start, end = Math.min(total, range.start + range.count);
      if (!Number.isInteger(start) || start < 0 || start % 3 || !Number.isInteger(end) || (end - start) % 3) fail('DRAW_RANGE', 'A mesh has an unsupported triangle draw range.');
      if (start >= end) return;
      const determinant = det3(matrix);
      if (!Number.isFinite(determinant) || Math.abs(determinant) < 1e-12) fail('TRANSFORM', 'A mesh has an invalid transform.');
      if (meshes.length >= limits.meshes || faceTotal + (end - start) / 3 > limits.faces) fail('FACE_BUDGET', 'Scene exceeds the geometry budget.');
      const nm = normal && normal.itemSize === 3 ? normalMatrix(matrix) : null;
      const vertices = [], normals = nm ? [] : null, faces = [], remap = new Map();
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
            if (normals) normals.push(applyNormal(nm, normal.getX(source), normal.getY(source), normal.getZ(source)) || [0, 1, 0]);
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
      const row = {
        name: `${entity.role}:${entity.id || 'none'}:${meshes.length}`, entity, level: levelOf(node),
        source: { type: node.type, name: node.name || null, instance: instanceIndex, mirrored: determinant < 0 },
        material: mat, vertices, faces, bounds,
      };
      if (normals) row.normals = normals;
      meshes.push(row);
    }

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

    if (o.supportSlab) {
      const m = 0.2, y0 = lo[1] - 0.1, y1 = lo[1], x0 = lo[0] - m, x1 = hi[0] + m, z0 = lo[2] - m, z1 = hi[2] + m;
      const v = [[x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0], [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]].map(p => p.map(round));
      const f = [[0, 3, 2], [0, 2, 1], [4, 5, 6], [4, 6, 7], [0, 1, 5], [0, 5, 4], [3, 7, 6], [3, 6, 2], [0, 4, 7], [0, 7, 3], [1, 2, 6], [1, 6, 5]];
      meshes.push({ name: `support:none:${meshes.length}`, entity: { id: null, role: 'derived-support' }, level: null, source: { type: 'derived', name: 'support-slab', instance: null, mirrored: false },
        material: { kind: 'surface', type: 'derived', name: 'support', color: null, roughness: null, metalness: null, opacity: 1, transparent: false, emissive: null, hasMap: false, hasNormalMap: false },
        vertices: v, faces: f, bounds: { min: v[0], max: v[6] } });
    }

    const roles = {}; for (const m of meshes) roles[m.entity.role] = (roles[m.entity.role] || 0) + 1;
    const entities = [...new Set(meshes.filter(m => m.entity.id).map(m => m.entity.role + ':' + m.entity.id))].sort();
    return {
      schema: SCHEMA, version: VERSION, status: 'integration-candidate',
      representation: 'observed-visual-snapshot', contractual: false,
      units: 'metres', axes: 'three-y-up', unitsToMetresApplied: k,
      scope: o.scope || null, frame: o.frame || null, view: sanitizeView(o.view),
      policy: { excludedUserData: excludeUser.map(([key, reason]) => ({ key, reason })), excludedNames: EXCLUDE_NAMES.map(([name, reason]) => ({ name, reason })),
        surfacesOnly: 'Mesh and InstancedMesh triangles; lines, points and sprites skipped', supportSlab: !!o.supportSlab, textures: 'never copied; hasMap declared',
        normals: withNormals ? 'vertex normals transformed by the normal matrix' : 'not captured' },
      stats: { meshes: meshes.length, vertices: vertexTotal, faces: faceTotal, instancesExpanded: instanceTotal, roles, entities: entities.length,
        unlinked: roles.unlinked || 0, bounds: { min: lo.map(round), max: hi.map(round) } },
      excluded, skipped, entities, meshes,
    };
  }

  // C7 · solo números y enumeraciones conocidas: nunca texto libre ni URL en la salida.
  function sanitizeView(v) {
    if (!v) return null;
    const nums = (a, n) => Array.isArray(a) && a.length === n && a.every(Number.isFinite) ? a.map(round) : null;
    const num = x => Number.isFinite(x) ? round(x) : null, hex = x => typeof x === 'string' && /^#[0-9a-f]{6}$/i.test(x) ? x.toLowerCase() : null;
    const out = { camera: null, light: null };
    if (v.camera) {
      const c = v.camera, position = nums(c.position, 3), quaternion = nums(c.quaternion, 4);
      if (position && quaternion) out.camera = { position, quaternion, target: nums(c.target, 3), fovDeg: num(c.fov), aspect: num(c.aspect), source: ['viewer', 'saved', 'presentation'].includes(c.source) ? c.source : 'viewer' };
    }
    if (v.light) {
      const l = v.light, s = l.sun || {}, h = l.hemi || {};
      out.light = { mode: l.night ? 'night' : 'day', hour: num(l.hour), exposure: num(l.exposure),
        sun: { direction: nums(s.direction, 3), color: hex(s.color), intensity: num(s.intensity) },
        hemi: { sky: hex(h.sky), ground: hex(h.ground), intensity: num(h.intensity) },
        background: hex(l.background), lamps: { on: !!(l.lamps && l.lamps.on), intensity: num(l.lamps && l.lamps.intensity), distance: num(l.lamps && l.lamps.distance), color: hex(l.lamps && l.lamps.color) } };
    }
    return out.camera || out.light ? out : null;
  }

  function toJSON(doc, limits) {
    const json = JSON.stringify(doc);
    const bytes = typeof TextEncoder !== 'undefined' ? new TextEncoder().encode(json).length : Buffer.byteLength(json);
    if (bytes > ((limits && limits.bytes) || LIMITS.bytes)) fail('BYTES', 'Scene exceeds the byte budget.');
    return json;
  }

  const srgbToLinear = c => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  const linearOf = hexColor => { const h = (hexColor || '#bfbfbf').slice(1); return [0, 2, 4].map(i => Math.round(srgbToLinear(parseInt(h.slice(i, i + 2), 16) / 255) * 1e6) / 1e6); };

  /** glTF 2.0 (JSON + binario) de una captura. Sin extensiones, sin imágenes; un nodo por malla con `extras` de identidad. */
  function toGLTF(doc, options) {
    const o = options || {};
    if (!doc || doc.schema !== SCHEMA || doc.units !== 'metres' || doc.axes !== 'three-y-up') fail('SCENE', 'Not an observed RUBIK scene in metres, Y up.');
    const chunks = [], views = [], accessors = [], materials = [], matIndex = new Map(), nodes = [], meshes = [];
    let byteLength = 0;
    function view(typed, target) {
      const bytes = new Uint8Array(typed.buffer, typed.byteOffset, typed.byteLength), pad = (4 - (byteLength % 4)) % 4;
      if (pad) { chunks.push(new Uint8Array(pad)); byteLength += pad; }
      views.push({ buffer: 0, byteOffset: byteLength, byteLength: bytes.length, target });
      chunks.push(bytes); byteLength += bytes.length; return views.length - 1;
    }
    function material(m) {
      const kind = m.kind || 'surface', color = m.color || null, rough = m.roughness == null ? 0.8 : m.roughness, metal = m.metalness == null ? 0 : m.metalness;
      const opacity = kind === 'glass' ? Math.min(m.opacity == null ? 0.3 : m.opacity, 1) : 1, double = kind === 'glass' || m.side === 'double' || m.side === 'back';
      const key = [kind, color, rough, metal, opacity, m.emissive || '', double ? 'double' : 'front'].join('|');
      if (matIndex.has(key)) return matIndex.get(key);
      const [r, g, b] = linearOf(color), def = { name: `rubik:${kind}:${color || 'none'}:${matIndex.size}`,
        pbrMetallicRoughness: { baseColorFactor: [r, g, b, opacity], metallicFactor: metal, roughnessFactor: rough },
        extras: { rubik_kind: kind, rubik_color: color, rubik_has_map: !!m.hasMap, rubik_viewer_type: m.type || null } };
      if (m.emissive) { def.emissiveFactor = linearOf(m.emissive); def.extras.rubik_emissive = m.emissive; }
      if (opacity < 1) def.alphaMode = 'BLEND';
      if (double) def.doubleSided = true; // si no, una cara (glTF por defecto), como en el visor
      materials.push(def); matIndex.set(key, materials.length - 1); return materials.length - 1;
    }
    // Un vacío por elemento identificado (rol:id): los muebles se llaman por su ID y, si se da `origins`, nacen en su origen de
    // plano (mismo punto que el nodo canónico de export.cjs); el resto, en el centro de su caja apoyado en su base.
    const children = [], groups = new Map(), origins = o.origins instanceof Map ? o.origins : new Map(), withRoot = o.sceneRoot !== false;
    const entityBounds = new Map();
    for (const m of doc.meshes) if (m.entity.id) { const k = m.entity.role + ':' + m.entity.id, b = entityBounds.get(k) || { min: [Infinity, Infinity, Infinity], max: [-Infinity, -Infinity, -Infinity] };
      for (let a = 0; a < 3; a++) { b.min[a] = Math.min(b.min[a], m.bounds.min[a]); b.max[a] = Math.max(b.max[a], m.bounds.max[a]); } entityBounds.set(k, b); }
    function parentOf(m) {
      if (!m.entity.id) return null; const k = m.entity.role + ':' + m.entity.id;
      if (groups.has(k)) return groups.get(k);
      const b = entityBounds.get(k), given = origins.get(k), t = Array.isArray(given) && given.length === 3 && given.every(Number.isFinite) ? given.map(round)
        : [round((b.min[0] + b.max[0]) / 2), round(b.min[1]), round((b.min[2] + b.max[2]) / 2)];
      const idx = nodes.push({ name: m.entity.role === 'object' ? m.entity.id : k, translation: t, children: [],
        extras: { rubik_id: m.entity.id, rubik_role: m.entity.role, rubik_level: m.level || '', rubik_origin: given ? 'project-plan' : 'bounds-base-centre' } }) - 1;
      children.push(idx); const g = { idx, t }; groups.set(k, g); return g;
    }
    for (const m of doc.meshes) {
      const c = [0, 1, 2].map(a => round((m.bounds.min[a] + m.bounds.max[a]) / 2));
      const pos = new Float32Array(m.vertices.length * 3), mn = [Infinity, Infinity, Infinity], mx = [-Infinity, -Infinity, -Infinity];
      m.vertices.forEach((v, i) => { for (let a = 0; a < 3; a++) { const t = Math.fround(v[a] - c[a]); pos[i * 3 + a] = t; if (t < mn[a]) mn[a] = t; if (t > mx[a]) mx[a] = t; } });
      const attributes = { POSITION: accessors.push({ bufferView: view(pos, 34962), componentType: 5126, count: m.vertices.length, type: 'VEC3', min: mn, max: mx }) - 1 };
      if (Array.isArray(m.normals) && m.normals.length === m.vertices.length) {
        const nrm = new Float32Array(m.normals.flat());
        attributes.NORMAL = accessors.push({ bufferView: view(nrm, 34962), componentType: 5126, count: m.normals.length, type: 'VEC3' }) - 1;
      }
      const small = m.vertices.length < 65536, idx = small ? new Uint16Array(m.faces.length * 3) : new Uint32Array(m.faces.length * 3);
      m.faces.forEach((f, i) => { idx[i * 3] = f[0]; idx[i * 3 + 1] = f[1]; idx[i * 3 + 2] = f[2]; });
      const indices = accessors.push({ bufferView: view(idx, 34963), componentType: small ? 5123 : 5125, count: idx.length, type: 'SCALAR' }) - 1;
      meshes.push({ name: m.name, primitives: [{ attributes, indices, material: material(m.material || {}), mode: 4 }] });
      const parent = parentOf(m), local = parent ? c.map((v, a) => round(v - parent.t[a])) : c;
      // La posición local se escribe respecto al centro de la malla (float32 preciso); la traslación del nodo la recoloca.
      const ni = nodes.push({ name: m.name, mesh: meshes.length - 1, translation: local,
        extras: { rubik_id: m.entity.id || '', rubik_role: m.entity.role, rubik_level: m.level || '', rubik_mesh: m.name, rubik_material_kind: (m.material && m.material.kind) || 'none' } }) - 1;
      if (parent) nodes[parent.idx].children.push(ni); else children.push(ni);
    }
    const sceneNodes = [];
    if (withRoot) sceneNodes.push(nodes.push({ name: 'RUBIK_scene', children, extras: { rubik_schema: SCHEMA, rubik_version: doc.version, rubik_scope: doc.scope || '' } }) - 1);
    else sceneNodes.push(...children);
    const cameras = [];
    const cam = doc.view && doc.view.camera;
    if (cam && cam.fovDeg && cam.aspect) {
      cameras.push({ name: 'RUBIK_camera', type: 'perspective', perspective: { yfov: round(cam.fovDeg * Math.PI / 180), aspectRatio: cam.aspect, znear: 0.05, zfar: 1000 } });
      sceneNodes.push(nodes.push({ name: 'RUBIK_camera', camera: 0, translation: cam.position, rotation: cam.quaternion, extras: { rubik_role: 'camera', rubik_camera_source: cam.source } }) - 1);
    }
    const gltf = {
      asset: { version: '2.0', generator: `RUBIK SOTA scene-capture ${VERSION}`, copyright: o.copyright || undefined },
      scene: 0,
      scenes: [{ name: 'RUBIK', nodes: sceneNodes, extras: {
        rubik_schema: SCHEMA, rubik_version: doc.version, rubik_representation: doc.representation, rubik_contractual: false,
        rubik_units: 'metres', rubik_axes_source: 'three-y-up (glTF Y up; Blender importer converts once)', rubik_scope: doc.scope || '',
        rubik_frame: JSON.stringify(doc.frame || null), rubik_view: JSON.stringify(doc.view || null), rubik_stats: JSON.stringify(doc.stats),
        rubik_manifest_sha256: o.manifestSha256 || '' } }],
      nodes, meshes, materials, accessors, bufferViews: views, buffers: [{ byteLength }],
    };
    if (cameras.length) gltf.cameras = cameras;
    if (gltf.asset.copyright === undefined) delete gltf.asset.copyright;
    const bin = new Uint8Array(byteLength); let at = 0; for (const ch of chunks) { bin.set(ch, at); at += ch.length; }
    return { gltf, bin };
  }

  // Mismo empaquetado que scripts/interop/glb.cjs#pack: JSON relleno con espacios, binario con ceros, alineación 4.
  function pack(gltf, bin) {
    const enc = new TextEncoder(), json = enc.encode(JSON.stringify(gltf)), jPad = (4 - json.length % 4) % 4, bPad = (4 - bin.length % 4) % 4;
    const jl = json.length + jPad, bl = bin.length + bPad, out = new Uint8Array(28 + jl + bl), dv = new DataView(out.buffer);
    out.set([0x67, 0x6c, 0x54, 0x46]); dv.setUint32(4, 2, true); dv.setUint32(8, out.length, true);
    dv.setUint32(12, jl, true); dv.setUint32(16, 0x4e4f534a, true); out.set(json, 20); out.fill(0x20, 20 + json.length, 20 + jl);
    dv.setUint32(20 + jl, bl, true); dv.setUint32(24 + jl, 0x004e4942, true); out.set(bin, 28 + jl);
    return out;
  }
  function toGLB(doc, options) {
    const { gltf, bin } = toGLTF(doc, options), out = pack(gltf, bin);
    const max = (options && options.limits && options.limits.bytes) || LIMITS.bytes;
    if (out.length > max) fail('BYTES', 'Scene exceeds the byte budget.');
    return out;
  }

  /** C3 · caras coplanarias superpuestas entre mallas distintas (z-fighting en el visor, manchas en trazado de rayos).
   *  sameFacing: mismo sentido de normal (defecto visible). opposite: caras enfrentadas (contacto, informativo). */
  function coincidentFaces(doc, options) {
    const o = options || {}, tol = o.toleranceM || 1e-4, minArea = o.minAreaM2 || 1e-6, buckets = new Map(), found = new Map();
    const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]], dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    const meshesIn = o.meshFilter ? doc.meshes.filter(o.meshFilter) : doc.meshes;
    meshesIn.forEach((m, mi) => m.faces.forEach(f => {
      const p = f.map(i => m.vertices[i]), n = cross(sub(p[1], p[0]), sub(p[2], p[0])), l = Math.hypot(...n);
      if (l < 1e-12) return; const u = n.map(v => v / l), s = u[0] < -1e-9 || (Math.abs(u[0]) <= 1e-9 && (u[1] < -1e-9 || (Math.abs(u[1]) <= 1e-9 && u[2] < 0))) ? -1 : 1;
      const cu = u.map(v => v * s), d = dot(cu, p[0]), key = cu.map(v => Math.round(v * 1000)).join(',') + '|' + Math.round(d / tol);
      if (!buckets.has(key)) buckets.set(key, []); buckets.get(key).push({ mi, p, u, cu, facing: s });
    }));
    // Área de superposición de dos triángulos coplanarios: recorte de Sutherland–Hodgman en el plano.
    function overlap(a, b) {
      const n = a.cu, ax = Math.abs(n[0]) > 0.9 ? [0, 1, 0] : [1, 0, 0], e1 = cross(n, ax), l1 = Math.hypot(...e1), u1 = e1.map(v => v / l1), u2 = cross(n, u1);
      const P = q => [dot(q, u1), dot(q, u2)], A = a.p.map(P), B = b.p.map(P), area = poly => poly.reduce((s, q, i) => { const r = poly[(i + 1) % poly.length]; return s + q[0] * r[1] - r[0] * q[1]; }, 0) / 2;
      const ccw = t => (area(t) < 0 ? t.slice().reverse() : t);
      let out = ccw(A); const clip = ccw(B);
      for (let i = 0; i < 3 && out.length; i++) {
        const c0 = clip[i], c1 = clip[(i + 1) % 3], inside = q => (c1[0] - c0[0]) * (q[1] - c0[1]) - (c1[1] - c0[1]) * (q[0] - c0[0]) >= -1e-12, input = out; out = [];
        for (let j = 0; j < input.length; j++) {
          const p = input[j], q = input[(j + 1) % input.length], pi = inside(p), qi = inside(q);
          if (pi) out.push(p);
          if (pi !== qi) { const dx = q[0] - p[0], dy = q[1] - p[1], ex = c1[0] - c0[0], ey = c1[1] - c0[1], den = ey * dx - ex * dy; if (Math.abs(den) > 1e-18) { const t = (ex * (p[1] - c0[1]) - ey * (p[0] - c0[0])) / den; out.push([p[0] + t * dx, p[1] + t * dy]); } }
        }
      }
      return out.length >= 3 ? Math.abs(area(out)) : 0;
    }
    const floorY = Number.isFinite(o.floorY) ? o.floorY : 0; // cota del suelo de la planta activa en el marco del visor
    const triArea = t => Math.hypot(...cross(sub(t.p[1], t.p[0]), sub(t.p[2], t.p[0]))) / 2;
    const matKey = m => { const x = m.material || {}; return [x.kind, x.color, x.roughness, x.metalness, x.opacity, x.emissive || ''].join('|'); };
    for (const list of buckets.values()) {
      if (list.length < 2 || list.length > 4000) continue; // cubos enormes (suelos teselados) no son pares de piezas
      for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) {
        const a = list[i], b = list[j]; if (a.mi === b.mi) continue;
        const ma = meshesIn[a.mi], mb = meshesIn[b.mi];
        if (o.sameEntityOnly !== false && (ma.entity.role !== mb.entity.role || ma.entity.id !== mb.entity.id)) continue;
        const ar = overlap(a, b); if (ar < minArea) continue;
        const same = a.facing === b.facing, k = [ma.name, mb.name].sort().join('|') + (same ? '|same' : '|opposite');
        const row = found.get(k) || { entity: ma.entity, meshes: [ma.name, mb.name].sort(), kind: same ? 'same-facing' : 'opposite-facing', materialsDiffer: matKey(ma) !== matKey(mb), areaM2: 0, hiddenAreaM2: 0, faces: 0 };
        if (same) { // ¿la pareja queda tapada por el contacto con una cara enfrentada de una tercera malla (p. ej. el cuerpo)?
          let cover = 0; for (const c of list) if (c.facing !== a.facing && c.mi !== a.mi && c.mi !== b.mi) cover += overlap(a, c);
          // Caras hacia abajo a cota de suelo: ninguna cámara (siempre sobre el suelo) puede verlas.
          const downAtFloor = a.u[1] < -0.99 && Math.abs(a.p[0][1] - floorY) <= tol;
          if (downAtFloor || cover >= Math.min(ar, triArea(a)) * 0.99) row.hiddenAreaM2 += ar;
        }
        row.areaM2 += ar; row.faces++; found.set(k, row);
      }
    }
    const rows = [...found.values()].map(r => ({ ...r, areaM2: round(r.areaM2), hiddenAreaM2: round(r.hiddenAreaM2), visibleAreaM2: round(r.areaM2 - r.hiddenAreaM2) }))
      .sort((x, y) => y.areaM2 - x.areaM2 || x.meshes.join().localeCompare(y.meshes.join()));
    const sameFacing = rows.filter(r => r.kind === 'same-facing'), minVisible = o.minVisibleAreaM2 || 1e-4;
    // Defecto: superficie visible, coincidente y con materiales distintos → manchas o parpadeo (z-fighting) según el motor.
    const defects = sameFacing.filter(r => r.materialsDiffer && r.visibleAreaM2 >= minVisible);
    return { sameFacing, defects, benignSameMaterial: sameFacing.filter(r => !r.materialsDiffer).length, hiddenByContact: sameFacing.filter(r => r.materialsDiffer && r.visibleAreaM2 < minVisible).length,
      opposite: rows.filter(r => r.kind === 'opposite-facing').length, toleranceM: tol, minVisibleAreaM2: minVisible };
  }

  function toOpenPlan3D(doc) {
    const kind = m => (m.entity.role === 'wall' ? 'wall' : (m.entity.role === 'room-slab' || m.entity.role === 'room' || m.entity.role === 'derived-support') ? 'floor' : 'proxy');
    return { schema: 'openplan3d-render-scene', version: 1, coordinates: 'arkit-metres-y-up', geometry: 'edited-web-preview', scope: doc.scope === 'stacked-levels' ? 'stacked-floors' : 'active-floor',
      limitations: ['Converted from a RUBIK observed-scene snapshot; see its manifest for entity correspondence.'],
      meshes: doc.meshes.filter(m => m.material.kind !== 'glass').map((m, i) => ({ name: `${kind(m)}-${i}`, material: kind(m), vertices: m.vertices, faces: m.faces })) };
  }

  return Object.freeze({ SCHEMA, VERSION, LIMITS, capture, toJSON, toGLTF, toGLB, pack, coincidentFaces, toOpenPlan3D, sanitizeView,
    _internal: { multiply, det3, apply, entityOf, normalMatrix } });
});
