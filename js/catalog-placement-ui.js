/* CAT-03 «Diseñar → Amueblar → Producto de mi estudio» · interfaz. Coloca un producto de «Mis catálogos» en el
   proyecto con sus medidas VERIFICADAS (js/catalog-placement-core.js): modelo 3D validado por el pipeline de activos
   cuando existe y coincide, o un volumen genérico ROTULADO con el motivo. Colocación ordinaria del editor
   (FloorPlanApp.addOwnFurniture: colisiones, un paso del deshacer, guardado). El SKU nunca cambia la geometría; el
   proyecto manda. Las partidas son las de Presupuestar (CAT-04): el precio de ficha es solo una referencia. */
(function(){
 'use strict';
 const P=window.RubikCatalogPlacement,CP=window.RubikCatalogProduct,app=window.FloorPlanApp;if(!P||!CP||!app)return;
 const tx=(es,en,zh)=>({es,en,zh})[typeof LANG==='string'?LANG:'es']||es;
 const el=(tag,attrs={},parent,text)=>{const n=document.createElement(tag);for(const [k,v] of Object.entries(attrs))if(v!==undefined&&v!==null&&v!==false)n.setAttribute(k,v===true?'':v);if(text!==undefined)n.textContent=text;parent?.append(n);return n;};
 const storage=(()=>{try{const s=window.localStorage;s.getItem('x');return s;}catch{return {getItem:()=>null,setItem(){},removeItem(){}};}})();
 const catalogs=()=>{try{return CP.loadCatalogs(storage,window.RubikCatalogUI?.studioId||'local');}catch{return [];}};
 const assets=async()=>{const U=window.FloorPlanAssetUI;if(U&&!U.ready){try{await U.prepare;}catch{}}return U?.entries||[];};
 const REASON={'no-model':['sin modelo 3D en la ficha','no 3D model in the sheet','资料中无三维模型'],'model-not-validated':['el modelo no supera el pipeline de activos (permiso, huella, unidades o caducidad)','the model does not pass the asset pipeline (permission, hash, units or expiry)','模型未通过资产校验'],
  'model-dimensions-mismatch':['las medidas del modelo no coinciden con la ficha (más de 20 mm)','the model measures differ from the sheet (over 20 mm)','模型尺寸与资料不符'],'dimensions-unknown':['medidas no verificadas: no se puede colocar','dimensions not verified: cannot be placed','尺寸未核实：无法放置'],
  'material-not-placeable':['es un material: se aplica a superficies, no se coloca como objeto','it is a material: applied to surfaces, not placed as an object','这是材料：用于表面，不作为物体放置']};
 const reason=r=>{const t=REASON[r];return t?tx(...t):r;};
 // Product sheet: «Colocar en el proyecto» with what will be placed and why.
 async function decorate(actions,catalog,product){
  const note=el('p',{id:'catalogPlaceNote',class:'catalog-note'},actions.parentElement);
  const b=el('button',{type:'button',class:'btn',id:'catalogPlace'},actions,tx('Colocar en el proyecto','Place in the project','放入项目'));
  const plan=P.plan(product,await assets());
  if(!plan.ok){b.disabled=true;note.textContent=reason(plan.reason);note.dataset.state=plan.reason;return;}
  note.dataset.state=plan.representation;
  note.textContent=plan.representation==='validated-model'?tx(`Se colocará con su modelo 3D validado (${plan.asset.assetId}) y sus medidas ${plan.spec.w} × ${plan.spec.d} × ${plan.spec.h} mm. Representación ilustrativa: no certifica el producto.`,`It will be placed with its validated 3D model (${plan.asset.assetId}) and its ${plan.spec.w} × ${plan.spec.d} × ${plan.spec.h} mm measures. Illustrative: it does not certify the product.`,`将以已验证三维模型放置（${plan.asset.assetId}），尺寸 ${plan.spec.w} × ${plan.spec.d} × ${plan.spec.h} mm。`)
   :tx(`Se colocará como VOLUMEN GENÉRICO rotulado (${reason(plan.fallbackReason)}) con sus medidas ${plan.spec.w} × ${plan.spec.d} × ${plan.spec.h} mm.`,`It will be placed as a labelled GENERIC VOLUME (${reason(plan.fallbackReason)}) with its ${plan.spec.w} × ${plan.spec.d} × ${plan.spec.h} mm measures.`,`将以标注的通用体块放置（${reason(plan.fallbackReason)}）。`);
  b.onclick=()=>{const link=P.linkOf(catalog,product,plan);
   const res=app.addOwnFurniture({...plan.spec},(project,id)=>{P.attach(project,id,link);});
   if(!res?.ok){note.textContent=tx('No se ha colocado: ','Not placed: ','未放置：')+(res?.message||res?.reason||'');note.dataset.state='not-placed';return;}
   document.querySelector('#catalogDialog')?.close();
   try{toast(plan.representation==='validated-model'?tx(`Colocado con modelo 3D validado: ${product.displayName}.`,`Placed with validated 3D model: ${product.displayName}.`,`已放置：${product.displayName}`):tx(`Colocado como volumen genérico: ${product.displayName}.`,`Placed as a generic volume: ${product.displayName}.`,`已作为通用体块放置：${product.displayName}`),5000);}catch{}};
 }
 // Project line items: the SAME figures Presupuestar shows (CAT-04: FloorPlanBudgetUI.current() +
 // FloorPlanBudget.calculateBudget). The sheet price is shown as a reference; it counts only after it is applied
 // there with confirmation. No parallel total is computed here.
 function budget(box){
  box.replaceChildren();el('h3',{},box,tx('Partidas del proyecto (productos colocados)','Project line items (placed products)','项目条目（已放置产品）'));
  const s=window.RubikCat04?.summary?.();
  if(!s){el('p',{class:'catalog-note'},box,tx('El presupuesto no está disponible en esta página.','The budget is not available on this page.','此页面无法使用预算。'));return null;}
  if(!s.items.length){el('p',{class:'catalog-note'},box,tx('Aún no hay productos del catálogo en el proyecto.','No catalogue products in the project yet.','项目中尚无目录产品。'));return s;}
  const eur=v=>v===null||v===undefined?'—':`${v.toFixed(2)} €`;
  const tbl=el('table',{class:'catalog-sheet',id:'catalogBudgetTable'},box),tb=el('tbody',{},tbl);
  for(const x of s.items){const tr=el('tr',{'data-sku':x.sku||'','data-status':x.state,'data-item':x.itemId},tb);
   el('th',{scope:'row'},tr,`${x.quantity===null?tx('pendiente de medición','pending measurement','待测量'):x.quantity} × ${x.displayName} (${x.sku||''})`);
   const parts=[window.RubikCat04.stateText(x.state)];
   if(x.sheetPrice)parts.push(`${tx('ficha','sheet','资料')} ${eur(x.sheetPrice.unitPrice)}/${x.sheetPrice.unit} · ${x.sheetPrice.label} · ${x.sheetPrice.asOf}`);
   parts.push(`${tx('en Presupuestar','in Budget','预算中')}: ${x.line?.subtotalNet===null||x.line?.subtotalNet===undefined?tx('sin importe','no amount','无金额'):eur(x.line.subtotalNet)}`);
   el('td',{class:x.line?.subtotalNet==null?'unknown':''},tr,parts.join(' · '));}
  const t=s.chapter?.totals,unpriced=t?.unpricedItemIds?.length||0;
  el('p',{id:'catalogBudgetTotal',class:unpriced?'catalog-warn':'catalog-ok'},box,tx(`Capítulo «Productos de mi estudio» en Presupuestar: ${eur(t?.net?.amount??null)} sin IVA${unpriced?` · incompleto: ${unpriced} partida(s) sin precio aplicado`:''}`,
   `«Products from my studio» chapter in Budget: ${eur(t?.net?.amount??null)} excl. VAT${unpriced?` · incomplete: ${unpriced} item(s) without an applied price`:''}`,`预算中“我的工作室产品”章节：${eur(t?.net?.amount??null)}（不含税）`));
  el('p',{class:'catalog-note'},box,tx('El precio de la ficha es una referencia: se aplica en Presupuestar → «Ver precio de la ficha y decidir…», con confirmación. Nunca desde imágenes. Instalación, encimeras o recortes requieren partidas propias.','The sheet price is a reference: it is applied in Budget → «See the sheet price and decide…», with confirmation. Never from images. Installation, worktops or cut-outs need their own items.','资料价格仅为参考：在预算中确认后应用。绝不来自图像。'));
  const row=el('div',{class:'catalog-actions'},box);
  const go=el('button',{type:'button',class:'btn',id:'catalogBudgetOpen'},row,tx('Abrir en Presupuestar','Open in Budget','在预算中打开'));go.onclick=()=>{document.querySelector('#catalogDialog')?.close();window.FloorPlanBudgetUI?.open();};
  const dl=el('button',{type:'button',class:'btn',id:'catalogBudgetJson'},row,tx('Descargar partidas (JSON)','Download line items (JSON)','下载条目（JSON）'));
  dl.onclick=()=>{const out={schema:'rubik-catalog-budget-lines/2',generatedAt:new Date().toISOString(),projectId:app.project.id,budgetId:s.budget.id,budgetSaved:s.saved,budgetRevision:window.FloorPlanCostCatalog?.revisionTag?.(s.budget)||null,
    basis:'cifras de FloorPlanBudget.calculateBudget sobre el presupuesto de Presupuestar; precio de ficha solo como referencia; nunca desde imágenes; sin IVA',chapterTotals:t||null,
    lines:s.items.map(x=>({itemId:x.itemId,sku:x.sku,quantity:x.quantity,unit:x.unit,quantityStatus:x.quantityStatus,objects:x.objects,state:x.state,activeUnitPrice:x.activeUnitPrice,subtotalNet:x.line?.subtotalNet??null,reference:x.reference,sheetPrice:x.sheetPrice,versionChanged:x.versionChanged}))};
   const url=URL.createObjectURL(new Blob([JSON.stringify(out,null,1)],{type:'application/json'}));const a=el('a',{href:url,download:'rubik-partidas-catalogo.json'},document.body);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);};
  return s;
 }
 // Furniture panel: which catalogue product this object is and how it is represented.
 function panelNote(){const st=document.querySelector('#fAssetStatus');if(!st||document.querySelector('#catLinkNote'))return;const sel=typeof ui!=='undefined'?ui.sel:null,id=sel?.kind==='furn'?sel.id:null;if(!id)return;
  const l=P.links(app.project).active[id];if(!l)return;
  const p=el('p',{class:'full muted',id:'catLinkNote','data-sku':l.sku,'data-representation':l.representation});st.after(p);
  p.textContent=tx(`Producto de catálogo: ${l.sku} · rev. ${l.catalogRevision} · ${l.representation==='validated-model'?'modelo 3D validado':'volumen genérico ('+reason(l.fallbackReason)+')'}. Las medidas del proyecto mandan; no certifica el producto.`,`Catalogue product: ${l.sku} · rev. ${l.catalogRevision} · ${l.representation==='validated-model'?'validated 3D model':'generic volume ('+reason(l.fallbackReason)+')'}. Project measures rule; it does not certify the product.`,`目录产品：${l.sku}`);}
 // Palette entry under «Traer mi mueble».
 const addEntry=()=>{const host=document.querySelector('#paletteFurnish')||document.querySelector('aside.lib');if(!host||host.querySelector('#catalogPlaceEntry'))return;
  const s=el('section',{id:'catalogPlaceEntry',class:'own-furn-entry'});const b=el('button',{type:'button',id:'catalogPlaceOpen',class:'btn own-furn-open'},s,tx('Producto de mi estudio','Product from my studio','我的工作室产品'));
  el('p',{class:'own-furn-hint'},s,tx('Desde «Mis catálogos»: con medidas verificadas y su modelo 3D validado o un volumen genérico rotulado.','From "My catalogues": verified measures with its validated 3D model or a labelled generic volume.','来自“我的目录”：已核实尺寸。'));
  b.onclick=()=>{if(matchMedia('(max-width:1100px)').matches){try{closeDrawers();}catch{}}window.RubikCatalogUI?.open();};
  const own=host.querySelector('#ownFurnEntry');if(own)own.after(s);else host.prepend(s);};
 // The palette entry is built once: it follows the language of the session.
 document.addEventListener('rubik:languagechange',()=>{const b=document.querySelector('#catalogPlaceOpen'),p=b?.parentElement?.querySelector('.own-furn-hint');if(b)b.textContent=tx('Producto de mi estudio','Product from my studio','我的工作室产品');if(p)p.textContent=tx('Desde «Mis catálogos»: con medidas verificadas y su modelo 3D validado o un volumen genérico rotulado.','From "My catalogues": verified measures with its validated 3D model or a labelled generic volume.','来自“我的目录”：已核实尺寸。');});
 let queued=false;new MutationObserver(()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;addEntry();panelNote();});}).observe(document.body,{childList:true,subtree:true});addEntry();
 window.RubikCatalogPlacementUI={decorate,budget,costProvider:P.costProvider(catalogs)};
})();
