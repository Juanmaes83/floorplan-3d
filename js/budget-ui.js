/* Phase C2: «Presupuesto» in Presupuestar. Items come from the project quantities (FloorPlanBudgetDraft over 7A/7B);
   the professional sets waste, own unit prices and the VAT, and marks each price reviewed. Totals come only from
   FloorPlanBudget.calculateBudget: an item without price leaves the total incomplete and says so, never as 0.
   Own prices can be kept in the studio tariff (this browser) and are offered — unreviewed — in the next budget.
   Storage: rubik-budget-v1 {projectId: budget} and rubik-tariff-v1 {tariffKey: {unitPrice, asOf}}. The budget is a
   separate document from the project (Point 7B decision). */
(function(){
 'use strict';
 const app=window.FloorPlanApp,B=window.FloorPlanBudget,D=window.FloorPlanBudgetDraft,P=window.FloorPlanBudgetPresentation;if(!app||!B||!D||!P)return;
 const tx=(es,en,zh)=>({es,en,zh})[typeof LANG==='string'?LANG:'es']||es;
 const el=(tag,text,parent,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;parent?.append(n);return n;};
 const btn=(text,parent,cls='btn')=>{const b=el('button',text,parent,cls);b.type='button';return b;};
 const local=v=>typeof nm==='function'?nm(v):v;
 const BUDGETS='rubik-budget-v1',TARIFF='rubik-tariff-v1';
 const read=k=>{try{const v=JSON.parse(localStorage.getItem(k));return v&&typeof v==='object'&&!Array.isArray(v)?v:{};}catch{return {};}};
 const write=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));return true;}catch{return false;}};
 const loc=typeof LANG==='string'&&LANG==='en'?'en-GB':'es-ES';
 const eur=v=>v===null||v===undefined?'—':v.toLocaleString(loc,{style:'currency',currency:'EUR'});
 const num=(v,d=2)=>v===null||v===undefined?'—':v.toLocaleString(loc,{minimumFractionDigits:d,maximumFractionDigits:d});
 const UNIT=()=>({m2:'m²',m:'m',unit:tx('ud','pcs','个')});
 const STATUS=()=>({measured:tx('medido','measured','已测量'),estimated:tx('estimado','estimated','估算'),unavailable:tx('no disponible','unavailable','不可用')});
 const labels=()=>({title:tx('Presupuesto','Budget','预算'),floor:tx('Pavimento','Flooring','地面'),skirting:tx('Rodapié (perímetro de estancias, sin descontar puertas)','Skirting (room perimeter, doors not deducted)','踢脚线'),paint:tx('Pintura plástica en paredes (caras netas)','Wall paint (net faces)','墙面涂料'),newWalls:tx('Tabiquería nueva','New partitions','新隔墙'),demolition:tx('Demolición de tabiquería','Partition demolition','拆除隔墙'),door:tx('Puerta de paso','Interior door','室内门'),slidingDoor:tx('Puerta corredera','Sliding door','推拉门'),window:tx('Ventana','Window','窗'),tariff:tx('Tarifa del estudio','Studio tariff','工作室价目'),
  chapters:{floors:tx('Pavimentos y rodapiés','Floors and skirting','地面与踢脚'),walls:tx('Acabados de paredes','Wall finishes','墙面'),partitions:tx('Tabiquería','Partitions','隔墙'),carpentry:tx('Carpintería','Doors and windows','门窗')}});
 const slug=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^\w]+/g,'-').replace(/^-|-$/g,'').toLowerCase().slice(0,50)||'proyecto';
 let state=null,returnFocus=null,base=null,baseColumn=0,openRef=null;
 const X=window.FloorPlanBc3Budget,Bridge=window.FloorPlanBudgetCostBridge;
 function apply(fn){state.budget=B.validateBudget(fn(state.budget));save();}
 // Current budget of the open project, rebuilt over the project quantities (keeps prices, waste and valid reviews).
 function load(){const saved=read(BUDGETS)[app.project.id]||null;let previous=null;try{previous=saved?B.parseBudget(JSON.stringify(saved)):null;}catch{previous=null;}
  const r=D.draft(app.project,{previous,tariff:read(TARIFF),name:local,labels:labels()});return {...r,savedBefore:!!previous};}
 function save(){const all=read(BUDGETS);all[app.project.id]=JSON.parse(B.serializeBudget(state.budget));if(!write(BUDGETS,all))say(tx('No se pudo guardar el presupuesto en este navegador.','The budget could not be saved in this browser.','无法保存预算。'));}
 function say(m){const s=dialog.querySelector('#budgetStatus');if(s)s.textContent=m;}
 function setItem(id,fn){const i=state.budget.items.findIndex(x=>x.id===id);const next={...state.budget,items:state.budget.items.slice()};next.items[i]=fn(next.items[i]);state.budget=B.validateBudget(next);save();}
 const dialog=el('dialog',undefined,document.body,'ai-render-dialog budget-dialog');dialog.id='budgetDialog';dialog.setAttribute('aria-labelledby','budgetTitle');
 dialog.addEventListener('close',()=>returnFocus?.focus?.({preventScroll:true}));
 function open(){returnFocus=document.activeElement;state=load();save();draw();dialog.showModal();dialog.querySelector('#budgetTitle')?.focus();}
 function draw(focusId=null){
  const c=B.calculateBudget(state.budget),st=STATUS(),u=UNIT(),lines=new Map(c.lines.map(l=>[l.id,l])),scroll=dialog.scrollTop;dialog.replaceChildren();
  const head=el('div',undefined,dialog,'ai-render-head');const h=el('h2',tx('Presupuesto','Budget','预算'),head);h.id='budgetTitle';h.tabIndex=-1;
  const close=btn(tx('Cerrar','Close','关闭'),head);close.id='budgetClose';close.onclick=()=>dialog.close();
  el('p',tx('Las cantidades salen del proyecto (con su estado); los precios son sólo tuyos y ninguno se da por revisado hasta que lo marcas. Rubik no certifica el coste real. Si cambias el proyecto, al volver a abrir se actualizan las cantidades y se conservan tus precios.','Quantities come from the project (with their status); prices are only yours and none counts as reviewed until you mark it. Rubik does not certify actual cost. If you change the project, reopening updates quantities and keeps your prices.','数量来自项目；价格只由您填写，标记前均未审核。'),dialog,'ai-render-note').id='budgetNote';
  if(state.reviewInvalidated.length)el('p',tx(`La cantidad de ${state.reviewInvalidated.length} partida(s) ha cambiado desde tu revisión: revísalas de nuevo.`,`The quantity of ${state.reviewInvalidated.length} item(s) changed since your review: review them again.`,'部分条目数量已变化，请重新审核。'),dialog,'budget-warn').id='budgetInvalidated';
  const bar=el('div',undefined,dialog,'budget-bar');const vl=el('label',undefined,bar);el('span',tx('IVA','VAT','增值税'),vl);const vat=el('select',undefined,vl);vat.id='budgetVat';
  for(const [v,t] of [['21','21 %'],['10',tx('10 % (reforma de vivienda)','10 % (home renovation)','10 %')],['4','4 %'],['0','0 %'],['',tx('Sin IVA indicado','No VAT set','未设置')]]){const o=el('option',t,vat);o.value=v;}
  vat.value=state.budget.taxRatePercent===null?'':String(state.budget.taxRatePercent);vat.onchange=()=>{state.budget=B.validateBudget({...state.budget,taxRatePercent:vat.value===''?null:+vat.value});save();draw('budgetVat');};
  for(const ch of state.budget.chapters){const items=state.budget.items.filter(i=>i.chapterId===ch.id);const wrap=el('div',undefined,dialog,'quantity-table-wrap');const t=el('table',undefined,wrap,'quantity-table budget-table');t.dataset.chapter=ch.id;el('caption',ch.title,t);
   const hr=el('tr',undefined,el('thead',undefined,t));for(const x of [tx('Partida','Item','条目'),tx('Cantidad','Quantity','数量'),tx('Merma %','Waste %','损耗 %'),tx('Precio €/ud','Price €/unit','单价 €'),tx('Subtotal','Subtotal','小计'),tx('Revisado','Reviewed','已审核')])el('th',x,hr).scope='col';
   const tb=el('tbody',undefined,t);
   for(const it of items){const l=lines.get(it.id),tr=el('tr',undefined,tb);tr.dataset.item=it.id;const th=el('th',it.description,tr);th.scope='row';
    if(it.priceSource)el('small',it.priceSource.type==='provider-reference'?tx('Precio de referencia','Reference price','参考价格')+` · ${it.priceReference?.source?.label||''} ${it.priceReference?.code||''}`:it.priceSource.label,th,'budget-source');
    if(it.priceReference&&it.priceSource?.type!=='provider-reference')el('small',`${tx('Ref.','Ref.','参考')} ${it.priceReference.code||''}: ${eur(it.priceReference.unitPrice)}/${u[it.priceReference.unit]} · ${it.priceReference.source.label}`,th,'budget-source budget-ref');
    if(base&&X&&Bridge){const rb=btn(openRef===it.id?tx('Cerrar búsqueda','Close search','关闭'):tx('Buscar referencia','Find reference','查找参考'),th,'btn budget-small');rb.dataset.field='ref';rb.onclick=()=>{openRef=openRef===it.id?null:it.id;draw(`${it.id}|${openRef?'refq':'ref'}`);};}
    el('td',`${num(it.quantity.value)} ${u[it.quantity.unit]} · ${st[it.quantity.status]}${it.quantity.complete?'':' ⚠'}`,tr,'is-num').dataset.label=tx('Cantidad','Quantity','数量');
    const wt=el('td',undefined,tr);wt.dataset.label=tx('Merma %','Waste %','损耗 %');const w=el('input',undefined,wt);w.type='number';w.min='0';w.max='100';w.step='1';w.value=String(it.wastePercent);w.className='budget-input';w.setAttribute('aria-label',tx(`Merma de ${it.description}`,`Waste of ${it.description}`,'损耗'));w.dataset.field='waste';
    w.onchange=()=>{const v=Number(w.value);if(!(v>=0&&v<=100)){w.value=String(it.wastePercent);return;}setItem(it.id,x=>({...x,wastePercent:v}));draw(`${it.id}|waste`);};
    const pt=el('td',undefined,tr);pt.dataset.label=tx('Precio €/ud','Price €/unit','单价 €');const p=el('input',undefined,pt);p.type='number';p.min='0';p.step='0.01';p.inputMode='decimal';p.value=it.unitPrice===null?'':String(it.unitPrice);p.placeholder=tx('sin precio','no price','无价格');p.className='budget-input';p.setAttribute('aria-label',tx(`Precio de ${it.description}`,`Price of ${it.description}`,'单价'));p.dataset.field='price';
    p.onchange=()=>{const raw=p.value.trim();if(raw===''){setItem(it.id,x=>B.clearPrice(x));}else{const v=Math.round(Number(raw)*100)/100;if(!(v>=0)){p.value=it.unitPrice===null?'':String(it.unitPrice);return;}setItem(it.id,x=>B.setManualPrice(x,{unitPrice:v,label:tx('Precio propio','Own price','自有价格')}));}draw(`${it.id}|price`);};
    el('td',eur(l.subtotalNet),tr,'is-num').dataset.label=tx('Subtotal','Subtotal','小计');
    const rt=el('td',undefined,tr);rt.dataset.label=tx('Revisado','Reviewed','已审核');const r=el('input',undefined,rt);r.type='checkbox';r.checked=it.review.status==='reviewed';r.disabled=it.unitPrice===null;r.setAttribute('aria-label',tx(`Precio de ${it.description} revisado`,`${it.description} price reviewed`,'已审核'));r.dataset.field='review';
    r.onchange=()=>{setItem(it.id,x=>r.checked?B.markReviewed(x,{reviewedAt:new Date().toISOString()}):B.setManualPrice(x,{unitPrice:x.unitPrice,label:x.priceSource?.label||tx('Precio propio','Own price','自有价格'),asOf:x.priceSource?.asOf||null}));draw(`${it.id}|review`);};
    if(openRef===it.id&&base)refPanel(tb,it);}}
  if(X&&Bridge){const ref=el('details',undefined,undefined,'budget-bc3');bar.after(ref);ref.id='budgetBc3';ref.open=!!base;el('summary',tx('Precios de referencia (BC3)','Reference prices (BC3)','参考价格 (BC3)'),ref);
   el('p',tx('Carga una base de precios en formato BC3 que tengas (tu tarifa o una base de precios que hayas obtenido). Se lee en este navegador: Rubik no la sube ni la guarda. Tú respondes de su licencia de uso. Un precio de referencia nunca se da por revisado.','Load a BC3 price base you have. It is read in this browser: Rubik does not upload or keep it. You answer for its licence. A reference price never counts as reviewed.','载入您拥有的 BC3 价格库，仅在本浏览器读取。'),ref,'budget-bc3-note');
   const file=el('input',undefined,ref);file.type='file';file.accept='.bc3,.BC3';file.hidden=true;file.id='budgetBc3File';
   const load=btn(base?tx('Cargar otra base…','Load another base…','载入其他'):tx('Cargar base de precios (BC3)…','Load price base (BC3)…','载入 BC3'),ref);load.id='budgetBc3Load';load.onclick=()=>file.click();
   file.onchange=async()=>{const f=file.files[0];file.value='';if(!f)return;try{if(f.size>30*1024*1024)throw Error(tx('El archivo supera 30 MB.','The file is over 30 MB.','文件超过 30 MB。'));base=X.load(new Uint8Array(await f.arrayBuffer()),f.name);baseColumn=0;draw('budgetBc3Load');say(tx(`Base cargada: ${base.count} partidas con precio.`,`Base loaded: ${base.count} priced items.`,`已载入 ${base.count} 项。`));}catch(e){say(e.message);}};
   if(base){el('p',`${base.owner||base.fileName} · ${base.count} ${tx('partidas con precio','priced items','项')} · ${base.fileName}`,ref,'budget-bc3-base').id='budgetBc3Base';
    if(base.labels.length>1){const cl=el('label',undefined,ref);el('span',tx('Columna de precio','Price column','价格列'),cl);const cs=el('select',undefined,cl);cs.id='budgetBc3Column';base.labels.forEach((l,i)=>{const o=el('option',l||String(i+1),cs);o.value=String(i);});cs.value=String(baseColumn);cs.onchange=()=>{baseColumn=+cs.value;draw('budgetBc3Column');};}
    el('p',tx('Usa «Buscar referencia» en cada partida.','Use «Find reference» on each item.','在每个条目使用“查找参考”。'),ref,'budget-bc3-note');}}
  // Totals, exactly as the budget core computes them, with what is missing said plainly.
  const tot=el('dl',undefined,dialog,'quantity-summary budget-totals');tot.id='budgetTotals';const fact=(k,v)=>{const g=el('div',undefined,tot);el('dt',k,g);el('dd',v,g);};
  fact(tx('Base imponible','Net','净额'),eur(c.totals.net.amount));fact(tx('IVA','VAT','增值税'),c.taxRatePercent===null&&!c.lines.some(l=>l.effectiveTaxRatePercent!==null)?'—':eur(c.totals.tax.amount));fact(tx('Total','Total','合计'),eur(c.totals.gross.amount));
  const warn=el('ul',undefined,dialog,'budget-warnings');warn.id='budgetWarnings';
  if(c.totals.unpricedItemIds.length)el('li',tx(`${c.totals.unpricedItemIds.length} ${c.totals.unpricedItemIds.length===1?'partida':'partidas'} sin precio: el total no está completo.`,`${c.totals.unpricedItemIds.length} items without price: the total is not complete.`,'部分条目无价格，合计不完整。'),warn);
  if(c.totals.unreviewedPriceItemIds.length)el('li',tx(`${c.totals.unreviewedPriceItemIds.length} ${c.totals.unreviewedPriceItemIds.length===1?'precio':'precios'} sin revisar.`,`${c.totals.unreviewedPriceItemIds.length} prices not reviewed.`,'部分价格未审核。'),warn);
  if(c.taxRatePercent===null)el('li',tx('No has indicado el IVA.','You have not set the VAT.','未设置增值税。'),warn);
  if(c.totals.incompleteQuantityItemIds.length)el('li',tx(`${c.totals.incompleteQuantityItemIds.length} cantidades parciales (⚠): parte de la geometría no se pudo medir.`,`${c.totals.incompleteQuantityItemIds.length} partial quantities (⚠).`,'部分数量不完整。'),warn);
  if(!warn.children.length)el('li',tx('Todas las partidas tienen precio revisado.','Every item has a reviewed price.','所有条目均已审核。'),warn,'is-ok');
  const row=el('div',undefined,dialog,'tour-video-actions');
  const keep=btn(tx('Guardar mis precios en la tarifa del estudio','Save my prices to the studio tariff','保存到工作室价目'),row);keep.id='budgetTariff';
  keep.onclick=()=>{const tariff=read(TARIFF);let n=0;for(const it of state.budget.items)if(it.unitPrice!==null){tariff[state.tariffKeys[it.id]]={unitPrice:it.unitPrice,asOf:new Date().toISOString().slice(0,10)};n++;}write(TARIFF,tariff);say(tx(`${n} precios guardados en tu tarifa: se propondrán (sin revisar) en tus próximos presupuestos.`,`${n} prices saved to your tariff.`,`已保存 ${n} 个价格。`));};
  const csv=btn(tx('Descargar presupuesto (CSV)','Download budget (CSV)','下载预算 (CSV)'),row,'btn primary');csv.id='budgetCsv';
  csv.onclick=()=>download(new Blob([P.toCsv(state.budget,{delimiter:';',bom:true})],{type:'text/csv;charset=utf-8'}),`rubik-sota-presupuesto-${slug(local(app.project.name))}.csv`);
  const js=btn(tx('Descargar presupuesto (JSON)','Download budget (JSON)','下载预算 (JSON)'),row);js.id='budgetJson';
  js.onclick=()=>download(new Blob([B.serializeBudget(state.budget)],{type:'application/json'}),`rubik-sota-presupuesto-${slug(local(app.project.name))}.json`);
  if(X){const bc=btn(tx('Descargar presupuesto (BC3)','Download budget (BC3)','下载预算 (BC3)'),row);bc.id='budgetBc3Export';bc.onclick=()=>{try{const out=X.exportBudget(state.budget,{title:local(app.project.name)});download(new Blob([out.bytes],{type:'application/octet-stream'}),`rubik-sota-presupuesto-${slug(local(app.project.name))}.bc3`);say(tx(`BC3 generado: ${out.check.concepts.length} conceptos. Las partidas sin precio van sin precio.`,`BC3 generated: ${out.check.concepts.length} concepts.`,'BC3 已生成。'));}catch(e){say(e.message);}};}
  const status=el('p','',dialog,'ai-render-status');status.id='budgetStatus';status.setAttribute('role','status');status.setAttribute('aria-live','polite');
  dialog.scrollTop=scroll;
  if(focusId){const [id,field]=focusId.split('|');if(field==='refq'){dialog.querySelector('#budgetRefQuery')?.focus({preventScroll:true});return;}(field?dialog.querySelector(`tr[data-item="${CSS.escape(id)}"] [data-field="${field}"]`):dialog.querySelector('#'+id))?.focus({preventScroll:true});}
 }
 // Search the loaded BC3 for one item: same unit only; use the price, or keep it only as a reference.
 function refPanel(tbody,it){const tr=el('tr',undefined,tbody,'budget-ref-row');const td=el('td',undefined,tr);td.colSpan=6;
  const q=el('input',undefined,td,'budget-ref-q');q.type='search';q.id='budgetRefQuery';q.dataset.field='refq';q.value=it.description.replace(/\(.*\)/,'').trim();q.setAttribute('aria-label',tx('Buscar en la base de precios','Search the price base','搜索价格库'));
  const list=el('ul',undefined,td,'budget-ref-list');list.id='budgetRefResults';const u=UNIT();
  const show=()=>{list.replaceChildren();const found=X.search(base,{text:q.value,unit:it.quantity.unit,limit:12});if(!found.length){el('li',tx(`Sin resultados en ${u[it.quantity.unit]}. Prueba otras palabras.`,`No results in ${u[it.quantity.unit]}.`,'无结果。'),list,'budget-ref-empty');return;}
   for(const r of found){const p=r.prices.find(x=>x.index===baseColumn)||r.prices[0];const li=el('li',undefined,list);el('strong',r.code,li);el('span',` ${r.description} · ${eur(p.value)}/${u[r.unit]}`,li);
    const use=btn(tx('Usar este precio','Use this price','使用此价格'),li,'btn budget-small');use.dataset.code=r.code;use.onclick=()=>{try{apply(b=>Bridge.setPriceFromQuote(b,it.id,X.quote(base,r.code,baseColumn)));openRef=null;draw(`${it.id}|price`);say(tx('Precio de referencia aplicado, sin revisar.','Reference price applied, not reviewed.','已应用参考价格。'));}catch(e){say(e.message);}};
    const keep=btn(tx('Sólo como referencia','Reference only','仅作参考'),li,'btn budget-small');keep.onclick=()=>{try{apply(b=>Bridge.setPriceReferenceFromQuote(b,it.id,X.quote(base,r.code,baseColumn)));openRef=null;draw(`${it.id}|ref`);}catch(e){say(e.message);}};}};
  q.oninput=show;show();}
 function download(blob,name){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),4000);}
 function summary(){try{const r=load();return B.calculateBudget(r.budget);}catch{return null;}}
 window.FloorPlanBudgetUI={open,summary,get budget(){return state?.budget||null;}};
})();
