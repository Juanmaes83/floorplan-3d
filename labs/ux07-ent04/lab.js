/* UX-07 + ENT-04 · laboratorio aislado. Solo lee: la biblioteca y los presupuestos guardados en este navegador se leen a
   través de un almacenamiento de solo lectura (cualquier escritura falla). No hay red, ni publicación, ni enlaces. */
(function(){
'use strict';
const R=window.FloorPlanRevisionCompare,D=window.FloorPlanBeforeAfterDossier,L=window.FloorPlanLibrary,Core=window.FloorPlanCore,F=window.UX07Fixtures;
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const BUDGETS='rubik-budget-v1';
const readOnly={getItem:k=>{try{return localStorage.getItem(k);}catch{return null;}},setItem(){throw Error('Laboratorio de solo lectura');},removeItem(){throw Error('Laboratorio de solo lectura');}};
const state={src:'fixture',before:null,after:null,relation:null,comparison:null,files:{},library:null,dossier:null,budgets:{}};
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
for(const r of document.querySelectorAll('input[name=src]'))r.addEventListener('change',()=>{state.src=r.value;
  $('pickLibrary').hidden=r.value!=='library';$('pickFiles').hidden=r.value!=='files';if(r.value==='library')fillLibrary();$('srcError').textContent='';updateDeclare();});
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
    Object.assign(state,{before:p.before,after:p.after,relation:c.relation,comparison:c,dossier:null});render();fillBudgets();
  }catch(e){$('srcError').textContent=e.code==='relation-required'?e.message+' Marca la casilla si es así.':e.message;$('cmpCard').hidden=$('dosCard').hidden=true;}
}
function render(){
  const c=state.comparison;$('cmpCard').hidden=false;$('dosCard').hidden=false;
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
}
const download=(name,text,type)=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type}));a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),1000);};
const slug=s=>String(s).normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^\w]+/g,'-').replace(/^-|-$/g,'').toLowerCase().slice(0,50)||'dossier';
async function build(){
  $('dosError').textContent='';$('dosStatus').textContent='';$('verifyOut').innerHTML='';
  try{const c=state.comparison,budget=state.budgets[$('budgetSel').value]||null;
    const v=D.view(c,{beforeProject:state.before,afterProject:state.after,budget,title:$('dosTitleIn').value.trim()||null});
    const out=await D.exportDossier(v,{beforeProject:state.before,afterProject:state.after,budget,comparison:c,beforeSvg:R.planSvg(c,'before',state.before),afterSvg:R.planSvg(c,'after',state.after)});
    state.dossier={view:v,budget,...out};$('preview').srcdoc=out.html;$('dosOut').hidden=false;
    $('dosStatus').textContent=v.budget?`${v.budget.label}${v.budget.quantities==='differ'?' · las cantidades NO coinciden con «'+c.after.label+'»':' · cantidades comprobadas con «'+c.after.label+'»'}. Huella ${out.manifest.html.sha256.slice(0,12)}…`:`Sin presupuesto: el dossier no muestra importes. Huella ${out.manifest.html.sha256.slice(0,12)}…`;
  }catch(e){$('dosError').textContent=e.message;$('dosOut').hidden=true;state.dossier=null;}
}
const showChecks=(el,r)=>{el.innerHTML=r.checks.map(c=>`<li data-ok="${c.ok}">${c.ok?'✓':'✗'} ${esc(c.name)}</li>`).join('')+`<li class="sum" data-ok="${r.ok}">${r.ok?'Dossier verificado.':'El dossier NO coincide con su manifiesto o con los datos actuales.'}</li>`;};
$('buildBtn').addEventListener('click',build);
$('dlHtml').addEventListener('click',()=>download(slug(state.dossier.view.title)+'.html',state.dossier.html,'text/html'));
$('dlManifest').addEventListener('click',()=>download(slug(state.dossier.view.title)+'.manifest.json',JSON.stringify(state.dossier.manifest,null,1),'application/json'));
$('verifyBtn').addEventListener('click',async()=>showChecks($('verifyOut'),await D.verify(state.dossier.html,state.dossier.manifest,{beforeProject:state.before,afterProject:state.after,budget:state.dossier.budget})));
$('verifyFilesBtn').addEventListener('click',async()=>{try{const h=$('vHtml').files[0],m=$('vManifest').files[0];if(!h||!m)throw Error('Elige el HTML y su manifiesto.');
  showChecks($('verifyFilesOut'),await D.verify(await h.text(),JSON.parse(await m.text())));}catch(e){$('verifyFilesOut').innerHTML=`<li data-ok="false">✗ ${esc(e.message)}</li>`;}});
updateDeclare();
})();
