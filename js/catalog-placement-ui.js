/* CAT-03 «Diseñar → Amueblar → Producto de mi estudio» · interfaz. Coloca un producto de «Mis catálogos» en el
   proyecto con sus medidas VERIFICADAS (js/catalog-placement-core.js): modelo 3D validado por el pipeline de activos
   cuando existe y coincide, o un volumen genérico ROTULADO con el motivo. Colocación ordinaria del editor
   (FloorPlanApp.addOwnFurniture: colisiones, un paso del deshacer, guardado). El SKU nunca cambia la geometría; el
   proyecto manda. Las partidas del proyecto usan solo precios de la ficha con fuente y fecha (proveedor C1–C4). */
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
 // Project line items from linked objects (C1–C4 provider): only sourced prices count.
 function budget(box){
  box.replaceChildren();el('h3',{},box,tx('Partidas del proyecto (productos colocados)','Project line items (placed products)','项目条目（已放置产品）'));
  const b=P.budgetLines(app.project,catalogs);
  if(!b.lines.length){el('p',{class:'catalog-note'},box,tx('Aún no hay productos del catálogo en el proyecto.','No catalogue products in the project yet.','项目中尚无目录产品。'));return b;}
  const tbl=el('table',{class:'catalog-sheet',id:'catalogBudgetTable'},box),tb=el('tbody',{},tbl);
  for(const l of b.lines){const tr=el('tr',{'data-sku':l.sku,'data-status':l.status},tb);el('th',{scope:'row'},tr,`${l.quantity} × ${l.description} (${l.sku})`);
   el('td',{class:l.status==='sourced'?'':'unknown'},tr,l.status==='sourced'?`${l.subtotal.toFixed(2)} € · ${l.source.label} · ${l.source.asOf}${l.versionChanged?' · '+tx('ficha actualizada después de colocar','sheet updated after placing','放置后资料已更新'):''}`:l.status==='no-price'?tx('Sin precio: no se incluye','No price: not included','无价格：不计入'):tx('Ficha no encontrada','Sheet not found','未找到资料'));}
  el('p',{id:'catalogBudgetTotal',class:'catalog-ok'},box,tx(`Total neto con precio conocido: ${b.netTotal.toFixed(2)} € (sin IVA)${b.complete?'':' · incompleto: '+b.excluded.join(', ')}`,`Net total with known prices: ${b.netTotal.toFixed(2)} € (excl. VAT)${b.complete?'':' · incomplete: '+b.excluded.join(', ')}`,`已知价格净总额：${b.netTotal.toFixed(2)} €`));
  el('p',{class:'catalog-note'},box,tx('Precio de cada ficha con su fuente y fecha; nunca desde imágenes. Instalación, encimeras o recortes requieren partidas propias en Presupuestar.','Each sheet price with its source and date; never from images. Installation, worktops or cut-outs need their own lines in Budget.','价格来自资料来源与日期，绝不来自图像。'));
  const dl=el('button',{type:'button',class:'btn',id:'catalogBudgetJson'},box,tx('Descargar partidas (JSON)','Download line items (JSON)','下载条目（JSON）'));
  dl.onclick=()=>{const url=URL.createObjectURL(new Blob([JSON.stringify({schema:'rubik-catalog-budget-lines/1',generatedAt:new Date().toISOString(),...b},null,1)],{type:'application/json'}));const a=el('a',{href:url,download:'rubik-partidas-catalogo.json'},document.body);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);};
  return b;
 }
 // Furniture panel: which catalogue product this object is and how it is represented.
 function panelNote(){const st=document.querySelector('#fAssetStatus');if(!st||document.querySelector('#catLinkNote'))return;const sel=typeof ui!=='undefined'?ui.sel:null,id=sel?.kind==='furn'?sel.id:null;if(!id)return;
  const l=P.links(app.project).active[id];if(!l)return;
  const p=el('p',{class:'full muted',id:'catLinkNote','data-sku':l.sku,'data-representation':l.representation});st.after(p);
  p.textContent=tx(`Producto de catálogo: ${l.sku} · rev. ${l.catalogRevision} · ${l.representation==='validated-model'?'modelo 3D validado':'volumen genérico ('+reason(l.fallbackReason)+')'}. Las medidas del proyecto mandan; no certifica el producto.`,`Catalogue product: ${l.sku} · rev. ${l.catalogRevision} · ${l.representation==='validated-model'?'validated 3D model':'generic volume ('+reason(l.fallbackReason)+')'}. Project measures rule; it does not certify the product.`,`目录产品：${l.sku}`);}
 // Palette entry under «Traer mi mueble».
 const addEntry=()=>{const host=document.querySelector('#paletteFurnish')||document.querySelector('aside.lib');if(!host||host.querySelector('#catalogPlaceEntry'))return;
  const s=el('section',{id:'catalogPlaceEntry',class:'own-furn-entry'});const b=el('button',{type:'button',id:'catalogPlaceOpen',class:'btn own-furn-open'},s,tx('Producto de mi estudio','Product from my studio','我的工作室产品'));
  el('p',{class:'own-furn-hint'},s,tx('Desde «Mis catálogos»: con medidas verificadas y su modelo 3D validado o un volumen genérico rotulado.','From «My catalogues»: verified measures with its validated 3D model or a labelled generic volume.','来自“我的目录”：已核实尺寸。'));
  b.onclick=()=>{if(matchMedia('(max-width:1100px)').matches){try{closeDrawers();}catch{}}window.RubikCatalogUI?.open();};
  const own=host.querySelector('#ownFurnEntry');if(own)own.after(s);else host.prepend(s);};
 let queued=false;new MutationObserver(()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;addEntry();panelNote();});}).observe(document.body,{childList:true,subtree:true});addEntry();
 window.RubikCatalogPlacementUI={decorate,budget,costProvider:P.costProvider(catalogs)};
})();
