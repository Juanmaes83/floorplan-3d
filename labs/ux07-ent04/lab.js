/* UX-07 + ENT-04 · laboratorio aislado. Solo lee: la biblioteca y los presupuestos guardados en este navegador se leen a
   través de un almacenamiento de solo lectura (cualquier escritura falla). No hay red, ni publicación, ni enlaces. */
(function(){
'use strict';
const R=window.FloorPlanRevisionCompare,D=window.FloorPlanBeforeAfterDossier,RB=window.FloorPlanRevisionBudget,L=window.FloorPlanLibrary,Core=window.FloorPlanCore,F=window.UX07Fixtures;
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const BUDGETS='rubik-budget-v1';
const readOnly={getItem:k=>{try{return localStorage.getItem(k);}catch{return null;}},setItem(){throw Error('Laboratorio de solo lectura');},removeItem(){throw Error('Laboratorio de solo lectura');}};
const state={src:'fixture',before:null,after:null,relation:null,comparison:null,files:{},library:null,dossier:null,budgets:{},budgetsBefore:{}};
window.__ux07=state;

// ── Orígenes ────────────────────────────────────────────────────────────────────────────────────────────────────
function libraryEntries(){
  if(state.library)return state.library;
  let lib=null;try{if(readOnly.getItem(L.KEY)!==null)lib=L.load(readOnly);}catch(e){$('srcError').textContent='La biblioteca de este navegador no se puede leer: '+e.message;}
  state.library=lib?lib.all().map(e=>({id:e.id,name:e.name,variantOf:e.variantOf||null,project:e.project,building:e.kind==='building'})):[];return state.library;
}
function fillLibrary(){
  const list=libraryEntries();
  const opts=list.length?list.map(e=>`<option value="${esc(e.id)}">${esc(e.name)}${e.variantOf?' (variante)':''}${e.building?' · planta activa':''}</option>`).join(''):'<option value="">No hay proyectos guardados en este navegador</option>';
  $('libBefore').innerHTML=opts;$('libAfter').innerHTML=opts;if(list.length>1)$('libAfter').selectedIndex=1;
}
/* Auditoría del propietario (#212, 13/11/2026): al cambiar el origen o lo elegido en él, la comparación y el dossier
   anteriores se RETIRAN (no se quedan a la vista atribuidos al origen nuevo). Solo «Comparar» con el origen nuevo los vuelve a
   crear; si ese origen no es válido, el error lo dice y no queda ningún resultado anterior. */
const SRC_ES={fixture:'proyecto de prueba (sintético)',library:'biblioteca de este navegador',files:'dos archivos JSON'};
function invalidate(why){
  const had=!!state.comparison;
  Object.assign(state,{before:null,after:null,relation:null,comparison:null,dossier:null,budgets:{},budgetsBefore:{}});
  $('cmpCard').hidden=true;$('dosCard').hidden=true;$('dosOut').hidden=true;$('bcOut').hidden=true;
  for(const id of ['layerBefore','layerAfter','sideBefore','sideAfter','changes','materials','illustrative','metrics','limits','relation','perspective','bcSummary','bcTable','bcNotes','verifyOut','dosStatus','dosError'])$(id).innerHTML='';
  $('preview').removeAttribute('srcdoc');
  $('srcStatus').textContent=had?`${why} La comparación y el dossier anteriores se han retirado: pulsa «Comparar» para ver los de ${SRC_ES[state.src]}.`:'';
}
for(const r of document.querySelectorAll('input[name=src]'))r.addEventListener('change',()=>{state.src=r.value;
  $('pickLibrary').hidden=r.value!=='library';$('pickFiles').hidden=r.value!=='files';if(r.value==='library')fillLibrary();$('srcError').textContent='';updateDeclare();
  invalidate(`Origen cambiado a ${SRC_ES[r.value]}.`);});
for(const id of ['libBefore','libAfter','fileBefore','fileAfter','declare'])$(id).addEventListener('change',()=>invalidate('Has cambiado lo elegido en el origen.'));
async function readJson(input){const f=input.files[0];if(!f)throw Error('Elige los dos archivos.');const p=JSON.parse(await f.text());Core.validate(p);return p;}
async function resolvePair(){
  if(state.src==='fixture')return {before:F.before(),after:F.after(),relation:'same-project'};
  if(state.src==='library'){const list=libraryEntries(),a=list.find(e=>e.id===$('libBefore').value),b=list.find(e=>e.id===$('libAfter').value);
    if(!a||!b)throw Error('Elige dos proyectos de la biblioteca.');if(a.id===b.id)throw Error('Elige dos entradas distintas.');
    const linked=a.variantOf===b.id||b.variantOf===a.id||(a.variantOf&&a.variantOf===b.variantOf);
    return {before:Core.clone(a.project),after:Core.clone(b.project),relation:a.project.id===b.project.id?'same-project':linked?'library-variant':null};}
  return {before:await readJson($('fileBefore')),after:await readJson($('fileAfter')),relation:null};
}
function updateDeclare(){$('declareRow').hidden=state.src==='fixture';}

// ── Comparación ─────────────────────────────────────────────────────────────────────────────────────────────────
async function doCompare(){
  $('srcError').textContent='';
  try{
    const p=await resolvePair();const relation=p.relation||(p.before.id===p.after.id?'same-project':$('declare').checked?'declared':null);
    const c=R.compare(p.before,p.after,{relation,beforeLabel:$('labelBefore').value.trim()||'Antes',afterLabel:$('labelAfter').value.trim()||'Después'});
    Object.assign(state,{before:p.before,after:p.after,relation:c.relation,comparison:c,dossier:null,source:state.src});$('srcStatus').textContent='';render();fillBudgets();
  }catch(e){invalidate('');$('srcStatus').textContent='';$('srcError').textContent=e.code==='relation-required'?e.message+' Marca la casilla si es así.':e.message;}
}
function render(){
  const c=state.comparison;$('cmpCard').hidden=false;$('dosCard').hidden=false;
  $('cmpSource').textContent=`Origen: ${SRC_ES[state.src]}`;
  $('relation').textContent={'same-project':'Dos revisiones del mismo proyecto.','library-variant':'Original y variante enlazadas en la biblioteca.','declared':'Proyectos distintos declarados por ti como revisiones de la misma obra.'}[c.relation]+` «${c.before.label}»: ${c.before.name} · «${c.after.label}»: ${c.after.name}`;
  const sb=R.planSvg(c,'before',state.before,{title:`Planta «${c.before.label}»`}),sa=R.planSvg(c,'after',state.after,{title:`Planta «${c.after.label}»`});
  $('layerBefore').innerHTML=sb;$('layerAfter').innerHTML=sa;$('sideBefore').innerHTML=sb;$('sideAfter').innerHTML=sa;
  $('tagBefore').textContent=c.before.label;$('tagAfter').textContent=c.after.label;$('capBefore').textContent=c.before.label;$('capAfter').textContent=c.after.label;
  $('perspective').textContent=c.perspective.statement;setCurtain(+$('slider').value);
  $('chgTitle').textContent=`Cambios reales (${c.counts.total})`;
  const groups={};for(const x of c.changes)(groups[x.entity]||=[]).push(x);
  const T={wall:'Muros',opening:'Puertas y ventanas',room:'Estancias',object:'Muebles',material:'Definición de materiales'};
  $('changes').innerHTML=c.identical?'<p>Las dos revisiones son iguales en los datos del proyecto.</p>':Object.entries(groups).map(([k,a])=>`<h4>${T[k]}</h4><ul>${a.map(x=>`<li data-entity="${esc(x.entity)}" data-id="${esc(x.entityId)}" data-change="${x.change}">${esc(x.summary)}</li>`).join('')}</ul>`).join('');
  const mat=m=>m?`${esc(m.name||m.id)}${m.color?` <span class="sw" style="background:${esc(m.color)}"></span>`:''}`:'<em>sin declarar</em>';
  $('materials').innerHTML=c.materials.length?`<table><thead><tr><th>Dónde</th><th>${esc(c.before.label)}</th><th>${esc(c.after.label)}</th></tr></thead><tbody>${c.materials.map(m=>`<tr><td>${m.scope==='room'?'Suelo':'Pared'} · ${esc(m.entityName)}</td><td>${mat(m.before)}</td><td>${mat(m.after)}</td></tr>`).join('')}</tbody></table>`:'<p>Ningún material declarado ha cambiado.</p>';
  $('illustrative').innerHTML=c.illustrative.map(i=>`<li><strong>${esc(i.what)}.</strong> ${esc(i.why)}</li>`).join('');
  const m=c.metrics,row=(k,l,u='')=>`<tr><th scope="row">${l}</th><td>${m.before[k]}${u}</td><td>${m.after[k]}${u}</td><td>${m.delta[k]>0?'+':''}${m.delta[k]}${u}</td></tr>`;
  $('metrics').innerHTML=`<table><thead><tr><th></th><th>${esc(c.before.label)}</th><th>${esc(c.after.label)}</th><th>Dif.</th></tr></thead><tbody>${row('netAreaM2','Superficie útil',' m²')}${row('rooms','Estancias')}${row('walls','Muros')}${row('openings','Huecos')}${row('objects','Muebles')}</tbody></table>`;
  $('limits').innerHTML=c.limits.map(l=>`<li>${esc(l)}</li>`).join('');
  $('dosTitleIn').value=`Antes y después · ${c.after.name}`;$('dosOut').hidden=true;$('dosStatus').textContent='';$('dosError').textContent='';
}
function setCurtain(v){$('layerAfter').style.clipPath=`inset(0 0 0 ${v}%)`;$('handle').style.left=v+'%';
  const c=state.comparison;$('slider').setAttribute('aria-valuetext',c?`${100-v} % de «${c.after.label}» visible a la derecha`:`${v} %`);}
$('slider').addEventListener('input',e=>setCurtain(+e.target.value));
for(const b of document.querySelectorAll('[data-mode]'))b.addEventListener('click',()=>{const side=b.dataset.mode==='side';
  document.querySelectorAll('[data-mode]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));$('curtain').hidden=side;$('sliderRow').hidden=side;$('side').hidden=!side;});
$('compareBtn').addEventListener('click',doCompare);

// ── Dossier ─────────────────────────────────────────────────────────────────────────────────────────────────────
function fillBudgets(){
  const opts=[['none','Sin presupuesto']];state.budgets={none:null};
  try{const saved=JSON.parse(readOnly.getItem(BUDGETS)||'{}')[state.after.id];if(saved){state.budgets.saved=saved;opts.push(['saved','Presupuesto guardado de este proyecto']);}}catch{}
  if(state.src==='fixture'){state.budgets['test-complete']=F.budget('complete');state.budgets['test-partial']=F.budget('partial');state.budgets['test-before']=F.budget('complete',state.before);
    opts.push(['test-complete','Prueba: todas las partidas con precio (ficticio)'],['test-partial','Prueba: partidas sin precio (ficticio)'],['test-before','Prueba: presupuesto hecho sobre «antes» (ficticio)']);}
  $('budgetSel').innerHTML=opts.map(([v,t])=>`<option value="${v}">${esc(t)}</option>`).join('');
  // Fase 2: presupuesto de la primera revisión. Con el mismo proyecto, el guardado es UNO (RUBIK no guarda sobre qué revisión
  // se hizo): se ofrece en los dos lados y la comparación dice a cuál corresponde de verdad.
  const ob=[['none','No comparar presupuestos']];state.budgetsBefore={none:null};
  try{const saved=JSON.parse(readOnly.getItem(BUDGETS)||'{}')[state.before.id];if(saved){state.budgetsBefore.saved=saved;ob.push(['saved','Presupuesto guardado de este proyecto']);}}catch{}
  if(state.src==='fixture'){state.budgetsBefore['test-complete']=F.budget('complete',state.before);state.budgetsBefore['test-partial']=F.budget('partial',state.before);state.budgetsBefore['test-after']=F.budget('complete',state.after);
    ob.push(['test-complete','Prueba: todas las partidas con precio (ficticio)'],['test-partial','Prueba: partidas sin precio (ficticio)'],['test-after','Prueba: presupuesto hecho sobre «después» (ficticio)']);}
  $('budgetBeforeSel').innerHTML=ob.map(([v,t])=>`<option value="${v}">${esc(t)}</option>`).join('');
}
const STATUS_ES={complete:'Comparación completa',partial:'Comparación parcial',incoherent:'Comparación no válida','one-sided':'Comparación no disponible',none:'Sin presupuestos'};
const CHANGE_ES={same:'igual',quantity:'cantidad',price:'precio','quantity-and-price':'cantidad y precio',added:'nueva',removed:'quitada'};
const eur=v=>new Intl.NumberFormat('es-ES',{style:'currency',currency:'EUR'}).format(v),sgn=v=>(v>0?'+':'')+eur(v);
function renderBudgetComparison(bc){
  $('bcOut').hidden=!bc;if(!bc)return;const c=state.comparison,T=bc.totals;$('bcOut').dataset.status=bc.status;
  $('bcSummary').innerHTML=`<strong>${STATUS_ES[bc.status]}.</strong> `+(bc.status==='complete'?`Sin IVA: ${eur(T.net.before)} → ${eur(T.net.after)} (<strong>${sgn(T.net.delta)}</strong>). Con IVA: ${eur(T.gross.before)} → ${eur(T.gross.after)} (${sgn(T.gross.delta)}).`
    :bc.status==='partial'?`Importes conocidos sin IVA: ${eur(T.knownNet.before)} y ${eur(T.knownNet.after)}. Diferencia de las ${T.comparable.items} partidas comparables: <strong>${sgn(T.comparable.netDelta)}</strong>. ${T.excluded.length} partida(s) fuera. No es la diferencia de coste total.`
    :bc.status==='incoherent'?esc(T.statement)+' '+T.mismatched.map(x=>{const own=x.side==='before'?c.before.label:c.after.label,m=x.revisionMatch;
      return esc(`El presupuesto de «${own}» ${m==='neither'?'no corresponde a ninguna de las dos revisiones':`tiene las cantidades de «${m==='before'?c.before.label:m==='after'?c.after.label:'las dos'}»`} (${x.differences} diferencia(s)).`);}).join(' ')
    :esc(T.statement));
  const amt=s=>s?s.net===null?'<em>sin precio</em>':eur(s.net):'—';
  $('bcTable').innerHTML=bc.status==='complete'||bc.status==='partial'?`<table><thead><tr><th>Partida</th><th>Cambio</th><th>${esc(c.before.label)}</th><th>${esc(c.after.label)}</th><th>Dif.</th><th>Depende de</th></tr></thead><tbody>${bc.lines.filter(l=>l.change!=='same').map(l=>`<tr data-item="${esc(l.itemId)}" data-status="${l.status}"><td data-label="Partida">${esc(l.description)}</td><td data-label="Cambio">${CHANGE_ES[l.change]}</td><td data-label="${esc(c.before.label)}">${amt(l.before)}</td><td data-label="${esc(c.after.label)}">${amt(l.after)}</td><td data-label="Diferencia">${l.delta?sgn(l.delta.net):'<em>no comparable</em>'}</td><td data-label="Depende de">${l.explainedBy.length?esc(l.explainedBy.length+' cambio(s)'):'<strong>ninguno</strong>'}</td></tr>`).join('')}</tbody></table>`:'';
  $('bcNotes').innerHTML=bc.notes.map(n=>`<li>${esc(n)}</li>`).join('');
}
const download=(name,text,type)=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type}));a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),1000);};
const slug=s=>String(s).normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^\w]+/g,'-').replace(/^-|-$/g,'').toLowerCase().slice(0,50)||'dossier';
async function build(){
  $('dosError').textContent='';$('dosStatus').textContent='';$('verifyOut').innerHTML='';
  try{const c=state.comparison,budget=state.budgets[$('budgetSel').value]||null,beforeBudget=state.budgetsBefore[$('budgetBeforeSel').value]||null;
    const v=D.view(c,{beforeProject:state.before,afterProject:state.after,budget,beforeBudget,title:$('dosTitleIn').value.trim()||null});
    const out=await D.exportDossier(v,{beforeProject:state.before,afterProject:state.after,budget,beforeBudget,comparison:c,beforeSvg:R.planSvg(c,'before',state.before),afterSvg:R.planSvg(c,'after',state.after)});
    state.dossier={view:v,budget,beforeBudget,...out};renderBudgetComparison(v.budgetComparison);$('preview').srcdoc=out.html;$('dosOut').hidden=false;
    $('dosStatus').textContent=v.budget?`${v.budget.label}${v.budget.quantities==='differ'?' · las cantidades NO coinciden con «'+c.after.label+'»':' · cantidades comprobadas con «'+c.after.label+'»'}. Huella ${out.manifest.html.sha256.slice(0,12)}…`:`Sin presupuesto: el dossier no muestra importes. Huella ${out.manifest.html.sha256.slice(0,12)}…`;
  }catch(e){$('dosError').textContent=e.message;$('dosOut').hidden=true;state.dossier=null;renderBudgetComparison(null);}
}
const showChecks=(el,r)=>{el.innerHTML=r.checks.map(c=>`<li data-ok="${c.ok}">${c.ok?'✓':'✗'} ${esc(c.name)}</li>`).join('')+`<li class="sum" data-ok="${r.ok}">${r.ok?'Dossier verificado.':'El dossier NO coincide con su manifiesto o con los datos actuales.'}</li>`;};
$('buildBtn').addEventListener('click',build);
$('dlHtml').addEventListener('click',()=>download(slug(state.dossier.view.title)+'.html',state.dossier.html,'text/html'));
$('dlManifest').addEventListener('click',()=>download(slug(state.dossier.view.title)+'.manifest.json',JSON.stringify(state.dossier.manifest,null,1),'application/json'));
$('verifyBtn').addEventListener('click',async()=>showChecks($('verifyOut'),await D.verify(state.dossier.html,state.dossier.manifest,{beforeProject:state.before,afterProject:state.after,budget:state.dossier.budget,beforeBudget:state.dossier.beforeBudget})));
$('verifyFilesBtn').addEventListener('click',async()=>{try{const h=$('vHtml').files[0],m=$('vManifest').files[0];if(!h||!m)throw Error('Elige el HTML y su manifiesto.');
  showChecks($('verifyFilesOut'),await D.verify(await h.text(),JSON.parse(await m.text())));}catch(e){$('verifyFilesOut').innerHTML=`<li data-ok="false">✗ ${esc(e.message)}</li>`;}});
updateDeclare();
// Apertura desde Variantes (FloorPlanVariantsCompare.handoff): ?src=library&before=<entrada>&after=<entrada>. Solo lectura:
// se eligen esas dos entradas de la biblioteca de este navegador y se compara; si no existen, se dice y no se muestra nada.
(function(){const q=new URLSearchParams(location.search);if(q.get('src')!=='library'||!q.get('before')||!q.get('after'))return;
  const radio=document.querySelector('input[name=src][value=library]');radio.checked=true;state.src='library';$('pickLibrary').hidden=false;$('pickFiles').hidden=true;fillLibrary();updateDeclare();
  const ids=libraryEntries().map(e=>e.id),missing=[q.get('before'),q.get('after')].filter(id=>!ids.includes(id));
  if(missing.length){$('srcError').textContent=`No están en la biblioteca de este navegador: ${missing.join(', ')}.`;return;}
  $('libBefore').value=q.get('before');$('libAfter').value=q.get('after');doCompare();})();
})();
