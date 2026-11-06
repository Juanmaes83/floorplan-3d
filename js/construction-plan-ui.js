/* FT3D-8 · M2 (S4-C): Presupuestar → Plan de obra. Editor of the construction plan of the OPEN project, persisted in
   its construction record. The schedule engine (FloorPlanConstructionSchedule 0.2.0) validates every change and
   never moves a date: a broken dependency is explained and the professional fixes it. Tasks link to real elements
   of the saved project (roles allowed by the FT3D-8 rules) and to budget items with explicit percentages (never above
   100 %, never repeated). One links index serves the three directions: item → tasks/elements, task → items/elements,
   element → tasks. A review is a declaration, never an authenticated approval. */
(function(){
 'use strict';
 const C=window.FloorPlanConstructionContext,R=window.FloorPlanConstructionRecord,A=window.FloorPlanConstructionProject,S=window.FloorPlanConstructionSchedule,B=window.FloorPlanBudget;
 if(!C||!R||!A||!S||!B)return;
 const el=(tag,text,parent,cls)=>{const n=document.createElement(tag);if(text!==undefined&&text!==null)n.textContent=text;if(cls)n.className=cls;parent?.append(n);return n;};
 const btn=(text,parent,cls='btn')=>{const b=el('button',text,parent,cls);b.type='button';return b;};
 const chip=(text,parent,tone='')=>el('span',text,parent,'cx-chip'+(tone?' '+tone:''));
 const pct=v=>v.toLocaleString('es-ES',{maximumFractionDigits:2})+' %';
 const DEP={FS:'Fin → inicio',SS:'Inicio → inicio',FF:'Fin → fin',SF:'Inicio → fin'};
 const {eur,day,short}=C;
 const DAY=86400000,ms=d=>Date.parse(d+'T00:00:00Z'),days=(a,b)=>Math.round((ms(b)-ms(a))/DAY)+1;

 let nowF=null,snap=null,inv=null,byKey=new Map(),money=null,draft=null,dirty=false,tab='tasks',focus={},editing=null,closing=false,review=false,message='',error='';
 const dialog=el('dialog',undefined,document.body,'cx-dialog');dialog.id='planDialog';dialog.setAttribute('aria-labelledby','planTitle');
 dialog.addEventListener('cancel',e=>{if(dirty){e.preventDefault();closing=true;draw();}});

 /* ---------- data ---------- */
 const stored=()=>snap.record?.schedule||null;
 const tasks=()=>draft?draft.tasks:[];
 const task=id=>tasks().find(t=>t.id===id);
 function budgetNow(){const b=C.budgetFor(snap.subject);if(b.kind!=='project'||!b.budget)return {kind:b.kind,levels:b.levels||null,budget:null,calc:null,report:null};
  const calc=B.calculateBudget(b.budget);let report=null,reportError=null;
  if(draft&&draft.tasks.length){try{report=S.budgetReport(asStored(),b.budget,B);}catch(e){reportError=e.message;}}
  return {kind:'project',budget:b.budget,calc,report,reportError};}
 // The rich (canonical) working copy, stored in the 0.1-compatible shape the engine produces.
 const asStored=(d=draft,revision)=>S.validate({...d,projectRef:{...d.projectRef,...(revision?{revision}:{})}});
 function change(fn,okText='',{silent=false}={}){
  // Every change is checked by the engine before it is kept; a reviewed plan goes back to draft (its binding becomes obsolete).
  const next=structuredClone(draft);fn(next);if(next.review.status==='reviewed')next.review={status:'draft',by:null,at:null};
  try{draft=S.canonical(S.validate(next));}catch(e){error=explain(e.message);if(!silent)draw();return false;}
  dirty=true;error='';message=okText;money=budgetNow();draw();return true;
 }
 // Engine messages → plain Spanish, with what to do. Dates are never changed for the professional.
 function explain(msg){
  const title=id=>task(id)?.title||id;let m;
  if((m=/dependency (\S+) -> (\S+) \((\w\w)([+-]\d+)d\) violated by (\d+) day/.exec(msg)))return `«${title(m[2])}» no cumple su dependencia con «${title(m[1])}» (${DEP[m[3]]}${+m[4]?`, desfase ${m[4]} días`:''}): le faltan ${m[5]} ${m[5]==='1'?'día':'días'}. Ajusta las fechas; RUBIK no las mueve por ti.`;
  if(/dependency cycle/.test(msg))return 'Las dependencias forman un ciclo: una tarea no puede depender, directa o indirectamente, de sí misma.';
  if(/self-dependency/.test(msg))return 'Una tarea no puede depender de sí misma.';
  if(/ends before its start/.test(msg))return 'La fecha de fin es anterior a la de inicio.';
  if(/beyond 100/.test(msg))return 'Esa partida superaría el 100 % repartido entre tareas: un importe no puede contarse dos veces.';
  if(/YYYY-MM-DD|real calendar date/.test(msg))return 'Introduce una fecha de inicio y una de fin válidas.';
  if(/assigned to both/.test(msg))return 'Ese elemento ya tiene ese mismo papel en otra tarea. Elige otro papel o quítalo de la otra tarea.';
  if(/sharePercent/.test(msg))return 'El porcentaje debe ser mayor que 0 y como máximo 100, con dos decimales como máximo.';
  if(/lagDays/.test(msg))return 'El desfase debe ser un número entero de días.';
  if(/title|wbs|non-empty/.test(msg))return 'Completa el título y el código de la tarea.';
  if(/duplicate task/.test(msg))return 'Ya existe una tarea con ese identificador.';
  return msg;
 }
 const brokenLinks=()=>tasks().flatMap(t=>t.elements.filter(e=>!e.elementId.startsWith(A.ILLUSTRATIVE_PREFIX)&&!byKey.has(e.elementId)).map(e=>({taskId:t.id,elementId:e.elementId})));
 const unknownItems=()=>{const ids=new Set(money?.budget?.items.map(i=>i.id)||[]);return money?.kind==='project'&&money.budget?tasks().flatMap(t=>t.budgetAllocations.filter(a=>!ids.has(a.itemId)).map(a=>({taskId:t.id,itemId:a.itemId}))):[];};

 /* ---------- open / save ---------- */
 async function open({tab:t='tasks',taskId=null,itemId=null,elementKey=null}={}){
  snap=await C.snapshot();nowF=await C.nowFingerprints(snap);inv=A.inventory(snap.doc);byKey=new Map(inv.elements.map(e=>[e.key,e]));
  draft=stored()?S.canonical(stored()):null;dirty=false;editing=null;closing=false;review=false;message='';error=snap.recordError?R.human(snap.recordError):'';
  money=budgetNow();tab=t;focus={taskId,itemId,elementKey};draw();if(!dialog.open)dialog.showModal();
  (dialog.querySelector('.is-focus button, .is-focus')||dialog.querySelector('#planTitle')).focus({preventScroll:false});
  dialog.querySelector('.is-focus')?.scrollIntoView({block:'center'});
 }
 async function save({quiet=false}={}){
  if(brokenLinks().length){error='Hay tareas vinculadas a elementos que ya no existen en el proyecto. Quítalos antes de guardar (pestaña Comprobaciones).';tab='checks';draw();return false;}
  if(unknownItems().length){error='Hay tareas con partidas que ya no están en el presupuesto. Quítalas antes de guardar (pestaña Comprobaciones).';tab='checks';draw();return false;}
  try{
   snap=await C.snapshot();
   // Saving declares the plan for the CURRENT revision of the project: the professional has just reviewed it.
   const doc=asStored(draft,snap.revision);C.store().saveSchedule(snap.entry.id,snap.subject,doc,{action:stored()?'save':'create'});
   snap=await C.snapshot();nowF=await C.nowFingerprints(snap);draft=S.canonical(stored());dirty=false;error='';if(!quiet)message=`Plan guardado para la revisión ${short(snap.revision)} del proyecto.`;money=budgetNow();draw();return true;
  }catch(e){error=R.human(e);draw();return false;}
 }
 async function markReviewed(by){
  if(!by.trim()){error='Escribe quién declara la revisión.';draw();return;}
  draft={...draft,review:{status:'reviewed',by:by.trim(),at:new Date().toISOString()}};dirty=true;
  if(!await save({quiet:true}))return;
  try{const s=stored(),b=money.kind==='project'?money.budget:null;
   const binding=A.createBinding({id:R.newId('bnd'),source:snap.doc,fingerprints:{project:snap.revision,schedule:await A.fingerprint(S.validate(s)),budget:b?await A.fingerprint(b):null},
    scheduleId:s.id,budgetId:b?.id||null,review:{status:'reviewed',by:by.trim(),at:s.review.at},createdAt:new Date().toISOString()});
   C.store().saveBinding(snap.entry.id,snap.subject,binding);snap=await C.snapshot();nowF=await C.nowFingerprints(snap);review=false;message='Plan marcado como revisado. Es tu declaración: RUBIK no la convierte en una aprobación firmada.';draw();
  }catch(e){error=R.human(e);draw();}
 }
 function close(force=false){if(dirty&&!force){closing=true;draw();return;}dialog.close();}

 /* ---------- drawing ---------- */
 function draw(){
  const scrollTop=dialog.querySelector('.cx-body')?.scrollTop||0;dialog.replaceChildren();
  const head=el('div',undefined,dialog,'cx-head'),hl=el('div',undefined,head);const h=el('h2','Plan de obra',hl);h.id='planTitle';h.tabIndex=-1;
  const sub=el('p',undefined,hl,'cx-subject');sub.id='planSubject';el('b',snap.entry.name,sub);
  el('span',`${snap.subject.type==='building'?'Edificio':'Proyecto'} · revisión ${short(snap.revision)}${snap.level?' · planta activa: '+snap.level.name:''}`,sub);
  const corr=R.correspondence(snap.record,nowF?R.nowOf(snap.subject,nowF):{subject:snap.subject,revision:snap.revision}),plan=corr.find(c=>c.aspect==='plan'),rev=corr.find(c=>c.aspect==='review');
  if(draft){chip(draft.review.status==='reviewed'?'Revisado (declarado)':'Borrador',sub,draft.review.status==='reviewed'?'ok':'');if(plan.result==='obsolete'&&!dirty)chip('Plan desactualizado',sub,'warn');if(rev.result==='obsolete')chip('Revisión anterior desactualizada',sub,'warn');if(dirty)chip('Cambios sin guardar',sub,'info');}
  if(snap.duplicate)chip('Identidad duplicada en la biblioteca',sub,'bad');
  const x=btn('Cerrar',head);x.id='planClose';x.onclick=()=>close();
  const body=el('div',undefined,dialog,'cx-body');
  if(snap.duplicate)banner(body,'bad','Este documento está dos veces en tu biblioteca','RUBIK no mezcla sus datos: el plan se guarda solo para esta entrada. Si es una copia, usa «Duplicar» en la biblioteca para darle identidad propia.');
  if(!draft){empty(body);}else{
   if(plan.result==='obsolete'&&!dirty)banner(body,'warn','El proyecto ha cambiado desde que se guardó este plan',`Revisión del plan ${short(plan.expected)} · revisión actual ${short(plan.current)}. Revisa los vínculos con elementos (pestaña Comprobaciones) y guarda el plan para declararlo sobre la revisión actual.`);
   if(snap.subject.type==='building')banner(body,'','Edificio de varias plantas','Las tareas pueden vincular elementos de todas las plantas. RUBIK guarda un presupuesto por planta y todavía no tiene presupuesto de edificio: los importes se consultan por planta y no se reparten entre las tareas del edificio.');
   plans(body);tabs(body);
   ({tasks:tasksTab,items:itemsTab,elements:elementsTab,checks:checksTab})[tab](body);
  }
  const foot=el('div',undefined,dialog,'cx-foot');
  const st=el('p',message,foot,'cx-status cx-grow');st.id='planStatus';st.setAttribute('role','status');st.setAttribute('aria-live','polite');
  const er=el('p',error,foot,'cx-err cx-grow');er.id='planError';er.setAttribute('role','alert');
  if(closing){el('span','Tienes cambios sin guardar.',foot);const sv=btn('Guardar y cerrar',foot,'btn primary');sv.id='planSaveClose';sv.onclick=async()=>{if(await save())close(true);};
   const ds=btn('Descartar cambios',foot);ds.id='planDiscard';ds.onclick=()=>{dirty=false;close(true);};const k=btn('Seguir editando',foot);k.onclick=()=>{closing=false;draw();};}
  else if(draft){
   const sv=btn('Guardar plan',foot,'btn primary');sv.id='planSave';sv.disabled=!dirty&&plan.result==='match';sv.onclick=()=>save();
   const rv=btn(draft.review.status==='reviewed'&&!dirty?'Revisado':'Marcar como revisado…',foot);rv.id='planReview';rv.disabled=!draft.tasks.length;rv.onclick=()=>{review=!review;draw();};
   const ev=btn('Ver evolución',foot);ev.id='planEvolution';ev.disabled=!stored();ev.onclick=async()=>{if(dirty){error='Guarda el plan antes de ver su evolución.';draw();return;}dialog.close();await window.FloorPlanConstructionUI.openEvolution();};
   const ex=btn('Exportar plan (JSON)',foot);ex.id='planExport';ex.disabled=!stored();ex.onclick=()=>download(new Blob([S.serialize(stored())],{type:'application/json'}),`plan-de-obra-${(snap.entry.name||'proyecto').replace(/[^\w]+/g,'-').toLowerCase()}.json`);
  }
  if(review&&draft&&!closing){const f=el('div',undefined,foot,'cx-form');f.style.flexBasis='100%';el('h3','Declarar la revisión del plan',f);
   el('p','Indica quién ha revisado fechas, dependencias, elementos y repartos. Es una declaración, no una firma autenticada: si cambias el plan, la revisión queda desactualizada.',f,'cx-banner');
   const lab=el('label',undefined,f,'cx-field');el('span','Revisado por',lab);const who=el('input',undefined,lab);who.id='planReviewer';who.autocomplete='name';
   const ok=btn('Marcar como revisado',f,'btn primary');ok.id='planReviewConfirm';ok.onclick=()=>markReviewed(who.value);setTimeout(()=>who.focus(),0);}
  const nb=dialog.querySelector('.cx-body');if(nb)nb.scrollTop=scrollTop;
 }
 function banner(parent,tone,title,text){const b=el('div',undefined,parent,'cx-banner'+(tone?' '+tone:''));el('b',title,b);el('span',text,b);return b;}
 function empty(body){
  const e=el('div',undefined,body,'cx-empty');e.id='planEmpty';el('h3',`Todavía no hay plan de obra para «${snap.entry.name}»`,e);
  el('p','Crea las tareas con sus fechas, dependencias, elementos del proyecto y partidas del presupuesto. RUBIK no inventa fechas: las pones tú.',e);
  const f=el('div',undefined,e,'cx-row');f.style.maxWidth='520px';f.style.margin='12px auto';const lab=el('label',undefined,f,'cx-field');el('span','Nombre del plan',lab);const name=el('input',undefined,lab);name.id='planName';name.value='Plan de obra';
  const go=btn('Crear plan',e,'btn primary');go.id='planCreate';go.onclick=()=>{draft=S.canonical(S.create({id:R.newId('sch'),projectRef:{type:snap.subject.type,id:snap.subject.id,revision:snap.revision},source:name.value.trim()||'Plan de obra',tasks:[]}));dirty=true;message='Plan creado. Añade sus tareas y guárdalo.';draw();dialog.querySelector('#planAddTask')?.focus();};
  const imp=el('label',undefined,e,'btn');imp.textContent='Importar plan (JSON)';imp.style.marginLeft='8px';const file=el('input',undefined,imp);file.type='file';file.accept='.json,application/json';file.hidden=true;file.id='planImport';
  file.onchange=async()=>{const f0=file.files[0];file.value='';if(!f0)return;try{const s=S.parse(await f0.text());
   // Identity by type + id: a plan of another project is refused (never matched by task names).
   if(s.projectRef.type!==snap.subject.type||s.projectRef.id!==snap.subject.id)throw Error(`El plan pertenece a otro proyecto (${s.projectRef.type} ${s.projectRef.id}): no se importa.`);
   draft=S.canonical(s);dirty=true;message=s.projectRef.revision===snap.revision?'Plan importado. Revísalo y guárdalo.':'Plan importado de otra revisión del proyecto: revisa sus vínculos antes de guardarlo.';error='';draw();}catch(err){error=/^El plan/.test(err.message)?err.message:'No es un plan de obra de RUBIK válido: '+explain(err.message);draw();}};
 }
 function plans(body){
  const list=snap.record?.plans||[];if(list.length<1&&!stored())return;
  const row=el('div',undefined,body,'cx-row');row.style.alignItems='end';row.style.marginBottom='10px';
  const lab=el('label',undefined,row,'cx-field');el('span','Plan seleccionado',lab);const sel=el('select',undefined,lab);sel.id='planSelect';
  for(const p of list){const o=el('option',`${p.source} · ${p.tasks.length} tareas${p.id===snap.record.selectedScheduleId?' (en uso)':''}`,sel);o.value=p.id;}
  if(draft&&!list.some(p=>p.id===draft.id)){const o=el('option',`${draft.source} · sin guardar`,sel);o.value=draft.id;}
  sel.value=draft?.id||'';sel.onchange=()=>{if(dirty){error='Guarda o descarta los cambios antes de cambiar de plan.';sel.value=draft.id;draw();return;}const p=list.find(x=>x.id===sel.value);if(p){draft=S.canonical(p);money=budgetNow();message='';draw();}};
  const bx=el('div',undefined,row);bx.style.display='flex';bx.style.gap='6px';bx.style.flexWrap='wrap';
  if(draft&&stored()&&draft.id!==snap.record.selectedScheduleId&&list.some(p=>p.id===draft.id)){const use=btn('Usar este plan',bx,'btn primary');use.id='planUse';use.onclick=async()=>{C.store().selectSchedule(snap.entry.id,snap.subject,draft.id);snap=await C.snapshot();message='Este plan es ahora el que usan Evolución y Entregar.';draw();};}
  const dup=btn('Duplicar plan',bx);dup.id='planDuplicate';dup.disabled=dirty||!list.some(p=>p.id===draft?.id);dup.onclick=()=>{try{const copy=R.duplicateSchedule(list.find(p=>p.id===draft.id),{id:R.newId('sch'),title:draft.source+' (copia)'});
   C.store().saveSchedule(snap.entry.id,snap.subject,copy,{action:'duplicate',select:false});C.snapshot().then(s=>{snap=s;draft=S.canonical(copy);message='Copia guardada como borrador. El plan en uso no cambia hasta que elijas «Usar este plan».';draw();});}catch(e){error=R.human(e);draw();}};
 }
 function tabs(body){
  const nItems=money.kind==='project'&&money.budget?money.budget.items.length:0,issues=brokenLinks().length+unknownItems().length;
  const bar=el('div',undefined,body,'cx-tabs');bar.setAttribute('role','tablist');bar.setAttribute('aria-label','Vistas del plan');
  for(const [k,label] of [['tasks',`Tareas (${tasks().length})`],['items',`Partidas (${nItems})`],['elements',`Elementos (${inv.elements.filter(e=>e.type!=='object').length})`],['checks',`Comprobaciones${issues?' ('+issues+')':''}`]]){
   const b=btn(label,bar,'');b.setAttribute('role','tab');b.id='planTab-'+k;b.setAttribute('aria-selected',String(tab===k));b.tabIndex=tab===k?0:-1;b.onclick=()=>{tab=k;editing=null;focus={};draw();dialog.querySelector('#planTab-'+k).focus();};
   b.onkeydown=e=>{const keys=['tasks','items','elements','checks'],i=keys.indexOf(tab);if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();tab=keys[(i+(e.key==='ArrowRight'?1:3))%4];editing=null;draw();dialog.querySelector('#planTab-'+tab).focus();}};}
 }

 /* ---------- Tareas ---------- */
 function tasksTab(body){
  const bar=el('div',undefined,body);bar.style.cssText='display:flex;gap:8px;flex-wrap:wrap;margin:0 0 10px';
  const add=btn('Añadir tarea',bar,'btn primary');add.id='planAddTask';add.onclick=()=>{editing={id:null,milestone:false};draw();dialog.querySelector('#taskTitle')?.focus();};
  const ms=btn('Añadir hito',bar);ms.id='planAddMilestone';ms.onclick=()=>{editing={id:null,milestone:true};draw();dialog.querySelector('#taskTitle')?.focus();};
  if(editing&&!editing.id)taskForm(body,null);
  if(!tasks().length){el('p','El plan no tiene tareas todavía.',body,'cx-empty');return;}
  const L=R.links(asStored()),wrap=el('div',undefined,body,'cx-scroll'),t=el('table',undefined,wrap,'cx-table');t.id='planTasks';
  const hr=el('tr',undefined,el('thead',undefined,t));for(const x of ['WBS','Tarea','Inicio','Fin','Días','Elementos','Partidas',''])el('th',x,hr).scope='col';
  const tb=el('tbody',undefined,t),lines=money.report?new Map(money.report.byTask.map(x=>[x.taskId,x])):null;
  for(const tk of [...tasks()].sort((a,b)=>a.startDate.localeCompare(b.startDate)||a.wbs.localeCompare(b.wbs,'es',{numeric:true}))){
   const tr=el('tr',undefined,tb);tr.dataset.task=tk.id;if(focus.taskId===tk.id)tr.classList.add('is-focus');
   el('td',tk.wbs,tr,'wbs');const th=el('th',undefined,tr);th.scope='row';el('span',(tk.startDate===tk.endDate&&/^◆/.test(tk.title)?'':'')+tk.title,th);
   if(tk.dependsOn.length)el('small','Después de: '+tk.dependsOn.map(d=>`${task(d.taskId)?.wbs||d.taskId} (${DEP[d.type]}${d.lagDays?`, ${d.lagDays>0?'+':''}${d.lagDays} d`:''})`).join(' · '),th);
   el('td',day(tk.startDate),tr,'num');el('td',day(tk.endDate),tr,'num');el('td',String(days(tk.startDate,tk.endDate)),tr,'num');
   const ec=el('td',undefined,tr),eb=el('div',undefined,ec,'cx-links');
   if(!tk.elements.length)el('span','Sin representación 3D',eb,'cx-chip');
   for(const e of tk.elements.slice(0,3)){const x=byKey.get(e.elementId),b=btn(x?C.elementLabel(x,inv.levels):e.elementId.startsWith(A.ILLUSTRATIVE_PREFIX)?(A.ILLUSTRATIVE[e.elementId.slice(A.ILLUSTRATIVE_PREFIX.length)]?.label||'Medio de obra')+' (ilustración)':'Elemento que ya no existe',eb,'cx-link');b.dataset.element=e.elementId;b.title=C.ROLE[e.role];b.onclick=()=>{tab='elements';focus={elementKey:e.elementId};draw();dialog.querySelector('.is-focus')?.scrollIntoView({block:'center'});};}
   if(tk.elements.length>3)el('span',`+${tk.elements.length-3}`,eb,'cx-chip');
   const ic=el('td',undefined,tr),ib=el('div',undefined,ic,'cx-links'),tl=lines?.get(tk.id);
   if(!tk.budgetAllocations.length)el('span','Sin partidas',ib,'cx-chip');
   for(const a of tk.budgetAllocations){const it=money.budget?.items.find(i=>i.id===a.itemId),line=tl?.lines.find(l=>l.itemId===a.itemId);
    const b=btn(`${it?it.description:'Partida que ya no existe'} · ${pct(a.sharePercent)}${line?' · '+(line.allocatedNet===null?'importe desconocido':eur(line.allocatedNet)):''}`,ib,'cx-link');b.dataset.item=a.itemId;b.onclick=()=>{tab='items';focus={itemId:a.itemId};draw();dialog.querySelector('.is-focus')?.scrollIntoView({block:'center'});};}
   const ac=el('td',undefined,tr),ab=el('div',undefined,ac,'cx-links');
   const ed=btn('Editar',ab,'cx-link');ed.dataset.edit=tk.id;ed.onclick=()=>{editing={id:tk.id};draw();dialog.querySelector('#taskTitle')?.focus();};
   const du=btn('Duplicar',ab,'cx-link');du.dataset.dup=tk.id;du.onclick=()=>{const id=R.newId('tsk');change(d=>{d.tasks.push({...structuredClone(tk),id,title:tk.title+' (copia)',dependsOn:[],elements:[],budgetAllocations:[]});},'Copia creada sin elementos ni partidas: no pueden repetirse con el mismo papel ni superar el 100 %.');focus={taskId:id};};
   const rm=btn('Eliminar',ab,'cx-link');rm.dataset.remove=tk.id;rm.onclick=()=>{const deps=tasks().filter(o=>o.dependsOn.some(d=>d.taskId===tk.id));if(deps.length){error=`«${deps.map(o=>o.title).join('», «')}» depende de esta tarea: quita antes esa dependencia.`;draw();return;}change(d=>{d.tasks=d.tasks.filter(o=>o.id!==tk.id);},'Tarea eliminada. Sus partidas quedan sin asignar.');};
   if(editing?.id===tk.id){const fr=el('tr',undefined,tb),fd=el('td',undefined,fr);fd.colSpan=8;taskForm(fd,tk);}
  }
 }
 function taskForm(parent,tk){
  const f=el('div',undefined,parent,'cx-form');f.id='taskForm';el('h3',tk?'Editar tarea':editing.milestone?'Nuevo hito':'Nueva tarea',f);
  const row=el('div',undefined,f,'cx-row');
  const field=(label,id,type,value)=>{const l=el('label',undefined,row,'cx-field');el('span',label,l);const i=el('input',undefined,l);i.id=id;i.type=type;i.value=value??'';return i;};
  const title=field('Título','taskTitle','text',tk?.title||'');const wbs=field('Código (WBS)','taskWbs','text',tk?.wbs||String(tasks().length+1));
  const start=field('Inicio','taskStart','date',tk?.startDate||'');const end=field('Fin','taskEnd','date',tk?.endDate||'');
  const msl=el('label',undefined,f,'cx-check');const ms=el('input',undefined,msl);ms.type='checkbox';ms.id='taskMilestone';ms.checked=tk?tk.startDate===tk.endDate:!!editing.milestone;el('span','Hito (un solo día: la fecha de fin es la de inicio). RUBIK no tiene un tipo «hito» aparte.',msl);
  const sync=()=>{end.disabled=ms.checked;if(ms.checked)end.value=start.value;};ms.onchange=sync;start.addEventListener('input',()=>{if(ms.checked)end.value=start.value;});sync();
  // Dependencies
  const deps=el('div',undefined,f,'cx-sub');el('b','Dependencias',deps);const depRows=[];
  const others=tasks().filter(o=>o.id!==tk?.id);
  const addDep=(d={taskId:'',type:'FS',lagDays:0})=>{const r=el('div',undefined,deps);r.dataset.dep='';const p=el('select',undefined,r);p.setAttribute('aria-label','Tarea anterior');el('option','Elige la tarea…',p).value='';for(const o of others){const op=el('option',`${o.wbs} ${o.title}`,p);op.value=o.id;}p.value=d.taskId;
   const ty=el('select',undefined,r);ty.setAttribute('aria-label','Tipo de dependencia');for(const k of S.DEPENDENCY_TYPES){const op=el('option',`${DEP[k]} (${k})`,ty);op.value=k;}ty.value=d.type;
   const lag=el('input',undefined,r);lag.type='number';lag.step='1';lag.value=String(d.lagDays);lag.setAttribute('aria-label','Desfase en días');el('span','días de desfase',r);
   const x=btn('Quitar',r,'cx-link');x.onclick=()=>{r.remove();depRows.splice(depRows.indexOf(rec),1);};const rec={p,ty,lag};depRows.push(rec);};
  for(const d of tk?.dependsOn||[])addDep(d);const ad=btn('Añadir dependencia',deps,'cx-link');ad.id='taskAddDep';ad.disabled=!others.length;ad.onclick=()=>{addDep();deps.append(ad);};
  // Elements of the saved project (only allowed roles)
  const es=el('div',undefined,f,'cx-sub');el('b','Elementos del proyecto',es);
  el('span','Marca los elementos que construye, reviste o demuele esta tarea. Solo se ofrecen los papeles admitidos para cada elemento según su estado (nuevo, existente, a demoler).',es,'cx-status').style.color='var(--ink-muted)';
  const pick=el('div',undefined,es,'cx-pick');pick.id='taskElements';const chosen=new Map((tk?.elements||[]).map(e=>[e.elementId,e.role]));const elRows=[];
  const groups=new Map();for(const e of inv.elements.filter(e=>e.type!=='object'&&C.rolesFor(e).length)){const g=C.TYPE[e.type]||e.type;if(!groups.has(g))groups.set(g,[]);groups.get(g).push(e);}
  for(const [g,list] of groups){const fs=el('fieldset',undefined,pick);el('legend',`${g} (${list.length})`,fs);
   for(const e of list){const l=el('label',undefined,fs),cb=el('input',undefined,l);cb.type='checkbox';cb.value=e.key;cb.checked=chosen.has(e.key);cb.dataset.element=e.key;
    el('span',`${C.elementLabel(e,inv.levels)} · ${C.LIFE[e.lifecycle]||e.lifecycle}${e.representable?'':' · sin representación'}`,l);
    const role=el('select',undefined,l);role.setAttribute('aria-label','Papel de '+C.elementLabel(e,inv.levels));for(const r0 of C.rolesFor(e)){const o=el('option',C.ROLE[r0],role);o.value=r0;}if(chosen.has(e.key))role.value=chosen.get(e.key);elRows.push({cb,role,key:e.key});}}
  // Site resources (crane, scaffold, fence, hut): ILLUSTRATIONS linked expressly to this task, never part of the project.
  const ill=el('fieldset',undefined,pick);el('legend','Medios de obra (ilustración: no forman parte del proyecto)',ill);
  for(const [kind,def] of Object.entries(A.ILLUSTRATIVE||{})){const key=A.ILLUSTRATIVE_PREFIX+kind,l=el('label',undefined,ill),cb=el('input',undefined,l);cb.type='checkbox';cb.value=key;cb.checked=chosen.has(key);cb.dataset.element=key;
   el('span',def.label+' · se dibuja como ilustración mientras dura la tarea',l);const role=el('select',undefined,l);role.setAttribute('aria-label','Papel de '+def.label);for(const r0 of def.roles){const o=el('option',C.ROLE[r0],role);o.value=r0;}if(chosen.has(key))role.value=chosen.get(key);elRows.push({cb,role,key});}
  // Budget items (explicit %; project subject only)
  const bs=el('div',undefined,f,'cx-sub');el('b','Partidas del presupuesto',bs);const itRows=[];
  if(money.kind!=='project'){el('span','Edificio: los importes se consultan por planta. RUBIK todavía no tiene presupuesto de edificio (decisión pendiente), así que las tareas del edificio no reparten partidas.',bs);}
  else if(!money.budget){el('span','Este proyecto no tiene presupuesto todavía. Ábrelo en Presupuestar para generar sus partidas.',bs);}
  else{const L=R.links(asStored());
   const addIt=(a={itemId:'',sharePercent:''})=>{const r=el('div',undefined,bs);r.dataset.alloc='';const s=el('select',undefined,r);s.setAttribute('aria-label','Partida');el('option','Elige la partida…',s).value='';
    for(const it of money.budget.items){const used=L.allocatedPercent(it.id)-((tk?.budgetAllocations||[]).find(x=>x.itemId===it.id)?.sharePercent||0);const o=el('option',`${it.description} · disponible ${pct(Math.max(0,100-used))}`,s);o.value=it.id;o.disabled=used>=100&&it.id!==a.itemId;}
    s.value=a.itemId;const p=el('input',undefined,r);p.type='number';p.min='0.01';p.max='100';p.step='0.01';p.value=String(a.sharePercent);p.setAttribute('aria-label','Porcentaje de la partida');el('span','% de la partida',r);
    const x=btn('Quitar',r,'cx-link');const rec={s,p};x.onclick=()=>{r.remove();itRows.splice(itRows.indexOf(rec),1);};itRows.push(rec);
    s.onchange=()=>{if(!p.value){const used=L.allocatedPercent(s.value)-((tk?.budgetAllocations||[]).find(y=>y.itemId===s.value)?.sharePercent||0);p.value=String(Math.max(0,Math.round((100-used)*100)/100)||'');}};};
   for(const a of tk?.budgetAllocations||[])addIt(a);const ai=btn('Añadir partida',bs,'cx-link');ai.id='taskAddItem';ai.onclick=()=>{addIt();bs.append(ai);};
   el('span','Tú decides qué parte de cada partida corresponde a esta tarea. Lo que no repartas queda pendiente; RUBIK no lo distribuye por días.',bs,'cx-status').style.color='var(--ink-muted)';}
  const er=el('p','',f,'cx-err');er.id='taskError';er.setAttribute('role','alert');
  const acts=el('div',undefined,f);acts.style.cssText='display:flex;gap:8px;flex-wrap:wrap';
  const ok=btn('Guardar tarea',acts,'btn primary');ok.id='taskSave';const cancel=btn('Cancelar',acts);cancel.onclick=()=>{editing=null;error='';draw();};
  ok.onclick=()=>{
   if(!title.value.trim()||!wbs.value.trim()){er.textContent='Completa el título y el código de la tarea.';return;}
   if(!start.value||!(ms.checked||end.value)){er.textContent='Indica la fecha de inicio y la de fin. RUBIK no inventa fechas.';return;}
   const id=tk?.id||R.newId('tsk');
   const t={id,title:title.value.trim(),wbs:wbs.value.trim(),startDate:start.value,endDate:ms.checked?start.value:end.value,source:'Plan de obra · RUBIK',
    dependsOn:depRows.filter(d=>d.p.value).map(d=>({taskId:d.p.value,type:d.ty.value,lagDays:Number.parseInt(d.lag.value||'0',10)})),
    elements:elRows.filter(r=>r.cb.checked).map(r=>({elementId:r.key,role:r.role.value})),
    budgetAllocations:itRows.filter(r=>r.s.value).map(r=>({itemId:r.s.value,sharePercent:Number(r.p.value)}))};
   if(t.budgetAllocations.some(a=>!(a.sharePercent>0))){er.textContent='Indica el porcentaje de cada partida.';return;}
   // On a validation error the form keeps what was typed and explains it (no redraw).
   const okDone=change(d=>{const i=d.tasks.findIndex(x=>x.id===id);if(i>=0)d.tasks[i]={...d.tasks[i],...t};else d.tasks.push(t);},tk?'Tarea actualizada.':'Tarea añadida.',{silent:true});
   if(okDone){editing=null;focus={taskId:id};draw();dialog.querySelector('.is-focus')?.scrollIntoView({block:'center'});}else{er.textContent=error;error='';}
  };
 }

 /* ---------- Partidas (item → tasks → elements) ---------- */
 function itemsTab(body){
  if(money.kind!=='project'){
   banner(body,'','Presupuestos por planta',' Cada planta tiene su presupuesto en Presupuestar. Se muestran por separado y no se suman: RUBIK todavía no tiene presupuesto de edificio.');
   const t=el('table',undefined,el('div',undefined,body,'cx-scroll'),'cx-table');t.id='planLevelBudgets';const hr=el('tr',undefined,el('thead',undefined,t));for(const x of ['Planta','Partidas','Base imponible conocida','Estado'])el('th',x,hr);
   const tb=el('tbody',undefined,t);for(const l of money.levels||[]){const tr=el('tr',undefined,tb);el('th',l.name,tr).scope='row';if(!l.budget){el('td','Sin presupuesto',tr);el('td','—',tr,'num');el('td','Ábrelo en Presupuestar con esta planta activa',tr);continue;}
    const c=B.calculateBudget(l.budget);el('td',String(l.budget.items.length),tr,'num');el('td',eur(c.totals.net.amount),tr,'num');el('td',c.totals.net.complete?'Completo':'Parcial: hay partidas sin precio',tr);}
   return;}
  if(!money.budget){el('p','Este proyecto no tiene presupuesto todavía. Ábrelo en Presupuestar para generar sus partidas.',body,'cx-empty');return;}
  const rep=money.report,c=money.calc,L=draft.tasks.length?R.links(asStored()):null;
  const k=el('dl',undefined,body,'cx-kpis');k.id='planCosts';const kpi=(label,value,sub)=>{const d=el('div',undefined,k);el('dt',label,d);const dd=el('dd',value,d);if(sub)el('small',sub,dd);};
  kpi('Presupuesto conocido',eur(c.totals.net.amount),c.totals.net.complete?'sin IVA · completo':'sin IVA · parcial: hay partidas sin precio');
  const anyKnown=rep?.byTask.some(t=>t.knownNet!==null);kpi('Asignado a tareas',anyKnown?eur(rep.scheduleTotals.allocatedKnownNet):rep&&rep.byTask.some(t=>t.lines.length)?'desconocido':eur(0),anyKnown?'importe conocido, sin IVA':rep&&rep.byTask.some(t=>t.lines.length)?'las partidas asignadas no tienen precio':'ninguna partida asignada');
  kpi('Pendiente de repartir',String(rep?.pendingAllocations.length||0),'partidas repartidas en parte');
  kpi('Sin asignar',String(rep?rep.unassignedBudgetItemIds.length:money.budget.items.length),'partidas sin ninguna tarea');
  kpi('Precio desconocido',String(c.totals.unpricedItemIds.length),'partidas: no se cuentan como cero');
  if(money.reportError)banner(body,'bad','No se pueden calcular los repartos',money.reportError);
  el('p','Los importes asignados son netos (sin IVA) y salen del presupuesto de este proyecto. Lo asignado a tareas no es el coste total de la obra.',body,'cx-status').style.color='var(--ink-muted)';
  const t=el('table',undefined,el('div',undefined,body,'cx-scroll'),'cx-table');t.id='planItems';const hr=el('tr',undefined,el('thead',undefined,t));for(const x of ['Partida','Importe sin IVA','Tareas','Elementos','Estado'])el('th',x,hr).scope='col';
  const tb=el('tbody',undefined,t),lines=new Map(c.lines.map(l=>[l.id,l]));
  for(const it of money.budget.items){const tr=el('tr',undefined,tb),line=lines.get(it.id);tr.dataset.item=it.id;if(focus.itemId===it.id)tr.classList.add('is-focus');
   const th=el('th',undefined,tr);th.scope='row';el('span',it.description,th);el('small',`${(money.budget.chapters.find(ch=>ch.id===it.chapterId)||{}).title||''} · ${it.quantity.value===null?'cantidad no disponible':it.quantity.value.toLocaleString('es-ES')+' '+({m2:'m²',m:'m',unit:'ud'})[it.quantity.unit]}`,th);
   el('td',line.subtotalNet===null?'Desconocido':eur(line.subtotalNet),tr,'num');
   const tc=el('td',undefined,tr),tl=el('div',undefined,tc,'cx-links'),on=L?L.byItem.get(it.id)||[]:[];
   if(!on.length)el('span','Sin tarea',tl,'cx-chip warn');
   for(const x of on){const share=rep?.byTask.find(b=>b.taskId===x.taskId)?.lines.find(l=>l.itemId===it.id);const b=btn(`${x.wbs} ${x.title} · ${pct(x.sharePercent)}${share?' · '+(share.allocatedNet===null?'desconocido':eur(share.allocatedNet)):''}`,tl,'cx-link');b.dataset.task=x.taskId;b.onclick=()=>{tab='tasks';focus={taskId:x.taskId};draw();dialog.querySelector('.is-focus')?.scrollIntoView({block:'center'});};}
   const ec=el('td',undefined,tr),eb=el('div',undefined,ec,'cx-links'),els=L?L.elementsOfItem(it.id):[];if(!els.length)el('span','—',eb);
   for(const key of els.slice(0,4)){const x=byKey.get(key);const b=btn(x?C.elementLabel(x,inv.levels):'Elemento que ya no existe',eb,'cx-link');b.dataset.element=key;b.onclick=()=>{tab='elements';focus={elementKey:key};draw();dialog.querySelector('.is-focus')?.scrollIntoView({block:'center'});};}
   if(els.length>4)el('span',`+${els.length-4}`,eb,'cx-chip');
   const sc=el('td',undefined,tr),sl=el('div',undefined,sc,'cx-links'),done=L?L.allocatedPercent(it.id):0;
   chip(done===0?'Sin asignar':done<100?`Pendiente ${pct(100-done)}`:'Repartida 100 %',sl,done===100?'ok':'warn');
   if(it.unitPrice===null)chip('Precio desconocido',sl,'warn');else if(it.review.status!=='reviewed')chip('Precio sin revisar',sl);
   if(done<100&&draft.tasks.length){const a=btn('Asignar a una tarea…',sl,'cx-link');a.dataset.assign=it.id;a.onclick=()=>assignItem(tr,it,done);}}
 }
 function assignItem(tr,it,done){
  const fr=el('tr',undefined);tr.after(fr);const td=el('td',undefined,fr);td.colSpan=5;const f=el('div',undefined,td,'cx-sub');const r=el('div',undefined,f);
  const s=el('select',undefined,r);s.id='assignTask';s.setAttribute('aria-label','Tarea');for(const t of tasks()){const o=el('option',`${t.wbs} ${t.title}`,s);o.value=t.id;}
  const p=el('input',undefined,r);p.type='number';p.id='assignPercent';p.min='0.01';p.max=String(100-done);p.step='0.01';p.value=String(Math.round((100-done)*100)/100);p.setAttribute('aria-label','Porcentaje');el('span','%',r);
  const ok=btn('Asignar',r,'btn primary');ok.id='assignConfirm';ok.onclick=()=>{const v=Number(p.value);if(!(v>0)){error='Indica el porcentaje.';draw();return;}
   change(d=>{const t=d.tasks.find(x=>x.id===s.value),a=t.budgetAllocations.find(x=>x.itemId===it.id);if(a)a.sharePercent=Math.round((a.sharePercent+v)*100)/100;else t.budgetAllocations.push({itemId:it.id,sharePercent:v});},`«${it.description}» asignada a la tarea.`);focus={itemId:it.id};draw();};
  btn('Cancelar',r).onclick=()=>fr.remove();s.focus();
 }

 /* ---------- Elementos (element → tasks) ---------- */
 function elementsTab(body){
  const L=draft.tasks.length?R.links(asStored()):null,list=inv.elements.filter(e=>e.type!=='object');
  const unscheduled=list.filter(e=>e.representable&&!(L?.byElement.get(e.key)||[]).length).length;
  el('p',`${list.length} elementos del proyecto guardado · ${unscheduled} representables sin tarea. Un elemento sin tarea se muestra como pendiente en la evolución; RUBIK no le inventa fechas.`,body,'cx-status').style.color='var(--ink-muted)';
  const t=el('table',undefined,el('div',undefined,body,'cx-scroll'),'cx-table');t.id='planElements';const hr=el('tr',undefined,el('thead',undefined,t));for(const x of ['Elemento','Estado','Tareas',''])el('th',x,hr).scope='col';
  const tb=el('tbody',undefined,t);
  for(const e of list){const tr=el('tr',undefined,tb);tr.dataset.element=e.key;if(focus.elementKey===e.key)tr.classList.add('is-focus');
   const th=el('th',undefined,tr);th.scope='row';el('span',C.elementLabel(e,inv.levels),th);el('small',`${C.TYPE[e.type]||e.type} · ${C.LIFE[e.lifecycle]||e.lifecycle}${e.representable?'':' · '+(e.unavailableReason||'sin representación 3D')}`,th);
   el('td',e.representable?'Representable':'Sin representación',tr);
   const tc=el('td',undefined,tr),tl=el('div',undefined,tc,'cx-links'),on=L?.byElement.get(e.key)||[];if(!on.length)el('span','Sin tarea',tl,'cx-chip'+(e.representable?' warn':''));
   for(const x of on){const b=btn(`${x.wbs} ${x.title} · ${C.ROLE[x.role]}`,tl,'cx-link');b.dataset.task=x.taskId;b.onclick=()=>{tab='tasks';focus={taskId:x.taskId};draw();dialog.querySelector('.is-focus')?.scrollIntoView({block:'center'});};}
   const ac=el('td',undefined,tr);if(tasks().length&&C.rolesFor(e).length){const a=btn('Asignar a una tarea…',ac,'cx-link');a.onclick=()=>{
    const fr=el('tr',undefined);tr.after(fr);const td=el('td',undefined,fr);td.colSpan=4;const r=el('div',undefined,el('div',undefined,td,'cx-sub'));
    const s=el('select',undefined,r);s.setAttribute('aria-label','Tarea');for(const t0 of tasks()){const o=el('option',`${t0.wbs} ${t0.title}`,s);o.value=t0.id;}
    const role=el('select',undefined,r);role.setAttribute('aria-label','Papel');for(const r0 of C.rolesFor(e)){const o=el('option',C.ROLE[r0],role);o.value=r0;}
    btn('Asignar',r,'btn primary').onclick=()=>{change(d=>{d.tasks.find(x=>x.id===s.value).elements.push({elementId:e.key,role:role.value});},'Elemento asignado a la tarea.');focus={elementKey:e.key};draw();};
    btn('Cancelar',r).onclick=()=>fr.remove();s.focus();};}}
 }

 /* ---------- Comprobaciones ---------- */
 function checksTab(body){
  const broken=brokenLinks(),gone=unknownItems();
  if(broken.length){banner(body,'bad',`${broken.length} ${broken.length===1?'vínculo apunta':'vínculos apuntan'} a elementos que ya no existen`,'El proyecto ha cambiado (por ejemplo, se borró un muro). Quita esos vínculos y vuelve a asignar las tareas a los elementos actuales.');
   const fix=btn('Quitar vínculos rotos',body,'btn primary');fix.id='planFixLinks';fix.onclick=()=>change(d=>{for(const t of d.tasks)t.elements=t.elements.filter(e=>e.elementId.startsWith(A.ILLUSTRATIVE_PREFIX)||byKey.has(e.elementId));},'Vínculos rotos quitados.');}
  if(gone.length){banner(body,'bad',`${gone.length} ${gone.length===1?'reparto usa una partida':'repartos usan partidas'} que ya no está en el presupuesto`,'Quita esos repartos; el presupuesto actual manda.');
   const fix=btn('Quitar repartos de partidas inexistentes',body,'btn');fix.id='planFixItems';const ids=new Set(money.budget.items.map(i=>i.id));fix.onclick=()=>change(d=>{for(const t of d.tasks)t.budgetAllocations=t.budgetAllocations.filter(a=>ids.has(a.itemId));},'Repartos corregidos.');}
  if(!broken.length&&!gone.length)banner(body,'','Sin vínculos rotos','Todas las tareas apuntan a elementos y partidas que existen en el proyecto y el presupuesto actuales.');
  if(draft.tasks.length){const rep=S.dependencyReport(asStored());if(rep.length){el('h3','Dependencias',body);const ul=el('ul',undefined,body);for(const d of rep)el('li',`${task(d.from)?.title} → ${task(d.to)?.title} · ${DEP[d.type]}${d.lagDays?`, desfase ${d.lagDays} d`:''} · margen ${d.slackDays} ${d.slackDays===1?'día':'días'}`,ul);}}
  const corr=R.correspondence(snap.record,nowF?R.nowOf(snap.subject,nowF):{subject:snap.subject,revision:snap.revision});el('h3','Identidad y revisiones',body);const ul=el('ul',undefined,body);ul.id='planCorrespondence';
  const TXT={plan:{absent:'Plan: todavía no guardado',match:'Plan: guardado para la revisión actual del proyecto',obsolete:'Plan: guardado para otra revisión del proyecto',mismatch:'Plan: pertenece a otro proyecto'},
   review:{absent:'Revisión: sin declarar',match:'Revisión: declarada sobre el plan y el proyecto actuales',obsolete:'Revisión: desactualizada (el plan, el proyecto o el presupuesto han cambiado)'},
   'budget-revision':{unverifiable:'Presupuesto ↔ revisión del proyecto: no comprobable (el presupuesto no guarda la revisión del proyecto)'},
   delivery:{absent:'Entregas: ninguna todavía',match:'Última entrega: corresponde al estado actual',obsolete:'Última entrega: desactualizada; se conserva tal como se descargó'}};
  for(const c of corr){const li=el('li',TXT[c.aspect]?.[c.result]||`${c.aspect}: ${c.result}`,ul);li.dataset.aspect=c.aspect;li.dataset.result=c.result;}
 }
 function download(blob,name){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),4000);}
 window.FloorPlanConstructionPlanUI={open,close,get draft(){return draft;},get dirty(){return dirty;}};
})();
