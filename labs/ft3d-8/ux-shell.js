/* FT3D-8 UX/4D shell (Gate D). Navigation (Proyecto · Evolución · Entrega), the compact project summary with ONE main
   action chosen from the real state, the readiness pill, and the explicit initial state of the evolution.
   It reads what the lab already computed (window.__ft3dFidelity.ctx, window.__ft3dDossier.evaluation) and the shared
   per-day moment (event «ft3d8-moment»): it never evaluates the plan, the budget or the dossier again. */
const Fid=()=>window.__ft3dFidelity,Dos=()=>window.__ft3dDossier,P=window.FloorPlanConstructionLabPresenter;
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const TABS=['proyecto','evolucion','entrega'];
const q=new URLSearchParams(location.search);
const ui=window.__ft3dUI={};

/* ---------- navigation ---------- */
function go(tab){
  if(!TABS.includes(tab))return;
  if(document.body.dataset.mode==='client'&&tab==='proyecto')tab='evolucion';
  document.body.dataset.tab=tab;
  for(const b of document.querySelectorAll('.tabs [role=tab]')){const on=b.dataset.tab===tab;b.setAttribute('aria-selected',String(on));b.tabIndex=on?0:-1;}
  // The canvas was hidden: size it again and redraw the Gantt arrows (the date, task and camera are untouched).
  requestAnimationFrame(()=>{window.dispatchEvent(new Event('resize'));Fid()?.ctx?.gantt?.drawArrows();});
}
// Opens the section and every collapsed block that contains an element (deep links and «Ver …» actions).
function reveal(selector){
  const el=typeof selector==='string'?document.querySelector(selector):selector;if(!el)return false;
  const panel=el.closest('.tabpanel');if(panel)go(panel.dataset.panel);
  for(let d=el.closest('details');d;d=d.parentElement?.closest('details'))d.open=true;
  if(el.tagName==='DETAILS')el.open=true;
  return true;
}
for(const b of document.querySelectorAll('.tabs [role=tab]')){
  b.onclick=()=>go(b.dataset.tab);
  b.onkeydown=e=>{const i=TABS.indexOf(b.dataset.tab),n={ArrowRight:1,ArrowLeft:-1}[e.key];if(!n)return;e.preventDefault();
    const t=TABS[(i+n+TABS.length)%TABS.length];go(t);document.getElementById('tab-'+t)?.focus();};
}
// Presentation mode leaves «Proyecto» (analysis) aside; delivery-ui keeps setting body[data-mode].
for(const b of document.querySelectorAll('[data-mode]'))b.addEventListener('click',()=>{if(b.dataset.mode==='client'&&document.body.dataset.tab==='proyecto')go('evolucion');});

/* ---------- project summary ---------- */
const STEP={valid:['ok','Comprobado'],ok:['ok','Verificado'],declared:['ok','Declarado'],available:['ok','Disponible'],partial:['warn','Parcial'],
  estimated:['warn','Aproximado'],pending:['warn','Pendiente'],obsolete:['warn','Desactualizado'],missing:['muted','No disponible'],conflict:['bad','Incompatible'],unverifiable:['muted','No verificable']};
const chipHtml=k=>{const [c,t]=STEP[k]||['muted',k];return `<span class="dchip d-${esc(k)}" data-tone="${c}">${esc(t)}</span>`;};
// What to do for each blocking issue (only actions that exist in the lab).
const FIX={'budget-other-project':'Carga el presupuesto de este proyecto para mostrar sus importes.','schedule-other-project':'Carga la planificación de este proyecto para ver su evolución.',
  'schedule-invalid':'Revisa el archivo de planificación: no es válido.','budget-invalid':'Revisa el archivo de presupuesto: no es válido.',
  'parcel-other-project':'Carga el GML de la parcela de este proyecto.','parcel-reference-mismatch':'Comprueba que el GML corresponde a la parcela guardada en el proyecto.',
  'parcel-document-invalid':'Usa un GML de Catastro con un sistema de coordenadas admitido.','brand-other-project':'Usa la marca asociada a este proyecto.',
  'dossier-altered':'Vuelve a preparar el expediente a partir de los documentos originales.','dossier-other-subject':'Abre el expediente correspondiente a este proyecto.',
  'binding-other-project':'Carga el vínculo de este proyecto.','binding-other-schedule':'Carga el vínculo aprobado para esta planificación.','binding-other-budget':'Carga el vínculo aprobado para este presupuesto.',
  'budget-selection-invalid':'Elige uno de los presupuestos de este proyecto.','placement-invalid':'Revisa la colocación del edificio en la parcela desde RUBIK.'};
function state(){
  const ctx=Fid()?.ctx;if(!ctx)return null;
  const ev=document.body.dataset.dossier?Dos()?.evaluation:null,m=ctx.model,steps=ev?Dos().summary().steps:null;
  const errors=(ev?ev.issues:m.issues).filter(i=>i.severity==='error');
  const plan=m.planning.status==='available';
  let tone='ok',pill='Listo para presentar';
  if(errors.length){tone='bad';pill=errors.length===1?'1 incompatibilidad':errors.length+' incompatibilidades';}
  else if(!plan){tone='warn';pill=m.planning.status==='rejected'?'Plan de otro proyecto':'Falta la planificación';}
  else if(m.delivery.level==='orientative'||m.delivery.level==='internal'){tone='warn';pill='Plan en borrador';}
  return {ctx,ev,m,steps,errors,plan,tone,pill};
}
function renderSummary(){
  const s=state(),box=$('projSummary');if(!s){box.innerHTML='';return;}
  const {ev,m,steps,errors,plan}=s;
  $('topProject').textContent=m.subject.name;$('topProject').title=m.subject.name;$('readiness').textContent=s.pill;$('readiness').dataset.state=s.tone;
  const inv=m.inventory,kind=inv.kind==='building'?`Edificio de ${inv.levels.length} plantas`:'Vivienda de una planta';
  const est=m.coverage.elements.byEvidence,approx=est.estimated+est.pending>0;
  const b=ev?.authorities.budget,t=ev?.authorities.territory;
  const budgetLine=!ev?(m.costs.status==='available'?`${P.euro(m.costs.report.scheduleTotals.allocatedKnownNet)} asignados sin IVA`:'Sin presupuesto asociado')
    :ev.issues.some(i=>i.code==='budget-other-project')?'Pertenece a otra vivienda'
    :b.scope==='none'?'Sin presupuesto: no se mostrarán importes'
    :b.scope==='levels-not-summed'?`Un presupuesto por planta (${b.selected.length}), sin sumarlos`
    :b.scope==='level'?'Solo el presupuesto de una planta'
    :`${b.selected[0].totals.net.amount===null?'Importe desconocido':P.euro(b.selected[0].totals.net.amount)} sin IVA${b.selected[0].totals.net.complete?'':' · faltan precios'}`;
  const sch=m.planning.status==='available'?Fid().ctx.schedule:null,bd=sch?window.FloorPlanConstructionSchedule.bounds(sch):null;
  const planLine=sch?`${sch.tasks.length} trabajos · ${P.dateLabel(bd.startDate)} → ${P.dateLabel(bd.endDate)}`:m.planning.status==='rejected'?'Pertenece a otro proyecto':'Todavía no hay planificación';
  const placeLine=!t?'—':t.parcel?`Parcela ${t.parcel.reference} · ${t.placement.status==='placed'?(t.placement.scaleEvidence==='verified'?'colocada':'colocada (escala aproximada)'):'sin colocar'}`:t.status==='candidate-unplaced'?'Parcela recibida, sin guardar en el proyecto':'Sin parcela (no se inventa)';
  const deliverLine=ev?(ev.usable.delivery?({'evidenced-plan':'Lista · revisión declarada, no acreditada','declared-plan':'Lista · revisión declarada, no acreditada',orientative:'Orientativa · plan en borrador'})[ev.delivery.level]||'Vista interna'
    :errors.length?'No disponible hasta corregir las incompatibilidades':'Necesita una planificación válida'):(plan?'Disponible en «Entrega»':'Necesita una planificación');
  const rows=[['Proyecto',steps?.[0],`${kind}${approx?' · medidas aproximadas':''}`],['Ubicación',steps?.[1],placeLine],['Presupuesto',steps?.[2],budgetLine],
    ['Planificación',steps?.[3],planLine],['Entrega',steps?.[5],deliverLine]];
  const lead=errors.length?`El expediente tiene ${errors.length===1?'una incompatibilidad':errors.length+' incompatibilidades'}: corrígelas para presentar con datos fiables.`
    :plan?'Proyecto preparado para ver su evolución.':'Puedes ver la vivienda en 3D. Añade una planificación para ver su evolución.';
  const main=errors.length?['fix','Resolver incompatibilidades']:plan?['evolution','Ver evolución']:['evolution','Ver la vivienda en 3D'];
  box.innerHTML=`<p class="kicker">${ev?(ev.dossier.route==='local-package'?'Expediente abierto desde un paquete':'Expediente de documentos cargados en este navegador'):'Modo fidelidad · sin expediente'}${/FIXTURE/.test(m.subject.name)?' · <span class="fx">datos de prueba</span>':''}</p>
    <h2>${esc(m.subject.name)}</h2><p class="lead${errors.length?' bad':''}">${esc(lead)}</p>
    <ul class="srows">${rows.map(([k,st,v])=>`<li data-row="${esc(k)}"><span class="k">${esc(k)}${st?chipHtml(st):''}</span><span class="v">${esc(v)}</span></li>`).join('')}</ul>
    ${errors.length?`<ul class="issues-ux">${errors.slice(0,4).map(i=>`<li data-code="${esc(i.code)}"><b>${esc(i.message)}</b><p>${esc(FIX[i.code]||'Revisa el detalle en el expediente completo.')}</p></li>`).join('')}</ul>`:''}
    <div class="pactions"><button type="button" class="btn primary" id="mainAction" data-act="${main[0]}">${esc(main[1])}</button>
      ${plan&&!errors.length?'':''}<button type="button" class="btn" data-act="budget">Revisar presupuesto</button><button type="button" class="btn" data-act="plan">Consultar planificación</button>
      ${ev?'<button type="button" class="btn link" data-act="full">Ver expediente completo</button>':''}<button type="button" class="btn link pro-only" data-act="load">Cargar documentos</button></div>`;
}
$('projSummary').addEventListener('click',e=>{const b=e.target.closest('[data-act]');if(!b)return;
  const a=b.dataset.act;
  if(a==='evolution'){go('evolucion');$('stage').focus({preventScroll:true});}
  else if(a==='fix'){const first=document.querySelector('#dossierFlow .dstep[data-status=conflict]');reveal(first||'#dossierFull');(first||$('dossierFull')).scrollIntoView({block:'start'});}
  else if(a==='budget'){const st=document.querySelector('#dossierFlow .dstep[data-step="3"]');if(st&&document.body.dataset.dossier){reveal(st);st.scrollIntoView({block:'start'});}else{reveal('#coverage');$('coverage').scrollIntoView({block:'start'});}}
  else if(a==='plan'){go('evolucion');requestAnimationFrame(()=>$('ganttWrap').scrollIntoView({block:'center'}));}
  else if(a==='full'){reveal('#dossierFull');$('dossierFull').scrollIntoView({block:'start'});}
  else if(a==='load')$('dossierFiles').click();
});

/* ---------- headline over the viewer (the reference «La obra, día a día · N semanas») ---------- */
// Everything comes from the loaded documents: weeks and dates from the plan, money from C1-C4 (net, «sin IVA»).
function renderHero(){
  const ctx=Fid()?.ctx;if(!ctx)return;const m=ctx.model,sch=ctx.schedule;
  $('heroProject').textContent=m.subject.name;
  $('heroFixture').hidden=!/FIXTURE/.test(m.subject.name);
  if(!sch){$('heroWeeks').textContent='—';$('heroUnit').textContent=m.planning.status==='rejected'?'plan de otro proyecto':'sin planificación';
    $('heroMeta').textContent='Se muestra la vivienda tal como está en el proyecto, sin fechas inventadas.';return;}
  const bd=window.FloorPlanConstructionSchedule.bounds(sch),weeks=P.weeks(sch).length;
  $('heroWeeks').textContent=String(weeks);$('heroUnit').textContent=weeks===1?'semana':'semanas';
  const review=m.planning.reviewed?'plan con revisión declarada':'plan en borrador';
  const r=m.costs.report,b=m.coverage.budget;
  const money=r?`asignado ${P.euro(r.scheduleTotals.allocatedKnownNet)} sin IVA${b&&(b.unassignedItemIds.length||b.pendingAllocations.length||b.unknownItemIds.length)?' (incompleto)':''}`
    :m.costs.reason==='building-budget-not-supported'||m.costs.reason==='level-budget-not-building'?'presupuestos por planta, sin total del edificio':'sin importes';
  $('heroMeta').textContent=`Inicio ${P.dateLabel(bd.startDate)} · Fin ${P.dateLabel(bd.endDate)} · ${review} · ${money}`;
}

/* ---------- initial state and scene notes ---------- */
function onMoment(last){
  const ctx=Fid()?.ctx;if(!ctx)return;
  const tl=ctx.timeline,before=!!tl&&last.date===tl.preStartDate,nothing=!last.presentElements?.length;
  const playing=Fid().playing;
  // Footprint only when nothing is standing yet (new build before the plan): real walls, flat, never a building.
  Fid().scene.setFootprint(!!tl&&nothing);
  const intro=$('introOverlay');
  if(before&&!playing){
    const s=ctx.schedule,bd=window.FloorPlanConstructionSchedule.bounds(s),weeks=P.weeks(s).length,reform=!nothing;
    $('introTitle').textContent=reform?'Situación actual, antes de la reforma':'Antes del comienzo de la obra';
    $('introText').textContent=reform?'Así está hoy. La reproducción muestra lo que se demuele y lo que se incorpora según el plan.':'Esta es la situación inicial de la evolución prevista. La huella marca dónde se levantará la vivienda.';
    $('introMeta').textContent=`Inicio previsto ${P.dateLabel(bd.startDate)} · ${s.tasks.length} trabajos · ${weeks} semanas`;
    intro.hidden=false;
  }else intro.hidden=true;
  // Planned work with no 3D representation is said, never drawn.
  const none=tl?ctx.canon.tasks.filter(t=>last.activeTaskIds?.includes(t.id)&&!t.elements.length):[];
  const note=$('sceneNote');
  if(!tl){note.hidden=false;note.textContent=ctx.model.planning.status==='rejected'?'La planificación cargada pertenece a otro proyecto: se muestra el modelo sin fechas.':'Sin planificación: se muestra la vivienda, sin fechas inventadas.';}
  else if(none.length){note.hidden=false;note.textContent=none.map(t=>t.title.replace(/^FIXTURE /,'').replace(/\s*\(sin geometr[ií]a en RUBIK\)/i,'')).join(' · ')+': planificado, sin representación 3D.';}
  else{note.hidden=true;note.textContent='';}
}
$('introPlay').onclick=()=>{$('introOverlay').hidden=true;Fid().play();};
window.addEventListener('ft3d8-moment',e=>onMoment(e.detail));
window.addEventListener('ft3d8-selection',()=>{requestAnimationFrame(()=>{renderSummary();renderHero();});});
window.addEventListener('ft3d8-dossier',()=>renderSummary());
document.getElementById('play').addEventListener('click',()=>{$('introOverlay').hidden=true;});

/* ---------- element -> tasks (click on the house, not a drag) ---------- */
const TYPE={wall:'Muro',window:'Ventana',door:'Puerta','sliding-door':'Puerta corredera',opening:'Hueco',floor:'Suelo',roof:'Cubierta',slab:'Forjado',object:'Objeto'};
const LIFE={new:'elemento nuevo',existing:'elemento existente',demolished:'elemento a demoler',undeclared:''};
let down=null;
$('stage').addEventListener('pointerdown',e=>{down={x:e.clientX,y:e.clientY};});
$('stage').addEventListener('pointerup',e=>{
  if(!down||Math.hypot(e.clientX-down.x,e.clientY-down.y)>5){down=null;return;}down=null;
  const ctx=Fid()?.ctx;if(!ctx)return;const key=Fid().scene.pick(e.clientX,e.clientY);showPick(key);
});
function showPick(key){
  const box=$('pickInfo'),ctx=Fid()?.ctx;
  if(!key||!ctx){box.hidden=true;return null;}
  const v=ctx.model.visualElements.find(x=>x.key===key);if(!v){box.hidden=true;return null;}
  const sch=ctx.schedule,date=Fid().last?.date,st=sch&&date?window.FloorPlanConstructionSchedule.stateAt(sch,date):null,report=ctx.model.costs.report;
  const rows=v.tasks.map(l=>{const t=ctx.canon?.tasks.find(z=>z.id===l.taskId);if(!t)return '';const s=st?.tasks.find(z=>z.id===t.id);
    const tc=report?.byTask.find(z=>z.taskId===t.id);
    return `<li><b>${esc(t.wbs)} ${esc(t.title.replace(/^FIXTURE /,''))}</b> · ${esc(P.dateLabel(t.startDate))} → ${esc(P.dateLabel(t.endDate))} · ${s?({'in-progress':'en curso según plan',completed:'terminada según plan','not-started':'pendiente'})[s.plannedPhase]:''}${tc&&tc.lines.length?` · ${tc.totalNet===null?'importe desconocido':P.euro(tc.totalNet)+' sin IVA'}`:''}
      <br><button type="button" class="btn" data-pick-task="${esc(t.id)}">Ver trabajo</button></li>`;}).join('');
  box.innerHTML=`<h4>${esc(TYPE[v.type]||v.type)}${LIFE[v.lifecycle]?' · '+esc(LIFE[v.lifecycle]):''}${v.levelId?` · ${esc(v.levelId)}`:''}</h4>
    ${rows?`<ul>${rows}</ul>`:'<p>Este elemento no tiene trabajos vinculados en la planificación.</p>'}<button type="button" class="btn" data-pick-close>Cerrar</button>`;
  box.hidden=false;box.dataset.key=key;return {key,tasks:v.tasks.map(t=>t.taskId)};
}
$('pickInfo').addEventListener('click',e=>{const t=e.target.closest('[data-pick-task]');if(t){$('pickInfo').hidden=true;Fid().selectTask(t.dataset.pickTask);}
  else if(e.target.closest('[data-pick-close]'))$('pickInfo').hidden=true;});
window.addEventListener('ft3d8-selection',()=>{$('pickInfo').hidden=true;});

/* ---------- first section ---------- */
// ?case= (fidelity) and ?tab= open where asked; a dossier opens on its summary («Ver evolución» is the main action).
go(TABS.includes(q.get('tab'))?q.get('tab'):q.get('case')?'evolucion':'proyecto');
// The first project may already be on screen (its fingerprints are computed asynchronously before this module runs).
if(Fid()?.ctx){renderSummary();renderHero();if(Fid().last)onMoment(Fid().last);}
Object.assign(ui,{go,reveal,renderSummary,showPick,get tab(){return document.body.dataset.tab;},state:()=>{const s=state();return s&&{pill:s.pill,tone:s.tone,errors:s.errors.map(i=>i.code),plan:s.plan};}});

/* GD-UX-01: the real height of the top bar (it wraps at some widths and with larger text) sizes the Evolución view. */
{const bar=document.querySelector('.topbar'),set=()=>document.documentElement.style.setProperty('--topbar-h',Math.round(bar.getBoundingClientRect().height)+'px');
  set();if(typeof ResizeObserver!=='undefined')new ResizeObserver(set).observe(bar);else window.addEventListener('resize',set);}

/* GD-UX-01 · hierarchy in the bottom band: every phase of the plan visible when it fits (row height from the real
   space, 16-24 px; beyond that the plan scrolls inside its box), and the 3D legend and hints moved into the viewer as a
   discreet note so they never take height from the plan. Desktop fit layout only; phones keep the stacked layout. */
{const fitMQ=window.matchMedia('(min-width:761px) and (min-height:560px)'),foot=document.querySelector('.evo-foot'),stage=document.querySelector('#panel-evolucion>.stagewrap'),home=foot?.parentElement,next=foot?.nextSibling;
  const place=()=>{if(!foot||!stage)return;if(fitMQ.matches&&!document.body.classList.contains('capture')){if(foot.parentElement!==stage)stage.append(foot);}else if(foot.parentElement!==home)home.insertBefore(foot,next);};
  const fitGantt=()=>{const g=document.getElementById('gantt');if(!g)return;const rows=g.querySelectorAll('.row').length;
    if(!fitMQ.matches||!rows){g.style.removeProperty('--grow');document.documentElement.style.removeProperty('--evo-need');}
    else{const head=g.querySelector('.ghead')?.offsetHeight||22,leg=document.getElementById('ganttLegend')?.offsetHeight||0;
      // The band asks for what shows every phase at 18 px (the CSS caps it); rows then share the real space (16-24 px).
      document.documentElement.style.setProperty('--evo-need',(head+rows*18+leg+10)+'px');
      const avail=g.clientHeight-head-2;g.style.setProperty('--grow',Math.max(16,Math.min(24,Math.floor(avail/rows)))+'px');}
    requestAnimationFrame(()=>Fid()?.ctx?.gantt?.drawArrows?.());};
  place();fitGantt();fitMQ.addEventListener?.('change',()=>{place();fitGantt();});
  if(typeof ResizeObserver!=='undefined')new ResizeObserver(fitGantt).observe(document.getElementById('gantt'));
  window.addEventListener('ft3d8-selection',()=>requestAnimationFrame(fitGantt));
  ui.fitGantt=fitGantt;}
