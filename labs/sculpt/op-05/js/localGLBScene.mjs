// PORT JS · openPlan3D@771c9e1ad30bd1c3cc7584d6eca74deb2e14943d src/lib/utils/localGLBScene.ts (MIT, ver ../upstream/LICENSE)
// SHA-256 del original: b6e0d4fb4568613f442909e474b1b60b62c6901995048b05869d11d9c79157f3. Generado por js/port.cjs (stripTypeScriptTypes); no editar a mano.
const MAX_NODES = 512;
const MAX_DEPTH = 64;
const MAX_PRIMITIVES = 1024;
const MAX_VERTEX_REFERENCES = 2_000_000;
function fail(message        )        { throw new Error(`Invalid GLB scene: ${message}`); }
function records(value         , maximum        , name        )                        {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.length > maximum || value.some(v => !v || typeof v !== 'object' || Array.isArray(v))) fail(`Invalid ${name} table.`);
  return value;
}
function index(value         , length        )         {
  if (!Number.isSafeInteger(value) || (value          ) < 0 || (value          ) >= length) fail('A scene reference is out of range.');
  return value          ;
}
function indices(value         , length        )           {
  if (!Array.isArray(value) || value.length > MAX_NODES) fail('Invalid node list.');
  const result = value.map(v => index(v, length));
  if (new Set(result).size !== result.length) fail('A node is referenced twice in the same list.');
  return result;
}

/** Bound static scene traversal and per-scene draw complexity before loading.
 * Accessor byte ranges, geometry values and material extensions are checked separately.
 */
export function validateLocalGLBScene(document                     ) {
  const nodes = records(document.nodes, MAX_NODES, 'node');
  const scenes = records(document.scenes, 32, 'scene');
  const meshes = records(document.meshes, 256, 'mesh');
  const accessors = records(document.accessors, 4096, 'accessor');
  if (!scenes.length) fail('The model has no scene.');
  const activeScene = document.scene === undefined ? 0 : index(document.scene, scenes.length);
  const costs = meshes.map(mesh => {
    const primitives = records(mesh.primitives, 128, 'primitive');
    if (!primitives.length) fail('A mesh has no primitives.');
    let vertices = 0;
    for (const primitive of primitives) {
      const position = accessors[index(primitive.attributes?.POSITION, accessors.length)];
      if (position.type !== 'VEC3' || !Number.isSafeInteger(position.count) || position.count <= 0) fail('Invalid position accessor.');
      const rendered = primitive.indices === undefined ? position : accessors[index(primitive.indices, accessors.length)];
      if (!Number.isSafeInteger(rendered.count) || rendered.count <= 0 || rendered.count > MAX_VERTEX_REFERENCES) fail('Invalid or excessive primitive size.');
      vertices += rendered.count;
      if (vertices > MAX_VERTEX_REFERENCES) fail('The mesh exceeds the geometry budget.');
    }
    return { primitives: primitives.length, vertices };
  });
  const parents = new Map                ();
  const children = nodes.map((node, parent) => {
    if (node.mesh !== undefined) index(node.mesh, meshes.length);
    for (const [field, size] of [['matrix', 16], ['translation', 3], ['rotation', 4], ['scale', 3]]         ) {
      const value = node[field];
      if (value !== undefined && (!Array.isArray(value) || value.length !== size || value.some(v => typeof v !== 'number' || !Number.isFinite(v)))) fail('A node transform is invalid.');
    }
    if (node.matrix !== undefined && ['translation', 'rotation', 'scale'].some(field => node[field] !== undefined)) fail('Use either a matrix or translation/rotation/scale.');
    const children = node.children === undefined ? [] : indices(node.children, nodes.length);
    for (const child of children) {
      if (parents.has(child)) fail('A node has multiple parents.');
      parents.set(child, parent);
    }
    return children;
  });
  const state = new Uint8Array(nodes.length), depths = new Uint16Array(nodes.length);
  function depth(node        )         {
    if (state[node] === 1) fail('The scene graph contains a cycle.');
    if (state[node] === 2) return depths[node];
    state[node] = 1;
    let result = 1;
    for (const child of children[node]) result = Math.max(result, 1 + depth(child));
    if (result > MAX_DEPTH) fail('The scene graph is too deep.');
    state[node] = 2; depths[node] = result;
    return result;
  }
  for (let i = 0; i < nodes.length; i++) depth(i);
  const totals = scenes.map(scene => {
    const roots = indices(scene.nodes ?? [], nodes.length);
    const seen = new Set        ();
    let primitives = 0, vertices = 0;
    const pending = [...roots];
    while (pending.length) {
      const id = pending.pop() ;
      if (seen.has(id)) fail('A scene includes a node more than once.');
      seen.add(id);
      const mesh = nodes[id].mesh;
      if (mesh !== undefined) {
        primitives += costs[mesh].primitives; vertices += costs[mesh].vertices;
        if (primitives > MAX_PRIMITIVES || vertices > MAX_VERTEX_REFERENCES) fail('Instanced meshes exceed the scene budget.');
      }
      pending.push(...children[id]);
    }
    return { nodes: seen.size, primitives, vertices };
  });
  if (!totals[activeScene].primitives) fail('The active scene has no mesh.');
  return { activeScene, scenes: totals };
}
