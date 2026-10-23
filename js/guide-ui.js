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
  ['interior',['Decoración e interiorismo','Interior design','室内设计']]
 ];
 // What Rubik is for in each field, using only what the editor does today; the first action is one of the three
 // welcome entries, never a different tool set (docs/product/professional-client-experience-2026-10-21.md, result 1).
 const audiencePurpose={
  architecture:['Sube el plano (PDF, imagen, DXF o IFC), comprueba la escala y entrega a tu cliente una vivienda editable en 2D y 3D.','Upload the plan (PDF, image, DXF or IFC), check its scale and give your client an editable home in 2D and 3D.','上传平面图（PDF、图片、DXF 或 IFC），检查比例，并向客户交付可编辑的 2D 和 3D 住宅。'],
  'real-estate':['Convierte el plano del inmueble en una vivienda amueblada que el comprador puede recorrer en 3D, con tu marca.','Turn the property plan into a furnished home the buyer can walk through in 3D, with your brand.','将房源平面图变成买家可在 3D 中浏览的带家具住宅，并附上你的品牌。'],
  developer:['Prepara cada tipología, también de dos plantas, y preséntala con la misma identidad de marca.','Prepare each unit type, two-storey ones included, and present it with the same brand identity.','准备每种户型（包括两层），并以统一的品牌形象展示。'],
  renovation:['Parte del plano actual, ajusta estancias y huecos y enseña al cliente la propuesta en 3D.','Start from the current plan, adjust rooms and openings and show the client the proposal in 3D.','从现有平面图开始，调整房间和门窗，并在 3D 中向客户展示方案。'],
  interior:['Amuebla, elige acabados y presenta cada ambiente en 3D a tu cliente.','Furnish, choose finishes and present each room in 3D to your client.','布置家具、选择饰面，并在 3D 中向客户展示每个空间。']
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
 function saved(){try{const raw=originalStorage.getItem(FloorPlanLibrary.KEY);if(library&&raw){const d=JSON.parse(raw);return JSON.stringify(d.entries.find(e=>e.id===library.activeId())?.project)===JSON.stringify(project);}return originalStorage.getItem(STORE)===JSON.stringify(project);}catch{return false;}}
 function facts(){return {saved:saved(),imagesReady:!!project.sourceImages?.length&&project.sourceImages.every(i=>FloorPlanTraceUI.imageReady(i.id))};}
 function progress(){return G.evaluate(project,state(),facts());}
 const header=$('header'),searchBtn=btn('actionSearchBtn','',()=>openSearch(),header);searchBtn.setAttribute('aria-haspopup','dialog');
 const homeBtn=btn('welcomeBtn','',()=>openWelcome(),header);homeBtn.title=tx('Volver a la bienvenida','Open welcome','打开欢迎页');
 const resume=btn('guideResume','',()=>{state().closed=false;state().fullTools=false;fullEditor=false;store();render();},header);
 // The guided header keeps what the journey needs: the level switch of a building, the 3D modes (in 3D only) and the
 // presentation entry (secondary here: the guide's own button is the dominant action).
 const essentials=new Set(['uploadPlanBtn','uploadCancel','paneBtns','viewSeg','projectsBtn','langBtn','actionSearchBtn','welcomeBtn','guideResume','levelBar','modes3d','presentationBtn']);
 for(const child of header.children)if(!essentials.has(child.id)&&!child.classList.contains('brand')&&!child.querySelector('#undo'))child.classList.add('advanced-control');
 const bar=el('section',undefined,undefined,'guide-bar');bar.id='guideBar';bar.setAttribute('aria-label','Objetivo y progreso');header.after(bar);
 const top=el('div',undefined,bar,'guide-top'),identity=el('div',undefined,top,'guide-identity');
 const projectLabel=el('span',undefined,identity,'guide-project'),goalLabel=el('span',undefined,identity,'guide-goal');
 const topActions=el('div',undefined,top,'guide-controls');btn('guidePrevious','',()=>previousTask(),topActions);btn('guideGoalChange','',()=>openGoal(),topActions);btn('guideDetails','',()=>openDetails(),topActions);
 // Compact guide (default on phones and short screens): goal, current task and its buttons stay; the step list,
 // the progress line and long descriptions are hidden until «Ver más». The choice is remembered per browser.
 const compactKey='rubik-guide-compact',compactDefault=()=>matchMedia('(max-width:600px),(max-height:500px)').matches;
 let compact=(()=>{try{const v=localStorage.getItem(compactKey);return v===null?compactDefault():v==='1';}catch{return compactDefault();}})();
 const compactBtn=btn('guideCompact','',()=>{compact=!compact;try{localStorage.setItem(compactKey,compact?'1':'0');}catch{}applyCompact();},topActions);
 function applyCompact(){bar.classList.toggle('guide-compact',compact);compactBtn.textContent=compact?tx('Ver más','Show more','显示更多'):tx('Ver menos','Show less','显示更少');compactBtn.setAttribute('aria-expanded',String(!compact));compactBtn.title=compact?tx('Mostrar etapas y progreso de la guía','Show guide stages and progress','显示指南阶段和进度'):tx('Ocultar etapas y progreso para dejar más plano a la vista','Hide stages and progress to show more of the plan','隐藏阶段和进度以显示更多平面图');}btn('guideClose','',()=>{state().closed=true;store();render();resume.focus();},topActions);
 const progressLine=el('div',undefined,bar,'guide-progress-line'),progressText=el('strong',undefined,progressLine),meter=el('div',undefined,progressLine,'guide-progress');meter.setAttribute('role','progressbar');meter.setAttribute('aria-valuemin','0');meter.setAttribute('aria-valuemax','100');const fill=el('span',undefined,meter);
 const optionalText=el('span',undefined,progressLine),steps=el('ol',undefined,bar,'guide-steps');
 for(let i=0;i<5;i++){const li=el('li',undefined,steps),b=btn('guideStage'+i,'',()=>{const p=progress(),tasks=p.tasks.filter(t=>t.stage===i);if(tasks.length){state().current=(tasks.find(t=>t.status!=='completed'&&!t.skipped)||tasks[0]).id;state().manualTask=true;store();render();}else{toast(tx('Esta etapa no requiere tareas para tu objetivo.','This stage has no tasks for your goal.','此阶段没有目标任务。'));}},li);el('span',String(i+1),b,'step-number');el('span',undefined,b,'step-label');}
 const current=el('div',undefined,bar,'guide-current'),copy=el('div',undefined,current,'guide-task-copy'),currentTitle=el('h2',undefined,copy),currentInstruction=el('p',undefined,copy);
 const currentAction=btn('guidePrimary','',()=>runTask(progress().current),current,true);
 const secondaryAction=btn('guideSecondary','',()=>{},current);secondaryAction.classList.add('guide-link');const laterAction=btn('guideLater','',()=>{},current);laterAction.classList.add('guide-link');
 const goalDone=el('p',undefined,copy,'guide-goal-done');
 const presentAction=btn('guidePresent','',()=>window.FloorPlanPresentation?.open(),current);
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
 function buildWelcome(){welcome.replaceChildren();const shell=el('div',undefined,welcome,'welcome-shell'),brand=el('div',undefined,shell,'welcome-brand'),mark=el('div',undefined,brand,'brand-mark'),glyph=el('span',undefined,mark,'brand-glyph');glyph.setAttribute('aria-hidden','true');for(let i=0;i<4;i++)el('i',undefined,glyph);const words=el('div',undefined,mark);el('strong','Rubik Sota',words);el('small','Floor Plan Designer',words);
  const nav=el('div',undefined,brand,'welcome-nav');
  if(data.seen||hadLibrary)btn('welcomeReturn',tx('Volver al proyecto →','Return to project →','返回项目 →'),closeWelcome,nav);
  btn('welcomeLanguage',({es:'English',en:'中文',zh:'Español'})[LANG],()=>{setLang(({es:'en',en:'zh',zh:'es'})[LANG]);buildWelcome();},nav);
  const intro=el('section',undefined,shell,'welcome-intro'),left=el('div',undefined,intro);
  el('p',tx('Para inmobiliarias, promotoras y estudios','For agencies, developers and studios','面向房产中介、开发商和设计事务所'),left,'welcome-eyebrow');const h=el('h1',tx('¿Qué quieres hacer?','What would you like to do?','你想做什么？'),left);h.id='welcomeDialogTitle';
  el('p',tx('Convierte un plano en una vivienda editable en 2D y 3D, amuéblala y preséntala a tu cliente. Te acompañamos desde el primer paso.','Turn a plan into an editable home in 2D and 3D, furnish it and present it to your client. We guide you from the first step.','把平面图变成可编辑的 2D 和 3D 住宅，布置家具并展示给客户。从第一步开始提供指南。'),left,'lead');
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
  const audienceSection=el('section',undefined,shell,'welcome-audience');
  const audienceTitle=el('h2',tx('¿En qué trabajas?','What is your field?','你的工作领域是什么？'),audienceSection);audienceTitle.id='welcomeAudienceTitle';
  el('p',tx('Opcional. Te mostramos para qué te sirve Rubik. Las herramientas son las mismas para todos y tu proyecto no cambia.','Optional. We show what Rubik does for you. Everyone has the same tools and your project does not change.','可选。我们会说明 Rubik 对你的用途。所有人使用相同的工具，你的项目不会改变。'),audienceSection);
  const audienceOptions=el('div',undefined,audienceSection,'welcome-audience-options');audienceOptions.setAttribute('role','group');audienceOptions.setAttribute('aria-labelledby',audienceTitle.id);
  for(const [id,names] of audiences){const option=btn('welcomeAudience-'+id,label(names),()=>{
   audience=audience===id?'':id;
   try{if(audience)originalStorage.setItem(audienceKey,audience);else originalStorage.removeItem(audienceKey);}catch{}
   for(const node of audienceOptions.children)node.setAttribute('aria-pressed',String(node.id==='welcomeAudience-'+audience));
   showPurpose();
  },audienceOptions);option.classList.add('welcome-audience-option');option.setAttribute('aria-pressed',String(audience===id));}
  // The chosen field answers «what is it for me» and offers the same first action as the entries above.
  const purpose=el('div',undefined,audienceSection,'welcome-audience-purpose');purpose.id='welcomeAudiencePurpose';purpose.setAttribute('aria-live','polite');
  function showPurpose(){purpose.replaceChildren();purpose.hidden=!audience;if(!audience)return;
   el('p',label(audiencePurpose[audience]),purpose);const row=el('div',undefined,purpose,'welcome-audience-actions');
   btn('welcomeAudienceStart',tx('Empezar: subir un plano','Start: upload a plan','开始：上传平面图'),()=>document.getElementById('welcomeUpload').click(),row,true);
   btn('welcomeAudienceBlank',tx('¿Sin plano? Crear desde cero','No plan? Create from scratch','没有平面图？从零创建'),()=>document.getElementById('welcomeBlank').click(),row).classList.add('guide-link');}
  showPurpose();
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
  const sol=el('section',undefined,shell,'welcome-solutions');sol.id='welcomeSolutions';
  el('h2',tx('Cómo trabajas con Rubik','How you work with Rubik','如何使用 Rubik'),sol);
  const phases=el('ol',undefined,sol,'solutions-phases');phases.setAttribute('aria-label',tx('Fases del proyecto','Project phases','项目阶段'));
  for(const [stage,ic,what] of [[G.stages[0],'upload',['Sube el plano o empieza desde cero','Upload the plan or start from scratch','上传平面图或从零开始']],[G.stages[1],'ruler',['Comprueba la escala con una medida conocida','Check the scale with a known length','用已知尺寸核对比例']],[G.stages[2],'plan',['Estancias, puertas y ventanas; una o dos plantas','Rooms, doors and windows; one or two levels','房间、门窗；一层或两层']],[G.stages[3],'sofa',['Muebles y acabados','Furniture and finishes','家具和饰面']],[G.stages[4],'cube',['Recorre en 3D, presenta y entrega','Walk in 3D, present and deliver','3D 漫游、展示并交付']]]){const li=el('li',undefined,phases);icon(ic,li,'icon phase-icon');el('strong',label(stage),li);el('span',label(what),li);}
  const deliver={sheet:['Lámina de distribución con tu marca','Floor plan sheet with your brand','带品牌的平面图纸'],batch:['Lote ZIP con vistas 3D y el proyecto editable','ZIP with 3D views and the editable project','含 3D 视图和可编辑项目的 ZIP'],present:['Presentación 3D guiada por estancias','Guided 3D presentation by room','按房间引导的 3D 展示'],walk:['Recorrido 3D por dentro de la vivienda','3D walk-through inside the home','住宅内部 3D 漫游'],project:['Proyecto editable para seguir trabajando','Editable project to keep working','可继续编辑的项目']};
  el('h3',tx('Soluciones según tu trabajo','Solutions for your work','按工作类型的解决方案'),sol,'solutions-title');
  const cards=el('div',undefined,sol,'solutions-cards');
  const fields=[
   ['architecture','compass',['Del plano del estudio a una propuesta que el cliente entiende','From the studio plan to a proposal the client understands','从事务所平面图到客户能看懂的方案'],['sheet','present','project']],
   ['real-estate','key',['Que el comprador recorra el inmueble antes de visitarlo','Let the buyer walk through the property before visiting','让买家在看房前先浏览房源'],['walk','present','batch']],
   ['developer','building',['Cada tipología, también de dos plantas, con tu imagen de marca','Each unit type, two-storey ones included, with your brand','每种户型（含两层）统一品牌形象'],['batch','present','sheet']],
   ['renovation','hammer',['La propuesta de reforma sobre el plano actual','The renovation proposal on the current plan','在现有平面图上的改造方案'],['walk','sheet','project']],
   ['interior','palette',['Ambientes amueblados y sus acabados, para recorrer','Furnished rooms and finishes, to walk through','可漫游的带家具空间及饰面'],['walk','present','batch']]
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
  el('p',tx('Todo lo que aparece aquí ya funciona en Rubik. Medidas orientativas: no sustituye una medición profesional.','Everything listed here already works in Rubik. Dimensions are indicative, not a professional survey.','此处所列功能均已在 Rubik 中可用。尺寸仅供参考，不能替代专业测量。'),sol,'solutions-note');
  const markSolution=()=>{for(const c of cards.children)c.classList.toggle('chosen',c.dataset.audience===audience);if(audience){const c=cards.querySelector(`[data-audience="${audience}"]`);cards.prepend(c);c._pin(true);}};markSolution();
  audienceOptions.addEventListener('click',()=>queueMicrotask(markSolution));
  const other=el('section',undefined,shell,'welcome-search');search(other,'welcome',true);
  const foot=el('div',undefined,shell,'welcome-foot');el('p',tx('Tus proyectos se guardan en este navegador. Exporta una copia para usarlos en otro dispositivo. Imágenes: hasta 15 MiB y 8000 px por lado.','Projects are stored in this browser. Export a copy for another device. Images: up to 15 MiB and 8000 px per side.','项目保存在此浏览器中。请导出副本以在其他设备上使用。图片最大 15 MiB、每边 8000 像素。'),foot);
  if(ownRecoverable())btn('welcomeContinue',tx('Continuar mi proyecto →','Continue my project →','继续我的项目 →'),()=>{const own=library.all().find(e=>e.id===library.activeId()&&data.entries[e.id]?.kind==='own')||library.all().find(e=>data.entries[e.id]?.kind==='own'||!isReference(e.project));if(own)switchProject(library.open(own.id));closeWelcome();render();},foot);
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
 function walkExample(){example();let tries=0,walked=false;addEventListener('floorplan-view-ready',()=>{if(walked)return;walked=true;document.querySelector('#modes3d [data-mode="walk"]')?.click();},{once:true});
  // The example opens asynchronously (library switch); ask for 3D until the editor is on it.
  const go=()=>{if(walked||window.FloorPlanApp?.viewMode==='3d'||++tries>60)return;if(!document.querySelector('#welcomeDialog[open]'))document.querySelector('[data-view="3d"]')?.click();setTimeout(go,400);};setTimeout(go,300);}
 function example(){if(!library)throw Error('Colección local no disponible');closeWelcome();pendingEntry={kind:'example',goal:'review'};pendingIds=library.list().map(e=>e.id);entryOrigin='example';const p=Core.initial();p.id=Core.id('prj');p.name=tx('Proyecto de ejemplo','Example project','示例项目');switchProject(library.add(p,p.name));setView('2d');}
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
  function update(){rows=inline&&!input.value.trim()?[]:G.resolve(input.value);index=-1;results.replaceChildren();input.removeAttribute('aria-activedescendant');input.setAttribute('aria-expanded',String(rows.length>0));feedback.textContent=rows.some(a=>a.ambiguous)?tx('¿Qué quieres cambiar? Elige una opción.','What would you like to change? Choose an option.','想更改什么？请选择。'):!rows.length&&input.value?tx('Sin coincidencias. Prueba: subir plano, cama, escala, 3D, guardar o qué me falta.','No matches. Try: upload plan, bed, scale, 3D, save or what is left.','无匹配。请尝试上传平面图、家具、比例、3D 或保存。'):rows.length?tx(`${rows.length} acciones disponibles. Usa ↑ ↓ y Enter.`,`${rows.length} actions available. Use ↑ ↓ and Enter.`,`${rows.length} 个可用操作。使用方向键和回车。`):'';
   for(const [i,a]of rows.entries()){const b=el('button',undefined,results,'action-result');b.type='button';b.id=prefix+'Result'+i;b.setAttribute('role','option');b.setAttribute('aria-selected','false');b.tabIndex=-1;el('strong',label(a.title),b);el('span',label(a.description),b);const blocker=requirement(a);if(blocker)el('span',tx('Antes: ','First: ','先完成：')+label(G.definitions[blocker].title),b,'action-requirement');el('span',tx('Después: ','Next: ','下一步：')+label(a.next),b);b.onclick=()=>choose(i);}
  }
  input.oninput=update;input.onkeydown=e=>{if(['ArrowDown','ArrowUp'].includes(e.key)&&rows.length){e.preventDefault();selection((index+(e.key==='ArrowDown'?1:-1)+rows.length)%rows.length);}else if(e.key==='Enter'){e.preventDefault();if(rows.length===1)choose(0);else if(index>=0)choose(index);else if(rows.length)selection(0);}else if(e.key==='Escape'&&input.value){e.preventDefault();e.stopPropagation();input.value='';update();}};
  update();return input;
 }
 function openSearch(query=''){actionDialog.replaceChildren();heading(actionDialog,tx('¿Qué quieres hacer?','What would you like to do?','你想做什么？'));const input=search(actionDialog,'editor');show(actionDialog);if(query){input.value=query;input.dispatchEvent(new Event('input'));}input.focus();}
 function requirement(a){if(state().kind==='example'&&a.goal&&a.goal!=='review')return 'start';if(a.prerequisite==='geometry'&&!G.geometryReady(project))return 'geometry';if(a.prerequisite==='image'&&!facts().imagesReady)return 'image';return null;}
 function setGoal(goal,{targetType,targetRoomId}={}){const s=state();s.goal=goal;s.manualTask=false;delete s.targetType;delete s.targetRoomId;if(targetType)s.targetType=targetType;if(targetRoomId)s.targetRoomId=targetRoomId;s.closed=false;const p=progress();s.current=(p.pending[0]||p.current).id;store();render();announce(tx('Objetivo actualizado. Las tareas se adaptan a lo que quieres conseguir.','Goal updated. Tasks adapt to what you want to achieve.','目标已更新。任务会根据目标调整。'));}
 function openGoal(){goalDialog.replaceChildren();heading(goalDialog,tx('Elige tu objetivo','Choose your goal','选择目标'));el('p',tx('Puedes cambiarlo en cualquier momento. Las tareas necesarias se adaptan y conservamos los resultados comprobables.','You can change it at any time. Required tasks adapt and verified results are retained.','可以随时更改。必要任务会调整，已验证结果会保留。'),goalDialog);const l=el('label',tx('Quiero…','I want to…','我想…'),goalDialog),sel=el('select',undefined,l);sel.id='guideGoalSelect';for(const [id,title]of Object.entries(G.goals)){const o=el('option',label(title),sel);o.value=id;}sel.value=state().goal;btn('guideGoalApply',tx('Aplicar objetivo','Apply goal','应用目标'),()=>{setGoal(sel.value);goalDialog.close();},goalDialog,true);show(goalDialog);}
 async function execute(a,fromWelcome=false){
  if(a.id==='upload')return beginUpload();if(a.id==='blank')return createOwn('create');if(a.id==='example')return example();
  if(fromWelcome)closeWelcome();
  if(a.id==='presentation')return window.FloorPlanPresentation?.open();
  if(a.id==='missing'){state().closed=false;render();return openDetails();}
  if((a.goal&&state().goal!==a.goal)||a.targetType){const targetRoom=a.roomHint&&project.rooms.find(r=>G.normalize(nm(r.name)).includes(a.roomHint==='bedroom'?LANG==='en'?'bed':'dorm':LANG==='en'?'kitchen':'cocina'));setGoal(a.goal,{targetType:a.targetType,targetRoomId:targetRoom?.id});if(targetRoom)select({kind:'room',id:targetRoom.id});}
  const block=requirement(a);if(block){if(block==='start')afterCopy=a;state().current=block;state().closed=false;store();render();return openDetails(block);}
  switch(a.id){
   case 'scale':return runTask(progress().tasks.find(t=>t.id==='scale')||{id:'scale',action:'scale',blockers:[]});
   case 'furniture':await setView('2d');if(!ui.sel||ui.sel.kind!=='room'){const room=project.rooms.find(r=>r.id===state().targetRoomId)||project.rooms[0];if(room)select({kind:'room',id:room.id});}libSearch.query=a.filter||'';libSearch.room='';libSearch.family='';$('#furnitureSearch').value=libSearch.query;$('#searchRoom').value=$('#searchFamily').value='';renderLibResults();window.FloorPlanBuildPalette?.select('furnish');drawer('lib',true);$('#furnitureSearch').focus();state().current='furniture';break;
   case '3d':state().current='view3d';await setView('3d');if(is3D())record('view3d');break;
   case 'save':state().current='save';if(save())announce(tx('Proyecto guardado en este navegador. Exporta una copia para otro dispositivo.','Project saved in this browser. Export a copy for another device.','项目已保存在此浏览器。请导出副本以在其他设备使用。'));break;
   case 'export':state().current='export';exportPNG();break;
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
 function renderDetails(){const scroll=details.scrollTop;details.replaceChildren();heading(details,tx('Tu recorrido','Your journey','你的流程'));const p=progress();el('p',summary(p),details);el('p',tx('Las opcionales no bloquean el objetivo. Puedes volver a cualquier etapa o explorar el editor.','Optional tasks do not block your goal. Return to any stage or explore the editor.','可选任务不会阻止完成目标。可返回任何阶段或浏览编辑器。'),details);outcome(details,p);
  const list=el('div',undefined,details,'guide-task-list');for(const t of p.tasks){const box=el('article',undefined,list,'guide-task');box.dataset.task=t.id;box.dataset.state=t.status;const meta=el('div',undefined,box,'task-meta');el('span',`${t.stage+1}. ${label(G.stages[t.stage])} · `+label(t.classification==='conditional'?['Condicional · necesaria','Conditional · required','条件任务 · 必要']:t.necessary?['Necesaria','Required','必要']:['Opcional','Optional','可选']),meta);el('b',statusLabel(t),meta);el('h3',label(t.title),box);el('p',label(t.instruction),box);
   if(t.blockers.length)el('p',tx('Antes: ','First: ','先完成：')+t.blockers.map(id=>label(G.definitions[id].title)).join(' · '),box);
   const row=el('div',undefined,box,'actions');btn('guideTask-'+t.id,primaryLabel(t),()=>safe(()=>runTask(t)),row,t.id===p.current.id);
   if(!t.necessary&&t.status!=='completed')btn('guideSkip-'+t.id,t.skipped?tx('Recuperar tarea','Restore task','恢复任务'):tx('Saltar por ahora','Skip for now','暂时跳过'),()=>{const s=state();s.skipped=t.skipped?s.skipped.filter(id=>id!==t.id):[...new Set([...s.skipped,t.id])];const next=p.tasks.find(q=>q.stage>=t.stage&&q.id!==t.id&&q.status!=='completed'&&!s.skipped.includes(q.id));if(next)s.current=next.id;store();render();renderDetails();},row);
   const help=el('details',undefined,box);el('summary',tx('Ver cómo hacerlo','See how to do it','查看操作方法'),help);el('p',t.id==='scale'?tx('Una primera cota deja la escala estimada. La segunda debe ser independiente y concordar con el umbral provisional del 2 %. Confirma después. Las medidas siguen siendo orientativas.','A first dimension gives an estimated scale. A second independent dimension must agree within the provisional 2% threshold. Then confirm. Measurements remain indicative.','第一尺寸仅估算比例。独立的第二尺寸必须符合临时 2% 阈值后再确认。测量仍仅供参考。'):tx('La tarea se marca al comprobar el resultado real. Usa Deshacer para recuperar el último cambio. Puedes acceder a todas las herramientas sin perder el avance.','The task is marked after checking the actual result. Use Undo to restore the last change. All tools remain accessible without losing progress.','检查实际结果后才标记任务。使用撤销恢复上一步。可随时使用全部工具。'),help);
  }
  const row=el('div',undefined,details,'actions');btn('guideAllTools',tx('Ver todas las herramientas','See all tools','查看所有工具'),()=>{details.close();fullEditor=true;state().fullTools=true;store();render();drawer('lib',true);drawer('panel',true);searchBtn.focus();},row);btn('guideSaveNow',tx('Guardar ahora','Save now','立即保存'),()=>safe(()=>execute({id:'save'})),row);btn('guideGoalFromDetails',tx('Cambiar objetivo','Change goal','更改目标'),()=>{details.close();openGoal();},row);
  if(state().journeySkipped?.length)btn('guideRestoreSuggestions',tx('Recuperar sugerencias aplazadas','Bring back put-off suggestions','恢复暂缓的建议'),()=>{state().journeySkipped=[];store();render();renderDetails();},row);btn('guideCopyNow',tx('Exportar copia JSON / ZIP','Export JSON / ZIP copy','导出 JSON / ZIP'),()=>safe(exportCopy),row);
  if(storageError)el('p',storageError,details).setAttribute('role','alert');details.scrollTop=scroll;
 }
 const statusLabel=t=>t.skipped?tx('Saltada por ahora','Skipped for now','暂时跳过'):label(({pending:['○ Pendiente','○ Pending','○ 待完成'],active:['◉ En curso','◉ In progress','◉ 进行中'],completed:['✓ Completada','✓ Complete','✓ 已完成'],review:['! Necesita revisión','! Needs review','! 需要检查']})[t.status]);
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
  if(d.mode==='goal'){const t=d.task;currentTitle.textContent=label(t.title);currentInstruction.textContent=label(t.instruction);currentAction.textContent=primaryLabel(t);currentAction.onclick=()=>safe(()=>runTask(t));presentAction.hidden=p.stage!==4;}
  else if(d.mode==='done-task'){const next=d.next;currentTitle.textContent=tx('Ya hecho: ','Done: ','已完成：')+label(d.task.title);
   currentInstruction.textContent=next?tx('Puedes repasarlo o seguir con lo pendiente.','You can review it or go on with what is left.','可以复查，或继续未完成的任务。'):tx('Tu objetivo está completo. Puedes seguir con la vivienda.','Your goal is complete. You can go on with the home.','目标已完成。可以继续完善住宅。');
   if(next){currentAction.textContent=tx('Seguir con: ','Go on with: ','继续：')+label(next.title);currentAction.onclick=()=>safe(()=>{state().manualTask=false;runTask(next);});}
   else{const r=d.r;currentAction.hidden=!r.primary;if(r.primary){currentAction.textContent=tx('Seguir con: ','Go on with: ','继续：')+label(r.title);currentAction.onclick=()=>safe(()=>{state().manualTask=false;store();runJourney(r.primary.id,r);});}}}
  else{const r=d.r;currentTitle.textContent=label(r.title);currentInstruction.textContent=label(r.text);currentAction.hidden=!r.primary;
   if(r.primary){currentAction.textContent=label(r.primary.label);currentAction.onclick=()=>safe(()=>runJourney(r.primary.id,r));document.body.classList.toggle('next-present',r.primary.id==='present');}
   link(secondaryAction,r.secondary,()=>runJourney(r.secondary.id,r));link(laterAction,r.later,()=>runJourney('later',r));
   if(p.finished){goalDone.hidden=false;goalDone.textContent=tx(`✓ Objetivo «${label(G.goals[p.goal])}» completado · resultados en «Tareas y ayuda»`,`✓ Goal “${label(G.goals[p.goal])}” complete · results in “Tasks & help”`,`✓ 目标“${label(G.goals[p.goal])}”已完成 · 结果见“任务及帮助”`);}}
  // The example line offers the copy; when the copy is the guide's own button, the line would only repeat it.
  exampleLine.hidden=s.kind!=='example'||d.mode==='journey'&&d.r?.primary?.id==='copy';exampleNote.textContent=tx('Exploras el ejemplo. Crea una copia para tu proyecto.','You are exploring the example. Create a copy for your project.','正在浏览示例。请创建自己的副本。');$('#guideCopyExample').textContent=tx('Crear a partir del ejemplo →','Create from example →','从示例创建 →');
  presentAction.textContent=tx('Presentar mi vivienda','Present my home','展示我的住宅');
  // One presentation entry at a time: while the guide row offers it, the guided header does not repeat it.
  document.body.classList.toggle('next-present',document.body.classList.contains('next-present')||!presentAction.hidden);
  const tasks=p.tasks.filter(t=>!t.skipped),first=tasks.findIndex(t=>t.id===p.current.id)<=0,prev=$('#guidePrevious');prev.disabled=first;prev.title=first?tx('Es la primera tarea de tu objetivo','This is the first task of your goal','这是目标的第一个任务'):'';
 }
 function render(){
  const s=state(),p=progress(),showOutcome=p.finished&&!s.manualTask;projectLabel.textContent=s.kind==='example'?tx('Proyecto de ejemplo','Example project','示例项目'):project.name;projectLabel.title=projectLabel.textContent;goalLabel.textContent=label(G.goals[s.goal]);goalLabel.title=goalLabel.textContent;
  searchBtn.textContent=tx('⌕ ¿Qué quieres hacer?','⌕ What would you like to do?','⌕ 你想做什么？');resume.textContent=tx('Recuperar guía','Resume guide','恢复指南');bar.hidden=s.closed||s.fullTools||fullEditor;resume.hidden=!bar.hidden;document.body.classList.toggle('guided',!bar.hidden);
  homeBtn.textContent=tx('← Inicio','← Home','← 首页');homeBtn.title=tx('Volver al inicio sin perder el proyecto','Return home without losing the project','返回首页并保留项目');
  $('#guidePrevious').textContent=tx('← Paso anterior','← Previous step','← 上一步');
  $('#guideGoalChange').textContent=tx('Cambiar objetivo','Change goal','更改目标');$('#guideDetails').textContent=tx('Tareas y ayuda','Tasks & help','任务及帮助');$('#guideClose').textContent='×';$('#guideClose').setAttribute('aria-label',tx('Cerrar guía','Close guide','关闭指南'));
  progressText.textContent=summary(p);meter.setAttribute('aria-valuenow',String(p.percent));meter.setAttribute('aria-label',summary(p));fill.style.width=p.percent+'%';optionalText.textContent=tx(`Opcionales ${p.optionalDone}/${p.optionalTotal}`,`Optional ${p.optionalDone}/${p.optionalTotal}`,`可选 ${p.optionalDone}/${p.optionalTotal}`);
  for(const [i,b]of [...steps.querySelectorAll('button')].entries()){b.querySelector('.step-label').textContent=label(G.stages[i]);if(i===p.stage)b.setAttribute('aria-current','step');else b.removeAttribute('aria-current');b.title=label(G.stages[i]);}
  renderNext(s,p);
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
 // Entry URL means welcome; #editor reload resumes. Project persistence is independent of the screen.
 sync();if(location.hash!=='#legal-y-uso'){
  const screen=location.hash==='#editor'?'editor':'welcome';setRoute(screen,true);if(screen==='welcome')openWelcome(false);
 }
 // The columns are not forced here: drawer(null) in the editor restores the person's last choice, and with none
 // they are open on desktop. On narrow screens they are drawers and start closed.
 addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();if(!dialogs.some(d=>d.open))openSearch();}});
})();
