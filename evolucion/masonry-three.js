/* SCULPT Simulator · A · Adaptador Three.js de la fábrica hilada a hilada (para evolucion/project-scene.js de RUBIK).
 * Recibe THREE por parámetro (RUBIK usa su vendor r160; no se importa otra copia). Un InstancedMesh para las piezas y otro
 * para los dinteles por muro: cientos de piezas en 2 llamadas de dibujo. Marco del visor de RUBIK: metros, Y arriba,
 * x = (planX − centro.x)/1000, z = (planY − centro.y)/1000, giro −angle. Solo pinta: el progreso k llega de fuera
 * (FloorPlanConstructionVisualState), la geometría de RubikMasonry. Sin texturas: color uniforme por material (Perla/visor). */
const UNIT = { box: null };
export function buildMasonryWall(THREE, wall, plan, { center, colors = {}, joint = 10, materials = null } = {}) {
  if (!center) throw Error('buildMasonryWall: center (plan mm) required');
  UNIT.box = UNIT.box || new THREE.BoxGeometry(1, 1, 1);
  const mat = materials || {
    block: new THREE.MeshStandardMaterial({ color: colors.block || '#c9c3b8', roughness: 0.92 }),
    lintel: new THREE.MeshStandardMaterial({ color: colors.lintel || '#8f8a82', roughness: 0.8 }),
  };
  const blocks = plan.items.filter(i => i.kind !== 'lintel'), lintels = plan.items.filter(i => i.kind === 'lintel');
  const imB = new THREE.InstancedMesh(UNIT.box, mat.block, Math.max(1, blocks.length)), imL = new THREE.InstancedMesh(UNIT.box, mat.lintel, Math.max(1, lintels.length));
  imB.count = blocks.length; imL.count = lintels.length; imB.castShadow = imB.receiveShadow = imL.castShadow = imL.receiveShadow = true;
  const group = new THREE.Group(); group.name = 'masonry:' + (wall.id || ''); group.userData.wallId = wall.id; group.userData.illustrative = true;
  group.position.set((wall.start.x - center.x) / 1000, 0, (wall.start.y - center.y) / 1000); group.rotation.y = -wall.angle;
  group.add(imB, imL);
  const slot = new Map(); blocks.forEach((it, j) => slot.set(it, [imB, j])); lintels.forEach((it, j) => slot.set(it, [imL, j]));
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3(), ZERO = new THREE.Matrix4().makeScale(0, 0, 0);
  const index = new Map(plan.items.map((it, i) => [i, it]));
  let last = NaN;
  function setBuilt(k, builtAt) {
    const kk = Math.min(1, Math.max(0, Number(k) || 0)); if (kk === last) return; last = kk;
    const shown = new Map(builtAt(plan, kk).map(b => [b.i, b]));
    for (const [i, it] of index) {
      const [im, j] = slot.get(it), b = shown.get(i);
      if (!b) { im.setMatrixAt(j, ZERO); continue; }
      const len = (it.x1 - it.x0 - (it.kind === 'lintel' ? joint / 2 : joint)) / 1000, h = (it.y1 - it.y0 - joint) / 1000, t = (plan.thicknessMm + (it.kind === 'lintel' ? 10 : 0)) / 1000;
      p.set((it.x0 + it.x1) / 2000, (it.y0 + it.y1) / 2000 + b.drop / 1000, 0); s.set(Math.max(0.001, len), Math.max(0.001, h), t);
      im.setMatrixAt(j, m4.compose(p, q, s));
    }
    imB.instanceMatrix.needsUpdate = true; imL.instanceMatrix.needsUpdate = true;
  }
  return { group, setBuilt, counts: { blocks: blocks.length, lintels: lintels.length } };
}
