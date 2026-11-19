/* UX-07 / ENT-04 · Comparador «Comparar con el original» del producto (propuesta de activación).
   Se abre desde «Variantes» del editor, en el MISMO origen (comparte el localStorage del editor), con solo dos o tres
   identificadores de la biblioteca en la URL: ?src=library&before=<entrada>&after=<entrada>&anchor=<entrada>.
   - Solo lectura: la biblioteca y los presupuestos se leen con un almacenamiento que lanza error en cualquier escritura;
     nunca se llama a library.save. Se compara lo GUARDADO en este navegador y se dice en pantalla.
   - Reutiliza los módulos existentes: FloorPlanLibrary (lectura y grupo de variantes), FloorPlanVariantsCompare.prepare
     (mismo grupo, relación de variante, presupuestos), FloorPlanRevisionCompare (cambios y planta común),
     FloorPlanRevisionBudget (presupuestos) y FloorPlanBeforeAfterDossier (borrador interno con manifiesto).
   - Sin red: no consulta ningún servicio; el borrador interno se descarga en este equipo y no se publica. */
(function(){
'use strict';
const R=window.FloorPlanRevisionCompare,D=window.FloorPlanBeforeAfterDossier,PV=window.RubikProposalCore,V=window.FloorPlanVariantsCompare,L=window.FloorPlanLibrary;
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const BUDGETS='rubik-budget-v1';
const readOnly={getItem:k=>{try{return localStorage.getItem(k);}catch{return null;}},
  setItem(){throw Error('Comparador de solo lectura');},removeItem(){throw Error('Comparador de solo lectura');}};
const ID=/^[A-Za-z0-9][A-Za-z0-9_-]{0,79}$/;
const state={prepared:null,budgets:{before:null,after:null},dossier:null,error:null,ids:null,fp0:null,stale:false,order:null};
window.__ux07Compare=state;

function fatal(message){
  state.error=message;state.prepared=null;
  for(const id of ['cmpCard','bcCard','dosCard','orderCard'])$(id).hidden=true;
  $('fatal').textContent=message;$('fatalCard').hidden=false;
}

// ── Entrada: solo identificadores, validados; nada de la URL llega sin escapar al documento ──────────────────────────
function params(){
  const q=new URLSearchParams(location.search),before=q.get('before'),after=q.get('after'),anchor=q.get('anchor')||after;
  if(q.get('src')!=='library'||!before||!after)throw Error('Faltan las dos distribuciones que comparar.');
  for(const id of [before,after,anchor])if(!ID.test(id))throw Error('Los identificadores de la dirección no son válidos.');
  if(before===after)throw Error('Elige dos distribuciones distintas.');
  return {before,after,anchor};
}
function readBudgets(){
  const raw=readOnly.getItem(BUDGETS);if(raw===null)return {map:{},error:null};
  try{const map=JSON.parse(raw);if(!map||typeof map!=='object'||Array.isArray(map))throw Error('formato');return {map,error:null};}
  catch{return {map:{},error:'Los presupuestos guardados en este navegador no se pueden leer: la comparación se hace sin importes.'};}
}

// ── E2.3 · Vigencia: huella de lo guardado que usa la comparación (las dos entradas de la biblioteca y sus presupuestos).
// Se toma al abrir y se vuelve a leer antes de preparar, descargar y verificar. Solo lectura: nunca se escribe.
function storedSlice(){const ids=state.ids;if(!ids)return null;let lib=null,bud=null;
  try{const l=JSON.parse(readOnly.getItem(L.KEY)||'null');lib=(l?.entries||[]).filter(e=>e.id===ids.before||e.id===ids.after).map(e=>JSON.stringify(e)).sort();}catch{lib=['ilegible'];}
  try{const b=JSON.parse(readOnly.getItem(BUDGETS)||'null')||{};const pids=[state.prepared?.before?.id,state.prepared?.after?.id].filter(Boolean);bud=pids.map(k=>k+':'+JSON.stringify(b[k]??null));}catch{bud=['ilegible'];}
  return JSON.stringify({lib,bud});}
async function fingerprint(){const x=storedSlice();return x===null?null:D.sha256(x);}
// K13: la vigencia la decide el contrato común (ProposalV1, base stored-sha256); E2 no es una propuesta ni escribe nada.
const fresh=(fp,now)=>PV.checkFresh({kind:'stored-sha256',value:fp},now).ok;
async function checkFresh(){const now=await fingerprint();state.stale=!!state.fp0&&!fresh(state.fp0,now);
  const box=$('staleNotice');if(box)box.hidden=!state.stale;
  for(const id of ['buildBtn','dlHtml','dlManifest','orderBuild','orderDlHtml','orderDlManifest'])if($(id))$(id).disabled=state.stale||($(id).dataset.needs==='motivo'&&!$('orderMotivo')?.value.trim());
  return !state.stale;}
// A26/H03 · generación asíncrona: la huella se toma al EMPEZAR (y debe ser la de apertura) y se vuelve a leer al TERMINAR.
// Si lo guardado cambia mientras se genera (otra pestaña), el resultado se descarta: nunca se presenta ni se descarga un
// borrador hecho con datos que ya no son los guardados. Devuelve la huella de inicio o null si hubo cambio.
async function stableRun(work){if(!state.fp0)state.fp0=await fingerprint();if(!await checkFresh())return {fp:null,result:null,reason:'stale'};const fp=state.fp0; // referencia: la huella de apertura ya verificada
  const result=await work();const end=await fingerprint();if(!fresh(fp,end)){await checkFresh();return {fp:null,result:null,reason:'changed'};}return {fp,result,reason:null};}
const CHANGED='No se prepara: lo guardado ha cambiado durante la preparación (otra pestaña). Vuelve a cargar para comparar lo actual.';
// relectura de lo guardado AHORA, para verify(): no se usa el estado retenido
function readNow(){try{const lib=L.load(readOnly),g=lib.group(state.ids.anchor);const b=readBudgets();
  const pr=V.prepare({group:g,beforeId:state.ids.before,afterId:state.ids.after,budgets:b.map});return {before:pr.before,after:pr.after,budget:pr.budgets.after,beforeBudget:pr.budgets.before};}catch{return null;}}

function start(){
  let p;try{p=params();}catch(e){return fatal(e.message);}
  if(readOnly.getItem(L.KEY)===null)return fatal('No hay proyectos guardados en este navegador. El comparador solo lee la biblioteca del editor de este mismo navegador.');
  let lib;try{lib=L.load(readOnly);}catch(e){return fatal('La biblioteca de este navegador no se puede leer ('+e.message+'). No se ha modificado nada.');}
  let group;try{group=lib.group(p.anchor);}catch{return fatal('Alguna de las distribuciones ya no está en la biblioteca de este navegador.');}
  if(!group.some(g=>g.id===p.anchor))return fatal('Alguna de las distribuciones ya no está en la biblioteca de este navegador.');
  const b=readBudgets();let prepared,budgetError=b.error;
  const run=budgets=>V.prepare({group,beforeId:p.before,afterId:p.after,budgets});
  try{prepared=run(b.map);}
  catch(e){
    if(/^budget-/.test(e.code||'')){budgetError='Un presupuesto guardado no corresponde a su distribución ('+e.message+'): la comparación se hace sin importes.';
      try{prepared=run(null);}catch(e2){return fatal(e2.message);}}
    else return fatal(e.code==='not-in-group'?'Esas dos distribuciones no son el original y una de sus variantes (no están en el mismo grupo de «Variantes»).':e.message);
  }
  state.prepared=prepared;state.budgets=budgetError?{before:null,after:null}:{before:prepared.budgets.before,after:prepared.budgets.after};state.ids=p;
  render(prepared,budgetError);fingerprint().then(f=>{state.fp0=f;});
}

// ── Comparación ────────────────────────────────────────────────────────────────────────────────────────────────────
function render(pr,budgetError){
  const c=pr.comparison;$('fatalCard').hidden=true;$('cmpCard').hidden=false;$('bcCard').hidden=false;$('dosCard').hidden=false;$('orderCard').hidden=false;
  const lv=pr.entries.before.levelName||pr.entries.after.levelName;
  $('scope').textContent=lv?`Dos distribuciones del mismo grupo de «Variantes», planta «${pr.entries.before.levelName||'—'}» frente a planta «${pr.entries.after.levelName||'—'}». No es una comparación del edificio completo.`
    :'Dos distribuciones del mismo grupo de «Variantes»: el original y una variante.';
  $('relation').textContent=`Original y variante enlazadas en la biblioteca de este navegador. «${c.before.label}» → «${c.after.label}».`;
  $('notes').innerHTML=pr.notes.map(n=>`<li>${esc(n)}</li>`).join('');
  const sb=R.planSvg(c,'before',pr.before,{title:`Planta «${c.before.label}»`}),sa=R.planSvg(c,'after',pr.after,{title:`Planta «${c.after.label}»`});
  $('layerBefore').innerHTML=sb;$('layerAfter').innerHTML=sa;$('sideBefore').innerHTML=sb;$('sideAfter').innerHTML=sa;
  $('tagBefore').textContent=c.before.label;$('tagAfter').textContent=c.after.label;$('capBefore').textContent=c.before.label;$('capAfter').textContent=c.after.label;
  $('perspective').textContent=c.perspective.statement;setCurtain(+$('slider').value);
  $('chgTitle').textContent=`Cambios reales (${c.counts.total})`;
  const groups={};for(const x of c.changes)(groups[x.entity]||=[]).push(x);
  const T={wall:'Muros',opening:'Puertas y ventanas',room:'Estancias',object:'Muebles',material:'Definición de materiales'};
  $('changes').innerHTML=c.identical?'<p>Las dos distribuciones son iguales en los datos guardados.</p>':Object.entries(groups).map(([k,a])=>`<h4>${T[k]||esc(k)}</h4><ul>${a.map(x=>`<li data-entity="${esc(x.entity)}" data-id="${esc(x.entityId)}" data-change="${esc(x.change)}">${esc(x.summary)}</li>`).join('')}</ul>`).join('');
  const mat=m=>m?`${esc(m.name||m.id)}${m.color?` <span class="sw" style="background:${esc(m.color)}"></span>`:''}`:'<em>sin declarar</em>';
  $('materials').innerHTML=c.materials.length?`<table><thead><tr><th>Dónde</th><th>${esc(c.before.label)}</th><th>${esc(c.after.label)}</th></tr></thead><tbody>${c.materials.map(m=>`<tr><td>${m.scope==='room'?'Suelo':'Pared'} · ${esc(m.entityName)}</td><td>${mat(m.before)}</td><td>${mat(m.after)}</td></tr>`).join('')}</tbody></table>`:'<p>Ningún material declarado ha cambiado.</p>';
  $('illustrative').innerHTML=c.illustrative.map(i=>`<li><strong>${esc(i.what)}.</strong> ${esc(i.why)}</li>`).join('');
  const m=c.metrics,row=(k,l,u='')=>`<tr><th scope="row">${l}</th><td>${m.before[k]}${u}</td><td>${m.after[k]}${u}</td><td>${m.delta[k]>0?'+':''}${m.delta[k]}${u}</td></tr>`;
  $('metrics').innerHTML=`<table><thead><tr><th></th><th>${esc(c.before.label)}</th><th>${esc(c.after.label)}</th><th>Dif.</th></tr></thead><tbody>${row('netAreaM2','Superficie útil',' m²')}${row('rooms','Estancias')}${row('walls','Muros')}${row('openings','Huecos')}${row('objects','Muebles')}</tbody></table>`;
  $('limits').innerHTML=c.limits.map(l=>`<li>${esc(l)}</li>`).join('');
  renderBudgets(pr,budgetError);
  $('dosOut').hidden=true;$('dosStatus').textContent='';$('dosError').textContent='';
}
function setCurtain(v){$('layerAfter').style.clipPath=`inset(0 0 0 ${v}%)`;$('handle').style.left=v+'%';
  const c=state.prepared?.comparison;$('slider').setAttribute('aria-valuetext',c?`${100-v} % de «${c.after.label}» visible a la derecha`:`${v} %`);}
$('slider').addEventListener('input',e=>setCurtain(+e.target.value));
for(const b of document.querySelectorAll('[data-mode]'))b.addEventListener('click',()=>{const side=b.dataset.mode==='side';
  document.querySelectorAll('[data-mode]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));$('curtain').hidden=side;$('sliderRow').hidden=side;$('side').hidden=!side;});

// ── Presupuestos: nunca una diferencia engañosa ────────────────────────────────────────────────────────────────────
const STATUS_ES={complete:'Comparación completa',partial:'Comparación parcial',incoherent:'Comparación no válida','one-sided':'Comparación no disponible',none:'Sin presupuestos'};
const CHANGE_ES={same:'igual',quantity:'cantidad',price:'precio','quantity-and-price':'cantidad y precio',added:'nueva',removed:'quitada'};
const eur=v=>new Intl.NumberFormat('es-ES',{style:'currency',currency:'EUR'}).format(v),sgn=v=>(v>0?'+':'')+eur(v);
function renderBudgets(pr,budgetError){
  const bc=budgetError?null:pr.budgetComparison,c=pr.comparison,out=$('bcOut');
  $('bcTable').innerHTML='';$('bcNotes').innerHTML='';
  if(!bc){out.dataset.status=budgetError?'error':'none';
    $('bcSummary').innerHTML=budgetError?`<strong>Sin importes.</strong> ${esc(budgetError)}`:'<strong>Sin presupuestos guardados</strong> para estas dos distribuciones: no se muestran importes.';return;}
  const T=bc.totals;out.dataset.status=bc.status;
  $('bcSummary').innerHTML=`<strong>${STATUS_ES[bc.status]}.</strong> `+(bc.status==='complete'
      ?`Sin IVA: ${eur(T.net.before)} → ${eur(T.net.after)} (<strong>${sgn(T.net.delta)}</strong>). Con IVA: ${eur(T.gross.before)} → ${eur(T.gross.after)} (${sgn(T.gross.delta)}).`
    :bc.status==='partial'
      ?`Importes conocidos sin IVA: ${eur(T.knownNet.before)} y ${eur(T.knownNet.after)}. Diferencia de las ${T.comparable.items} partidas comparables: <strong>${sgn(T.comparable.netDelta)}</strong>; ${T.excluded.length} partida(s) fuera. <strong>No es la diferencia de coste total.</strong>`
    :bc.status==='incoherent'
      ?esc(T.statement)+' '+T.mismatched.map(x=>{const own=x.side==='before'?c.before.label:c.after.label,mm=x.revisionMatch;
        return esc(`El presupuesto de «${own}» ${mm==='neither'?'no corresponde a ninguna de las dos distribuciones':`tiene las cantidades de «${mm==='before'?c.before.label:mm==='after'?c.after.label:'las dos'}»`} (${x.differences} diferencia(s)).`);}).join(' ')+' <span class="amount-withheld">Importes no mostrados.</span>'
    :esc(T.statement));
  if(bc.status==='complete'||bc.status==='partial'){
    const amt=s=>s?s.net===null?'<em>sin precio</em>':eur(s.net):'—';
    const rows=bc.lines.filter(l=>l.change!=='same').map(l=>`<tr data-item="${esc(l.itemId)}" data-status="${esc(l.status)}"><td data-label="Partida">${esc(l.description)}</td><td data-label="Cambio">${esc(CHANGE_ES[l.change]||l.change)}</td><td data-label="${esc(c.before.label)}">${amt(l.before)}</td><td data-label="${esc(c.after.label)}">${amt(l.after)}</td><td data-label="Dif.">${l.delta?sgn(l.delta.net):'<em>no comparable</em>'}</td><td data-label="Depende de">${esc(l.explainedBy.join(', ')||'—')}</td></tr>`).join('');
    $('bcTable').innerHTML=rows?`<table><thead><tr><th>Partida</th><th>Cambio</th><th>${esc(c.before.label)}</th><th>${esc(c.after.label)}</th><th>Dif.</th><th>Depende de</th></tr></thead><tbody>${rows}</tbody></table>`:'';
  }
  $('bcNotes').innerHTML=bc.notes.map(n=>`<li>${esc(n)}</li>`).join('');
}

// ── Borrador interno (descarga local; sin envío, sin enlaces) ───────────────────────────────────────────────────────
const download=(name,text,type)=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type}));a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),1000);};
const slug=s=>String(s).normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^\w]+/g,'-').replace(/^-|-$/g,'').toLowerCase().slice(0,50)||'borrador';
async function build(){
  $('dosError').textContent='';$('dosStatus').textContent='';$('verifyOut').innerHTML='';
  const pr=state.prepared;if(!pr)return;
  state.dossier=null;$('dosOut').hidden=true;
  try{const c=pr.comparison,budget=state.budgets.after,beforeBudget=state.budgets.before; // E2.2: simétrico
    const v=D.view(c,{beforeProject:pr.before,afterProject:pr.after,budget,beforeBudget});
    const run=await stableRun(()=>D.exportDossier(v,{beforeProject:pr.before,afterProject:pr.after,budget,beforeBudget,comparison:c,beforeSvg:R.planSvg(c,'before',pr.before),afterSvg:R.planSvg(c,'after',pr.after)}));
    if(!run.result){$('dosError').textContent=run.reason==='changed'?CHANGED:'No se prepara: lo guardado ha cambiado desde que abriste el comparador. Vuelve a cargar para comparar lo actual.';return;}
    const out=run.result;state.dossier={view:v,budget,beforeBudget,...out,fp:run.fp};$('preview').srcdoc=out.html;$('dosOut').hidden=false;
    $('dosStatus').textContent=`Borrador interno preparado (${v.budget?v.budget.label:'sin presupuesto'}). Huella ${out.manifest.html.sha256.slice(0,12)}…`;
  }catch(e){state.dossier=null;$('dosOut').hidden=true;$('dosError').textContent=e.message;}
}
$('buildBtn').addEventListener('click',build);
$('dlHtml').addEventListener('click',async()=>{if(!await checkFresh())return;download(slug(state.dossier.view.title)+'.borrador-interno.html',state.dossier.html,'text/html');});
$('dlManifest').addEventListener('click',async()=>{if(!await checkFresh())return;download(slug(state.dossier.view.title)+'.manifest.json',JSON.stringify(state.dossier.manifest,null,1),'application/json');});
$('verifyBtn').addEventListener('click',async()=>{
  // E2.3: dos preguntas distintas. (1) ¿Es íntegro respecto a su manifiesto? (2) ¿Coincide con lo guardado AHORA?
  const integ=await D.verify(state.dossier.html,state.dossier.manifest,{});const now=readNow();
  const cur=now?await D.verify(state.dossier.html,state.dossier.manifest,{beforeProject:now.before,afterProject:now.after,budget:now.budget,beforeBudget:now.beforeBudget}):null;
  const curChecks=cur?cur.checks.filter(c=>!integ.checks.some(i=>i.name===c.name)):[];const sameSaved=await fingerprint()===state.dossier.fp;curChecks.push({name:'lo guardado (nombres, revisiones y presupuestos) es lo mismo que al preparar',ok:sameSaved});const curOk=!!cur&&curChecks.every(c=>c.ok);await checkFresh();
  const li=c=>`<li data-ok="${c.ok}">${c.ok?'✓':'✗'} ${esc(c.name)}</li>`;
  // Una sola línea de resumen (contrato existente de la página: «li.sum», «Borrador verificado»); debajo, los dos grupos.
  const allOk=integ.ok&&curOk,sum=allOk?'Borrador verificado: íntegro y vigente.':!integ.ok?'Borrador NO verificado: no coincide con su manifiesto.':'Borrador íntegro, pero NO vigente: no lo presentes como el estado actual.';
  $('verifyOut').innerHTML=`<li class="sum" data-ok="${allOk}">${sum}</li><li class="group" data-ok="${integ.ok}" data-check="integridad">${integ.ok?'Borrador íntegro: coincide con su manifiesto.':'El borrador NO coincide con su manifiesto.'}</li>`+integ.checks.map(li).join('')+
   `<li class="group" data-ok="${curOk}" data-check="vigencia">${!now?'No se puede leer lo guardado ahora: no se confirma la vigencia.':curOk?'Vigente: coincide con lo guardado ahora en este navegador.':'NO vigente: lo guardado ha cambiado desde que se preparó. El borrador sigue siendo íntegro, pero no representa el estado actual.'}</li>`+curChecks.map(li).join('');});

// ── E2.5 · ORDEN DE CAMBIO (RP14) como borrador interno verificable ─────────────────────────────────────────────────
// Contrato: revisión base y propuesta identificadas; motivo y responsable escritos por el profesional (obligatorios);
// diferencias canónicas de FloorPlanRevisionCompare; delta económico SOLO con comparación 'complete' (o 'partial', rotulado
// como diferencia de partidas comparables); plazo SOLO con plan válido (el comparador no lee planes: se dice); sin conformidad
// inferida y sin firma. Nada se guarda: se descarga en este equipo con su manifiesto SHA-256.
const ORDER_SCHEMA='rubik-sota.change-order-draft',ORDER_VERSION='1.0.0';
const T_ENTITY={wall:'Muros',opening:'Puertas y ventanas',room:'Estancias',object:'Muebles',material:'Definición de materiales'};
function economicOf(pr){const bc=state.budgets.before||state.budgets.after?pr.budgetComparison:null;if(!bc)return {status:'none',text:'Sin presupuestos guardados para estas revisiones: la orden no incluye diferencia económica.',delta:null};
 const T=bc.totals;if(bc.status==='complete')return {status:'complete',delta:{net:T.net.delta,gross:T.gross.delta},text:`Diferencia de los dos presupuestos, cada uno correspondiente a su revisión: ${sgn(T.net.delta)} sin IVA (${sgn(T.gross.delta)} con IVA).`};
 if(bc.status==='partial')return {status:'partial',delta:{comparableNet:T.comparable.netDelta},text:`Algún presupuesto está incompleto. Diferencia de las ${T.comparable.items} partidas comparables: ${sgn(T.comparable.netDelta)} sin IVA. No es la diferencia de coste total.`};
 return {status:bc.status,delta:null,text:bc.status==='incoherent'?'Algún presupuesto no corresponde a su revisión: la orden no incluye diferencia económica.':esc(T.statement)+' La orden no incluye diferencia económica.'};}
function orderHtml(o){const c=o.comparison,groups={};for(const x of c.changes)(groups[x.entity]||=[]).push(x.summary);const L=a=>a.map(x=>`<li>${esc(x)}</li>`).join('');
 const m=c.metrics,row=(k,l,u='')=>`<tr><th scope="row">${l}</th><td>${m.before[k]}${u}</td><td>${m.after[k]}${u}</td><td>${m.delta[k]>0?'+':''}${m.delta[k]}${u}</td></tr>`;
 return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Orden de cambio · ${esc(c.after.name)}</title><style>
:root{--ink:#2d332f;--muted:#626457;--rule:#cbc2b3;--paper:#fffdf8;--field:#f4f0e8;--petrol:#205b60;--clay:#875936}
*{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font:15px/1.55 Georgia,'Source Serif 4',serif}
.page{max-width:820px;margin:0 auto;padding:40px 28px 56px}.badge{display:inline-block;font:700 12px/1 system-ui,sans-serif;letter-spacing:.02em;color:var(--clay);border:1px solid var(--clay);border-radius:999px;padding:5px 10px}
h1{font:600 30px/1.15 Georgia,serif;margin:14px 0 4px}h2{font:700 14px/1.3 system-ui,sans-serif;margin:30px 0 10px;padding-top:12px;border-top:1px solid var(--rule)}
.sub{color:var(--muted);margin:0}table{border-collapse:collapse;width:100%;font:14px/1.4 system-ui,sans-serif}th,td{text-align:left;padding:6px 8px;border-bottom:1px solid var(--rule);vertical-align:top}td:not(:first-child),th:not(:first-child){font-variant-numeric:tabular-nums}
.box{background:var(--field);padding:14px 16px;border-left:3px solid var(--petrol)}.muted{color:var(--muted)}ul{padding-left:20px;margin:4px 0}.sig{display:grid;grid-template-columns:1fr 1fr;gap:20px}
.sig div{border:1px dashed var(--rule);padding:12px;min-height:70px;font:13px/1.4 system-ui,sans-serif;color:var(--muted)}footer{margin-top:36px;font:12px/1.5 system-ui,sans-serif;color:var(--muted)}
@media print{.page{padding:18mm}}@media (max-width:600px){h1{font-size:24px}.sig{grid-template-columns:1fr}}</style></head><body><main class="page">
<span class="badge">BORRADOR INTERNO · sin firma · sin conformidad registrada</span>
<h1>Orden de cambio</h1><p class="sub">${esc(c.after.name)} · preparada el ${new Date(o.generatedAt).toLocaleDateString('es-ES',{day:'numeric',month:'long',year:'numeric'})}</p>
<h2>Revisiones</h2><table><tr><th></th><th>Revisión</th><th>Guardada</th><th>Huella</th></tr>
<tr><th scope="row">Base</th><td>${esc(c.before.label)}</td><td>${esc(c.before.updatedAt||'—')}</td><td>${o.manifest.before.sha256.slice(0,12)}…</td></tr>
<tr><th scope="row">Propuesta</th><td>${esc(c.after.label)}</td><td>${esc(c.after.updatedAt||'—')}</td><td>${o.manifest.after.sha256.slice(0,12)}…</td></tr></table>
<h2>Motivo del cambio</h2><div class="box"><p style="margin:0">${esc(o.motivo)}</p><p class="muted" style="margin:8px 0 0;font:13px system-ui,sans-serif">Escrito por ${esc(o.author)}. RUBIK no redacta ni valida el motivo.</p></div>
<h2>Diferencias entre las revisiones (${c.counts.total})</h2>${c.identical?'<p>Las dos revisiones son iguales en los datos guardados.</p>':Object.entries(groups).map(([k,a])=>`<h3 style="font:700 13px system-ui;margin:14px 0 4px">${esc(T_ENTITY[k]||k)}</h3><ul>${L(a)}</ul>`).join('')}
<table style="margin-top:12px"><tr><th></th><th>${esc(c.before.label)}</th><th>${esc(c.after.label)}</th><th>Dif.</th></tr>${row('netAreaM2','Superficie útil',' m²')}${row('rooms','Estancias')}${row('walls','Muros')}${row('openings','Huecos')}${row('objects','Muebles')}</table>
<h2>Diferencia económica</h2><p>${o.economic.text}</p>
<h2>Plazo</h2><p>Sin plazo: estas revisiones no tienen un plan de obra vinculado en el comparador. La orden no estima duración.</p>
<h2>Límites</h2><ul class="muted">${L(c.limits)}</ul>
<h2>Conformidad</h2><p>Pendiente. Este documento no registra ni presume la aceptación del cliente y no lleva firma digital.</p>
<div class="sig"><div>Profesional: ${esc(o.author)}</div><div>Cliente: sin conformidad registrada</div></div>
<footer>Borrador interno preparado con RUBIK SOTA en este navegador. Se compara lo guardado en este navegador. No se ha publicado ni enviado. Huella y verificación en su manifiesto.</footer></main></body></html>`;}
async function buildOrder(){const pr=state.prepared;$('orderStatus').textContent='';if(!pr)return;const motivo=$('orderMotivo').value.trim(),author=$('orderAuthor').value.trim();
 if(!motivo||!author){$('orderStatus').textContent='Escribe el responsable y el motivo: la orden de cambio no se prepara sin ellos.';return;}
 state.order=null;$('orderOut').hidden=true;$('orderPreview').removeAttribute('srcdoc');
 const c=pr.comparison,generatedAt=new Date().toISOString(),economic=economicOf(pr);
 const run=await stableRun(async()=>{
 const manifest={schema:ORDER_SCHEMA,version:ORDER_VERSION,status:'draft-internal',publication:'none',signature:'none',acceptance:'not-recorded',generatedAt,
  before:{projectId:pr.before.id,label:c.before.label,updatedAt:c.before.updatedAt||null,sha256:await D.sha256(JSON.stringify(pr.before))},
  after:{projectId:pr.after.id,label:c.after.label,updatedAt:c.after.updatedAt||null,sha256:await D.sha256(JSON.stringify(pr.after))},
  reason:{author,sha256:await D.sha256(motivo)},changes:{total:c.counts.total,sha256:await D.sha256(JSON.stringify(c.changes))},economic:{status:economic.status,delta:economic.delta},schedule:null,html:null};
 const o={comparison:c,motivo,author,generatedAt,economic,manifest};const page=orderHtml(o);manifest.html={bytes:new TextEncoder().encode(page).length,sha256:await D.sha256(page)};
 return {page,manifest};});
 if(!run.result){$('orderStatus').textContent=run.reason==='changed'?CHANGED:'No se prepara: lo guardado ha cambiado. Vuelve a cargar.';return;}
 const {page,manifest}=run.result;state.order={html:page,manifest,fp:run.fp};$('orderPreview').srcdoc=page;$('orderOut').hidden=false;$('orderVerifyOut').innerHTML='';
 $('orderStatus').textContent=`Orden de cambio preparada (${economic.status==='complete'?'con diferencia económica':'sin diferencia económica'}). Huella ${manifest.html.sha256.slice(0,12)}…`;}
$('orderBuild').addEventListener('click',buildOrder);
for(const id of ['orderMotivo','orderAuthor'])$(id).addEventListener('input',()=>{$('orderBuild').disabled=state.stale||!$('orderMotivo').value.trim()||!$('orderAuthor').value.trim();});
$('orderDlHtml').addEventListener('click',async()=>{if(!await checkFresh())return;download(slug('orden de cambio '+state.prepared.comparison.after.name)+'.borrador-interno.html',state.order.html,'text/html');});
$('orderDlManifest').addEventListener('click',async()=>{if(!await checkFresh())return;download(slug('orden de cambio '+state.prepared.comparison.after.name)+'.manifest.json',JSON.stringify(state.order.manifest,null,1),'application/json');});
$('orderVerify').addEventListener('click',async()=>{const o=state.order,now=readNow();const ok1=new TextEncoder().encode(o.html).length===o.manifest.html.bytes&&await D.sha256(o.html)===o.manifest.html.sha256;
 const ok2=!!now&&await D.sha256(JSON.stringify(now.before))===o.manifest.before.sha256&&await D.sha256(JSON.stringify(now.after))===o.manifest.after.sha256&&await fingerprint()===o.fp;await checkFresh();
 $('orderVerifyOut').innerHTML=`<li class="sum" data-ok="${ok1&&ok2}">${ok1&&ok2?'Orden verificada: íntegra y vigente.':!ok1?'Orden NO verificada: no coincide con su manifiesto.':'Orden íntegra, pero NO vigente: no la presentes como el estado actual.'}</li><li class="group" data-ok="${ok1}" data-check="integridad">${ok1?'Orden íntegra: coincide con su manifiesto.':'La orden NO coincide con su manifiesto.'}</li><li class="group" data-ok="${ok2}" data-check="vigencia">${ok2?'Vigente: las dos revisiones coinciden con lo guardado ahora.':'NO vigente: alguna revisión ha cambiado desde que se preparó.'}</li>`;});
$('reloadBtn')?.addEventListener('click',()=>location.reload());
addEventListener('storage',()=>{checkFresh();}); // otra pestaña del mismo origen cambia lo guardado

start();
})();
