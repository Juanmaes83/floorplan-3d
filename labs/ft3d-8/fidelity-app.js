/* FT3D-8 FIDELITY LAB controller. The building shown is the selected RUBIK project (fixture A-D or a project file
   imported locally in this browser); never the demo house. Dates/tasks: the FT3D-8 plan. Money: the C1-C4 budget.
   Missing data is shown as missing: no plan -> static model + "PLANIFICACION NO DISPONIBLE", no budget -> no amounts,
   elements without a task -> grey outline "sin tarea", categories RUBIK does not model -> listed, not drawn. */
import {createProjectScene} from './project-scene.js';
import {createGanttView} from './gantt-view.js';
const S=window.FloorPlanConstructionSchedule,V=window.FloorPlanConstructionVisualState,G=window.FloorPlanConstructionGantt,
  P=window.FloorPlanConstructionLabPresenter,B=window.FloorPlanBudget,A=window.FloorPlanConstructionProject,FX=window.FT3D8FidelityFixtures;
const $=id=>document.getElementById(id),DAY=86400000,ms=d=>Date.parse(d+'T00:00:00Z'),iso=x=>new Date(x).toISOString().slice(0,10);
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const LAYER=['finish','cladding'],APPEARS=['site','build','structure','envelope','services'];
const q=new URLSearchParams(location.search);
if(q.get('capture')){const [w,h]=q.get('capture').split('x').map(Number);if(w&&h)document.documentElement.style.setProperty('--capture-w',w+'px'),document.documentElement.style.setProperty('--capture-h',h+'px'),document.body.classList.add('capture');}
const scene=createProjectScene($('stage'));
let ctx=null,pos=0,playing=false,speed=1,lastT=0,lastDay=-1;
const api=window.__ft3dFidelity={last:null};

function stateFor(model,frame,next,f){
  // frame/next: authoritative day frames (or null without plan); f: illustrative tween between them.
  const out=new Map(),fe=frame?new Map(frame.elements.map(e=>[e.elementId,e])):null,ne=next?new Map(next.elements.map(e=>[e.elementId,e])):null;
  const pick=(x,roles)=>x?Math.max(0,...x.layers.filter(l=>roles.includes(l.role)).map(l=>l.progress)):0;
  for(const v of model.visualElements){
    if(!model.planning||model.planning.status!=='available'){out.set(v.key,{mode:v.lifecycle==='demolished'?'unscheduled':'pre-existing'});continue;}
    if(v.timeline==='unscheduled'){out.set(v.key,{mode:'unscheduled'});continue;}
    const a=fe.get(v.key),b=ne.get(v.key)||a,lerp=(x,y)=>x*(1-f)+y*f,hasLayer=v.tasks.some(t=>LAYER.includes(t.role));
    if(!a){out.set(v.key,{mode:'pre-existing'});continue;}
    const presA=a.present?1:0,presB=b.present?1:0;
    out.set(v.key,{mode:v.timeline,present:lerp(presA,presB),
      build:v.tasks.some(t=>APPEARS.includes(t.role))?lerp(pick(a,APPEARS),pick(b,APPEARS)):1,
      layer:hasLayer?lerp(pick(a,LAYER),pick(b,LAYER)):null,removal:lerp(pick(a,['demolition']),pick(b,['demolition']))});
  }
  return out;
}
function renderHeader(model,meta){
  const inv=model.inventory,lv=inv.levels;
  $('projName').textContent=inv.name;
  $('projMeta').innerHTML=[`<b>${esc(inv.kind==='building'?'Edificio':'Proyecto')} ${esc(inv.id)}</b>`,`REV ${esc(model.fingerprints.project.slice(0,12))}`,
    ...lv.map(l=>`${esc(l.levelId||'planta unica')}: escala ${esc(l.scale.status)}`),
    `PLAN ${model.planning.status==='available'?esc(model.planning.evidence):model.planning.status==='rejected'?'RECHAZADO':'NO DISPONIBLE'}`,
    `PRESUPUESTO ${model.costs.status==='available'?esc(model.costs.report.budgetId):esc(model.costs.reason||'no disponible')}`].join('<i>//</i>');
  $('origin').textContent=meta.origin;$('origin').dataset.kind=meta.kind;
  $('delivery').textContent=model.delivery.label;$('delivery').dataset.level=model.delivery.level;
  $('blockers').textContent=model.delivery.blockers.length?'Bloqueos: '+model.delivery.blockers.join(', '):'Sin bloqueos registrados';
  $('simulation').textContent=model.delivery.simulation+' · '+model.delivery.scopeNotice+' · Aprobación: '+model.delivery.assurances.approval;
  const c=model.coverage,cb=c.budget;
  $('coverage').innerHTML=`<h3>Cobertura y evidencias</h3><ul>
    <li><b>Elementos</b>: ${c.elements.representable}/${c.elements.total} representables · ${c.elements.scheduled} con tarea · ${c.elements.preExisting} preexistentes · <span class="${c.elements.unscheduled.length?'warn':''}">${c.elements.unscheduled.length} sin tarea</span></li>
    <li><b>Evidencia geométrica</b>: ${Object.entries(c.elements.byEvidence).map(([k,n])=>`${k} ${n}`).join(' · ')}</li>
    <li><b>Tareas</b>: ${c.tasks?`${c.tasks.total} · sin elementos en el modelo: ${esc(c.tasks.withoutElements.join(', ')||'—')} · fechas ${c.tasks.datesApproved?'aprobadas':'en borrador'}`:'PLANIFICACIÓN NO DISPONIBLE O PENDIENTE'}</li>
    <li><b>Cobertura de partidas cargadas</b>: ${model.costs.status==='budget-only'?`presupuesto ${esc(model.costs.budgetId)} cargado (${P.euro(model.costs.totals.amount)} conocidos${model.costs.totals.complete?'':', incompleto'}) pero sin plan válido: no se reparte entre tareas`:cb?`${cb.allocatedPercentOfKnown??'—'} % de las partidas cargadas y con precio asignadas a tareas (${P.euro(cb.allocatedKnownNet)} de ${P.euro(cb.budgetKnownNet)}) · sin asignar: ${esc(cb.unassignedItemIds.join(', ')||'—')} · sin precio: ${esc(cb.unknownItemIds.join(', ')||'—')} · repartos pendientes: ${esc(cb.pendingAllocations.map(p=>p.itemId+' '+p.pendingPercent+'%').join(', ')||'—')} <em>— no equivale al % de la obra presupuestada</em>`:esc(model.costs.message||'PRESUPUESTO NO DISPONIBLE para este plan')}</li>
    <li><b>Cobertura del alcance de obra</b>: ${c.scope.modeled} categorías modeladas · ${c.scope.budgetedKnown} con precio · ${c.scope.budgetedUnpriced} sin precio · ${c.scope.notInBudget} fuera del presupuesto · ${c.scope.notBudgetable} sin partida C1–C4 (${esc(c.scope.categories.filter(x=>x.status==='not-budgetable-in-c1-c4').map(x=>x.label).join(', ')||'—')}) · no modeladas: ${esc(c.scope.notModeled.join(', '))}</li>
    <li><b>Cobertura geométrica</b>: ${c.geometry.representable}/${c.geometry.total} elementos representables · ${c.geometry.phasesWithElements}/${c.geometry.phases} fases con elementos del modelo</li>
    <li><b>Revisiones</b>: proyecto ${esc(model.obsolescence.project)} · plan ${esc(model.obsolescence.schedule)} · presupuesto ${esc(model.obsolescence.budget)}</li>
    <li><b>No modelado por RUBIK (no se dibuja)</b>: ${model.inventory.notInAuthority.map(x=>esc(x.category)).join(', ')}</li></ul>
    <h3>Avisos (${model.issues.length})</h3><ul class="issues">${model.issues.map(i=>`<li class="sev-${i.severity}"><b>${esc(i.code)}</b> ${esc(i.message)}</li>`).join('')||'<li>—</li>'}</ul>`;
}
function renderCard(date){
  const m=ctx.model;
  if(!ctx.schedule){$('cardWeek').textContent='SIN PLAN';$('cardDate').textContent='';$('cardHeadline').textContent=m.planning.status==='rejected'?m.planning.message:'PLANIFICACIÓN NO DISPONIBLE O PENDIENTE';
    $('cardEvidence').textContent='Se muestra el modelo del proyecto, sin fechas inventadas';$('cardTasks').innerHTML='';$('cardStage').textContent='SOLO MODELO';$('cardStage').dataset.stage='none';return null;}
  const report=m.costs.report;
  const c=report?P.taskCard(ctx.schedule,report,date):{week:P.weekOf(ctx.schedule,date),dateText:P.dateLabel(date),evidenceText:'Plan · animacion ilustrativa',headline:'',active:[],stage:'en-obra'};
  const st=S.stateAt(ctx.schedule,date),active=st.tasks.filter(t=>t.plannedPhase==='in-progress');
  $('cardWeek').textContent=c.week.label;$('cardDate').textContent=c.dateText.toUpperCase();$('cardEvidence').textContent=c.evidenceText;
  const done=st.tasks.every(t=>t.plannedPhase==='completed'),started=st.tasks.some(t=>t.plannedPhase!=='not-started');
  $('cardHeadline').textContent=done?'Plan completado: todas las tareas planificadas terminadas':active.length?active.map(t=>t.title.replace(/^FIXTURE /,'')).join(' · '):'Antes del plan';
  $('cardStage').textContent=done?'FINAL · PLAN COMPLETADO':started?'EN OBRA (SEGUN PLAN)':'INICIO · ESTADO PREVIO';$('cardStage').dataset.stage=done?'final':started?'en-obra':'inicio';
  $('cardTasks').innerHTML=active.map(t=>{const cost=report?P.costView(report.byTask.find(x=>x.taskId===t.id),report):null;
    const elems=t.elements.length?`${t.elements.length} elemento(s) del proyecto`:'sin representación en el modelo RUBIK';
    return `<li><div class="t"><span class="wbs">${esc(t.wbs)}</span> ${esc(t.title.replace(/^FIXTURE /,''))} <span class="pp">${Math.round(t.visualProgress*100)} % plan</span></div>
      <div class="d">${esc(P.dateLabel(t.startDate))} → ${esc(P.dateLabel(t.endDate))} · ${elems}</div>
      ${cost?`<div class="cost c-${cost.status}"><b>${esc(cost.label)}</b> · asignado sin IVA ${esc(cost.totalText)}${cost.status==='parcial'?' · conocido '+esc(cost.knownText):''}</div>${cost.notes.length?`<div class="notes">${cost.notes.map(esc).join(' · ')}</div>`:''}`
        :`<div class="cost c-desconocido"><b>Costes no disponibles</b> · ${esc(m.costs.message||m.costs.reason||'sin presupuesto')}</div>`}</li>`;}).join('')||(done?`<li class="none"><div class="notes">Fin del plan, no certificado de fin de obra</div></li>`:'');
  return c;
}
function setPos(p){
  if(!ctx)return;const tl=ctx.timeline;
  if(!tl){scene.setState(stateFor(ctx.model,null,null,0));$('dateReadout').textContent='';
    api.last={date:null,stage:'none',activeTaskIds:[],presentElements:ctx.model.visualElements.filter(v=>v.representable).map(v=>v.key),modes:Object.fromEntries(ctx.model.visualElements.map(v=>[v.key,'pre-existing']))};
    window.dispatchEvent(new CustomEvent('ft3d8-moment',{detail:api.last}));return;}
  const LAST=tl.positions-1;pos=Math.max(0,Math.min(LAST,p));
  const i=Math.floor(pos+1e-9),j=Math.min(LAST,i+1),f=pos-i,date=iso(ms(tl.preStartDate)+i*DAY);
  const states=stateFor(ctx.model,ctx.frames[i],ctx.frames[j],f);scene.setState(states);
  $('scrub').value=String(pos);ctx.gantt.update(pos,date);
  if(i!==lastDay){lastDay=i;renderCard(date);$('dateReadout').textContent=P.dateLabel(date).toUpperCase();
    const w=P.weekOf(ctx.schedule,date),ws=P.weeks(ctx.schedule);$('weekSel').value=String(i>=LAST?LAST:w.n===0?0:Math.round((ms(ws[w.n-1].startDate)-ms(tl.preStartDate))/DAY));
    const fr=ctx.frames[i];document.body.dataset.stage=fr.stage;
    api.last={date,stage:fr.stage,activeTaskIds:fr.activeTaskIds,ganttCursorDate:document.querySelector('#gantt [data-role=cursor]').dataset.date,
      presentElements:fr.elements.filter(e=>e.present).map(e=>e.elementId),modes:Object.fromEntries([...states].map(([k,s])=>[k,s.mode]))};
    // One evaluation per day, shared: the shell (intro, notes, selection) listens instead of recomputing the plan.
    window.dispatchEvent(new CustomEvent('ft3d8-moment',{detail:api.last}));}
}
// model/dossier: when a construction dossier (S1) was evaluated, its model is reused as is (one evaluation, one source).
async function show(input,meta,preModel=null,dossier=null){
  pause();lastDay=-1;
  const model=preModel||await A.evaluate(input);
  const schedule=model.planning.status==='available'?input.schedule:null,timeline=schedule?V.timeline(schedule):null;
  ctx={input,model,schedule,timeline,meta,dossier,dossierInput:meta.dossierInput||null,frames:timeline?Array.from({length:timeline.positions},(_,i)=>V.frameAt(schedule,iso(ms(timeline.preStartDate)+i*DAY))):null};
  scene.load(model.inventory);
  // Reform: the derived roof hides the interior works; it stays available through the toggle.
  const reform=model.inventory.elements.some(e=>e.lifecycle==='existing'||e.lifecycle==='demolished');scene.setRoofVisible(!reform);$('roofToggle').checked=!reform;scene.setPose(scene.presentationPose(model.inventory,'iso'));scene.setAuto(!document.body.classList.contains('capture'));
  renderHeader(model,meta);
  const controls=document.querySelector('.transport');controls.dataset.disabled=String(!timeline);
  if(timeline){$('scrub').max=String(timeline.positions-1);
    ctx.gantt=createGanttView($('gantt'),{schedule,report:model.costs.report,timeline,S,G,P,onPick:p=>{pause();setPos(p);}});
    $('weekSel').innerHTML=`<option value="0">Antes del plan</option>`+P.weeks(schedule).map(w=>`<option value="${Math.round((ms(w.startDate)-ms(timeline.preStartDate))/DAY)}">SEM ${String(w.n).padStart(2,'0')} · ${P.dateLabel(w.startDate)}</option>`).join('')+`<option value="${timeline.positions-1}">FIN · plan completado</option>`;
  }else{$('gantt').innerHTML=model.planning.status==='rejected'
      ?`<p class="noplan" id="planRejected">${esc(model.planning.message)}. El modelo se muestra estático; carga un plan de ${esc(model.subject.id)} para reproducir su evolución.</p>`
      :`<p class="noplan">PLANIFICACIÓN NO DISPONIBLE O PENDIENTE. FT3D-8 no genera fechas a partir de superficie, tipología, precio ni número de plantas.</p>`;$('weekSel').innerHTML='';}
  setPos(0);renderCard(timeline?timeline.preStartDate:null);
  api.model={subject:model.subject,fingerprint:model.fingerprints.project,delivery:model.delivery.level,planning:model.planning.status,costs:model.costs.status,
    elements:model.inventory.elements.length,unscheduled:model.coverage.elements.unscheduled.length,issues:model.issues.map(i=>i.code)};
  document.body.classList.add('ready');document.body.dataset.case=meta.caseId||'import';document.body.dataset.dossier=dossier?dossier.dossier.id:'';
  window.dispatchEvent(new CustomEvent('ft3d8-selection',{detail:{subject:model.subject,dossier:dossier?dossier.dossier.id:null}}));
  return api.model;
}
async function loadCase(id){const c=await FX.build(id);$('caseSel').value=id;return show(c,{caseId:id,origin:'FIXTURE de prueba · '+c.label,kind:'fixture'});}
// A3: every authority is loaded explicitly and validated by its own engine; nothing is read from another origin's storage.
const parseJson=(text,what)=>{try{return JSON.parse(text);}catch{throw new Error(what+': el archivo no es JSON válido');}};
const parsers={
  project:text=>{const doc=parseJson(text,'Proyecto');A.validateSource(doc);return doc;},
  schedule:text=>S.parse(text),
  budget:text=>B.parseBudget(text),
  binding:text=>A.validateBinding(parseJson(text,'Vínculo'))};
async function importText(text,{scheduleText=null,budgetText=null,bindingText=null}={}){
  const source=parsers.project(text);
  const input={source,schedule:scheduleText?parsers.schedule(scheduleText):null,budget:budgetText?parsers.budget(budgetText):null,binding:bindingText?parsers.binding(bindingText):null};
  return show(input,{caseId:null,origin:'Proyecto importado localmente (no se envía a ningún servidor)',kind:'import'});
}
// Replace one part (plan, budget or binding) of the current selection; the project stays.
async function loadPart(kind,text){
  if(!ctx)throw new Error('Carga primero un proyecto');
  const value=parsers[kind](text),input={...ctx.input,[kind]:value};
  return show(input,{...ctx.meta,origin:ctx.meta.origin.replace(/ · .*cargad.*$/,'')+' · '+({schedule:'plan',budget:'presupuesto',binding:'vínculo'})[kind]+' cargado localmente'});
}
function play(){if(!ctx?.timeline)return;if(pos>=ctx.timeline.positions-1)setPos(0);playing=true;lastT=performance.now();$('play').textContent='❚❚';requestAnimationFrame(loop);}
function pause(){playing=false;$('play').textContent='▶';}
function loop(t){if(!playing)return;const dt=Math.min(.1,(t-lastT)/1000);lastT=t;setPos(pos+dt*4*speed);if(pos>=ctx.timeline.positions-1){pause();return;}requestAnimationFrame(loop);}
// Steps from the day on screen, so «‹» always goes back even when paused mid-tween.
const step=d=>{pause();setPos(Math.floor(pos+1e-9)+d);};
Object.defineProperties(api,Object.getOwnPropertyDescriptors({loadCase,importText,loadPart,show,get ctx(){return ctx;},get scene(){return scene;},play,pause,setPos:p=>{pause();setPos(p);return api.last;},
  setDate:d=>{pause();setPos(Math.round((ms(d)-ms(ctx.timeline.preStartDate))/DAY));return api.last;},
  end:()=>{pause();setPos(ctx.timeline.positions-1);return api.last;},get playing(){return playing;},get pos(){return pos;},get timeline(){return ctx?.timeline;},
  setPose:p=>scene.setPose(p),get pose(){return scene.pose;},inspect:()=>scene.inspect(),setRoof:v=>{scene.setRoofVisible(v);setPos(pos);$('roofToggle').checked=!!v;},
  get visiblePieces(){return scene.visiblePieces;},frameEnvelope:v=>scene.frameEnvelope(ctx.model.inventory,v)}));
$('play').onclick=()=>playing?pause():play();$('reset').onclick=()=>{pause();setPos(0);};$('end').onclick=()=>api.end();
$('back').onclick=()=>step(-1);$('fwd').onclick=()=>step(1);$('wback').onclick=()=>step(-7);$('wfwd').onclick=()=>step(7);
$('scrub').oninput=()=>{pause();setPos(Number($('scrub').value));};$('weekSel').onchange=()=>{pause();setPos(Number($('weekSel').value));};
for(const b of document.querySelectorAll('[data-speed]'))b.onclick=()=>{speed=Number(b.dataset.speed);document.querySelectorAll('[data-speed]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));};
// AUTO orbits, ISO/ALZADO/PLANTA frame the whole project, LIBRE keeps the current view for free exploration.
for(const b of document.querySelectorAll('[data-view]'))b.onclick=()=>{if(!ctx)return;const v=b.dataset.view;
  if(v==='auto')scene.setAuto(true);else if(v==='free')scene.setAuto(false);else{scene.setAuto(false);scene.setPose(v==='iso'?scene.presentationPose(ctx.model.inventory,'iso'):scene.frameEnvelope(ctx.model.inventory,v));}
  document.querySelectorAll('[data-view]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));};
$('roofToggle').onchange=()=>api.setRoof($('roofToggle').checked);
$('caseSel').innerHTML=FX.ids.map(id=>`<option value="${id}">${id}</option>`).join('');$('caseSel').onchange=()=>loadCase($('caseSel').value).catch(e=>$('importError').textContent=e.message);
const fail=e=>{$('importError').textContent='Importación rechazada: '+e.message;};
$('fileInput').onchange=async()=>{const f=$('fileInput').files[0];$('importError').textContent='';if(!f)return;try{await importText(await f.text());}catch(e){fail(e);}finally{$('fileInput').value='';}};
for(const [id,kind] of [['scheduleInput','schedule'],['budgetInput','budget'],['bindingInput','binding']])
  $(id).onchange=async()=>{const f=$(id).files[0];$('importError').textContent='';if(!f)return;try{await loadPart(kind,await f.text());}catch(e){fail(e);}finally{$(id).value='';}};
window.addEventListener('keydown',e=>{if(e.target.closest('select,input'))return;if(e.code==='Space'){e.preventDefault();playing?pause():play();}
  else if(e.key==='ArrowRight')step(e.shiftKey?7:1);else if(e.key==='ArrowLeft')step(e.shiftKey?-7:-1);});
window.addEventListener('resize',()=>requestAnimationFrame(()=>{ctx?.gantt?.drawArrows();scene.resize();}));
// Without ?case the lab opens the S1 dossier flow (dossier-ui.js loads it); ?case=A-D keeps the fidelity cases.
if(q.get('case')||!window.FloorPlanConstructionDossier)loadCase(FX.ids.includes(q.get('case'))?q.get('case'):'A').then(()=>{if(q.get('date')&&ctx.timeline)api.setDate(q.get('date'));if(q.get('end')==='1'&&ctx.timeline)api.end();})
  .catch(e=>{$('importError').textContent=e.message;document.body.classList.add('ready');});
