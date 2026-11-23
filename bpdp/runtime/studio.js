/* BP-DP PREMIUM · RUNTIME «STUDIO» (módulo ES). Motor de presentación AISLADO compartido por Blueprint y Despiece.
 *
 * Decisión de arquitectura (docs/ARQUITECTURA.md): un runtime three.js r160 (la misma biblioteca y versión que RUBIK,
 * transferida con SCULPT) que dibuja el PAQUETE DE ESCENA del proyecto (real de RUBIK o sintético). No es otra autoridad:
 * no edita ni persiste; la geometría llega intacta del paquete (con su revisión) y solo se aplican transformaciones de
 * PRESENTACIÓN (traslación rígida, crecimiento vertical para el «plano → volumen», recorte por planos).
 * Un contexto WebGL mientras está abierto; dispose() lo libera (forceContextLoss).
 * Lenguaje gráfico Blueprint: heritage-blueprint-skill@f5e7c53 (MIT) — papel frío, retícula, tinta cobalto, volúmenes
 * porcelana con aristas — reimplementado con three.js (KEEP tokens y criterios; REPLACE su WebGL propio).
 */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const POCHE_SYS = new Set(['foundation', 'slab', 'structure', 'walls', 'envelope', 'partitions', 'roof-structure', 'roof', 'roof-finish', 'finishes']);
const INK = new THREE.Color('#3a4fc8'), PAPER = new THREE.Color('#eef0f7');
export const STYLE_TOKENS = { ink: '#3a4fc8', inkSoft: '#8b97da', paper: '#eef0f7', poche: '#2b3a99', studio: '#ece9e4', shadow: '#1d2024' };
const SYS_TINT = { foundation: '#c9ccd9', slab: '#dfe2ee', structure: '#cdd3ee', walls: '#f8f9fd', envelope: '#f8f9fd', partitions: '#fbfbfe', openings: '#c9d1f4', ceilings: '#f1f3fa',
  fixtures: '#d6dcf5', 'roof-structure': '#dde2f7', roof: '#e3e7fa', 'roof-finish': '#d3daf6', finishes: '#e8ebf6', floors: '#e9ecf6', furniture: '#dde2f5' };
const SYS_ARCH = { foundation: '#a7a29a', slab: '#bdb8b0', structure: '#c4bfb6', walls: '#ebe5da', envelope: '#ebe5da', partitions: '#f4f2ee', openings: '#2f3338', ceilings: '#f3f0ea',
  fixtures: '#e5d4a8', 'roof-structure': '#c59b6b', roof: '#d9d4cb', 'roof-finish': '#9c4f3b', finishes: '#c8a57c', floors: '#d8ccb9', furniture: '#bfae95' };

/** Carga el paquete y su geometría binaria; verifica la huella SHA-256 declarada. */
export async function loadPackage(dir) {
  const pkg = await (await fetch(`${dir}/package.json`)).json();
  // La geometría puede llegar en binario (por defecto) o en base64 (alojamientos que solo sirven texto); el SHA-256 se
  // comprueba siempre sobre los bytes originales.
  const res = await fetch(`${dir}/${pkg.geometry.file}`);
  const buf = pkg.geometry.encoding === 'base64' ? Uint8Array.from(atob((await res.text()).trim()), c => c.charCodeAt(0)).buffer : await res.arrayBuffer();
  const sha = [...new Uint8Array(await crypto.subtle.digest('SHA-256', buf))].map(b => b.toString(16).padStart(2, '0')).join('');
  if (sha !== pkg.geometry.sha256) throw Object.assign(Error('La geometría del paquete no coincide con su huella: no se abre.'), { code: 'GEOMETRY_HASH' });
  return { pkg, pos: new Float32Array(buf, pkg.geometry.positions.offset, pkg.geometry.positions.count), idx: new Uint32Array(buf, pkg.geometry.indices.offset, pkg.geometry.indices.count), dir };
}

export function createStudio(host, data, { style = 'blueprint', pixelRatio } = {}) {
  const { pkg, pos, idx } = data, model = window.BpdpModel.build(pkg);
  const bbox = new THREE.Box3(); for (const m of pkg.meshes) { bbox.expandByPoint(new THREE.Vector3(...m.bounds.min)); bbox.expandByPoint(new THREE.Vector3(...m.bounds.max)); }
  const center = bbox.getCenter(new THREE.Vector3()), size = bbox.getSize(new THREE.Vector3());
  const assembly = window.BpdpAssembly.build(model, { center: [center.x, center.z] });
  const canvas = document.createElement('canvas'); canvas.className = 'studio-canvas'; host.appendChild(canvas);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(pixelRatio || Math.min(2, window.devicePixelRatio || 1)); renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.localClippingEnabled = true; renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene(), root = new THREE.Group(); scene.add(root);
  const clip = { plan: new THREE.Plane(new THREE.Vector3(0, -1, 0), 1e6), section: new THREE.Plane(new THREE.Vector3(0, 0, -1), 1e6) };
  const clipPlanes = [clip.plan, clip.section];
  // ── geometría por componente: mallas del paquete fusionadas por material, sin alterar vértices ──
  const groups = new Map(), fills = [], edges = [], poches = [], glass = [];
  const meshGeo = i => { const m = pkg.meshes[i], g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos.slice(m.v[0] * 3, (m.v[0] + m.v[1]) * 3), 3)); g.setIndex(new THREE.BufferAttribute(idx.slice(m.f[0], m.f[0] + m.f[1]), 1)); return g; };
  for (const c of model.components) {
    const grp = new THREE.Group(); grp.name = c.key; grp.userData = { key: c.key, base: c.bounds.min[1] };
    const byMat = new Map(); for (const i of c.meshIdx) { const mt = pkg.meshes[i].material || {}; const k = `${mt.color}|${mt.opacity ?? 1}|${mt.roughness ?? .8}|${mt.metalness ?? 0}`; if (!byMat.has(k)) byMat.set(k, { mt, list: [] }); byMat.get(k).list.push(meshGeo(i)); }
    for (const { mt, list } of byMat.values()) {
      const g = (list.length > 1 ? mergeGeometries(list, false) : list[0]).toNonIndexed(); g.computeVertexNormals(); g.computeBoundingBox(); list.forEach(x => x.dispose());
      const isGlass = (mt.opacity ?? 1) < 1 || c.roles.includes('opening-glass');
      const fill = new THREE.Mesh(g, null); fill.castShadow = !isGlass; fill.receiveShadow = true; fill.userData = { key: c.key, sys: c.system, mt, glass: isGlass };
      const e = new THREE.LineSegments(new THREE.EdgesGeometry(g, 28), null); e.userData = { key: c.key };
      grp.add(fill, e); fills.push(fill); edges.push(e); if (isGlass) glass.push(fill);
      // Poché (relleno de corte por caras traseras) SOLO en sistemas que son volúmenes cerrados. Las superficies abiertas
      // (techos y suelos de RUBIK, muebles, luminarias, carpinterías, vidrio) se pintarían como manchas sólidas.
      if (POCHE_SYS.has(c.system) && !isGlass) { const back = new THREE.Mesh(g, null); back.userData = { poche: true }; back.renderOrder = 1; grp.add(back); poches.push(back); }
    }
    root.add(grp); groups.set(c.key, grp);
  }
  // ── suelo / retícula / luces ──
  const floorY = bbox.min.y - 0.004, span = Math.max(size.x, size.z) * 3 + 20;
  const gridMinor = new THREE.GridHelper(span, Math.round(span), INK, INK), gridMajor = new THREE.GridHelper(span, Math.round(span / 5), INK, INK);
  for (const [g, o] of [[gridMinor, .09], [gridMajor, .2]]) { g.position.set(center.x, floorY, center.z); g.material.transparent = true; g.material.opacity = o; g.material.depthWrite = false; scene.add(g); }
  const shadowGround = new THREE.Mesh(new THREE.PlaneGeometry(span, span), new THREE.ShadowMaterial({ opacity: .18 })); shadowGround.rotation.x = -Math.PI / 2; shadowGround.position.set(center.x, floorY, center.z); shadowGround.receiveShadow = true; scene.add(shadowGround);
  const studioGround = new THREE.Mesh(new THREE.CircleGeometry(span / 2, 64), new THREE.MeshStandardMaterial({ color: '#e4e0d9', roughness: 1 })); studioGround.rotation.x = -Math.PI / 2; studioGround.position.set(center.x, floorY - .002, center.z); studioGround.receiveShadow = true; scene.add(studioGround);
  const hemi = new THREE.HemisphereLight('#ffffff', '#c9c4ba', 1.6), sun = new THREE.DirectionalLight('#fff6ea', 2.4), fillLight = new THREE.DirectionalLight('#dfe8ff', .6);
  const R = Math.max(size.x, size.y, size.z);
  sun.position.set(center.x + R * .8, center.y + R * 1.6, center.z + R * .6); sun.target.position.copy(center); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -R * 1.4, right: R * 1.4, top: R * 1.4, bottom: -R * 1.4, near: .1, far: R * 6 }); sun.shadow.bias = -0.0004;
  fillLight.position.set(center.x - R, center.y + R * .5, center.z - R * .8);
  scene.add(hemi, sun, sun.target, fillLight);
  // ── materiales por estilo (los mismos objetos geométricos; solo cambia la apariencia) ──
  const mats = { cache: new Map() };
  const mat = (k, f) => { if (!mats.cache.has(k)) mats.cache.set(k, f()); return mats.cache.get(k); };
  let state = { style: null, visible: Object.fromEntries(model.systems.map(s => [s.id, true])), hidden: new Set(), isolate: null, selected: null, highlight: new Set(), A: 1, growth: 1, poche: false };
  function applyStyle(st) {
    state.style = st; const bp = st === 'blueprint';
    scene.background = new THREE.Color(bp ? STYLE_TOKENS.paper : STYLE_TOKENS.studio);
    gridMinor.visible = gridMajor.visible = bp; shadowGround.visible = !bp; studioGround.visible = !bp; sun.castShadow = !bp;
    renderer.toneMapping = bp ? THREE.NoToneMapping : THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0;
    hemi.intensity = bp ? 1.1 : 1.5; sun.intensity = bp ? .55 : 2.6; fillLight.intensity = bp ? .3 : .55;
    for (const f of fills) { const { sys, mt, glass: gl } = f.userData;
      f.material = bp ? mat(`bp|${sys}|${gl}`, () => new THREE.MeshLambertMaterial({ color: gl ? '#c7d0f5' : SYS_TINT[sys] || '#f6f7fc', emissive: gl ? '#000000' : SYS_TINT[sys] || '#f6f7fc', emissiveIntensity: .62, transparent: gl, opacity: gl ? .35 : 1, side: THREE.FrontSide, clippingPlanes: clipPlanes, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 }))
        : mat(`ar|${sys}|${mt.color}|${mt.opacity}|${mt.roughness}`, () => new THREE.MeshStandardMaterial({ color: pickArchColor(sys, mt), roughness: mt.roughness ?? .8, metalness: mt.metalness || 0, transparent: (mt.opacity ?? 1) < 1, opacity: mt.opacity ?? 1, clippingPlanes: clipPlanes, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 })); }
    for (const p of poches) p.material = mat(`poche|${st}`, () => new THREE.MeshBasicMaterial({ color: bp ? STYLE_TOKENS.poche : '#3b3833', side: THREE.BackSide, clippingPlanes: clipPlanes }));
    for (const e of edges) e.material = SOFT.has(model.byKey.get(e.userData.key)?.system) ? softEdge(st) : edgeMat(st);
    refreshVisibility(); request();
  }
  const edgeMat = st => mat(`edge|${st}`, () => new THREE.LineBasicMaterial({ color: st === 'blueprint' ? INK : STYLE_TOKENS.shadow, transparent: true, opacity: st === 'blueprint' ? .92 : .18, clippingPlanes: clipPlanes }));
  const SOFT = new Set(['furniture', 'fixtures']);
  const softEdge = st => mat(`edge-soft|${st}`, () => new THREE.LineBasicMaterial({ color: st === 'blueprint' ? INK : STYLE_TOKENS.shadow, transparent: true, opacity: st === 'blueprint' ? .38 : .1, clippingPlanes: clipPlanes }));
  const selMat = () => mat('edge-sel', () => new THREE.LineBasicMaterial({ color: '#e0583a', clippingPlanes: clipPlanes }));
  // En estilo arquitectónico se usa el color de material del paquete (RUBIK o sintético); en blanco, el del sistema.
  const pickArchColor = (sys, mt) => (mt.color && mt.color !== '#ffffff') ? mt.color : (SYS_ARCH[sys] || '#e8e4dc');
  // ── cámaras ──
  const ortho = new THREE.OrthographicCamera(-1, 1, 1, -1, -1000, 1000), persp = new THREE.PerspectiveCamera(32, 1, .05, 2000);
  let camera = ortho; const controls = new OrbitControls(camera, canvas); controls.enableDamping = false; controls.target.copy(center); controls.addEventListener('change', () => request());
  const cam = { kind: 'ortho', dir: new THREE.Vector3(1, 1.15, 1).normalize(), up: new THREE.Vector3(0, 1, 0), target: center.clone(), half: Math.max(size.x, size.z) * .7, dist: R * 2.6, fov: 32 };
  const VIEWS = {
    plan: { kind: 'ortho', dir: [0, 1, 0], up: [0, 0, -1] },
    axon: { kind: 'ortho', dir: [1, 1.15, 1], up: [0, 1, 0] },
    'axon-sw': { kind: 'ortho', dir: [-1, 1.15, 1], up: [0, 1, 0] },
    'elev-s': { kind: 'ortho', dir: [0, 0, 1], up: [0, 1, 0] }, 'elev-n': { kind: 'ortho', dir: [0, 0, -1], up: [0, 1, 0] },
    'elev-e': { kind: 'ortho', dir: [1, 0, 0], up: [0, 1, 0] }, 'elev-w': { kind: 'ortho', dir: [-1, 0, 0], up: [0, 1, 0] },
    hero: { kind: 'persp', dir: [1.05, .72, 1.25], up: [0, 1, 0] } };
  /** Semialtura del encuadre ortográfico para que la caja (con margen) quepa en el lienzo. */
  function fitHalf(dir, box = bbox, margin = 1.12) {
    const b = box, corners = []; for (const x of [b.min.x, b.max.x]) for (const y of [b.min.y, b.max.y]) for (const z of [b.min.z, b.max.z]) corners.push(new THREE.Vector3(x, y, z));
    const d = new THREE.Vector3(...dir).normalize(), up = Math.abs(d.y) > .99 ? new THREE.Vector3(0, 0, -1) : new THREE.Vector3(0, 1, 0);
    const right = new THREE.Vector3().crossVectors(up, d).normalize(), u = new THREE.Vector3().crossVectors(d, right).normalize(), c = b.getCenter(new THREE.Vector3());
    let w = 0, h = 0; for (const p of corners) { const q = p.clone().sub(c); w = Math.max(w, Math.abs(q.dot(right))); h = Math.max(h, Math.abs(q.dot(u))); }
    return Math.max(h, w / aspect()) * margin;
  }
  const aspect = () => { const r = canvas.getBoundingClientRect(); return (r.width || 16) / (r.height || 9); };
  // Reservas de interfaz (px): barra superior y dock inferior. El encuadre deja la arquitectura en la zona libre.
  let pad = { top: 64, bottom: 150 };
  function poseFor(name, { box = bbox, margin, ui = true } = {}) {
    const v = VIEWS[name]; const c = box.getCenter(new THREE.Vector3()), H = canvas.getBoundingClientRect().height || 900;
    const free = ui ? Math.max(.5, (H - pad.top - pad.bottom) / H) : 1, shiftPx = ui ? (pad.bottom - pad.top) / 2 : 0;
    const dir = new THREE.Vector3(...v.dir).normalize(), up = new THREE.Vector3(...v.up);
    const right = new THREE.Vector3().crossVectors(up, dir).normalize(), upS = new THREE.Vector3().crossVectors(dir, right).normalize();
    if (v.kind === 'ortho') { const half = fitHalf(v.dir, box, margin) / free; return { kind: 'ortho', dir, up, target: c.clone().addScaledVector(upS, -shiftPx * (2 * half / H)), half }; }
    const s = box.getSize(new THREE.Vector3()), r = Math.max(s.x, s.y, s.z) * .62, dist = r / Math.tan(THREE.MathUtils.degToRad(32) / 2) * (margin || 1.12) / free;
    const halfAt = dist * Math.tan(THREE.MathUtils.degToRad(16));
    return { kind: 'persp', dir, up: new THREE.Vector3(0, 1, 0), target: c.clone().addScaledVector(upS, -shiftPx * (2 * halfAt / H)), dist, fov: 32 };
  }
  /** Aplica una pose (ortho/persp) exactamente: usado por las vistas, la película y la exportación. */
  function applyPose(p) {
    if (p.kind === 'ortho') { camera = ortho; const a = aspect(); Object.assign(ortho, { left: -p.half * a, right: p.half * a, top: p.half, bottom: -p.half, zoom: 1 }); ortho.position.copy(p.target).addScaledVector(p.dir, 200); ortho.up.copy(p.up); ortho.lookAt(p.target); ortho.updateProjectionMatrix(); }
    else { camera = persp; persp.fov = p.fov; persp.aspect = aspect(); persp.position.copy(p.target).addScaledVector(p.dir, p.dist); persp.up.copy(p.up); persp.lookAt(p.target); persp.updateProjectionMatrix(); }
    controls.object = camera; controls.target.copy(p.target); Object.assign(cam, { kind: p.kind, dir: p.dir.clone(), up: p.up.clone(), target: p.target.clone(), half: p.half ?? cam.half, dist: p.dist ?? cam.dist, fov: p.fov ?? cam.fov });
    request();
  }
  /** Pose actual leída de la cámara (tras la órbita del usuario). */
  function currentPose() {
    const dir = camera.position.clone().sub(controls.target).normalize();
    return camera.isOrthographicCamera ? { kind: 'ortho', dir, up: camera.up.clone(), target: controls.target.clone(), half: (ortho.top - ortho.bottom) / 2 / ortho.zoom }
      : { kind: 'persp', dir, up: camera.up.clone(), target: controls.target.clone(), dist: camera.position.distanceTo(controls.target), fov: persp.fov };
  }
  /** Interpolación continua entre poses (dirección por slerp, encuadre lineal): sin saltos de cámara ni de escala. */
  function blendPose(a, b, k) {
    const s = k * k * k * (k * (k * 6 - 15) + 10), qa = new THREE.Quaternion(), qb = new THREE.Quaternion();
    const z = new THREE.Vector3(0, 0, 1); qa.setFromUnitVectors(z, a.dir); qb.setFromUnitVectors(z, b.dir);
    const dir = z.clone().applyQuaternion(qa.slerp(qb, s)).normalize(), up = a.up.clone().lerp(b.up, s).normalize();
    if (Math.abs(up.dot(dir)) > .999) up.set(0, 0, -1);
    const out = { kind: s < .5 ? a.kind : b.kind, dir, up, target: a.target.clone().lerp(b.target, s) };
    if (a.kind === 'ortho' && b.kind === 'ortho') out.half = a.half + (b.half - a.half) * s;
    else if (a.kind === 'persp' && b.kind === 'persp') { out.dist = a.dist + (b.dist - a.dist) * s; out.fov = a.fov + (b.fov - a.fov) * s; }
    else { // ortho ↔ persp: encuadre equivalente (semialtura = dist·tan(fov/2))
      const ha = a.half ?? a.dist * Math.tan(THREE.MathUtils.degToRad(a.fov) / 2), hb = b.half ?? b.dist * Math.tan(THREE.MathUtils.degToRad(b.fov) / 2), h = ha + (hb - ha) * s;
      if (out.kind === 'ortho') out.half = h; else { out.fov = b.fov ?? a.fov ?? 32; out.dist = h / Math.tan(THREE.MathUtils.degToRad(out.fov) / 2); } }
    return out;
  }
  let anim = null;
  function goTo(p, ms = 700) { const from = currentPose(); if (matchMedia('(prefers-reduced-motion: reduce)').matches || !ms) { applyPose(p); return Promise.resolve(); }
    return new Promise(res => { anim = { from, to: p, t0: performance.now(), ms, res }; request(); }); }
  // ── estado de presentación: visibilidad, aislamiento, selección, ensamblaje, crecimiento, recortes ──
  function refreshVisibility() {
    for (const c of model.components) { const g = groups.get(c.key);
      const iso = state.isolate; const inIso = !iso || (iso.type === 'system' ? c.system === iso.id : iso.type === 'level' ? c.level === iso.id : c.key === iso.id);
      g.visible = state.visible[c.system] !== false && !state.hidden.has(c.key) && inIso;
      const sel = state.selected === c.key, hl = state.highlight.has(c.key);
      for (const ch of g.children) { if (ch.isLineSegments) { ch.material = sel || hl ? selMat() : SOFT.has(c.system) ? softEdge(state.style) : edgeMat(state.style); }
        else if (ch.userData.poche) ch.visible = state.poche; } }
    request();
  }
  // Transformación de PRESENTACIÓN de cada pieza = traslación del ensamblaje + crecimiento vertical opcional
  // («plano 2D → volumen»: escala respecto a la base de la pieza; con k = 1 y A = 1 la pieza queda EXACTAMENTE montada).
  let growSystems = new Set();
  function applyTransforms() {
    for (const c of model.components) { const g = groups.get(c.key), o = assembly.offset(c.key, state.A), grow = growSystems.has(c.system) && state.growth < 1;
      g.scale.y = grow ? state.growth : 1; g.position.set(o[0], o[1] + (grow ? g.userData.base * (1 - state.growth) : 0), o[2]); }
    request(); }
  function setAssembly(A) { state.A = Math.min(1, Math.max(0, A)); applyTransforms(); }
  function setGrowth(k, systems = ['walls', 'envelope', 'partitions', 'openings', 'structure', 'ceilings', 'fixtures', 'furniture', 'roof-structure', 'roof', 'roof-finish']) {
    state.growth = Math.min(1, Math.max(.015, k)); growSystems = new Set(systems); applyTransforms(); }
  function setClip({ plan = null, section = null } = {}) {
    clip.plan.constant = plan == null ? 1e6 : plan; // conserva y < plan
    if (section) { const n = section.axis === 'x' ? new THREE.Vector3(-1, 0, 0) : new THREE.Vector3(0, 0, -1); clip.section.normal.copy(n.multiplyScalar(section.flip ? -1 : 1)); clip.section.constant = (section.flip ? -1 : 1) * section.pos; }
    else clip.section.constant = 1e6;
    state.poche = plan != null || !!section; refreshVisibility(); }
  // ── selección (sobre las piezas visibles y del lado conservado de los planos de corte) ──
  const ray = new THREE.Raycaster(); ray.params.Line.threshold = .02;
  function pickAt(clientX, clientY) {
    const r = canvas.getBoundingClientRect(), v = new THREE.Vector2((clientX - r.left) / r.width * 2 - 1, -(clientY - r.top) / r.height * 2 + 1);
    ray.setFromCamera(v, camera);
    const hits = ray.intersectObjects(fills.filter(f => f.parent.visible && !f.userData.glass), false).filter(h => clipPlanes.every(p => p.distanceToPoint(h.point) >= -1e-4));
    return hits.length ? hits[0].object.userData.key : null;
  }
  // ── proyección para la capa de anotaciones ──
  const project = p => { const v = new THREE.Vector3(...p).project(camera), r = canvas.getBoundingClientRect(); return { x: (v.x + 1) / 2 * r.width, y: (1 - v.y) / 2 * r.height, visible: v.z > -1 && v.z < 1 }; };
  const projectTo = (p, w, h) => { const v = new THREE.Vector3(...p).project(camera); return { x: (v.x + 1) / 2 * w, y: (1 - v.y) / 2 * h }; };
  // ── bucle de render a demanda ──
  let disposed = false; // declarado antes del bucle: request()/tick() lo consultan desde el primer fotograma
  let raf = 0, dirty = true, frames = 0, lastFrameMs = 0, frameTimes = [], listeners = new Set();
  // Tras dispose() no se pide ni se dibuja ningún fotograma más: nada mantiene viva la escena cerrada.
  function request() { if (disposed) return; dirty = true; if (!raf) raf = requestAnimationFrame(tick); }
  function tick(now) { raf = 0; if (disposed) return;
    if (anim) { const k = Math.min(1, (now - anim.t0) / anim.ms); applyPose(blendPose(anim.from, anim.to, k)); if (k >= 1) { const r = anim.res; anim = null; r(); } }
    for (const l of listeners) l(now);
    if (dirty || anim) { const t0 = performance.now(); renderer.render(scene, camera); lastFrameMs = performance.now() - t0; frames++; dirty = false; }
    if (lastNow) { frameTimes.push(now - lastNow); if (frameTimes.length > 600) frameTimes.shift(); } lastNow = now;
    // Una sola cadena de fotogramas: si un oyente ya pidió el siguiente (request), no se abre otra (antes crecían sin límite).
    if (disposed) return; if (anim || listeners.size) { if (!raf) raf = requestAnimationFrame(tick); } else if (!raf) lastNow = 0; }
  let lastNow = 0;
  function resize() { const r = host.getBoundingClientRect(); renderer.setSize(r.width, r.height, false); applyPose(currentPose()); }
  const ro = new ResizeObserver(() => resize()); ro.observe(host);
  /** Renderiza el estado actual a un tamaño fijo (vídeo/lámina) y devuelve el lienzo WebGL ya dibujado. */
  function renderAt(width, height) {
    const prev = { pr: renderer.getPixelRatio(), w: canvas.width, h: canvas.height };
    renderer.setPixelRatio(1); renderer.setSize(width, height, false);
    const p = currentPose(); const a = width / height;
    if (camera.isOrthographicCamera) Object.assign(ortho, { left: -p.half * a, right: p.half * a, top: p.half, bottom: -p.half }); else persp.aspect = a; camera.updateProjectionMatrix();
    renderer.render(scene, camera); return { canvas, restore: () => { renderer.setPixelRatio(prev.pr); resize(); } };
  }
  applyStyle(style); resize(); applyPose(poseFor('axon')); setAssembly(1);
  return {
    model, assembly, pkg, canvas, renderer, bbox, center, size, VIEWS, STYLE_TOKENS,
    get camera() { return camera; }, get state() { return state; },
    applyStyle, poseFor, setPadding(p) { pad = { ...pad, ...p }; }, applyPose, currentPose, blendPose, goTo, setAssembly, setGrowth, setClip, pickAt, project, projectTo, request, renderAt, fitHalf,
    setSystemVisible(id, on) { state.visible[id] = !!on; refreshVisibility(); },
    setIsolate(iso) { state.isolate = iso; refreshVisibility(); },
    setSelected(key) { state.selected = key; refreshVisibility(); },
    setHighlight(keys) { state.highlight = new Set(keys || []); refreshVisibility(); },
    groupOf: key => groups.get(key), controls,
    onFrame(fn) { listeners.add(fn); request(); return () => listeners.delete(fn); },
    stats: () => ({ frames, lastFrameMs, frameTimes: frameTimes.slice(), drawCalls: renderer.info.render.calls, triangles: renderer.info.render.triangles, geometries: renderer.info.memory.geometries, textures: renderer.info.memory.textures, components: model.components.length, meshes: pkg.meshes.length, fills: fills.length }),
    /** Firma exacta de transformaciones (restauración): posición y escala de cada pieza. */
    transformSignature: () => model.components.map(c => { const g = groups.get(c.key); return [c.key, g.position.toArray().map(v => Math.round(v * 1e9) / 1e9), g.scale.toArray()]; }),
    dispose() { if (disposed) return; disposed = true; cancelAnimationFrame(raf); raf = 0; listeners.clear(); anim = null; ro.disconnect(); controls.dispose(); scene.traverse(o => { o.geometry?.dispose?.(); }); for (const m of mats.cache.values()) m?.dispose?.(); renderer.dispose(); renderer.forceContextLoss(); canvas.remove(); }
  };
}
