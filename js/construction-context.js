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
 function elementLabel(e,levels){
  const lv=e.levelId&&levels?levels.find(l=>l.levelId===e.levelId):null;
  const what=e.type==='floor'&&e.name?`Suelo · ${typeof nm==='function'?nm(e.name):e.name}`:e.type==='wall'?`Muro de ${m(e.lengthMm)} m`:['door','window','sliding-door','opening'].includes(e.type)?`${TYPE[e.type]} de ${m(e.widthMm)} m`:TYPE[e.type]||e.type;
  return (lv?lv.name+' · ':'')+what;
 }
 const rolesFor=e=>{const f=FAMILY[e.type],rules=f&&A.ROLE_RULES[f];return rules?(rules[e.lifecycle]||[]):[];};

 /* ---------- Evolución: the Gate D experience on this saved project, inside RUBIK ---------- */
 let overlay=null,frame=null,lastFocus=null,current=null;
 const STEPS=[['plan','Plan de obra'],['proyecto','Expediente'],['evolucion','Evolución 4D'],['entrega','Entregar']];
 async function openEvolution({mode='view',taskId=null,date=null}={}){
  ensureStyles();persistBudget();const snap=await snapshot();
  if(!overlay){overlay=el('div',undefined,document.body,'cx-evolution');overlay.id='evolutionOverlay';overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-labelledby','evolutionTitle');overlay.hidden=true;
   const bar=el('div',undefined,overlay,'cx-evolution-bar');const back=el('button','← Volver a RUBIK',bar,'btn');back.type='button';back.id='evolutionBack';back.onclick=closeEvolution;
   const t=el('h2','',bar);t.id='evolutionTitle';
   const nav=el('nav',undefined,bar,'cx-steps');nav.setAttribute('aria-label','Recorrido de la obra');
   for(const [k,label] of STEPS){const b=el('button',label,nav,'cx-step');b.type='button';b.dataset.step=k;b.onclick=()=>k==='plan'?over(()=>window.FloorPlanConstructionPlanUI.open(),'#planDialog'):frame?.contentWindow?.__ft3dUI?.go?.(k);}
   el('span','',bar,'cx-crumbs').id='evolutionCrumbs';
   // Mirrors of the page's own status and mode (its top bar is hidden inside RUBIK): one bar for the whole screen.
   const pill=el('span','Cargando…',bar,'cx-chip');pill.id='evolutionStatus';pill.setAttribute('role','status');
   const modes=el('span',undefined,bar,'cx-modes');modes.setAttribute('role','group');modes.setAttribute('aria-label','Modo');
   for(const [m,label] of [['pro','Profesional'],['client','Presentación']]){const b=el('button',label,modes,'cx-step');b.type='button';b.dataset.viewMode=m;b.onclick=()=>frame?.contentDocument?.querySelector(`.modes [data-mode="${m}"]`)?.click();}
   overlay.addEventListener('keydown',e=>{if(e.key==='Escape'&&!e.defaultPrevented&&!document.querySelector('dialog[open]')){e.preventDefault();closeEvolution();}});}
  current={mode,taskId,date};
  overlay.querySelector('#evolutionTitle').textContent=snap.entry.name;
  overlay.querySelector('#evolutionCrumbs').textContent=`${snap.subject.type==='building'?'Edificio':'Proyecto'} · revisión ${short(snap.revision)}${snap.level?' · planta activa: '+snap.level.name:''}`;
  frame?.remove();frame=el('iframe',undefined,overlay);frame.id='evolutionFrame';frame.title='Evolución de obra de '+snap.entry.name;
  const q=new URLSearchParams({source:'library',entry:snap.entry.id,subject:snap.subject.type+':'+snap.subject.id,revision:snap.revision,tab:mode==='deliver'?'entrega':'evolucion'});
  if(taskId)q.set('task',taskId);if(date)q.set('date',date);
  frame.src='evolucion/?'+q;if(overlay.hidden)lastFocus=document.activeElement;overlay.hidden=false;document.body.classList.add('evolution-open');
  window.View3D?.setSuspended?.(true);
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
 async function cards(area,grid,{card,detail,route}){
  ensureStyles();const snap=await snapshot().catch(()=>null);if(!snap||!grid.isConnected)return;
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
