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
  const FILES = Object.freeze(['scene.glb', 'manifest.json', 'LEEME.txt', 'rubik_blender_prepare.py']);
  const SCRIPT = 'rubik_blender_prepare.py'; // copia exacta de scripts/interop/blender-scene-import.py (preparación completa)
  const enc = new TextEncoder();
  function sortKeys(x) { if (Array.isArray(x)) return x.map(sortKeys); if (x && typeof x === 'object') return Object.fromEntries(Object.keys(x).sort().map(k => [k, sortKeys(x[k])])); return x; }
  const canonical = x => JSON.stringify(sortKeys(x));
  const safeName = s => String(s || 'proyecto').normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48) || 'proyecto';

  /** Manifiesto de la entrega. `capture` = resultado de View3D.captureScene() ({doc, info}). */
  async function manifest({ capture, glb, project, digest, app = {}, createdAt = null, prepareScript = null }) {
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
      // Dos caminos que NO dan el mismo render: la importación nativa trae geometría, materiales base, IDs y cámara con la luz por
      // defecto de Blender; la preparación completa (script incluido) reconstruye además la luz y los materiales como en el visor.
      blender: { import: 'File › Import › glTF 2.0 (.glb/.gltf), default options', transform: 'glTF Y up → Blender Z up: (XB, YB, ZB) = (x, -z, y), applied once by the importer',
        properties: 'each object carries rubik_id, rubik_role, rubik_level, rubik_mesh (Object Properties › Custom Properties)', camera: doc.view && doc.view.camera ? 'RUBIK_camera = viewer pose at capture' : 'none',
        paths: {
          native: { how: 'File › Import › glTF 2.0 › scene.glb', gives: ['geometry in metres', 'base colours/roughness/metalness', 'rubik_* identifiers', 'RUBIK_camera'],
            notIncluded: ['viewer sun, sky and night fixtures (Blender default world)', 'glass transmission (imported as alpha blend)', 'viewer back-face culling (ceilings may hide the interior from above)'],
            expectation: 'not the same render as the prepared scene or the RUBIK viewer' },
          prepared: prepareScript ? { script: SCRIPT, sha256: await digest(prepareScript), command: 'blender --background --factory-startup --python rubik_blender_prepare.py -- . escena-preparada',
            output: 'escena-preparada/scene.blend', adds: ['viewer sun and sky (declared conversion)', 'night fixtures when captured at night', 'glass transmission', 'back faces hidden as in the viewer', 'collections by role'],
            testedWith: 'Blender 5.2.1 LTS', note: 'runs headless only: it starts from an empty scene and never touches an open session' } : { available: false, reason: 'the preparation script could not be read in this browser; native import still works' } } },
      fallbacks: { texturesNotCopied: doc.meshes.filter(m => m.material && m.material.hasMap).length, assets: info.assets || {}, assetErrors: info.assetErrors || [],
        catalogModels: (info.objects || []).filter(o => o.catalogModel).map(o => o.id), proceduralObjects: (info.objects || []).filter(o => !o.catalogModel).length },
      // Solo la REGLA de estabilidad: las mediciones (fotogramas, ms) varían entre ejecuciones y romperían el determinismo.
      stability: info.stability ? { rule: 'no asset loading, no camera/door motion, identical scene signature', stableFrames: info.stability.stableFrames } : null,
      files: Object.assign({ 'scene.glb': { bytes: glb.length, sha256: await digest(glb) } }, prepareScript ? { [SCRIPT]: { bytes: prepareScript.length, sha256: await digest(prepareScript) } } : {}),
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

  const TEXT = {
    es: { title: 'RUBIK SOTA · Escena para Blender', two: 'Hay dos formas de abrir esta escena. NO producen el mismo render:',
      a: 'A · Importación directa (rápida): Blender › Archivo › Importar › glTF 2.0 › scene.glb, opciones por defecto.',
      aGives: '   Trae la geometría en metros, los colores base, los identificadores rubik_* y la cámara RUBIK_camera.',
      aMiss: '   No trae el sol, el cielo ni las luces del visor (usa la luz por defecto de Blender); el vidrio llega como transparencia simple y, vista desde arriba, la escena puede mostrar los techos.',
      b: 'B · Preparación completa (como en RUBIK): con Blender instalado, desde esta carpeta, ejecuta en una terminal:',
      bGives: '   Crea escena-preparada/scene.blend con el sol y el cielo del visor, las luminarias si la escena era de noche, vidrio con transmisión, techos ocultos desde arriba como en el visor y colecciones por tipo. Ábrelo después en Blender.',
      bNote: '   El script trabaja sin interfaz y parte de una escena vacía: nunca modifica un archivo que tengas abierto. Probado con Blender 5.2.1 LTS.',
      bMissing: 'B · Preparación completa: el script no se pudo incluir en esta descarga; la importación directa funciona igual.',
      props: 'Cada objeto lleva rubik_id, rubik_role, rubik_level y rubik_mesh en Propiedades de objeto › Propiedades personalizadas.',
      cam: 'La cámara RUBIK_camera reproduce el punto de vista del visor al preparar la escena.', nocam: 'Sin cámara: la escena se preparó sin pose de cámara.',
      content: (s) => `Contenido: ${s.meshes} mallas, ${s.vertices} vértices, ${s.faces} caras, ${s.entities} elementos identificados.`,
      limits: 'Es una observación visual de la vista 3D, no un levantamiento medido. No incluye fotos, texturas ni imágenes: las superficies con textura llegan con su color.',
      manifest: 'manifest.json contiene las huellas SHA-256, el marco de coordenadas, los dos caminos y los límites declarados.' },
    en: { title: 'RUBIK SOTA · Scene for Blender', two: 'There are two ways to open this scene. They do NOT produce the same render:',
      a: 'A · Direct import (quick): Blender › File › Import › glTF 2.0 › scene.glb, default options.',
      aGives: '   Brings geometry in metres, base colours, the rubik_* identifiers and the RUBIK_camera.',
      aMiss: '   It does not bring the viewer sun, sky or lights (Blender default lighting is used); glass arrives as plain transparency and, seen from above, ceilings may hide the interior.',
      b: 'B · Full preparation (as in RUBIK): with Blender installed, run this in a terminal from this folder:',
      bGives: '   It creates escena-preparada/scene.blend with the viewer sun and sky, the light fixtures if the scene was at night, transmissive glass, ceilings hidden from above as in the viewer and collections by type. Then open it in Blender.',
      bNote: '   The script runs without a user interface and starts from an empty scene: it never changes a file you have open. Tested with Blender 5.2.1 LTS.',
      bMissing: 'B · Full preparation: the script could not be included in this download; direct import works the same.',
      props: 'Each object carries rubik_id, rubik_role, rubik_level and rubik_mesh under Object Properties › Custom Properties.',
      cam: 'The RUBIK_camera object reproduces the viewer viewpoint at preparation time.', nocam: 'No camera: the scene was prepared without a camera pose.',
      content: (s) => `Contents: ${s.meshes} meshes, ${s.vertices} vertices, ${s.faces} faces, ${s.entities} identified elements.`,
      limits: 'A visual observation of the 3D view, not a measured survey. No photos, textures or images are included: textured surfaces arrive as their colour.',
      manifest: 'manifest.json holds the SHA-256 fingerprints, the coordinate frame, both paths and the declared limits.' },
    zh: { title: 'RUBIK SOTA · Blender 场景', two: '打开此场景有两种方式，两者的渲染结果并不相同：',
      a: 'A · 直接导入（快速）：Blender › 文件 › 导入 › glTF 2.0 › scene.glb，使用默认选项。',
      aGives: '   包含以米为单位的几何体、基础颜色、rubik_* 标识和 RUBIK_camera 相机。',
      aMiss: '   不包含查看器的太阳、天空和灯光（使用 Blender 默认照明）；玻璃仅为简单透明，从上方观看时天花板可能遮挡室内。',
      b: 'B · 完整准备（与 RUBIK 一致）：安装 Blender 后，在此文件夹的终端中运行：',
      bGives: '   将生成 escena-preparada/scene.blend，包含查看器的太阳和天空、夜景时的灯具、透射玻璃、与查看器一致的俯视隐藏天花板以及按类型分组的集合。然后在 Blender 中打开。',
      bNote: '   该脚本在无界面模式下从空场景开始运行，不会修改您已打开的文件。已在 Blender 5.2.1 LTS 上测试。',
      bMissing: 'B · 完整准备：本次下载未能包含该脚本；直接导入仍可正常使用。',
      props: '每个对象在 对象属性 › 自定义属性 中带有 rubik_id、rubik_role、rubik_level 和 rubik_mesh。',
      cam: 'RUBIK_camera 相机还原了准备场景时查看器的视角。', nocam: '无相机：准备场景时没有相机姿态。',
      content: (s) => `内容：${s.meshes} 个网格，${s.vertices} 个顶点，${s.faces} 个面，${s.entities} 个已识别元素。`,
      limits: '这是 3D 视图的视觉观察结果，并非实测数据。不包含照片、纹理或图像：带纹理的表面仅保留其颜色。',
      manifest: 'manifest.json 包含 SHA-256 指纹、坐标系、两种方式及声明的限制。' },
  };
  function readme(m, lang) {
    const t = TEXT[lang] || TEXT.es, s = m.scene.stats, p = (m.blender.paths || {}).prepared || {};
    return [t.title, '', t.two, '', t.a, t.aGives, t.aMiss, '', ...(p.script ? [t.b, '   ' + p.command, t.bGives, t.bNote] : [t.bMissing]), '',
      t.props, m.blender.camera !== 'none' ? t.cam : t.nocam, '', t.content(s), t.limits, t.manifest].join('\n') + '\n';
  }

  /** Entradas del ZIP (Map nombre → bytes) y nombre de descarga. `zip` = FloorPlanPackage.zip. */
  function packageFiles({ manifest: m, glb, lang, zip, prepareScript = null }) {
    const entries = new Map([['scene.glb', glb], ['manifest.json', enc.encode(JSON.stringify(m, null, 1) + '\n')], ['LEEME.txt', enc.encode(readme(m, lang))]]);
    if (prepareScript && m.files[SCRIPT]) entries.set(SCRIPT, prepareScript); // solo si el manifiesto lo declara (huella incluida)
    const name = `rubik-escena-blender-${safeName(m.source.projectId)}.zip`;
    if (typeof zip !== 'function') return { entries, name, bytes: null };
    return { entries, name, bytes: zip(entries, { check: n => { if (!FILES.includes(n)) throw Error('Unexpected file in scene package: ' + n); return n; } }) };
  }

  return Object.freeze({ FORMAT, VERSION, FILES, SCRIPT, TEXT, canonical, safeName, manifest, record, readme, packageFiles });
});
