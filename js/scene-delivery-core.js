/* RUBIK SOTA · OP-10 C5/C6 · Entrega «Escena para Blender» (núcleo puro, sin DOM ni red).
 *
 * C5 · Paquete local: scene.glb (js/scene-capture-core.js#toGLB) + manifest.json + LEEME.txt, empaquetados con el ZIP
 *      existente (js/project-package.js#zip). No hay otro escritor ZIP ni otro exportador GLB del proyecto.
 * C6 · Registro de la entrega para Studio E3 / expediente F0: huellas de la escena y del manifiesto enlazadas a la identidad
 *      del proyecto. La identidad CONFIRMADA solo la aporta la autoridad F0 (revisión transaccional); si no llega, el registro
 *      queda en «observed-only» y lo dice. Nunca se calcula aquí un contentId alternativo (riesgo R4 del laboratorio).
 * Las funciones de huella reciben `digest(bytes) → Promise<hex>` para funcionar igual en navegador (crypto.subtle) y Node.
 * M03 · Kit de render (opcional, compatible): con `kit`, `rooms` y `reference` el ZIP lleva además el render Cycles, la
 *      verificación de reapertura, los perfiles, los lanzadores (Windows y macOS/Linux), las estancias (geometría y nombre
 *      VISIBLE, sin texto libre) y la imagen de referencia de la vista 3D. Sin ellos el paquete es exactamente el anterior.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.RubikSceneDelivery = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const FORMAT = 'rubik-sota.scene-delivery', VERSION = '1.0.0';
  const SCRIPT = 'rubik_blender_prepare.py'; // copia exacta de scripts/interop/blender-scene-import.py (preparación completa)
  // M03 · kit: nombre en el ZIP ← origen en el repositorio (copias exactas, huella en el manifiesto).
  const KIT = Object.freeze({ render: 'rubik_blender_render.py', verify: 'rubik_blender_verify.py', profiles: 'rubik_render_profiles.json', sh: 'renderizar.sh', bat: 'RENDERIZAR-windows.bat', licence: 'LICENCIA-SCRIPTS.txt', copying: 'COPYING-GPL-3.0.txt',
    rodaje: 'rubik_blender_rodaje.py', recursos: 'rubik_rodaje_recursos.json', rodar: 'rodar.sh', rodarBat: 'RODAR-windows.bat' });
  const KIT_SOURCES = Object.freeze({ render: 'scripts/interop/blender-scene-render.py', verify: 'scripts/interop/blender-scene-reopen.py', profiles: 'scripts/interop/blender-render-profiles.json',
    sh: 'scripts/interop/blender-kit/renderizar.sh', bat: 'scripts/interop/blender-kit/RENDERIZAR-windows.bat',
    licence: 'scripts/interop/blender-kit/LICENCIA-SCRIPTS.txt', copying: 'scripts/interop/blender-kit/COPYING-GPL-3.0.txt',
    rodaje: 'scripts/interop/blender-rodaje.py', recursos: 'scripts/interop/rodaje-recursos.json', rodar: 'scripts/interop/blender-kit/rodar.sh',
    rodarBat: 'scripts/interop/blender-kit/RODAR-windows.bat' });
  const ROOMS = 'rubik-estancias.json', REFERENCE = 'referencia-rubik.png', MATERIALS = 'rubik-materiales.json'; // MATERIALS: Material Tokens 1.0.0 (opcional)
  const FILES = Object.freeze(['scene.glb', 'manifest.json', 'LEEME.txt', SCRIPT, ROOMS, REFERENCE, MATERIALS, ...Object.values(KIT)]);
  const enc = new TextEncoder();
  function sortKeys(x) { if (Array.isArray(x)) return x.map(sortKeys); if (x && typeof x === 'object') return Object.fromEntries(Object.keys(x).sort().map(k => [k, sortKeys(x[k])])); return x; }
  const canonical = x => JSON.stringify(sortKeys(x));
  const safeName = s => String(s || 'proyecto').normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48) || 'proyecto';

  /** M03 · Estancias para las cámaras interiores y el color de suelos del render. Sólo geometría (mm, plano de RUBIK),
   *  si cuenta para la superficie, planta, color del material de suelo del proyecto y el NOMBRE VISIBLE que pasa la
   *  interfaz (`label(room)`: el embudo de nombres de RUBIK, nunca el nombre guardado en bruto). */
  function roomsDoc({ project, label }) {
    if (!project || !Array.isArray(project.rooms)) throw Error('roomsDoc: project is required');
    const mats = new Map((project.materials || []).map(m => [m.id, m]));
    const rooms = project.rooms.filter(r => Array.isArray(r.polygon) && r.polygon.length >= 3).map(r => {
      const fm = mats.get(r.floorMaterialId) || {}, color = fm.appearance?.color;
      // 1.2.0 (aditivo) · clave del material de suelo y de su familia de catálogo (identificadores ASCII del sistema, nunca
      // texto libre): el rodaje elige el acabado por material y familia, no solo por coincidencia exacta de color.
      const key = v => typeof v === 'string' && /^[A-Za-z0-9_:.-]{1,60}$/.test(v) ? v : null;
      return { id: r.id, label: String(typeof label === 'function' ? label(r) : r.id).slice(0, 80), polygon: r.polygon.map(p => ({ x: p.x, y: p.y })),
        counted: r.counted !== false, levelId: r.levelId ?? null, floorColor: /^#[0-9a-f]{6}$/i.test(color || '') ? color : null,
        floorMaterialId: key(r.floorMaterialId), floorPreset: key(fm.appearance?.preset) };
    });
    // §4 (1.1.0, aditivo) · tipo de catálogo de cada objeto (clave ASCII, nunca el nombre guardado): el render local da a
    // cada pieza el acabado de su tipo (tejido, madera, vegetación…) en lugar de adivinarlo por el color.
    const objects = (Array.isArray(project.objects) ? project.objects : []).filter(o => o && typeof o.id === 'string')
      .map(o => ({ id: o.id, type: /^[a-z0-9_-]{1,40}$/.test(o.type || '') ? o.type : null }));
    return { format: 'rubik-sota.scene-rooms', version: '1.2.0', units: 'mm (RUBIK plan)', wallHeightMm: (project.defaults && project.defaults.wallHeightMm) || 2800, rooms, objects };
  }

  /** Manifiesto de la entrega. `capture` = resultado de View3D.captureScene() ({doc, info}). */
  async function manifest({ capture, glb, project, digest, app = {}, createdAt = null, prepareScript = null, kit = null, rooms = null, reference = null, captureId = null, materials = null }) {
    if (!capture || !capture.doc || !glb || typeof digest !== 'function') throw Error('manifest: capture, glb and digest are required');
    const doc = capture.doc, info = capture.info || {};
    const projectSha = project ? await digest(enc.encode(canonical(project))) : null;
    return {
      format: FORMAT, version: VERSION, status: 'integration-candidate · observed visual snapshot, not canonical geometry',
      createdAt, // null por defecto: el manifiesto es determinista; quien entrega puede fecharlo
      ...(captureId ? { captureId } : {}),
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
            testedWith: 'Blender 5.2.1 LTS', note: 'runs headless only: it starts from an empty scene and never touches an open session' } : { available: false, reason: 'the preparation script could not be read in this browser; native import still works' },
          ...(kit ? { render: kitComplete(kit, rooms, prepareScript) ? { launchers: { windows: KIT.bat, macosLinux: 'sh ' + KIT.sh + ' [review|preview|delivery]' },
            steps: ['prepare (rubik_blender_prepare.py)', 'render with Cycles (rubik_blender_render.py, resumable view by view)', 'verify the saved scene reopens identically (rubik_blender_verify.py, fresh process)'],
            output: 'resultados/<profile>/: one PNG per view, review.blend (editable), render-report.json, verificacion-reapertura.json',
            views: 'auto = viewer camera + axonometry + up to 4 representative interiors (counted rooms >= 5 m2, largest first)',
            review: 'RUBIK › Deliver › Scene for Blender › Review render… (integrity, comparison, clean and branded delivery)',
            testedWith: 'Blender 5.2.1 LTS, Cycles CPU; see handoff for platform coverage' } : { available: false, reason: 'some render files could not be read in this browser; preparation and import still work' } } : {}) } },
      fallbacks: { texturesNotCopied: doc.meshes.filter(m => m.material && m.material.hasMap).length, assets: info.assets || {}, assetErrors: info.assetErrors || [],
        catalogModels: (info.objects || []).filter(o => o.catalogModel).map(o => o.id), proceduralObjects: (info.objects || []).filter(o => !o.catalogModel).length },
      // Solo la REGLA de estabilidad: las mediciones (fotogramas, ms) varían entre ejecuciones y romperían el determinismo.
      stability: info.stability ? { rule: 'no asset loading, no camera/door motion, identical scene signature', stableFrames: info.stability.stableFrames } : null,
      files: Object.assign({ 'scene.glb': { bytes: glb.length, sha256: await digest(glb) } }, prepareScript ? { [SCRIPT]: { bytes: prepareScript.length, sha256: await digest(prepareScript) } } : {},
        await kitFiles({ kit, rooms, reference, digest, prepareScript, materials })),
      privacy: kit ? 'no photos, textures, URLs or free text from the project are included; geometry, colours, IDs, the displayed room names and one reference image of the 3D view (referencia-rubik.png)'
        : 'no images, photos, textures, URLs or free text from the project are included; geometry, colours and IDs only',
      limitations: ['Visual observation of the 3D view: procedural furniture is the viewer representation, not manufacturer geometry.',
        'Textured surfaces travel as their flat colour (hasMap declared).', 'Not a measured survey: accuracy against a real building is not claimed.'],
    };
  }

  function kitComplete(kit, rooms, prepareScript) { return !!(kit && prepareScript && rooms && Object.keys(KIT).every(k => kit[k])); }
  /** Huellas del kit, sólo si está completo (un kit a medias no se entrega: el LEEME lo dice y la importación sigue igual). */
  async function kitFiles({ kit, rooms, reference, digest, prepareScript, materials = null }) {
    if (!kitComplete(kit, rooms, prepareScript)) return {};
    const out = {}, roomsBytes = enc.encode(JSON.stringify(rooms, null, 1) + '\n');
    for (const [k, name] of Object.entries(KIT)) out[name] = { bytes: kit[k].length, sha256: await digest(kit[k]) };
    out[ROOMS] = { bytes: roomsBytes.length, sha256: await digest(roomsBytes) };
    if (reference) out[REFERENCE] = { bytes: reference.length, sha256: await digest(reference) };
    if (materials) { const mb = enc.encode(JSON.stringify(materials, null, 1) + '\n'); out[MATERIALS] = { bytes: mb.length, sha256: await digest(mb) }; }
    return out;
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
      manifest: 'manifest.json contiene las huellas SHA-256, el marco de coordenadas, los dos caminos y los límites declarados.',
      c: "C · Render Cycles y entrega, sin escribir código (recomendado):",
      c1: "   1) Instala Blender (gratuito, blender.org). Probado con Blender 5.2.1 LTS.",
      c2: "   2) Windows: doble clic en RENDERIZAR-windows.bat. macOS / Linux: en una terminal, desde esta carpeta, «sh renderizar.sh».",
      c3: "      Por defecto usa el perfil «review» (960×600, revisión arquitectónica). Para el cliente, «delivery» (1600×1000, más lento): «sh renderizar.sh delivery» o «RENDERIZAR-windows.bat delivery». Rápido: «preview».",
      c4: "   3) Se crean escena-preparada/ y resultados/<perfil>/ con una imagen PNG por vista (vista de RUBIK, axonometría e interiores), review.blend editable y los informes.",
      c5: "   4) Si se interrumpe (cierre, Ctrl+C, corte de luz), vuelve a lanzarlo: continúa por la vista que faltaba. Nunca borra nada.",
      c6: "   5) Vuelve a RUBIK › Entregar › Escena para Blender › «Revisar render…» y elige manifest.json del ZIP original. Después elige la carpeta resultados/<perfil>: RUBIK comprueba que es tu proyecto, lo compara con la vista 3D y prepara la entrega (originales limpios y copias con tu marca).",
      c7: "   Lo añadido para el render (cámaras interiores, luz de relleno por estancia, exposición, fondo de la axonometría) se declara en render-report.json: no es un dato del proyecto.",
      c8: "   Licencia: los tres scripts .py de Blender se distribuyen bajo GPL-3.0-or-later (LICENCIA-SCRIPTS.txt, COPYING-GPL-3.0.txt). No afecta a RUBIK ni a tu proyecto, imágenes, renders o archivos .blend, que son tuyos.",
      cMissing: "C · Render y entrega: algunos archivos del kit no se pudieron incluir esta vez; usa la preparación B y renderiza desde Blender.",
      d: "D · Rodaje en vídeo (entrega recomendada 2560×1440): Windows, doble clic en RODAR-windows.bat; macOS / Linux, «sh rodar.sh entrega1440 interior dia». Revisión rápida a 720p: «revision». 4K opcional: «entrega4k». Reanudable; el informe rodaje-report.json declara acabados, aproximaciones y piezas pendientes." },
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
      manifest: 'manifest.json holds the SHA-256 fingerprints, the coordinate frame, both paths and the declared limits.',
      c: "C · Cycles render and delivery, without writing code (recommended):",
      c1: "   1) Install Blender (free, blender.org). Tested with Blender 5.2.1 LTS.",
      c2: "   2) Windows: double-click RENDERIZAR-windows.bat. macOS / Linux: in a terminal, from this folder, run “sh renderizar.sh”.",
      c3: "      The default profile is “review” (960×600, architectural review). For the client, “delivery” (1600×1000, slower): “sh renderizar.sh delivery” or “RENDERIZAR-windows.bat delivery”. Quick check: “preview”.",
      c4: "   3) It creates escena-preparada/ and resultados/<profile>/ with one PNG per view (RUBIK view, axonometry and interiors), an editable review.blend and the reports.",
      c5: "   4) If it is interrupted (closed, Ctrl+C, power cut), run it again: it resumes at the missing view. It never deletes anything.",
      c6: "   5) Back in RUBIK › Deliver › Scene for Blender › “Review render…”, choose manifest.json from the original ZIP. Then choose the folder resultados/<profile>: RUBIK checks it is your project, compares it with the 3D view and prepares the delivery (clean originals and branded copies).",
      c7: "   What the render adds (interior cameras, per-room fill light, exposure, axonometry background) is declared in render-report.json: it is not project data.",
      c8: "   Licence: the three Blender .py scripts are distributed under GPL-3.0-or-later (LICENCIA-SCRIPTS.txt, COPYING-GPL-3.0.txt). It does not cover RUBIK or your project, images, renders or .blend files, which are yours.",
      cMissing: "C · Render and delivery: some kit files could not be included this time; use preparation B and render from Blender.",
      d: "D · Video shoot (recommended delivery 2560×1440): Windows, double-click RODAR-windows.bat; macOS / Linux, “sh rodar.sh entrega1440 interior dia”. Quick 720p review: “revision”. Optional 4K: “entrega4k”. Resumable; rodaje-report.json declares finishes, approximations and pending pieces." },
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
      manifest: 'manifest.json 包含 SHA-256 指纹、坐标系、两种方式及声明的限制。',
      c: "C · Cycles 渲染与交付，无需编写代码（推荐）：",
      c1: "   1) 安装 Blender（免费，blender.org）。已在 Blender 5.2.1 LTS 上测试。",
      c2: "   2) Windows：双击 RENDERIZAR-windows.bat。macOS / Linux：在此文件夹的终端中运行“sh renderizar.sh”。",
      c3: "      默认使用“review”配置（960×600，建筑审阅）。交付客户使用“delivery”（1600×1000，较慢）：“sh renderizar.sh delivery”或“RENDERIZAR-windows.bat delivery”。快速检查：“preview”。",
      c4: "   3) 将生成 escena-preparada/ 和 resultados/<配置>/，每个视图一张 PNG（RUBIK 视图、轴测图和室内）、可编辑的 review.blend 及报告。",
      c5: "   4) 如中断（关闭、Ctrl+C、断电），重新运行即可从缺少的视图继续。不会删除任何内容。",
      c6: "   5) 回到 RUBIK › 交付 › Blender 场景 › “审阅渲染…”，先选择原始 ZIP 中的 manifest.json，再选择 resultados/<配置> 文件夹：RUBIK 会核对是否为您的项目，与 3D 视图对比并准备交付（干净原图和带品牌的副本）。",
      c7: "   为渲染添加的内容（室内相机、各房间补光、曝光、轴测背景）已在 render-report.json 中声明，并非项目数据。",
      c8: "   许可：三个 Blender .py 脚本按 GPL-3.0-or-later 分发（LICENCIA-SCRIPTS.txt、COPYING-GPL-3.0.txt）。不涉及 RUBIK 或您的项目、图像、渲染和 .blend 文件，它们归您所有。",
      cMissing: "C · 渲染与交付：本次未能包含部分工具文件；请使用准备方式 B 并在 Blender 中渲染。",
      d: "D · 视频拍摄（推荐交付 2560×1440）：Windows 双击 RODAR-windows.bat；macOS / Linux 运行“sh rodar.sh entrega1440 interior dia”。720p 快速审阅：“revision”。可选 4K：“entrega4k”。可续传；rodaje-report.json 列出材质、近似处理和待处理部件。" },
  };
  function readme(m, lang) {
    const t = TEXT[lang] || TEXT.es, s = m.scene.stats, p = (m.blender.paths || {}).prepared || {};
    const r = (m.blender.paths || {}).render;
    return [t.title, '', ...(r ? (r.launchers ? [t.c, t.c1, t.c2, t.c3, t.c4, t.c5, t.c6, t.c7, t.c8, '', t.d, ''] : [t.cMissing, '']) : []),
      t.two, '', t.a, t.aGives, t.aMiss, '', ...(p.script ? [t.b, '   ' + p.command, t.bGives, t.bNote] : [t.bMissing]), '',
      t.props, m.blender.camera !== 'none' ? t.cam : t.nocam, '', t.content(s), t.limits, t.manifest].join('\n') + '\n';
  }

  /** Entradas del ZIP (Map nombre → bytes) y nombre de descarga. `zip` = FloorPlanPackage.zip. */
  function packageFiles({ manifest: m, glb, lang, zip, prepareScript = null, kit = null, rooms = null, reference = null, materials = null }) {
    const entries = new Map([['scene.glb', glb], ['manifest.json', enc.encode(JSON.stringify(m, null, 1) + '\n')], ['LEEME.txt', enc.encode(readme(m, lang))]]);
    if (prepareScript && m.files[SCRIPT]) entries.set(SCRIPT, prepareScript); // solo si el manifiesto lo declara (huella incluida)
    // M03 · kit, sólo con las huellas del manifiesto (mismos bytes que se declararon).
    if (kit && rooms && m.files[ROOMS]) {
      for (const [k, name] of Object.entries(KIT)) if (m.files[name]) entries.set(name, kit[k]);
      entries.set(ROOMS, enc.encode(JSON.stringify(rooms, null, 1) + '\n'));
      if (reference && m.files[REFERENCE]) entries.set(REFERENCE, reference);
      if (materials && m.files[MATERIALS]) entries.set(MATERIALS, enc.encode(JSON.stringify(materials, null, 1) + '\n'));
    }
    const name = `rubik-escena-blender-${safeName(m.source.projectId)}.zip`;
    if (typeof zip !== 'function') return { entries, name, bytes: null };
    return { entries, name, bytes: zip(entries, { check: n => { if (!FILES.includes(n)) throw Error('Unexpected file in scene package: ' + n); return n; } }) };
  }

  return Object.freeze({ FORMAT, VERSION, FILES, SCRIPT, KIT, KIT_SOURCES, ROOMS, REFERENCE, MATERIALS, TEXT, canonical, safeName, roomsDoc, manifest, record, readme, packageFiles });
});
