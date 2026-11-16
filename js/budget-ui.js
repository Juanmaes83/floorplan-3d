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
  // XR-01: label of an item whose unit changed while it carried a price (budget-draft-core keeps the old unit and price).
  unitConflict:(from,to)=>{const n=u=>({unit:tx('ud','pcs','件'),m2:'m²',m:'m'})[u]||u;return tx(`La unidad ha cambiado (${n(from)} → ${n(to)}): se conserva tu precio por ${n(from)} con su origen y la cantidad queda pendiente. Revisa la partida o quita el precio para usar la nueva unidad`,`The unit changed (${n(from)} → ${n(to)}): your price per ${n(from)} is kept with its source and the quantity stays pending. Review the item or remove the price to use the new unit`,`单位已变更（${n(from)} → ${n(to)}）：保留按 ${n(from)} 的价格及其来源，数量待定。请审核该条目或移除价格以使用新单位`);},
  chapters:{floors:tx('Pavimentos y rodapiés','Floors and skirting','地面与踢脚'),walls:tx('Acabados de paredes','Wall finishes','墙面'),partitions:tx('Tabiquería','Partitions','隔墙'),carpentry:tx('Carpintería','Doors and windows','门窗')}});
 const slug=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^\w]+/g,'-').replace(/^-|-$/g,'').toLowerCase().slice(0,50)||'proyecto';
 let state=null,returnFocus=null,base=null,baseColumn=0,openRef=null;
 const X=window.FloorPlanBc3Budget,Bridge=window.FloorPlanBudgetCostBridge;
 function apply(fn){state.budget=B.validateBudget(fn(state.budget));save();}
 // Current budget of the open project, rebuilt over the project quantities (keeps prices, waste and valid reviews).
 // `over` (CON-03): a validated budget to draft over INSTEAD of the saved one — the import preview; nothing is saved here.
 function load(over=null){const saved=read(BUDGETS)[app.project.id]||null;let previous=null;try{previous=over||(saved?B.parseBudget(JSON.stringify(saved)):null);}catch{previous=null;}
  // CAT-04: products placed from «Mis catálogos» enter THIS document (same draft, same calculation), never a parallel one.
  // CAT-04 fail-closed (audit #237): if the reconciliation fails, or the module is missing while the saved budget has
  // catalogue items, those items are kept EXACTLY as saved (price, reference, review) and nothing is saved automatically;
  // Presupuestar shows the error. The draft never drops a confirmed catalogue price silently.
  let catalog=null,catalogError=null;try{catalog=window.RubikCat04?.extraLines?.(app.project,previous)||null;}catch(e){console.warn('[Presupuesto] catálogo:',e?.message||e);catalog=null;catalogError='reconcile-failed';}
  const isCat=id=>{try{const f=window.RubikCatalogBudget?.isCatalogItem;return f?f(id):/^cat:/.test(id);}catch{return /^cat:/.test(id);}};
  const prevCat=(previous?.items||[]).filter(i=>isCat(i.id));
  if(!catalog&&prevCat.length){catalogError=catalogError||'module-unavailable';
   catalog={lines:prevCat.map(i=>({key:i.id,chapter:i.chapterId,description:i.description,quantity:i.quantity,waste:i.wastePercent})),chapters:(previous.chapters||[]).filter(c=>prevCat.some(i=>i.chapterId===c.id)).map(c=>({id:c.id,title:c.title})),report:[],orphans:[],preserved:true};}
  const r=D.draft(app.project,{previous,tariff:read(TARIFF),name:local,labels:labels(),...(catalog?{extraLines:catalog.lines,extraChapters:catalog.chapters}:{})});return {...r,savedBefore:!!previous,catalog,catalogError};}
 // CON-02: names of the OTHER local projects (single projects or building levels) stored with the open project's id. Read-only.
 function sharedWith(){try{const lib=JSON.parse(localStorage.getItem('rubik-sota-project-library-v1')),pid=app.project.id,me=app.entryId;
  return (lib?.entries||[]).filter(e=>e.id!==me&&(e.kind==='building'?(e.building?.levels||[]).some(l=>l.project?.id===pid):e.project?.id===pid)).map(e=>local(String(e.name||'')).slice(0,60));}catch{return [];}}
 function save(){const all=read(BUDGETS);all[app.project.id]=JSON.parse(B.serializeBudget(state.budget));if(!write(BUDGETS,all))say(tx('No se pudo guardar el presupuesto en este navegador.','The budget could not be saved in this browser.','无法保存预算。'));}
 function say(m){const s=dialog.querySelector('#budgetStatus');if(s)s.textContent=m;}
 // D-04: a hand-made price change is also written to the project's price history (same record as reference prices).
 function logManualPrice(it,prev,revB){try{const Ctx=window.FloorPlanConstructionContext,now=state.budget.items.find(x=>x.id===it.id)?.unitPrice??null;if(!Ctx?.store||prev===now)return;
  const revA=window.FloorPlanCostCatalog?.revisionTag?.(state.budget)||null,pid=app.project.id;
  Ctx.snapshot().then(snap=>{if(snap?.entry&&snap.subject)Ctx.store().addPriceChange(snap.entry.id,snap.subject,pid,{label:now===null?'Precio retirado a mano':'Precio propio cambiado a mano',itemId:it.id,description:it.description,as:'manual',before:{unitPrice:prev},after:{unitPrice:now},code:null,source:'manual',revBefore:revB,revAfter:revA});}).catch(e=>console.warn('[Presupuesto] historial de precios:',e?.message||e));}catch(e){console.warn('[Presupuesto] historial de precios:',e?.message||e);}}
 function setItem(id,fn){const i=state.budget.items.findIndex(x=>x.id===id);const next={...state.budget,items:state.budget.items.slice()};next.items[i]=fn(next.items[i]);state.budget=B.validateBudget(next);save();}
 const dialog=el('dialog',undefined,document.body,'ai-render-dialog budget-dialog');dialog.id='budgetDialog';dialog.setAttribute('aria-labelledby','budgetTitle');
 dialog.addEventListener('close',()=>returnFocus?.focus?.({preventScroll:true}));
 function open(){returnFocus=document.activeElement;pendingImport=null;state=load();if(!state.catalogError)save();draw();dialog.showModal();dialog.querySelector('#budgetTitle')?.focus();}
 function draw(focusId=null){
  const c=B.calculateBudget(state.budget),st=STATUS(),u=UNIT(),lines=new Map(c.lines.map(l=>[l.id,l])),scroll=dialog.scrollTop;dialog.replaceChildren();
  const head=el('div',undefined,dialog,'ai-render-head');const h=el('h2',tx('Presupuesto','Budget','预算'),head);h.id='budgetTitle';h.tabIndex=-1;
  const close=btn(tx('Cerrar','Close','关闭'),head);close.id='budgetClose';close.onclick=()=>dialog.close();
  if(state.catalogError){const e=el('p',tx('No se han podido conciliar los productos de «Mis catálogos». Se muestran las partidas de catálogo tal como estaban guardadas y no se ha guardado nada automáticamente: tus precios, referencias y revisiones se conservan. Si editas algo, se guardará con estas partidas.','The products from «My catalogues» could not be reconciled. Catalogue items are shown as they were saved and nothing has been saved automatically: your prices, references and reviews are kept. If you edit something, it will be saved with these items.','无法核对“我的目录”中的产品。目录条目按已保存的状态显示，未自动保存任何内容：您的价格、参考和审核均保留。如有编辑，将连同这些条目一起保存。'),dialog,'budget-warn');e.id='cat04ReconcileError';e.setAttribute('role','alert');e.dataset.reason=state.catalogError;}
  el('p',tx('Las cantidades salen del proyecto (con su estado); los precios son sólo tuyos y ninguno se da por revisado hasta que lo marcas. Rubik no certifica el coste real. Si cambias el proyecto, al volver a abrir se actualizan las cantidades y se conservan tus precios.','Quantities come from the project (with their status); prices are only yours and none counts as reviewed until you mark it. Rubik does not certify actual cost. If you change the project, reopening updates quantities and keeps your prices.','数量来自项目；价格只由您填写，标记前均未审核。'),dialog,'ai-render-note').id='budgetNote';
  // CON-02: this document is keyed by project.id, and a project file imported where that id already exists keeps its id
  // (client review by file depends on it), so both local projects read and write THIS budget. Never silent: say it.
  const twins=sharedWith();if(twins.length){const w=el('p',tx(`Este presupuesto está compartido con ${twins.length===1?'otro proyecto local':twins.length+' proyectos locales'} que ${twins.length===1?'es copia':'son copias'} del mismo archivo (${twins.map(n=>'«'+n+'»').join(', ')}): lo que cambies aquí cambia también allí. Para un presupuesto independiente usa «Duplicar» en Proyectos.`,`This budget is shared with ${twins.length===1?'another local project':twins.length+' local projects'} copied from the same file (${twins.map(n=>'«'+n+'»').join(', ')}): what you change here changes there too. For an independent budget use «Duplicate» in Projects.`,`此预算与来自同一文件的 ${twins.length} 个本地项目共享（${twins.map(n=>'«'+n+'»').join('、')}）：此处的更改也会影响它们。如需独立预算，请在“项目”中使用“复制”。`),dialog,'budget-warn');w.id='budgetSharedProject';w.setAttribute('role','alert');w.dataset.count=String(twins.length);}
  // XR-01: a priced item whose unit changed keeps its old unit and price, without amount, until the professional decides.
  if(state.unitConflicts?.length)el('p',tx(`${state.unitConflicts.length} partida(s) con precio han cambiado de unidad: no se convierte ningún precio (por ejemplo €/m² en €/ud). Se conserva tu precio con su unidad y su origen, sin importe, hasta que lo revises o lo quites.`,`${state.unitConflicts.length} priced item(s) changed unit: no price is converted (e.g. €/m² into €/pcs). Your price is kept with its unit and source, without amount, until you review or remove it.`,`${state.unitConflicts.length} 个有价格的条目单位已变更：不会换算任何价格（例如 €/m² 换成 €/件）。保留价格及其单位和来源，不计金额，直至您审核或移除。`),dialog,'budget-warn').id='budgetUnitConflict';
  if(state.reviewInvalidated.length)el('p',tx(`La cantidad de ${state.reviewInvalidated.length} partida(s) ha cambiado desde tu revisión: revísalas de nuevo.`,`The quantity of ${state.reviewInvalidated.length} item(s) changed since your review: review them again.`,'部分条目数量已变化，请重新审核。'),dialog,'budget-warn').id='budgetInvalidated';
  const bar=el('div',undefined,dialog,'budget-bar');const vl=el('label',undefined,bar);el('span',tx('IVA','VAT','增值税'),vl);const vat=el('select',undefined,vl);vat.id='budgetVat';
  for(const [v,t] of [['21','21 %'],['10',tx('10 % (reforma de vivienda)','10 % (home renovation)','10 %')],['4','4 %'],['0','0 %'],['',tx('Sin IVA indicado','No VAT set','未设置')]]){const o=el('option',t,vat);o.value=v;}
  vat.value=state.budget.taxRatePercent===null?'':String(state.budget.taxRatePercent);vat.onchange=()=>{state.budget=B.validateBudget({...state.budget,taxRatePercent:vat.value===''?null:+vat.value});save();draw('budgetVat');};
  for(const ch of state.budget.chapters){const items=state.budget.items.filter(i=>i.chapterId===ch.id);const wrap=el('div',undefined,dialog,'quantity-table-wrap');const t=el('table',undefined,wrap,'quantity-table budget-table');t.dataset.chapter=ch.id;el('caption',ch.title,t);
   const hr=el('tr',undefined,el('thead',undefined,t));for(const x of [tx('Partida','Item','条目'),tx('Cantidad','Quantity','数量'),tx('Merma %','Waste %','损耗 %'),tx('Precio unitario (€ por la unidad de la partida)','Unit price (€ per the item unit)','单价（€/条目单位）'),tx('Subtotal','Subtotal','小计'),tx('Revisado','Reviewed','已审核')])el('th',x,hr).scope='col';
   const tb=el('tbody',undefined,t);
   for(const it of items){const l=lines.get(it.id),tr=el('tr',undefined,tb);tr.dataset.item=it.id;const th=el('th',it.description,tr);th.scope='row';
    if(it.priceSource)el('small',it.priceSource.type==='provider-reference'?tx('Precio de referencia','Reference price','参考价格')+` · ${it.priceReference?.source?.label||''} ${it.priceReference?.code||''}`:it.priceSource.label,th,'budget-source');
    if(it.priceReference&&it.priceSource?.type!=='provider-reference')el('small',`${tx('Ref.','Ref.','参考')} ${it.priceReference.code||''}: ${eur(it.priceReference.unitPrice)}/${u[it.priceReference.unit]} · ${it.priceReference.source.label}`,th,'budget-source budget-ref');
    if(base&&X&&Bridge){const rb=btn(openRef===it.id?tx('Cerrar búsqueda','Close search','关闭'):tx('Buscar referencia','Find reference','查找参考'),th,'btn budget-small');rb.dataset.field='ref';rb.onclick=()=>{openRef=openRef===it.id?null:it.id;draw(`${it.id}|${openRef?'refq':'ref'}`);};}
    el('td',`${num(it.quantity.value)} ${u[it.quantity.unit]} · ${st[it.quantity.status]}${it.quantity.complete?'':' ⚠'}`,tr,'is-num').dataset.label=tx('Cantidad','Quantity','数量');
    const wt=el('td',undefined,tr);wt.dataset.label=tx('Merma %','Waste %','损耗 %');const w=el('input',undefined,wt);w.type='number';w.min='0';w.max='100';w.step='1';w.value=String(it.wastePercent);w.className='budget-input';w.setAttribute('aria-label',tx(`Merma de ${it.description}`,`Waste of ${it.description}`,'损耗'));w.dataset.field='waste';
    w.onchange=()=>{const v=Number(w.value);if(!(v>=0&&v<=100)){w.value=String(it.wastePercent);return;}setItem(it.id,x=>({...x,wastePercent:v}));draw(`${it.id}|waste`);};
    const pt=el('td',undefined,tr);pt.dataset.label=tx(`Precio €/${u[it.quantity.unit]}`,`Price €/${u[it.quantity.unit]}`,`单价 €/${u[it.quantity.unit]}`);pt.dataset.unit=it.quantity.unit;const p=el('input',undefined,pt);p.type='number';p.min='0';p.step='0.01';p.inputMode='decimal';p.value=it.unitPrice===null?'':String(it.unitPrice);p.placeholder=tx('sin precio','no price','无价格');p.className='budget-input';p.setAttribute('aria-label',tx(`Precio de ${it.description} en € por ${u[it.quantity.unit]}`,`Price of ${it.description} in € per ${u[it.quantity.unit]}`,`单价（€/${u[it.quantity.unit]}）`));p.dataset.field='price';const pu=el('span',`€/${u[it.quantity.unit]}`,pt,'budget-unit');pu.dataset.field='priceUnit';
    p.onchange=()=>{const raw=p.value.trim(),prev=it.unitPrice,revB=window.FloorPlanCostCatalog?.revisionTag?.(state.budget)||null;if(raw===''){setItem(it.id,x=>B.clearPrice(x));}else{const v=Math.round(Number(raw)*100)/100;if(!(v>=0)){p.value=it.unitPrice===null?'':String(it.unitPrice);return;}setItem(it.id,x=>B.setManualPrice(x,{unitPrice:v,label:tx('Precio propio','Own price','自有价格')}));}logManualPrice(it,prev,revB);draw(`${it.id}|price`);};
    el('td',eur(l.subtotalNet),tr,'is-num').dataset.label=tx('Subtotal','Subtotal','小计');
    const rt=el('td',undefined,tr);rt.dataset.label=tx('Revisado','Reviewed','已审核');const r=el('input',undefined,rt);r.type='checkbox';r.checked=it.review.status==='reviewed';r.disabled=it.unitPrice===null;r.setAttribute('aria-label',tx(`Precio de ${it.description} revisado`,`${it.description} price reviewed`,'已审核'));r.dataset.field='review';
    r.onchange=()=>{setItem(it.id,x=>r.checked?B.markReviewed(x,{reviewedAt:new Date().toISOString()}):B.setManualPrice(x,{unitPrice:x.unitPrice,label:x.priceSource?.label||tx('Precio propio','Own price','自有价格'),asOf:x.priceSource?.asOf||null}));draw(`${it.id}|review`);};
    // M2 (FT3D-8 S4): optional, read-only decoration of the row (linked tasks/elements of the construction plan).
    try{window.FloorPlanBudgetLinks?.decorate?.(th,it.id);}catch{}
    try{window.RubikCat04?.decorateRow?.(th,it,state);}catch(e){console.warn('[Presupuesto] CAT-04:',e?.message||e);}
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
  fact(tx('Base imponible','Net','净额'),eur(c.totals.net.amount));fact(tx('IVA','VAT','增值税'),c.taxRatePercent===null&&!c.lines.some(l=>l.effectiveTaxRatePercent!==null)?'—':eur(c.totals.tax.amount));const nu=c.totals.unpricedItemIds.length,nq=c.totals.unavailableQuantityItemIds.length,ntxN=c.lines.filter(l=>l.effectiveTaxRatePercent===null).length,ntx=ntxN>0;fact(!c.totals.gross.complete?tx(`Total parcial (${[nu?`${nu} sin precio`:'',nq?`${nq} con cantidad pendiente`:'',ntx?(ntxN<c.lines.length?`${ntxN} sin IVA`:'IVA sin definir'):''].filter(Boolean).join(' · ')||'datos incompletos'})`,`Partial total (${[nu?`${nu} unpriced`:'',nq?`${nq} quantity pending`:'',ntx?(ntxN<c.lines.length?`${ntxN} without VAT`:'VAT not set'):''].filter(Boolean).join(' · ')||'incomplete data'})`,'部分合计'):tx('Total','Total','合计'),eur(c.totals.gross.amount));
  const warn=el('ul',undefined,dialog,'budget-warnings');warn.id='budgetWarnings';
  if(c.totals.unpricedItemIds.length)el('li',tx(`${c.totals.unpricedItemIds.length} ${c.totals.unpricedItemIds.length===1?'partida':'partidas'} sin precio: el total no está completo.`,`${c.totals.unpricedItemIds.length} items without price: the total is not complete.`,'部分条目无价格，合计不完整。'),warn);
  if(c.totals.unreviewedPriceItemIds.length)el('li',tx(`${c.totals.unreviewedPriceItemIds.length} ${c.totals.unreviewedPriceItemIds.length===1?'precio':'precios'} sin revisar.`,`${c.totals.unreviewedPriceItemIds.length} prices not reviewed.`,'部分价格未审核。'),warn);
  // F8: VAT judged per line (an item's own rate overrides the budget's). Warn only when some line has no applicable rate.
  if(c.taxRatePercent===null&&ntxN===c.lines.length)el('li',tx('No has indicado el IVA.','You have not set the VAT.','未设置增值税。'),warn);
  else if(ntx)el('li',tx(`${ntxN} ${ntxN===1?'partida':'partidas'} sin IVA aplicable (ni propio ni general): sus impuestos no se pueden calcular.`,`${ntxN} ${ntxN===1?'item':'items'} without an applicable VAT (no item rate nor a budget rate): their tax cannot be computed.`,`${ntxN} 个条目没有适用的增值税（既无条目税率也无总税率）：无法计算其税额。`),warn);
  // F6: geometric quantities measured only in part ≠ commercial quantities pending measurement (catalogue items priced per
  // m or m²) ≠ plan quantities not available at all. Each one is told apart; none of them is a zero.
  const catIt=id=>/^cat:/.test(id),un=c.totals.unavailableQuantityItemIds,geoPartial=c.totals.incompleteQuantityItemIds.filter(id=>!un.includes(id)),comPending=un.filter(catIt),geoMissing=un.filter(id=>!catIt(id));
  if(geoPartial.length){const li=el('li',tx(`${geoPartial.length} ${geoPartial.length===1?'cantidad del plano parcial':'cantidades del plano parciales'} (⚠): parte de la geometría no se pudo medir; el importe usa lo medido.`,`${geoPartial.length} partial plan quantit${geoPartial.length===1?'y':'ies'} (⚠): part of the geometry could not be measured; the amount uses what was measured.`,`${geoPartial.length} 个图纸数量不完整（⚠）。`),warn);li.dataset.kind='geometric-partial';}
  if(geoMissing.length){const li=el('li',tx(`${geoMissing.length} ${geoMissing.length===1?'cantidad del plano no disponible':'cantidades del plano no disponibles'}: sin importe hasta medirlas.`,`${geoMissing.length} plan quantit${geoMissing.length===1?'y':'ies'} not available: no amount until measured.`,`${geoMissing.length} 个图纸数量不可用。`),warn);li.dataset.kind='geometric-missing';}
  if(comPending.length){const li=el('li',tx(`${comPending.length} ${comPending.length===1?'partida comercial':'partidas comerciales'} de «Mis catálogos» con la cantidad pendiente de medición: sin importe hasta indicar la cantidad en su unidad.`,`${comPending.length} commercial item${comPending.length===1?'':'s'} from «My catalogues» with the quantity pending measurement: no amount until the quantity is set in its unit.`,`${comPending.length} 个“我的目录”商业条目数量待测量。`),warn);li.dataset.kind='commercial-pending';}
  if(!warn.children.length)el('li',tx('Todas las partidas tienen precio revisado.','Every item has a reviewed price.','所有条目均已审核。'),warn,'is-ok');
  try{window.RubikCat04?.budgetSections?.(dialog,state);}catch(e){console.warn('[Presupuesto] CAT-04:',e?.message||e);}
  const row=el('div',undefined,dialog,'tour-video-actions');
  const keep=btn(tx('Guardar mis precios en la tarifa del estudio','Save my prices to the studio tariff','保存到工作室价目'),row);keep.id='budgetTariff';
  keep.onclick=()=>{const tariff=read(TARIFF);let n=0;for(const it of state.budget.items)if(it.unitPrice!==null&&state.tariffKeys[it.id]){tariff[state.tariffKeys[it.id]]={unitPrice:it.unitPrice,asOf:new Date().toISOString().slice(0,10)};n++;}write(TARIFF,tariff);say(tx(`${n} precios guardados en tu tarifa: se propondrán (sin revisar) en tus próximos presupuestos.`,`${n} prices saved to your tariff.`,`已保存 ${n} 个价格。`));};
  const csv=btn(tx('Descargar presupuesto (CSV)','Download budget (CSV)','下载预算 (CSV)'),row,'btn primary');csv.id='budgetCsv';
  csv.onclick=()=>download(new Blob([P.toCsv(state.budget,{delimiter:';',bom:true})],{type:'text/csv;charset=utf-8'}),`rubik-sota-presupuesto-${slug(local(app.project.name))}.csv`);
  const js=btn(tx('Descargar presupuesto (JSON)','Download budget (JSON)','下载预算 (JSON)'),row);js.id='budgetJson';
  js.onclick=()=>download(new Blob([B.serializeBudget(state.budget)],{type:'application/json'}),`rubik-sota-presupuesto-${slug(local(app.project.name))}.json`);
  // CON-03: the reader of that same JSON. Preview first; the budget only changes on «Importar» (same document, same draft).
  const imp=btn(tx('Importar presupuesto (JSON)…','Import budget (JSON)…','导入预算 (JSON)…'),row);imp.id='budgetImport';const impFile=el('input',undefined,row);impFile.type='file';impFile.id='budgetImportFile';impFile.accept='.json,application/json';impFile.hidden=true;
  imp.onclick=()=>impFile.click();impFile.onchange=()=>{const f=impFile.files[0];impFile.value='';if(f)importFile(f);};
  if(state.catalogError)imp.disabled=true;
  if(pendingImport)importPreview();
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
 /* CON-03 · «Importar presupuesto (JSON)»: the file Presupuestar itself downloads. It is validated as FloorPlanBudgetV1,
    drafted over the OPEN project (quantities always from the project; prices, waste, VAT and references by item id) and
    shown as a preview with what is applied, what is not and what it replaces. Nothing is saved until «Importar»; a
    file of another project needs an explicit tick and comes without any review. */
 let pendingImport=null;
 async function importFile(file){pendingImport=null;
  try{if(file.size>2*1024*1024)throw Error(tx('El archivo supera 2 MB.','The file exceeds 2 MB.','文件超过 2 MB。'));
   let incoming;try{incoming=B.parseBudget(await file.text());}catch(e){throw Error(tx('No es un presupuesto de RUBIK válido: ','Not a valid RUBIK budget: ','不是有效的 RUBIK 预算：')+(e?.message||e));}
   const pid=app.project.id,a=D.adopt(incoming,app.project),r=load(a.previous);
   if(r.catalogError)throw Error(tx('No se han podido conciliar los productos de «Mis catálogos»: no se importa nada.','The products from «My catalogues» could not be reconciled: nothing is imported.','无法核对目录产品：未导入。'));
   pendingImport={name:file.name,pid,sameSubject:a.sameSubject,sourceSubjectId:a.sourceSubjectId,result:r,base:B.serializeBudget(state.budget),summary:D.importSummary(state.budget,a.previous,r.budget)};draw('budgetImportConfirm');dialog.querySelector('#budgetImportPreview')?.scrollIntoView({block:'center'});
  }catch(e){draw('budgetImport');say(tx('Importación rechazada: ','Import rejected: ','导入被拒绝：')+(e?.message||e));}}
 function importPreview(){const p=pendingImport,s=p.summary,box=el('section',undefined,dialog,'budget-warn');box.id='budgetImportPreview';box.setAttribute('role','group');box.dataset.sameSubject=String(p.sameSubject);
  for(const k of ['applied','withoutObjects','notInProject','notCarried','replaced','removed','ownVat'])box.dataset[k]=String(s[k].length);
  const vatT=v=>v===null?tx('sin IVA indicado','no VAT set','未设置'):num(v,0)+' %',tot=t=>!t?'—':t.net===null?tx('sin importe','no amount','无金额'):`${eur(t.net)} ${tx('sin IVA','excl. VAT','不含税')}${t.netComplete?'':tx(' · parcial',' · partial',' · 部分')}`;
  el('h3',tx(`Vista previa de la importación · ${p.name}`,`Import preview · ${p.name}`,`导入预览 · ${p.name}`),box);const ul=el('ul',undefined,box);
  el('li',tx(`${s.applied.length} precio(s) del archivo se aplican a partidas de este proyecto. Las cantidades salen siempre del proyecto abierto, no del archivo.`,`${s.applied.length} price(s) of the file apply to items of this project. Quantities always come from the open project, not from the file.`,`文件中的 ${s.applied.length} 个价格将应用于本项目条目。数量始终来自当前项目。`),ul);
  if(s.notInProject.length)el('li',tx(`${s.notInProject.length} partida(s) con precio del archivo no existen en este proyecto: no se importan.`,`${s.notInProject.length} priced item(s) of the file do not exist in this project: not imported.`,`文件中 ${s.notInProject.length} 个有价格的条目在本项目中不存在：不导入。`),ul).dataset.kind='not-in-project';
  if(s.withoutObjects.length)el('li',tx(`${s.withoutObjects.length} partida(s) de «Mis catálogos» del archivo no tienen objetos colocados en este proyecto: entran con 0 ud (0 €) y puedes retirarlas.`,`${s.withoutObjects.length} «My catalogues» item(s) of the file have no objects placed in this project: they come in with 0 pcs (0 €) and can be removed.`,`文件中 ${s.withoutObjects.length} 个目录条目在本项目中没有对象：以 0 件导入，可移除。`),ul).dataset.kind='without-objects';
  if(s.notCarried.length)el('li',tx(`${s.notCarried.length} precio(s) del archivo no se aplican tal cual (su unidad o su referencia no coincide con la partida actual): revísalos tras importar.`,`${s.notCarried.length} price(s) of the file are not applied as they are (unit or reference does not match the current item): check them after importing.`,`文件中 ${s.notCarried.length} 个价格无法原样应用：导入后请检查。`),ul).dataset.kind='not-carried';
  if(s.replaced.length||s.removed.length)el('li',tx(`Tu presupuesto actual cambia: ${s.replaced.length} precio(s) se sustituyen por los del archivo y ${s.removed.length} quedan sin precio.`,`Your current budget changes: ${s.replaced.length} price(s) are replaced by the file's and ${s.removed.length} become unpriced.`,`当前预算将变更：${s.replaced.length} 个价格被替换，${s.removed.length} 个变为无价格。`),ul).dataset.kind='replaces';
  el('li',tx(`IVA: ${vatT(s.vat.before)} → ${vatT(s.vat.after)}${s.ownVat.length?` · ${s.ownVat.length} partida(s) con IVA propio`:''}.`,`VAT: ${vatT(s.vat.before)} → ${vatT(s.vat.after)}${s.ownVat.length?` · ${s.ownVat.length} item(s) with their own VAT`:''}.`,`增值税：${vatT(s.vat.before)} → ${vatT(s.vat.after)}。`),ul).dataset.kind='vat';
  el('li',tx(`Base imponible: ${tot(s.before)} → ${tot(s.after)}.`,`Net total: ${tot(s.before)} → ${tot(s.after)}.`,`税前合计：${tot(s.before)} → ${tot(s.after)}。`),ul).dataset.kind='totals';
  const actions=el('div',undefined,box,'tour-video-actions'),ok=btn(tx('Importar','Import','导入'),actions,'btn primary');ok.id='budgetImportConfirm';
  if(!p.sameSubject){const lab=el('label',undefined,box),chk=el('input',undefined,lab);chk.type='checkbox';chk.id='budgetImportOther';el('span',tx(' Este archivo es el presupuesto de OTRO proyecto. Quiero usar sus precios aquí; todas las partidas entran sin revisar.',' This file is the budget of ANOTHER project. I want to use its prices here; every item comes in unreviewed.',' 此文件是其他项目的预算。我要在此使用其价格；所有条目均为未审核。'),lab);
   ok.disabled=true;chk.onchange=()=>{ok.disabled=!chk.checked;};box.insertBefore(lab,actions);}
  const no=btn(tx('Cancelar','Cancel','取消'),actions);no.id='budgetImportCancel';no.onclick=()=>{pendingImport=null;draw('budgetImport');say(tx('Importación cancelada: el presupuesto no ha cambiado.','Import cancelled: the budget has not changed.','已取消导入：预算未更改。'));};
  ok.onclick=()=>{const q=pendingImport;pendingImport=null;
   // The preview is only valid for the project and the budget it was computed on.
   if(!q||q.pid!==app.project.id||q.base!==B.serializeBudget(state.budget)){draw('budgetImport');say(tx('El presupuesto o el proyecto han cambiado desde la vista previa: vuelve a elegir el archivo.','The budget or the project changed since the preview: choose the file again.','预览后预算或项目已更改：请重新选择文件。'));return;}
   state={...q.result,savedBefore:true};save();draw('budgetImport');say(tx(`Presupuesto importado de ${q.name}: ${q.summary.applied.length} precio(s) aplicados. Revisa las partidas antes de entregarlo.`,`Budget imported from ${q.name}: ${q.summary.applied.length} price(s) applied. Review the items before delivering it.`,`已从 ${q.name} 导入预算：应用了 ${q.summary.applied.length} 个价格。`));};
 }
 function download(blob,name){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),4000);}
 function summary(){try{const r=load();return B.calculateBudget(r.budget);}catch{return null;}}
 // C4: read-only access to the same draft summary() uses, plus whether a budget was ever prepared. Never saves.
 function current(){try{const r=load();return {budget:r.budget,saved:r.savedBefore};}catch{return null;}}
 // M2 (FT3D-8 S4): the single write path for other Presupuestar tools (reference prices). Same storage and validation
 // as this dialog; only the open project's own budget is accepted (identity by subject id, never by name).
 function commit(budget){const b=B.validateBudget(budget);if(b.subject.type!=='project'||b.subject.id!==app.project.id)throw Error(tx('El presupuesto pertenece a otro proyecto: no se guarda.','The budget belongs to another project: not saved.','预算属于其他项目。'));
  const all=read(BUDGETS);all[app.project.id]=JSON.parse(B.serializeBudget(b));if(!write(BUDGETS,all))throw Error(tx('No se pudo guardar el presupuesto en este navegador.','The budget could not be saved in this browser.','无法保存预算。'));if(state)state.budget=b;return b;}
 // CAT-04: redraw the open dialog from the saved document (after «Precios de referencia» or a catalogue action).
 function refresh(){if(!dialog.open)return;const keep=dialog.scrollTop;pendingImport=null;state=load();if(!state.catalogError)save();draw();dialog.scrollTop=keep;}
 window.FloorPlanBudgetUI={open,summary,current,commit,refresh,get budget(){return state?.budget||null;}};
})();
