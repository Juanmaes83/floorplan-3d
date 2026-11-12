/* SCULPT-R03 · A3 three.js adapter. Turns RubikCabinetGeometry.parts (mm) into a THREE.Group in RUBIK's furniture
 * frame (metres, front at +z, base at y = 0). Uses the THREE instance the caller passes (RUBIK's vendor three r160):
 * no second copy of the library. Every mesh carries userData.r03 = the part it draws, so tests and the editor read
 * the 3D back. Placement in the plan (position, rotation.y = −rotationDeg, elevationMm) is the caller's, exactly as
 * buildFurniture does. NOT loaded by index.html. */
(function (root) {
  'use strict';
  const node = typeof module === 'object' && typeof require === 'function';
  const G = node ? require('./r03-cabinet-geometry.js') : root.RubikCabinetGeometry;
  const PALETTE = Object.freeze({ carcass: '#e9dcc6', interior: '#f6efe2', back: '#ddd0b8', plinth: '#5d554b', drawer: '#e2cfae', front: '#efe6d8', door: '#f1e8da', metal: '#8a9399', edge: '#6f6457' });
  const ROLE_COLOR = { side: 'carcass', base: 'carcass', top: 'carcass', divider: 'carcass', shelf: 'interior', back: 'back', plinth: 'plinth', 'drawer-box': 'drawer', 'drawer-front': 'front', handle: 'metal', rod: 'metal', door: 'door' };

  function build(THREE, outer, cabinet, { color, edges = true, doorOpacity = 1 } = {}) {
    const group = new THREE.Group(), mats = new Map(), m = v => v / 1000;
    const material = key => {
      if (!mats.has(key)) {
        const base = key === 'carcass' && color ? color : PALETTE[key];
        const opts = { color: base, roughness: key === 'metal' ? 0.35 : 0.7, metalness: key === 'metal' ? 0.6 : 0 };
        if (key === 'door' && doorOpacity < 1) Object.assign(opts, { transparent: true, opacity: doorOpacity, depthWrite: false });
        mats.set(key, new THREE.MeshStandardMaterial(opts));
      }
      return mats.get(key);
    };
    const edgeMat = new THREE.LineBasicMaterial({ color: PALETTE.edge, transparent: true, opacity: 0.55 });
    for (const p of G.parts(outer, cabinet)) {
      let mesh;
      if (p.role === 'rod') {
        mesh = new THREE.Mesh(new THREE.CylinderGeometry(m(p.radiusMm), m(p.radiusMm), m(p.w), 16), material('metal'));
        mesh.rotation.z = Math.PI / 2; mesh.position.set(m(p.x), m(p.y + p.h / 2), m(p.z));
      } else if (p.role === 'door') {
        // Built in the hinge frame and turned, exactly as the geometry module computed it.
        const pivot = new THREE.Group(); pivot.position.set(m(p.pivot.x), 0, m(p.pivot.z)); pivot.rotation.y = p.pivot.angleDeg * Math.PI / 180;
        mesh = new THREE.Mesh(new THREE.BoxGeometry(m(p.local.w), m(p.local.h), m(p.local.d)), material('door'));
        mesh.position.set(m(p.local.x), m(p.local.y + p.local.h / 2), m(p.local.z));
        if (edges) mesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry), edgeMat));
        mesh.userData.r03 = p; mesh.castShadow = mesh.receiveShadow = true; pivot.userData.r03Pivot = p.door;
        pivot.add(mesh); group.add(pivot); continue;
      } else {
        mesh = new THREE.Mesh(new THREE.BoxGeometry(m(p.w), m(p.h), m(p.d)), material(ROLE_COLOR[p.role] || 'carcass'));
        mesh.position.set(m(p.x), m(p.y + p.h / 2), m(p.z));
        if (edges && p.role !== 'handle') mesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry), edgeMat));
      }
      mesh.userData.r03 = p; mesh.castShadow = mesh.receiveShadow = true;
      group.add(mesh);
    }
    group.userData.r03Cabinet = { outer: { ...outer }, height: cabinet.height, front: cabinet.front };
    group.userData.dispose = () => { group.traverse(o => { if (o.geometry) o.geometry.dispose(); }); for (const mat of mats.values()) mat.dispose(); edgeMat.dispose(); };
    return group;
  }
  // The RUBIK placement of a furniture group (index.html buildFurniture): plan mm → metres, y down → z, clockwise → −y.
  function place(group, object, toWorld = (x, y) => ({ x: x / 1000, z: y / 1000 })) {
    const p = toWorld(object.position.x, object.position.y);
    group.position.set(p.x, (object.elevationMm || 0) / 1000, p.z);
    group.rotation.y = -object.rotationDeg * Math.PI / 180;
    return group;
  }
  const api = { PALETTE, build, place };
  if (node && module.exports) module.exports = api; else root.RubikCabinetThree = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
