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
let waiting=0; // intervalo que espera el fin de una grabación (0 = ninguno pendiente)
const state={snapshot:null,provenance:null,ghostKeys:[],shown:0,ghost:true,get watching(){return !!waiting;}};
window.__ft3dPlanPreview=state;

// Sobre la escena, como el titular de la Evolución: el panel DEJA PASAR los clics (pointer-events:none) salvo en sus
// pocos controles, para no robar la selección de las piezas que quedan debajo (examen EX-05.2a: clic real en el lienzo).
const host=document.querySelector('.stagewrap');
const box=document.createElement('section');box.className='plan-preview';box.setAttribute('aria-label','Plan a la fecha (planificado, no obra ejecutada)');box.hidden=true;
box.innerHTML=`<div class="pp-row"><svg viewBox="0 0 44 44" class="pp-ring" aria-hidden="true"><circle cx="22" cy="22" r="18" class="pp-track"/><circle cx="22" cy="22" r="18" class="pp-arc" pathLength="100" stroke-dasharray="0 100"/></svg><span class="pp-ringtxt">—</span>
<div class="pp-lines"><p class="pp-line pp-pct"></p><p class="pp-line pp-cost"></p><p class="pp-line pp-exec"></p></div></div>
<details class="pp-next-d"><summary>Siguiente tarea · planificada</summary><div class="pp-next"></div></details>
<details class="pp-src-d"><summary><span class="pp-note"></span> <b>Fuentes y vínculos</b></summary><div class="pp-src"></div></details>`;
host?.append(box);
// Capas: z-index 3 = por encima del rótulo y de los sellos de la escena (2) y, por orden en el DOM, de la tarjeta inicial
// (.intro, 3); por DEBAJO de la ficha del elemento que la persona acaba de tocar (.pick, 4), que no debe quedar tapada.
const style=document.createElement('style');style.textContent=`
.plan-preview{position:absolute;right:16px;top:64px;z-index:3;width:min(300px,calc(100% - 32px));max-height:calc(100% - 150px);overflow:auto;pointer-events:none;padding:8px 10px;background:rgba(255,255,255,.93);color:#1d2124;border:1px solid #d6d3cc;border-radius:8px;box-shadow:0 4px 18px rgba(0,0,0,.10);font:12.5px/1.4 system-ui,-apple-system,"Segoe UI",sans-serif}
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
/* «Fuentes y vínculos» ocupa la línea de la nota que ya existía (no añade altura al panel): el panel está sobre la escena
   y cada fila con controles quita superficie al clic en el lienzo (OBR-01 · QA-22, CI de #211). Objetivo táctil ≥ 24 px. */
.plan-preview .pp-ghost-off{color:#5b6166}.plan-preview .pp-ghost-why{margin:.1em 0 .3em;color:#7a4a12}
.plan-preview .pp-src-d{margin-top:2px}.plan-preview .pp-src-d>summary{min-height:24px;font-size:11px;font-weight:400;text-transform:none;letter-spacing:0;color:#5b6166}
.plan-preview .pp-src-d>summary b{color:#0f6f82}.plan-preview .pp-note{font-size:11px;color:#5b6166}
.plan-preview .pp-src dl{margin:.2em 0;display:grid;grid-template-columns:auto 1fr;gap:2px 8px}.plan-preview .pp-src dt{font-weight:700}.plan-preview .pp-src dd{margin:0}
.plan-preview .pp-src [data-status=other-revision],.plan-preview .pp-src [data-status=unavailable],.plan-preview .pp-src [data-status=rejected],.plan-preview .pp-src [data-status=absent]{color:#7a4a12}
.plan-preview .pp-synth{margin:.2em 0;padding:3px 6px;background:#fff4e5;border:1px solid #e5c79f;border-radius:4px}.plan-preview .pp-small{font-size:11px;color:#5b6166}.plan-preview .pp-assume{font-size:11px;color:#5b6166}
.plan-preview .pp-warn{margin:.3em 0;padding-left:1.1em;color:#7a4a12}.plan-preview .pp-links li[data-ghost=false]{color:#7a4a12}
/* Móvil: el panel desplegado no puede tapar la escena (antes, hasta el 100 % menos 72 px): como mucho el 45 % del escenario,
   con su propio desplazamiento. La escena sigue recibiendo los toques fuera de él. */
@media (max-width:760px){.plan-preview{top:auto;bottom:56px;left:8px;right:auto;width:min(300px,calc(100% - 16px));max-height:45%}}
body.capture .plan-preview{display:none!important}`;
document.head.append(style);
const $=s=>box.querySelector(s);
// La siguiente tarea empieza plegada: el panel ocupa poco y casi todo él deja pasar los clics a la escena.
$('.pp-next-d').open=false;$('.pp-src-d').open=false;

function render(s,prov=null){
  box.hidden=false;state.snapshot=s;state.provenance=prov;
  const p=s.progress;$('.pp-arc').setAttribute('stroke-dasharray',`${p?p.percent:0} 100`);$('.pp-ringtxt').textContent=p?pct(p.percent)+'%':'—';
  if(s.state!=='available'){
    $('.pp-pct').innerHTML=`<span class="pp-na"><b>% del plan: no disponible.</b> ${esc(s.message)}</span>`;$('.pp-cost').innerHTML=`<span class="pp-na">Coste planificado a la fecha: <b>No disponible</b>.</span>`;
  }else{
    // El % es del CALENDARIO del plan: al final del plan es 100 % planificado, nunca obra terminada.
    // Igual de corto que el rótulo anterior: el panel está sobre la escena y no debe crecer (OBR-01 · QA-22).
    $('.pp-pct').innerHTML=p.percent>=100?`<b>100 %</b> del calendario del plan: <b>fin del plan, no obra terminada</b> (${p.tasks.total} de ${p.tasks.total} tareas según plan)`
      :`<b>${pct(p.percent)} %</b> del calendario del plan · <b>planificado</b> (${p.tasks.completedPlanned} de ${p.tasks.total} tareas terminadas según plan, ${p.tasks.inProgressPlanned} en curso)`;
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
    ${linksHtml(t)}
    <div class="pp-actions"><button type="button" data-task="${esc(t.id)}">Ver en el plan</button></div>`).join('')}
    ${ghostToggle(prov)}`;
  // El supuesto de reparto ya está en la línea del coste y, completo, dentro de «Fuentes y vínculos».
  $('.pp-note').textContent='Plan ≠ obra · coste ≠ gasto ·\u00a0';
  renderSources(prov);applyGhost();
}
// Casilla del fantasma. Con un plan de otra revisión no se dibuja nada aunque la casilla esté marcada: se deshabilita y dice
// por qué, para no dar a entender que hay algo dibujado (auditoría #219). La preferencia de la persona (state.ghost) se
// conserva para cuando el plan vuelva a concordar.
function ghostToggle(prov){
  const blocked=(prov?.warnings||[]).some(w=>w.code==='plan-other-revision');
  return blocked?`<label class="pp-ghost-off"><input type="checkbox" class="pp-ghost" disabled aria-describedby="ppGhostWhy"> Ver en fantasma (azul) en la escena</label>
    <p id="ppGhostWhy" class="pp-ghost-why">No disponible: el plan es de otra revisión del proyecto; no se dibuja nada hasta reconciliar las fuentes.</p>`
    :`<label><input type="checkbox" class="pp-ghost" ${state.ghost?'checked':''}> Ver en fantasma (azul) en la escena</label>`;
}
// Vínculos de una tarea con el estado que les dio el adaptador FT3D-8: solo los comprobados en el modelo van al fantasma.
function linksHtml(t){
  const rows=(state.provenance?.next||[]).filter(x=>x.taskId===t.id);
  if(!rows.length&&!t.previewElementIds.length)return '<p>Sin elementos del modelo vinculados: nada que mostrar en fantasma.</p>';
  if(!rows.length)return `<p>${t.previewElementIds.length} elemento(s) citados por el plan, <b>sin comprobar</b> contra el modelo: no se dibujan.</p>`;
  const ok=rows.filter(x=>x.ghost).length,bad=rows.filter(x=>!x.ghost),group={};for(const x of bad)(group[x.label]||=[]).push(x.elementId);
  const withheld=rows.some(x=>x.withheld==='plan-other-revision');
  return `<p>${ok?`<b>${ok}</b> elemento(s) vinculados y comprobados en el modelo (en fantasma)`:withheld?'<b>Sin fantasma:</b> el plan es de otra revisión del proyecto.':'Ningún elemento comprobado en el modelo: no hay fantasma.'}</p>`
    +(bad.length?`<ul class="pp-links">${Object.entries(group).map(([l,ids])=>`<li data-ghost="false">${ids.length} ${esc(l)} (${ids.map(esc).join(', ')})</li>`).join('')}</ul>`:'');
  // El origen declarado de las tareas está en «Fuentes y vínculos» (plan): repetirlo en cada tarea alargaba el panel, que
  // en el móvil tapaba la escena y sus botones recibían los toques destinados a los muros (recorrido de la Preview).
}
function renderSources(prov){
  const el=$('.pp-src');if(!prov){el.innerHTML='<p>Sin datos de procedencia.</p>';return;}
  const names=list=>list.map(t=>esc(`${t.wbs||''} ${t.title||t.taskId}`.trim())).join(' · ');
  el.innerHTML=(prov.synthetic==='declared'?'<p class="pp-synth"><b>DATOS SINTÉTICOS de prueba</b>: no es un proyecto ni un presupuesto reales.</p>':'')+`<dl>${prov.sources.map(x=>`<dt>${esc(x.label)}</dt><dd data-kind="${esc(x.kind)}" data-status="${esc(x.status)}">${esc(x.detail)}</dd>`).join('')}</dl>`
    +(prov.warnings.length?`<ul class="pp-warn">${prov.warnings.map(w=>`<li data-code="${esc(w.code)}">${esc(w.message)}</li>`).join('')}</ul>`:'')
    +(prov.tasksWithoutElements.length?`<p><b>Tareas sin elementos del modelo</b> (no se dibujan): ${names(prov.tasksWithoutElements)}</p>`:'')
    +(prov.tasksWithoutBudget.length?`<p><b>Tareas sin partidas del presupuesto</b> (sin importe): ${names(prov.tasksWithoutBudget)}</p>`:'')
    +`<p class="pp-small">${esc(prov.statements.progress)} ${esc(prov.statements.cost)} ${esc(prov.statements.executed)}</p>`;
}
function applyGhost(){
  const f=fid(),s=state.snapshot,rec=window.__ft3dDelivery?.state?.recording||document.body.classList.contains('capture');
  // Solo vínculos comprobados en el modelo (procedencia): un identificador roto, sin representación o ilustrativo no se dibuja.
  const keys=!rec&&state.ghost&&s?.next?.state==='planned'?[...(state.provenance?.ghostKeys||[])]:[];
  if(rec)watchRecording();
  if(keys.join('\u0000')===state.ghostKeys.join('\u0000'))return;
  state.ghostKeys=keys;state.shown=f?.scene?.setPreview?f.scene.setPreview(keys):0;
}
// Al terminar o cancelar la grabación se vuelve a poner el fantasma (sin esperar a que cambie el día).
function watchRecording(){if(waiting)return;waiting=setInterval(()=>{if(window.__ft3dDelivery?.state?.recording)return;clearInterval(waiting);waiting=0;applyGhost();},300);}
box.addEventListener('change',e=>{if(e.target.classList.contains('pp-ghost')){state.ghost=e.target.checked;applyGhost();}});
box.addEventListener('click',e=>{const b=e.target.closest('[data-task]');if(b)fid()?.selectTask(b.dataset.task);});
function onMoment(m){
  const f=fid(),ctx=f?.ctx;if(!ctx||!PP){box.hidden=true;return;}
  const costs=ctx.model?.costs;
  const snap=PP.snapshot({schedule:ctx.input?.schedule??null,date:m?.date??null,costReport:costs?.status==='available'?costs.report:null,costUnavailableReason:costs?.reason||null});
  render(snap,PP.provenance?PP.provenance({snapshot:snap,model:ctx.model,schedule:ctx.input?.schedule??null,meta:ctx.meta}):null);
}
window.addEventListener('ft3d8-moment',e=>onMoment(e.detail));
// La grabación del vídeo para el cliente pinta cada cuadro con scene.renderNow(): antes del primer cuadro se quita el
// fantasma (lo que ve el cliente no cambia) y, al terminar o cancelar, se vuelve a poner.
const sc=fid()?.scene;
if(sc?.renderNow){const rn=sc.renderNow;
  sc.renderNow=(...a)=>{if(window.__ft3dDelivery?.state?.recording&&sc.preview?.keys.length){state.ghostKeys=[];state.shown=sc.setPreview([]);watchRecording();}return rn(...a);};}
if(fid()?.last)onMoment(fid().last);
