/* OBR-02 + OBR-03 · Panel «Plan a la fecha» de la Evolución. Escucha el momento del día (evento «ft3d8-moment», el mismo
   que usa ux-shell) y pinta, sin volver a evaluar el plan ni el presupuesto:
   - el anillo «% del plan» (PLANIFICADO), el coste planificado a la fecha (o «No disponible», nunca 0) y lo ejecutado
     («sin registrar»), con FloorPlanPlanPreview.snapshot sobre el plan y el reparto C1–C4 que ya calculó la Evolución;
   - la siguiente tarea planificada (WBS, fechas, dependencias) y sus elementos en fantasma (scene.setPreview).
   Nunca durante la grabación del vídeo ni en modo captura: lo que ve el cliente no cambia. */
const PP=window.FloorPlanPlanPreview,P=window.FloorPlanConstructionLabPresenter;
const fid=()=>window.__ft3dFidelity;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const eur=v=>new Intl.NumberFormat('es-ES',{style:'currency',currency:'EUR'}).format(v);
const pct=v=>new Intl.NumberFormat('es-ES',{maximumFractionDigits:1}).format(v);
const dateLabel=d=>P?.dateLabel?P.dateLabel(d):d;
const DEP={FS:'fin→inicio',SS:'inicio→inicio',FF:'fin→fin',SF:'inicio→fin'};
const PRED={completed:'terminada según plan','in-progress':'en curso según plan',pending:'pendiente según plan'};
const state={snapshot:null,ghostKeys:[],shown:0,ghost:true};
window.__ft3dPlanPreview=state;

const host=document.querySelector('.stagewrap');
const box=document.createElement('section');box.className='plan-preview';box.setAttribute('aria-label','Plan a la fecha (planificado, no obra ejecutada)');box.hidden=true;
box.innerHTML=`<button type="button" class="pp-toggle" aria-expanded="true" aria-controls="ppBody"><svg viewBox="0 0 44 44" class="pp-ring" aria-hidden="true"><circle cx="22" cy="22" r="18" class="pp-track"/><circle cx="22" cy="22" r="18" class="pp-arc" pathLength="100" stroke-dasharray="0 100"/></svg><span class="pp-ringtxt">—</span><span class="pp-cap">Plan a la fecha <em>planificado</em></span></button>
<div id="ppBody" class="pp-body"><p class="pp-line pp-pct"></p><p class="pp-line pp-cost"></p><p class="pp-line pp-exec"></p><div class="pp-next"></div><p class="pp-note"></p></div>`;
host?.append(box);
const style=document.createElement('style');style.textContent=`
.plan-preview{position:absolute;right:16px;top:64px;z-index:4;width:min(320px,calc(100% - 32px));max-height:calc(100% - 150px);display:flex;flex-direction:column;background:rgba(255,255,255,.97);color:#1d2124;border:1px solid #d6d3cc;border-radius:8px;box-shadow:0 4px 18px rgba(0,0,0,.10);font:13px/1.4 system-ui,-apple-system,"Segoe UI",sans-serif}
.plan-preview .pp-toggle{display:flex;align-items:center;gap:10px;width:100%;min-height:52px;padding:6px 10px;border:0;background:none;color:inherit;font:inherit;text-align:left;cursor:pointer;position:relative}
.plan-preview .pp-toggle:focus-visible{outline:3px solid #2f7f8c;outline-offset:-3px}
.plan-preview .pp-ring{width:44px;height:44px;flex:none;transform:rotate(-90deg)}.plan-preview .pp-track{fill:none;stroke:#e4e1da;stroke-width:6}.plan-preview .pp-arc{fill:none;stroke:#0f7f95;stroke-width:6;stroke-linecap:butt}
.plan-preview .pp-ringtxt{position:absolute;left:10px;width:44px;text-align:center;font-weight:700;font-size:9.5px;letter-spacing:-.02em}
.plan-preview .pp-cap{font-weight:600}.plan-preview .pp-cap em{display:block;font-style:normal;font-weight:400;color:#5b6166;font-size:12px}
.plan-preview .pp-body{padding:0 12px 10px;border-top:1px solid #ebe8e2;overflow:auto;min-height:0}.plan-preview .pp-line{margin:.45em 0}.plan-preview .pp-na{color:#7a4a12}
.plan-preview .pp-next{border-left:3px solid #0f7f95;padding:4px 0 4px 8px;margin:.5em 0}.plan-preview .pp-next h4{margin:0 0 2px;font-size:12px;text-transform:uppercase;letter-spacing:.03em;color:#0f6f82}
.plan-preview .pp-next p{margin:.2em 0}.plan-preview .pp-next ul{margin:.2em 0;padding-left:1.1em}.plan-preview label{display:flex;align-items:center;gap:6px;min-height:36px}
.plan-preview .pp-actions{display:flex;flex-wrap:wrap;gap:6px;align-items:center}.plan-preview .pp-actions button{min-height:36px;padding:0 10px;border:1px solid #c9c6bf;border-radius:6px;background:#fff;font:inherit;cursor:pointer}
.plan-preview .pp-note{margin:.5em 0 0;font-size:11.5px;color:#5b6166}
@media (max-width:720px){.plan-preview{top:auto;bottom:56px;left:8px;right:auto;width:auto;max-width:calc(100% - 16px);max-height:calc(100% - 72px)}.plan-preview:has(.pp-toggle[aria-expanded=true]){width:min(320px,calc(100% - 16px))}}
body.capture .plan-preview{display:none!important}`;
document.head.append(style);
const $=s=>box.querySelector(s);
$('.pp-toggle').addEventListener('click',()=>{const open=$('.pp-toggle').getAttribute('aria-expanded')!=='true';$('.pp-toggle').setAttribute('aria-expanded',String(open));$('.pp-body').hidden=!open;});
// En pantallas pequeñas empieza plegado (el anillo sigue visible).
if(matchMedia('(max-width:720px)').matches){$('.pp-toggle').setAttribute('aria-expanded','false');$('.pp-body').hidden=true;}

function render(s){
  box.hidden=false;state.snapshot=s;
  const p=s.progress;$('.pp-arc').setAttribute('stroke-dasharray',`${p?p.percent:0} 100`);$('.pp-ringtxt').textContent=p?pct(p.percent)+'%':'—';
  if(s.state!=='available'){
    $('.pp-pct').innerHTML=`<span class="pp-na"><b>% del plan: no disponible.</b> ${esc(s.message)}</span>`;$('.pp-cost').innerHTML=`<span class="pp-na">Coste planificado a la fecha: <b>No disponible</b>.</span>`;
  }else{
    $('.pp-pct').innerHTML=`<b>${pct(p.percent)} %</b> del plan transcurrido · <b>planificado</b> (${p.tasks.completedPlanned} de ${p.tasks.total} tareas terminadas según plan, ${p.tasks.inProgressPlanned} en curso)`;
    const c=s.cost;
    $('.pp-cost').innerHTML=c.status==='available'?`Coste planificado a la fecha: <b>${eur(c.amount)}</b> sin IVA${c.plannedTotal!==null?` de ${eur(c.plannedTotal)} planificados`:''}`
      :c.status==='partial'?`Coste planificado a la fecha: <b>parcial</b>, ${eur(c.knownAmount)} sin IVA conocidos. ${esc(c.message)}`
      :`<span class="pp-na">Coste planificado a la fecha: <b>No disponible</b>. ${esc(c.message.replace(/^No disponible:\s*/,''))}</span>`;
  }
  $('.pp-exec').innerHTML=`Ejecutado: <b>sin registrar</b>`;$('.pp-exec').title=s.executed.label;
  const n=s.next;
  if(!n){$('.pp-next').innerHTML='';}
  else if(n.state!=='planned')$('.pp-next').innerHTML=`<h4>Siguiente tarea</h4><p>${esc(n.message)}</p>`;
  else $('.pp-next').innerHTML=`<h4>Siguiente tarea · planificada</h4>${n.tasks.map(t=>`<p><b>${esc(t.wbs)} ${esc(t.title)}</b></p>
    <p>Empieza ${esc(dateLabel(t.startDate))} (en ${t.daysUntil} día${t.daysUntil===1?'':'s'}) · ${t.durationDays} días</p>
    <p>${t.dependsOn.length?'Depende de: '+t.dependsOn.map(d=>`${esc(d.wbs||'')} ${esc(d.title||d.taskId)} (${DEP[d.type]}${d.lagDays?`, ${d.lagDays>0?'+':''}${d.lagDays} d`:''}; ${PRED[d.predecessorPlanned]})`).join(' · '):'Sin dependencias declaradas.'}</p>
    <p>${t.previewElementIds.length?`${t.previewElementIds.length} elemento(s) del modelo`:'Sin elementos del modelo vinculados: nada que mostrar en fantasma.'}</p>
    <div class="pp-actions"><button type="button" data-task="${esc(t.id)}">Ver en el plan</button></div>`).join('')}
    <label><input type="checkbox" class="pp-ghost" ${state.ghost?'checked':''}> Ver la siguiente en fantasma (azul)</label>`;
  $('.pp-note').textContent=s.state==='available'?`Todo es plan, no avance real de obra.${s.cost.assumption?' '+s.cost.assumption:''}`:'Todo es plan, no avance real de obra.';
  applyGhost();
}
function applyGhost(){
  const f=fid(),s=state.snapshot,rec=window.__ft3dDelivery?.state?.recording||document.body.classList.contains('capture');
  const keys=!rec&&state.ghost&&s?.next?.state==='planned'?[...new Set(s.next.tasks.flatMap(t=>t.previewElementIds))]:[];
  if(keys.join('\u0000')===state.ghostKeys.join('\u0000')&&!rec)return;
  state.ghostKeys=keys;state.shown=f?.scene?.setPreview?f.scene.setPreview(keys):0;
}
box.addEventListener('change',e=>{if(e.target.classList.contains('pp-ghost')){state.ghost=e.target.checked;applyGhost();}});
box.addEventListener('click',e=>{const b=e.target.closest('[data-task]');if(b)fid()?.selectTask(b.dataset.task);});
function onMoment(m){
  const f=fid(),ctx=f?.ctx;if(!ctx||!PP){box.hidden=true;return;}
  const costs=ctx.model?.costs;
  render(PP.snapshot({schedule:ctx.input?.schedule??null,date:m?.date??null,costReport:costs?.status==='available'?costs.report:null,costUnavailableReason:costs?.reason||null}));
}
window.addEventListener('ft3d8-moment',e=>onMoment(e.detail));
if(fid()?.last)onMoment(fid().last);
