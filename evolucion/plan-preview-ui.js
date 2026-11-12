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

// Sobre la escena, como el titular de la Evolución: el panel DEJA PASAR los clics (pointer-events:none) salvo en sus
// pocos controles, para no robar la selección de las piezas que quedan debajo (examen EX-05.2a: clic real en el lienzo).
const host=document.querySelector('.stagewrap');
const box=document.createElement('section');box.className='plan-preview';box.setAttribute('aria-label','Plan a la fecha (planificado, no obra ejecutada)');box.hidden=true;
box.innerHTML=`<div class="pp-row"><svg viewBox="0 0 44 44" class="pp-ring" aria-hidden="true"><circle cx="22" cy="22" r="18" class="pp-track"/><circle cx="22" cy="22" r="18" class="pp-arc" pathLength="100" stroke-dasharray="0 100"/></svg><span class="pp-ringtxt">—</span>
<div class="pp-lines"><p class="pp-line pp-pct"></p><p class="pp-line pp-cost"></p><p class="pp-line pp-exec"></p></div></div>
<details class="pp-next-d"><summary>Siguiente tarea · planificada</summary><div class="pp-next"></div></details><p class="pp-note"></p>`;
host?.append(box);
const style=document.createElement('style');style.textContent=`
.plan-preview{position:absolute;right:16px;top:64px;z-index:4;width:min(300px,calc(100% - 32px));max-height:calc(100% - 150px);overflow:auto;pointer-events:none;padding:8px 10px;background:rgba(255,255,255,.93);color:#1d2124;border:1px solid #d6d3cc;border-radius:8px;box-shadow:0 4px 18px rgba(0,0,0,.10);font:12.5px/1.4 system-ui,-apple-system,"Segoe UI",sans-serif}
.plan-preview summary,.plan-preview button,.plan-preview label,.plan-preview input{pointer-events:auto}
.plan-preview .pp-row{display:flex;gap:10px;align-items:flex-start;position:relative}
.plan-preview .pp-ring{width:44px;height:44px;flex:none;transform:rotate(-90deg)}.plan-preview .pp-track{fill:none;stroke:#e4e1da;stroke-width:6}.plan-preview .pp-arc{fill:none;stroke:#0f7f95;stroke-width:6}
.plan-preview .pp-ringtxt{position:absolute;left:0;top:15px;width:44px;text-align:center;font-weight:700;font-size:9.5px;letter-spacing:-.02em}
.plan-preview .pp-line{margin:0 0 .2em}.plan-preview .pp-na{color:#7a4a12}
.plan-preview details{margin-top:4px}.plan-preview summary{cursor:pointer;min-height:36px;display:flex;align-items:center;font-size:11.5px;text-transform:uppercase;letter-spacing:.03em;color:#0f6f82;font-weight:700}
.plan-preview summary:focus-visible,.plan-preview button:focus-visible{outline:3px solid #2f7f8c;outline-offset:2px}
.plan-preview .pp-next{border-left:3px solid #0f7f95;padding:2px 0 2px 8px}.plan-preview .pp-next p{margin:.2em 0}
.plan-preview label{display:flex;align-items:center;gap:6px;min-height:36px}.plan-preview .pp-actions{display:flex;gap:6px;margin:.3em 0}
.plan-preview .pp-actions button{min-height:36px;padding:0 10px;border:1px solid #c9c6bf;border-radius:6px;background:#fff;font:inherit;cursor:pointer}
.plan-preview .pp-note{margin:.4em 0 0;font-size:11px;color:#5b6166}
@media (max-width:760px){.plan-preview{top:auto;bottom:56px;left:8px;right:auto;width:min(300px,calc(100% - 16px));max-height:calc(100% - 72px)}}
body.capture .plan-preview{display:none!important}`;
document.head.append(style);
const $=s=>box.querySelector(s);
// La siguiente tarea empieza plegada: el panel ocupa poco y casi todo él deja pasar los clics a la escena.
$('.pp-next-d').open=false;

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
      :`<span class="pp-na">Coste planificado a la fecha: <b>No disponible</b>. ${esc((m=>m.charAt(0).toUpperCase()+m.slice(1))(c.message.replace(/^No disponible:\s*/,'')))}</span>`;
  }
  $('.pp-exec').innerHTML=`Ejecutado: <b>sin registrar</b>`;$('.pp-exec').title=s.executed.label;
  const n=s.next;
  $('.pp-next-d').hidden=!n;if(!n){$('.pp-next').innerHTML='';}
  else if(n.state!=='planned')$('.pp-next').innerHTML=`<p>${esc(n.message)}</p>`;
  else $('.pp-next').innerHTML=`${n.tasks.map(t=>`<p><b>${esc(t.wbs)} ${esc(t.title)}</b></p>
    <p>Empieza ${esc(dateLabel(t.startDate))} (en ${t.daysUntil} día${t.daysUntil===1?'':'s'}) · ${t.durationDays} días</p>
    <p>${t.dependsOn.length?'Depende de: '+t.dependsOn.map(d=>`${esc(d.wbs||'')} ${esc(d.title||d.taskId)} (${DEP[d.type]}${d.lagDays?`, ${d.lagDays>0?'+':''}${d.lagDays} d`:''}; ${PRED[d.predecessorPlanned]})`).join(' · '):'Sin dependencias declaradas.'}</p>
    <p>${t.previewElementIds.length?`${t.previewElementIds.length} elemento(s) del modelo`:'Sin elementos del modelo vinculados: nada que mostrar en fantasma.'}</p>
    <div class="pp-actions"><button type="button" data-task="${esc(t.id)}">Ver en el plan</button></div>`).join('')}
    <label><input type="checkbox" class="pp-ghost" ${state.ghost?'checked':''}> Ver en fantasma (azul) en la escena</label>`;
  $('.pp-note').textContent=s.state==='available'?`Todo es plan, no avance real de obra.${s.cost.assumption?' '+s.cost.assumption:''}`:'Todo es plan, no avance real de obra.';
  applyGhost();
}
function applyGhost(){
  const f=fid(),s=state.snapshot,rec=window.__ft3dDelivery?.state?.recording||document.body.classList.contains('capture');
  const keys=!rec&&state.ghost&&s?.next?.state==='planned'?[...new Set(s.next.tasks.flatMap(t=>t.previewElementIds))]:[];
  if(rec)watchRecording();
  if(keys.join('\u0000')===state.ghostKeys.join('\u0000'))return;
  state.ghostKeys=keys;state.shown=f?.scene?.setPreview?f.scene.setPreview(keys):0;
}
// Al terminar o cancelar la grabación se vuelve a poner el fantasma (sin esperar a que cambie el día).
let waiting=0;
function watchRecording(){if(waiting)return;waiting=setInterval(()=>{if(window.__ft3dDelivery?.state?.recording)return;clearInterval(waiting);waiting=0;applyGhost();},300);}
box.addEventListener('change',e=>{if(e.target.classList.contains('pp-ghost')){state.ghost=e.target.checked;applyGhost();}});
box.addEventListener('click',e=>{const b=e.target.closest('[data-task]');if(b)fid()?.selectTask(b.dataset.task);});
function onMoment(m){
  const f=fid(),ctx=f?.ctx;if(!ctx||!PP){box.hidden=true;return;}
  const costs=ctx.model?.costs;
  render(PP.snapshot({schedule:ctx.input?.schedule??null,date:m?.date??null,costReport:costs?.status==='available'?costs.report:null,costUnavailableReason:costs?.reason||null}));
}
window.addEventListener('ft3d8-moment',e=>onMoment(e.detail));
// La grabación del vídeo para el cliente pinta cada cuadro con scene.renderNow(): antes del primer cuadro se quita el
// fantasma (lo que ve el cliente no cambia) y, al terminar o cancelar, se vuelve a poner.
const sc=fid()?.scene;
if(sc?.renderNow){const rn=sc.renderNow;
  sc.renderNow=(...a)=>{if(window.__ft3dDelivery?.state?.recording&&sc.preview?.keys.length){state.ghostKeys=[];state.shown=sc.setPreview([]);watchRecording();}return rn(...a);};}
if(fid()?.last)onMoment(fid().last);
