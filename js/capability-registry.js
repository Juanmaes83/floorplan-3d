/* HOM-01 · GOV-03 (minimum): the single, verifiable registry of what Rubik can do today, used by the Home to describe
   capabilities per profession. Every entry names the module(s) that implement it and the test(s) that prove it, at the
   SHA where it was verified; tests/capability-registry.test.cjs checks that those files exist, so the Home can never
   advertise a module that is not in the code. Pure data and lookups: no DOM, storage, network or project access.
   States: 'available' (in master and in Production, covered by tests), 'validation' (in master, pending a review),
   'preparation' (planned, not usable). Only 'available' entries get an access button in the Home.
   HOM-03: AI_SERVICES («Nuevos servicios IA») use four states — available (accredited in Production), pilot,
   simulation, preparation — and aiServices() never returns work behind a `gate` (CAT-04, not approved).
   UMD: window.FloorPlanCapabilities / module.exports. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.FloorPlanCapabilities=api;})(typeof self!=='undefined'?self:this,function(){
 'use strict';
 const VERIFIED_AT='5fb7a5c1387c85614666367238510934167d4809';
 const STATES=Object.freeze(['available','validation','preparation']);
 // access: how the Home opens it, always through an existing entry point.
 //   upload → the «Subir un plano» entry · walk → the existing 3D walk of the example · area:<key> → a professional
 //   work area (FloorPlanProfessionalUI.open), never a new screen.
 const C=(id,name,benefit,state,access,modules,tests,professions,limits=null)=>Object.freeze({id,name,benefit,state,access,modules,tests,professions,limits,verifiedAt:VERIFIED_AT});
 const CAPABILITIES=Object.freeze([
  C('import',['Subir y calibrar tu plano','Upload and calibrate your plan','上传并校准平面图'],
   ['PDF, imagen, DXF o IFC convertidos en un plano editable; compruebas la escala con una medida conocida.','PDF, image, DXF or IFC turned into an editable plan; you check the scale with a known length.','将 PDF、图片、DXF 或 IFC 转为可编辑平面图，并用已知尺寸核对比例。'],
   'available','upload',['js/plan-intake.js','js/plan-intake-ui.js','js/tracing-ui.js'],['tests/plan-intake.test.cjs','tests/upload.browser.test.cjs','tests/multiformat-guide.browser.test.cjs'],
   ['architecture','renovation','general'],['Las medidas son orientativas: no sustituyen una medición profesional.','Measurements are indicative, not a professional survey.','尺寸仅供参考，不能替代专业测量。']),
  C('walk3d',['Recorrido 3D por dentro','3D walk-through inside','室内 3D 漫游'],
   ['La misma distribución se recorre estancia a estancia, en ordenador o móvil.','The same layout is walked room by room, on a computer or a phone.','同一布局可在电脑或手机上逐个房间漫游。'],
   'available','walk',['index.html'],['tests/walk.browser.test.cjs','tests/walk-controls.browser.test.cjs'],
   ['real-estate','interior','general']),
  C('presentation',['Presentación 3D guiada','Guided 3D presentation','引导式 3D 展示'],
   ['Recorrido narrado por estancias, plantillas profesionales, sección y vista axonométrica.','Narrated tour by room, professional templates, section and axonometric view.','按房间讲解的漫游、专业模板、剖面和轴测视图。'],
   'available','area:deliver',['js/presentation-ui.js','js/presentation-story-core.js','js/presentation-templates-core.js'],['tests/presentation-story.browser.test.cjs','tests/presentation-templates.browser.test.cjs'],
   ['real-estate','developer','interior']),
  C('render-ai',['Render IA fotorrealista','Photorealistic AI render','照片级 AI 渲染'],
   ['Una imagen fotorrealista a partir de una vista real del proyecto, con estilos y acabados alternativos.','A photorealistic image from a real view of the project, with alternative styles and finishes.','基于项目真实视图生成照片级图片，可选风格和饰面。'],
   'available','area:deliver',['js/ai-render-ui.js','api/render.js','js/delivery-image.js'],['tests/ai-render-api.test.cjs','tests/ai-render.browser.test.cjs','tests/delivery-image-detail.browser.test.cjs'],
   ['interior','renovation','real-estate','developer','general'],
   ['Imagen orientativa: no sustituye la geometría del proyecto. Requiere el código de acceso de tu estudio y cada imagen consume créditos de IA.','Indicative image: it does not replace the project geometry. It needs your studio access code and each image uses AI credits.','参考图片：不能替代项目几何。需要工作室访问码，每张图片消耗 AI 额度。']),
  C('sheet',['Lámina a escala con tu marca','Scaled sheet with your brand','带品牌的比例图纸'],
   ['La distribución en una lámina lista para enviar, con tu logo y tus datos.','The layout on a sheet ready to send, with your logo and details.','带有你标志和信息、可直接发送的布局图纸。'],
   'available','area:deliver',['js/sheet-ui.js','js/brand-ui.js'],['tests/sheet.browser.test.cjs','tests/sheet-scale.browser.test.cjs'],
   ['architecture']),
  C('analyze',['Orientación, sol y emplazamiento','Orientation, sun and site','朝向、日照与场地'],
   ['Orientación del proyecto, soleamiento y su relación con la parcela.','Project orientation, sunlight and its relation to the plot.','项目朝向、日照及与地块的关系。'],
   'available','area:analyze',['js/solar-ui.js','js/territory-ui.js','js/parcel-site-adapter.js'],['tests/site-analyze.browser.test.cjs'],
   ['architecture'],['Datos orientativos; no es un estudio solar ni topográfico certificado.','Indicative data; not a certified solar or survey study.','数据仅供参考，不是认证的日照或测绘研究。']),
  C('budget',['Mediciones y presupuesto','Quantities and budget','工程量与预算'],
   ['Cantidades del proyecto, precios propios o de referencia, revisión e IVA; exportación BC3.','Project quantities, your own or reference prices, review and VAT; BC3 export.','项目工程量、自有或参考价格、审核及增值税；BC3 导出。'],
   'available','area:budget',['js/budget-ui.js','js/quantity-schedule-ui.js','js/bc3-budget-core.js'],['tests/budget-ui.browser.test.cjs','tests/quantity-schedule.browser.test.cjs'],
   ['architecture','renovation','construction','general'],['Un presupuesto con partidas sin precio se muestra como parcial.','A budget with unpriced items is shown as partial.','含未定价项目的预算显示为部分预算。']),
  C('variants',['Comparar propuestas','Compare proposals','比较方案'],
   ['Varias versiones del mismo proyecto lado a lado: superficie, estancias y holguras.','Several versions of the same project side by side: area, rooms and clearances.','同一项目的多个版本并排比较：面积、房间和间距。'],
   'available','area:design',['js/project-variants.js'],['tests/variants.test.cjs','tests/variants.browser.test.cjs'],
   ['renovation']),
  C('building',['Viviendas de dos plantas','Two-storey homes','两层住宅'],
   ['Cada tipología con sus plantas y escaleras, en 2D y 3D.','Each unit type with its levels and stairs, in 2D and 3D.','每种户型含楼层和楼梯，支持 2D 和 3D。'],
   'available','area:design',['js/building-ui.js','js/building-core.js'],['tests/building.browser.test.cjs','tests/building-presentation.browser.test.cjs'],
   ['developer','construction']),
  C('brand',['Tu marca en cada entrega','Your brand on every delivery','每次交付都带你的品牌'],
   ['Logo y datos profesionales en láminas, imágenes y presentaciones.','Logo and professional details on sheets, images and presentations.','标志和专业信息出现在图纸、图片和展示中。'],
   'available','area:studio',['js/brand-ui.js','js/brand-core.js'],['tests/brand.browser.test.cjs','tests/brand-core.test.cjs'],
   ['developer']),
  C('client-file',['Entrega al cliente','Client delivery','客户交付'],
   ['Archivo de cliente para abrir sin instalar nada, con vídeo del recorrido y comentarios.','A client file that opens without installing anything, with the tour video and comments.','客户无需安装即可打开的文件，附漫游视频和评论。'],
   'available','area:deliver',['js/client-share-ui.js','js/tour-video-ui.js'],['tests/client-share.browser.test.cjs','tests/tour-video.browser.test.cjs'],
   ['real-estate'],['El enlace público en línea está en revisión de seguridad; el archivo local no depende de él.','The online public link is under security review; the local file does not depend on it.','在线公开链接正在进行安全审查；本地文件不依赖它。']),
  // HOM-02 · Constructora / jefe de obra: FT3D-8 capabilities in master. The 4D evolution is derived from the plan and
  // the budget: it never states real progress on site.
  C('construction-plan',['Plan de obra y Gantt','Works plan and Gantt','施工计划与甘特图'],
   ['Tareas, fechas, dependencias e hitos ligados a los elementos del proyecto y a sus partidas.','Tasks, dates, dependencies and milestones linked to the project elements and budget items.','任务、日期、依赖关系和里程碑，关联项目构件和预算条目。'],
   'available','area:budget',['js/construction-plan-ui.js','js/construction-schedule-core.js','js/construction-record-core.js'],['tests/m2-s4.browser.test.cjs','tests/construction-schedule-core.test.cjs'],
   ['construction'],['Es la obra planificada: no registra el avance real ni datos de obra.','It is the planned works: it does not record real progress or site data.','这是计划中的施工：不记录真实进度或现场数据。']),
  C('evolution-4d',['Evolución de obra en 3D (4D)','Works evolution in 3D (4D)','3D 施工进展（4D）'],
   ['La obra prevista día a día en 3D, con vídeo y presentación para el cliente, desde el plan y el presupuesto.','The planned works day by day in 3D, with a video and presentation for the client, from the plan and the budget.','基于计划和预算，逐日展示计划施工的 3D 进展，并生成给客户的视频和展示。'],
   'available','area:deliver',['evolucion/fidelity-app.js','js/construction-context.js','js/construction-delivery-core.js'],['tests/ft3d-8-ux4d.browser.test.cjs','tests/construction-delivery-core.test.cjs'],
   ['construction'],['Derivada del plan y de los datos disponibles: no es el estado real de ejecución.','Derived from the plan and the available data: it is not the real state of execution.','源自计划和现有数据：不是真实的施工执行状态。']),
  C('furnish',['Amueblar y elegir acabados','Furnish and choose finishes','布置家具与选择饰面'],
   ['Muebles del catálogo y superficies reales por estancia, con material board.','Catalogue furniture and real surfaces by room, with a material board.','按房间布置目录家具和真实饰面，并生成材料板。'],
   'available','area:design',['js/furniture-search.js','js/surface-ui.js','js/moodboard-ui.js'],['tests/surfaces.browser.test.cjs','tests/furniture-search.test.cjs','tests/moodboard.browser.test.cjs'],
   ['interior'])
 ]);
 // HOM-03 · «Nuevos servicios IA». Each service carries the state it REALLY has, verified on code, contract, tests and
 // the effective Production configuration (docs/product/hom-03/matriz-hom-03-auditoria-2026-11-15.md):
 //   available  → active and accredited in Production (needs `production` evidence: deployment, SHA and check);
 //   pilot      → usable in this browser, without multi-user infrastructure or commercial guarantees;
 //   simulation → demonstration only: no provider is called and no real result is produced;
 //   preparation→ incomplete or blocked: shown without any access.
 // `gate` keeps texts prepared for work that is not approved yet: gated entries are NEVER returned by
 // aiServices(), so the Home cannot show them until the gate is removed together with a verified state.
 // `access` is the existing place that opens the service; the Home only offers it if that module is on the page.
 const AI_GROUPS=Object.freeze(['available','pilot','simulation','preparation']);
 const AI_VERIFIED_AT='8e6a5a842b37fcbc78a58160859304da9b3efa1a';
 const S=(id,state,name,what,isNot,limits,access,modules,tests,professions,extra={})=>Object.freeze({id,state,name,what,isNot,limits,access,modules,tests,professions,production:extra.production||null,gate:extra.gate||null,verifiedAt:AI_VERIFIED_AT});
 const ALL=['architecture','real-estate','developer','renovation','interior','construction','general'];
 const AI_SERVICES=Object.freeze([
  S('render-ai','available',['Render IA fotorrealista','Photorealistic AI render','照片级 AI 渲染'],
   ['Genera una imagen fotorrealista con un proveedor de IA a partir de una vista 3D real de tu proyecto.','Generates a photorealistic image with an AI provider from a real 3D view of your project.','由 AI 服务商根据项目的真实 3D 视图生成照片级图片。'],
   ['Es una imagen orientativa: no cambia ni sustituye la geometría del proyecto.','It is an indicative image: it does not change or replace the project geometry.','这是参考图片：不会改变或替代项目几何。'],
   ['Necesita el código de acceso de tu estudio y cada imagen consume créditos de IA.','It needs your studio access code and each image uses AI credits.','需要工作室访问码，每张图片消耗 AI 额度。'],
   'render-band',['js/ai-render-ui.js','api/render.js'],['tests/ai-render-api.test.cjs','tests/ai-render.browser.test.cjs'],
   ['interior','renovation','real-estate','developer','general'],
   {production:Object.freeze({deployment:'dpl_5abs4NFfcFdGeMapKgzzwKqxPxcV',sha:'8df49ed7110215eb3723788aee6da42d5eb095cb',checkedAt:'2026-11-09',check:'POST /api/render sin código → 401 token (proveedor no llamado); RUBIK_RENDER_ENABLED=1 en Production (metadatos, 2026-11-15)'})}),
  S('assistant','pilot',['Asistente RUBIK · consulta guiada','RUBIK Assistant · guided query','RUBIK 助手 · 引导式查询'],
   ['Responde sobre el proyecto abierto (superficies, presupuesto, materiales, muebles) con los motores de RUBIK y la fuente de cada cifra; propone cambios que revisas, aplicas y deshaces.','Answers about the open project (areas, budget, materials, furniture) with RUBIK engines and the source of every figure; it proposes changes you review, apply and undo.','使用 RUBIK 引擎回答当前项目的问题（面积、预算、材料、家具）并注明每个数字的来源；提出可审核、应用和撤销的修改。'],
   ['No es un chat con IA generativa: no hay ningún modelo de lenguaje conectado y entiende un conjunto cerrado de preguntas.','It is not a generative AI chat: no language model is connected and it understands a closed set of questions.','这不是生成式 AI 聊天：未连接任何语言模型，只能理解固定范围的问题。'],
   ['Funciona en este navegador y no envía nada; la conversación se guarda solo aquí.','It works in this browser and sends nothing; the conversation is stored only here.','在此浏览器中运行，不发送任何内容；对话仅保存在此处。'],
   'assistant',['js/assistant-ui.js','js/assistant-intents-core.js','js/assistant-proposals-core.js','api/assistant.js'],['tests/assistant-ai-v2.test.cjs','tests/assistant-ai-v2.browser.test.cjs'],
   ['architecture','renovation','construction','interior','general']),
  S('catalogs','pilot',['Mis catálogos','My catalogues','我的目录'],
   ['Fichas de producto con SKU, medidas y precio con fuente y fecha (o «desconocido»); las colocas en el plano desde Amueblar con sus medidas verificadas.','Product sheets with SKU, dimensions and a sourced, dated price (or «unknown»); you place them on the plan from Furnish with their verified dimensions.','含 SKU、尺寸及带来源和日期价格（或“未知”）的产品资料；可在“布置家具”中按核实尺寸放入平面图。'],
   ['No es un catálogo de fabricantes ni un servicio en la nube: son tus fichas en este navegador.','It is not a manufacturers’ catalogue or a cloud service: they are your sheets in this browser.','这不是厂商目录或云服务：它们是你在此浏览器中的资料。'],
   ['Piloto local: el selector de estudio separa catálogos pero no es control de acceso entre usuarios.','Local pilot: the studio selector separates catalogues but is not access control between users.','本地试点：工作室选择器只区分目录，不是用户之间的访问控制。'],
   'catalogs',['js/catalog-ui.js','js/catalog-product-core.js','js/catalog-placement-ui.js'],['tests/catalog-ia.browser.test.cjs','tests/catalog-placement.browser.test.cjs'],
   ['interior','developer','renovation','architecture']),
  S('visual-studio','simulation',['Estudio de imágenes','Image studio','图像工作室'],
   ['Prepara una propuesta visual sobre una foto: zona a cambiar, referencias de tus catálogos e intensidad, con revisión de fidelidad.','Prepares a visual proposal on a photo: area to change, references from your catalogues and intensity, with a fidelity review.','在照片上准备视觉方案：要修改的区域、目录参考和强度，并进行保真审核。'],
   ['Simulación: no llama a ningún proveedor de IA y el resultado no se descarga ni se entrega como imagen.','Simulation: it calls no AI provider and the result is not downloaded or delivered as an image.','模拟：不调用任何 AI 服务商，结果不能下载或作为图片交付。'],
   ['La generación real está cerrada mientras no haya proveedor autorizado y tope de gasto.','Real generation is closed until there is an authorised provider and a spending cap.','在有授权服务商和费用上限之前，真实生成保持关闭。'],
   'visual-studio',['js/visual-reform-ui.js','js/visual-reform-core.js'],['tests/visual-studio.browser.test.cjs','tests/visual-reform-core.test.cjs'],
   ['interior','renovation','real-estate']),
  S('photo-reform','simulation',['Reformar desde fotografía','Renovate from a photo','从照片改造'],
   ['Recorre con una foto de la estancia todo el proceso de una reforma visual: intención, consentimiento, alternativas y comparación antes/después.','Takes a photo of the room through the whole visual renovation process: intent, consent, alternatives and before/after comparison.','用房间照片走完视觉改造的全过程：意图、同意、备选方案和前后对比。'],
   ['Simulación: las alternativas se dibujan en el navegador, llevan el rótulo «SIMULACIÓN» y no las genera una IA.','Simulation: the alternatives are drawn in the browser, carry the «SIMULATION» label and are not generated by AI.','模拟：备选方案在浏览器中绘制，带有“模拟”标记，并非 AI 生成。'],
   ['La foto no sale del navegador y no se guarda; el proyecto no cambia.','The photo does not leave the browser and is not stored; the project does not change.','照片不会离开浏览器，也不会被保存；项目不会改变。'],
   'photo-reform',['js/photo-reform-ui.js','js/photo-reform-provider.js','api/photo-reform.js'],['tests/photo-project.browser.test.cjs','tests/photo-reform-api.test.cjs'],
   ['renovation','interior','real-estate']),
  S('assistant-llm','preparation',['Asistente conversacional con IA','Conversational AI assistant','对话式 AI 助手'],
   ['Preguntas libres sobre el proyecto respondidas por un modelo de lenguaje, con las mismas fuentes y propuestas reversibles.','Free questions about the project answered by a language model, with the same sources and reversible proposals.','由语言模型回答关于项目的自由提问，保留相同的来源和可撤销的提议。'],
   ['Hoy no existe: no hay modelo de texto autorizado ni cuentas de usuario.','It does not exist today: there is no authorised text model and no user accounts.','目前不存在：没有授权的文本模型，也没有用户账户。'],
   ['Pendiente de proveedor, tope de gasto, sesiones autenticadas y privacidad.','Pending provider, spending cap, authenticated sessions and privacy.','待定：服务商、费用上限、身份验证会话和隐私。'],
   null,['api/assistant.js','js/assistant-runtime-core.js'],['tests/assistant-ai-v2.test.cjs'],ALL),
  S('photo-real','preparation',['Imágenes reales desde tu foto','Real images from your photo','基于照片的真实图像'],
   ['Generar con un proveedor de IA las alternativas que hoy solo se simulan en el Estudio de imágenes.','Generating with an AI provider the alternatives that are only simulated today in the Image studio.','用 AI 服务商生成目前仅在图像工作室中模拟的备选方案。'],
   ['Hoy no se genera ninguna imagen real desde una foto.','No real image is generated from a photo today.','目前不会根据照片生成任何真实图片。'],
   ['Pendiente de proveedor autorizado, tope de gasto y revisión de privacidad de las fotos.','Pending an authorised provider, a spending cap and a privacy review of photos.','待定：授权服务商、费用上限和照片隐私审查。'],
   null,['api/photo-reform.js','js/photo-reform-provider.js'],['tests/photo-reform-api.test.cjs','tests/photo-reform-provider.test.cjs'],['renovation','interior','real-estate']),
  // CAT-04 was merged into master by #237. These are local pilot functions, not a paid or cloud service.
  S('catalog-budget','pilot',['Tus fichas en Presupuestar','Your sheets in Budget','你的资料进入预算'],
   ['Los productos de tus catálogos colocados en el plano aportan su precio con fuente y fecha a las partidas del presupuesto.','The products from your catalogues placed on the plan bring their sourced, dated price to the budget items.','放入平面图的目录产品将其带来源和日期的价格带入预算条目。'],
   ['Un precio desconocido sigue siendo desconocido: el presupuesto se muestra como parcial.','An unknown price stays unknown: the budget is shown as partial.','未知价格仍为未知：预算显示为部分预算。'],
   ['Funciona con el proyecto y las fichas guardadas en este navegador; revisa precios y unidades antes de aplicarlos.','Uses the project and sheets saved in this browser; review prices and units before applying them.','使用保存在此浏览器中的项目和资料；应用前请核对价格和单位。'],
   'area:budget',['js/catalog-budget-core.js','js/cat04-ui.js'],['tests/cat04.browser.test.cjs'],['renovation','construction','interior','architecture']),
  S('assistant-catalogs','pilot',['El Asistente consulta tus catálogos','The Assistant looks up your catalogues','助手查询你的目录'],
   ['Preguntar al Asistente por los productos de tus fichas y su precio, con la fuente de cada dato.','Ask the Assistant about the products in your sheets and their price, with the source of every figure.','向助手询问资料中的产品及其价格，并注明每个数据的来源。'],
   ['Sigue siendo una consulta guiada sin modelo de lenguaje.','It is still a guided query without a language model.','仍然是没有语言模型的引导式查询。'],
   ['Consulta guiada local; el modo generativo requiere activación independiente y consentimiento.','Local guided query; generative mode requires separate activation and consent.','本地引导式查询；生成模式需要单独启用和同意。'],
   'assistant',['js/assistant-domain-tools-core.js','js/catalog-product-core.js'],['tests/assistant-ai-v2.test.cjs'],['interior','renovation'])
 ]);
 // The services the Home may show, grouped by state, the ones relevant to the chosen profession first in each group.
 function aiServices(audience){const rel=s=>s.professions.includes(audience||'general')?0:1;
  return AI_SERVICES.filter(s=>!s.gate).map((s,i)=>[s,i]).sort((a,b)=>AI_GROUPS.indexOf(a[0].state)-AI_GROUPS.indexOf(b[0].state)||rel(a[0])-rel(b[0])||a[1]-b[1]).map(([s])=>s);}
 // The 3–4 capabilities each profession sees first, in order. The Home never hides the others: they stay reachable.
 const ORDER=Object.freeze({
  general:['import','walk3d','render-ai','budget'],
  architecture:['import','sheet','analyze','budget'],
  'real-estate':['walk3d','presentation','render-ai','client-file'],
  developer:['building','presentation','render-ai','brand'],
  renovation:['import','variants','budget','render-ai'],
  interior:['furnish','render-ai','walk3d','presentation'],
  construction:['construction-plan','evolution-4d','budget','building']
 });
 const byId=id=>CAPABILITIES.find(c=>c.id===id)||null;
 function forAudience(audience){return (ORDER[audience]||ORDER.general).map(byId).filter(Boolean);}
 return {VERIFIED_AT,STATES,CAPABILITIES,ORDER,byId,forAudience,AI_GROUPS,AI_VERIFIED_AT,AI_SERVICES,aiServices};
});
