/* CAT-04 · integración en el editor real: «Mis catálogos» → «Presupuestar» → «Asistente», con las referencias del
   «Estudio de imágenes». No hay otro motor ni otra calculadora: lee y escribe a través de lo que ya existe.
   - Presupuestar: FloorPlanBudgetUI.load() pide aquí las líneas de los productos colocados (RubikCatalogBudget) y
     las mete en SU documento (rubik-budget-v1[projectId]); importes = FloorPlanBudget.calculateBudget().
   - Precio de la ficha: solo como referencia. Se consulta, se guarda o se aplica en «Precios de referencia» (S2:
     FloorPlanCostCatalog.previewApply → apply con confirmación, consentimiento y control de revisión).
   - Referencias visuales: «Vincular al proyecto» en el Estudio guarda metadatos y huellas (RubikVisualReferences) en el
     proyecto, con un paso de deshacer; Presupuestar las muestra sin importe.
   - El Asistente lee window.RubikCat04.assistantContext() (solo lectura).
   Piloto local: los catálogos viven en este navegador por estudio; no es control de acceso multiempresa (GOV-06a). */
(function(){
 'use strict';
 const app=window.FloorPlanApp,CB=window.RubikCatalogBudget,CP=window.RubikCatalogProduct,P=window.RubikCatalogPlacement,B=window.FloorPlanBudget,VR=window.RubikVisualReferences;
 if(!app||!CB||!CP||!P||!B)return;
 const lang=()=>['es','en','zh'].includes(typeof LANG==='string'?LANG:'es')?LANG:'es';
 const tx=(es,en,zh)=>({es,en,zh})[lang()]||es;
 const el=(tag,text,parent,cls)=>{const n=document.createElement(tag);if(text!==undefined&&text!==null)n.textContent=text;if(cls)n.className=cls;parent?.append(n);return n;};
 const btn=(text,parent,cls='btn')=>{const b=el('button',text,parent,cls);b.type='button';return b;};
 const loc=()=>lang()==='en'?'en-GB':lang()==='zh'?'zh-CN':'es-ES';
 const eur=v=>v===null||v===undefined?'—':v.toLocaleString(loc(),{style:'currency',currency:'EUR'});
 const storage=(()=>{try{const s=window.localStorage;s.getItem('x');return s;}catch{return {getItem:()=>null,setItem(){},removeItem(){}};}})();
 const studioId=()=>window.RubikCatalogUI?.studioId||'local';
 const catalogs=()=>{try{return CP.loadCatalogs(storage,studioId());}catch{return [];}};
 const chapterTitle=()=>tx('Productos de mi estudio','Products from my studio','我的工作室产品');

 /* ---------- Presupuestar: the lines and the facts behind them ---------- */
 function extraLines(project,previous){const r=CB.reconcile(project,catalogs(),{studioId:studioId(),previous,lang:lang()});
  return {lines:r.lines,chapters:r.lines.length?[{id:CB.CHAPTER,title:chapterTitle()}]:[],report:r.report,orphans:r.orphans};}
 // The budget Presupuestar shows, with the catalogue facts (same document, same calculation). Never saves.
 function summary(){const cur=window.FloorPlanBudgetUI?.current?.();if(!cur?.budget)return null;
  const r=CB.reconcile(app.project,catalogs(),{studioId:studioId(),previous:cur.budget,lang:lang()}),calc=B.calculateBudget(cur.budget),st=CB.states(cur.budget,r.report);
  const lines=new Map(calc.lines.map(l=>[l.id,l])),chapter=calc.chapters.find(c=>c.id===CB.CHAPTER)||null;
  return {budget:cur.budget,saved:!!cur.saved,calc,chapter,orphans:r.orphans,studioId:studioId(),
   items:r.report.map((x,i)=>({...x,...st[i],line:lines.get(x.itemId)||null,budgetItem:cur.budget.items.find(it=>it.id===x.itemId)||null}))};}
 const STATE=()=>({
  'sheet-price-available':tx('Precio de ficha disponible como referencia (sin aplicar)','Sheet price available as a reference (not applied)','资料价格可作参考（未应用）'),
  'reference-kept':tx('Referencia de ficha guardada (sin aplicar)','Sheet reference kept (not applied)','已保存资料参考（未应用）'),
  'applied-unreviewed':tx('Precio de ficha aplicado · pendiente de tu revisión','Sheet price applied · pending your review','已应用资料价格 · 待审核'),
  reviewed:tx('Precio revisado por ti','Price reviewed by you','价格已由您审核'),
  stale:tx('La ficha ha cambiado: tu precio NO se ha sustituido','The sheet changed: your price was NOT replaced','资料已变更：您的价格未被替换'),
  'unknown-price':tx('La ficha no tiene precio: queda sin precio (no es 0 €)','The sheet has no price: it stays unpriced (not 0 €)','资料无价格：保持无价格（不是 0 €）'),
  'sheet-unavailable':tx('Ficha no disponible en Mis catálogos','Sheet not available in My catalogues','“我的目录”中无此资料'),
  'other-studio':tx('Ficha de otro estudio: no se usa aquí','Sheet of another studio: not used here','其他工作室的资料：此处不使用'),
  ambiguous:tx('SKU ambiguo: elige la ficha','Ambiguous SKU: choose the sheet','SKU 不明确：请选择资料'),
  'other-price':tx('Precio propio o de otra fuente (no de la ficha)','Own price or from another source (not the sheet)','自有或其他来源价格（非资料）'),
  'unit-conflict':tx('Conflicto de unidad: la ficha se vende ahora por otra unidad; tu precio se conserva con su unidad y sin importe','Unit conflict: the sheet is now sold in another unit; your price is kept with its unit and no amount','单位冲突：资料现按其他单位销售；保留您的价格及其单位，无金额'),
  missing:tx('No está en el presupuesto','Not in the budget','不在预算中')});
 const stateText=s=>STATE()[s]||s;
 // Row decoration in Presupuestar (catalogue items only): identity, count, price state and the explicit action.
 function decorateRow(th,it,state){
  if(!CB.isCatalogItem(it.id))return;const rep=state?.catalog?.report?.find(r=>r.itemId===it.id);if(!rep)return;
  const st=CB.states(state.budget,[rep])[0],box=el('small',undefined,th,'budget-source cat04-row');box.dataset.state=st.state;box.dataset.sku=rep.sku||'';box.dataset.quantityStatus=rep.quantityStatus;
  const what=rep.retired?tx('Sin objetos colocados (0 ud)','No placed objects (0 pcs)','无已放置对象（0 件）')
   :it.unitPrice!==null&&it.quantity?.unit!==rep.unit?tx(`Unidad cambiada (${it.quantity.unit} → ${rep.unit}): precio conservado sin importe; revisa o quita el precio`,`Unit changed (${it.quantity.unit} → ${rep.unit}): price kept without amount; review or remove the price`,`单位已变更（${it.quantity.unit} → ${rep.unit}）：保留价格不计金额；请审核或移除价格`)
   :rep.quantityStatus==='unit-from-history'?tx(`Ficha no disponible: se conserva la unidad ${rep.rawUnit} y la cantidad queda pendiente`,`Sheet unavailable: the unit ${rep.rawUnit} is kept and the quantity stays pending`,`资料不可用：保留单位 ${rep.rawUnit}，数量待定`)
   :rep.quantityStatus==='unit-unverifiable'?tx('Ficha no disponible: unidad no verificable, cantidad pendiente','Sheet unavailable: unit not verifiable, quantity pending','资料不可用：单位无法核实，数量待定')
   :rep.quantityStatus==='pending-measurement'?tx(`Pendiente de medición: la ficha tiene precio por ${rep.rawUnit}`,`Pending measurement: the sheet is priced per ${rep.rawUnit}`,`待测量：资料按 ${rep.rawUnit} 计价`)
   :tx(`${rep.count} objeto(s) en el proyecto`,`${rep.count} object(s) in the project`,`项目中 ${rep.count} 个对象`);
  box.textContent=`${tx('Producto de mi estudio','Product from my studio','我的工作室产品')} · ${rep.sku||''} · ${what} · ${stateText(st.state)}`;
  if(st.sheetPrice&&['sheet-price-available','reference-kept','stale'].includes(st.state)){const d=el('small',undefined,th,'budget-source cat04-sheet');d.dataset.field='sheet';
   d.textContent=`${tx('Ficha','Sheet','资料')}: ${eur(st.sheetPrice.unitPrice)}/${st.sheetPrice.unit} · ${st.sheetPrice.label} · ${tx('verificado','verified','核实于')} ${st.sheetPrice.asOf} · ${st.sheetPrice.edition}${rep.synthetic?' · synthetic-fixture':''}`;}
  if(st.state==='stale'&&st.reference)el('small',`${tx('Tu precio procede de','Your price comes from','您的价格来自')} ${eur(st.reference.unitPrice)} · ${st.reference.edition||''}`,th,'budget-source cat04-stale');
  if(st.sheetGone)el('small',tx('La ficha ya no está disponible: se conserva la referencia guardada como evidencia.','The sheet is no longer available: the saved reference is kept as evidence.','资料已不可用：保留已存参考作为证据。'),th,'budget-source cat04-gone');
  if(rep.versionChanged)el('small',tx('La ficha cambió después de colocar el producto.','The sheet changed after the product was placed.','放置后资料已变更。'),th,'budget-source cat04-version');
  if(st.sheetPrice&&!['other-studio'].includes(st.state)){const b=btn(st.state==='stale'?tx('Ver la ficha nueva y decidir…','See the new sheet and decide…','查看新资料并决定…'):tx('Ver precio de la ficha y decidir…','See the sheet price and decide…','查看资料价格并决定…'),th,'btn budget-small cat04-price');b.dataset.field='catalogPrice';b.dataset.item=it.id;
   b.onclick=()=>window.FloorPlanReferencePricesUI?.open({itemId:it.id});}
  if(rep.retired){const b=btn(tx('Retirar partida','Remove item','移除条目'),th,'btn budget-small cat04-retire');b.dataset.field='retire';
   b.onclick=()=>{try{const next={...state.budget,items:state.budget.items.filter(x=>x.id!==it.id)};next.chapters=next.chapters.filter(c=>next.items.some(x=>x.chapterId===c.id));window.FloorPlanBudgetUI.commit(next);window.FloorPlanBudgetUI.refresh?.();}catch(e){console.warn('[CAT-04]',e?.message||e);}};}
 }
 /* ---------- Referencias visuales (Presupuestar) ---------- */
 const VSTATE=()=>({verified:tx('verificada (solo la huella visual: no certifica el producto ni la ficha comercial)','verified (visual fingerprint only: it does not certify the product or the commercial sheet)','已验证（仅视觉指纹，不认证产品或商业资料）'),unverifiable:tx('no se puede verificar (huella distinta)','cannot be verified (hash differs)','无法验证'),'other-project':tx('de otro proyecto','from another project','属于其他项目')});
 const DEC=()=>({accepted:tx('aceptada en la revisión','accepted in the review','审核已接受'),rejected:tx('rechazada','rejected','已拒绝'),discarded:tx('descartada','discarded','已丢弃')});
 function visualRefs(){return VR?VR.list(app.project,{catalogs:catalogs(),studioId:studioId()}):[];}
 function budgetSections(dialog,state){
  // Catalogue summary: what is linked but not countable, orphans, and the rule.
  const cat=state?.catalog;if(cat&&(cat.report.length||cat.orphans.length)){const s=el('section',undefined,dialog,'cat04-section');s.id='cat04Products';el('h3',chapterTitle(),s);
   el('p',tx('Partidas creadas desde los productos colocados en el proyecto. El precio de la ficha es una referencia: no cuenta hasta que lo aplicas y lo revisas. Instalación, transporte, montaje o encimeras necesitan partidas propias.','Items created from the products placed in the project. The sheet price is a reference: it counts only once you apply and review it. Installation, transport, assembly or worktops need their own items.','由项目中已放置产品生成的条目。资料价格仅为参考，应用并审核后才计入。'),s,'ai-render-note');
   if(cat.orphans.length)el('p',tx(`${cat.orphans.length} vínculo(s) de objetos ya borrados: no se cuentan.`,`${cat.orphans.length} link(s) of deleted objects: not counted.`,`${cat.orphans.length} 个已删除对象的关联：不计入。`),s,'budget-warn').id='cat04Orphans';}
  const sec=el('section',undefined,dialog,'cat04-section');sec.id='cat04Visual';el('h3',tx('Referencias visuales del proyecto','Visual references of the project','项目视觉参考'),sec);
  el('p',tx('Propuestas del Estudio de imágenes vinculadas a este proyecto. Son evidencia visual: no son mediciones, ni fichas validadas, ni precios, y no crean partidas.','Image studio proposals linked to this project. They are visual evidence: not measurements, validated sheets or prices, and they create no items.','与本项目关联的图像工作室方案。仅为视觉证据：不是测量、已验证资料或价格，也不生成条目。'),sec,'ai-render-note');
  const refs=visualRefs(),ul=el('ul',undefined,sec,'cat04-visual-list');ul.id='cat04VisualList';
  if(!refs.length)el('li',tx('Todavía no hay referencias visuales vinculadas.','No visual references linked yet.','尚未关联视觉参考。'),ul,'is-empty');
  for(const r of refs){const li=el('li',undefined,ul);li.dataset.hash=r.hash;li.dataset.status=r.status;li.dataset.decision=r.decision||'';li.dataset.kind=r.resultKind||'';
   el('strong',`${r.simulated?tx('SIMULACIÓN','SIMULATION','模拟'):r.resultKind||'—'} · ${DEC()[r.decision]||'—'} · ${VSTATE()[r.status]}`,li);
   el('span',` · ${tx('huella','hash','指纹')} ${r.hash.slice(0,12)}… · ${(r.linkedAt||'').slice(0,10)}`,li);
   if(r.label)el('small',r.label,li,'budget-source');
   for(const x of r.references){const sm=el('small',`${x.sku} · ${x.displayName||''} · rev ${x.catalogRevision} · ${x.placed?tx('colocado en el proyecto','placed in the project','已放入项目'):x.placedStatus==='ambiguous'?tx('colocación no verificable: la referencia no indica el estudio','placement cannot be verified: the reference does not record the studio','无法验证放置：参考未记录工作室'):tx('NO colocado: no se presupuesta','NOT placed: not budgeted','未放置：不计入预算')} · ${x.catalogStatus==='current'?tx('ficha vigente','current sheet','资料有效'):x.catalogStatus==='older-revision'?tx('revisión anterior del catálogo','older catalogue revision','目录旧版本'):x.catalogStatus==='other-studio'?tx('ficha de otro estudio: no se comprueba aquí','sheet of another studio: not checked here','其他工作室的资料：此处不核对'):x.catalogStatus==='studio-unknown'?tx('estudio desconocido: no se comprueba la ficha','unknown studio: the sheet is not checked','工作室未知：不核对资料'):tx('ficha no disponible','sheet not available','资料不可用')} · ${tx('estudio','studio','工作室')} ${x.studioId||tx('desconocido','unknown','未知')}`,li,'budget-source cat04-vref');sm.dataset.sku=x.sku;sm.dataset.placed=String(x.placed);sm.dataset.placedStatus=x.placedStatus||'';sm.dataset.catalogStatus=x.catalogStatus||'';}
   const un=btn(tx('Quitar vínculo','Unlink','取消关联'),li,'btn budget-small');un.dataset.unlink=r.hash;un.onclick=()=>{unlinkVisual(r.hash);window.FloorPlanBudgetUI?.refresh?.();};}
  const row=el('div',undefined,sec,'cat04-actions');const open=btn(tx('Abrir el Estudio de imágenes','Open the Image studio','打开图像工作室'),row);open.id='cat04OpenStudio';
  open.onclick=()=>{returnToBudget=true;dialog.close();window.RubikVisualStudio?.open();};
 }
 let returnToBudget=false;
 /* ---------- Estudio de imágenes: link the reviewed sheet explicitly ---------- */
 function linkVisual(sheet){if(!VR||!sheet)return {ok:false,reason:'no-sheet'};const v=VR.verify(sheet);if(!v.ok)return {ok:false,reason:v.reason};
  // XR-02: never re-attribute an existing link to another studio; say how to do it explicitly.
  const c=VR.conflictOf?.(app.project,sheet,{studioId:studioId()});if(c?.conflict)return {ok:false,code:'studio-conflict',reason:c.linkedStudioId
   ?tx(`esta ficha ya está vinculada desde el estudio «${c.linkedStudioId}». Para vincularla desde este estudio, quita antes ese vínculo en Presupuestar → «Referencias visuales del proyecto».`,`this sheet is already linked from studio «${c.linkedStudioId}». To link it from this studio, first remove that link in Budget → «Visual references of the project».`,`此资料已从工作室「${c.linkedStudioId}」关联。如需从本工作室关联，请先在预算 →“项目视觉参考”中移除该关联。`)
   :tx('esta ficha ya está vinculada sin estudio (vínculo anterior). Para atribuirla a este estudio, quita antes ese vínculo en Presupuestar → «Referencias visuales del proyecto».','this sheet is already linked without a studio (older link). To attribute it to this studio, first remove that link in Budget → «Visual references of the project».','此资料已在无工作室的情况下关联（旧关联）。如需归属到本工作室，请先在预算 →“项目视觉参考”中移除该关联。')};
  // Same sheet, same studio, same project: already linked — no editor step, nothing to save.
  if(c?.reason==='already-linked'&&app.project.extensions?.[VR.EXT]?.refs?.[sheet.hash]?.projectId===app.project.id)return {ok:true,already:true};
  const r=app.applyExtension?.(p=>{VR.link(p,sheet,{at:new Date().toISOString(),studioId:studioId()});return {ok:true,project:p};});return r?.ok?{ok:true}:{ok:false,reason:r?.explanation?.[0]||'not-saved'};}
 function unlinkVisual(hash){if(!VR)return;app.applyExtension?.(p=>{const r=VR.unlink(p,hash);return r.changed?{ok:true,project:p}:{ok:false};});}
 function studioButton(){const dlg=document.querySelector('#visualStudioDialog'),dl=dlg?.querySelector('#vsSheet');if(!dl||dlg.querySelector('#vsLinkProject'))return;
  const b=btn(tx('Vincular al proyecto (Presupuestar)','Link to the project (Budget)','关联到项目（预算）'),undefined,'btn');b.id='vsLinkProject';b.disabled=true;dl.after(b);
  const note=el('small','',undefined,'vs-link-note');note.id='vsLinkNote';note.setAttribute('role','status');b.after(note);
  const sync=()=>{const s=window.RubikVisualStudio?.sheet;b.disabled=!s;if(!s)note.textContent='';};
  new MutationObserver(sync).observe(dlg,{attributes:true,attributeFilter:['data-decision','data-run','open']});
  b.onclick=()=>{const r=linkVisual(window.RubikVisualStudio?.sheet);note.textContent=r.ok?tx('Vinculada al proyecto como referencia visual (sin importe). Se ve en Presupuestar.','Linked to the project as a visual reference (no amount). Shown in Budget.','已作为视觉参考关联到项目（无金额）。'):tx('No se ha vinculado: ','Not linked: ','未关联：')+r.reason;note.dataset.state=r.ok?'linked':'refused';};}
 /* ---------- Assistant: read-only context ---------- */
 function assistantContext(){
  const caps=CP.assistantCapabilities(catalogs);
  return {studioId:studioId(),pilot:'local-browser',catalogs:caps.listCatalogs(),search:(q)=>caps.listCatalogs().flatMap(c=>caps.search(c.catalogId,{q}).map(p=>({catalogId:c.catalogId,catalogRevision:c.revision,productId:p.productId,variantId:p.variantId||null,sku:p.sku,displayName:p.displayName,family:p.family,kind:p.kind,
    price:p.commercial?.netUnitPrice??null,unit:p.commercial?.unit||null,priceSource:p.commercial?.priceSource||null,verifiedAt:p.commercial?.verifiedAt||null,synthetic:p.source?.kind==='synthetic-fixture'}))),
   placed:()=>summary(),visual:()=>visualRefs(),limits:caps.limits};}
 // Keep Presupuestar in step when «Precios de referencia» (opened over it) or the Image studio closes.
 document.addEventListener('close',e=>{const id=e.target?.id;
  if(id==='pricesDialog'&&document.querySelector('#budgetDialog')?.open)window.FloorPlanBudgetUI?.refresh?.();
  if(id==='visualStudioDialog'&&returnToBudget){returnToBudget=false;window.FloorPlanBudgetUI?.open?.();}},true);
 let queued=false;new MutationObserver(()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;studioButton();});}).observe(document.body,{childList:true,subtree:true});studioButton();
 window.RubikCat04=Object.freeze({extraLines,summary,decorateRow,budgetSections,priceSources:()=>CB.priceSources(catalogs(),{studioId:studioId()}),quoteFor:id=>CB.quoteFor(catalogs(),id),isCatalogItem:CB.isCatalogItem,
  linkVisual,unlinkVisual,visualRefs,assistantContext,catalogs,studioId,stateText});
})();
