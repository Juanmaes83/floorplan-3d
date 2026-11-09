/* HOM-01 · GOV-03 (minimum): the single, verifiable registry of what Rubik can do today, used by the Home to describe
   capabilities per profession. Every entry names the module(s) that implement it and the test(s) that prove it, at the
   SHA where it was verified; tests/capability-registry.test.cjs checks that those files exist, so the Home can never
   advertise a module that is not in the code. Pure data and lookups: no DOM, storage, network or project access.
   States: 'available' (in master and in Production, covered by tests), 'validation' (in master, pending a review),
   'preparation' (planned, not usable). Only 'available' entries get an access button in the Home.
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
 return {VERIFIED_AT,STATES,CAPABILITIES,ORDER,byId,forAudience};
});
