/* FT3D-8 · M1 lab · S2 «Precios de referencia». Thin UI over FloorPlanCostCatalog (which itself only orchestrates the
   existing providers, the budget bridge and the C1–C4 engine). No network: files are read locally. */
(function(){
 'use strict';
 const {$,esc,eur,unitLabel}=window.M1UI,C=window.FloorPlanCostCatalog,B=window.FloorPlanBudget,X=window.M1Fixtures||window.FloorPlanM1Fixtures;
 const state={budget:X.budget(B),selected:'it-fab',sources:[],columns:{},quotes:[],preview:null,proposal:null,history:[],versions:[]};
 const api=window.__m1s2={state};
 const eurIn=v=>v===null||v===undefined?'desconocido':eur(v); // inside a sentence
 const uq=u=>({m2:'m²',m:'m',unit:'ud',ud:'ud',ml:'m','m²':'m²'})[u]||u; // display notation of a quote unit
 const tone=s=>C.STATES[s]?.tone||'neutral';
 const chip=(text,t='')=>`<span class="chip ${t}">${esc(text)}</span>`;
 const item=id=>state.budget.items.find(i=>i.id===id);
 const fmtDate=d=>d?new Date(d+'T00:00:00Z').toLocaleDateString('es-ES',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'}):'sin fecha';
 // Synthetic labels from the existing adapter are shown in plain Spanish (the original stays as the tooltip).
 const nice=l=>/^SYNTHETIC TEST ONLY/.test(l||'')?'BCCA de prueba · datos inventados':/^DATOS DE PRUEBA — base tipo BCCA/.test(l||'')?l.replace('DATOS DE PRUEBA — base tipo','BCCA de prueba · datos inventados ·').replace(/ (\d{4})$/,' $1'):l;
 const licenseText=l=>({'not-applicable':'no aplica (datos de prueba)',unknown:'desconocida: responde quien aporta el archivo',verified:'verificada',restricted:'restringida'})[l]||l;

 /* ---------- budget ---------- */
 function remember(label,change=null){state.versions.push({rev:C.revisionTag(state.budget),label,budget:B.serializeBudget(state.budget)});if(change)state.history.push(change);}
 function renderBudget(){
  const calc=B.calculateBudget(state.budget),cov=C.coverage(state.budget);
  $('budgetTitle').textContent=state.budget.title;$('budgetRev').textContent=C.revisionTag(state.budget);
  const t=cov.netComplete?'ok':'warn';
  $('coverage').className='banner '+t;
  $('coverage').innerHTML=(cov.netKnown===null?'Todavía no hay ninguna partida con precio: no hay importe conocido.':`${esc(cov.label)}: <span id="covAmount">${eur(cov.netKnown)}</span>`)+`${cov.netComplete?'':`<small>${cov.unpriced.length} partida${cov.unpriced.length===1?'':'s'} sin precio. ${esc(C.STATES.partial.detail)}</small>`}${cov.unreviewed.length?`<small>${cov.unreviewed.length} precio${cov.unreviewed.length===1?'':'s'} pendiente${cov.unreviewed.length===1?'':'s'} de tu revisión.</small>`:''}`;
  $('items').innerHTML=state.budget.items.map(it=>{const line=calc.lines.find(l=>l.id===it.id),ref=it.priceReference;
   const src=it.priceSource?.type==='provider-reference'?chip('Referencia · '+(ref?.source?.edition?'ed. '+ref.source.edition:ref?.source?.label||''),'ok'):it.priceSource?.type==='manual'?chip('Precio propio'):chip('Sin precio','warn');
   const rev=it.unitPrice===null?'':it.review.status==='reviewed'?chip('Revisado','ok'):chip('Sin revisar','warn');
   const kept=ref&&it.priceSource?.type!=='provider-reference'?chip(`Ref. guardada ${eur(ref.unitPrice)}`,'info'):'';
   return `<li><button type="button" data-item="${esc(it.id)}" aria-pressed="${it.id===state.selected}"><span class="d">${esc(it.description)}</span><span class="p">${it.unitPrice===null?'Sin precio':eur(it.unitPrice)+' / '+unitLabel[it.quantity.unit]}</span>
    <span class="m">${esc(it.quantity.value)} ${unitLabel[it.quantity.unit]} · importe ${line.subtotalNet===null?'desconocido':eur(line.subtotalNet)+' sin IVA'} ${src} ${rev} ${kept}</span></button></li>`;}).join('');
  $('history').innerHTML=state.versions.map((v,i)=>`<li><b>${esc(v.label)}</b> · <code>${esc(v.rev)}</code>${i===state.versions.length-1?' · versión actual':''}</li>`).join('');
  $('searchFor').textContent=item(state.selected)?`para: ${item(state.selected).description}`:'';
 }
 $('items').addEventListener('click',e=>{const b=e.target.closest('[data-item]');if(!b)return;state.selected=b.dataset.item;state.quotes=[];state.preview=null;renderBudget();renderCompare();});
 $('budgetSave').onclick=()=>{const text=B.serializeBudget(state.budget),a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type:'application/json'}));a.download=`presupuesto-${state.budget.id}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),30000);$('budgetIo').textContent='Presupuesto guardado con sus precios, referencias y procedencia.';};
 $('budgetOpen').onchange=async e=>{const f=e.target.files[0];e.target.value='';if(!f)return;
  try{const b=B.parseBudget(await f.text());state.budget=b;state.selected=b.items[0]?.id||null;state.quotes=[];state.preview=null;remember('Presupuesto abierto');$('budgetIo').textContent='Presupuesto abierto: procedencia y revisiones conservadas.';renderBudget();renderCompare();}
  catch(err){$('budgetIo').textContent='No se puede abrir: no es un presupuesto de RUBIK válido. No ha cambiado nada.';}};

 /* ---------- sources ---------- */
 function addSource(made,label){
  if(made.status!=='available'){const d=C.describe(made.state||'catalog-unavailable');$('sourceError').textContent=`${label}: ${d.title}. ${d.detail}`;return null;}
  $('sourceError').textContent='';state.sources.push(made);if(made.source.column!==null)state.columns[made.source.id]=made.source.column;renderSources();return made;
 }
 function renderSources(){
  $('sourceList').innerHTML=state.sources.map(s=>{const src=s.source,cols=src.columns.length>1;
   return `<li data-source="${esc(src.id)}"><div class="s-h">${chip(src.kind==='bcca'?'BCCA':src.kind==='tariff'?'Tarifa propia':'BC3','info')}<b title="${esc(src.label)}">${esc(nice(src.label))}</b></div>
    <div class="s-m">${src.edition?'Edición '+esc(src.edition)+' · ':''}${src.region?esc(src.region)+' · ':''}precios a ${fmtDate(src.asOf)} · ${src.count} partidas con precio · licencia ${esc(licenseText(src.license.status))}</div>
    ${cols?`<label class="field">Columna de precios<select data-col="${esc(src.id)}"><option value="">Elige una columna…</option>${src.columns.map((c,i)=>`<option value="${i}"${state.columns[src.id]===i?' selected':''}>${esc(c)}</option>`).join('')}</select></label>`:''}</li>`;}).join('');
  const fams=[...new Set(state.sources.flatMap(s=>s.source.families))].sort((a,b)=>a.localeCompare(b,'es'));
  $('family').innerHTML='<option value="">Todas</option>'+fams.map(f=>`<option>${esc(f)}</option>`).join('');
 }
 $('sourceList').addEventListener('change',e=>{const s=e.target.closest('[data-col]');if(!s)return;state.columns[s.dataset.col]=s.value===''?null:Number(s.value);});
 const managed=C.managedStatus();
 $('managed').innerHTML=`<b>Catálogo BCCA gestionado por RUBIK: no disponible</b>RUBIK no descarga, aloja ni actualiza la BCCA mientras el permiso de ese uso no esté documentado (estado legal: ${esc(managed.legal==='UNKNOWN'?'sin acreditar':managed.legal)}). Puedes usar el BC3 de la BCCA que tú obtengas: se lee solo en tu navegador.`;
 $('managed').dataset.enabled=String(managed.enabled);
 function loadDemo(edition='2024'){
  addSource(C.bccaSource({bytes:X.bytes(X.bcca[edition]),datasetMode:'synthetic',source:X.source(edition)}),'BCCA de prueba');
 }
 $('loadDemo').onclick=()=>{state.sources=[];state.columns={};loadDemo('2024');addSource(C.bc3Source({bytes:X.bytes(X.tariff),fileName:'tarifa-estudio.bc3',kind:'tariff'}),'Tarifa de prueba');
  renderSources();$('searchStatus').textContent='Fuentes de demostración cargadas. Busca una referencia para la partida seleccionada.';
  if(!$('loadEdition'))$('sourcesCard').querySelector('.actions').insertAdjacentHTML('beforeend','<button type="button" class="btn" id="loadEdition">Cargar edición nueva (demostración)</button>');
  $('loadEdition').onclick=()=>proposeUpdate();};
 const fileSource=(input,make,label)=>{$(input).onchange=async e=>{const f=e.target.files[0];e.target.value='';if(!f)return;
  if(f.size>C.LIMITS.fileBytes){$('sourceError').textContent=`${label}: el archivo supera ${C.LIMITS.fileBytes/1048576} MB.`;return;}
  addSource(make(new Uint8Array(await f.arrayBuffer()),f.name),label);};};
 fileSource('loadBcca',(bytes,name)=>C.bccaSource({bytes,fileName:name,datasetMode:'user-supplied',source:{label:`BCCA · ${name}`,sourceName:'Base de Costes de la Construcción de Andalucía (BC3 aportado por el profesional)',sourceUrl:null,edition:null,attribution:null,licenseName:null,licenseUrl:null}}),'BC3 de la BCCA');
 fileSource('loadBc3',(bytes,name)=>C.bc3Source({bytes,fileName:name,kind:'bc3'}),'BC3');
 fileSource('loadTariff',(bytes,name)=>C.bc3Source({bytes,fileName:name,kind:'tariff'}),'Tarifa');

 /* ---------- search ---------- */
 $('searchForm').onsubmit=async e=>{e.preventDefault();
  if(!state.sources.length){$('searchStatus').textContent='Carga primero una fuente de precios.';return;}
  const it=item(state.selected),text=$('q').value.trim();
  if(text.length<C.LIMITS.queryMinChars){$('searchStatus').textContent='Escribe al menos dos caracteres.';return;}
  $('searchStatus').textContent='Buscando…';
  const r=await C.searchAll(state.sources,{text,family:$('family').value||null});
  // Same unit as the item, by NOTATION only (ud ≡ unit, m² ≡ m2): never a conversion.
  if($('sameUnit').checked&&it)for(const g of r.groups){if(g.status!=='available')continue;g.items=g.items.filter(x=>C.unitCheck(it.quantity.unit,x.unit).ok);g.state=g.items.length?'found':'not-found';}
  const n=r.groups.reduce((a,g)=>a+g.items.length,0);
  $('searchStatus').textContent=n?`${n} referencia${n===1?'':'s'} encontrada${n===1?'':'s'}.`:'No hay referencias con esos criterios.';
  $('results').innerHTML=r.groups.map(g=>`<section class="group" data-group="${esc(g.source.id)}"><h3>${esc(nice(g.source.label))} ${g.source.edition?chip('ed. '+g.source.edition):''} ${g.source.region?chip(g.source.region):''} ${g.state!=='found'?chip(C.describe(g.state).title,tone(g.state)):''}</h3>
   ${g.items.length?`<ul class="rows">${g.items.map(x=>`<li><code>${esc(x.code)}</code><span>${esc(x.description)}${x.family?` <span class="fam">· ${esc(x.family)}</span>`:''}</span><span class="unit">${esc(uq(x.unit))}</span><button type="button" class="btn small" data-quote="${esc(x.code)}" data-src="${esc(g.source.id)}">Ver precio</button></li>`).join('')}</ul>`:''}</section>`).join('');
 };
 $('results').addEventListener('click',async e=>{const b=e.target.closest('[data-quote]');if(!b)return;
  const s=state.sources.find(x=>x.source.id===b.dataset.src),r=await s.quote(b.dataset.quote,{column:state.columns[s.source.id]??null});
  state.quotes=state.quotes.filter(q=>!(q.source.id===s.source.id&&q.code===b.dataset.quote));
  state.quotes.push({source:s.source,code:b.dataset.quote,state:r.state,quote:r.quote||null,family:r.family||null});
  state.preview=null;renderCompare();$('compareCard').scrollIntoView({block:'nearest'});});

 /* ---------- compare, provenance and explicit apply ---------- */
 function latestEdition(providerId){return state.sources.filter(s=>s.source.providerId===providerId&&s.source.edition).map(s=>s.source.edition).sort().at(-1)||null;}
 function renderCompare(){
  const it=item(state.selected);$('compareCard').hidden=!state.quotes.length||!it;if($('compareCard').hidden)return;
  const cmp=C.compare(state.budget,it.id,state.quotes.map(q=>({source:q.source,quote:q.quote,state:q.state})),{today:new Date().toISOString().slice(0,10),latestEdition:latestEdition('bcca-es')});
  $('compare').innerHTML=`<p class="hint">Partida: <b>${esc(it.description)}</b> · ${esc(it.quantity.value)} ${unitLabel[it.quantity.unit]} · precio actual ${eurIn(cmp.current.unitPrice)}${cmp.current.label?' ('+esc(cmp.current.label)+')':''}. Comparar no cambia nada.</p>
   <div class="scroll"><table><thead><tr><th>Fuente</th><th>Código</th><th class="num">Precio</th><th class="num">Diferencia</th><th>Estado</th><th></th></tr></thead><tbody>${cmp.options.map((o,i)=>`<tr data-row="${i}">
    <td>${esc(nice(o.label))}${o.edition?'<br><small>ed. '+esc(o.edition)+'</small>':''}</td><td><code>${esc(o.code||state.quotes[i].code)}</code></td><td class="num">${o.unitPrice===null||o.unitPrice===undefined?'Desconocido':eur(o.unitPrice)+(o.unit?' / '+esc(uq(o.unit)):'')}</td>
    <td class="num">${o.delta===null||o.delta===undefined?'—':(o.delta>0?'+':'')+eur(o.delta)}</td><td>${chip(C.describe(o.state).title,tone(o.state))}</td>
    <td>${o.unitPrice!==null&&o.unitPrice!==undefined?`<button type="button" class="btn small" data-detail="${i}">Procedencia y decisión</button>`:''}</td></tr>`).join('')}</tbody></table></div>
   ${cmp.options.some(o=>o.state!=='found')?`<p class="hint">${cmp.options.filter(o=>o.state!=='found').map(o=>esc(C.describe(o.state).detail)).filter((v,i,a)=>a.indexOf(v)===i).join(' ')}</p>`:''}`;
  $('detail').innerHTML='';renderPreview();
 }
 $('compare').addEventListener('click',e=>{const b=e.target.closest('[data-detail]');if(!b)return;showDetail(Number(b.dataset.detail));});
 function showDetail(i){
  const q=state.quotes[i],s=q.quote.source,it=item(state.selected),u=C.unitCheck(it.quantity.unit,q.quote.unit);
  $('detail').innerHTML=`<h3 class="sub">Procedencia del precio</h3><dl class="prov" id="provenance">
   <dt>Fuente</dt><dd title="${esc(s.label)}">${esc(nice(s.label))}</dd><dt>Tipo</dt><dd>${esc(q.source.kindLabel)}</dd><dt>Código</dt><dd><code>${esc(q.quote.code)}</code></dd><dt>Descripción</dt><dd>${esc(q.quote.description)}</dd>
   <dt>Unidad</dt><dd>${esc(uq(q.quote.unit))}${q.quote.unit!==uq(q.quote.unit)?' (escrita «'+esc(q.quote.unit)+'» en la fuente)':''}${u.ok?'':' · distinta de la partida ('+esc(unitLabel[it.quantity.unit])+')'}</dd><dt>Moneda</dt><dd>${esc(q.quote.currency)}</dd><dt>Precio</dt><dd>${eur(q.quote.unitPrice)} sin IVA</dd>
   <dt>Edición</dt><dd>${esc(s.edition||'no indicada')}</dd><dt>Región o columna</dt><dd>${esc(s.region||'no indicada')}</dd><dt>Fecha del precio</dt><dd>${fmtDate(s.asOf)}</dd>
   <dt>Licencia</dt><dd>${esc(licenseText(s.licenseStatus))}</dd><dt>Atribución</dt><dd>${esc(s.attribution||'no indicada por la fuente')}</dd></dl>
   <p class="hint">Es un precio de referencia: no es una oferta ni un coste de obra ejecutada.</p>
   <div class="actions"><button type="button" class="btn primary" data-as="price" data-i="${i}">Usar como precio de la partida…</button><button type="button" class="btn" data-as="reference" data-i="${i}">Guardar solo como referencia…</button></div>`;
 }
 $('detail').addEventListener('click',e=>{const b=e.target.closest('[data-as]');if(!b)return;
  const q=state.quotes[Number(b.dataset.i)];state.preview=C.previewApply(state.budget,state.selected,q.quote,{as:b.dataset.as,upgrade:true});renderPreview();$('preview').scrollIntoView({block:'nearest'});});
 const BLOCK_TEXT={'unit-incompatible':C.STATES['unit-incompatible'].detail,'currency-mismatch':C.STATES['currency-mismatch'].detail,unauthorized:C.STATES.unauthorized.detail,
  'active-reference-price':'Esta partida ya usa un precio de referencia: para cambiarlo, usa «Usar como precio».','budget-upgrade-required':'El presupuesto necesita actualizarse a la versión 1.1 para guardar referencias.','invalid-quote':'La referencia no es válida.'};
 function renderPreview(){
  const p=state.preview,box=$('preview');box.hidden=!p;if(!p)return;
  if(!p.ok){box.innerHTML=`<h3>No se puede aplicar</h3><p>${p.blockers.map(b=>esc(BLOCK_TEXT[b]||b)).join(' ')}</p><p class="hint">Tu presupuesto no ha cambiado.</p>`;return;}
  box.innerHTML=`<h3>${p.as==='price'?'Vas a usar este precio en la partida':'Vas a guardar esta referencia junto a la partida'}</h3>
   <div class="ba"><div><b>Ahora</b><span>${eur(p.before.unitPrice)}</span> · importe ${eurIn(p.before.subtotalNet)}${p.before.subtotalNet===null?'':' sin IVA'}</div><div><b>Después</b><span>${eur(p.after.unitPrice)}</span> · importe ${eurIn(p.after.subtotalNet)}${p.after.subtotalNet===null?'':' sin IVA'}</div></div>
   <p class="hint">${p.as==='price'?'El precio quedará «sin revisar» hasta que lo revises.':'El precio actual de la partida no cambia.'} Total conocido después: ${eurIn(p.after.coverage.netKnown)}${p.after.coverage.netComplete?'':' (presupuesto parcial)'}.</p>
   ${p.requiresConsent?`<label class="check confirm"><input type="checkbox" id="consentReviewed"> Sustituir el precio que ya había revisado</label>`:''}
   <div class="actions"><button type="button" class="btn primary" id="confirmApply">Confirmar</button><button type="button" class="btn" id="cancelApply">Cancelar</button></div><p class="err" id="applyError" role="alert"></p>`;
  $('confirmApply').onclick=()=>{try{const out=C.apply(state.budget,p,{confirmed:true,replaceReviewed:!!$('consentReviewed')?.checked,decidedAt:new Date().toISOString()});
    state.budget=out.budget;remember(`${p.as==='price'?'Precio aplicado':'Referencia guardada'} · ${item(p.itemId).description}`,out.change);state.preview=null;state.quotes=[];renderBudget();renderCompare();$('compareCard').hidden=true;$('searchStatus').textContent='Cambio aplicado. La versión anterior queda en el historial.';}
   catch(err){$('applyError').textContent=/explicit consent/.test(err.message)?'Marca la casilla para sustituir un precio revisado.':/changed since/.test(err.message)?'El presupuesto cambió mientras tanto: prepara de nuevo la decisión.':err.message;}};
  $('cancelApply').onclick=()=>{state.preview=null;renderPreview();};
 }

 /* ---------- edition update ---------- */
 async function proposeUpdate(){
  const next=addSource(C.bccaSource({bytes:X.bytes(X.bcca['2025']),datasetMode:'synthetic',source:X.source('2025')}),'Edición nueva');if(!next)return;
  state.proposal=await C.proposeEditionUpdate(state.budget,next);renderUpdates();renderCompare();
 }
 const ROW_STATE={'price-changed':['Precio distinto','info'],unchanged:['Sin cambios','ok'],'unit-incompatible':['Unidad cambiada: no aplicable','bad'],'missing-in-new':['No existe en la edición nueva','warn'],'no-price':['Sin precio en la edición nueva','warn']};
 function renderUpdates(){
  const p=state.proposal;$('updatesCard').hidden=!p;if(!p)return;
  $('updates').innerHTML=`<div class="banner info">${esc(C.STATES['update-available'].title)}: edición ${esc(p.newEdition)} <small>${esc(C.STATES['update-available'].detail)}</small></div>
   ${p.rows.length?`<div class="scroll"><table><thead><tr><th></th><th>Partida</th><th>Código</th><th class="num">Antes</th><th class="num">Edición nueva</th><th>Estado</th></tr></thead><tbody>${p.rows.map(r=>`<tr>
    <td><input type="checkbox" data-accept="${esc(r.itemId)}" aria-label="Aceptar ${esc(item(r.itemId)?.description||r.itemId)}" ${r.applicable&&r.state==='price-changed'?'':'disabled'}></td><td>${esc(item(r.itemId)?.description||r.itemId)}${r.active?'':'<br><small>solo referencia guardada</small>'}</td>
    <td><code>${esc(r.code)}</code></td><td class="num">${eur(r.oldPrice)}</td><td class="num">${eur(r.newPrice)}</td><td>${chip(...(ROW_STATE[r.state]||[r.state,'']))}</td></tr>`).join('')}</tbody></table></div>
    <label class="check confirm"><input type="checkbox" id="confirmUpdate"> He revisado los cambios y quiero aplicar los seleccionados</label>
    <div class="actions"><button type="button" class="btn primary" id="applyUpdate">Aplicar seleccionados</button><button type="button" class="btn" id="dismissUpdate">Ahora no</button></div><p class="err" id="updateError" role="alert"></p>`
    :'<p class="hint">Ninguna partida del presupuesto usa precios de esta fuente.</p>'}`;
  if(!p.rows.length)return;
  $('applyUpdate').onclick=()=>{const ids=[...document.querySelectorAll('[data-accept]:checked')].map(x=>x.dataset.accept);
   if(!ids.length){$('updateError').textContent='Selecciona al menos una partida.';return;}
   if(!$('confirmUpdate').checked){$('updateError').textContent='Confirma que has revisado los cambios.';return;}
   try{const out=C.applyEditionUpdate(state.budget,p,ids,{confirmed:true,decidedAt:new Date().toISOString()});state.budget=out.budget;remember(`Edición ${p.newEdition} aplicada a ${out.change.changes.length} partida${out.change.changes.length===1?'':'s'}`,out.change);
    state.proposal=null;renderUpdates();renderBudget();}catch(err){$('updateError').textContent=/changed since/.test(err.message)?'El presupuesto cambió: vuelve a preparar la actualización.':err.message;}};
  $('dismissUpdate').onclick=()=>{state.proposal=null;renderUpdates();};
 }

 remember('Versión inicial');renderBudget();renderSources();
 Object.assign(api,{renderBudget,loadDemo,proposeUpdate,revision:()=>C.revisionTag(state.budget)});
})();
