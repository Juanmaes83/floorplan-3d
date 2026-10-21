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
 const essentials=new Set(['uploadPlanBtn','uploadCancel','paneBtns','viewSeg','projectsBtn','langBtn','actionSearchBtn','welcomeBtn','guideResume']);
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
  if(index<=0)return openWelcome();state().current=tasks[index-1].id;state().manualTask=true;store();render();
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
  el('p',tx('Tu espacio, paso a paso','Your space, step by step','一步一步设计空间'),left,'welcome-eyebrow');const h=el('h1',tx('¿Qué quieres hacer?','What would you like to do?','你想做什么？'),left);h.id='welcomeDialogTitle';
  el('p',tx('Dibuja tu distribución, prueba muebles y recorre tu idea en 3D. Te acompañamos desde el primer paso.','Draw your layout, try furniture and explore your idea in 3D. We guide you from the first step.','绘制布局、尝试家具并在 3D 中浏览。从第一步开始提供指南。'),left,'lead');
  el('p',tx('Obtendrás un plano 2D editable y su vista 3D, guardados en este navegador. Las medidas son orientativas: no sustituyen a una medición profesional.','You get an editable 2D plan and its 3D view, stored in this browser. Measurements are indicative, not a professional survey.','你将得到可编辑的 2D 平面图及其 3D 视图，保存在此浏览器中。尺寸仅供参考，不能替代专业测量。'),left,'welcome-result');
  const figure=el('figure',undefined,intro,'welcome-visual');el('span',tx('2D → 3D · A tu ritmo','2D → 3D · At your pace','2D → 3D · 按自己的节奏'),figure,'visual-tag');drawExample(figure);el('figcaption',tx('Proyecto de ejemplo · explora antes de empezar','Example project · explore before starting','示例项目 · 开始前先探索'),figure);
  const entries=el('div',undefined,shell,'welcome-entries');
  for(const [id,icon,title,description,fn]of [
   ['welcomeUpload','↑',['Subir un plano','Upload a floor plan','上传平面图'],['Si ya tienes un plano: PDF, imagen, DXF, IFC, RoomPlan o proyecto JSON/ZIP. Revisarás el resultado antes de usarlo; las imágenes se calibran con una medida conocida.','If you already have a plan: PDF, image, DXF, IFC, RoomPlan or a JSON/ZIP project. You review the result before using it; images are calibrated with a known measurement.','如果已有平面图：PDF、图片、DXF、IFC、RoomPlan 或 JSON/ZIP 项目。使用前先检查结果；图片需用已知尺寸校准。'],()=>beginUpload()],
   ['welcomeBlank','+',['Crear desde cero','Create from scratch','从零创建'],['Proyecto vacío: añade estancias indicando ancho y fondo, o dibújalas sobre el plano.','An empty project: add rooms by width and depth, or draw them on the plan.','空项目：输入宽度和进深添加房间，或在平面图上绘制。'],()=>createOwn('create')],
   ['welcomeExample','◇',['Probar el ejemplo','Try the example','试用示例'],['Explora en 2D y 3D una vivienda ya preparada. Para guardar cambios como tuyos, crea una copia.','Explore a prepared home in 2D and 3D. To keep changes as yours, create a copy.','在 2D 和 3D 中浏览准备好的住宅。要保存为自己的修改，请创建副本。'],()=>example()]
  ]){const b=btn(id,'',()=>safe(fn),entries);b.className='welcome-entry';el('span',icon,b,'entry-icon').setAttribute('aria-hidden','true');el('strong',label(title),b);el('span',label(description),b);}
  const audienceSection=el('section',undefined,shell,'welcome-audience');
  const audienceTitle=el('h2',tx('¿En qué trabajas?','What is your field?','你的工作领域是什么？'),audienceSection);audienceTitle.id='welcomeAudienceTitle';
  el('p',tx('Opcional. Elige tu perfil para identificarte; las herramientas son las mismas para todos.','Optional. Choose your field; everyone has access to the same tools.','可选。选择你的领域；所有人使用相同的工具。'),audienceSection);
  const audienceOptions=el('div',undefined,audienceSection,'welcome-audience-options');audienceOptions.setAttribute('role','group');audienceOptions.setAttribute('aria-labelledby',audienceTitle.id);
  for(const [id,names] of audiences){const option=btn('welcomeAudience-'+id,label(names),()=>{
   audience=audience===id?'':id;
   try{if(audience)originalStorage.setItem(audienceKey,audience);else originalStorage.removeItem(audienceKey);}catch{}
   for(const node of audienceOptions.children)node.setAttribute('aria-pressed',String(node.id==='welcomeAudience-'+audience));
  },audienceOptions);option.classList.add('welcome-audience-option');option.setAttribute('aria-pressed',String(audience===id));}
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
  const row=el('div',undefined,details,'actions');btn('guideAllTools',tx('Ver todas las herramientas','See all tools','查看所有工具'),()=>{details.close();fullEditor=true;state().fullTools=true;store();render();drawer('lib',true);drawer('panel',true);searchBtn.focus();},row);btn('guideSaveNow',tx('Guardar ahora','Save now','立即保存'),()=>safe(()=>execute({id:'save'})),row);btn('guideCopyNow',tx('Exportar copia JSON / ZIP','Export JSON / ZIP copy','导出 JSON / ZIP'),()=>safe(exportCopy),row);
  if(storageError)el('p',storageError,details).setAttribute('role','alert');details.scrollTop=scroll;
 }
 const statusLabel=t=>t.skipped?tx('Saltada por ahora','Skipped for now','暂时跳过'):label(({pending:['○ Pendiente','○ Pending','○ 待完成'],active:['◉ En curso','◉ In progress','◉ 进行中'],completed:['✓ Completada','✓ Complete','✓ 已完成'],review:['! Necesita revisión','! Needs review','! 需要检查']})[t.status]);
 function summary(p){return tx(`${p.percent} % completado · ${p.done} de ${p.required} tareas necesarias listas`,`${p.percent}% complete · ${p.done} of ${p.required} required tasks ready`,`${p.percent}% 已完成 · ${p.done}/${p.required} 必要任务完成`);}
 function record(kind,rev=G.revision(project)){state().evidence[kind]=rev;store();render();}
 function render(){
  const s=state(),p=progress(),showOutcome=p.finished&&!s.manualTask;projectLabel.textContent=s.kind==='example'?tx('Proyecto de ejemplo','Example project','示例项目'):project.name;projectLabel.title=projectLabel.textContent;goalLabel.textContent=label(G.goals[s.goal]);goalLabel.title=goalLabel.textContent;
  searchBtn.textContent=tx('⌕ ¿Qué quieres hacer?','⌕ What would you like to do?','⌕ 你想做什么？');resume.textContent=tx('Recuperar guía','Resume guide','恢复指南');bar.hidden=s.closed||s.fullTools||fullEditor;resume.hidden=!bar.hidden;document.body.classList.toggle('guided',!bar.hidden);
  homeBtn.textContent=tx('← Inicio','← Home','← 首页');homeBtn.title=tx('Volver al inicio sin perder el proyecto','Return home without losing the project','返回首页并保留项目');
  $('#guidePrevious').textContent=tx('← Paso anterior','← Previous step','← 上一步');
  $('#guideGoalChange').textContent=tx('Cambiar objetivo','Change goal','更改目标');$('#guideDetails').textContent=tx('Tareas y ayuda','Tasks & help','任务及帮助');$('#guideClose').textContent='×';$('#guideClose').setAttribute('aria-label',tx('Cerrar guía','Close guide','关闭指南'));
  progressText.textContent=summary(p);meter.setAttribute('aria-valuenow',String(p.percent));meter.setAttribute('aria-label',summary(p));fill.style.width=p.percent+'%';optionalText.textContent=tx(`Opcionales ${p.optionalDone}/${p.optionalTotal}`,`Optional ${p.optionalDone}/${p.optionalTotal}`,`可选 ${p.optionalDone}/${p.optionalTotal}`);
  for(const [i,b]of [...steps.querySelectorAll('button')].entries()){b.querySelector('.step-label').textContent=label(G.stages[i]);if(i===p.stage)b.setAttribute('aria-current','step');else b.removeAttribute('aria-current');b.title=label(G.stages[i]);}
  currentTitle.textContent=showOutcome?tx('✓ Objetivo completado','✓ Goal complete','✓ 目标已完成'):label(p.current.title);currentInstruction.textContent=showOutcome?saved()?tx('Guardado en este navegador. Exporta una copia para conservarlo fuera.','Saved in this browser. Export a copy to keep it elsewhere.','保存在此浏览器。请导出副本以在其他位置保存。'):tx('Resultado listo. Confirma el guardado local.','Result ready. Confirm local saving.','结果已准备。请确认本地保存。'):p.current.blockers.length?tx('Antes: ','First: ','先完成：')+p.current.blockers.map(id=>label(G.definitions[id].title)).join(' · '):label(p.current.instruction);
  currentAction.textContent=showOutcome?tx('Ver resultado y exportar','View result & export','查看结果并导出'):primaryLabel(p.current);currentAction.onclick=()=>safe(()=>showOutcome?openDetails():runTask(p.current));
  presentAction.textContent=tx('Presentar mi vivienda','Present my home','展示我的住宅');presentAction.hidden=p.stage!==4;
  exampleLine.hidden=s.kind!=='example';exampleNote.textContent=tx('Exploras el ejemplo. Crea una copia para tu proyecto.','You are exploring the example. Create a copy for your project.','正在浏览示例。请创建自己的副本。');$('#guideCopyExample').textContent=tx('Crear a partir del ejemplo →','Create from example →','从示例创建 →');
  empty.hidden=G.geometryReady(project)||is3D()||!!project.sourceImages?.length;emptyTitle.textContent=tx('Aquí empieza tu distribución','Your layout starts here','从这里开始布局');emptyText.textContent=tx('Crea tu primera estancia con dimensiones interiores o utiliza el trazado manual.','Create your first room with interior dimensions or use manual drawing.','输入内部尺寸创建房间，或手动绘图。');$('#guideEmptyAction').textContent=tx('Crear primera estancia','Create first room','创建第一个房间');
  const completed=p.tasks.filter(t=>t.status==='completed').map(t=>t.id);s.completed=[...new Set([...s.completed,...completed])];
  if(lastResult&&lastResult.projectId===project.id){const done=p.tasks.filter(t=>t.status==='completed'&&!lastResult.done.includes(t.id));if(done.length)announcement.textContent=label(done[0].title)+tx(' · Resultado comprobado. ',' · Result verified. ',' · 结果已验证。')+(p.pending[0]?tx('Te queda: ','Next: ','下一步：')+label(p.pending[0].title):tx('Objetivo completado.','Goal complete.','目标已完成。'));}
  lastResult={projectId:project.id,done:completed};if(details.open)renderDetails();
 }
 function sync(){const id=library?.activeId()||project.id,s=state();if(s.fullTools)fullEditor=true;if(fullEditor)s.fullTools=true;if(currentId!==id||s.projectId!==project.id){currentId=id;lastResult=null;if(pendingEntry&&!pendingIds.includes(id)){Object.assign(s,pendingEntry);s.origin=project.sourceImages?.length?'image':entryOrigin||s.origin;s.current='geometry';pendingEntry=null;entryOrigin=null;}if(s.kind==='example'&&project.sourceImages?.length)s.kind='own';}
  const old=lastSnapshot;lastSnapshot=JSON.stringify([id,project,LANG,facts(),s.goal,s.current]);if(old===lastSnapshot)return;
  const p=progress();if(p.current.status==='completed'&&!s.manualTask){s.current=(p.pending[0]||p.current).id;}render();store();
 }
 window.FloorPlanGuideUI={sync,progress,state,record,captureImport,importRouteCurrent,imported,openWelcome,openSearch,openDetails,execute,setGoal,returnFromRoom,roomCommitted(){roomReturnToWelcome=false;}};
 addEventListener('floorplan-view-ready',()=>record('view3d'));
 addEventListener('floorplan-export-ready',e=>{if(e.detail.projectId===project.id&&e.detail.revision===G.revision(project)){state().exportName=e.detail.filename;record('export',e.detail.revision);}});
 addEventListener('floorplan-images-ready',sync);
 // Entry URL means welcome; #editor reload resumes. Project persistence is independent of the screen.
 sync();if(location.hash!=='#legal-y-uso'){
  const screen=location.hash==='#editor'?'editor':'welcome';setRoute(screen,true);if(screen==='welcome')openWelcome(false);
 }
 drawer('lib',false);drawer('panel',false);
 addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();if(!dialogs.some(d=>d.open))openSearch();}});
})();
