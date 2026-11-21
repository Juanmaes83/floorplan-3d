/* RUBIK SOTA · M03 · Revisión y entrega de un render de Blender (núcleo puro, sin DOM ni red).
 * La persona trae a RUBIK la carpeta resultados/<perfil> que produjo el kit del ZIP «Escena para Blender». Aquí se
 * comprueba que es un render COMPLETO de ESTE proyecto y de ESTA escena (huellas), que ninguna imagen se ha alterado y
 * que la escena guardada se reabrió igual; se explican las diferencias declaradas (qué añadió el render y qué no viaja
 * desde RUBIK) y se arma el paquete de entrega: originales LIMPIOS byte a byte, copias de presentación compuestas con
 * el contrato existente (FloorPlanDeliveryImage + marca de FloorPlanBrand, sin datos de contacto), comparación con la
 * vista de RUBIK, informes y un manifiesto con la huella de cada archivo. Nada se envía ni se guarda en el proyecto.
 * `digest(bytes) → Promise<hex>` (crypto.subtle en navegador, node:crypto en pruebas).
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.RubikBlenderReviewCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const FORMAT = 'rubik-sota.blender-delivery', VERSION = '1.0.0';
  const REPORT = 'render-report.json', MANIFEST = 'manifest.json', REFERENCE = 'referencia-rubik.png', REOPEN = 'verificacion-reapertura.json', ROOMS = 'rubik-estancias.json';
  const enc = new TextEncoder(), dec = new TextDecoder();
  const L = (lang, es, en, zh) => ({ es, en, zh })[lang] || es;

  /** Cabecera PNG: firma y IHDR (ancho, alto). null si no es un PNG. */
  function pngInfo(b) {
    if (!b || b.length < 24) return null;
    const sig = [137, 80, 78, 71, 13, 10, 26, 10];
    for (let i = 0; i < 8; i++) if (b[i] !== sig[i]) return null;
    if (dec.decode(b.subarray(12, 16)) !== 'IHDR') return null;
    const v = new DataView(b.buffer, b.byteOffset, b.byteLength);
    const width = v.getUint32(16), height = v.getUint32(20);
    return width && height && width <= 8192 && height <= 8192 && width * height <= 32_000_000 ? { width, height } : null;
  }
  const json = (files, name) => { const b = files.get(name); if (!b) return null; try { return JSON.parse(dec.decode(b)); } catch { return undefined; } };

  /** Verificación. files: Map nombre → Uint8Array (sólo los que hacen falta: informes y PNG; nunca el .blend).
   *  project: proyecto abierto; projectSha: su huella canónica (la misma que usa el manifiesto de la escena).
   *  Devuelve {canDeliver, issues[{code, severity: error|warning, …}], views[], report, manifest}. */
  async function verify({ files, digest, project, projectSha, labels = {}, originalManifestSha, levelId = null }) {
    const issues = [], add = (code, severity, detail = {}) => issues.push({ code, severity, ...detail });
    const report = json(files, REPORT), manifest = json(files, MANIFEST);
    if (report === null) { add('NO_REPORT', 'error'); return { canDeliver: false, issues, views: [], report: null, manifest: manifest || null }; }
    if (!report || report.format !== 'rubik-sota.blender-render' || (report.derived != null && !Array.isArray(report.derived))) { add('BAD_REPORT', 'error'); return { canDeliver: false, issues, views: [], report: null, manifest: manifest || null }; }
    if (!manifest || manifest.format !== 'rubik-sota.scene-delivery') add('NO_MANIFEST', 'error');
    else if (report.input?.glbSha256 !== manifest.files?.['scene.glb']?.sha256) add('OTHER_SCENE', 'error');
    const rows = Array.isArray(report.views) ? report.views : [];
    const requested = Array.isArray(report.requestedViews) ? report.requestedViews : [];
    const validView = v => typeof v === 'string' && /^[A-Za-z0-9_-]{1,64}$/.test(v);
    if (report.status !== 'complete' || !requested.length || requested.length > 32 ||
        requested.some(v => !validView(v)) || new Set(requested).size !== requested.length ||
        rows.length !== requested.length || rows.some((row, i) => row?.view !== requested[i])) add('INCOMPLETE', 'error');
    if (project && report.input?.projectId !== project.id) add('OTHER_PROJECT', 'error');
    else if (projectSha && report.input?.observedProjectSha256 !== projectSha) add('PROJECT_CHANGED', 'error');
    if (!originalManifestSha || !manifest || !files.get(MANIFEST) ||
        await digest(files.get(MANIFEST)) !== originalManifestSha || report.input?.manifestSha256 !== originalManifestSha) add('OTHER_CAPTURE', 'error');
    if (manifest && (manifest.source?.projectId !== report.input?.projectId ||
        manifest.source?.observedProjectSha256 !== report.input?.observedProjectSha256 ||
        (manifest.scene?.frame?.activeLevelId ?? null) !== levelId)) add('OTHER_SCENE', 'error');
    const views = [];
    for (const row of rows.slice(0, 32)) {
      if (!validView(row?.view)) continue;
      const name = `${row.view}.png`, b = files.get(name);
      if (!b) { add('MISSING_IMAGE', 'error', { view: row.view }); continue; }
      const sha = await digest(b), info = pngInfo(b);
      if (sha !== row.png?.sha256 || b.length !== row.png?.bytes || !info) { add('ALTERED_IMAGE', 'error', { view: row.view }); continue; }
      views.push({ view: row.view, label: labelOf(row, labels), file: name, bytes: b.length, sha256: sha, width: info.width, height: info.height, seconds: row.seconds, camera: row.camera || null,
        heroInFrame: row.heroInFrame ?? null, targetRoomPresence: row.targetRoomPresence ?? null });
    }
    if (!views.some(v => v.view === 'viewer')) add('NO_VIEWER_VIEW', 'warning');
    const ref = files.get(REFERENCE);
    if (!ref) add('NO_REFERENCE', 'warning');
    else if (!manifest?.files?.[REFERENCE] || !pngInfo(ref) ||
             (manifest?.files?.[REFERENCE] && (await digest(ref)) !== manifest.files[REFERENCE].sha256)) add('ALTERED_REFERENCE', 'error');
    const reopen = json(files, REOPEN);
    if (reopen == null) add('REOPEN_NOT_VERIFIED', 'error');
    else if (reopen.status !== 'PASS' || (
        !/^[a-f0-9]{64}$/.test(report.input?.preparedBlendSha256 ?? '') ||
        ['preparedBlendSha256', 'glbSha256', 'projectId', 'observedProjectSha256'].some(k => reopen.input?.[k] !== report.input?.[k]))) add('REOPEN_FAILED', 'error');
    if (manifest?.files?.[ROOMS]) {
      const roomBytes = files.get(ROOMS);
      if (!roomBytes || await digest(roomBytes) !== manifest.files[ROOMS].sha256) add('OTHER_SCENE', 'error');
    }
    return { canDeliver: !issues.some(i => i.severity === 'error') && views.length > 0, issues, views, report, manifest: manifest || null, reopen: reopen || null, hasReference: !!ref };
  }
  function labelOf(row, labels) { return labels[row.view] || row.label || row.view; }

  /** Nombre visible de una vista: la del visor y la axonometría por su función; las estancias, por su nombre visible. */
  function viewTitle(v, lang) {
    if (v.view === 'viewer') return L(lang, 'Vista de RUBIK (misma cámara)', 'RUBIK view (same camera)', 'RUBIK 视图（相同相机）');
    if (v.view === 'axon') return L(lang, 'Axonometría', 'Axonometry', '轴测图');
    return v.label || v.view;
  }

  /** Mensaje para cada aviso o error, con lo que la persona puede hacer. */
  function explain(issue, lang) {
    const t = {
      NO_REPORT: ['Falta render-report.json: elige la carpeta resultados/<perfil> que creó el kit.', 'render-report.json is missing: choose the resultados/<profile> folder the kit created.', '缺少 render-report.json：请选择工具生成的 resultados/<配置> 文件夹。'],
      BAD_REPORT: ['El informe no es un render de RUBIK.', 'The report is not a RUBIK render.', '该报告不是 RUBIK 渲染。'],
      NO_MANIFEST: ['Falta manifest.json en la carpeta: vuelve a lanzar el kit (lo copia al terminar).', 'manifest.json is missing in the folder: run the kit again (it copies it when finishing).', '文件夹中缺少 manifest.json：请重新运行工具（完成时会复制）。'],
      FILE_LIMIT: ['La carpeta supera el límite de lectura. Elige únicamente los informes y PNG de un perfil.', 'The folder exceeds the reading limit. Choose the reports and PNGs from one profile only.', '文件夹超过读取限制。请仅选择一个配置的报告和 PNG。'],
      DUPLICATE_FILES: ['Hay archivos con el mismo nombre. Elige los resultados de una sola carpeta.', 'Some files have the same name. Choose results from a single folder.', '存在同名文件。请仅选择一个文件夹的结果。'],
      OTHER_CAPTURE: ['Los resultados no corresponden al manifiesto original elegido. Selecciona el manifest.json del ZIP que usaste para renderizar.', 'The results do not match the original manifest. Choose manifest.json from the ZIP you used to render.', '结果与所选原始清单不符。请选择用于渲染的 ZIP 中的 manifest.json。'],
      OTHER_SCENE: ['Estas imágenes son de otra escena: no coinciden con el paquete que las acompaña.', 'These images belong to another scene: they do not match their package.', '这些图像属于另一个场景，与其包不匹配。'],
      INCOMPLETE: ['El render no terminó. Vuelve a lanzar el kit: continuará por la vista que falta.', 'The render did not finish. Run the kit again: it resumes at the missing view.', '渲染未完成。请重新运行工具，将从缺少的视图继续。'],
      OTHER_PROJECT: ['Este render es de otro proyecto: abre el proyecto correcto en RUBIK.', 'This render belongs to another project: open the right project in RUBIK.', '此渲染属于另一个项目：请在 RUBIK 中打开正确的项目。'],
      PROJECT_CHANGED: ['El proyecto ha cambiado desde que preparaste la escena: el render muestra la versión anterior. Prepara y renderiza una nueva escena para poder entregar. Tu proyecto sigue intacto.', 'The project changed after you prepared the scene: the render shows the earlier version. Prepare and render a new scene to deliver it. Your project is unchanged.', '准备场景后项目已更改：渲染显示的是之前的版本。请重新准备并渲染场景后交付。项目没有更改。'],
      MISSING_IMAGE: ['Falta una imagen del informe: vuelve a lanzar el kit.', 'An image listed in the report is missing: run the kit again.', '报告中的一张图像缺失：请重新运行工具。'],
      ALTERED_IMAGE: ['Una imagen no coincide con su huella (modificada o dañada): no se entrega. Vuelve a renderizar esa vista.', 'An image does not match its fingerprint (modified or damaged): it is not delivered. Render that view again.', '一张图像与其指纹不符（已修改或损坏），不会交付。请重新渲染该视图。'],
      NO_VIEWER_VIEW: ['No hay vista con la cámara de RUBIK: la comparación directa no es posible.', 'There is no view with the RUBIK camera: a direct comparison is not possible.', '没有使用 RUBIK 相机的视图，无法直接对比。'],
      NO_REFERENCE: ['Falta la imagen de referencia de RUBIK: la comparación no se incluirá.', 'The RUBIK reference image is missing: the comparison will not be included.', '缺少 RUBIK 参考图像，将不包含对比。'],
      ALTERED_REFERENCE: ['La imagen de referencia no coincide con la escena.', 'The reference image does not match the scene.', '参考图像与场景不匹配。'],
      REOPEN_NOT_VERIFIED: ['La reapertura de la escena no se ha verificado en esta carpeta.', 'Reopening the scene has not been verified in this folder.', '此文件夹中未验证场景的重新打开。'],
      REOPEN_FAILED: ['La escena guardada no se reabre igual: prepárala de nuevo.', 'The saved scene does not reopen identically: prepare it again.', '保存的场景无法以相同方式重新打开：请重新准备。'],
    }[issue.code] || [issue.code, issue.code, issue.code];
    return L(lang, ...t);
  }

  /** Diferencias declaradas entre RUBIK y el render: lo AÑADIDO por el render y lo que NO viaja desde RUBIK. */
  function differences({ report, manifest }, lang) {
    const out = [];
    for (const d of (report && report.derived) || []) {
      if (/^sun and sky: captured/.test(d)) out.push({ kind: 'kept', text: L(lang, 'Sol y cielo: los de la vista 3D, con una conversión de intensidades declarada.', 'Sun and sky: those of the 3D view, with a declared intensity conversion.', '太阳和天空：来自 3D 视图，强度换算已声明。') });
      else if (/^no captured light/.test(d)) out.push({ kind: 'added', text: L(lang, 'Luz exterior neutra añadida (la escena no traía luz del visor).', 'Neutral exterior light added (the scene had no viewer light).', '添加了中性外部光（场景未带查看器光照）。') });
      else if (/^room fill/.test(d)) out.push({ kind: 'added', text: L(lang, 'Luz de relleno: un panel por estancia en el techo, sólo para el render (no es una luminaria del proyecto).', 'Fill light: one ceiling panel per room, for the render only (not a project fixture).', '补光：每个房间天花板一块面光，仅用于渲染（不是项目灯具）。') });
      else if (/^exposure/.test(d)) out.push({ kind: 'added', text: L(lang, 'Exposición −0,4 EV y tono AgX del render.', 'Render exposure −0.4 EV and AgX tone mapping.', '渲染曝光 −0.4 EV 和 AgX 色调。') });
      else if (/^textured floors/.test(d)) out.push({ kind: 'missing', text: L(lang, 'Suelos con textura: se pintan con el color de su material; las texturas e imágenes no viajan.', 'Textured floors: painted with their material colour; textures and images do not travel.', '带纹理的地面：使用其材质颜色；纹理和图像不会传输。') });
    }
    out.push({ kind: 'missing', text: L(lang, 'Fondo: el cielo de Blender con el color de la luz del visor; el fondo de estudio de la vista 3D no viaja.', 'Background: the Blender sky with the viewer light colour; the 3D view studio background does not travel.', '背景：使用查看器光照颜色的 Blender 天空；3D 视图的工作室背景不会传输。') });
    out.push({ kind: 'added', text: L(lang, 'Cámaras interiores y axonometría: calculadas para el render (la vista de RUBIK usa su cámara exacta).', 'Interior cameras and axonometry: computed for the render (the RUBIK view uses its exact camera).', '室内相机和轴测图：为渲染计算（RUBIK 视图使用其精确相机）。') });
    const fb = (manifest && manifest.fallbacks) || {};
    if (fb.proceduralObjects) out.push({ kind: 'missing', text: L(lang, `${fb.proceduralObjects} muebles son la representación del visor, no la geometría del fabricante.`, `${fb.proceduralObjects} furniture items are the viewer representation, not manufacturer geometry.`, `${fb.proceduralObjects} 件家具为查看器表示，并非制造商几何体。`) });
    if (fb.texturesNotCopied) out.push({ kind: 'missing', text: L(lang, `${fb.texturesNotCopied} superficies con textura llegan con su color plano.`, `${fb.texturesNotCopied} textured surfaces arrive as their flat colour.`, `${fb.texturesNotCopied} 个带纹理表面以纯色呈现。`) });
    if ((fb.assetErrors || []).length) out.push({ kind: 'missing', text: L(lang, `${fb.assetErrors.length} modelos no cargaron y van con su forma genérica.`, `${fb.assetErrors.length} models did not load and use their generic shape.`, `${fb.assetErrors.length} 个模型未加载，使用通用形状。`) });
    out.push({ kind: 'missing', text: L(lang, 'Es una observación visual de la vista 3D, no un levantamiento medido.', 'It is a visual observation of the 3D view, not a measured survey.', '这是 3D 视图的视觉观察，并非实测。') });
    return out;
  }

  const safe = s => String(s || 'vista').normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '').toLowerCase().slice(0, 40) || 'vista';
  /** Ruta de cada archivo en el paquete. Orden estable: el número de la vista en el informe. */
  function paths(views, lang) {
    return views.map((v, i) => { const n = String(i + 1).padStart(2, '0'), base = `${n}-${safe(v.view === 'viewer' || v.view === 'axon' ? viewTitle(v, 'es') : v.label)}`;
      return { ...v, title: viewTitle(v, lang), original: `originales/${base}.png`, presentation: `presentacion/${base}.png` }; });
  }
  const NAME_RE = /^(LEEME-ENTREGA\.txt|entrega\.json|originales\/[0-9]{2}-[a-z0-9_-]{1,40}\.png|presentacion\/[0-9]{2}-[a-z0-9_-]{1,40}\.png|comparacion\/rubik-vs-cycles\.png|informes\/(render-report|manifest|verificacion-reapertura|rubik-estancias)\.json)$/;
  const checkName = n => { if (!NAME_RE.test(n)) throw Error('Unexpected file in Blender delivery: ' + n); return n; };

  /** Manifiesto de la entrega: procedencia, versión, huellas de TODOS los archivos y límites. */
  async function deliveryManifest({ verified, entries, digest, project, brand = null, projectChanged = false, createdAt = null, lang = 'es' }) {
    const r = verified.report, m = verified.manifest || {}, files = {};
    for (const [name, bytes] of entries) if (name !== 'entrega.json') files[name] = { bytes: bytes.length, sha256: await digest(bytes) };
    return {
      format: FORMAT, version: VERSION, createdAt,
      project: { id: project?.id || r.input?.projectId || null, observedProjectSha256: r.input?.observedProjectSha256 || null, changedSinceScene: !!projectChanged },
      scene: { manifestSha256: r.input?.manifestSha256 || null, preparedBlendSha256: r.input?.preparedBlendSha256 || null, runIdentity: r.runIdentity || null, glbSha256: r.input?.glbSha256 || null, capture: m.scene ? { scope: m.scene.scope, stats: m.scene.stats } : null },
      blender: { version: r.blender, renderer: r.renderer, profile: r.profile, resolution: r.resolution, samples: r.samples, cpuCount: r.cpuCount, threads: r.threads,
        rendererScriptSha256: r.rendererScriptSha256, totalSeconds: (r.views || []).reduce((n, v) => n + (v.seconds || 0), 0) },
      views: verified.views.map(v => ({ view: v.view, title: v.title, original: { path: v.original, width: v.width, height: v.height, sha256: v.sha256 }, presentation: v.presentationPath || null, camera: v.camera, seconds: v.seconds })),
      verification: { imagesMatchReport: true, sceneMatchesPackage: true, reopen: verified.reopen ? verified.reopen.status : 'not verified' },
      brand: brand ? { used: true, name: brand.name, contact: 'not included' } : { used: false },
      derived: r.derived || [], limitations: (m.limitations || []).concat(['Interior cameras, fill light, exposure and axonometry background are added for the render (declared above).']),
      originals: 'originales/ holds the Cycles PNGs byte for byte as rendered (not modified); presentacion/ holds copies composed by RUBIK for the client.',
      files,
    };
  }

  function readme({ verified, brand, projectChanged, lang }) {
    const v = verified.views, r = verified.report;
    const lines = {
      es: ['RUBIK SOTA · Entrega de render (Blender Cycles)', '',
        'originales/      Imágenes PNG tal como las produjo Blender Cycles, sin ninguna modificación (huellas en entrega.json).',
        'presentacion/    Copias para el cliente con el título y la vista' + (brand ? ` y la identidad «${brand.name}» (sin datos de contacto).` : ' (sin marca: no había ninguna elegida).'),
        ...(verified.hasReference ? ['comparacion/     La vista 3D de RUBIK junto al render con la misma cámara.'] : []),
        'informes/        Informe del render, manifiesto de la escena, estancias y verificación de reapertura.',
        'entrega.json     Procedencia, versión de Blender, perfil, tiempos y la huella SHA-256 de cada archivo.', '',
        `Render: Blender ${r.blender} · ${r.renderer} · perfil ${r.profile} · ${v.length} vistas.`,
        'Añadido sólo para el render: cámaras interiores y axonometría, luz de relleno por estancia, exposición y fondo de la axonometría.',
        'No viaja desde RUBIK: texturas e imágenes (las superficies van con su color). Es una observación visual, no un levantamiento medido.',
        ...(projectChanged ? ['Aviso: el proyecto cambió después de preparar la escena; estas imágenes muestran la versión anterior.'] : [])],
      en: ['RUBIK SOTA · Render delivery (Blender Cycles)', '',
        'originales/      PNG images exactly as Blender Cycles produced them, unmodified (fingerprints in entrega.json).',
        'presentacion/    Client copies with the title and view' + (brand ? ` and the “${brand.name}” identity (no contact details).` : ' (no brand: none was selected).'),
        ...(verified.hasReference ? ['comparacion/     The RUBIK 3D view next to the render with the same camera.'] : []),
        'informes/        Render report, scene manifest, rooms and reopen verification.',
        'entrega.json     Provenance, Blender version, profile, timings and the SHA-256 of every file.', '',
        `Render: Blender ${r.blender} · ${r.renderer} · profile ${r.profile} · ${v.length} views.`,
        'Added for the render only: interior cameras and axonometry, per-room fill light, exposure and axonometry background.',
        'Not carried from RUBIK: textures and images (surfaces use their colour). A visual observation, not a measured survey.',
        ...(projectChanged ? ['Note: the project changed after the scene was prepared; these images show the earlier version.'] : [])],
      zh: ['RUBIK SOTA · 渲染交付（Blender Cycles）', '',
        'originales/      Blender Cycles 输出的原始 PNG，未做任何修改（指纹见 entrega.json）。',
        'presentacion/    带标题和视图的客户版本' + (brand ? `，含“${brand.name}”标识（不含联系方式）。` : '（无品牌：未选择）。'),
        ...(verified.hasReference ? ['comparacion/     RUBIK 3D 视图与相同相机渲染的对比。'] : []),
        'informes/        渲染报告、场景清单、房间和重新打开验证。',
        'entrega.json     来源、Blender 版本、配置、耗时及每个文件的 SHA-256。', '',
        `渲染：Blender ${r.blender} · ${r.renderer} · 配置 ${r.profile} · ${v.length} 个视图。`,
        '仅为渲染添加：室内相机和轴测图、各房间补光、曝光及轴测背景。',
        '未从 RUBIK 传输：纹理和图像（表面使用其颜色）。这是视觉观察，并非实测。',
        ...(projectChanged ? ['注意：准备场景后项目已更改；这些图像显示的是之前的版本。'] : [])],
    };
    return (lines[lang] || lines.es).join('\n') + '\n';
  }

  return Object.freeze({ FORMAT, VERSION, REPORT, MANIFEST, REFERENCE, REOPEN, ROOMS, pngInfo, verify, viewTitle, explain, differences, paths, checkName, deliveryManifest, readme });
});
