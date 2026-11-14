/* UX-12 + UX-13 · Amueblamiento inteligente V1: núcleo puro (sin DOM, red, almacenamiento ni reloj).
 *
 * Genera una PROPUESTA de amueblamiento para UNA estancia a partir de su uso declarado, una densidad, una receta de
 * estilo y una semilla. Nunca modifica el proyecto: `generate` trabaja sobre la escena de FloorPlanPlacement y devuelve
 * datos; `apply` devuelve una COPIA con los muebles añadidos, tras volver a validarlo todo.
 *
 * Geometría: milímetros del proyecto, polígonos reales de la estancia (también en L), huella orientada de
 * FloorPlanTracing. Cada pose se valida con FloorPlanPlacement.problemsIn (estancia completa, escalera, muros,
 * barrido de puertas y otros muebles) contra los muebles existentes y los ya propuestos. Al aplicar, además, la
 * revisión de FloorPlanLayoutReview (solapes y contacto exacto con la hoja de las puertas) debe quedar limpia para
 * cada mueble nuevo.
 *
 * Distribución: reglas de composición comprensibles (cama con mesillas a los lados del cabecero; sofá con mesa de
 * centro delante y mueble de TV enfrente; mesa con sillas alrededor; escritorio con su silla), no colocación al azar.
 * La semilla solo elige entre composiciones igual de buenas, de forma reproducible.
 *
 * Es colocación geométrica, NO diseño profesional certificado: no se comprueban accesibilidad, evacuación, paso libre,
 * altura ni normativa. */
(function (root) {
  'use strict';
  const node = typeof module === 'object' && module.exports;
  const C = node ? require('./project-core.js') : root.FloorPlanCore;
  const T = node ? require('./tracing-core.js') : root.FloorPlanTracing;
  const P = node ? require('./furniture-placement.js') : root.FloorPlanPlacement;
  const R = node ? require('./layout-review.js') : root.FloorPlanLayoutReview;
  const G = node ? require('./generic-catalog.js') : root.FloorPlanGenericCatalog;

  const VERSION = 'sf-v1';
  const DENSITIES = Object.freeze(['low', 'medium', 'high']);
  const DENSITY_LABEL = Object.freeze({ low: 'Baja', medium: 'Media', high: 'Alta' });
  const NON_BLOCKING = new Set(['rug', 'acwall']);
  const EXACT_EPS = 1e-6; // mm: el umbral de solape de FloorPlanLayoutReview
  const CHECKED = Object.freeze(['la estancia completa (también en L)', 'los muros', 'el barrido de las puertas', 'la escalera y su hueco', 'los muebles existentes y los propuestos']);
  const NOT_CHECKED = Object.freeze(['accesibilidad', 'evacuación', 'paso libre o recorridos', 'altura libre', 'normativa', 'muebles de otras plantas']);
  const DISCLAIMER = 'Colocación geométrica orientativa, no diseño profesional certificado. No comprueba accesibilidad, evacuación, paso libre ni normativa.';

  // ── Catálogo: variantes con nombre en español; las medidas salen SIEMPRE del catálogo genérico (una sola fuente). ──
  const VARIANT_DEF = {
    sofa3: ['sofa', 2400, 'Sofá de tres plazas'], sofa2: ['sofa', 1700, 'Sofá de dos plazas'], cornersofa: ['cornersofa', 2800, 'Sofá rinconera'],
    armchair: ['armchair', 850, 'Sillón'], readingchair: ['armchair', 750, 'Butaca de lectura'], beanbag: ['beanbag', 800, 'Puf'],
    coffeetable: ['coffeetable', 1300, 'Mesa de centro'], sidetable: ['sidetable', 500, 'Mesa auxiliar'], tvstand: ['tvstand', 2400, 'Mueble de TV'],
    rug: ['rug', 2400, 'Alfombra'], floorlamp: ['floorlamp', 450, 'Lámpara de pie'], plant: ['plant', 500, 'Planta'], bigplant: ['plant', 700, 'Planta grande'],
    bed180: ['bed', 1800, 'Cama de matrimonio 180'], bed150: ['bed', 1500, 'Cama de matrimonio 150'], bed120: ['bed', 1200, 'Cama individual 120'],
    nightstand: ['nightstand', 450, 'Mesilla'], wardrobe200: ['wardrobe', 2000, 'Armario 200'], wardrobe120: ['wardrobe', 1200, 'Armario 120'],
    dresser: ['dresser', 1000, 'Cómoda'], desk120: ['desk', 1200, 'Escritorio 120'], desk160: ['desk', 1600, 'Escritorio 160'], chair: ['chair', 450, 'Silla'],
    officechair: ['officechair', 620, 'Silla de trabajo'], bookshelf80: ['bookshelf', 800, 'Estantería 80'], bookshelf160: ['bookshelf', 1600, 'Estantería 160'],
    table140: ['table', 1400, 'Mesa de comedor 140'], table180: ['table', 1800, 'Mesa de comedor 180'], roundtable: ['roundtable', 1000, 'Mesa redonda'],
    sideboard: ['cabinet', 1600, 'Aparador']
  };
  function catalogItem(type, width) {
    for (const g of G.groups) for (const it of g.items) if (it[0] === type && it[2] === width) return it;
    return null;
  }
  // Variante → {variant,type,label,w,d,h} desde el catálogo; null si el recurso no existe (no se inventa).
  function variant(id) {
    const def = VARIANT_DEF[id]; if (!def) return null;
    const it = catalogItem(def[0], def[1]); if (!it) return null;
    return { variant: id, type: def[0], label: def[2], w: it[2], d: it[3], h: it[5] };
  }

  // ── Usos soportados en V1 y su programa de piezas por densidad ──
  const USES = Object.freeze({
    living: { label: 'Salón', anchor: 'sofa' },
    bedroom: { label: 'Dormitorio', anchor: 'bed' },
    dining: { label: 'Comedor', anchor: 'table' },
    office: { label: 'Despacho', anchor: 'desk' }
  });
  const USE_FROM_FAMILY = { living: 'living', bedroom: 'bedroom', dining: 'dining', office: 'office' };

  // ── UX-13 · recetas de estilo: piezas (variantes con alternativas), paleta y criterios de coherencia ──
  const RECIPES = Object.freeze({
    nordico: {
      id: 'nordico', label: 'Nórdico claro',
      summary: 'Maderas claras, textiles grises y blancos; piezas amplias y pocas, con una planta grande.',
      pieces: { sofa: ['sofa3', 'sofa2'], armchair: ['armchair', 'readingchair'], plant: ['bigplant', 'plant'], bed: { low: ['bed120', 'bed150'], medium: ['bed180', 'bed150', 'bed120'], high: ['bed180', 'bed150', 'bed120'] },
        wardrobe: ['wardrobe200', 'wardrobe120'], table: ['table180', 'table140', 'roundtable'], desk: ['desk160', 'desk120'], bookshelf: ['bookshelf160', 'bookshelf80'] },
      palette: { wood: '#e3d2b4', textile: '#d9dde1', accent: '#8fa9bf', metal: '#2f3236', green: '#9dbb8c' },
      coherence: ['Todas las maderas comparten un tono claro', 'Textiles en grises y blancos', 'Un único color de acento (azul niebla)'],
      floorSuggestion: 'Suelo de roble claro'
    },
    urbano: {
      id: 'urbano', label: 'Urbano compacto',
      summary: 'Nogal oscuro y grafito; piezas compactas (sofá de dos plazas, mesa redonda, puf) que liberan suelo.',
      pieces: { sofa: ['sofa2', 'sofa3'], armchair: ['beanbag', 'readingchair'], plant: ['plant'], bed: { low: ['bed120'], medium: ['bed150', 'bed120'], high: ['bed150', 'bed120'] },
        wardrobe: ['wardrobe120', 'wardrobe200'], table: ['roundtable', 'table140'], desk: ['desk120'], bookshelf: ['bookshelf80'] },
      palette: { wood: '#6b4f3a', textile: '#4a4f55', accent: '#c46a3a', metal: '#1f2124', green: '#7f9c6e' },
      coherence: ['Una sola madera oscura (nogal)', 'Textiles en grafito', 'Acento cobre en piezas pequeñas'],
      floorSuggestion: 'Suelo de hormigón pulido'
    },
    calido: {
      id: 'calido', label: 'Mediterráneo cálido',
      summary: 'Arena, terracota y verde; sofá rinconera si cabe, butacas y mesa grande para reunir.',
      pieces: { sofa: ['cornersofa', 'sofa3', 'sofa2'], armchair: ['armchair', 'readingchair'], plant: ['bigplant', 'plant'], bed: { low: ['bed150', 'bed120'], medium: ['bed180', 'bed150', 'bed120'], high: ['bed180', 'bed150', 'bed120'] },
        wardrobe: ['wardrobe200', 'wardrobe120'], table: ['table180', 'table140', 'roundtable'], desk: ['desk120', 'desk160'], bookshelf: ['bookshelf80', 'bookshelf160'] },
      palette: { wood: '#c9a27a', textile: '#e6d3b3', accent: '#b5653a', metal: '#5b4636', green: '#7fa36b' },
      coherence: ['Maderas de tono miel', 'Textiles arena', 'Acento terracota'],
      floorSuggestion: 'Suelo de barro cocido'
    }
  });
  // Qué color de la paleta lleva cada tipo de pieza (la receta cambia el color guardado en `color`, campo canónico).
  const MATERIAL_OF = { sofa: 'textile', cornersofa: 'textile', armchair: 'accent', beanbag: 'accent', coffeetable: 'wood', sidetable: 'wood', tvstand: 'wood',
    rug: 'textile', floorlamp: 'metal', plant: 'green', bed: 'textile', nightstand: 'wood', wardrobe: 'wood', dresser: 'wood', desk: 'wood', chair: 'wood',
    officechair: 'metal', bookshelf: 'wood', table: 'wood', roundtable: 'wood', cabinet: 'wood' };
  // Lo que ninguna receta V1 aplica por falta de recursos o mecanismo (se dice, no se simula).
  const NOT_APPLIED = ['Acabado de suelo: la receta lo sugiere, pero V1 no cambia suelos (se conserva el actual).',
    'Modelos 3D comerciales: el catálogo propio BIB-01 no está completado; se usan las piezas genéricas de RUBIK.',
    'Textiles, cuadros y pequeña decoración: no hay recursos en el catálogo genérico.'];

  // Comprueba una receta (también una recibida de fuera): piezas que existan en el catálogo y colores válidos.
  function checkRecipe(recipe) {
    const problems = [];
    if (!recipe || typeof recipe !== 'object') return ['Receta no válida.'];
    for (const [k, v] of Object.entries(recipe.palette || {})) if (!/^#[0-9a-fA-F]{6}$/.test(v)) problems.push(`Color «${k}» no válido: ${v}`);
    for (const k of new Set(Object.values(MATERIAL_OF))) if (!recipe.palette?.[k]) problems.push(`Falta el color «${k}» en la paleta.`);
    return problems;
  }

  // ── Utilidades deterministas ──
  function hash(str) { let h = 0x811c9dc5; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 0x01000193); } return (h >>> 0).toString(36); }
  function rng(seedText) { let a = parseInt(hash(seedText), 36) >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  // Revisión del proyecto: cualquier cambio (salvo la fecha de guardado) invalida una propuesta.
  function revision(project) { const { updatedAt, ...rest } = project || {}; return VERSION + '-' + hash(JSON.stringify(rest)); }
  const box = P2 => { let a = Infinity, b = Infinity, c = -Infinity, d = -Infinity; for (const p of P2) { a = Math.min(a, p.x); b = Math.min(b, p.y); c = Math.max(c, p.x); d = Math.max(d, p.y); } return [a, b, c, d]; };
  function inPoly(p, poly) { let r = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const a = poly[i], b = poly[j]; if ((a.y > p.y) !== (b.y > p.y) && p.x < (b.x - a.x) * (p.y - a.y) / (b.y - a.y) + a.x) r = !r; } return r; }
  const norm360 = d => ((Math.round(d) % 360) + 360) % 360;
  // Punto en el marco local de una pieza (x a lo ancho, y a lo hondo; −y es su espalda) → mundo.
  function toWorld(pose, lx, ly) { const a = pose.rotationDeg * Math.PI / 180, c = Math.cos(a), s = Math.sin(a); return { x: pose.position.x + lx * c - ly * s, y: pose.position.y + lx * s + ly * c }; }
  function frontDir(rot) { const a = rot * Math.PI / 180; return { x: -Math.sin(a), y: Math.cos(a) }; }

  // Estancia objetivo y diagnósticos previos (sin estancia, escala, solape con otra estancia).
  function roomInfo(project, sc, roomId) {
    const room = sc.rooms.find(r => r.id === roomId); if (!room) return null;
    const area = Math.abs(room.poly.reduce((s, p, i) => { const q = room.poly[(i + 1) % room.poly.length]; return s + p.x * q.y - q.x * p.y; }, 0) / 2);
    // Estancia ambigua: parte de su superficie pertenece también a otra estancia (muestreo regular de 100 mm).
    const [x0, y0, x1, y1] = box(room.poly); let shared = 0, total = 0; const others = sc.rooms.filter(r => r.id !== roomId);
    for (let x = x0 + 50; x < x1; x += 100) for (let y = y0 + 50; y < y1; y += 100) { const p = { x, y }; if (!inPoly(p, room.poly)) continue; total++; if (others.some(o => inPoly(p, o.poly))) shared++; }
    const source = project.rooms.find(r => r.id === roomId);
    return { room, area, sharedRatio: total ? shared / total : 0, family: C.roomFamily(source), name: source.name || roomId };
  }

  // Escena de validación: la de FloorPlanPlacement más los muebles que se van proponiendo (incremental, sin copiar).
  function addToScene(sc, o) { if (NON_BLOCKING.has(o.type)) return; const poly = T.footprint(o); sc.furniture.push({ id: o.id, name: o.name, type: o.type, poly, box: box(poly) }); }
  const removeFromScene = (sc, id) => { const i = sc.furniture.findIndex(f => f.id === id); if (i >= 0) sc.furniture.splice(i, 1); };
  function check(sc, pose, roomId) {
    const list = P.problemsIn(sc, pose, roomId, P.TOLERANCE_MM, false);
    // Atribución inequívoca: el centro de la pieza está en esta estancia y en ninguna otra.
    const at = P.roomsAt(sc, pose.position); if (at.length !== 1 || at[0].id !== roomId) list.push({ kind: 'room', detail: 'Su centro no queda solo en esta estancia.' });
    // Entre muebles, el MISMO criterio que la revisión exacta al aplicar (FloorPlanLayoutReview: solape > 1e-6 mm), no la
    // tolerancia de 1 mm de la búsqueda: si no, en estancias giradas una pieza pegada a otra puede solapar unas décimas
    // tras redondear a mm enteros, la propuesta se mostraría como válida y «Aplicar» la rechazaría.
    if (!list.length && !NON_BLOCKING.has(pose.type)) {
      const fp = T.footprint(pose), fb = box(fp);
      for (const f of sc.furniture) {
        if (f.id === pose.id || fb[0] >= f.box[2] || f.box[0] >= fb[2] || fb[1] >= f.box[3] || f.box[1] >= fb[3]) continue;
        if (!R.exclusion(pose, f) && R.penetration(fp, f.poly) > EXACT_EPS) { list.push({ kind: 'furniture', id: f.id, detail: `Solapa «${f.name}».` }); break; }
      }
    }
    return list;
  }

  // Poses con la espalda contra cada tramo del contorno de la estancia (también tramos de una estancia en L).
  function wallPoses(room, w, d, stepMm = 50) {
    const out = [], poly = room.poly;
    for (let i = 0; i < poly.length; i++) {
      const A = poly[i], B = poly[(i + 1) % poly.length], L = Math.hypot(B.x - A.x, B.y - A.y); if (L < w) continue;
      const u = { x: (B.x - A.x) / L, y: (B.y - A.y) / L }, mid = { x: (A.x + B.x) / 2, y: (A.y + B.y) / 2 };
      let n = { x: -u.y, y: u.x }; if (!inPoly({ x: mid.x + n.x * 20, y: mid.y + n.y * 20 }, poly)) n = { x: u.y, y: -u.x };
      const rot = norm360(Math.atan2(-n.x, n.y) * 180 / Math.PI);
      const span = L - w, count = Math.max(1, Math.floor(span / stepMm)), seen = new Set();
      for (let k = 0; k <= count; k++) {
        const s = w / 2 + (count ? span * k / count : span / 2);
        const c = { x: Math.round(A.x + u.x * s + n.x * d / 2), y: Math.round(A.y + u.y * s + n.y * d / 2) }, key = c.x + ',' + c.y; if (seen.has(key)) continue; seen.add(key);
        out.push({ edge: i, edgeLength: L, along: s, offCentre: Math.abs(s - L / 2), position: c, rotationDeg: rot, normal: n });
      }
      // Centro exacto del tramo (si el paso no cae justo en él).
      const cc = { x: Math.round(mid.x + n.x * d / 2), y: Math.round(mid.y + n.y * d / 2) };
      if (!seen.has(cc.x + ',' + cc.y)) out.push({ edge: i, edgeLength: L, along: L / 2, offCentre: 0, position: cc, rotationDeg: rot, normal: n });
    }
    return out;
  }
  // Distancia de un punto a las puertas (para no bloquear el acceso).
  function doorDistance(sc, p) { let best = Infinity; for (const dr of sc.doors) { const [a, b, c, d] = dr.box; const dx = Math.max(a - p.x, 0, p.x - c), dy = Math.max(b - p.y, 0, p.y - d); best = Math.min(best, Math.hypot(dx, dy)); } return best; }

  // Intenta una pieza en una lista de poses: la primera válida gana; si ninguna, devuelve los motivos acumulados.
  function firstValid(sc, roomId, base, poses) {
    const blockers = {};
    for (const pose of poses) {
      const o = { ...base, position: { x: Math.round(pose.position.x), y: Math.round(pose.position.y) }, rotationDeg: norm360(pose.rotationDeg) };
      const list = check(sc, o, roomId);
      if (!list.length) return { ok: true, object: o, pose };
      for (const p of list) blockers[p.kind] = (blockers[p.kind] || 0) + 1;
    }
    return { ok: false, blockers };
  }
  const KIND_TEXT = { room: 'los límites de la estancia', wall: 'los muros', door: 'el barrido de las puertas', stair: 'la escalera', furniture: 'otros muebles' };
  function blockText(blockers) { const k = Object.entries(blockers || {}).sort((a, b) => b[1] - a[1]).map(([x]) => KIND_TEXT[x]).filter(Boolean); return k.length ? 'No cabe sin invadir ' + k.slice(0, 3).join(', ') + '.' : 'No hay ninguna posición posible.'; }
  // Desplazamientos alrededor de una pose ideal, a lo largo de un eje local (0, ±50, ±100… mm), en orden fijo.
  function slide(pose, axis, maxMm = 600, stepMm = 50) { const out = [pose]; for (let k = stepMm; k <= maxMm; k += stepMm) for (const sgn of [1, -1]) out.push({ ...pose, position: { x: pose.position.x + axis.x * k * sgn, y: pose.position.y + axis.y * k * sgn } }); return out; }
  // Búsqueda libre en anillos alrededor de un punto (plantas, lámparas, mesas centrales).
  function rings(near, rot, maxMm = 2000, stepMm = 50) { const out = []; for (let k = 0; k * stepMm <= maxMm; k++) { const ring = []; if (!k) ring.push({ x: near.x, y: near.y }); else { for (let i = -k; i <= k; i++) ring.push({ x: near.x + i * stepMm, y: near.y - k * stepMm }, { x: near.x + i * stepMm, y: near.y + k * stepMm }); for (let j = -k + 1; j < k; j++) ring.push({ x: near.x - k * stepMm, y: near.y + j * stepMm }, { x: near.x + k * stepMm, y: near.y + j * stepMm }); } ring.sort((a, b) => Math.hypot(a.x - near.x, a.y - near.y) - Math.hypot(b.x - near.x, b.y - near.y) || a.x - b.x || a.y - b.y); for (const p of ring) out.push({ position: p, rotationDeg: rot }); } return out; }

  // ── Plan de piezas por uso y densidad (el orden importa: ancla primero, después sus compañeras) ──
  function program(use, density) {
    const hi = density === 'high', mid = density !== 'low';
    if (use === 'living') return [['sofa', 'anchor'], ['coffeetable', 'front'], mid && ['rug', 'under'], mid && ['tvstand', 'facing'], mid && ['armchair', 'beside'], hi && ['sidetable', 'end'], hi && ['floorlamp', 'end2'], hi && ['plant', 'corner']].filter(Boolean);
    if (use === 'bedroom') return [['bed', 'anchor'], ['nightstand', 'flankL'], mid && ['nightstand', 'flankR'], mid && ['wardrobe', 'wall'], hi && ['desk', 'wall'], hi && ['chair', 'deskchair']].filter(Boolean);
    if (use === 'dining') return [['table', 'anchor'], ...Array.from({ length: density === 'low' ? 2 : density === 'medium' ? 4 : 6 }, (_, i) => ['chair', 'around' + i]), hi && ['sideboard', 'wall'], hi && ['plant', 'corner']].filter(Boolean);
    if (use === 'office') return [['desk', 'anchor'], ['officechair', 'deskchair'], mid && ['bookshelf', 'wall'], hi && ['armchair', 'corner'], hi && ['floorlamp', 'corner']].filter(Boolean);
    return [];
  }
  // Variante de una pieza según la receta (con alternativas en orden de preferencia).
  function choices(recipe, role, density) {
    const p = recipe.pieces?.[role]; const list = Array.isArray(p) ? p : p?.[density] || null;
    if (list) return list;
    return { coffeetable: ['coffeetable'], sidetable: ['sidetable'], tvstand: ['tvstand'], rug: ['rug'], floorlamp: ['floorlamp'], nightstand: ['nightstand'], chair: ['chair'],
      officechair: ['officechair'], sideboard: ['sideboard'], dresser: ['dresser'], plant: ['plant'] }[role] || [];
  }
  const RULE = {
    anchor: { sofa: 'Sofá con la espalda contra un tramo de pared, lejos de las puertas.', bed: 'Cabecero contra una pared, con sitio para las mesillas.', table: 'Mesa centrada en la zona libre de la estancia, alineada con su lado largo.', desk: 'Escritorio contra una pared, lejos de las puertas.' },
    front: 'Delante del sofá, centrada en su eje, con 450 mm de paso.', under: 'Bajo la mesa de centro, centrada (no bloquea).',
    facing: 'Contra la pared de enfrente del sofá, centrada en su eje de visión.', beside: 'A un lado de la mesa de centro, mirando hacia ella.',
    end: 'Junto a un extremo del sofá, alineada con su respaldo.', end2: 'En el otro extremo del sofá.', corner: 'En una esquina libre, lejos de las puertas.',
    flankL: 'A un lado del cabecero, alineada con él.', flankR: 'Al otro lado del cabecero.', wall: 'Contra una pared libre, lejos de las puertas y de la pieza principal.',
    deskchair: 'Delante del escritorio, en su eje.', around: 'Alrededor de la mesa, mirando hacia ella.'
  };
  const ruleText = (how, role) => typeof RULE[how] === 'object' ? RULE[how][role] : RULE[how.replace(/\d+$/, '')] || '';

  // Coloca las compañeras de una composición a partir del ancla. Devuelve {placed, discarded}.
  function companions(ctx, anchorObj, plan) {
    const { sc, roomId, room, recipe, density, rand } = ctx, placed = [], discarded = [];
    let byRole = { anchor: anchorObj };
    for (const [role, how] of plan.slice(1)) {
      const opts = choices(recipe, role, density).map(variant).filter(Boolean);
      if (!opts.length) { discarded.push({ role, reason: 'Recurso no disponible en el catálogo genérico (BIB-01 pendiente).' }); continue; }
      let done = null, lastBlock = {}, tried = [];
      for (const v of opts) {
        const base = { id: ctx.nextId(), type: v.type, name: v.label, size: { widthMm: v.w, depthMm: v.d, heightMm: v.h }, color: recipe.palette[MATERIAL_OF[v.type]] || recipe.palette.wood, rotationDeg: 0, position: { x: 0, y: 0 } };
        const poses = posesFor(ctx, how, base, byRole, anchorObj); tried.push(v.label);
        const r = firstValid(sc, roomId, base, poses);
        if (r.ok) { done = { object: r.object, variant: v, how }; break; }
        lastBlock = r.blockers;
      }
      if (!done) { discarded.push({ role, variants: tried, reason: Object.keys(lastBlock).length ? blockText(lastBlock) : anchorObj.type === 'roundtable' && role === 'chair' ? 'La mesa redonda de 100 cm admite cuatro sillas.' : 'No hay ninguna posición posible para esta regla.' }); continue; }
      addToScene(sc, done.object); placed.push({ ...done, role }); if (!byRole[role]) byRole[role] = done.object;
    }
    return { placed, discarded };
  }

  // Poses candidatas para cada regla, en orden determinista de preferencia.
  function posesFor(ctx, how, base, byRole, anchor) {
    const { sc, room } = ctx, w = base.size.widthMm, d = base.size.depthMm, A = anchor, aw = A.size.widthMm, ad = A.size.depthMm, fd = frontDir(A.rotationDeg), side = { x: -fd.y, y: fd.x };
    if (how === 'front') { const c = toWorld(A, 0, ad / 2 + 450 + d / 2); return slide({ position: c, rotationDeg: A.rotationDeg }, fd, 300).concat(slide({ position: c, rotationDeg: A.rotationDeg }, side, 400).slice(1)); }
    if (how === 'under') { const t = byRole.coffeetable || A; return [{ position: t.position, rotationDeg: t.rotationDeg }]; }
    if (how === 'facing') {
      // Pared de enfrente: su normal apunta hacia el sofá; se ordena por desviación del eje de visión.
      const list = wallPoses(room, w, d).filter(p => p.normal.x * fd.x + p.normal.y * fd.y < -0.9);
      const axisOff = p => Math.abs((p.position.x - A.position.x) * side.x + (p.position.y - A.position.y) * side.y);
      return list.sort((a, b) => axisOff(a) - axisOff(b) || a.edge - b.edge);
    }
    if (how === 'beside') {
      const t = byRole.coffeetable || A, tw = t.size.widthMm, out = [];
      for (const sgn of [1, -1]) { const c = toWorld(t, sgn * (tw / 2 + 350 + d / 2), 0); out.push(...slide({ position: c, rotationDeg: t.rotationDeg + (sgn > 0 ? 90 : 270) }, fd, 400)); }
      return out;
    }
    if (how === 'end' || how === 'end2') {
      const sgn = how === 'end' ? 1 : -1, out = [];
      for (const s of [sgn, -sgn]) { const c = toWorld(A, s * (aw / 2 + 50 + w / 2), -ad / 2 + d / 2); out.push(...slide({ position: c, rotationDeg: A.rotationDeg }, fd, 300)); }
      return out;
    }
    if (how === 'flankL' || how === 'flankR') {
      const sgn = how === 'flankL' ? -1 : 1, c = toWorld(A, sgn * (aw / 2 + 30 + w / 2), -ad / 2 + d / 2);
      return slide({ position: c, rotationDeg: A.rotationDeg }, side, 150, 30).concat([{ position: toWorld(A, -sgn * (aw / 2 + 30 + w / 2), -ad / 2 + d / 2), rotationDeg: A.rotationDeg }]);
    }
    if (how === 'wall') {
      // Contra una pared, lo más lejos posible de las puertas y del ancla; la semilla no interviene.
      return wallPoses(room, w, d).map(p => ({ ...p, score: Math.min(doorDistance(sc, p.position), 3000) + Math.hypot(p.position.x - A.position.x, p.position.y - A.position.y) * 0.5 }))
        .sort((a, b) => b.score - a.score || a.edge - b.edge || a.along - b.along);
    }
    if (how === 'deskchair') { const t = byRole.desk || A, c = toWorld(t, 0, t.size.depthMm / 2 + 60 + d / 2); return slide({ position: c, rotationDeg: t.rotationDeg + 180 }, frontDir(t.rotationDeg), 200); }
    if (how.startsWith('around')) {
      const i = Number(how.slice(6)), t = A;
      if (t.type === 'roundtable' && i >= 4) return [];
      const tw = t.size.widthMm, td = t.size.depthMm, round = t.type === 'roundtable';
      // Puestos: dos por lado largo, después las cabeceras; en mesa redonda, cuatro a 90°.
      // Puestos según el número de sillas: dos enfrentadas; cuatro en los lados largos; seis con las cabeceras.
      // La mesa redonda tiene huella cuadrada: admite cuatro sillas como máximo (las demás se descartan con su motivo).
      const n = ctx.seats, seats = round
        ? (n <= 2 ? [[0, -1], [0, 1]] : [[0, -1], [0, 1], [-1, 0], [1, 0]])
        : (n <= 2 ? [[0, -1], [0, 1]] : n <= 4 ? [[-0.25, -1], [0.25, -1], [-0.25, 1], [0.25, 1]] : [[-0.25, -1], [0.25, -1], [-0.25, 1], [0.25, 1], [-1, 0], [1, 0]]);
      const [sx, sy] = seats[i] || [0, 1], gap = 50;
      let lx, ly, face;
      if (round) { const r = tw / 2 + gap + d / 2, len = Math.hypot(sx, sy); lx = sx / len * r; ly = sy / len * r; face = Math.atan2(-lx, ly) * 180 / Math.PI + 180; }
      else if (sy) { lx = sx * tw; ly = sy * (td / 2 + gap + d / 2); face = sy < 0 ? 0 : 180; }
      else { lx = sx * (tw / 2 + gap + d / 2); ly = 0; face = sx < 0 ? 270 : 90; }
      return [{ position: toWorld(t, lx, ly), rotationDeg: t.rotationDeg + face }];
    }
    if (how === 'corner') {
      const corners = room.poly.map(p => ({ x: p.x, y: p.y })), cx = corners.reduce((s, p) => s + p.x, 0) / corners.length, cy = corners.reduce((s, p) => s + p.y, 0) / corners.length;
      const near = corners.map(p => { const L = Math.hypot(cx - p.x, cy - p.y) || 1, k = Math.min(400, L / 2); return { x: Math.round(p.x + (cx - p.x) / L * k), y: Math.round(p.y + (cy - p.y) / L * k) }; })
        .filter(p => inPoly(p, room.poly)).sort((a, b) => doorDistance(sc, b) - doorDistance(sc, a) || a.x - b.x || a.y - b.y);
      return near.flatMap(p => rings(p, 0, 500, 100));
    }
    return [];
  }

  // Candidatos del ancla, ordenados por una puntuación explicable.
  function anchorPoses(ctx, role, v) {
    const { sc, room } = ctx;
    if (role === 'table') {
      // Mesa: centro de la zona libre (centroide de la estancia), alineada con el lado largo de su caja.
      const [x0, y0, x1, y1] = box(room.poly), rot = (x1 - x0) >= (y1 - y0) ? 0 : 90;
      const cx = room.poly.reduce((s, p) => s + p.x, 0) / room.poly.length, cy = room.poly.reduce((s, p) => s + p.y, 0) / room.poly.length;
      const centre = { x: Math.round((x0 + x1) / 2 * 0.5 + cx * 0.5), y: Math.round((y0 + y1) / 2 * 0.5 + cy * 0.5) };
      return [...rings(centre, rot, 1500, 150), ...rings(centre, rot + 90, 1500, 150)].map((p, i) => ({ ...p, score: -Math.hypot(p.position.x - centre.x, p.position.y - centre.y) - (p.rotationDeg === rot ? 0 : 500) }))
        .sort((a, b) => b.score - a.score);
    }
    // Contra la pared: tramos largos, posición centrada, lejos de las puertas.
    return wallPoses(room, v.w, v.d).map(p => ({ ...p, score: p.edgeLength * 0.5 - p.offCentre - Math.max(0, 1200 - doorDistance(sc, p.position)) * 2 }))
      .sort((a, b) => b.score - a.score || a.edge - b.edge || a.along - b.along);
  }

  /* generate(project, {roomId, use, density, recipeId|recipe, seed, zones, existing:'respect'})
     → {ok, status, …}. Estados sin propuesta: 'no-room', 'ambiguous-room', 'scale-pending', 'use-required',
     'use-unsupported', 'invalid-recipe', 'no-space'. No modifica `project`. */
  function generate(project, options = {}) {
    const density = DENSITIES.includes(options.density) ? options.density : 'medium';
    const recipe = options.recipe || RECIPES[options.recipeId || 'nordico'];
    const seed = Number.isSafeInteger(Number(options.seed)) ? Number(options.seed) : 1;
    const base = { ok: false, roomId: options.roomId, density, recipeId: recipe?.id, seed, items: [], discarded: [], kept: [], checked: CHECKED, notChecked: NOT_CHECKED, disclaimer: DISCLAIMER };
    const recipeProblems = checkRecipe(recipe);
    if (recipeProblems.length) return { ...base, status: 'invalid-recipe', message: 'La receta no se puede usar: ' + recipeProblems.join(' ') };
    const sc = P.scene(project, { zones: options.zones || [] }), info = roomInfo(project, sc, options.roomId);
    if (!info) return { ...base, status: 'no-room', message: 'La estancia indicada no existe en esta planta.' };
    if (options.roomLabel) info.name = String(options.roomLabel); // el nombre que ve la persona (traducido en el editor)
    const use = options.use || USE_FROM_FAMILY[info.family];
    const head = { ...base, roomName: info.name, roomAreaM2: Math.round(info.area / 1e4) / 100, use, useLabel: USES[use]?.label, declaredFamily: info.family };
    if (info.sharedRatio > 0.02) return { ...head, status: 'ambiguous-room', message: 'Parte de esta estancia pertenece también a otra estancia: no se puede atribuir el mobiliario con certeza. Corrige los contornos antes de amueblar.' };
    const conf = project.scale?.confidence;
    if (conf === 'pending') return { ...head, status: 'scale-pending', message: 'La escala del plano está sin calibrar: no se pueden proponer muebles con medidas reales. Calibra la escala primero.' };
    if (!use) return { ...head, status: 'use-required', message: 'Indica el uso real de la estancia (salón, dormitorio, comedor o despacho) para proponer muebles.' };
    if (!USES[use]) return { ...head, status: 'use-unsupported', message: `El uso «${use}» no tiene programa de muebles en V1 (solo salón, dormitorio, comedor y despacho).` };
    const rev = revision(project), plan = program(use, density), anchorRole = plan[0][0], rand = rng([rev, options.roomId, use, density, recipe.id, seed].join('|'));
    const prefix = 'obj_sf' + hash([rev, options.roomId, use, density, recipe.id, seed].join('|'));
    const existingIds = new Set((project.objects || []).map(o => o.id));
    const mkId = () => { let n = 0; return () => { let id; do id = `${prefix}-${++n}`; while (existingIds.has(id)); return id; }; };

    // Muebles que ya están en la estancia: se respetan (nunca se mueven ni se sustituyen) y su tipo no se repite.
    const inRoom = (project.objects || []).filter(o => P.roomsAt(sc, o.position || { x: NaN, y: NaN }).some(r => r.id === options.roomId));
    const kept = inRoom.map(o => ({ id: o.id, type: o.type, name: o.name }));
    const has = type => inRoom.some(o => o.type === type || (type === 'sofa' && o.type === 'cornersofa'));

    // Ancla: existente (si ya la hay) o candidata propia; se exploran varias y se elige la composición más completa.
    const anchorVariants = choices(recipe, anchorRole, density).map(variant).filter(Boolean);
    const existingAnchor = inRoom.find(o => o.type === (anchorRole === 'table' ? 'table' : anchorRole) || (anchorRole === 'sofa' && o.type === 'cornersofa') || (anchorRole === 'table' && o.type === 'roundtable'));
    const planRest = plan.slice(1).filter(([role]) => !has(role === 'sideboard' ? 'cabinet' : role) || role === 'chair' || role === 'nightstand');
    const fallbackNotes = [];
    let compositions = [];
    const tryComposition = (anchorObj, isExisting, v, how) => {
      const work = { ...sc, furniture: [...sc.furniture] }, ctx = { sc: work, roomId: options.roomId, room: info.room, recipe, density, rand, nextId: idGen, seats: plan.filter(([r]) => r === 'chair').length };
      if (!isExisting) addToScene(work, anchorObj);
      const res = companions(ctx, anchorObj, [plan[0], ...planRest]);
      const weight = res.placed.length * 10 + (isExisting ? 0 : 10);
      return { anchor: anchorObj, anchorVariant: v, isExisting, placed: res.placed, discarded: res.discarded, weight };
    };
    let idGen = mkId();
    if (!existingAnchor && !anchorVariants.length) return { ...head, status: 'resource-unavailable', revision: rev, kept, message: 'La receta pide piezas que no existen en el catálogo genérico (BIB-01 pendiente): no se propone nada.' };
    if (existingAnchor) {
      compositions.push(tryComposition(existingAnchor, true, null));
    } else {
      let lastBlock = {};
      for (const v of anchorVariants) {
        const poses = anchorPoses({ sc, room: info.room }, anchorRole, v);
        const valid = [];
        for (const pose of poses) {
          const o = { id: '', type: v.type, name: v.label, size: { widthMm: v.w, depthMm: v.d, heightMm: v.h }, color: recipe.palette[MATERIAL_OF[v.type]], position: { x: Math.round(pose.position.x), y: Math.round(pose.position.y) }, rotationDeg: norm360(pose.rotationDeg) };
          const list = check(sc, o, options.roomId);
          if (list.length) { for (const p of list) lastBlock[p.kind] = (lastBlock[p.kind] || 0) + 1; continue; }
          valid.push({ o, score: pose.score }); if (valid.length >= 60) break;
        }
        if (!valid.length) { fallbackNotes.push(`${v.label}: ${blockText(lastBlock)}`); continue; }
        // Composiciones en orden de puntuación del ancla; basta con 24 evaluadas, o con 8 completas.
        const full = 10 + planRest.length * 10; let complete = 0;
        for (const { o, score } of valid) { idGen = mkId(); o.id = idGen(); const comp = tryComposition(o, false, v); comp.score = score; compositions.push(comp); if (comp.weight === full) complete++; if (compositions.length >= 24 || complete >= 8) break; }
        if (v !== anchorVariants[0]) fallbackNotes.push(`Se usa «${v.label}» porque la primera opción de la receta no cabe.`);
        break;
      }
      if (!compositions.length) {
        return { ...head, status: 'no-space', revision: rev, kept, message: `No hay sitio para ${anchorVariants.length ? 'la pieza principal (' + anchorVariants.map(v => v.label).join(' / ') + ')' : 'la pieza principal'} en «${info.name}». ${blockText(lastBlock)} No se propone nada: el proyecto no cambia.`, detail: fallbackNotes };
      }
    }
    // Mejor composición: más piezas colocadas; entre las igual de completas y con puntuación parecida, decide la semilla.
    const maxW = Math.max(...compositions.map(c => c.weight));
    let best = compositions.filter(c => c.weight === maxW);
    if (best.length > 1 && best[0].score !== undefined) { const top = Math.max(...best.map(c => c.score)); best = best.filter(c => c.score >= top - Math.max(300, Math.abs(top) * 0.15)); }
    const pick = best[Math.floor(rand() * best.length)];

    const items = [];
    const push = (o, role, how, v) => items.push({ id: o.id, role, type: o.type, name: o.name, variant: v?.variant, position: { ...o.position }, rotationDeg: o.rotationDeg,
      size: { ...o.size }, color: o.color, rule: ruleText(how, role), material: MATERIAL_OF[o.type] });
    if (!pick.isExisting) push(pick.anchor, anchorRole, 'anchor', pick.anchorVariant);
    for (const p of pick.placed) push(p.object, p.role, p.how, p.variant);
    const roleName = role => choices(recipe, role, density).map(variant).filter(Boolean)[0]?.label || role;
    const discarded = [...pick.discarded.map(d => ({ ...d, name: roleName(d.role) })),
      ...plan.slice(1).filter(([role]) => !planRest.some(([r]) => r === role)).map(([role]) => ({ role, name: roleName(role), reason: 'Ya hay una pieza de este tipo en la estancia: se respeta.' }))];
    if (!items.length) return { ...head, status: 'nothing-to-add', revision: rev, kept, discarded, message: `«${info.name}» ya tiene las piezas de este programa o no cabe ninguna más: no hay nada que proponer. El proyecto no cambia.` };
    return {
      ...head, ok: true, status: 'proposal', revision: rev, items, discarded, kept,
      anchor: pick.isExisting ? { kept: true, id: pick.anchor.id, name: pick.anchor.name } : { kept: false, id: pick.anchor.id, name: pick.anchor.name },
      alternatives: best.length, scaleWarning: conf !== 'real' ? 'La escala del plano es estimada: las medidas son orientativas y hay que confirmarlas antes de aplicar.' : null,
      recipe: { id: recipe.id, label: recipe.label, summary: recipe.summary, coherence: recipe.coherence, palette: recipe.palette, applied: ['Piezas y tamaños de la receta', 'Colores de la paleta en cada mueble'], notApplied: [...NOT_APPLIED, ...(recipe.floorSuggestion ? [`Sugerencia de suelo no aplicada: ${recipe.floorSuggestion}.`] : [])], notes: fallbackNotes },
      useLabel: USES[use].label, densityLabel: DENSITY_LABEL[density]
    };
  }

  // Validación de un objeto propuesto con independencia de cómo se generó.
  function validObject(o) {
    return o && /^obj_[A-Za-z0-9][A-Za-z0-9_-]{2,63}$/.test(o.id) && typeof o.type === 'string' && /^[a-z][a-z0-9-]{1,39}$/.test(o.type) && typeof o.name === 'string' && o.name.length > 0 && o.name.length <= 100 &&
      Number.isSafeInteger(o.position?.x) && Number.isSafeInteger(o.position?.y) && Number.isInteger(o.rotationDeg) && o.rotationDeg >= 0 && o.rotationDeg <= 359 &&
      [o.size?.widthMm, o.size?.depthMm].every(v => Number.isSafeInteger(v) && v > 0 && v <= 100000) && (o.size.heightMm === undefined || (Number.isSafeInteger(o.size.heightMm) && o.size.heightMm >= 1 && o.size.heightMm <= 10000)) &&
      (o.color === undefined || /^#[0-9a-fA-F]{6}$/.test(o.color));
  }

  /* apply(project, proposal, {acceptEstimatedScale, zones}) → {ok, project, added} con una COPIA, o {ok:false, reason,
     message, problems}. Comprueba que el proyecto no cambió desde la propuesta, vuelve a validar cada mueble y el
     conjunto (incluida la revisión exacta de solapes y puertas) y el contrato completo. Todo o nada. */
  function apply(project, proposal, options = {}) {
    const fail = (reason, message, problems = []) => ({ ok: false, reason, message, problems });
    if (!proposal?.ok || proposal.status !== 'proposal') return fail('no-proposal', 'No hay ninguna propuesta que aplicar.');
    if (revision(project) !== proposal.revision) return fail('stale', 'El proyecto ha cambiado desde que se generó la propuesta. Genera una nueva.');
    if (proposal.scaleWarning && !options.acceptEstimatedScale) return fail('scale', 'Confirma que entiendes que la escala es estimada antes de aplicar.');
    if (!proposal.items.length) return fail('empty', 'La propuesta no añade ningún mueble.');
    const next = C.clone(project), sc = P.scene(next, { zones: options.zones || [] }), problems = [];
    const ids = new Set((next.objects || []).map(o => o.id));
    for (const it of proposal.items) {
      const o = { id: it.id, type: it.type, name: it.name, position: { x: it.position.x, y: it.position.y }, rotationDeg: it.rotationDeg, size: { ...it.size }, color: it.color, roomId: proposal.roomId };
      if (!validObject(o)) { problems.push({ id: it.id, kind: 'geometry', detail: `«${it.name}» tiene datos no válidos.` }); continue; }
      if (ids.has(o.id)) { problems.push({ id: it.id, kind: 'duplicate', detail: `«${it.name}» ya existe en el proyecto.` }); continue; }
      for (const p of check(sc, o, proposal.roomId)) problems.push({ id: it.id, ...p });
      ids.add(o.id); addToScene(sc, o); next.objects.push(o);
    }
    if (problems.length) return fail('invalid', 'La propuesta ya no es válida: ' + problems.map(p => p.detail).join(' '), problems);
    // Conjunto: revisión exacta de solapes y de la hoja de las puertas para cada mueble nuevo.
    const added = new Set(proposal.items.map(i => i.id)), rev = R.review(next);
    const bad = rev.findings.filter(f => (f.code === 'solape' || f.code === 'puerta' || f.code === 'escalera') && f.objects.some(id => added.has(id)));
    if (bad.length) return fail('review', 'La revisión del conjunto encuentra conflictos: ' + bad.map(f => f.code).join(', ') + '.', bad);
    try { C.validate(next); } catch (e) { return fail('contract', 'El resultado no cumple el contrato del proyecto: ' + e.message); }
    return { ok: true, project: next, added: [...added] };
  }

  const api = Object.freeze({ VERSION, DENSITIES, DENSITY_LABEL, USES, RECIPES, VARIANT_DEF, MATERIAL_OF, NOT_APPLIED, CHECKED, NOT_CHECKED, DISCLAIMER,
    variant, checkRecipe, revision, generate, apply, validObject, program, wallPoses });
  if (node) module.exports = api; else root.FloorPlanSmartFurnishing = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
