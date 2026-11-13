/* FT3D-8 FIDELITY LAB controller. The building shown is the selected RUBIK project (fixture A-D or a project file
   imported locally in this browser); never the demo house. Dates/tasks: the FT3D-8 plan. Money: the C1-C4 budget.
   Missing data is shown as missing: no plan -> static model + "PLANIFICACION NO DISPONIBLE", no budget -> no amounts,
   elements without a task -> grey outline "sin tarea", categories RUBIK does not model -> listed, not drawn. */
import {createProjectScene} from './project-scene.js';
import {createGanttView} from './gantt-view.js';
import {attachGlGuard,createSceneSafely} from './gl-guard.js';
const S=window.FloorPlanConstructionSchedule,V=window.FloorPlanConstructionVisualState,G=window.FloorPlanConstructionGantt,
  P=window.FloorPlanConstructionLabPresenter,B=window.FloorPlanBudget,A=window.FloorPlanConstructionProject,FX=window.FT3D8FidelityFixtures;
const $=id=>document.getElementById(id),DAY=86400000,ms=d=>Date.parse(d+'T00:00:00Z'),iso=x=>new Date(x).toISOString().slice(0,10);
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const LAYER=['finish','cladding'],APPEARS=['site','build','structure','envelope','services'];
const q=new URLSearchParams(location.search),LIB=window.__ft3dSource?.mode==='library',RUBIK=LIB&&!!window.__ft3dSource?.embedded;
if(q.get('capture')){const [w,h]=q.get('capture').split('x').map(Number);if(w&&h)document.documentElement.style.setProperty('--capture-w',w+'px'),document.documentElement.style.setProperty('--capture-h',h+'px'),document.body.classList.add('capture');}
const scene=createSceneSafely(createProjectScene,$('stage'));
// GOV-07: aviso y recuperación si se pierde el contexto WebGL, degradación controlada y DPR adaptativo.
// Solo en laboratorio (?lab=1): tiempos de prueba para ejercitar la recuperación y el DPR en CI. El producto usa los
// valores por defecto del núcleo.
const glLab=q.get('lab')==='1',glNum=(k,min)=>glLab&&q.get(k)?Math.max(min,Number(q.get(k))||0):null;
window.__ft3dGlGuard=attachGlGuard(scene,{...(glNum('glRestoreMs',500)?{restoreTimeoutMs:glNum('glRestoreMs',500)}:{}),governorOptions:glNum('glBudgetMs',1)?{budgetMs:glNum('glBudgetMs',1)}:{}});
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
  $('origin').textContent=meta.origin;$('origin').title=meta.origin;$('origin').dataset.kind=meta.kind;
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
// The moment card (bottom-left, as in the owner's reference). Short first: week, date, headline, the tasks of this
// instant with their dates, share of their planned time and assigned amount (sin IVA); details on demand.
const days=(a,b)=>Math.round((ms(b)-ms(a))/DAY)+1;
// Project elements and illustrative site resources are counted apart: an illustration is never «del modelo».
const elemText=t=>{const ill=t.elements.filter(e=>e.elementId.startsWith('illustrative/')),own=t.elements.length-ill.length,parts=[];
  if(own)parts.push(`${own} ${own===1?'elemento':'elementos'} del modelo`);
  if(ill.length)parts.push(ill.map(e=>(ctx.model.illustrative||[]).find(r=>r.key===e.elementId)?.label||e.elementId).join(', ').toLowerCase()+' (ilustración)');
  return parts.join(' · ')||'sin representación 3D';};
function costHtml(t,report){
  if(!report)return `<div class="cost c-desconocido"><b>Importes no disponibles</b> · ${esc(ctx.model.costs.message||'sin presupuesto de este proyecto')}</div>`;
  const cost=P.costView(report.byTask.find(x=>x.taskId===t.id),report);
  return `<div class="cost c-${cost.status}"><b>${esc(cost.label)}</b> · asignado sin IVA ${esc(cost.totalText)}${cost.status==='parcial'?' · conocido '+esc(cost.knownText):''}</div>`;
}
function renderCard(date){
  const m=ctx.model,x=$('cardExtra');
  if(!ctx.schedule){$('cardWeek').textContent='SIN PLAN';$('cardDate').textContent='';$('cardHeadline').textContent=m.planning.status==='rejected'?m.planning.message:'PLANIFICACIÓN NO DISPONIBLE O PENDIENTE';
    $('cardEvidence').textContent='Se muestra el modelo del proyecto, sin fechas inventadas';$('cardTasks').innerHTML='';$('cardStage').textContent='SOLO MODELO';$('cardStage').dataset.stage='none';
    x.innerHTML=m.planning.status==='rejected'?'':'<p class="note">Añade la planificación de este proyecto para ver su evolución día a día.</p>';return null;}
  const report=m.costs.report;
  const c=report?P.taskCard(ctx.schedule,report,date):{week:P.weekOf(ctx.schedule,date),dateText:P.dateLabel(date),evidenceText:'Plan · animación ilustrativa',headline:'',active:[],stage:'en-obra'};
  const st=S.stateAt(ctx.schedule,date),active=st.tasks.filter(t=>t.plannedPhase==='in-progress');
  $('cardWeek').textContent=c.week.label;$('cardWeek').classList.toggle('long',c.week.label.length>14);$('cardDate').textContent=c.dateText.toUpperCase();$('cardEvidence').textContent=c.evidenceText;
  // Same wording as the video frame (FloorPlanConstructionDelivery.moment): what the screen says, the MP4 says.
  const mo=window.FloorPlanConstructionDelivery.moment(ctx.schedule,date,st),done=mo.done,idle=mo.idle;
  $('cardHeadline').textContent=mo.headline;$('cardHeadline').title=mo.headline;$('cardStage').textContent=mo.stageText;$('cardStage').dataset.stage=mo.stage;
  // The selected task (from the Gantt) is always shown, first, even outside its dates.
  const sel=selected?st.tasks.find(t=>t.id===selected):null,shown=[...(sel?[sel]:[]),...active.filter(t=>t.id!==selected)];
  const phaseText=t=>t.plannedPhase==='in-progress'?`${Math.round(t.visualProgress*100)} % del plazo`:t.plannedPhase==='completed'?'terminada según plan':'pendiente';
  $('cardTasks').innerHTML=shown.map(t=>`<li${t.id===selected?' class="sel"':''}><div class="t"><span class="wbs">${esc(t.wbs)}</span> ${esc(t.title.replace(/^FIXTURE /,''))} <span class="pp">${esc(phaseText(t))}</span></div>
      <div class="d">${esc(P.dateLabel(t.startDate))} → ${esc(P.dateLabel(t.endDate))} · ${days(t.startDate,t.endDate)} días · ${esc(elemText(t))}</div>
      ${costHtml(t,report)}</li>`).join('')||(done?`<li class="none"><div class="notes">Fin del plan, no certificado de fin de obra</div></li>`:'');
  // Second level: simultaneity, what the amounts are, next activity, task and item details, back to the overview.
  const extra=[];
  if(mo.concurrentText)extra.push(`<p class="note">${esc(mo.concurrentText)}.</p>`);
  if(idle){const next=ctx.canon.tasks.filter(t=>t.startDate>date).sort((a,b)=>a.startDate.localeCompare(b.startDate))[0];
    if(next)extra.push(`<button type="button" class="btn" data-card="next" data-date="${esc(next.startDate)}">Ir a la siguiente actividad: ${esc(next.title.replace(/^FIXTURE /,''))}</button>`);}
  // M2: the project's budget picture, said once and plainly (C1–C4 amounts + explicit allocations; never a total of the works).
  if(LIB&&report){const cov=m.coverage.budget,parts=[];if(cov){
    parts.push(`Presupuesto conocido del proyecto: ${cov.budgetKnownNet===null?'desconocido':P.euro(cov.budgetKnownNet)} sin IVA${cov.unknownItemIds.length?' (parcial)':''}`);
    if(cov.unknownItemIds.length)parts.push(`${cov.unknownItemIds.length} ${cov.unknownItemIds.length===1?'partida sin precio':'partidas sin precio'}`);
    if(cov.unassignedItemIds.length)parts.push(`${cov.unassignedItemIds.length} ${cov.unassignedItemIds.length===1?'partida sin asignar a tareas':'partidas sin asignar a tareas'}`);
    if(cov.pendingAllocations.length)parts.push(`${cov.pendingAllocations.length} con reparto pendiente`);
    extra.push(`<p class="note econ" id="cardEconomy">${esc(parts.join(' · '))}.</p>`);}}
  if(report&&shown.length){const cov=m.coverage.budget;
    extra.push(`<p class="note">Importes sin IVA de las partidas vinculadas a cada trabajo: no son el coste total de la obra${cov&&(cov.unassignedItemIds.length||cov.pendingAllocations.length||cov.unknownItemIds.length)?'; hay partidas sin asignar o sin precio':''}.</p>`);
    extra.push(`<details class="cdet"><summary>Ver tareas y partidas</summary>${shown.map(t=>{const tc=report.byTask.find(b=>b.taskId===t.id);const deps=(ctx.canon.tasks.find(z=>z.id===t.id)?.dependsOn||[]);
      return `<div class="cdet-t"><b>${esc(t.wbs)} ${esc(t.title.replace(/^FIXTURE /,''))}</b>${deps.length?`<p>Depende de: ${esc(deps.map(d=>(typeof d==='string'?d:d.taskId)+(d.type&&d.type!=='FS'?` (${d.type}${d.lagDays?'+'+d.lagDays+' d':''})`:'')).join(', '))}</p>`:''}
        ${tc&&tc.lines.length?`<ul>${tc.lines.map(l=>`<li>${RUBIK?`<button type="button" class="linkbtn" data-rubik="open-budget" data-item-id="${esc(l.itemId)}" title="Abrir la partida en Presupuestar">${esc(l.description||l.itemId)}</button>`:esc(l.description||l.itemId)} · ${l.sharePercent} % · ${l.allocatedNet===null?'importe desconocido':P.euro(l.allocatedNet)+' sin IVA'}${l.reviewStatus==='reviewed'?'':' · precio sin revisar'}${l.quantityStatus==='estimated'?' · cantidad estimada':''}</li>`).join('')}</ul>`:'<p>Sin partidas asignadas.</p>'}${RUBIK?`<button type="button" class="linkbtn" data-rubik="open-plan" data-task-id="${esc(t.id)}">Ver la tarea en el plan de obra</button>`:''}</div>`;}).join('')}</details>`);}
  if(report&&report.projectRevision.check!=='match')extra.push('<p class="note">El presupuesto no indica sobre qué revisión del proyecto se hizo.</p>');
  if(selected)extra.push('<button type="button" class="btn" data-card="clear">Volver a la vista general</button>');
  x.innerHTML=extra.join('');
  return c;
}
// Selection from the Gantt: go to the middle of the task, show it first in the card and outline its elements.
let selected=null;
function applyHighlight(){
  if(!ctx)return 0;const t=selected?ctx.canon?.tasks.find(z=>z.id===selected):null;
  const present=new Set(api.last?.presentElements||[]);
  return scene.highlight(t?t.elements.map(e=>e.elementId).filter(k=>present.has(k)):[]);
}
function selectTask(id){
  if(!ctx?.schedule)return null;const t=ctx.canon.tasks.find(z=>z.id===id);if(!t)return null;
  selected=id;pause();ctx.gantt.select(id);
  const mid=Math.round((ms(t.startDate)+ms(t.endDate))/2/DAY)*DAY;lastDay=-1;setPos(Math.round((mid-ms(ctx.timeline.preStartDate))/DAY));
  window.dispatchEvent(new CustomEvent('ft3d8-task',{detail:{taskId:id}}));
  return {...api.last,selected:id,highlighted:applyHighlight()};
}
function clearSelection(){selected=null;ctx?.gantt?.select(null);scene.highlight([]);lastDay=-1;if(ctx)setPos(pos);window.dispatchEvent(new CustomEvent('ft3d8-task',{detail:{taskId:null}}));}
$('cardExtra').addEventListener('click',e=>{const b=e.target.closest('[data-card]');if(!b)return;
  if(b.dataset.card==='clear')clearSelection();else if(b.dataset.card==='next'){pause();setPos(Math.round((ms(b.dataset.date)-ms(ctx.timeline.preStartDate))/DAY));}});
function setPos(p){
  if(!ctx)return;const tl=ctx.timeline;
  if(!tl){scene.setState(stateFor(ctx.model,null,null,0));$('dateReadout').textContent='';
    api.last={date:null,stage:'none',activeTaskIds:[],presentElements:ctx.model.visualElements.filter(v=>v.representable).map(v=>v.key),modes:Object.fromEntries(ctx.model.visualElements.map(v=>[v.key,'pre-existing']))};
    window.dispatchEvent(new CustomEvent('ft3d8-moment',{detail:api.last}));return;}
  const LAST=tl.positions-1;pos=Math.max(0,Math.min(LAST,p));
  const i=Math.floor(pos+1e-9),j=Math.min(LAST,i+1),f=pos-i,date=iso(ms(tl.preStartDate)+i*DAY);
  const states=stateFor(ctx.model,ctx.frames[i],ctx.frames[j],f);scene.setState(states,pos);
  $('scrub').value=String(pos);ctx.gantt.update(pos,date);
  if(i!==lastDay){lastDay=i;renderCard(date);$('dateReadout').textContent=P.dateLabel(date).toUpperCase();
    const w=P.weekOf(ctx.schedule,date),ws=P.weeks(ctx.schedule);$('weekSel').value=String(i>=LAST?LAST:w.n===0?0:Math.round((ms(ws[w.n-1].startDate)-ms(tl.preStartDate))/DAY));
    const fr=ctx.frames[i];document.body.dataset.stage=fr.stage;
    api.last={date,stage:fr.stage,activeTaskIds:fr.activeTaskIds,ganttCursorDate:document.querySelector('#gantt [data-role=cursor]').dataset.date,
      presentElements:fr.elements.filter(e=>e.present).map(e=>e.elementId),modes:Object.fromEntries([...states].map(([k,s])=>[k,s.mode]))};
    // One evaluation per day, shared: the shell (intro, notes, selection) listens instead of recomputing the plan.
    applyHighlight();
    window.dispatchEvent(new CustomEvent('ft3d8-moment',{detail:api.last}));}
}
// model/dossier: when a construction dossier (S1) was evaluated, its model is reused as is (one evaluation, one source).
// GOV-07: selections can overlap (a new project chosen while the previous one is still being evaluated). Only the LAST
// one asked is shown: an older evaluation that finishes later is discarded, never drawn over the newer selection.
let showSeq=0;
async function show(input,meta,preModel=null,dossier=null){
  const seq=++showSeq;
  pause();lastDay=-1;selected=null;scene.highlight([]);
  const model=preModel||await A.evaluate(input);
  if(seq!==showSeq)return {superseded:true,subject:model.subject};
  const schedule=model.planning.status==='available'?input.schedule:null,timeline=schedule?V.timeline(schedule):null;
  // GOV-07: the previous Gantt is retired only now that the new selection evaluated (a rejected import keeps it working).
  ctx?.gantt?.destroy();
  ctx={input,model,schedule,canon:schedule?S.canonical(schedule):null,timeline,meta,dossier,dossierInput:meta.dossierInput||null,frames:timeline?Array.from({length:timeline.positions},(_,i)=>V.frameAt(schedule,iso(ms(timeline.preStartDate)+i*DAY))):null};
  scene.load(model.inventory,model.illustrative||[]);
  // Reform: the derived roof hides the interior works; it stays available through the toggle.
  const reform=model.inventory.elements.some(e=>e.lifecycle==='existing'||e.lifecycle==='demolished');scene.setRoofVisible(!reform);$('roofToggle').checked=!reform;$('roofCut')?.setAttribute('aria-pressed',String(reform));camView='auto';framedFinal=false;scene.setPose(fitPose('iso'));scene.setAuto(!document.body.classList.contains('capture'));
  renderHeader(model,meta);
  const controls=document.querySelector('.transport');controls.dataset.disabled=String(!timeline);
  if(timeline){$('scrub').max=String(timeline.positions-1);
    ctx.gantt=createGanttView($('gantt'),{schedule,report:model.costs.report,timeline,S,G,P,onPick:p=>{pause();setPos(p);},onSelect:id=>selectTask(id)});
    $('weekSel').innerHTML=`<option value="0">Antes del plan</option>`+P.weeks(schedule).map(w=>`<option value="${Math.round((ms(w.startDate)-ms(timeline.preStartDate))/DAY)}">SEM ${String(w.n).padStart(2,'0')} · ${P.dateLabel(w.startDate)}</option>`).join('')+`<option value="${timeline.positions-1}">FIN · plan completado</option>`;
  }else{$('gantt').innerHTML=model.planning.status==='rejected'
      ?`<p class="noplan" id="planRejected">${esc(model.planning.message)}. El modelo se muestra estático; ${LIB?'revisa el plan en Presupuestar → Plan de obra':'carga un plan de '+esc(model.subject.id)} para reproducir su evolución.</p>`
      :LIB?`<p class="noplan" id="planMissing">Este proyecto todavía no tiene plan de obra. RUBIK no inventa fechas: crea las tareas en Presupuestar → Plan de obra. ${window.__ft3dSource.embedded?'<button type="button" class="btn primary" data-rubik="open-plan">Crear plan de obra</button>':''}</p>`
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
Object.defineProperties(api,Object.getOwnPropertyDescriptors({loadCase,importText,loadPart,show,selectTask,clearSelection,get selected(){return selected;},get ctx(){return ctx;},get scene(){return scene;},play,pause,setPos:p=>{pause();setPos(p);return api.last;},
  setDate:d=>{pause();setPos(Math.round((ms(d)-ms(ctx.timeline.preStartDate))/DAY));return api.last;},
  end:()=>{pause();setPos(ctx.timeline.positions-1);return api.last;},get playing(){return playing;},get pos(){return pos;},get timeline(){return ctx?.timeline;},
  setPose:p=>scene.setPose(p),get pose(){return scene.pose;},inspect:()=>scene.inspect(),setRoof:v=>{scene.setRoofVisible(v);setPos(pos);$('roofToggle').checked=!!v;},
  get visiblePieces(){return scene.visiblePieces;},frameEnvelope:v=>scene.frameEnvelope(ctx.model.inventory,v)}));
$('play').onclick=()=>playing?pause():play();$('reset').onclick=()=>{pause();setPos(0);};$('end').onclick=()=>api.end();
$('back').onclick=()=>step(-1);$('fwd').onclick=()=>step(1);$('wback').onclick=()=>step(-7);$('wfwd').onclick=()=>step(7);
$('scrub').oninput=()=>{pause();setPos(Number($('scrub').value));};$('weekSel').onchange=()=>{pause();setPos(Number($('weekSel').value));};
for(const b of document.querySelectorAll('[data-speed]'))b.onclick=()=>{speed=Number(b.dataset.speed);document.querySelectorAll('[data-speed]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));};
/* GD-UX-01 framing: fit the project into the part of the viewer the headline leaves free (left column or top band,
   whichever leaves the house larger), with the viewer's real size; re-framed when the layout changes size, unless the
   user moved the camera or chose LIBRE. */
let camView='auto';
function heroReserve(){
  const hero=document.getElementById('hero'),cv=scene.canvas;if(!hero||document.body.classList.contains('capture')||!hero.offsetParent)return [{left:0,top:0}];
  const h=hero.getBoundingClientRect(),c=cv.getBoundingClientRect();if(!c.width||!c.height)return [{left:0,top:0}];
  return [{left:Math.max(0,(h.right-c.left+8)/c.width),top:0},{left:0,top:Math.max(0,(h.bottom-c.top+8)/c.height)}];
}
function fitPose(view,opts={}){
  const poses=heroReserve().map(r=>scene.presentationPose(ctx.model.inventory,view,r,opts));
  const dist=p=>Math.hypot(...p.position.map((v,i)=>v-p.target[i]));return poses.reduce((a,b)=>dist(b)<dist(a)?b:a);
}
let framedFinal=false;
scene.onResize=()=>{if(!ctx||camView==='free'||scene.userMoved||document.body.classList.contains('capture'))return;const auto=camView==='auto';scene.setPose(fitPose(auto?'iso':camView,{standing:!auto||framedFinal}));if(auto)scene.setAuto(true);};
// AUTO: at the end of the plan (site resources removed) the camera comes closer to the finished house; going back in
// time restores the site framing. Never while a video is recorded, in capture mode or after the user moved the camera.
window.addEventListener('ft3d8-moment',e=>{const fin=e.detail?.stage==='final';if(fin===framedFinal)return;
  if(!ctx||camView!=='auto'||scene.userMoved||document.body.classList.contains('capture')||window.__ft3dDelivery?.state?.recording){framedFinal=fin;return;}
  framedFinal=fin;scene.setPose(fitPose('iso',{standing:fin}));scene.setAuto(true);});
// AUTO orbits, ISO/ALZADO/PLANTA frame the whole project, LIBRE keeps the current view for free exploration.
for(const b of document.querySelectorAll('[data-view]'))b.onclick=()=>{if(!ctx)return;const v=b.dataset.view;
  camView=v;if(v==='auto'){scene.setPose(fitPose('iso'));scene.setAuto(true);}else if(v==='free')scene.setAuto(false);else{scene.setAuto(false);scene.setPose(fitPose(v,{standing:true}));}
  document.querySelectorAll('[data-view]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));};
$('roofToggle').onchange=()=>api.setRoof($('roofToggle').checked);
// D-14: in RUBIK the lab controls are hidden, so the viewer offers its own «INTERIOR» switch (roof hidden ↔ shown).
const syncRoofCut=()=>$('roofCut')?.setAttribute('aria-pressed',String(!$('roofToggle').checked));
if($('roofCut'))$('roofCut').onclick=()=>{if(!ctx)return;api.setRoof(!$('roofToggle').checked);syncRoofCut();};
if(FX)$('caseSel').innerHTML=FX.ids.map(id=>`<option value="${id}">${id}</option>`).join('');$('caseSel').onchange=()=>loadCase($('caseSel').value).catch(e=>$('importError').textContent=e.message);
const fail=e=>{$('importError').textContent='Importación rechazada: '+e.message;};
$('fileInput').onchange=async()=>{const f=$('fileInput').files[0];$('importError').textContent='';if(!f)return;try{await importText(await f.text());}catch(e){fail(e);}finally{$('fileInput').value='';}};
for(const [id,kind] of [['scheduleInput','schedule'],['budgetInput','budget'],['bindingInput','binding']])
  $(id).onchange=async()=>{const f=$(id).files[0];$('importError').textContent='';if(!f)return;try{await loadPart(kind,await f.text());}catch(e){fail(e);}finally{$(id).value='';}};
window.addEventListener('keydown',e=>{if(e.target.closest('select,input'))return;if(e.code==='Space'){e.preventDefault();playing?pause():play();}
  else if(e.key==='ArrowRight')step(e.shiftKey?7:1);else if(e.key==='ArrowLeft')step(e.shiftKey?-7:-1);});
window.addEventListener('resize',()=>requestAnimationFrame(()=>{ctx?.gantt?.drawArrows();scene.resize();}));
// Without ?case the lab opens the S1 dossier flow (dossier-ui.js loads it); ?case=A-D keeps the fidelity cases.
if(FX&&(q.get('case')||!window.FloorPlanConstructionDossier))loadCase(FX.ids.includes(q.get('case'))?q.get('case'):'A').then(()=>{if(q.get('date')&&ctx.timeline)api.setDate(q.get('date'));if(q.get('end')==='1'&&ctx.timeline)api.end();})
  .catch(e=>{$('importError').textContent=e.message;document.body.classList.add('ready');});
