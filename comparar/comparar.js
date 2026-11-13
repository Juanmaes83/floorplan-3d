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
const R=window.FloorPlanRevisionCompare,D=window.FloorPlanBeforeAfterDossier,V=window.FloorPlanVariantsCompare,L=window.FloorPlanLibrary;
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const BUDGETS='rubik-budget-v1';
const readOnly={getItem:k=>{try{return localStorage.getItem(k);}catch{return null;}},
  setItem(){throw Error('Comparador de solo lectura');},removeItem(){throw Error('Comparador de solo lectura');}};
const ID=/^[A-Za-z0-9][A-Za-z0-9_-]{0,79}$/;
const state={prepared:null,budgets:{before:null,after:null},dossier:null,error:null};
window.__ux07Compare=state;

function fatal(message){
  state.error=message;state.prepared=null;
  for(const id of ['cmpCard','bcCard','dosCard'])$(id).hidden=true;
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
  state.prepared=prepared;state.budgets=budgetError?{before:null,after:null}:{before:prepared.budgets.before,after:prepared.budgets.after};
  render(prepared,budgetError);
}

// ── Comparación ────────────────────────────────────────────────────────────────────────────────────────────────────
function render(pr,budgetError){
  const c=pr.comparison;$('fatalCard').hidden=true;$('cmpCard').hidden=false;$('bcCard').hidden=false;$('dosCard').hidden=false;
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
  try{const c=pr.comparison,budget=state.budgets.after,beforeBudget=budget?state.budgets.before:null;
    const v=D.view(c,{beforeProject:pr.before,afterProject:pr.after,budget,beforeBudget});
    const out=await D.exportDossier(v,{beforeProject:pr.before,afterProject:pr.after,budget,beforeBudget,comparison:c,beforeSvg:R.planSvg(c,'before',pr.before),afterSvg:R.planSvg(c,'after',pr.after)});
    state.dossier={view:v,budget,beforeBudget,...out};$('preview').srcdoc=out.html;$('dosOut').hidden=false;
    $('dosStatus').textContent=`Borrador interno preparado (${v.budget?v.budget.label:'sin presupuesto'}). Huella ${out.manifest.html.sha256.slice(0,12)}…`;
  }catch(e){state.dossier=null;$('dosOut').hidden=true;$('dosError').textContent=e.message;}
}
$('buildBtn').addEventListener('click',build);
$('dlHtml').addEventListener('click',()=>download(slug(state.dossier.view.title)+'.borrador-interno.html',state.dossier.html,'text/html'));
$('dlManifest').addEventListener('click',()=>download(slug(state.dossier.view.title)+'.manifest.json',JSON.stringify(state.dossier.manifest,null,1),'application/json'));
$('verifyBtn').addEventListener('click',async()=>{const r=await D.verify(state.dossier.html,state.dossier.manifest,{beforeProject:state.prepared.before,afterProject:state.prepared.after,budget:state.dossier.budget,beforeBudget:state.dossier.beforeBudget});
  $('verifyOut').innerHTML=r.checks.map(x=>`<li data-ok="${x.ok}">${x.ok?'✓':'✗'} ${esc(x.name)}</li>`).join('')+`<li class="sum" data-ok="${r.ok}">${r.ok?'Borrador verificado.':'El borrador NO coincide con su manifiesto o con los datos guardados.'}</li>`;});

start();
})();
