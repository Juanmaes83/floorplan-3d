/* Unified welcome, local action search and guidance. Metadata never enters FloorPlanProjectV1. */
(function(){
 'use strict';
 const G=FloorPlanGuide,KEY='rubik-sota-guide-v1',label=a=>G.text(a,LANG),tx=(es,en,zh)=>label([es,en,zh||es]);
 const hadLibrary=(()=>{try{return originalStorage.getItem(FloorPlanLibrary.KEY)!==null;}catch{return false;}})();
 let navigationEpoch=0,roomReturnToWelcome=false;
 let data={version:1,seen:false,entries:{}},storageError='',currentId=null,lastSnapshot='',lastResult=null,pendingEntry=null,entryOrigin=null,pendingIds=[],afterCopy=null,fullEditor=false;
 const audienceKey='rubik-professional-audience-v1';
 const audiences=[
  ['architecture',['Estudio de arquitectura','Architecture studio','建筑设计事务所']],
  ['real-estate',['Inmobiliaria','Real estate agency','房地产机构']],
  ['developer',['Promotora','Property developer','房地产开发商']],
  ['renovation',['Reformas','Renovation','装修施工']],
  ['interior',['Decoración e interiorismo','Interior design','室内设计']],
  // HOM-02: sixth field. Its tools are the FT3D-8 ones already in master (plan, Gantt, 4D evolution from the plan).
  ['construction',['Constructora / jefe de obra','Construction company / site manager','施工单位 / 项目经理']]
 ];
 // What Rubik is for in each field, using only what the editor does today; the first action is one of the three
 // welcome entries, never a different tool set (docs/product/professional-client-experience-2026-10-21.md, result 1).
 const audiencePurpose={
  architecture:['Sube el plano (PDF, imagen, DXF o IFC), comprueba la escala y entrega a tu cliente una vivienda editable en 2D y 3D.','Upload the plan (PDF, image, DXF or IFC), check its scale and give your client an editable home in 2D and 3D.','上传平面图（PDF、图片、DXF 或 IFC），检查比例，并向客户交付可编辑的 2D 和 3D 住宅。'],
  'real-estate':['Convierte el plano del inmueble en una vivienda amueblada que el comprador puede recorrer en 3D, con tu marca.','Turn the property plan into a furnished home the buyer can walk through in 3D, with your brand.','将房源平面图变成买家可在 3D 中浏览的带家具住宅，并附上你的品牌。'],
  developer:['Prepara cada tipología, también de dos plantas, y preséntala con la misma identidad de marca.','Prepare each unit type, two-storey ones included, and present it with the same brand identity.','准备每种户型（包括两层），并以统一的品牌形象展示。'],
  renovation:['Parte del plano actual, ajusta estancias y huecos y enseña al cliente la propuesta en 3D.','Start from the current plan, adjust rooms and openings and show the client the proposal in 3D.','从现有平面图开始，调整房间和门窗，并在 3D 中向客户展示方案。'],
  interior:['Amuebla, elige acabados y presenta cada ambiente en 3D a tu cliente.','Furnish, choose finishes and present each room in 3D to your client.','布置家具、选择饰面，并在 3D 中向客户展示每个空间。'],
  construction:['Mide y presupuesta, organiza el plan de obra con su Gantt y enseña al cliente la evolución prevista en 3D.','Measure and budget, organise the works plan with its Gantt chart and show the client the planned evolution in 3D.','计量与预算，用甘特图编排施工计划，并以 3D 向客户展示计划中的施工进展。']
 };
 // HOM-01: what the hero says once a profession is chosen. Only outcomes the editor gives today; without a profession
 // the hero keeps its neutral text. The first action is always an existing entry (upload, example or the 3D walk).
 const audienceHero={
  architecture:{eyebrow:['Para estudios de arquitectura','For architecture studios','面向建筑设计事务所'],title:['Del plano a una propuesta que tu cliente entiende','From the plan to a proposal your client understands','从平面图到客户能看懂的方案'],lead:['Importa y calibra el plano, analiza orientación y emplazamiento, mide y presupuesta, y entrega láminas con tu marca.','Import and calibrate the plan, analyse orientation and site, measure and budget, and deliver sheets with your brand.','导入并校准平面图，分析朝向与场地，计量与预算，并交付带品牌的图纸。'],first:'upload'},
  'real-estate':{eyebrow:['Para inmobiliarias','For real estate agencies','面向房产中介'],title:['Que el comprador recorra el inmueble antes de visitarlo','Let the buyer walk through the property before visiting','让买家在看房前先浏览房源'],lead:['Convierte el plano en una vivienda amueblada en 3D, preséntala por estancias y genera imágenes fotorrealistas orientativas.','Turn the plan into a furnished 3D home, present it room by room and create indicative photorealistic images.','将平面图变成带家具的 3D 住宅，按房间展示，并生成照片级参考图片。'],first:'walk'},
  developer:{eyebrow:['Para promotoras','For property developers','面向开发商'],title:['Cada tipología, también de dos plantas, con tu marca','Each unit type, two-storey ones included, with your brand','每种户型（含两层）统一品牌形象'],lead:['Prepara las viviendas y sus plantas, preséntalas en 3D con la misma identidad y acompáñalas de imágenes fotorrealistas orientativas.','Prepare the homes and their levels, present them in 3D with the same identity and add indicative photorealistic images.','准备住宅及其楼层，以统一形象 3D 展示，并附上照片级参考图片。'],first:'example'},
  renovation:{eyebrow:['Para empresas de reformas','For renovation companies','面向装修公司'],title:['Enseña la reforma antes de empezar la obra','Show the renovation before work starts','开工前展示改造方案'],lead:['Parte del plano actual, compara propuestas, calcula mediciones y presupuesto, y muestra el resultado en 3D y en imagen fotorrealista orientativa.','Start from the current plan, compare proposals, compute quantities and budget, and show the result in 3D and as an indicative photorealistic image.','从现有平面图开始，比较方案，计算工程量与预算，并以 3D 和照片级参考图片展示结果。'],first:'upload'},
  construction:{eyebrow:['Para constructoras y jefes de obra','For contractors and site managers','面向施工单位和项目经理'],title:['La obra planificada, explicada en 3D','The planned works, explained in 3D','用 3D 讲清计划中的施工'],lead:['Mediciones y presupuesto, plan de obra con Gantt y dependencias, y la evolución prevista de la obra en 3D a partir de ese plan. No sustituye el seguimiento real de la obra.','Quantities and budget, a works plan with Gantt and dependencies, and the planned evolution of the works in 3D from that plan. It does not replace real site tracking.','工程量与预算、含甘特图和依赖关系的施工计划，以及基于该计划的 3D 施工进展。不能替代真实的现场跟踪。'],first:'example'},
  interior:{eyebrow:['Para decoración e interiorismo','For interior design','面向室内设计'],title:['Ambientes amueblados que tu cliente puede recorrer','Furnished spaces your client can walk through','客户可以漫游的带家具空间'],lead:['Amuebla, elige acabados reales, recorre cada estancia en 3D y genera imágenes fotorrealistas orientativas con estilos alternativos.','Furnish, choose real finishes, walk each room in 3D and create indicative photorealistic images with alternative styles.','布置家具、选择真实饰面、3D 漫游每个房间，并生成不同风格的照片级参考图片。'],first:'example'}
 };
 let audience='';
 try{const stored=originalStorage.getItem(audienceKey);if(audiences.some(([id])=>id===stored))audience=stored;}catch{}
 try{const raw=originalStorage.getItem(KEY);if(raw){const parsed=JSON.parse(raw);if(parsed.version===1&&parsed.entries&&typeof parsed.entries==='object'&&!Array.isArray(parsed.entries))data=parsed;}}catch{storageError=tx('No se pudo recuperar la guía. El plano se conserva.','The guide could not be restored. The plan is preserved.','无法恢复指南。平面图已保留。');}
 function el(tag,text,parent,cls){const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;if(parent)parent.append(n);return n;}
 function btn(id,text,fn,parent,primary=false){const n=el('button',text,parent,'btn'+(primary?' primary':''));n.id=id;n.type='button';n.onclick=fn;return n;}
 function store(){try{originalStorage.setItem(KEY,JSON.stringify(data));storageError='';return true;}catch{storageError=tx('La guía no se pudo guardar. Exporta el proyecto; el progreso se recalculará al abrirlo.','The guide could not be saved. Export the project; progress will be recalculated when opened.','无法保存指南。请导出项目；重新打开时会重新计算进度。');return false;}}
 function isReference(p){const ref=Core.initial();return JSON.stringify([p.walls,p.rooms,p.objects,p.openings])===JSON.stringify([ref.walls,ref.rooms,ref.objects,ref.openings]);}
 function state(){const id=library?.activeId()||project.id;let s=data.entries[id];
  if(!s||s.projectId!==project.id||!G.goals[s.goal]||!s.evidence||typeof s.evidence!=='object'||Array.isArray(s.evidence)||!Array.isArray(s.completed)||!Array.isArray(s.skipped))s=data.entries[id]=G.initial(project,isReference(project)?'example':'own');
  return s;
 }
 function saved(){try{const pending=persistence.session?.state();if(pending&&(pending.status!=='saved'||pending.outdated))return false;const raw=originalStorage.getItem(FloorPlanLibrary.KEY);if(library&&raw){const entry=JSON.parse(raw).entries.find(e=>e.id===library.activeId());const current=entry?.kind==='building'?entry.building.levels.find(l=>l.id===entry.activeLevelId)?.project:entry?.project;return JSON.stringify(current)===JSON.stringify(project);}return originalStorage.getItem(STORE)===JSON.stringify(project);}catch{return false;}}
 function facts(){return {saved:saved(),imagesReady:!!project.sourceImages?.length&&project.sourceImages.every(i=>FloorPlanTraceUI.imageReady(i.id))};}
 function progress(){return G.evaluate(project,state(),facts());}
 const header=$('header'),searchBtn=btn('actionSearchBtn','',()=>openSearch(),header);searchBtn.setAttribute('aria-haspopup','dialog');
 const searchPrompt=el('span',undefined,searchBtn,'guide-search-prompt'),searchCompact=el('span',undefined,searchBtn,'guide-search-compact');
 const homeBtn=btn('welcomeBtn','',()=>openWelcome(),header);homeBtn.title=tx('Volver a la bienvenida','Open welcome','打开欢迎页');
 const resume=btn('guideResume','',()=>{state().closed=false;state().fullTools=false;fullEditor=false;store();render();},header);
 // The guided header keeps what the journey needs: the level switch of a building, the 3D modes (in 3D only) and the
 // presentation entry (secondary here: the guide's own button is the dominant action).
 const essentials=new Set(['uploadPlanBtn','roomPlanJoinQuick','uploadCancel','paneBtns','viewSeg','projectsBtn','langBtn','actionSearchBtn','welcomeBtn','guideResume','levelBar','modes3d','roofGroup','presentationBtn']);
 for(const child of header.children)if(!essentials.has(child.id)&&!child.classList.contains('brand')&&!child.querySelector('#undo'))child.classList.add('advanced-control');
 const bar=el('section',undefined,undefined,'guide-bar');bar.id='guideBar';bar.setAttribute('aria-label','Objetivo y progreso');header.after(bar);
 const top=el('div',undefined,bar,'guide-top'),identity=el('div',undefined,top,'guide-identity');
 const projectLabel=el('span',undefined,identity,'guide-project'),goalLabel=el('span',undefined,identity,'guide-goal');
 const topActions=el('div',undefined,top,'guide-controls');btn('guidePrevious','',()=>previousTask(),topActions);btn('guideGoalChange','',()=>openGoal(),topActions);btn('guideDetails','',()=>openDetails(),topActions);
 // Compact guide (default on phones and short screens): goal, current task and its buttons stay; the step list,
 // the progress line and long descriptions are hidden until «Ver más». The choice is remembered per browser.
 const compactKey='rubik-guide-compact',compactDefault=()=>matchMedia('(max-width:600px),(max-height:720px)').matches;
 let compact=(()=>{try{const v=localStorage.getItem(compactKey);return v===null?compactDefault():v==='1';}catch{return compactDefault();}})();
 const compactBtn=btn('guideCompact','',()=>{compact=!compact;try{localStorage.setItem(compactKey,compact?'1':'0');}catch{}applyCompact();},topActions);
 function applyCompact(){bar.classList.toggle('guide-compact',compact);compactBtn.textContent=compact?tx('Ver más','Show more','显示更多'):tx('Ver menos','Show less','显示更少');compactBtn.setAttribute('aria-expanded',String(!compact));compactBtn.title=compact?tx('Mostrar etapas y progreso de la guía','Show guide stages and progress','显示指南阶段和进度'):tx('Ocultar etapas y progreso para dejar más plano a la vista','Hide stages and progress to show more of the plan','隐藏阶段和进度以显示更多平面图');}btn('guideClose','',()=>{state().closed=true;store();render();resume.focus();},topActions);
 const progressLine=el('div',undefined,bar,'guide-progress-line'),progressText=el('strong',undefined,progressLine),meter=el('div',undefined,progressLine,'guide-progress');meter.setAttribute('role','progressbar');meter.setAttribute('aria-valuemin','0');meter.setAttribute('aria-valuemax','100');const fill=el('span',undefined,meter);
 const optionalText=el('span',undefined,progressLine),steps=el('ol',undefined,bar,'guide-steps');
 const professionalStages=[['Preparar','Prepare','准备'],['Diseñar','Design','设计'],['Amueblar','Furnish','布置家具'],['Revisar','Review','检查'],['Entregar','Deliver','交付']];
 const journeyLabel=el('p',undefined,bar,'guide-journey-label');journeyLabel.id='guideJourneyLabel';steps.before(journeyLabel);
 for(let i=0;i<5;i++){const li=el('li',undefined,steps),b=btn('guideStage'+i,'',()=>{if(i===4){window.FloorPlanProfessionalUI?.open('deliver');return;}const p=progress(),tasks=p.tasks.filter(t=>([[0,1],[2],[3],[4]][i]).includes(t.stage));if(tasks.length){state().current=(tasks.find(t=>t.status!=='completed'&&!t.skipped)||tasks[0]).id;state().manualTask=true;store();render();}else{toast(tx('Esta etapa no requiere tareas para tu objetivo.','This stage has no tasks for your goal.','此阶段没有目标任务。'));}},li);el('span',String(i+1),b,'step-number');el('span',undefined,b,'step-label');}
 const current=el('div',undefined,bar,'guide-current'),copy=el('div',undefined,current,'guide-task-copy'),currentTitle=el('h2',undefined,copy),currentInstruction=el('p',undefined,copy);
 const currentAction=btn('guidePrimary','',()=>runTask(progress().current),current,true);
 const secondaryAction=btn('guideSecondary','',()=>{},current);secondaryAction.classList.add('guide-link');const laterAction=btn('guideLater','',()=>{},current);laterAction.classList.add('guide-link');
 const goalDone=el('p',undefined,copy,'guide-goal-done');
 const presentAction=btn('guidePresent','',event=>window.FloorPlanPresentation?.open(event.currentTarget),current);
 const exampleLine=el('div',undefined,bar,'guide-example'),exampleNote=el('span',undefined,exampleLine);btn('guideCopyExample','',()=>copyExample(),exampleLine);
 applyCompact();
 const empty=el('div',undefined,$('#stage'),'plan-empty');empty.id='guideEmpty';const emptyBox=el('div',undefined,empty),emptyTitle=el('h2',undefined,emptyBox),emptyText=el('p',undefined,emptyBox);btn('guideEmptyAction','',()=>runTask(progress().tasks.find(t=>t.id==='geometry')),emptyBox,true);
 const announcement=el('p',undefined,undefined);announcement.id='guideAnnouncement';announcement.style.cssText='position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%)';announcement.setAttribute('role','status');announcement.setAttribute('aria-live','polite');document.body.append(announcement);
 function dialog(id){const d=el('dialog',undefined,document.body,'guide-dialog');d.id=id;d.setAttribute('aria-labelledby',id+'Title');return d;}
 const details=dialog('guideDialog'),goalDialog=dialog('goalDialog'),actionDialog=dialog('actionDialog'),welcome=dialog('welcomeDialog');
 const dialogs=[details,goalDialog,actionDialog,welcome];const focusReturns=new WeakMap();
 for(const d of dialogs)d.addEventListener('close',()=>{const target=focusReturns.get(d);if(target?.isConnected&&!target.closest('[hidden]')&&!target.closest('dialog:not([open])'))target.focus();else searchBtn.focus();});
 function show(d){focusReturns.set(d,document.activeElement);if(!d.open)d.showModal();}
 function heading(d,title){const row=el('div',undefined,d,'dialog-heading');const h=el('h2',title,row);h.id=d.id+'Title';btn(d.id+'Close',tx('Cerrar','Close','关闭'),()=>d.close(),row);}
 function markSeen(){data.seen=true;store();}
 welcome.addEventListener('cancel',e=>{e.preventDefault();closeWelcome();});
 // Screen navigation is distinct from document/history editing. URLs keep the project intact.
 function setRoute(screen,replace=false){
  const url=new URL(location.href);url.hash=screen==='welcome'?'inicio':'editor';
  if(!replace&&url.hash===location.hash)return;
  window.FloorPlanApp?.cancelFileImport();
  history[replace?'replaceState':'pushState']({...history.state,rubikScreen:screen},'',url);navigationEpoch++;
 }
 function closeDialogs(except){for(const d of document.querySelectorAll('dialog[open]'))if(d!==except){
  if(d.id==='roomDesignDialog')FloorPlanRoomUI.cancel();else d.close();
 }roomReturnToWelcome=false;}
 function closeWelcome(){if(welcome.open)welcome.close();markSeen();setRoute('editor');}
 function restoreRoute(){window.FloorPlanApp?.cancelFileImport();navigationEpoch++;
  if(location.hash==='#inicio')openWelcome(false);
  else if(location.hash==='#editor'){closeDialogs();markSeen();render();searchBtn.focus();}
 }
 addEventListener('popstate',restoreRoute);
 addEventListener('hashchange',()=>{const screen=location.hash==='#inicio'?'welcome':location.hash==='#editor'?'editor':null;if(screen&&history.state?.rubikScreen!==screen)restoreRoute();});
 function previousTask(){const p=progress(),tasks=p.tasks.filter(t=>!t.skipped),index=tasks.findIndex(t=>t.id===p.current.id);
  if(index<=0)return;state().current=tasks[index-1].id;state().manualTask=true;store();render();
 }
 function returnFromRoom(){if(roomReturnToWelcome){roomReturnToWelcome=false;openWelcome();}}
 function createOwn(goal='save3d',origin='blank'){
  if(!library)throw Error(tx('No está disponible la colección local. Exporta el proyecto.','Local collection is unavailable. Export the project.','本地项目集不可用。请导出项目。'));
  const fromWelcome=welcome.open;pendingEntry={goal};pendingIds=library.list().map(e=>e.id);entryOrigin=origin;closeWelcome();roomReturnToWelcome=fromWelcome;FloorPlanRoomUI.createBlankProject(tx('Mi vivienda','My home','我的住宅'));
 }
 function openWelcome(record=true){closeDialogs(welcome);closeDrawers();if(record)setRoute('welcome');buildWelcome();show(welcome);const heading=welcome.querySelector('#welcomeDialogTitle');heading?.setAttribute('tabindex','-1');heading?.focus({preventScroll:true});}
 function ownRecoverable(){return library?.all().some(e=>data.entries[e.id]?.kind==='own'||!isReference(e.project));}
 // UX-312 Home · imagen real de RUBIK que se pide SOLO cuando su sitio entra en pantalla (contrato de privacidad F2: abrir
 // la Home no descarga lo que nadie ve). Clase .welcome-real-shot: imagen dibujada por la app, nunca marcado inyectado.
 function realImg(parent,src,alt,cls){const im=el('img',undefined,parent,'welcome-real-shot'+(cls?' '+cls:''));im.alt=alt;im.decoding='async';
  const put=()=>{if(!im.getAttribute('src'))im.src=src;};
  if(typeof IntersectionObserver!=='function')put();else{const io=new IntersectionObserver(es=>{if(es.some(e=>e.isIntersecting)){io.disconnect();put();}},{rootMargin:'200px'});io.observe(parent);}
  return im;}
 function buildWelcome(){welcome.replaceChildren();const shell=el('div',undefined,welcome,'welcome-shell'),brand=el('div',undefined,shell,'welcome-brand'),mark=el('div',undefined,brand,'brand-mark'),glyph=el('span',undefined,mark,'brand-glyph');glyph.setAttribute('aria-hidden','true');for(let i=0;i<4;i++)el('i',undefined,glyph);const words=el('div',undefined,mark);el('strong','Rubik Sota',words);el('small','Floor Plan Designer',words);
  const nav=el('div',undefined,brand,'welcome-nav');
  if(data.seen||hadLibrary)btn('welcomeReturn',tx('Volver al proyecto →','Return to project →','返回项目 →'),closeWelcome,nav);
  btn('welcomeLanguage',({es:'English',en:'Chinese',zh:'Español'})[LANG],()=>{const top=welcome.scrollTop;setLang(({es:'en',en:'zh',zh:'es'})[LANG]);buildWelcome();welcome.scrollTop=top;/* the button is rebuilt with the Home: keyboard focus stays on it */document.getElementById('welcomeLanguage')?.focus({preventScroll:true});},nav);
  // «Legal y autoría»: the platform's existing, approved legal and authorship text (#legalDialog), never a copy.
  // Always in the Home's top bar, whatever the chosen field; it opens over the Home and closing it returns here.
  btn('welcomeLegal',tx('Legal y autoría','Legal & authorship','法律与作者'),()=>window.FloorPlanLegal?.open(),nav).classList.add('welcome-legal');
  const intro=el('section',undefined,shell,'welcome-intro'),left=el('div',undefined,intro);
  const eyebrow=el('p','',left,'welcome-eyebrow');const h=el('h1','',left);h.id='welcomeDialogTitle';const lead=el('p','',left,'lead');
  // UX-312 Home · cabecera aprobada por el propietario: título y subtítulo fijos; la profesión elegida añade su propia
  // línea (#welcomeHeroAudience) y su primera acción, sin cambiar el título.
  h.textContent=tx('Imaginar. Diseñar. Construir. Presentar. Recorrer.','Imagine. Design. Build. Present. Walk through.','构想。设计。建造。展示。漫游。');
  lead.textContent=tx('Cinco fases para llevar un proyecto desde la idea hasta la experiencia final. Una única firma profesional.','Five phases to take a project from the idea to the final experience. One professional signature.','五个阶段，把项目从构想带到最终体验。统一的专业署名。');
  const heroAudience=el('div',undefined,left,'welcome-hero-audience');heroAudience.id='welcomeHeroAudience';heroAudience.setAttribute('aria-live','polite');
  // HOM-01: two working calls to action in the hero; both run an existing entry, never a new tool.
  const heroActions=el('div',undefined,left,'welcome-hero-actions');
  const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth';
  const goDeliverables=()=>{const t=document.getElementById('welcomeDeliverables');t?.scrollIntoView({block:'start',behavior:reduced()});document.getElementById('welcomeDeliverablesTitle')?.focus({preventScroll:true});};
  const heroPrimary=btn('welcomeHeroPrimary',tx('Probar la vivienda de ejemplo','Try the example home','试用示例住宅'),()=>document.getElementById('welcomeExample').click(),heroActions,true),heroSecondary=btn('welcomeHeroSecondary',tx('Ver qué puedes entregar','See what you can deliver','查看可以交付什么'),goDeliverables,heroActions);heroSecondary.classList.add('guide-link');
  const FIRST={upload:[['Subir mi plano','Upload my plan','上传我的平面图'],()=>document.getElementById('welcomeUpload').click()],example:[['Probar el ejemplo','Try the example','试用示例'],()=>document.getElementById('welcomeExample').click()],walk:[['Recorrer el ejemplo en 3D','Walk through the example in 3D','在 3D 中漫游示例'],()=>safe(walkExample)]};
  function renderHero(){const c=audienceHero[audience];
   eyebrow.textContent=c?label(c.eyebrow):tx('Para inmobiliarias, promotoras y estudios','For agencies, developers and studios','面向房产中介、开发商和设计事务所');
   heroAudience.replaceChildren();heroAudience.hidden=!c;heroPrimary.dataset.first=c?.first||'example';welcome.dataset.audience=audience||'';if(!c)return;
   el('strong',label(c.title),heroAudience);el('p',label(c.lead),heroAudience);
   // La primera acción propia de la profesión (subir el plano, recorrer en 3D) sigue a un clic; la principal es neutra.
   if(c.first!=='example'){const [text,fn]=FIRST[c.first];btn('welcomeHeroFirst',label(text),()=>fn(),heroAudience).classList.add('guide-link');}}
  renderHero();
  el('p',tx('Obtendrás un plano 2D editable y su vista 3D, guardados en este navegador. Las medidas son orientativas: no sustituyen a una medición profesional.','You get an editable 2D plan and its 3D view, stored in this browser. Measurements are indicative, not a professional survey.','你将得到可编辑的 2D 平面图及其 3D 视图，保存在此浏览器中。尺寸仅供参考，不能替代专业测量。'),left,'welcome-result');
  // «El plano | La vivienda en 3D»: the same example drawn in 2D and as a real 3D capture made with Rubik
  // (assets/welcome/example-3d.webp), so the step from plan to home is shown, not described.
  const figure=el('figure',undefined,intro,'welcome-visual');const views=el('div',undefined,figure,'visual-tag welcome-views');views.setAttribute('role','group');views.setAttribute('aria-label',tx('Ver el ejemplo','View the example','查看示例'));
  drawExample(figure);const shot=el('img',undefined,figure,'welcome-shot');shot.src='assets/welcome/example-3d.webp';shot.alt=tx('Captura real de Rubik: el mismo ejemplo en 3D, amueblado','Real Rubik capture: the same example in 3D, furnished','Rubik 实际截图：同一示例的 3D 带家具视图');shot.hidden=true;shot.loading='lazy';
  const caption=el('figcaption',undefined,figure);
  const show=view=>{figure.dataset.view=view;figure.querySelector('svg').style.display=view==='plan'?'':'none';shot.hidden=view!=='home';for(const b of views.children)b.setAttribute('aria-pressed',String(b.dataset.view===view));
   caption.textContent=view==='plan'?tx('Proyecto de ejemplo · el plano en 2D','Example project · the 2D plan','示例项目 · 2D 平面图'):tx('Captura real de Rubik · la misma vivienda en 3D','Real Rubik capture · the same home in 3D','Rubik 实际截图 · 同一住宅的 3D 视图');};
  for(const [view,text] of [['plan',tx('El plano','The plan','平面图')],['home',tx('La vivienda en 3D','The home in 3D','3D 住宅')]]){const b=btn('welcomeView-'+view,text,()=>show(view),views);b.dataset.view=view;}
  show('plan');
  const entries=el('div',undefined,shell,'welcome-entries');
  for(const [id,icon,title,description,fn]of [
   ['welcomeUpload','↑',['Subir un plano','Upload a floor plan','上传平面图'],['Si ya tienes un plano: PDF, imagen, DXF, IFC, RoomPlan o proyecto JSON/ZIP. Revisarás el resultado antes de usarlo; las imágenes se calibran con una medida conocida.','If you already have a plan: PDF, image, DXF, IFC, RoomPlan or a JSON/ZIP project. You review the result before using it; images are calibrated with a known measurement.','如果已有平面图：PDF、图片、DXF、IFC、RoomPlan 或 JSON/ZIP 项目。使用前先检查结果；图片需用已知尺寸校准。'],()=>beginUpload()],
   ['welcomeBlank','+',['Crear desde cero','Create from scratch','从零创建'],['Proyecto vacío: añade estancias indicando ancho y fondo, o dibújalas sobre el plano.','An empty project: add rooms by width and depth, or draw them on the plan.','空项目：输入宽度和进深添加房间，或在平面图上绘制。'],()=>createOwn('create')],
   ['welcomeExample','◇',['Probar el ejemplo','Try the example','试用示例'],['Explora en 2D y 3D una vivienda ya preparada. Para guardar cambios como tuyos, crea una copia.','Explore a prepared home in 2D and 3D. To keep changes as yours, create a copy.','在 2D 和 3D 中浏览准备好的住宅。要保存为自己的修改，请创建副本。'],()=>example()]
  ]){const b=btn(id,'',()=>safe(fn),entries);b.className='welcome-entry';el('span',icon,b,'entry-icon').setAttribute('aria-hidden','true');el('strong',label(title),b);el('span',label(description),b);}
  // B5: the human-assisted service, for whoever prefers not to convert the plan themselves.
  const service=el('p',undefined,shell,'welcome-service');el('span',tx('¿Prefieres que lo preparemos nosotros? ','Prefer us to prepare it? ','希望由我们来准备？'),service);btn('welcomeService',tx('Envíanos tu plano','Send us your plan','发送平面图'),()=>window.FloorPlanPlanService?.open(),service).classList.add('guide-link');
  // UX-312 Home · «Prueba del caso»: la MISMA vivienda de ejemplo del plano a la entrega, con capturas reales de RUBIK
  // y la acción real de cada paso. Abrir el ejemplo no cambia ningún proyecto del usuario.
  const caseSec=el('section',undefined,shell,'welcome-case');caseSec.id='welcomeCase';caseSec.setAttribute('aria-labelledby','welcomeCaseTitle');
  el('h2',tx('Una vivienda, del plano a la entrega','One home, from plan to delivery','一套住宅：从平面图到交付'),caseSec).id='welcomeCaseTitle';
  el('p',tx('La vivienda de ejemplo recorre las cinco fases. Todas las imágenes son capturas reales de RUBIK con ese proyecto.','The example home goes through the five phases. Every image is a real RUBIK capture of that project.','示例住宅经历全部五个阶段。所有图片均为该项目的 RUBIK 真实截图。'),caseSec,'lead');
  const steps=el('ol',undefined,caseSec,'welcome-case-steps');
  for(const [id,img,phase,title,text,note,action,fn] of [
   ['plan','assets/welcome/caso-plano.webp',['Imaginar','Imagine','构想'],['El plano','The plan','平面图'],['Lámina de distribución con superficies por estancia.','Layout sheet with the area of each room.','带各房间面积的布局图纸。'],null,['Abrir el ejemplo en 2D','Open the example in 2D','以 2D 打开示例'],()=>document.getElementById('welcomeExample').click()],
   ['3d','assets/welcome/caso-3d.webp',['Diseñar','Design','设计'],['La vivienda en 3D','The home in 3D','3D 住宅'],['La misma distribución, amueblada, para recorrerla por dentro.','The same layout, furnished, to walk through inside.','同一布局，带家具，可在室内漫游。'],null,['Recorrer por dentro','Walk through inside','室内漫游'],()=>safe(walkExample)],
   ['budget','assets/welcome/caso-presupuesto.webp',['Construir','Build','建造'],['Mediciones y presupuesto','Quantities and budget','工程量与预算'],['Partidas medidas sobre el proyecto; los precios los revisas tú.','Items measured on the project; you review the prices.','基于项目计量的条目；价格由你审核。'],null,['Ver Presupuestar','See Budget','查看预算'],()=>safe(()=>exampleThen('budget'))],
   ['works','assets/welcome/demo-evolucion-4d.webp',['Construir','Build','建造'],['La obra prevista','The planned works','计划中的施工'],['La vivienda se construye semana a semana según su plan de obra.','The home is built week by week following its works plan.','住宅按施工计划逐周建造。'],['Datos de ejemplo: fechas ilustrativas y sin importes.','Example data: illustrative dates, no amounts.','示例数据：日期仅供说明，不含金额。'],['Ver la obra prevista','See the planned works','查看计划中的施工'],()=>{location.href='evolucion/?demo=obra';}],
   ['delivery','assets/welcome/caso-entrega.webp',['Presentar y recorrer','Present and walk through','展示与漫游'],['La entrega al cliente','The client delivery','交付给客户'],['Archivo, lámina, dossier, visita y vídeo, limpios o con tu firma.','File, sheet, dossier, visit and video, clean or with your signature.','文件、图纸、档案、参观和视频，可不署名或带你的署名。'],null,['Ver qué puedes entregar','See what you can deliver','查看可以交付什么'],goDeliverables]]){
   const li=el('li',undefined,steps,'welcome-case-step');li.dataset.step=id;
   const fig=el('figure',undefined,li);realImg(fig,img,label(title)+' · '+tx('captura real de RUBIK con la vivienda de ejemplo','real RUBIK capture of the example home','示例住宅的 RUBIK 真实截图'));
   el('figcaption',tx('Captura real · vivienda de ejemplo','Real capture · example home','真实截图 · 示例住宅'),fig);
   el('p',label(phase),li,'welcome-case-phase');el('h3',label(title),li);el('p',label(text),li);if(note)el('p',label(note),li,'demo-card-note');
   btn('welcomeCase-'+id,label(action),()=>fn(),li).classList.add('guide-link');}
  // HOM-04 · «Descubre RUBIK en acción»: the two most visual capabilities, as guided demos with the example
  // home, right after the ways to start. No account, no project of the visitor and no AI: 4D build (evolucion/?demo=obra,
  // built in memory) and «Dibujo vivo» (?demo=dibujo-vivo, the existing presentation of the example; js/home-demos.js).
  const inAction=el('section',undefined,shell,'welcome-in-action');inAction.id='welcomeInAction';inAction.setAttribute('aria-labelledby','welcomeInActionTitle');
  el('h2',tx('Descubre RUBIK en acción','See RUBIK in action','观看 RUBIK 实际效果'),inAction).id='welcomeInActionTitle';
  el('p',tx('Explora diez demostraciones con la vivienda de ejemplo de RUBIK.','Explore ten demonstrations with the RUBIK example home.','使用 RUBIK 示例住宅探索十个演示。'),inAction,'lead');
  const demoCards=el('div',undefined,inAction,'demo-cards');
  for(const [id,img,kicker,title,text,note,action,href] of [
   ['evolucion-obra','assets/welcome/demo-evolucion-4d.webp',['Evolución de obra 4D','4D construction','4D 施工'],['Descubre cómo evoluciona una obra','See how a build evolves','查看施工如何推进'],
    ['Una vivienda que se construye virtualmente semana a semana: vista 3D, fases y planificación de obra.','A home built virtually week by week: 3D view, phases and the construction plan.','一座逐周虚拟建造的住宅：3D 视图、阶段与施工计划。'],
    ['Datos de ejemplo: fechas ilustrativas y sin importes.','Example data: illustrative dates, no amounts.','示例数据：日期仅供说明，不含金额。'],['Ver demo de evolución 4D','See the 4D build demo','查看 4D 施工演示'],'evolucion/?demo=obra'],
   ['dibujo-vivo','assets/welcome/demo-dibujo-vivo.webp',['Dibujo vivo','Living drawing','活绘'],['Del dibujo a la realidad','From drawing to reality','从图纸到现实'],
    ['Una vivienda dibujada a grafito se convierte, estancia a estancia, en un espacio 3D con sus materiales.','A home drawn in graphite turns, room by room, into a 3D space with its materials.','一座石墨绘制的住宅逐个房间变成带材料的 3D 空间。'],
    ['La misma presentación que puedes hacer con tu proyecto. Sin IA.','The same presentation you can make with your project. No AI.','与你可以用自己项目制作的演示相同。不使用 AI。'],['Ver demo de dibujo vivo','See the living drawing demo','查看活绘演示'],'?demo=dibujo-vivo']]){
   const card=el('article',undefined,demoCards,'demo-card');card.dataset.demo=id;
   const fig=el('figure',undefined,card);const im=el('img',undefined,fig,'welcome-demo-shot');im.src=img;im.loading='lazy';im.alt=label(title)+' · '+tx('captura real de RUBIK','real RUBIK capture','RUBIK 真实截图');
   const body=el('div',undefined,card,'demo-card-body');el('p',label(kicker),body,'demo-card-kicker');el('h3',label(title),body);el('p',label(text),body);el('p',label(note),body,'demo-card-note');
   btn('welcomeDemo-'+id,label(action),()=>{location.href=href;},body,true).classList.add('demo-card-go');
   // «Personalizar esta demo» abre el configurador vigente de Evolución; sigue siendo temporal (no guarda nada).
   if(id==='evolucion-obra')btn('welcomeDemoCustomize-'+id,tx('Personalizar esta demo','Customise this demo','自定义此演示'),()=>{location.href=href+'&personalizar=1';},body).classList.add('guide-link');}
  for(const [id,img,title,text,action,href] of [
   ['blueprint-3d','assets/welcome/demo-blueprint-3d.webp',['Blueprint 3D','Blueprint 3D','Blueprint 3D'],['Explora la planta acotada, los alzados y las secciones.','Explore the dimensioned plan, elevations and sections.','查看标注平面图、立面和剖面。'],['Ver demo de Blueprint 3D','See Blueprint 3D demo','查看 Blueprint 3D 演示'],'bpdp/?demo=blueprint'],
   ['despiece-3d','assets/welcome/demo-despiece-3d.webp',['Despiece 3D','3D exploded view','3D 分解'],['Separa los componentes por familias y vuelve a montar la vivienda.','Separate components by system and reassemble the home.','按系统分离构件并重新组装住宅。'],['Ver demo de Despiece 3D','See 3D exploded view demo','查看 3D 分解演示'],'bpdp/?demo=despiece&escena=rubik-real']]){
   const card=el('article',undefined,demoCards,'demo-card');card.dataset.demo=id;
   const fig=el('figure',undefined,card);realImg(fig,img,label(title),'welcome-demo-shot');
   const body=el('div',undefined,card,'demo-card-body');el('h3',label(title),body);el('p',label(text),body);
   btn('welcomeDemo-'+id,label(action),()=>{location.href=href;},body,true).classList.add('demo-card-go');}
  // UX-312 · seis capacidades más (portadas: capturas reales de RUBIK; procedencia en assets/welcome/PROCEDENCIA.md).
  // Cada visual explica su función: recorrer (teléfono con joystick y minimapa), reproducir (fotogramas de un MP4 real),
  // comparar (misma cámara RUBIK | Cycles), consultar (consulta guiada con fuente), estilos (vista de origen; variantes
  // pendientes de ejemplos acreditados) y entregable (lámina, dossier y presentación con firma de demostración).
  for(const [id,kicker,title,text,note,action] of [
   ['recorrido',['Recorrido 3D','3D walkthrough','三维漫游'],['Recorre tu plano en 3D','Walk through your plan in 3D','在三维中漫游你的平面'],['A la altura de los ojos, con el joystick táctil y el minimapa que marca dónde estás y hacia dónde miras.','At eye level, with the touch joystick and the minimap showing where you are and where you look.','以视线高度漫游，触控摇杆与小地图显示你的位置和朝向。'],['Vivienda de ejemplo. No cambia nada.','Example home. Nothing changes.','示例住宅。不会更改任何内容。'],['Recorrer la vivienda de ejemplo','Walk through the example home','漫游示例住宅']],
   ['video',['Vídeo','Video','视频'],['Vídeo cinematográfico','Cinematic video','电影感视频'],['Del plano a la escena y la entrada en una estancia, grabado como MP4 desde la presentación.','From the plan to the scene and into a room, recorded as MP4 from the presentation.','从平面到场景再进入房间，从演示中录制为 MP4。'],['Fotogramas de un MP4 real de RUBIK.','Frames from a real RUBIK MP4.','来自 RUBIK 真实 MP4 的帧。'],['Ver vídeo de ejemplo','See the example video','查看示例视频']],
   ['comparativa',['Render','Render','渲染'],['Visualización profesional','Professional visualisation','专业可视化'],['La misma cámara en RUBIK y en Blender Cycles: luz y materiales del salón con calidad de render.','The same camera in RUBIK and in Blender Cycles: living-room light and materials at render quality.','RUBIK 与 Blender Cycles 中的同一相机：客厅的光线与材料达到渲染品质。'],['Render real de Cycles · flujo actual de imágenes fijas.','Real Cycles render · current still-image workflow.','真实 Cycles 渲染 · 当前静态图像流程。'],['Ver comparativa de render','See the render comparison','查看渲染对比']],
   ['asistente',['Asistente','Assistant','助手'],['Asistente RUBIK','RUBIK assistant','RUBIK 助手'],['Pregunta por tu proyecto y recibe la respuesta con la fuente del dato.','Ask about your project and get the answer with the source of the data.','询问你的项目，获得带数据来源的回答。'],['Consulta guiada: sin modelo de lenguaje y sin enviar nada. Ilustración editorial.','Guided query: no language model and nothing sent. Editorial illustration.','引导查询：不使用语言模型，不发送任何内容。编辑插画。'],['Probar la consulta guiada','Try the guided query','试用引导查询']],
   ['estilos',['Render IA','AI render','AI 渲染'],['Enseña el después de tu proyecto antes de empezar','Show the after of your project before you start','开工前就展示项目的完成效果'],['Transforma una vista de tu proyecto con distintos estilos. Compara cómo cambian la luz, los materiales y el ambiente desde el mismo encuadre.','Transform a view of your project with different styles. Compare how light, materials and atmosphere change from the same framing.','用不同风格转换项目的一个视图。从同一构图比较光线、材料和氛围的变化。'],['Usa las variantes para explicar tu propuesta, explorar acabados y ayudar al cliente a elegir antes de la obra.','Use the variants to explain your proposal, explore finishes and help the client choose before the works.','用这些变体说明你的方案、探索饰面，并在施工前帮助客户做出选择。'],['Comparar estilos','Compare styles','比较风格']],
   ['entrega',['Entregar','Deliver','交付'],['Entrega con tu firma','Delivery with your signature','带你签名的交付'],['Lámina, dossier y presentación de la misma vivienda, firmados con tu estudio.','Sheet, dossier and presentation of the same home, signed with your studio.','同一住宅的图纸、档案与演示，带你的事务所签名。'],['Firma de demostración. No publica ningún enlace.','Demo signature. No link is published.','演示签名。不会发布任何链接。'],['Ver una entrega de ejemplo','See an example delivery','查看交付示例']]]){
   const card=el('article',undefined,demoCards,'demo-card');card.dataset.demo=id;
   const fig=el('figure',undefined,card);realImg(fig,'assets/welcome/en-accion/'+id+'.webp',label(title),'welcome-demo-shot');
   const body=el('div',undefined,card,'demo-card-body');el('p',label(kicker),body,'demo-card-kicker');el('h3',label(title),body);el('p',label(text),body);el('p',label(note),body,'demo-card-note');
   const go=btn('welcomeDemo-'+id,label(action),()=>window.RubikHomeEnAccion?.open(id,go),body,true);go.classList.add('demo-card-go');}
  const PORTRAIT={architecture:'arquitectura','real-estate':'inmobiliaria',developer:'promotora',renovation:'reformas',interior:'decoracion',construction:'constructora'};
  const audienceSection=el('section',undefined,shell,'welcome-audience');audienceSection.id='welcomeAudience';
  const audienceTitle=el('h2',tx('¿En qué trabajas?','What is your field?','你的工作领域是什么？'),audienceSection);audienceTitle.id='welcomeAudienceTitle';
  el('p',tx('Elige tu profesión, conoce tus herramientas, comprueba tus resultados. Consulta todas las soluciones en cualquier momento y lugar. Tu proyecto sigue igual.','Choose your profession, get to know your tools, check your results. See every solution at any time. Your project stays the same.','选择你的职业，了解你的工具，查看你的成果。随时查看所有解决方案。你的项目保持不变。'),audienceSection);
  const audienceOptions=el('div',undefined,audienceSection,'welcome-audience-options');audienceOptions.setAttribute('role','group');audienceOptions.setAttribute('aria-labelledby',audienceTitle.id);
  for(const [id,names] of audiences){const option=btn('welcomeAudience-'+id,label(names),()=>{
   audience=audience===id?'':id;
   try{if(audience)originalStorage.setItem(audienceKey,audience);else originalStorage.removeItem(audienceKey);}catch{}
   for(const node of audienceOptions.children)node.setAttribute('aria-pressed',String(node.id==='welcomeAudience-'+audience));
   showPurpose();renderHero();renderCapabilities();renderServices();renderDeliverables();markSolution();
  },audienceOptions);option.classList.add('welcome-audience-option');option.setAttribute('aria-pressed',String(audience===id));
   // Retrato del oficio (decorativo: el nombre ya está en el botón). Procedencia en la nota de la sección.
   const face=realImg(option,'assets/welcome/perfiles/'+PORTRAIT[id]+'.webp','','welcome-audience-face');face.width=40;face.height=40;option.prepend(face);}
  el('p',tx('Retratos: ilustraciones generadas para cada oficio; no son personas reales.','Portraits: illustrations generated for each field; they are not real people.','肖像：为各职业生成的插画，并非真人。'),audienceSection,'welcome-audience-credit');
  // The chosen field answers «what is it for me» and offers the same first action as the entries above.
  const purpose=el('div',undefined,audienceSection,'welcome-audience-purpose');purpose.id='welcomeAudiencePurpose';purpose.setAttribute('aria-live','polite');
  function showPurpose(){purpose.replaceChildren();purpose.hidden=!audience;if(!audience)return;
   // UX-312: retrato editorial del oficio elegido junto al resumen (se pinta con el mismo cambio que resumen, guía y
   // soluciones). Es una ilustración, no una persona real; el pie lo dice. En el móvil va con el resumen, encima.
   purpose.dataset.audience=audience;const fig=el('figure',undefined,purpose,'welcome-audience-portrait');
   const face=realImg(fig,'assets/welcome/perfiles/grande/'+PORTRAIT[audience]+'.webp',tx('Ilustración del oficio: ','Illustration of the field: ','职业插画：')+label(audiences.find(a=>a[0]===audience)?.[1]||''),'welcome-audience-portrait-img');face.width=200;face.height=250;
   el('figcaption',tx('Ilustración','Illustration','插画'),fig);
   const text=el('div',undefined,purpose,'welcome-audience-purpose-text');
   el('p',label(audiencePurpose[audience]),text);const row=el('div',undefined,text,'welcome-audience-actions');
   btn('welcomeAudienceStart',tx('Empezar: subir un plano','Start: upload a plan','开始：上传平面图'),()=>document.getElementById('welcomeUpload').click(),row,true);
   // §2 · «Hablar con el Asesor» junto al retrato: abre el Asesor (demo simulada) con esta profesión ya elegida.
   // No inicia ninguna conversación: allí empieza solo si la persona pulsa «Iniciar conversación». La consulta guiada sigue en su entrada.
   const advisorUrl='asesor/?perfil='+encodeURIComponent(audience)+'&desde=home';
   const talk=btn('welcomeAudienceAdvisor',tx('Hablar con el Asesor','Talk to the Advisor','与顾问交谈'),()=>location.assign(advisorUrl),row);talk.dataset.href=advisorUrl;
   talk.setAttribute('aria-label',tx('Hablar con el Asesor como ','Talk to the Advisor as ','以此职业与顾问交谈：')+label(audiences.find(a=>a[0]===audience)?.[1]||''));
   btn('welcomeAudienceBlank',tx('¿Sin plano? Crear desde cero','No plan? Create from scratch','没有平面图？从零创建'),()=>document.getElementById('welcomeBlank').click(),row).classList.add('guide-link');}
  showPurpose();
  // HOM-01: «Lo que puedes hacer hoy» — 3–4 capabilities for the chosen profession (or a neutral set), straight from the
  // verified registry (js/capability-registry.js, GOV-03). Each card says what it gives, its state, its honest limits
  // and opens the existing place where it lives: the upload entry, the example walk or a professional work area.
  const CAPS=window.FloorPlanCapabilities,STATE={available:['Disponible','Available','可用'],validation:['En validación','In validation','验证中'],preparation:['En preparación','In preparation','准备中']};
  const AREA={design:['Diseñar','Design','设计'],analyze:['Analizar','Analyze','分析'],budget:['Presupuestar','Budget','预算'],deliver:['Entregar','Deliver','交付'],studio:['Mi estudio','My studio','我的事务所']};
  function goArea(key){if(!window.FloorPlanProfessionalUI)return toast(tx('Esta área no está disponible en esta página.','This area is not available on this page.','此页面无法使用该区域。'),5000);closeWelcome();FloorPlanProfessionalUI.open(key);}
  function access(c){if(c.access==='upload')return [tx('Subir un plano','Upload a plan','上传平面图'),()=>document.getElementById('welcomeUpload').click()];
   if(c.access==='walk')return [tx('Recorrer el ejemplo en 3D','Walk the example in 3D','在 3D 中漫游示例'),()=>safe(walkExample)];
   if(c.id==='building'&&levelsAvailable())return [label(G.actions.levels.title),()=>openLevels()];
   const key=c.access.slice(5);if(key==='design')return [tx('Ir al editor','Go to the editor','前往编辑器'),()=>closeWelcome()];return [tx('Abrir ','Open ','打开 ')+label(AREA[key]),()=>goArea(key)];}
  const caps=el('section',undefined,shell,'welcome-capabilities');caps.id='welcomeCapabilities';caps.setAttribute('aria-labelledby','welcomeCapabilitiesTitle');
  function renderCapabilities(){caps.replaceChildren();caps.hidden=!CAPS;if(!CAPS)return;
   const head=el('h2','',caps);head.id='welcomeCapabilitiesTitle';head.tabIndex=-1;
   const who=audiences.find(a=>a[0]===audience);head.textContent=who?tx('Lo que puedes hacer hoy · ','What you can do today · ','现在可以做什么 · ')+label(who[1]):tx('Lo que puedes hacer hoy con Rubik','What you can do with Rubik today','现在可以用 Rubik 做什么');
   const grid=el('div',undefined,caps,'capability-cards');
   for(const c of CAPS.forAudience(audience||'general')){const card=el('article',undefined,grid,'capability-card');card.dataset.capability=c.id;
    const top=el('div',undefined,card,'capability-top');el('h3',label(c.name),top);const badge=el('span',label(STATE[c.state]),top,'capability-state');badge.dataset.state=c.state;
    el('p',label(c.benefit),card,'capability-benefit');if(c.limits)el('p',label(c.limits),card,'capability-limits');
    if(c.state==='available'){const [text,fn]=access(c);const b=btn('welcomeCap-'+c.id,text,()=>safe(fn),card);b.classList.add('capability-go');}}
   el('p',tx('Todas las herramientas están disponibles para cualquier profesión; aquí solo cambia el orden.','Every tool is available to any profession; only the order changes here.','所有工具对任何职业都可用；这里只改变顺序。'),caps,'capability-note');}
  renderCapabilities();
  // H-C2 (UX-312 Home): la banda de Render IA se consolida en su ficha de «Lo que puedes hacer hoy» y en su servicio,
  // que conservan sus condiciones (imagen orientativa, código de acceso del estudio, créditos de IA) y abren Entregar,
  // donde vive Render IA sobre una vista real del proyecto. No se elimina ningún acceso.
  // HOM-03 · «Nuevos servicios IA»: what is really available, what is a pilot in this browser, what is only a
  // simulation and what is in preparation — straight from the verified registry (FloorPlanCapabilities.aiServices).
  // Render IA is not repeated: its service opens Deliver, where it lives. A service only gets a button if the module that
  // opens it is on this page; «En preparación» never gets one. Nothing here calls a provider.
  // UX-312 #321 (correcciones 4 y 6): los nueve servicios dejan de ser un bloque aparte. Son «Módulos para tu trabajo»
  // dentro de «¿En qué trabajas?», junto a la guía y las soluciones: la profesión elegida pone primero los que le sirven
  // y dice para qué. Cada ficha conserva su estado real, condiciones, privacidad, créditos y acceso; «En preparación»
  // nunca tiene botón y lo explica. Nada llama a un proveedor.
  const services=el('section',undefined,audienceSection,'welcome-modules');services.id='welcomeModules';services.setAttribute('aria-labelledby','welcomeModulesTitle');
  const MPRIO={architecture:['assistant','catalog-budget','catalogs','render-ai'],'real-estate':['render-ai','photo-reform','visual-studio'],developer:['render-ai','catalogs','assistant'],renovation:['photo-reform','catalog-budget','render-ai','assistant'],interior:['catalogs','visual-studio','render-ai','assistant-catalogs'],construction:['catalog-budget','assistant']};
  const MPARA={architecture:['Para revisar la documentación y el presupuesto con su fuente.','To review documentation and budget with their source.','用于按来源审核文档和预算。'],'real-estate':['Para comunicar el inmueble con imágenes y propuestas visuales.','To communicate the property with images and visual proposals.','用于以图像和视觉方案展示房源。'],developer:['Para presentar cada tipología con tu identidad y tus productos.','To present each unit type with your identity and products.','用于以你的品牌和产品展示每种户型。'],renovation:['Para enseñar la reforma desde una foto y presupuestarla con tus fichas.','To show the renovation from a photo and budget it with your products.','用于从照片展示改造并用你的产品报价。'],interior:['Para elegir materiales y mobiliario reales y presentarlos.','To choose real materials and furniture and present them.','用于挑选真实材料和家具并展示。'],construction:['Para medir y presupuestar con precios con fuente antes de planificar.','To measure and budget with sourced prices before planning.','用于在计划前按有来源的价格计量与报价。']};
  function renderServices(){services.replaceChildren();const all=CAPS?.aiServices?.('general')||[];services.hidden=!all.length;if(!all.length)return;
   const head=el('h3',tx('Módulos para tu trabajo','Modules for your work','适合你工作的模块'),services,'welcome-modules-title');head.id='welcomeModulesTitle';head.tabIndex=-1;
   const who=audiences.find(x=>x[0]===audience);
   el('p',who?label(MPARA[audience])+' '+tx('Los demás siguen aquí debajo.','The rest are still below.','其余模块仍在下方。'):tx('Qué funciona hoy, qué es un piloto en este navegador, qué es solo una simulación y qué está en preparación. Nada se ejecuta hasta que lo abres.','What works today, what is a pilot in this browser, what is only a simulation and what is in preparation. Nothing runs until you open it.','哪些今天可用、哪些是此浏览器中的试点、哪些只是模拟、哪些正在准备。打开之前不会运行任何内容。'),services,'welcome-ai-lead');
   const GROUP={available:[['Disponible','Available','可用'],['Activo en RUBIK, con sus condiciones.','Active in RUBIK, with its conditions.','已在 RUBIK 启用，附带条件。']],
    pilot:[['Piloto en este navegador','Pilot in this browser','此浏览器中的试点'],['Funciona aquí, sin cuentas de usuario ni garantías comerciales.','Works here, without user accounts or commercial guarantees.','可在此使用，没有用户账户或商业保证。']],
    simulation:[['Simulación','Simulation','模拟'],['Demostración del proceso: no hay IA real ni resultado entregable.','A demonstration of the process: no real AI and no deliverable result.','流程演示：没有真实 AI，也没有可交付结果。']],
    preparation:[['En preparación','In preparation','准备中'],['Todavía no se puede usar.','It cannot be used yet.','暂时无法使用。']]};
   const OPEN={'render-band':[tx('Abrir Entregar · Vistas del proyecto','Open Deliver · Project views','打开交付 · 项目视图'),()=>!!window.FloorPlanProfessionalUI,()=>goArea('deliver')],
    assistant:[tx('Abrir el Asistente','Open the Assistant','打开助手'),()=>!!window.RubikAssistantUI,()=>{closeWelcome();window.RubikAssistantUI.open();}],
    catalogs:[tx('Abrir Mis catálogos','Open My catalogues','打开我的目录'),()=>!!(window.RubikCatalogUI&&window.FloorPlanProfessionalUI),()=>{goArea('studio');window.RubikCatalogUI.open();}],
    'area:budget':[tx('Abrir Presupuestar','Open Budget','打开预算'),()=>!!(window.FloorPlanBudgetUI&&window.FloorPlanProfessionalUI),()=>{goArea('budget');window.FloorPlanBudgetUI.open();}],
    'visual-studio':[tx('Ver la simulación','See the simulation','查看模拟'),()=>!!(window.RubikVisualStudio&&window.FloorPlanProfessionalUI),()=>{goArea('deliver');window.RubikVisualStudio.open();}],
    'photo-reform':[tx('Ver la simulación','See the simulation','查看模拟'),()=>!!(window.RubikPhotoReform&&window.FloorPlanProfessionalUI),()=>{goArea('deliver');window.RubikPhotoReform.open();}]};
   const prio=MPRIO[audience]||[],order=[...prio.map(id=>all.find(x=>x.id===id)).filter(Boolean),...CAPS.AI_GROUPS.flatMap(g=>all.filter(x=>x.state===g&&!prio.includes(x.id)))];
   const ul=el('ul',undefined,services,'ai-service-list welcome-modules-grid');ul.setAttribute('aria-labelledby',head.id);
   for(const s of order){const li=el('li',undefined,ul,'ai-service');li.dataset.service=s.id;li.dataset.state=s.state;const top=prio.includes(s.id);li.classList.toggle('is-featured',top);
     const meta=el('p',undefined,li,'ai-service-meta');el('span',label(GROUP[s.state][0]),meta,'capability-state').dataset.state=s.state;if(top)el('span',tx('Para ','For ','适合 ')+label(who[1]),meta,'ai-service-for');
     el('h4',label(s.name),li);el('p',label(s.what),li,'ai-service-what');const more=el('details',undefined,li,'ai-service-more');el('summary',tx('Qué no es y condiciones','What it is not and conditions','不是什么及条件'),more);el('p',label(s.isNot),more,'ai-service-not');el('p',label(s.limits),more,'ai-service-limits');
     const o=s.state!=='preparation'&&OPEN[s.access];
     if(o&&o[1]()){const b=btn('welcomeAI-'+s.id,o[0],()=>safe(o[2]),li);b.classList.add('ai-service-go');}
     else el('p',s.state==='preparation'?label(GROUP.preparation[1]):tx('Se abre cuando termina de cargar la página.','It opens once the page has finished loading.','页面加载完成后即可打开。'),li,'ai-service-unavailable');}
   el('p',tx('Las simulaciones no llaman a ningún proveedor de IA y nunca se entregan como imagen real.','Simulations call no AI provider and are never delivered as a real image.','模拟不调用任何 AI 服务商，也绝不会作为真实图片交付。'),services,'capability-note');}
  // The services' modules load after this script: their buttons appear once the page has finished loading.
  renderServices();if(document.readyState!=='complete')addEventListener('load',()=>{if(services.isConnected)renderServices();},{once:true});
  // Line icons (24×24, stroke = currentColor) for the walk band, the phases and the field cards.
  const ICON={upload:'<path d="M12 16V4M7 9l5-5 5 5M4 16v4h16v-4"/>',ruler:'<path d="M3 17 17 3l4 4L7 21z"/><path d="m7 13 2 2m1-5 2 2m1-5 2 2"/>',plan:'<path d="M3 4h18v16H3z"/><path d="M3 12h8v8M11 4v5m4 3h6"/>',sofa:'<path d="M5 11V8a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v3"/><path d="M3 13a2 2 0 0 1 4 0v2h10v-2a2 2 0 0 1 4 0v5H3z"/><path d="M6 18v2m12-2v2"/>',cube:'<path d="m12 3 8 4.5v9L12 21l-8-4.5v-9z"/><path d="M12 12 4 7.5M12 12l8-4.5M12 12v9"/>',walk:'<circle cx="13" cy="4" r="2"/><path d="m9 21 3-7 3 3v4m-6-9 3-3 3 2 3 1M8 12l1-4"/>',compass:'<path d="M12 3 7 21m5-18 5 18M8 16h8"/><circle cx="12" cy="3" r="1"/>',key:'<circle cx="8" cy="15" r="4"/><path d="m11 12 9-9m-4 4 3 3m-6 0 2 2"/>',building:'<path d="M4 21V5l8-3v19M12 9h8v12M7 8h2m-2 4h2m-2 4h2m6-3h2m-2 4h2M2 21h20"/>',hammer:'<path d="m14 6 4 4M3 21l9-9M12 5l3-3 7 7-3 3z"/>',palette:'<path d="M12 3a9 9 0 1 0 0 18c1 0 2-1 1.5-2s.5-2 1.5-2h2a4 4 0 0 0 4-4c0-5.5-4-10-9-10z"/><circle cx="7.5" cy="11" r="1"/><circle cx="10.5" cy="7.5" r="1"/><circle cx="15" cy="8" r="1"/>'};
  const icon=(name,parent,cls='icon')=>{const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg');svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('aria-hidden','true');svg.setAttribute('class',cls);SafeDOM.markup(svg,ICON[name]);parent.append(svg);return svg;};
  // «Recórrela en 3D»: what makes Rubik different, shown with the real capture; the button opens the example in 3D walk.
  const walkBand=el('section',undefined,shell,'welcome-walk');walkBand.id='welcomeWalk';
  const walkText=el('div',undefined,walkBand,'welcome-walk-text');icon('walk',walkText,'icon welcome-walk-icon');
  el('h2',tx('Crea tu vivienda o la de tu cliente, y recórrela en 3D','Create your home or your client’s, and walk through it in 3D','创建你或客户的住宅，并在 3D 中漫游'),walkText);
  el('p',tx('La misma distribución que dibujas se convierte en una vivienda que puedes recorrer por dentro, estancia a estancia, en el ordenador o en el móvil.','The layout you draw becomes a home you can walk through, room by room, on a computer or a phone.','你绘制的布局会变成可以逐个房间漫游的住宅，电脑和手机均可。'),walkText);
  btn('welcomeWalkExample',tx('Recorrer el ejemplo en 3D','Walk through the example in 3D','在 3D 中漫游示例'),()=>safe(walkExample),walkText,true);
  const walkShot=el('img',undefined,walkBand,'welcome-walk-shot');walkShot.src='assets/welcome/example-3d.webp';walkShot.loading='lazy';walkShot.alt=tx('Captura real de Rubik del ejemplo en 3D','Real Rubik capture of the example in 3D','Rubik 示例 3D 实际截图');
  // «Soluciones»: a reading path — phases first, then one compact card per field that opens on hover (mouse),
  // tap or keyboard. Only features that exist today.
  // H-C1: las soluciones viven junto a la profesión que las ordena (dentro de «¿En qué trabajas?»).
  const sol=el('section',undefined,audienceSection,'welcome-solutions');sol.id='welcomeSolutions';
  el('h2',tx('Cómo trabajas con Rubik','How you work with Rubik','如何使用 Rubik'),sol);
  // UX-312 #321 (corrección 3): la guía y las soluciones forman un bloque, en la misma fila en escritorio. Al elegir
  // profesión, la guía muestra su recorrido (pasos, acción real y resultado) y la solución de su oficio.
  const workRow=el('div',undefined,sol,'welcome-work-row'),guideCol=el('div',undefined,workRow,'welcome-work-guide'),solCol=el('div',undefined,workRow,'welcome-work-solutions');
  const guideHead=el('h3',tx('Guía de trabajo','Working guide','工作指南'),guideCol,'solutions-title');guideHead.id='welcomeGuideTitle';
  const guideLead=el('p','',guideCol,'welcome-work-lead');guideLead.setAttribute('aria-live','polite');
  const phases=el('ol',undefined,guideCol,'solutions-phases');phases.setAttribute('aria-label',tx('Fases del proyecto','Project phases','项目阶段'));
  for(const [stage,ic,what] of [[G.stages[0],'upload',['Sube el plano o empieza desde cero','Upload the plan or start from scratch','上传平面图或从零开始']],[G.stages[1],'ruler',['Comprueba la escala con una medida conocida','Check the scale with a known length','用已知尺寸核对比例']],[G.stages[2],'plan',['Estancias, puertas y ventanas; una o dos plantas','Rooms, doors and windows; one or two levels','房间、门窗；一层或两层']],[G.stages[3],'sofa',['Muebles y acabados','Furniture and finishes','家具和饰面']],[G.stages[4],'cube',['Recorre en 3D, presenta y entrega','Walk in 3D, present and deliver','3D 漫游、展示并交付']]]){const li=el('li',undefined,phases);icon(ic,li,'icon phase-icon');el('strong',label(stage),li);el('span',label(what),li);}
  const deliver={evolution:['Vídeo y presentación de la evolución de obra prevista','Video and presentation of the planned works evolution','计划施工进展的视频和展示'],sheet:['Lámina de distribución con tu marca','Floor plan sheet with your brand','带品牌的平面图纸'],batch:['Lote ZIP con vistas 3D y el proyecto editable','ZIP with 3D views and the editable project','含 3D 视图和可编辑项目的 ZIP'],present:['Presentación 3D guiada por estancias','Guided 3D presentation by room','按房间引导的 3D 展示'],walk:['Recorrido 3D por dentro de la vivienda','3D walk-through inside the home','住宅内部 3D 漫游'],project:['Proyecto editable para seguir trabajando','Editable project to keep working','可继续编辑的项目']};
  el('h3',tx('Soluciones según tu trabajo','Solutions for your work','按工作类型的解决方案'),solCol,'solutions-title');
  // Con una profesión elegida se ve primero la suya; «Ver todas las soluciones» muestra las seis sin cambiar la elección.
  const allSol=btn('welcomeSolutionsAll',tx('Ver todas las soluciones','See all solutions','查看全部解决方案'),()=>{sol.dataset.all=sol.dataset.all==='true'?'false':'true';allSol.setAttribute('aria-expanded',String(sol.dataset.all==='true'));allSol.textContent=sol.dataset.all==='true'?tx('Ver solo mi profesión','Show only my field','只看我的职业'):tx('Ver todas las soluciones','See all solutions','查看全部解决方案');},solCol);allSol.classList.add('guide-link');allSol.setAttribute('aria-controls','welcomeSolutionsCards');
  const cards=el('div',undefined,solCol,'solutions-cards');cards.id='welcomeSolutionsCards';
  const fields=[
   ['architecture','compass',['Del plano del estudio a una propuesta que el cliente entiende','From the studio plan to a proposal the client understands','从事务所平面图到客户能看懂的方案'],['sheet','present','project']],
   ['real-estate','key',['Que el comprador recorra el inmueble antes de visitarlo','Let the buyer walk through the property before visiting','让买家在看房前先浏览房源'],['walk','present','batch']],
   ['developer','building',['Cada tipología, también de dos plantas, con tu imagen de marca','Each unit type, two-storey ones included, with your brand','每种户型（含两层）统一品牌形象'],['batch','present','sheet']],
   ['renovation','hammer',['La propuesta de reforma sobre el plano actual','The renovation proposal on the current plan','在现有平面图上的改造方案'],['walk','sheet','project']],
   ['interior','palette',['Ambientes amueblados y sus acabados, para recorrer','Furnished rooms and finishes, to walk through','可漫游的带家具空间及饰面'],['walk','present','batch']],
   ['construction','plan',['La obra prevista, del presupuesto al plan y a su evolución en 3D','The planned works, from budget to plan and its 3D evolution','计划中的施工：从预算到计划及其 3D 进展'],['evolution','project','sheet']]
  ];
  for(const [id,ic,problem,gives] of fields){const card=el('article',undefined,cards,'solutions-card');card.dataset.audience=id;
   const head=el('button',undefined,card,'solutions-head');head.type='button';head.setAttribute('aria-expanded','false');const body=el('div',undefined,card,'solutions-body');body.id='solutionsBody-'+id;head.setAttribute('aria-controls',body.id);
   icon(ic,head,'icon card-icon');const t=el('span',undefined,head,'solutions-head-text');el('strong',label(audiences.find(a=>a[0]===id)[1]),t);el('span',label(problem),t);
   const inner=el('div',undefined,body,'solutions-inner');el('p',tx('Entregas a tu cliente','What your client receives','客户收到'),inner,'solutions-label');const ul=el('ul',undefined,inner);for(const g of gives)el('li',label(deliver[g]),ul);
   // One state for what is seen and what is announced: open = pinned (click, tap, keyboard) or mouse over it.
   let pinned=false,hovered=false;const sync=()=>{const open=pinned||hovered;head.setAttribute('aria-expanded',String(open));card.classList.toggle('open',open);};
   card._pin=v=>{pinned=v;sync();};
   head.onclick=()=>{pinned=!(pinned||hovered);hovered=false;sync();};
   card.addEventListener('pointerenter',e=>{if(e.pointerType==='mouse'){hovered=true;sync();}});card.addEventListener('pointerleave',e=>{if(e.pointerType==='mouse'){hovered=false;sync();}});}
  el('p',tx('Todo lo que aparece aquí ya funciona en Rubik. Medidas orientativas: no sustituye una medición profesional.','Everything listed here already works in Rubik. Dimensions are indicative, not a professional survey.','此处所列功能均已在 Rubik 中可用。尺寸仅供参考，不能替代专业测量。'),solCol,'solutions-note');
  // Recorrido por profesión: cada paso dice qué obtienes y abre su destino real.
  const PATH={
   architecture:[[['Sube y calibra el plano','Upload and calibrate the plan','上传并校准平面图'],['PDF, imagen, DXF o IFC, a escala.','PDF, image, DXF or IFC, to scale.','PDF、图片、DXF 或 IFC，按比例。'],()=>document.getElementById('welcomeUpload').click()],[['Distribuye y revisa','Lay out and review','布局并审核'],['Estancias, huecos y superficies.','Rooms, openings and areas.','房间、门窗与面积。'],()=>document.getElementById('welcomeExample').click()],[['Analiza el emplazamiento','Analyse the site','分析场地'],['Orientación, sol y entorno.','Orientation, sun and surroundings.','朝向、日照与环境。'],()=>safe(()=>exampleThen('analyze'))],[['Lámina y ficha','Sheet and area schedule','图纸与面积表'],['Documentación con tu firma (D2, D1).','Documentation with your signature (D2, D1).','带署名的文档（D2、D1）。'],()=>openDeliver('D2')],[['Revisa con el cliente','Review with the client','与客户审核'],['Sus observaciones vuelven al proyecto (S2).','Their comments come back to the project (S2).','客户意见回到项目（S2）。'],()=>openDeliver('S2')]],
   'real-estate':[[['Sube el plano del inmueble','Upload the property plan','上传房源平面图'],['Con su escala comprobada.','With its scale checked.','核对比例。'],()=>document.getElementById('welcomeUpload').click()],[['Amuebla la vivienda','Furnish the home','布置家具'],['Ambientes listos para enseñar.','Rooms ready to show.','可展示的空间。'],()=>document.getElementById('welcomeExample').click()],[['Visita 3D','3D visit','3D 参观'],['El comprador la recorre por dentro.','The buyer walks through it.','买家在室内漫游。'],()=>safe(walkExample)],[['Imágenes','Images','图像'],['Vistas reales y Render IA orientativo (P2).','Real views and indicative AI render (P2).','真实视图与参考 AI 渲染（P2）。'],()=>openDeliver('P2')],[['Enlace o archivo','Link or file','链接或文件'],['Para el comprador, con tu consentimiento (P7).','For the buyer, with your consent (P7).','经你同意交给买家（P7）。'],()=>openDeliver('P7')]],
   developer:[[['Tipologías y plantas','Unit types and levels','户型与楼层'],['También de dos plantas.','Two-storey ones too.','包括两层。'],()=>document.getElementById('welcomeExample').click()],[['Tu identidad','Your identity','你的品牌'],['Logo y firma en Mi estudio.','Logo and signature in My studio.','在我的事务所设置标志与签名。'],()=>goArea('studio')],[['Presentación 3D','3D presentation','3D 展示'],['Recorrido guiado por estancias (P1).','Guided tour by room (P1).','按房间引导（P1）。'],()=>openDeliver('P1')],[['Dossier','Dossier','档案'],['Vistas, lámina y superficies (D3).','Views, sheet and areas (D3).','视图、图纸与面积（D3）。'],()=>openDeliver('D3')],[['Cierre con tu firma','Closing with your signature','带署名的收尾'],['HERO FINAL personalizado (P6).','Personalised HERO FINAL (P6).','个性化 HERO FINAL（P6）。'],()=>openDeliver('P6')]],
   renovation:[[['Plano actual','Current plan','现状平面图'],['Súbelo y calíbralo.','Upload and calibrate it.','上传并校准。'],()=>document.getElementById('welcomeUpload').click()],[['Alternativas','Alternatives','方案'],['Una variante sin tocar el original.','A variant without touching the original.','不改动原方案的变体。'],()=>{closeWelcome();document.getElementById('projectsBtn')?.click();}],[['Mediciones y presupuesto','Quantities and budget','工程量与预算'],['Partidas medidas; precios que revisas tú.','Measured items; prices you review.','已计量条目，价格由你审核。'],()=>safe(()=>exampleThen('budget'))],[['Compara','Compare','比较'],['Original frente a variante (T2).','Original against variant (T2).','原方案与变体（T2）。'],()=>openDeliver('T2')],[['Presenta la reforma','Present the renovation','展示改造'],['En 3D, por estancias (P1).','In 3D, by room (P1).','按房间 3D 展示（P1）。'],()=>openDeliver('P1')]],
   interior:[[['Amuebla y elige acabados','Furnish and choose finishes','布置家具与饰面'],['Materiales y mobiliario reales.','Real materials and furniture.','真实材料与家具。'],()=>document.getElementById('welcomeExample').click()],[['Material board','Material board','材料板'],['Acabados y mobiliario en una imagen (P5).','Finishes and furniture in one image (P5).','饰面与家具汇总（P5）。'],()=>openDeliver('P5')],[['Imágenes','Images','图像'],['Vistas y Render IA orientativo (P2).','Views and indicative AI render (P2).','视图与参考 AI 渲染（P2）。'],()=>openDeliver('P2')],[['Presentación','Presentation','展示'],['Cada ambiente, guiado (P1).','Each room, guided (P1).','逐个空间引导（P1）。'],()=>openDeliver('P1')],[['Visita 3D','3D visit','3D 参观'],['Tu cliente recorre el proyecto.','Your client walks through it.','客户漫游项目。'],()=>safe(walkExample)]],
   construction:[[['Mediciones y presupuesto','Quantities and budget','工程量与预算'],['Partidas medidas sobre el proyecto (S1).','Items measured on the project (S1).','基于项目计量的条目（S1）。'],()=>safe(()=>exampleThen('budget'))],[['Plan de obra','Works plan','施工计划'],['Tareas, fechas y dependencias.','Tasks, dates and dependencies.','任务、日期与依赖。'],()=>safe(()=>exampleThen('budget',()=>window.FloorPlanConstructionPlanUI?.open?.()))],[['Gantt','Gantt','甘特图'],['La obra, día a día.','The works, day by day.','逐日施工。'],()=>safe(()=>exampleThen('budget',()=>window.FloorPlanConstructionPlanUI?.open?.()))],[['Obra prevista en 3D','Planned works in 3D','3D 计划施工'],['La vivienda se construye según el plan. Datos de ejemplo.','The home is built following the plan. Example data.','住宅按计划建造。示例数据。'],()=>{location.href='evolucion/?demo=obra';}],[['Entrega de obra','Works handover','施工交付'],['Vídeo MP4 y presentación HTML (P4).','MP4 video and HTML presentation (P4).','MP4 视频与 HTML 演示（P4）。'],()=>openDeliver('P4')]]};
  const pathList=el('ol',undefined,guideCol,'welcome-work-path');pathList.hidden=true;
  function renderPath(){const steps=PATH[audience],who=audiences.find(x=>x[0]===audience);phases.hidden=!!steps;pathList.hidden=!steps;pathList.replaceChildren();
   guideLead.textContent=steps?tx('Recorrido para ','Path for ','路径：')+label(who[1])+' · '+tx('cada paso abre su destino real.','each step opens its real destination.','每一步都打开真实位置。'):tx('Las fases de cualquier proyecto. Elige tu profesión para ver tu recorrido.','The phases of any project. Choose your profession to see your path.','任何项目的阶段。选择你的职业以查看你的路径。');
   if(!steps)return;sol.classList.remove('is-changing');void sol.offsetWidth;sol.classList.add('is-changing');
   steps.forEach(([t,d,fn],i)=>{const li=el('li',undefined,pathList,'welcome-work-step');el('span',String(i+1),li,'welcome-work-num').setAttribute('aria-hidden','true');const b=el('div',undefined,li);el('strong',label(t),b);el('p',label(d),b);const go=btn('welcomePath-'+(i+1),tx('Abrir','Open','打开'),()=>fn(),li);go.classList.add('guide-link');go.setAttribute('aria-label',tx('Abrir: ','Open: ','打开：')+label(t));});}
  const markSolution=()=>{renderPath();for(const c of cards.children)c.classList.toggle('chosen',c.dataset.audience===audience);sol.dataset.focus=audience?'true':'false';allSol.hidden=!audience;if(audience){const c=cards.querySelector(`[data-audience="${audience}"]`);cards.prepend(c);c._pin(true);}};
  sol.dataset.all='false';allSol.setAttribute('aria-expanded','false');sol.after(services);
  // UX-312 Home · «Qué recibe tu cliente»: las 16 rutas indexadas de Entregar (D1–D5, P1–P7, S1–S2, T1–T2) con su
  // miniatura real, formato, requisitos y firma; la acción abre Entregar en esa tarjeta del proyecto activo. D5 abre E3,
  // cuyos 10 destinos se listan aparte (inventarios que se solapan). T1 y T2 son herramientas de trabajo, no entregas.
  const DW='assets/welcome/entregas/',DS='assets/studio/';
  const DELIV=[
   ['D1','docs',DW+'D1.webp',['Ficha de superficies','Area schedule','面积明细'],['Superficies útiles por estancia y total.','Usable area per room and in total.','各房间及总使用面积。'],'PDF',['Un proyecto con estancias.','A project with rooms.','有房间的项目。'],true],
   ['D2','docs','assets/welcome/caso-plano.webp',['Lámina profesional','Professional sheet','专业图纸'],['Plano a escala o ajustado a la hoja, con cajetín.','Plan to scale or fitted to the sheet, with title block.','按比例或适配图幅的平面图，带图签。'],'SVG',['Un proyecto con estancias.','A project with rooms.','有房间的项目。'],true],
   ['D3','docs',DW+'D3.webp',['Dossier del proyecto','Project dossier','项目档案'],['Vistas, lámina, superficies y orientación en un documento.','Views, sheet, areas and orientation in one document.','视图、图纸、面积与朝向合成一份文件。'],'PDF',['Las secciones se completan con lo que el proyecto ya tiene.','Sections fill in with what the project already has.','各章节按项目已有内容填写。'],true],
   ['D4','docs',DW+'D4.webp',['Dossier económico','Budget dossier','经济档案'],['El presupuesto en versión profesional o para el cliente.','The budget in a professional or a client version.','专业版或客户版预算。'],'PDF',['Un presupuesto preparado en Presupuestar.','A budget prepared in Budget.','已在预算中准备好的预算。'],true],
   ['P1','show',DW+'P1.webp',['Presentación 3D','3D presentation','3D 展示'],['Recorrido guiado por estancias; desde ella se graba el vídeo del recorrido.','Guided tour by room; the tour video is recorded from it.','按房间引导的漫游；可从中录制漫游视频。'],'3D · WebM/MP4',['El vídeo se graba en el formato que admite el navegador.','The video is recorded in the format the browser supports.','视频以浏览器支持的格式录制。'],true],
   ['P2','show',DW+'P2.webp',['Imágenes','Images','图像'],['Plano 2D, vistas 3D y exterior; también las 5 vistas del proyecto.','2D plan, 3D and exterior views; also the 5 project views.','2D 平面、3D 与外观视图；以及项目 5 张视图。'],'PNG',['Render IA: código de acceso del estudio y créditos de IA.','AI render: studio access code and AI credits.','AI 渲染：需要事务所访问码和 AI 额度。'],true],
   ['P5','show',DW+'P5.webp',['Material board','Material board','材料板'],['Acabados y mobiliario del proyecto en una imagen.','The project’s finishes and furniture in one image.','项目饰面与家具汇总为一张图。'],'PNG',['Acabados asignados en el proyecto.','Finishes assigned in the project.','项目中已指定饰面。'],true],
   ['P6','show',DS+'studio-04-hero-ejemplo.jpg',['Personalización HERO FINAL','HERO FINAL personalisation','HERO FINAL 个性化'],['El cierre de tus presentaciones con tu identidad.','The closing of your presentations with your identity.','以你的品牌形象收尾演示。'],'3D',['Se elige en Mi estudio.','Chosen in My studio.','在我的事务所中选择。'],true],
   ['P3','client',DS+'studio-05-recorrer-ejemplo.jpg',['Visita 3D interactiva','Interactive 3D visit','交互式 3D 参观'],['Recorrido libre y plano de estancias desde el punto de vista del cliente.','Free walk and room map from the client’s point of view.','从客户视角自由漫游并查看房间平面。'],'3D',['Prueba privada: no publica ningún enlace.','Private preview: it publishes no link.','私密预览：不会发布任何链接。'],false],
   ['P7','client','assets/welcome/caso-entrega.webp',['Archivo o enlace para tu cliente','File or link for your client','客户文件或链接'],['Archivo HTML sin conexión con vistas, lámina y observaciones; el vídeo y la visita 3D van en el enlace publicado.','Offline HTML file with views, sheet and comments; the video and 3D visit go in the published link.','离线 HTML 文件，含视图、图纸和意见；视频和 3D 参观在发布的链接中。'],'HTML · URL',['El enlace exige tu consentimiento y su código; es revocable.','The link needs your consent and its code; it can be revoked.','链接需要你的同意和代码，可撤销。'],true],
   ['S2','client',DW+'S2.webp',['Observaciones del cliente','Client comments','客户意见'],['Las notas que el cliente deja en su archivo vuelven a tu proyecto.','Notes the client leaves in their file come back to your project.','客户在文件中留下的意见会回到你的项目。'],'JSON',['Un archivo de observaciones del cliente.','A client comments file.','客户意见文件。'],false],
   ['S1','works','assets/welcome/caso-presupuesto.webp',['Mediciones y presupuesto','Quantities and budget','工程量与预算'],['Partidas medidas sobre el proyecto; los precios los revisas tú.','Items measured on the project; you review the prices.','基于项目计量的条目；价格由你审核。'],'PDF · CSV',['Medidas orientativas: no sustituyen una medición profesional.','Indicative measurements, not a professional survey.','尺寸仅供参考，不能替代专业测量。'],true],
   ['P4','works','assets/welcome/demo-evolucion-4d.webp',['Evolución de obra','Construction evolution','施工进展'],['Vídeo MP4 y presentación HTML de la obra prevista, desde el plan y el presupuesto.','MP4 video and HTML presentation of the planned works, from the plan and budget.','基于计划和预算的计划施工 MP4 视频与 HTML 演示。'],'MP4 · HTML',['Un plan de obra. Es la obra prevista, no su seguimiento real.','A works plan. It is the planned works, not real tracking.','需要施工计划。这是计划施工，不是实际跟踪。'],true],
   ['D5','tools',DW+'D5.webp',['Entregables profesionales','Professional deliverables','专业交付物'],['Elige, previsualiza y prepara varias salidas a la vez, limpias o con tu firma.','Choose, preview and prepare several outputs at once, clean or signed.','一次选择、预览并准备多个输出，可不署名或带署名。'],'PNG · PDF · ZIP · HTML',['Cada salida usa su propio generador y sus condiciones.','Each output uses its own generator and conditions.','每个输出使用其自己的生成器与条件。'],true],
   ['T1','tools','assets/e3/op10-entrega-viewer.jpg',['Escena para Blender','Scene for Blender','Blender 场景'],['Paquete técnico ZIP/GLB para render local; nunca lleva marca.','Technical ZIP/GLB package for local rendering; never branded.','用于本地渲染的 ZIP/GLB 技术包；从不带标识。'],'ZIP · GLB',['Herramienta de trabajo: no es una entrega al cliente.','A working tool, not a client deliverable.','工作工具，不是客户交付物。'],false],
   ['T2','tools',DW+'T2.webp',['Comparar con el original','Compare with the original','与原始方案比较'],['Diferencias entre una variante y su original.','Differences between a variant and its original.','变体与原始方案的差异。'],'—',['Una variante creada en Proyectos.','A variant created in Projects.','在项目中创建的变体。'],false]];
  const DGROUPS=[['docs',['Documentación','Documentation','文档']],['show',['Imagen y presentación','Images and presentation','图像与展示']],['client',['Para tu cliente','For your client','给客户']],['works',['Mediciones, presupuesto y obra','Quantities, budget and works','工程量、预算与施工']],['tools',['Preparar en lote y herramientas de trabajo','Batch preparation and working tools','批量准备与工作工具']]];
  // Prioridad por profesión (encargo del propietario); sin profesión, el recorrido neutro del caso.
  const DPRIO={architecture:['D2','D1','D3','S2','T2'],'real-estate':['P3','P7','P1','P2','P5'],developer:['P6','D3','P1','P2','D2'],renovation:['T2','S1','D1','D4','P1'],interior:['P5','P2','P1','P3','P7'],construction:['S1','P4','D4','D1','P7'],'':['D2','P1','P3','P7','S1']};
  // Encuentra la tarjeta en Entregar y deja el foco en su acción (retorno al contexto, no a la Home).
  function openDeliver(code){if(!window.FloorPlanProfessionalUI)return toast(tx('Esta área no está disponible en esta página.','This area is not available on this page.','此页面无法使用该区域。'),5000);closeWelcome();FloorPlanProfessionalUI.open('deliver');let n=0;
   const find=()=>{
    const card=document.querySelector(`#professionalWorkspace [data-entrega-code="${code}"]`);
    const action=card&&[...card.querySelectorAll('button:not([disabled]),a[href]')]
     .find(control=>control.checkVisibility({visibilityProperty:true}));
    if(action){
     card.scrollIntoView({block:'center',behavior:'auto'});
     action.focus({preventScroll:true});
     return;
    }
    if(++n<40)setTimeout(find,100);
   };
   setTimeout(find,60);}
  const deliv=el('section',undefined,audienceSection,'welcome-deliverables');deliv.id='welcomeDeliverables';deliv.setAttribute('aria-labelledby','welcomeDeliverablesTitle');
  const dItem=(d,parent,tag='article')=>{const [code,,img,name,what,format,req,signed]=d;const card=el(tag,undefined,parent,'deliverable');card.dataset.entregaCode=code;
   const fig=el('div',undefined,card,'deliverable-thumb');if(img){realImg(fig,img,label(name)+' · '+tx('captura real de RUBIK','real RUBIK capture','RUBIK 真实截图'));}else{fig.classList.add('is-empty');el('span',code,fig);}
   const body=el('div',undefined,card,'deliverable-body');const top=el('p',undefined,body,'deliverable-meta');el('span',code,top,'deliverable-code');el('span',format,top);if(signed)el('span',tx('Limpio o con tu firma','Clean or signed','可不署名或署名'),top);
   el('h4',label(name),body);el('p',label(what),body);el('p',label(req),body,'deliverable-req');
   btn('welcomeDeliver-'+code+(tag==='li'?'-all':''),tx('Abrir en Entregar','Open in Deliver','在交付中打开'),()=>openDeliver(code),body).classList.add('guide-link');return card;};
  function renderDeliverables(){deliv.replaceChildren();
   const head=el('h2','',deliv);head.id='welcomeDeliverablesTitle';head.tabIndex=-1;const who=audiences.find(a=>a[0]===audience);
   head.textContent=who?tx('Qué recibe tu cliente · ','What your client receives · ','客户收到什么 · ')+label(who[1]):tx('Qué recibe tu cliente','What your client receives','客户收到什么');
   el('p',tx('Resultados reales de la vivienda de ejemplo. Cada uno se abre en Entregar, en tu proyecto activo.','Real results from the example home. Each one opens in Deliver, in your active project.','示例住宅的真实成果。每项都在交付中、在你当前的项目里打开。'),deliv,'lead');
   const top=el('div',undefined,deliv,'deliverable-cards');for(const code of DPRIO[audience||'']||DPRIO[''])dItem(DELIV.find(d=>d[0]===code),top);
   // Desplegable accesible (botón con aria-expanded/aria-controls): el catálogo completo se revela a demanda.
   const wrap=el('div',undefined,deliv,'deliverables-all');const sum=btn('welcomeDeliverablesAllToggle',tx('Ver todos los entregables (16)','See all deliverables (16)','查看全部交付物（16）'),()=>{const open=all.hidden;all.hidden=!open;sum.setAttribute('aria-expanded',String(open));wrap.classList.toggle('open',open);},wrap);sum.classList.add('deliverables-all-toggle');
   const all=el('div',undefined,wrap,'deliverables-all-body');all.id='welcomeDeliverablesAll';all.hidden=true;sum.setAttribute('aria-expanded','false');sum.setAttribute('aria-controls',all.id);
   for(const [g,gname] of DGROUPS){const sec=el('section',undefined,all,'deliverables-group');sec.dataset.group=g;el('h3',label(gname),sec);const ul=el('ul',undefined,sec,'deliverables-list');for(const d of DELIV.filter(x=>x[1]===g))dItem(d,ul,'li');
    if(g==='tools'){const e3=window.RubikE3Core?.catalogo?.(LANG==='zh'?'zh':LANG==='en'?'en':'es')||[];if(e3.length){const box=el('div',undefined,sec,'deliverables-e3');box.id='welcomeDeliverablesE3';el('p',tx('D5 · destinos que se preparan juntos ('+e3.length+')','D5 · destinations prepared together ('+e3.length+')','D5 · 可一起准备的目标（'+e3.length+'）'),box,'deliverables-e3-title');const ul2=el('ul',undefined,box);for(const e of e3){const li=el('li',undefined,ul2);li.dataset.e3=e.id;el('strong',e.nombre,li);el('span',' · '+e.formato,li);}}}}
   el('p',tx('La copia editable del proyecto (Proyectos → exportar el JSON) y la escena de Blender son para tu trabajo, no para el cliente.','The editable project copy (Projects → export the JSON) and the Blender scene are for your work, not for the client.','可编辑项目副本（项目 → 导出 JSON）和 Blender 场景用于你的工作，不交给客户。'),all,'capability-note');}
  markSolution();renderDeliverables();if(document.readyState!=='complete')addEventListener('load',()=>{if(deliv.isConnected&&document.getElementById('welcomeDeliverablesAll')?.hidden!==false)renderDeliverables();},{once:true});
  const other=el('section',undefined,shell,'welcome-search');search(other,'welcome',true);
  // UX-312 Home · FAQ: las dudas del encargo, respondidas con las condiciones reales de cada ruta.
  const faq=el('section',undefined,shell,'welcome-faq');faq.id='welcomeFaq';faq.setAttribute('aria-labelledby','welcomeFaqTitle');
  const fh=el('h2',tx('Preguntas frecuentes','Frequently asked questions','常见问题'),faq);fh.id='welcomeFaqTitle';fh.tabIndex=-1;
  const FAQS=[];for(const [id,q,a] of [
   ['start',['¿Cómo empiezo, con plano o sin él?','How do I start, with or without a plan?','有没有平面图，如何开始？'],['Con plano, «Subir un plano». Sin plano, «Crear desde cero» o «Probar la vivienda de ejemplo», que no cambia tus proyectos.','With a plan, «Upload a floor plan». Without one, «Create from scratch» or «Try the example home», which does not change your projects.','有平面图请用“上传平面图”。没有的话，用“从零创建”或“试用示例住宅”，不会改变你的项目。']],
   ['formats',['¿Qué formatos acepta? ¿Y DWG?','Which formats are accepted? And DWG?','支持哪些格式？DWG 呢？'],['PDF, imagen, DXF, IFC, RoomPlan y proyectos JSON/ZIP. DWG no se importa: expórtalo como DXF en tu programa CAD y conserva el original.','PDF, image, DXF, IFC, RoomPlan and JSON/ZIP projects. DWG is not imported: export it as DXF in your CAD application and keep the original.','PDF、图片、DXF、IFC、RoomPlan 以及 JSON/ZIP 项目。不导入 DWG：请在 CAD 软件中导出为 DXF，并保留原件。']],
   ['calibrate',['¿Por qué hay que calibrar?','Why calibrate?','为什么要校准？'],['Una imagen o un PDF no traen la escala. Indica una medida conocida antes de medir o presupuestar.','An image or PDF carries no scale. Enter a known length before measuring or budgeting.','图片或 PDF 不带比例。测量或预算前请输入一个已知长度。']],
   ['images',['¿Hay límites para las imágenes del plano?','Are there limits for plan images?','平面图图片有大小限制吗？'],['Hasta 15 MiB y 8000 px por lado.','Up to 15 MiB and 8000 px per side.','最大 15 MiB，每边 8000 像素。']],
   ['storage',['¿Dónde se guardan mis proyectos?','Where are my projects stored?','项目保存在哪里？'],['En este navegador. En «Proyectos» exportas el JSON como copia de seguridad o para abrirlo en otro equipo.','In this browser. In «Projects» you export the JSON as a backup or to open it on another device.','保存在此浏览器中。在“项目”中导出 JSON 作为备份或在其他设备上打开。']],
   ['indicative',['¿Son exactas las mediciones y la obra prevista?','Are measurements and the planned works exact?','测量和计划施工准确吗？'],['Son orientativas. No sustituyen una medición profesional, y la obra prevista es un plan, no el seguimiento real de la obra.','They are indicative. They do not replace a professional survey, and the planned works are a plan, not real site tracking.','仅供参考。不能替代专业测量；计划施工是计划，不是实际施工跟踪。']],
   ['client',['¿Archivo o enlace para el cliente?','File or link for the client?','给客户发文件还是链接？'],['El archivo HTML se abre sin conexión, con vistas, lámina y observaciones; lo envías tú. El enlace se publica con tu consentimiento y su código, es revocable y lleva el vídeo y la visita 3D.','The HTML file opens offline, with views, sheet and comments; you send it. The link is published with your consent and its code, can be revoked and carries the video and 3D visit.','HTML 文件可离线打开，含视图、图纸和意见，由你发送。链接经你同意并凭代码发布，可撤销，包含视频和 3D 参观。']],
   ['video',['¿Puedo entregar vídeo o una escena para Blender?','Can I deliver a video or a Blender scene?','能交付视频或 Blender 场景吗？'],['El vídeo del recorrido se graba desde la presentación en el formato que admite tu navegador; la Evolución de obra genera MP4. La escena para Blender es un paquete técnico ZIP/GLB para render local, sin marca.','The tour video is recorded from the presentation in the format your browser supports; the construction evolution produces MP4. The Blender scene is a technical ZIP/GLB package for local rendering, unbranded.','漫游视频从演示中录制，格式取决于浏览器；施工进展生成 MP4。Blender 场景是用于本地渲染的 ZIP/GLB 技术包，不带标识。']],
   ['ai',['¿Usa IA? ¿Consume créditos?','Does it use AI? Does it use credits?','使用 AI 吗？消耗额度吗？'],['Render IA necesita el código de acceso de tu estudio y cada imagen consume créditos. El Asistente es una consulta guiada sin modelo de lenguaje. Las simulaciones no llaman a ningún proveedor. Cualquier gasto requiere la autorización expresa del titular.','AI render needs your studio access code and each image uses credits. The Assistant is a guided query without a language model. Simulations call no provider. Any spending needs the owner’s express authorisation.','AI 渲染需要事务所访问码，每张图片消耗额度。助手是不使用语言模型的引导式查询。模拟不调用任何服务商。任何支出都需要所有者明确授权。']],
   ['service',['¿Qué pasa al usar «Envíanos tu plano»?','What happens with «Send us your plan»?','使用“发送平面图”会怎样？'],['RUBIK prepara una solicitud y un ZIP con tus archivos. Tú decides si los envías; no se envía nada por sí solo.','RUBIK prepares a request and a ZIP with your files. You decide whether to send them; nothing is sent by itself.','RUBIK 会准备一份请求和包含你文件的 ZIP。由你决定是否发送，不会自动发送任何内容。']]]){
   FAQS.push([id,q,a]);}
  // UX-312 #321 (corrección 5): entrada compacta por temas. Cada tema es un botón (aria-expanded) que abre y cierra
  // su panel; dentro, sus preguntas en acordeón. Las diez respuestas se conservan.
  const TOPICS=[['empezar',['Empezar','Getting started','开始'],['start','formats','calibrate','images']],['guardar',['Guardado y medidas','Saving and measurements','保存与测量'],['storage','indicative']],['entregar',['Entregar al cliente','Delivering to the client','交付给客户'],['client','video']],['ia',['IA, créditos y envío','AI, credits and sending','AI、额度与发送'],['ai','service']]];
  const tabs=el('div',undefined,faq,'welcome-faq-topics');tabs.setAttribute('role','group');tabs.setAttribute('aria-labelledby',fh.id);
  const panels=[];for(const [tid,tname,ids] of TOPICS){const panel=el('div',undefined,null,'welcome-faq-panel');panels.push(panel);panel.id='welcomeFaqPanel-'+tid;panel.hidden=true;
   const b=btn('welcomeFaqTopic-'+tid,label(tname)+' ('+ids.length+')',()=>{const open=panel.hidden;for(const t of tabs.children){if(t!==b){t.setAttribute('aria-expanded','false');panels.find(x=>x.id===t.getAttribute('aria-controls')).hidden=true;}}panel.hidden=!open;b.setAttribute('aria-expanded',String(open));if(open)panel.querySelector('summary')?.focus({preventScroll:true});},tabs);
   b.classList.add('welcome-faq-topic');b.setAttribute('aria-expanded','false');b.setAttribute('aria-controls',panel.id);
   for(const id of ids){const [,q,a]=FAQS.find(f=>f[0]===id);const d=el('details',undefined,panel,'welcome-faq-item');d.dataset.faq=id;el('summary',label(q),d);el('p',label(a),d);}}
  faq.append(...panels);
  const foot=el('div',undefined,shell,'welcome-foot');el('p',tx('Tus proyectos se guardan en este navegador. Exporta una copia para usarlos en otro dispositivo. Imágenes: hasta 15 MiB y 8000 px por lado.','Projects are stored in this browser. Export a copy for another device. Images: up to 15 MiB and 8000 px per side.','项目保存在此浏览器中。请导出副本以在其他设备上使用。图片最大 15 MiB、每边 8000 像素。'),foot);
  if(ownRecoverable())btn('welcomeContinue',tx('Continuar mi proyecto →','Continue my project →','继续我的项目 →'),()=>{const own=library.all().find(e=>e.id===library.activeId()&&data.entries[e.id]?.kind==='own')||library.all().find(e=>data.entries[e.id]?.kind==='own'||!isReference(e.project));if(own)switchProject(library.open(own.id));closeWelcome();render();},foot);
  // UX-312 Home · footer en cuatro grupos. Cada enlace lleva a un sitio real de la Home o abre un flujo existente.
  const goTo=(node,focus)=>{if(!node)return;node.scrollIntoView({block:'start',behavior:reduced()});const f=focus||node.querySelector('h2');if(f){if(f.tabIndex<0&&!f.matches('button,a,summary'))f.tabIndex=-1;f.focus({preventScroll:true});}};
  const footer=el('footer',undefined,shell,'welcome-footer');footer.id='welcomeFooter';
  const col=(id,title)=>{const c=el('section',undefined,footer,'welcome-footer-group');c.dataset.group=id;const h=el('h2',label(title),c);h.id='welcomeFooter-'+id;c.setAttribute('aria-labelledby',h.id);return el('ul',undefined,c);};
  const link=(ul,id,text,fn)=>{const li=el('li',undefined,ul);btn(id,label(text),fn,li).classList.add('guide-link');};
  {const ul=col('about',['Quiénes somos','About us','关于我们']);el('li',tx('RUBIK SOTA es un proyecto de Juan Manuel Espinosa Galant para llevar un proyecto de vivienda del plano a la entrega al cliente.','RUBIK SOTA is a project by Juan Manuel Espinosa Galant to take a home project from the plan to the client delivery.','RUBIK SOTA 是 Juan Manuel Espinosa Galant 的项目，用于把住宅项目从平面图带到客户交付。'),ul,'welcome-footer-text');
   const li=el('li',undefined,ul);btn('welcomeFooterExample',tx('Probar la vivienda de ejemplo','Try the example home','试用示例住宅'),()=>document.getElementById('welcomeExample').click(),li,true);}
  {const ul=col('product',['Producto y precios','Product and pricing','产品与价格']);
   link(ul,'welcomeFooterTools',['Las herramientas de cada fase','The tools of each phase','各阶段的工具'],()=>goTo(document.querySelector('#welcomeDialog [data-module="studio-vision"]')||document.getElementById('welcomeCapabilities')));
   link(ul,'welcomeFooterDeliverables',['Qué recibe tu cliente','What your client receives','客户收到什么'],goDeliverables);
   link(ul,'welcomeFooterServices',['Módulos y servicios IA','Modules and AI services','模块与 AI 服务'],()=>goTo(services,document.getElementById('welcomeModulesTitle')));
   el('li',tx('Las tarifas y los planes aún no están definidos. Puedes probar la vivienda de ejemplo.','Pricing and plans are not defined yet. You can try the example home.','价格和方案尚未确定。你可以试用示例住宅。'),ul,'welcome-footer-text').id='welcomePricing';}
  {const ul=col('help',['Ayuda y dudas','Help and questions','帮助与疑问']);
   link(ul,'welcomeFooterFaq',['Preguntas frecuentes','Frequently asked questions','常见问题'],()=>goTo(faq,fh));
   link(ul,'welcomeFooterGuide',['Guía de trabajo','Working guide','工作指南'],()=>goTo(document.getElementById('welcomeSolutions')));
   link(ul,'welcomeFooterAssistant',['Abrir el Asistente','Open the Assistant','打开助手'],()=>{if(!window.RubikAssistantUI)return toast(tx('El Asistente todavía se está cargando o no está disponible en esta versión.','The Assistant is still loading or is not available in this version.','助手仍在加载或此版本不可用。'),5000);closeWelcome();window.RubikAssistantUI.open();});
   link(ul,'welcomeFooterService',['Envíanos tu plano','Send us your plan','发送平面图'],()=>window.FloorPlanPlanService?.open());}
  {const ul=col('legal',['Legal y autoría','Legal & authorship','法律与作者']);
   link(ul,'welcomeFooterLegal',['Aviso legal, autoría y licencias','Legal notice, authorship and licences','法律声明、作者与许可'],()=>window.FloorPlanLegal?.open());
   el('li',tx('Los recursos de terceros conservan sus licencias y atribuciones.','Third-party resources keep their own licences and attributions.','第三方资源保留各自的许可和署名。'),ul,'welcome-footer-text');
   // Idiomas con sus códigos (decisión del propietario: ES · EN · ZH); el chino sigue disponible como idioma.
   const li=el('li',undefined,ul,'welcome-footer-langs');li.setAttribute('role','group');li.setAttribute('aria-label',tx('Idioma','Language','语言'));
   for(const [code,name] of [['es','ES'],['en','EN'],['zh','ZH']]){const b=btn('welcomeFooterLang-'+code,name,()=>{if(LANG===code)return;setLang(code);buildWelcome();const f=document.getElementById('welcomeFooterLang-'+code);f?.scrollIntoView({block:'center'});f?.focus({preventScroll:true});},li);b.setAttribute('aria-pressed',String(LANG===code));b.lang=code;}}
 }
 function drawExample(parent){const p=Core.initial(),g=Core.geometry(p),ns='http://www.w3.org/2000/svg',s=document.createElementNS(ns,'svg');s.setAttribute('viewBox',`${g.bounds.x-200} ${g.bounds.y-200} ${g.bounds.w+400} ${g.bounds.h+400}`);s.setAttribute('role','img');s.setAttribute('aria-label',tx('Vista 2D del proyecto de ejemplo','2D view of the example project','示例项目的 2D 视图'));parent.append(s);
  for(const r of g.rooms){const poly=document.createElementNS(ns,'polygon');poly.setAttribute('points',r.poly.map(p=>p.join(',')).join(' '));poly.setAttribute('fill',['#dbd4c0','#e7ded1','#d4dfd8'][g.rooms.indexOf(r)%3]);s.append(poly);}
  for(const w of g.walls){const poly=document.createElementNS(ns,'polygon');poly.setAttribute('points',w.poly.map(p=>p.join(',')).join(' '));poly.setAttribute('fill','#534a3e');s.append(poly);}
  for(const o of p.objects){const rect=document.createElementNS(ns,'rect');for(const [k,v]of Object.entries({x:-o.size.widthMm/2,y:-o.size.depthMm/2,width:o.size.widthMm,height:o.size.depthMm,rx:80,fill:'#f9f5ed',stroke:'#aa977e','stroke-width':15,transform:`translate(${o.position.x} ${o.position.y}) rotate(${o.rotationDeg})`}))rect.setAttribute(k,v);s.append(rect);}
 }
 function beginUpload(){if(window.FloorPlanUpload)FloorPlanUpload.pick();else FloorPlanTraceUI.openImage(true);}
 function captureImport(){return {epoch:navigationEpoch,fromWelcome:welcome.open};}
 function importRouteCurrent(context){return context.epoch===navigationEpoch;}
 function imported(context,origin){const id=library?.activeId()||project.id;data.entries[id]=G.initial(project,'own',project.sourceImages?.length?'image':origin);pendingEntry=null;entryOrigin=null;pendingIds=[];lastResult=null;lastSnapshot='';store();if(context?.fromWelcome&&importRouteCurrent(context)&&welcome.open)closeWelcome();}
 // The example, straight into the 3D walk: the same entry as «Probar el ejemplo», then 3D view and «Recorrer».
 // Abre la vivienda de ejemplo y, cuando el editor está en ella, el área pedida (p. ej. Presupuestar).
 function exampleThen(area,after){example();let n=0;const go=()=>{if(!document.querySelector('#welcomeDialog[open]')&&window.FloorPlanProfessionalUI&&window.FloorPlanApp?.project){FloorPlanProfessionalUI.open(area);if(after)setTimeout(after,400);return;}if(++n<40)setTimeout(go,150);};setTimeout(go,300);}
 function walkExample(){example();let tries=0,walked=false;addEventListener('floorplan-view-ready',()=>{if(walked)return;walked=true;document.querySelector('#modes3d [data-mode="walk"]')?.click();},{once:true});
  // The example opens asynchronously (library switch); ask for 3D until the editor is on it.
  const go=()=>{if(walked||window.FloorPlanApp?.viewMode==='3d'||++tries>60)return;if(!document.querySelector('#welcomeDialog[open]'))document.querySelector('[data-view="3d"]')?.click();setTimeout(go,400);};setTimeout(go,300);}
 // «Probar el ejemplo» reopens an unchanged example instead of adding another entry with the same name; its guide
 // starts again from the beginning. A changed example is never overwritten: the original then opens as a separate,
 // differently named entry and the person is told where the changed one is.
 function example(){if(!library)throw Error('Colección local no disponible');closeWelcome();
  const examples=library.all().filter(e=>e.kind!=='building'&&e.project&&data.entries[e.id]?.kind==='example'),pristine=examples.find(e=>isReference(e.project));
  entryOrigin='example';
  // An unchanged entry is the example under any name (the starting «Proyecto inicial» is one): it opens named as such.
  if(pristine){const title=tx('Proyecto de ejemplo','Example project','示例项目');if(pristine.name!==title)library.rename(pristine.id,title);delete data.entries[pristine.id];store();switchProject(library.open(pristine.id));setView('2d');return;}
  const changed=examples.length>0;pendingEntry={kind:'example',goal:'review'};pendingIds=library.list().map(e=>e.id);
  const p=Core.initial();p.id=Core.id('prj');p.name=changed?tx('Proyecto de ejemplo (original)','Example project (original)','示例项目（原始）'):tx('Proyecto de ejemplo','Example project','示例项目');switchProject(library.add(p,p.name));setView('2d');
  if(changed)announce(tx('Abierto el ejemplo original. El ejemplo que cambiaste sigue en «Proyectos».','The original example is open. The example you changed is still in “Projects”.','已打开原始示例。你修改过的示例仍在“项目”中。'));}
 function copyExample(goal='save3d'){try{if(!save())return;const p=Core.clone(project);p.id=Core.id('prj');p.name=tx('Mi distribución','My layout','我的布局');pendingEntry={kind:'own',goal,targetType:state().targetType,targetRoomId:state().targetRoomId};pendingIds=library.list().map(e=>e.id);entryOrigin='example-copy';switchProject(library.add(p,p.name));announce(tx('Copia propia creada. El ejemplo se conserva.','Your copy was created. The example is preserved.','已创建自己的副本。示例已保留。'));if(afterCopy){const action=afterCopy;afterCopy=null;safe(()=>execute(action));}}catch(e){toast(e.message,6000);}}
 function announce(text){announcement.textContent=text;toast(text,4000);}
 function safe(fn){try{const promise=fn();promise?.catch(e=>announce(e.message));}catch(e){announce(e.message);}}
 function search(parent,prefix,inline=false){
  const box=el('section',undefined,parent,'action-search'),lbl=el('label',tx('Escribe lo que necesitas','Describe what you need','描述你的需求'),box),input=el('input',undefined,box);input.id=prefix+'ActionInput';lbl.htmlFor=input.id;input.type='search';input.autocomplete='off';input.placeholder=tx('Por ejemplo: «poner una cama»','For example: “place a bed”','例如：放一张床');input.setAttribute('role','combobox');input.setAttribute('aria-autocomplete','list');input.setAttribute('aria-expanded','false');
  const examples=el('div',undefined,box,'search-examples');for(const text of [tx('Subir mi plano','Upload my plan','上传平面图'),tx('Poner una cama','Place a bed','放一张床'),tx('¿Qué me falta?','What is left?','还有什么？')]){const b=el('button',text,examples);b.type='button';b.onclick=()=>{input.value=text;update();input.focus();};}
  const feedback=el('p',undefined,box,'search-feedback');feedback.id=prefix+'SearchFeedback';feedback.setAttribute('role','status');input.setAttribute('aria-describedby',feedback.id);
  const results=el('div',undefined,box,'action-results');results.id=prefix+'ActionResults';results.setAttribute('role','listbox');results.setAttribute('aria-label',tx('Acciones disponibles','Available actions','可用操作'));input.setAttribute('aria-controls',results.id);
  let rows=[],index=-1;
  function choose(i){const a=rows[i];if(!a)return;if(!inline)actionDialog.close();safe(()=>execute(a,inline));}
  function selection(i){index=i;for(const [n,b]of [...results.children].entries())b.setAttribute('aria-selected',String(n===i));if(index>=0){input.setAttribute('aria-activedescendant',prefix+'Result'+index);results.children[index]?.scrollIntoView({block:'nearest'});}else input.removeAttribute('aria-activedescendant');}
  function update(){rows=inline&&!input.value.trim()?[]:G.resolve(input.value).filter(offered);index=-1;results.replaceChildren();input.removeAttribute('aria-activedescendant');input.setAttribute('aria-expanded',String(rows.length>0));feedback.textContent=rows.some(a=>a.ambiguous)?tx('¿Qué quieres cambiar? Elige una opción.','What would you like to change? Choose an option.','想更改什么？请选择。'):!rows.length&&input.value?tx('Sin coincidencias. Prueba: subir plano, cama, escala, 3D, guardar o qué me falta.','No matches. Try: upload plan, bed, scale, 3D, save or what is left.','无匹配。请尝试上传平面图、家具、比例、3D 或保存。'):rows.length?tx(`${rows.length} acciones disponibles. Usa ↑ ↓ y Enter.`,`${rows.length} actions available. Use ↑ ↓ and Enter.`,`${rows.length} 个可用操作。使用方向键和回车。`):'';
   for(const [i,a]of rows.entries()){const b=el('button',undefined,results,'action-result');b.type='button';b.id=prefix+'Result'+i;b.setAttribute('role','option');b.setAttribute('aria-selected','false');b.tabIndex=-1;el('strong',label(a.title),b);el('span',label(a.description),b);const blocker=requirement(a);if(blocker)el('span',tx('Antes: ','First: ','先完成：')+label(G.definitions[blocker].title),b,'action-requirement');el('span',tx('Después: ','Next: ','下一步：')+label(a.next),b);b.onclick=()=>choose(i);}
  }
  input.oninput=update;input.onkeydown=e=>{if(['ArrowDown','ArrowUp'].includes(e.key)&&rows.length){e.preventDefault();selection((index+(e.key==='ArrowDown'?1:-1)+rows.length)%rows.length);}else if(e.key==='Enter'){e.preventDefault();if(rows.length===1)choose(0);else if(index>=0)choose(index);else if(rows.length)selection(0);}else if(e.key==='Escape'&&input.value){e.preventDefault();e.stopPropagation();input.value='';update();}};
  update();return input;
 }
 // AST-01 · Una tarjeta que depende de una capacidad solo se ofrece si la capacidad está disponible (registro único,
 // js/capability-registry.js) y su módulo está en la página: nunca se anuncia lo que no se puede abrir.
 function levelsAvailable(){const caps=window.FloorPlanCapabilities,c=caps?.byId?.('building');return typeof window.FloorPlanBuildingUI?.open==='function'&&(!caps||c?.state==='available');}
 function offered(a){return a.capability!=='building'||levelsAvailable();}
 // Abre «Plantas…» de building-ui (la única implementación) y deja el foco en su primera acción de añadir.
 function openLevels(){if(!levelsAvailable())return announce(tx('Las plantas no están disponibles en esta página.','Levels are not available on this page.','此页面无法使用楼层。'));
  closeWelcome();closeDrawers();window.FloorPlanBuildingUI.open();const d=document.getElementById('levelsDialog');if(!d?.open)return;
  const add=d.querySelector('#levelAddEmpty,#levelCreateEmpty');if(add)return add.focus();
  // Edificio con el máximo de plantas (building-core LIMITS): se dice, y el panel queda abierto para revisarlas.
  const max=window.FloorPlanBuilding?.LIMITS?.levels;announce(tx(`Este edificio ya tiene ${max||'el máximo de'} plantas, el máximo actual. Puedes revisarlas aquí.`,`This building already has ${max||'the maximum'} levels, the current maximum. You can review them here.`,`该建筑已有 ${max||'最多'} 层（当前上限）。可在此查看。`));}
 function openSearch(query=''){actionDialog.replaceChildren();heading(actionDialog,tx('¿Qué quieres hacer?','What would you like to do?','你想做什么？'));const input=search(actionDialog,'editor');show(actionDialog);if(query){input.value=query;input.dispatchEvent(new Event('input'));}input.focus();}
 function requirement(a){if(state().kind==='example'&&a.goal&&a.goal!=='review')return 'start';if(a.prerequisite==='geometry'&&!G.geometryReady(project))return 'geometry';if(a.prerequisite==='image'&&!facts().imagesReady)return 'image';return null;}
 function setGoal(goal,{targetType,targetRoomId}={}){const s=state();s.goal=goal;s.manualTask=false;delete s.targetType;delete s.targetRoomId;if(targetType)s.targetType=targetType;if(targetRoomId)s.targetRoomId=targetRoomId;s.closed=false;const p=progress();s.current=(p.pending[0]||p.current).id;store();render();announce(tx('Objetivo actualizado. Las tareas se adaptan a lo que quieres conseguir.','Goal updated. Tasks adapt to what you want to achieve.','目标已更新。任务会根据目标调整。'));}
 function openGoal(){goalDialog.replaceChildren();heading(goalDialog,tx('Elige tu objetivo','Choose your goal','选择目标'));el('p',tx('Puedes cambiarlo en cualquier momento. Las tareas necesarias se adaptan y conservamos los resultados comprobables.','You can change it at any time. Required tasks adapt and verified results are retained.','可以随时更改。必要任务会调整，已验证结果会保留。'),goalDialog);const l=el('label',tx('Quiero…','I want to…','我想…'),goalDialog),sel=el('select',undefined,l);sel.id='guideGoalSelect';for(const [id,title]of Object.entries(G.goals)){const o=el('option',label(title),sel);o.value=id;}sel.value=state().goal;btn('guideGoalApply',tx('Aplicar objetivo','Apply goal','应用目标'),()=>{setGoal(sel.value);goalDialog.close();},goalDialog,true);show(goalDialog);}
 async function execute(a,fromWelcome=false){
  if(a.id==='upload')return beginUpload();if(a.id==='blank')return createOwn('create');if(a.id==='example')return example();
  if(fromWelcome)closeWelcome();
  if(a.id==='joinScan')return window.FloorPlanUpload?.pickJoin();
  if(a.id==='presentation')return window.FloorPlanPresentation?.open();
  if(a.id==='levels')return openLevels();
  if(a.id==='missing'){state().closed=false;render();return openDetails();}
  if((a.goal&&state().goal!==a.goal)||a.targetType){const targetRoom=a.roomHint&&(project.rooms.find(r=>r.family===a.roomHint)||project.rooms.find(r=>G.normalize(nm(r.name||'')).includes(a.roomHint==='bedroom'?LANG==='en'?'bed':'dorm':LANG==='en'?'kitchen':'cocina')));setGoal(a.goal,{targetType:a.targetType,targetRoomId:targetRoom?.id});if(targetRoom)select({kind:'room',id:targetRoom.id});}
  const block=requirement(a);if(block){if(block==='start')afterCopy=a;state().current=block;state().closed=false;store();render();
   // In the example the copy is one step away: the card asks for it in place, without opening the task list.
   if(block==='start'){bar.dispatchEvent(new Event('rubik:guide-reveal'));focusReturns.set(actionDialog,currentAction);currentAction.focus();return;}
   return openDetails(block);}
  switch(a.id){
   case 'scale':return runTask(progress().tasks.find(t=>t.id==='scale')||{id:'scale',action:'scale',blockers:[]});
   case 'furniture':await setView('2d');if(!ui.sel||ui.sel.kind!=='room'){const room=project.rooms.find(r=>r.id===state().targetRoomId)||project.rooms[0];if(room)select({kind:'room',id:room.id});}libSearch.query=a.filter||'';libSearch.room='';libSearch.family='';$('#furnitureSearch').value=libSearch.query;$('#searchRoom').value=$('#searchFamily').value='';renderLibResults();window.FloorPlanBuildPalette?.select('furnish');drawer('lib',true);$('#furnitureSearch').focus();state().current='furniture';break;
   case '3d':state().current='view3d';await setView('3d');if(is3D())record('view3d');break;
   case 'save':state().current='save';if(save()){await persistence.requireSaved();announce(tx('Proyecto guardado en este navegador. Exporta una copia para otro dispositivo.','Project saved in this browser. Export a copy for another device.','项目已保存在此浏览器。请导出副本以在其他设备使用。'));}break;
   case 'export':state().current='export';exportPNG();break;
   case 'drawWall':await window.FloorPlanBuildPalette.drawWall();break;
   case 'measure':case 'select':await window.FloorPlanBuildPalette.useTool(a.id);break;
   case 'walls':await setView('2d');$('#traceBtn').click();await FloorPlanTraceUI.start('edit');state().current='geometry';break;
   case 'floor':{const room=project.rooms.find(r=>r.id===state().targetRoomId)||project.rooms[0];select({kind:'room',id:room.id});drawer('panel',true);$('#surfaceFloor').click();break;}
   case 'undo':undo();break;case 'clear':clearLayout();break;
  }
  store();render();
 }
 async function runTask(task){if(!task)return;if(details.open)details.close();state().closed=false;state().current=task.id;state().manualTask=false;store();render();
  if(task.blockers?.length){const block=task.blockers[0];state().current=block;render();return openDetails(block);}
  if(task.id==='start')return state().kind==='example'&&state().goal!=='review'?copyExample(state().goal):openWelcome();
  if(task.action==='upload'){if(project.sourceImages?.length&&!facts().imagesReady){$('#traceZipFile').click();return;}return beginUpload();}
  if(task.action==='scale'){
   const c=project.scale.calibration,v=project.scale.verification;await setView('2d');$('#traceBtn').click();
   if(!facts().imagesReady)return openDetails('image');
   if(v?.status==='consistent'&&!c?.confirmedByUser)$('#traceConfirm').click();else await FloorPlanTraceUI.start(c&&!v?'verify':'calibrate');
   render();return;
  }
  if(task.action==='geometry'){roomReturnToWelcome=false;await setView('2d');if(project.sourceImages?.length||['import','project'].includes(state().origin)){if(!$('#tracePanel')||$('#tracePanel').hidden)$('#traceBtn').click();await FloorPlanTraceUI.start(project.sourceImages?.length?'wall':project.rooms.length?'edit':'room');}else FloorPlanRoomUI.createRoom();return;}
  return execute({id:task.action,...G.actions[task.action==='3d'?'3d':task.action],goal:undefined});
 }
 function primaryLabel(t){if(!t)return '';if(t.blockers.length)return tx('Resolver requisito','Resolve requirement','完成前置任务');if(t.id==='image'&&project.sourceImages?.length&&!facts().imagesReady)return tx('Recuperar imágenes (ZIP)','Restore images (ZIP)','恢复图片 (ZIP)');if(t.id==='start')return state().kind==='example'&&state().goal!=='review'?tx('Crear mi copia','Create my copy','创建副本'):tx('Volver al inicio','Return home','返回首页');if(t.id==='scale'){const c=project.scale.calibration,v=project.scale.verification;return tx(!c?'Empezar a ajustar':v?.status==='consistent'&&!c.confirmedByUser?'Confirmar escala':!v?'Comprobar segunda cota':'Revisar escala',!c?'Start adjusting':v?.status==='consistent'&&!c.confirmedByUser?'Confirm scale':!v?'Check second dimension':'Review scale','检查比例');}
  return label(({image:['Subir plano','Upload plan','上传平面图'],geometry:['Abrir dibujo','Open drawing','打开绘图'],furniture:['Buscar muebles','Find furniture','搜索家具'],view3d:['Abrir 3D','Open 3D','打开 3D'],save:['Confirmar guardado','Confirm saving','确认保存'],export:['Generar PNG','Generate PNG','生成 PNG']})[t.id]);}
 function outcome(parent,p){if(!p.finished)return;const box=el('div',undefined,parent,'guide-outcome');el('strong',tx('✓ Objetivo completado','✓ Goal complete','✓ 目标已完成'),box);el('p',label(G.goals[p.goal]),box);el('p',saved()?tx(`Guardado en este navegador · Proyectos → ${project.name}.`,`Saved in this browser · Projects → ${project.name}.`,`保存在此浏览器 · 项目 → ${project.name}。`):tx('El resultado está abierto. Confirma el guardado para conservarlo.','The result is open. Confirm saving to keep it.','结果已打开。请确认保存。'),box);
  if(state().evidence.export===p.rev)el('p',tx(`PNG generado: ${state().exportName||'PNG'}. El destino final depende de las descargas de tu navegador.`,`PNG generated: ${state().exportName||'PNG'}. The final location depends on your browser downloads.`,'已生成 PNG。最终位置取决于浏览器下载设置。'),box);
  const row=el('div',undefined,box,'actions');btn('guideExportCopy',tx('Exportar copia JSON / ZIP','Export JSON / ZIP copy','导出 JSON / ZIP'),()=>safe(exportCopy),row);btn('guideExportImage',tx('Exportar imagen PNG','Export PNG image','导出 PNG 图片'),()=>exportPNG(),row);}
 async function exportCopy(){if(project.sourceImages?.length)download('proyecto-plano.zip',await FloorPlanPackage.encode(project,FloorPlanImages.get));else $('#exportJson').click();}
 function openDetails(focusTask){renderDetails();show(details);if(focusTask)details.querySelector(`[data-task="${focusTask}"]`)?.scrollIntoView({block:'nearest'});}
 function renderDetails(){const scroll=details.scrollTop;details.replaceChildren();const listed=id=>progress().tasks.some(t=>t.id===id);heading(details,tx('Tu recorrido','Your journey','你的流程'));const p=progress();el('p',summary(p),details);el('p',tx('Las opcionales no bloquean el objetivo. Puedes volver a cualquier etapa o explorar el editor.','Optional tasks do not block your goal. Return to any stage or explore the editor.','可选任务不会阻止完成目标。可返回任何阶段或浏览编辑器。'),details);outcome(details,p);
  const list=el('div',undefined,details,'guide-task-list');for(const t of p.tasks){const box=el('article',undefined,list,'guide-task');box.dataset.task=t.id;box.dataset.state=t.status;const meta=el('div',undefined,box,'task-meta');el('span',`${t.stage+1}. ${label(G.stages[t.stage])} · `+label(t.classification==='conditional'?['Condicional · necesaria','Conditional · required','条件任务 · 必要']:t.necessary?['Necesaria','Required','必要']:['Opcional','Optional','可选']),meta);el('b',statusLabel(t),meta);el('h3',label(t.title),box);el('p',label(t.instruction),box);
   if(t.blockers.length)el('p',tx('Antes: ','First: ','先完成：')+t.blockers.map(id=>label(G.definitions[id].title)).join(' · '),box);
   const row=el('div',undefined,box,'actions');btn('guideTask-'+t.id,primaryLabel(t),()=>safe(()=>runTask(t)),row,t.id===p.current.id);
   if(!t.necessary&&t.status!=='completed')btn('guideSkip-'+t.id,t.skipped?tx('Recuperar tarea','Restore task','恢复任务'):tx('Saltar por ahora','Skip for now','暂时跳过'),()=>{const s=state();s.skipped=t.skipped?s.skipped.filter(id=>id!==t.id):[...new Set([...s.skipped,t.id])];const next=p.tasks.find(q=>q.stage>=t.stage&&q.id!==t.id&&q.status!=='completed'&&!s.skipped.includes(q.id));if(next)s.current=next.id;store();render();renderDetails();},row);
   const help=el('details',undefined,box);el('summary',tx('Ver cómo hacerlo','See how to do it','查看操作方法'),help);el('p',t.id==='scale'?tx('Una primera cota deja la escala estimada. La segunda debe ser independiente y concordar con el umbral provisional del 2 %. Confirma después. Las medidas siguen siendo orientativas.','A first dimension gives an estimated scale. A second independent dimension must agree within the provisional 2% threshold. Then confirm. Measurements remain indicative.','第一尺寸仅估算比例。独立的第二尺寸必须符合临时 2% 阈值后再确认。测量仍仅供参考。'):tx('La tarea se marca al comprobar el resultado real. Usa Deshacer para recuperar el último cambio. Puedes acceder a todas las herramientas sin perder el avance.','The task is marked after checking the actual result. Use Undo to restore the last change. All tools remain accessible without losing progress.','检查实际结果后才标记任务。使用撤销恢复上一步。可随时使用全部工具。'),help);
  }
  const row=el('div',undefined,details,'actions');btn('guideAllTools',tx('Ver todas las herramientas','See all tools','查看所有工具'),()=>{details.close();fullEditor=true;state().fullTools=true;store();render();drawer('lib',true);drawer('panel',true);searchBtn.focus();},row);// One action, one button: «Guardar ahora» only when the «Guarda tu proyecto» task is not in the list above.
  if(!listed('save'))btn('guideSaveNow',tx('Guardar ahora','Save now','立即保存'),()=>safe(()=>execute({id:'save'})),row);btn('guideGoalFromDetails',tx('Cambiar objetivo','Change goal','更改目标'),()=>{details.close();openGoal();},row);
  if(state().journeySkipped?.length)btn('guideRestoreSuggestions',tx('Recuperar sugerencias aplazadas','Bring back put-off suggestions','恢复暂缓的建议'),()=>{state().journeySkipped=[];store();render();renderDetails();},row);btn('guideCopyNow',tx('Exportar copia JSON / ZIP','Export JSON / ZIP copy','导出 JSON / ZIP'),()=>safe(exportCopy),row);
  // Finding 17: in the guided mode the «Archivo» menu is hidden, so delivering (sheet, client observations, image)
  // had no visible way in. The same items are offered here; they open as from the menu and the guide stays.
  el('h3',tx('Entregar al cliente','Deliver to the client','交付给客户'),details,'guide-deliver-title');btn('guideDeliveryCenter',tx('Preparar entrega','Prepare delivery','准备交付'),()=>{details.close();window.FloorPlanProfessionalUI?.open('deliver');},details,'btn');const deliver=el('div',undefined,details,'actions guide-deliver');deliver.setAttribute('role','group');deliver.setAttribute('aria-label',tx('Entregar','Deliver','交付'));
  for(const [id,target,es,en,zh,task] of [['guideDeliverSheet','openSheet','Abrir lámina','Open sheet','打开图纸'],['guideDeliverSurfaceSheet','openSurfaceSheet','Ficha de superficies','Area schedule','面积明细表'],['guideDeliverReview','reviewNotesBtn','Observaciones del cliente…','Client observations…','客户意见…'],['guideDeliverImage','exportPng','Exportar imagen','Export image','导出图片','export']])
   if($('#'+target)&&!(task&&listed(task)))btn(id,tx(es,en,zh),()=>{details.close();$('#'+target).click();},deliver);
  if(storageError)el('p',storageError,details).setAttribute('role','alert');details.scrollTop=scroll;
 }
 // A task waiting on an earlier one says so; «Necesita revisión» is for a result that has changed since it was done.
 const statusLabel=t=>t.skipped?tx('Saltada por ahora','Skipped for now','暂时跳过'):t.status!=='completed'&&t.blockers.length?tx('○ Después de: ','○ After: ','○ 之后：')+label(G.definitions[t.blockers[0]].title):t.id==='start'&&t.status==='review'&&state().kind==='example'?tx('◉ Ahora: crea tu copia','◉ Now: create your copy','◉ 当前：创建副本'):label(({pending:['○ Pendiente','○ Pending','○ 待完成'],active:['◉ En curso','◉ In progress','◉ 进行中'],completed:['✓ Completada','✓ Complete','✓ 已完成'],review:['! Necesita revisión','! Needs review','! 需要检查']})[t.status]);
 function summary(p){return tx(`${p.percent} % completado · ${p.done} de ${p.required} tareas necesarias listas`,`${p.percent}% complete · ${p.done} of ${p.required} required tasks ready`,`${p.percent}% 已完成 · ${p.done}/${p.required} 必要任务完成`);}
 function record(kind,rev=G.revision(project)){state().evidence[kind]=rev;store();render();}

 // What the guide row shows (docs/product/journey-orientation-2026-10-21.md §4): building conflicts first; a task the
 // person went back to and that is already done says so and offers to go on; a pending goal shows its task (or, if a
 // requirement blocks it, the requirement itself, which its button runs); a finished goal shows the professional's next
 // action from FloorPlanJourney. One primary action at most; the secondary ones are plain links.
 const Journey=window.FloorPlanJourney,JOURNEY_KEY='rubik-sota-journey-v1';
 // A presented version counts as reviewed in 3D and as delivered (browser data, never in the project or the guide entry).
 function presented(){try{return JSON.parse(originalStorage.getItem(JOURNEY_KEY)||'{}')[library?.activeId()||project.id]?.presented===G.revision(project);}catch{return false;}}
 function journeyResult(s){const st=window.FloorPlanBuildingUI?.status?.()||{state:'clear'},rev=G.revision(project),done=presented();return Journey.next({project,kind:s.kind,revision:rev,evidence:{view3d:done?rev:s.evidence.view3d,present:done?rev:undefined},skipped:s.journeySkipped||[],view:is3D()?'3d':'2d',building:st});}
 function decideNext(s,p){
  const st=window.FloorPlanBuildingUI?.status?.()||{state:'clear'};
  if(s.kind!=='example'&&st.state!=='clear'&&st.headline&&G.geometryReady(project))return {mode:'journey',r:journeyResult(s)};
  if(s.manualTask&&p.current.status==='completed'){const pending=p.pending.find(t=>t.id!==p.current.id);return {mode:'done-task',task:p.current,next:pending||null,r:pending?null:journeyResult(s)};}
  // The stored task can lag behind (e.g. after importing a building it may still be a completed one): show the first
  // pending task of the goal instead.
  // A presented version has been reviewed in 3D: the 3D task is not offered again; the next pending one is.
  const pending=presented()?p.pending.filter(t=>t.id!=='view3d'):p.pending;
  if(!p.finished&&!pending.length)return {mode:'journey',r:journeyResult(s)};
  if(!p.finished){const cur=(p.current.status==='completed'||presented()&&p.current.id==='view3d')&&pending[0]?pending[0]:p.current,block=cur.blockers.length?p.tasks.find(t=>t.id===cur.blockers[0]):null;return {mode:'goal',task:block&&!block.blockers.length?block:cur};}
  return {mode:'journey',r:journeyResult(s)};
 }
 function runJourney(id,r){
  const s=state();
  switch(id){
   case 'view3d':return setView('3d');
   case 'plan2d':return setView('2d');
   case 'copy':return copyExample();
   case 'calibrate':case 'recalibrate':case 'verify':case 'reverify':case 'trace':return (async()=>{await setView('2d');if(!$('#tracePanel')||$('#tracePanel').hidden)$('#traceBtn').click();await FloorPlanTraceUI.start(id==='trace'?'room':/verify/.test(id)?'verify':'calibrate');render();})();
   case 'confirm':return $('#traceConfirm').click();
   case 'conflicts':return window.FloorPlanBuildingUI?.openConflicts();
   case 'openings':case 'opening':return window.FloorPlanBuildPalette?.focusOpenings();
   case 'room':return (async()=>{await setView('2d');FloorPlanRoomUI.createRoom();})();
   case 'furnish':case 'keepFurnishing':return execute({id:'furniture',...G.actions.furniture,goal:undefined});
   case 'present':return window.FloorPlanPresentation?.open();
   case 'exportCopy':return exportCopy();
   case 'later':s.journeySkipped=[...new Set([...(s.journeySkipped||[]),r.id])];store();render();announce(tx('Sugerencia aplazada para este proyecto. Puedes recuperarla en «Tareas y ayuda».','Suggestion put off for this project. You can bring it back in “Tasks & help”.','已为此项目暂缓该建议。可在“任务及帮助”中恢复。'));return;
  }
 }
 function renderNext(s,p){
  const d=decideNext(s,p),link=(b,action,fn)=>{b.hidden=!action;if(action){b.textContent=label(action.label);b.onclick=()=>safe(fn);}};
  laterAction.hidden=secondaryAction.hidden=true;goalDone.hidden=true;presentAction.hidden=true;currentAction.hidden=false;
  document.body.classList.toggle('next-present',false);
  if(d.mode==='goal'){const t=d.task;currentTitle.textContent=label(t.title);currentInstruction.textContent=label(t.instruction);currentAction.textContent=primaryLabel(t);currentAction.onclick=()=>safe(()=>runTask(t));presentAction.hidden=t.stage!==4;
   // A goal other than reviewing, chosen in the example, needs the person's copy: say why and what the copy keeps,
   // and let them go on exploring instead.
   if(t.id==='start'&&s.kind==='example'&&s.goal!=='review'){const goal=label(G.goals[s.goal]);currentTitle.textContent=tx('Crea tu copia para seguir','Create your copy to go on','创建副本以继续');
    currentInstruction.textContent=tx(`El ejemplo es para explorar. Para «${goal}», tu copia conserva lo que ves y sigue desde aquí.`,`The example is for exploring. To “${goal}”, your copy keeps what you see and goes on from here.`,`示例仅供浏览。要“${goal}”，副本会保留当前内容并从这里继续。`);
    currentAction.textContent=tx('Crear mi copia y seguir','Create my copy and go on','创建副本并继续');
    link(secondaryAction,{label:['Seguir explorando el ejemplo','Keep exploring the example','继续浏览示例']},()=>{afterCopy=null;setGoal('review');});}}
  else if(d.mode==='done-task'){const next=d.next;currentTitle.textContent=tx('Ya hecho: ','Done: ','已完成：')+label(d.task.title);
   currentInstruction.textContent=next?tx('Puedes repasarlo o seguir con lo pendiente.','You can review it or go on with what is left.','可以复查，或继续未完成的任务。'):tx('Tu objetivo está completo. Puedes seguir con la vivienda.','Your goal is complete. You can go on with the home.','目标已完成。可以继续完善住宅。');
   if(next){currentAction.textContent=tx('Seguir con: ','Go on with: ','继续：')+label(next.title);currentAction.onclick=()=>safe(()=>{state().manualTask=false;runTask(next);});}
   else{const r=d.r;currentAction.hidden=!r.primary;if(r.primary){currentAction.textContent=tx('Seguir con: ','Go on with: ','继续：')+label(r.title);currentAction.onclick=()=>safe(()=>{state().manualTask=false;store();runJourney(r.primary.id,r);});}}}
  else{const r=d.r;currentTitle.textContent=label(r.title);currentInstruction.textContent=label(r.text);currentAction.hidden=!r.primary;
   if(r.primary){currentAction.textContent=label(r.primary.label);currentAction.onclick=()=>safe(()=>runJourney(r.primary.id,r));document.body.classList.toggle('next-present',r.primary.id==='present');}
   link(secondaryAction,r.secondary,()=>runJourney(r.secondary.id,r));link(laterAction,r.later,()=>runJourney('later',r));
   if(p.finished){goalDone.hidden=false;goalDone.textContent=tx(`✓ Objetivo «${label(G.goals[p.goal])}» completado · resultados en «Tareas y ayuda»`,`✓ Goal “${label(G.goals[p.goal])}” complete · results in “Tasks & help”`,`✓ 目标“${label(G.goals[p.goal])}”已完成 · 结果见“任务及帮助”`);}}
  // The example line offers the copy; when the copy is the guide's own button, the line would only repeat it.
  /* PERLA lee el tipo de proyecto para su «Crear copia» de la cabecera */document.getElementById('guideBar')?.setAttribute('data-project-kind',s.kind||'');
  exampleLine.hidden=s.kind!=='example'||d.mode==='journey'&&d.r?.primary?.id==='copy'||d.mode==='goal'&&d.task.id==='start';// The example can be edited; once it differs from the original, the line says so and the copy keeps those changes.
  const changed=s.kind==='example'&&!isReference(project),copyButton=$('#guideCopyExample');copyButton.classList.toggle('primary',changed);
  exampleNote.textContent=changed?tx('Has cambiado el ejemplo. Crea tu copia para conservar estos cambios.','You have changed the example. Create your copy to keep these changes.','你已修改示例。创建副本以保留这些修改。'):tx('Exploras el ejemplo. Crea una copia para tu proyecto.','You are exploring the example. Create a copy for your project.','正在浏览示例。请创建自己的副本。');copyButton.textContent=changed?tx('Crear mi copia con estos cambios','Create my copy with these changes','用这些修改创建副本'):tx('Crear mi copia','Create my copy','创建副本');
  presentAction.textContent=tx('Presentar mi vivienda','Present my home','展示我的住宅');
  // One presentation entry at a time: while the guide row offers it, the guided header does not repeat it.
  document.body.classList.toggle('next-present',document.body.classList.contains('next-present')||!presentAction.hidden);
  const tasks=p.tasks.filter(t=>!t.skipped),first=tasks.findIndex(t=>t.id===p.current.id)<=0,prev=$('#guidePrevious');prev.disabled=first;prev.title=first?tx('Es la primera tarea de tu objetivo','This is the first task of your goal','这是目标的第一个任务'):'';
  // Building conflicts (furniture on a stair or its opening) are part of the layout: «Distribuir».
  return d.task?d.task.stage:d.r?.primary?.id==='conflicts'?2:p.stage;
 }
 function render(){
  applyCompact();bar.setAttribute('aria-label',tx('Objetivo y progreso','Goal and progress','目标与进度'));
  const s=state(),p=progress(),showOutcome=p.finished&&!s.manualTask;projectLabel.textContent=s.kind==='example'?tx('Proyecto de ejemplo','Example project','示例项目'):project.name;projectLabel.title=projectLabel.textContent;goalLabel.textContent=label(G.goals[s.goal]);goalLabel.title=goalLabel.textContent;
  searchPrompt.textContent=tx('⌕ ¿Qué quieres hacer?','⌕ What would you like to do?','⌕ 你想做什么？');
  searchCompact.textContent=tx('⌕ Buscar','⌕ Search','⌕ 搜索');
  resume.textContent=tx('Recuperar guía','Resume guide','恢复指南');bar.hidden=s.closed||s.fullTools||fullEditor;resume.hidden=!bar.hidden;document.body.classList.toggle('guided',!bar.hidden);
  homeBtn.textContent=tx('← Inicio','← Home','← 首页');homeBtn.title=tx('Volver al inicio sin perder el proyecto','Return home without losing the project','返回首页并保留项目');
  $('#guidePrevious').textContent=tx('← Paso anterior','← Previous step','← 上一步');
  $('#guideGoalChange').textContent=tx('Cambiar objetivo','Change goal','更改目标');$('#guideDetails').textContent=tx('Tareas y ayuda','Tasks & help','任务及帮助');$('#guideClose').textContent='×';$('#guideClose').setAttribute('aria-label',tx('Cerrar guía','Close guide','关闭指南'));
  progressText.textContent=summary(p);meter.setAttribute('aria-valuenow',String(p.percent));meter.setAttribute('aria-label',summary(p));fill.style.width=p.percent+'%';optionalText.textContent=tx(`Opcionales ${p.optionalDone}/${p.optionalTotal}`,`Optional ${p.optionalDone}/${p.optionalTotal}`,`可选 ${p.optionalDone}/${p.optionalTotal}`);
  // The highlighted stage is the one of the task the card shows, which can be ahead of a stored task already done.
  const shownStage=renderNext(s,p);
  const visualStage=[0,0,1,2,3][shownStage]??3;journeyLabel.textContent=tx(`Recorrido del proyecto · Paso ${visualStage+1} de 5 · ${label(professionalStages[visualStage])}`,`Project journey · Step ${visualStage+1} of 5 · ${label(professionalStages[visualStage])}`,`项目流程 · 第 ${visualStage+1}/5 步 · ${label(professionalStages[visualStage])}`);
  for(const [i,b]of [...steps.querySelectorAll('button')].entries()){b.querySelector('.step-label').textContent=label(professionalStages[i]);if(i===([0,0,1,2,3][shownStage]??3))b.setAttribute('aria-current','step');else b.removeAttribute('aria-current');b.title=label(professionalStages[i]);}
  empty.hidden=G.geometryReady(project)||is3D()||!!project.sourceImages?.length;emptyTitle.textContent=tx('Aquí empieza tu distribución','Your layout starts here','从这里开始布局');emptyText.textContent=tx('Crea tu primera estancia con dimensiones interiores o utiliza el trazado manual.','Create your first room with interior dimensions or use manual drawing.','输入内部尺寸创建房间，或手动绘图。');$('#guideEmptyAction').textContent=tx('Crear primera estancia','Create first room','创建第一个房间');
  const completed=p.tasks.filter(t=>t.status==='completed').map(t=>t.id);s.completed=[...new Set([...s.completed,...completed])];
  if(lastResult&&lastResult.projectId===project.id){const done=p.tasks.filter(t=>t.status==='completed'&&!lastResult.done.includes(t.id));if(done.length)announcement.textContent=label(done[0].title)+tx(' · Resultado comprobado. ',' · Result verified. ',' · 结果已验证。')+(p.pending[0]?tx('Te queda: ','Next: ','下一步：')+label(p.pending[0].title):tx('Objetivo completado.','Goal complete.','目标已完成。'));}
  lastResult={projectId:project.id,done:completed};if(details.open)renderDetails();
 }
 function sync(){const id=library?.activeId()||project.id,s=state();if(s.fullTools)fullEditor=true;if(fullEditor)s.fullTools=true;if(currentId!==id||s.projectId!==project.id){currentId=id;lastResult=null;if(pendingEntry&&!pendingIds.includes(id)){Object.assign(s,pendingEntry);s.origin=project.sourceImages?.length?'image':entryOrigin||s.origin;s.current='geometry';pendingEntry=null;entryOrigin=null;}if(s.kind==='example'&&project.sourceImages?.length)s.kind='own';}
  const old=lastSnapshot;lastSnapshot=JSON.stringify([id,project,LANG,facts(),s.goal,s.current,window.FloorPlanBuildingUI?.status?.()?.headline||'',typeof is3D==='function'&&is3D()]);if(old===lastSnapshot)return;
  const p=progress();if(p.current.status==='completed'&&!s.manualTask){s.current=(p.pending[0]||p.current).id;}render();store();
 }
 window.FloorPlanGuideUI={sync,progress,state,record,captureImport,importRouteCurrent,imported,openWelcome,openSearch,openDetails,execute,setGoal,returnFromRoom,roomCommitted(){roomReturnToWelcome=false;}};
 addEventListener('floorplan-view-ready',()=>record('view3d'));
 // Presenting is a 3D view of the same plan: it reviews this version and marks it as presented.
 // Kept apart from the guide entry (rubik-sota-journey-v1): a presentation restores the guide state exactly.
 addEventListener('floorplan-presentation-started',()=>{const id=library?.activeId()||project.id,rev=G.revision(project);try{const all=JSON.parse(originalStorage.getItem(JOURNEY_KEY)||'{}');all[id]={presented:rev};originalStorage.setItem(JOURNEY_KEY,JSON.stringify(all));}catch{}});
 addEventListener('floorplan-export-ready',e=>{if(e.detail.projectId===project.id&&e.detail.revision===G.revision(project)){state().exportName=e.detail.filename;record('export',e.detail.revision);}});
 addEventListener('floorplan-images-ready',sync);
 persistence.session?.subscribe(()=>queueMicrotask(sync));
 // Entry URL means welcome; #editor reload resumes. Project persistence is independent of the screen.
 sync();if(location.hash!=='#legal-y-uso'){
  const screen=location.hash==='#editor'?'editor':'welcome';setRoute(screen,true);if(screen==='welcome')openWelcome(false);
 }
 // The columns are not forced here: drawer(null) in the editor restores the person's last choice, and with none
 // they are open on desktop. On narrow screens they are drawers and start closed.
 addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();if(!dialogs.some(d=>d.open))openSearch();}});
})();
