/* FT3D-8 · M2 (S4-A): one context for the open RUBIK project — the same subject, revision, level, budget and plan
   for Presupuestar, Plan de obra, Evolución and Entregar. Reads the library through the editor's own state (the
   active project on screen is the truth; the library entry gives the building and the entry identity). Writes only
   the construction record (FloorPlanConstructionRecord) and, through FloorPlanBudgetUI.commit, the budget.
   Exposes: FloorPlanConstructionContext, FloorPlanBudgetLinks (read-only row decoration in the budget dialog) and
   FloorPlanConstructionUI.cards (entry points in the real work areas). */
(function(){
 'use strict';
 const app=window.FloorPlanApp,R=window.FloorPlanConstructionRecord,A=window.FloorPlanConstructionProject,S=window.FloorPlanConstructionSchedule,B=window.FloorPlanBudget;
 if(!app||!R||!A||!S||!B)return;
 const LIB='rubik-sota-project-library-v1';
 const el=(tag,text,parent,cls)=>{const n=document.createElement(tag);if(text!==undefined&&text!==null)n.textContent=text;if(cls)n.className=cls;parent?.append(n);return n;};
 const eur=v=>v===null||v===undefined?'desconocido':v.toLocaleString('es-ES',{style:'currency',currency:'EUR'});
 const day=d=>d?new Date(d+'T00:00:00Z').toLocaleDateString('es-ES',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'}):'—';
 const short=h=>h?h.slice(0,8):'—';
 function ensureStyles(){if(document.querySelector('link[data-construction-styles]'))return;const l=el('link',undefined,document.head);l.rel='stylesheet';l.href='css/construction.css';l.dataset.constructionStyles='';}

 /* ---------- identity ---------- */
 function libraryEntries(){try{const v=JSON.parse(localStorage.getItem(LIB));return Array.isArray(v?.entries)?v.entries:[];}catch{return [];}}
 // The library entry of the open project, with the project on screen (by identity, never by name) in its place.
 function entry(){
  const id=app.entryId,p=structuredClone(app.project),e=structuredClone(libraryEntries().find(x=>x.id===id)||null);
  if(!e)return {id,name:p.name,project:p};
  if(e.kind==='building'){const l=e.building.levels.find(x=>x.id===e.activeLevelId);if(l&&l.project.id===p.id)l.project=p;return e;}
  if(e.project?.id===p.id)e.project=p;
  return e;
 }
 const subject=()=>R.subjectOf(entry());
 const revisionOf=e=>A.fingerprint(R.subjectDoc(e));
 const store=()=>R.open(localStorage);
 async function snapshot(){
  const e=entry(),s=R.subjectOf(e),doc=R.subjectDoc(e),revision=await revisionOf(e);
  let record=null,recordError=null;try{record=store().get(e.id,s);}catch(err){recordError=err;}
  const dupes=R.duplicateSubjects(libraryEntries()).find(d=>d.subject===s.type+':'+s.id)||null;
  const level=s.type==='building'?s.levels.find(l=>l.id===s.activeLevelId):null;
  return {entry:e,subject:s,doc,revision,record,recordError,duplicate:dupes,level};
 }
 // The budget a plan of this subject may use: the open project's own budget (C1–C4, as Presupuestar shows it).
 // Buildings keep one budget per level: listed, never summed and never allocated to building tasks (DEC-06).
 function budgetFor(s){
  if(s.type==='project'){const c=window.FloorPlanBudgetUI?.current?.();return {kind:'project',budget:c?.budget||null,saved:!!c?.saved,subjectId:app.project.id};}
  let saved={};try{saved=JSON.parse(localStorage.getItem('rubik-budget-v1'))||{};}catch{}
  return {kind:'building-levels',budget:null,levels:s.levels.map(l=>{let b=null;try{b=saved[l.projectId]?B.parseBudget(JSON.stringify(saved[l.projectId])):null;}catch{}return {...l,budget:b};})};
 }
 // Fingerprints of what a delivery freezes, computed exactly as the Evolución page records them (stored budgets).
 async function nowFingerprints(snap){
  let saved={};try{saved=JSON.parse(localStorage.getItem('rubik-budget-v1'))||{};}catch{}
  const ids=snap.subject.type==='project'?[snap.doc.id]:snap.doc.levels.map(l=>l.project.id),list=ids.map(id=>saved[id]).filter(Boolean);
  let budget=null;try{budget=list.length===1?B.parseBudget(JSON.stringify(list[0])):null;}catch{}
  const brand=window.FloorPlanBrand?.snapshot(localStorage,snap.entry.id,snap.entry.name)||null;
  return R.aspectFingerprints(A.fingerprint,{doc:snap.doc,schedule:snap.record?.schedule||null,budget,brand});
 }
 const ASPECT={project:'el proyecto',schedule:'el plan de obra',budget:'el presupuesto',brand:'la firma de Mi estudio',site:'el emplazamiento'};
 async function deliveryState(snap){const last=snap.record?.deliveries?.at(-1);if(!last)return null;
  const c=R.correspondence(snap.record,R.nowOf(snap.subject,await nowFingerprints(snap))).find(x=>x.aspect==='delivery');
  return {last,result:c.result,changed:(c.changed||[]).map(k=>ASPECT[k]||k)};}
 // Persist the budget exactly as Presupuestar shows it, so Evolución and Entregar read the same document.
 function persistBudget(){const c=window.FloorPlanBudgetUI?.current?.();if(!c?.budget)return null;try{return window.FloorPlanBudgetUI.commit(c.budget);}catch{return null;}}

 /* ---------- element vocabulary (Spanish, from the real inventory) ---------- */
 const TYPE={wall:'Muro',door:'Puerta',window:'Ventana','sliding-door':'Puerta corredera',opening:'Hueco',floor:'Suelo',roof:'Cubierta',slab:'Forjado',object:'Mobiliario'};
 const FAMILY={wall:'wall',door:'opening',window:'opening','sliding-door':'opening',opening:'opening',floor:'floor',roof:'roof',slab:'slab'};
 const LIFE={new:'nuevo',existing:'existente',demolished:'a demoler',undeclared:'sin estado declarado',furniture:'mobiliario'};
 const ROLE={site:'implantación',build:'construir',structure:'estructura',envelope:'envolvente',services:'instalaciones',cladding:'revestimiento',finish:'acabado',temporary:'provisional',demolition:'demoler'};
 const m=v=>(v/1000).toLocaleString('es-ES',{maximumFractionDigits:2});
 // N-06 · a novice must recognise each wall and opening: name the rooms it touches («Muro de 3,1 m · Cocina / Salón»).
 const roomNm=r=>typeof roomDisplay==='function'?roomDisplay(r):typeof nm==='function'?nm(r.name):r.name;
 function segDist(p,a,b){const dx=b.x-a.x,dy=b.y-a.y,l=dx*dx+dy*dy||1,t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/l));return Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy);}
 function roomsBy(project,pt,tol){return (project?.rooms||[]).filter(r=>r.polygon?.length>=3&&r.polygon.some((q,i)=>segDist(pt,q,r.polygon[(i+1)%r.polygon.length])<=tol));}
 function placeOf(e){try{const P=window.app?.project||app.project;if(!P||!e?.key)return '';const id=String(e.key).split('/').pop();
  let w=null,pt=null;if(e.type==='wall'){w=P.walls.find(x=>x.id===id);if(w)pt={x:(w.start.x+w.end.x)/2,y:(w.start.y+w.end.y)/2};}
  else if(['door','window','sliding-door','opening'].includes(e.type)){const o=P.openings.find(x=>x.id===id);w=o&&P.walls.find(x=>x.id===o.wallId);if(w){const L=Math.hypot(w.end.x-w.start.x,w.end.y-w.start.y)||1,t=Math.min(1,Math.max(0,((o.offsetMm||0)+(o.widthMm||0)/2)/L));pt={x:w.start.x+(w.end.x-w.start.x)*t,y:w.start.y+(w.end.y-w.start.y)*t};}}
  if(!pt)return '';const names=[...new Set(roomsBy(P,pt,(w.thicknessMm||150)/2+60).map(roomNm))].slice(0,2);
  return names.length?names.join(' / '):(e.type==='wall'?'fachada':'');}catch{return '';}}
 function elementLabel(e,levels){
  const lv=e.levelId&&levels?levels.find(l=>l.levelId===e.levelId):null;
  const what=e.type==='floor'&&e.name?`Suelo · ${typeof nm==='function'?nm(e.name):e.name}`:e.type==='wall'?`Muro de ${m(e.lengthMm)} m`:['door','window','sliding-door','opening'].includes(e.type)?`${TYPE[e.type]} de ${m(e.widthMm)} m`:TYPE[e.type]||e.type;
  const at=lv?'':placeOf(e);return (lv?lv.name+' · ':'')+what+(at?' · '+at:'');
 }
 const rolesFor=e=>{const f=FAMILY[e.type],rules=f&&A.ROLE_RULES[f];return rules?(rules[e.lifecycle]||[]):[];};

 /* ---------- Evolución: the Gate D experience on this saved project, inside RUBIK ---------- */
 let overlay=null,frame=null,lastFocus=null,current=null;
 const STEPS=[['plan','Plan de obra'],['proyecto','Expediente'],['evolucion','Evolución 4D'],['entrega','Entregar']];
 // N-09: the guide marks «Mira la obra día a día» as done once the evolution of this project has been opened.
 const seenKey='rubik-evolution-seen-v1',seen=id=>{try{return !!JSON.parse(localStorage.getItem(seenKey)||'{}')[id];}catch{return false;}};
 const markSeen=id=>{try{const o=JSON.parse(localStorage.getItem(seenKey)||'{}');o[id]=Date.now();localStorage.setItem(seenKey,JSON.stringify(o));}catch{}};
 async function openEvolution({mode='view',taskId=null,date=null}={}){
  try{markSeen(entry()?.id||app.entryId);}catch{}
  ensureStyles();persistBudget();const snap=await snapshot();
  if(!overlay){overlay=el('div',undefined,document.body,'cx-evolution');overlay.id='evolutionOverlay';overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-labelledby','evolutionTitle');overlay.hidden=true;
   const bar=el('div',undefined,overlay,'cx-evolution-bar');const back=el('button','← Volver a RUBIK',bar,'btn');back.type='button';back.id='evolutionBack';back.onclick=closeEvolution;
   const t=el('h2','',bar);t.id='evolutionTitle';
   const nav=el('nav',undefined,bar,'cx-steps');nav.setAttribute('aria-label','Recorrido de la obra');
   for(const [k,label] of STEPS){const b=el('button',label,nav,'cx-step');b.type='button';b.dataset.step=k;b.onclick=()=>k==='plan'?over(()=>window.FloorPlanConstructionPlanUI.open(),'#planDialog'):frame?.contentWindow?.__ft3dUI?.go?.(k);b.addEventListener('focus',()=>b.scrollIntoView({block:'nearest',inline:'nearest'}));}
   el('span','',bar,'cx-crumbs').id='evolutionCrumbs';
   // Mirrors of the page's own status and mode (its top bar is hidden inside RUBIK): one bar for the whole screen.
   const pill=el('span','Cargando…',bar,'cx-chip');pill.id='evolutionStatus';pill.setAttribute('role','status');
   const modes=el('span',undefined,bar,'cx-modes');modes.setAttribute('role','group');modes.setAttribute('aria-label','Modo');
   for(const [m,label] of [['pro','Profesional'],['client','Presentación']]){const b=el('button',label,modes,'cx-step');b.type='button';b.dataset.viewMode=m;b.onclick=()=>frame?.contentDocument?.querySelector(`.modes [data-mode="${m}"]`)?.click();}
   // Escape returns to RUBIK wherever the focus is in this page (inside the frame, library-source.js forwards it).
   document.addEventListener('keydown',e=>{if(e.key==='Escape'&&overlay&&!overlay.hidden&&!e.defaultPrevented&&!document.querySelector('dialog[open]')){e.preventDefault();closeEvolution();}});}
  current={mode,taskId,date};
  overlay.querySelector('#evolutionTitle').textContent=snap.entry.name;
  overlay.querySelector('#evolutionCrumbs').textContent=`${snap.subject.type==='building'?'Edificio':'Proyecto'} · revisión ${short(snap.revision)}${snap.level?' · planta activa: '+snap.level.name:''}`;
  frame?.remove();frame=el('iframe',undefined,overlay);frame.id='evolutionFrame';frame.title='Evolución de obra de '+snap.entry.name;
  const q=new URLSearchParams({source:'library',entry:snap.entry.id,subject:snap.subject.type+':'+snap.subject.id,revision:snap.revision,tab:mode==='deliver'?'entrega':'evolucion'});
  if(taskId)q.set('task',taskId);if(date)q.set('date',date);
  frame.src='evolucion/?'+q;if(overlay.hidden)lastFocus=document.activeElement;overlay.hidden=false;document.body.classList.add('evolution-open');
  window.View3D?.setSuspended?.(true);
  // Focus moves INTO the evolution (its «← Volver a RUBIK»), never stays on the hidden workspace behind it.
  overlay.querySelector('#evolutionBack')?.focus();
  return new Promise(res=>frame.addEventListener('load',()=>{const doc=frame.contentDocument;
   if(doc){new MutationObserver(syncSteps).observe(doc.body,{attributes:true,attributeFilter:['data-tab','data-mode']});const r=doc.getElementById('readiness');if(r)new MutationObserver(syncSteps).observe(r,{childList:true,characterData:true,subtree:true,attributes:true});}
   syncSteps();res(frame);},{once:true}));
 }
 function syncSteps(){const doc=frame?.contentDocument;if(!doc||!overlay)return;const tab=doc.body.dataset.tab,mode=doc.body.dataset.mode;
  for(const b of overlay.querySelectorAll('[data-step]'))b.setAttribute('aria-current',String(b.dataset.step===tab));
  for(const b of overlay.querySelectorAll('[data-view-mode]'))b.setAttribute('aria-pressed',String(b.dataset.viewMode===mode));
  const r=doc.getElementById('readiness'),pill=overlay.querySelector('#evolutionStatus');if(r&&pill){pill.textContent=r.textContent;const tone=r.dataset.tone||r.dataset.state;pill.className='cx-chip'+(/ok|ready/.test(tone||'')?' ok':/warn|partial/.test(tone||'')?' warn':/bad|error/.test(tone||'')?' bad':'');}}
 function closeEvolution(){if(!overlay||overlay.hidden)return;overlay.hidden=true;frame?.remove();frame=null;current=null;document.body.classList.remove('evolution-open');
  const ws=document.getElementById('professionalWorkspace');if(!ws||ws.hidden)window.View3D?.setSuspended?.(false);
  else{const area=window.FloorPlanProfessionalUI?.area;if(area)window.FloorPlanProfessionalUI.open(area);}
  (lastFocus?.isConnected?lastFocus:document.body).focus?.();}
 // What the evolution shows comes from these three documents; if a dialog opened over it changed one of them, the
 // evolution is rebuilt from the saved data at the same date and task (when they still exist).
 const savedState=()=>['rubik-sota-project-library-v1','rubik-budget-v1','rubik-construction-v1',window.FloorPlanBrand?.DELIVERY_KEY,window.FloorPlanBrand?.PROFILES_KEY].map(k=>k?localStorage.getItem(k):'').join('\u0000');
 async function over(openFn,selector){
  const before=savedState();await openFn();const d=document.querySelector(selector);if(!d?.open)return;
  d.addEventListener('close',async()=>{if(!frame)return;if(savedState()!==before){const f=frame.contentWindow?.__ft3dFidelity;await openEvolution({mode:frame.contentWindow?.document.body.dataset.tab==='entrega'?'deliver':'view',date:f?.last?.date||null,taskId:f?.selected||null});}else frame.focus();},{once:true});
 }
 function openBudgetAt(itemId){window.FloorPlanBudgetUI.open();const tr=itemId&&document.querySelector(`#budgetDialog tr[data-item="${CSS.escape(itemId)}"]`);
  if(tr){tr.classList.add('is-focus');tr.scrollIntoView({block:'center'});tr.querySelector('[data-field="price"]')?.focus({preventScroll:true});}}
 // Messages from the Evolución page (same origin only).
 addEventListener('message',e=>{if(e.origin!==location.origin||!e.data||e.data.type!=='rubik-construction')return;const d=e.data;
  if(d.action==='close')closeEvolution();
  if(d.action==='open-plan')over(()=>window.FloorPlanConstructionPlanUI.open({tab:d.itemId?'items':d.elementKey?'elements':'tasks',taskId:d.taskId||null,itemId:d.itemId||null,elementKey:d.elementKey||null}),'#planDialog');
  if(d.action==='open-budget')over(()=>openBudgetAt(d.itemId||null),'#budgetDialog');
  if(d.action==='open-site')over(()=>window.FloorPlanTerritoryUI?.open(),'#territoryDialog');
  if(d.action==='delivered')document.dispatchEvent(new CustomEvent('construction-delivered',{detail:{deliveryId:d.deliveryId}}));});

 /* ---------- budget dialog: partida → tareas → elementos (read-only) ---------- */
 let linkCache=null;
 function linksNow(){try{const e=entry(),s=R.subjectOf(e),rec=store().get(e.id,s);if(!rec?.schedule||s.type!=='project')return null;return {L:R.links(rec.schedule),schedule:rec.schedule};}catch{return null;}}
 window.FloorPlanBudgetLinks={decorate(th,itemId){
  if(!linkCache||linkCache.at<Date.now()-500)linkCache={at:Date.now(),v:linksNow()};const v=linkCache.v;
  const box=el('div',undefined,th,'budget-links');box.dataset.links=itemId;
  if(!v){el('span','Sin plan de obra: esta partida no está asignada a tareas.',box);return;}
  const tasks=v.L.byItem.get(itemId)||[];
  if(!tasks.length){el('span','Sin tarea en el plan: importe sin asignar.',box);}
  else{el('span','Plan:',box);for(const t of tasks){const b=el('button',`${t.wbs} ${t.title} · ${t.sharePercent.toLocaleString('es-ES')} %`,box,'cx-link');b.type='button';b.dataset.task=t.taskId;b.onclick=()=>window.FloorPlanConstructionPlanUI?.open({tab:'tasks',taskId:t.taskId});}
   const n=v.L.elementsOfItem(itemId).length;el('span',`· ${n} ${n===1?'elemento':'elementos'}`,box);
   const pend=100-v.L.allocatedPercent(itemId);if(pend>0)el('span',`· ${pend.toLocaleString('es-ES')} % sin asignar`,box);}
  const open=el('button','Ver en el plan',box,'cx-link');open.type='button';open.dataset.itemPlan=itemId;open.onclick=()=>window.FloorPlanConstructionPlanUI?.open({tab:'items',itemId});
 }};

 /* ---------- entry points in the real work areas ---------- */
 const SYMBOL={plan:'M4 5h16M4 10h10M4 15h13M4 20h7M18 13l3 3-3 3',prices:'M4 4h10l6 6v10H4zM14 4v6h6M8 14h8M8 18h5',evolution:'M3 20h18M5 20V9l7-5 7 5v11M9 20v-6h6v6M3 4l3 2',catastro:'M3 6l7-3 11 4-3 13-12 1zM8 10h8v7H8z'};
 function sym(card,key){const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('class','professional-symbol');svg.setAttribute('aria-hidden','true');const p=document.createElementNS(svg.namespaceURI,'path');p.setAttribute('d',SYMBOL[key]);svg.append(p);card.prepend(svg);}
 const RESULT_TEXT={absent:'Sin plan de obra',match:'Plan al día',obsolete:'Plan desactualizado',mismatch:'Plan de otro proyecto'};
 function planState(snap){
  if(snap.recordError)return {text:R.human(snap.recordError),tone:'bad'};
  const corr=R.correspondence(snap.record,{subject:snap.subject,revision:snap.revision}),plan=corr.find(c=>c.aspect==='plan');
  const s=snap.record?.schedule;let text=RESULT_TEXT[plan.result];
  if(s){const b=S.bounds(s);text=`${s.tasks.length} ${s.tasks.length===1?'tarea':'tareas'}${b.startDate?` · ${day(b.startDate)} – ${day(b.endDate)}`:''} · ${s.review.status==='reviewed'?'revisado (declarado)':'borrador'}`;}
  return {text,tone:plan.result==='match'?'ok':plan.result==='absent'?'':'warn',result:plan.result,corr};
 }
 /* Recorrido de obra (novice guide): the five steps of the construction flow in order, each with its real state and ONE
    primary action on the next step. It only reads the same documents as the cards below and opens the same dialogs. */
 async function journey(grid,snap,area){
  grid.querySelector('#obraJourney')?.remove();
  // The stored plan may use the compact 0.1.0 fields (elementIds/budgetItemIds): read it in its full form, as the editor does.
  const sch=snap.record?.schedule;let tasks=[];try{tasks=sch?window.FloorPlanConstructionSchedule.canonical(sch).tasks:[];}catch{tasks=sch?.tasks||[];}const isBuilding=snap.subject.type==='building';
  let priced=0,total=0;const b=budgetFor(snap.subject);
  if(b.kind==='project'&&b.budget){try{const c=window.FloorPlanBudget.calculateBudget(b.budget);total=c.lines.length;priced=total-c.totals.unpricedItemIds.length;}catch{total=b.budget.items.length;}}
  // A milestone (one day, nothing linked) builds nothing: only the works count for the links step.
  const works=tasks.filter(t=>!(t.startDate===t.endDate&&!(t.elements||[]).length)),withEl=works.filter(t=>(t.elements||[]).length).length,withIt=works.filter(t=>(t.budgetAllocations||[]).length).length;
  const ds=sch?await deliveryState(snap).catch(()=>null):null;
  // Every action opens the same dialog as its card; when that dialog closes the workspace (and this guide) is redrawn and the
  // focus goes to the new next step, so the novice always sees where they are.
  const refresh=()=>{const a=window.FloorPlanProfessionalUI?.area;if(a)window.FloorPlanProfessionalUI.open(a);setTimeout(()=>document.querySelector('#obraJourney [aria-current=step] button')?.focus(),400);};
  const viaDialog=(fn,sel)=>async()=>{await fn();const d=document.querySelector(sel);if(d?.open)d.addEventListener('close',refresh,{once:true});};
  const openBudget=viaDialog(()=>document.querySelector('#professionalWorkspace [data-route="budget-edit"]')?.click(),'#budgetDialog');
  const steps=[
   {k:'precios',t:'Pon precio a las partidas',done:isBuilding||total>0&&priced===total,
    s:isBuilding?'En un edificio, cada planta tiene su presupuesto: ábrelo desde la planta.':total?`${priced} de ${total} partidas con precio${priced<total?' · las que no tienen precio no suman':''}`:'Todavía no hay partidas: dibuja estancias y huecos en Diseñar.',
    a:isBuilding||!total?null:['Abrir presupuesto',openBudget]},
   {k:'plan',t:'Crea el plan de obra',done:!!sch&&tasks.length>0,s:sch?`${tasks.length} ${tasks.length===1?'tarea':'tareas'} guardadas${sch.review?.status==='reviewed'?' · revisado':' · en borrador: cuando lo compruebes, márcalo como revisado en el plan'}`:'Añade las tareas con sus fechas y dependencias.',
    a:[sch?'Abrir plan de obra':'Crear plan de obra',viaDialog(()=>window.FloorPlanConstructionPlanUI.open(),'#planDialog')]},
   {k:'vinculos',t:'Vincula cada tarea con lo que construye',done:works.length>0&&withEl===works.length&&(isBuilding||withIt>0),
    s:tasks.length?`${withEl} de ${works.length} ${works.length===1?'trabajo':'trabajos'} con elementos del proyecto${isBuilding?'':` · ${withIt} con partidas del presupuesto`}`:'Primero crea el plan de obra.',
    a:tasks.length?['Revisar vínculos',viaDialog(()=>window.FloorPlanConstructionPlanUI.open({tab:'tasks'}),'#planDialog')]:null},
   {k:'evolucion',t:'Mira la obra día a día',done:tasks.length>0&&(seen(snap.entry.id)||!!ds),optional:true,s:tasks.length?'Evolución 4D: la casa se construye según tu plan; puedes pausar, retroceder y abrir cada elemento.':'Disponible cuando el plan tenga tareas.',
    a:tasks.length?['Ver evolución 4D',()=>openEvolution()]:null},
   {k:'entrega',t:'Entrega a tu cliente',done:ds?.result==='match',s:ds?(ds.result==='match'?'Última entrega al día con el proyecto.':'Hay cambios desde la última entrega: genera una nueva versión.'):'Vídeo y presentación para el cliente, con tu firma. Se descargan en tu equipo: no se publica nada.',
    a:tasks.length?['Preparar entrega',()=>openEvolution({mode:'deliver'})]:null}];
  const next=steps.find(x=>!x.done&&!x.optional&&x.a)||steps.find(x=>!x.done&&x.a);
  const sec=el('section',undefined,null,'cx-journey');sec.id='obraJourney';sec.setAttribute('aria-labelledby','obraJourneyTitle');
  const h=el('h2','Recorrido de obra',sec);h.id='obraJourneyTitle';
  const doneN=steps.filter(x=>x.done).length;el('p',`${doneN} de ${steps.length} pasos hechos${next?` · Siguiente: ${next.t.toLowerCase()}`:' · todo al día'}`,sec,'cx-journey-sum');
  const ol=el('ol',undefined,sec);
  steps.forEach((x,i)=>{const li=el('li',undefined,ol,'cx-jstep');li.dataset.step=x.k;li.dataset.state=x.done?'done':x===next?'next':'todo';if(x===next)li.setAttribute('aria-current','step');
   el('span',x.done?'✓':String(i+1),li,'cx-jnum').setAttribute('aria-hidden','true');const body=el('div',undefined,li);
   el('b',x.t+(x.done?' · hecho':x===next?' · siguiente paso':''),body);el('span',x.s,body,'cx-jtext');
   if(x.a){const bt=el('button',x.a[0],body,x===next?'btn primary':'btn');bt.type='button';bt.dataset.journey=x.k;bt.onclick=x.a[1];}});
  (area==='deliver'?grid:grid).prepend(sec);
 }
 async function cards(area,grid,{card,detail,route}){
  ensureStyles();const snap=await snapshot().catch(()=>null);if(!snap||!grid.isConnected)return;
  if(area==='budget'||area==='deliver')await journey(grid,snap,area).catch(e=>console.warn('[Recorrido de obra]',e?.message||e));
  if(area==='budget'){
   const st=planState(snap),c=card(grid,'Plan de obra',st.text);c.dataset.module='construction-plan';c.id='constructionPlanCard';sym(c,'plan');
   if(st.result==='obsolete')detail(c,'El proyecto ha cambiado desde que guardaste el plan: revisa los vínculos y vuelve a guardarlo.');
   detail(c,snap.subject.type==='building'?'Tareas, fechas, dependencias y elementos de las dos plantas. Los importes se consultan por planta: RUBIK todavía no tiene presupuesto de edificio.':'Tareas, fechas, dependencias, elementos del proyecto y reparto de partidas del presupuesto. Nada cambia de fecha sin tu decisión.');
   route(c,snap.record?.schedule?'Abrir plan de obra':'Crear plan de obra','construction-plan',()=>window.FloorPlanConstructionPlanUI.open(),true);
   if(snap.record?.schedule)route(c,'Ver evolución','construction-evolution',()=>openEvolution());
   const managed=window.FloorPlanCostCatalog?.managedStatus?.();
   const p=card(grid,'Precios de referencia',managed?'Bases de precios que aportes y tarifa del estudio':'No disponible');p.dataset.module='reference-prices';p.id='referencePricesCard';sym(p,'prices');
   const changes=snap.record?.priceHistory?.[app.project.id]?.length||0;
   detail(p,'Busca por código, texto o familia, compara con tu precio y decide. Nada se aplica sin tu confirmación'+(changes?` · ${changes} ${changes===1?'cambio registrado':'cambios registrados'}`:'')+'.');
   detail(p,'El catálogo de precios gestionado por RUBIK no está disponible mientras su permiso de uso no esté documentado.');
   if(window.FloorPlanReferencePricesUI)route(p,'Buscar precios de referencia','reference-prices',()=>window.FloorPlanReferencePricesUI.open(),false);
  }
  if(area==='deliver'){
   const st=planState(snap),last=snap.record?.deliveries?.at(-1),c=card(grid,'Evolución de obra',snap.record?.schedule?st.text:'Necesita un plan de obra');c.dataset.module='construction-delivery';c.id='constructionDeliveryCard';sym(c,'evolution');
   detail(c,'Vídeo MP4 y presentación HTML de la obra prevista, con tu firma, desde el plan y el presupuesto de este proyecto. Se descargan en este equipo: no se publica nada.');
   const ds=await deliveryState(snap);
   if(ds){const d=detail(c,`Última entrega: ${new Date(ds.last.at).toLocaleString('es-ES',{dateStyle:'medium',timeStyle:'short'})} · ${ds.result==='match'?'corresponde al estado actual':'desactualizada: ha cambiado '+ds.changed.join(', ')+'. La entrega descargada no cambia; genera una nueva versión.'}`);d.id='deliveryState';d.dataset.result=ds.result;}
   if(snap.record?.schedule)route(c,'Preparar evolución de obra','construction-delivery',()=>openEvolution({mode:'deliver'}),true);
   else route(c,'Crear plan de obra','construction-plan-from-deliver',()=>window.FloorPlanConstructionPlanUI.open());
   const items=grid.querySelector('[data-group="experience"] .professional-group-items');if(items)items.append(c);
  }
  if(area==='analyze'){
   const s=app.levelContext?window.FloorPlanBuildingUI?.site:app.project.site,src=s?.parcel?.source,card0=grid.querySelector('.professional-card [data-route="territory"]')?.closest('.professional-card');
   if(card0&&s?.parcel){const origin=src?.providerId==='catastro-inspire-wfs'?'Consulta oficial al Catastro':src?.providerId==='catastro-inspire-cp'?'GML del Catastro aportado':'Parcela introducida';
    const d=detail(card0,`${origin} · referencia ${s.parcel.reference||'—'} · ${s.parcel.sourceCrs||''}`);d.id='parcelOrigin';}
  }
 }
 window.FloorPlanConstructionContext={entry,subject,snapshot,store,budgetFor,persistBudget,nowFingerprints,deliveryState,elementLabel,rolesFor,TYPE,ROLE,LIFE,eur,day,short};
 window.FloorPlanConstructionUI={cards,openEvolution,closeEvolution,planState,get evolutionFrame(){return frame;}};
})();
