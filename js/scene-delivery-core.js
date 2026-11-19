/* RUBIK SOTA · OP-10 C5/C6 · Entrega «Escena para Blender» (núcleo puro, sin DOM ni red).
 *
 * C5 · Paquete local: scene.glb (js/scene-capture-core.js#toGLB) + manifest.json + LEEME.txt, empaquetados con el ZIP
 *      existente (js/project-package.js#zip). No hay otro escritor ZIP ni otro exportador GLB del proyecto.
 * C6 · Registro de la entrega para Studio E3 / expediente F0: huellas de la escena y del manifiesto enlazadas a la identidad
 *      del proyecto. La identidad CONFIRMADA solo la aporta la autoridad F0 (revisión transaccional); si no llega, el registro
 *      queda en «observed-only» y lo dice. Nunca se calcula aquí un contentId alternativo (riesgo R4 del laboratorio).
 * Las funciones de huella reciben `digest(bytes) → Promise<hex>` para funcionar igual en navegador (crypto.subtle) y Node.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.RubikSceneDelivery = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const FORMAT = 'rubik-sota.scene-delivery', VERSION = '1.0.0';
  const FILES = Object.freeze(['scene.glb', 'manifest.json', 'LEEME.txt']);
  const enc = new TextEncoder();
  function sortKeys(x) { if (Array.isArray(x)) return x.map(sortKeys); if (x && typeof x === 'object') return Object.fromEntries(Object.keys(x).sort().map(k => [k, sortKeys(x[k])])); return x; }
  const canonical = x => JSON.stringify(sortKeys(x));
  const safeName = s => String(s || 'proyecto').normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48) || 'proyecto';

  /** Manifiesto de la entrega. `capture` = resultado de View3D.captureScene() ({doc, info}). */
  async function manifest({ capture, glb, project, digest, app = {}, createdAt = null }) {
    if (!capture || !capture.doc || !glb || typeof digest !== 'function') throw Error('manifest: capture, glb and digest are required');
    const doc = capture.doc, info = capture.info || {};
    const projectSha = project ? await digest(enc.encode(canonical(project))) : null;
    return {
      format: FORMAT, version: VERSION, status: 'integration-candidate · observed visual snapshot, not canonical geometry',
      createdAt, // null por defecto: el manifiesto es determinista; quien entrega puede fecharlo
      source: { projectId: info.projectId || (project && project.id) || null, projectUpdatedAt: info.projectUpdatedAt || (project && project.updatedAt) || null,
        observedProjectSha256: projectSha, meaning: 'project as observed in the viewer at capture time; not a confirmed F0 revision' },
      app: { revision: app.revision || null, captureCore: doc.version, schema: doc.schema },
      scene: { scope: doc.scope, frame: doc.frame, view: doc.view, units: doc.units, axes: doc.axes, stats: doc.stats, excluded: doc.excluded, skipped: doc.skipped, policy: doc.policy },
      blender: { import: 'File › Import › glTF 2.0 (.glb/.gltf), default options', transform: 'glTF Y up → Blender Z up: (XB, YB, ZB) = (x, -z, y), applied once by the importer',
        properties: 'each object carries rubik_id, rubik_role, rubik_level, rubik_mesh (Object Properties › Custom Properties)', camera: doc.view && doc.view.camera ? 'RUBIK_camera = viewer pose at capture' : 'none' },
      fallbacks: { texturesNotCopied: doc.meshes.filter(m => m.material && m.material.hasMap).length, assets: info.assets || {}, assetErrors: info.assetErrors || [],
        catalogModels: (info.objects || []).filter(o => o.catalogModel).map(o => o.id), proceduralObjects: (info.objects || []).filter(o => !o.catalogModel).length },
      // Solo la REGLA de estabilidad: las mediciones (fotogramas, ms) varían entre ejecuciones y romperían el determinismo.
      stability: info.stability ? { rule: 'no asset loading, no camera/door motion, identical scene signature', stableFrames: info.stability.stableFrames } : null,
      files: { 'scene.glb': { bytes: glb.length, sha256: await digest(glb) } },
      privacy: 'no images, photos, textures, URLs or free text from the project are included; geometry, colours and IDs only',
      limitations: ['Visual observation of the 3D view: procedural furniture is the viewer representation, not manufacturer geometry.',
        'Textured surfaces travel as their flat colour (hasMap declared).', 'Not a measured survey: accuracy against a real building is not claimed.'],
    };
  }

  /** C6 · registro para Studio E3 / expediente. `confirmed` solo desde la autoridad F0: {contentId, revision, confirmedAt}. */
  async function record({ manifest: m, digest, confirmed = null }) {
    const manifestBytes = enc.encode(canonical(m));
    const ok = confirmed && typeof confirmed.contentId === 'string' && /^[0-9a-f]{64}$/.test(confirmed.contentId);
    return {
      kind: 'scene-delivery', format: FORMAT, version: VERSION,
      sceneSha256: m.files['scene.glb'].sha256, manifestSha256: await digest(manifestBytes),
      projectId: m.source.projectId, observedProjectSha256: m.source.observedProjectSha256,
      identity: ok ? { status: 'confirmed', contentId: confirmed.contentId, revision: confirmed.revision ?? null, confirmedAt: confirmed.confirmedAt ?? null }
        : { status: 'observed-only', contentId: null, reason: 'no confirmed F0 revision supplied by the expediente authority' },
      studio: { sourceKind: 'blender-scene', declaredSource: 'RUBIK View3D observed snapshot (OP-10)', rights: 'project owner; no third-party images or textures', fidelity: 'observed-visual' },
    };
  }

  function readme(m, lang) {
    const es = lang !== 'en';
    const s = m.scene.stats;
    return (es ? [
      'RUBIK SOTA · Escena para Blender', '',
      'Abrir: Blender › Archivo › Importar › glTF 2.0 (.glb/.gltf) › scene.glb (opciones por defecto).',
      'Unidades: metros. Cada objeto lleva rubik_id, rubik_role, rubik_level y rubik_mesh en Propiedades de objeto › Propiedades personalizadas.',
      m.blender.camera !== 'none' ? 'La cámara RUBIK_camera reproduce el punto de vista del visor al preparar la escena.' : 'Sin cámara: la escena se preparó sin pose de cámara.',
      '', `Contenido: ${s.meshes} mallas, ${s.vertices} vértices, ${s.faces} caras, ${s.entities} elementos identificados.`,
      'Es una observación visual de la vista 3D, no un levantamiento medido. No incluye fotos, texturas ni imágenes.',
      'manifest.json contiene las huellas SHA-256, el marco de coordenadas y los límites declarados.',
    ] : [
      'RUBIK SOTA · Scene for Blender', '',
      'Open: Blender › File › Import › glTF 2.0 (.glb/.gltf) › scene.glb (default options).',
      'Units: metres. Each object carries rubik_id, rubik_role, rubik_level and rubik_mesh under Object Properties › Custom Properties.',
      m.blender.camera !== 'none' ? 'The RUBIK_camera object reproduces the viewer viewpoint at preparation time.' : 'No camera: the scene was prepared without a camera pose.',
      '', `Contents: ${s.meshes} meshes, ${s.vertices} vertices, ${s.faces} faces, ${s.entities} identified elements.`,
      'A visual observation of the 3D view, not a measured survey. No photos, textures or images are included.',
      'manifest.json holds the SHA-256 fingerprints, the coordinate frame and the declared limits.',
    ]).join('\n') + '\n';
  }

  /** Entradas del ZIP (Map nombre → bytes) y nombre de descarga. `zip` = FloorPlanPackage.zip. */
  function packageFiles({ manifest: m, glb, lang, zip }) {
    const entries = new Map([['scene.glb', glb], ['manifest.json', enc.encode(JSON.stringify(m, null, 1) + '\n')], ['LEEME.txt', enc.encode(readme(m, lang))]]);
    const name = `rubik-escena-blender-${safeName(m.source.projectId)}.zip`;
    if (typeof zip !== 'function') return { entries, name, bytes: null };
    return { entries, name, bytes: zip(entries, { check: n => { if (!FILES.includes(n)) throw Error('Unexpected file in scene package: ' + n); return n; } }) };
  }

  return Object.freeze({ FORMAT, VERSION, FILES, canonical, safeName, manifest, record, readme, packageFiles });
});
