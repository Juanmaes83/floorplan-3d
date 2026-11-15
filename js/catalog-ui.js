/* CAT-02 «Mis catálogos» · interfaz. Entrada: «Mi estudio» → tarjeta «Mis catálogos» (y window.RubikCatalogUI.open).
   Piloto LOCAL de un profesional en este navegador (js/catalog-product-core.js): importar una colección (piloto
   sintético o JSON propio), ver qué fichas se aceptan o rechazan y por qué, buscar y filtrar, ver la ficha, descargarla
   (HTML autónomo sin scripts o JSON con huella SHA-256) y congelar una selección para una entrega. Nada de esto toca el
   proyecto (FloorPlanProjectV1) ni se envía a ningún servidor. El selector de estudio separa catálogos por perfil de
   marca para evitar mezclas, pero NO es control de acceso: el aislamiento real entre estudios requiere GOV-06a. */
(function(){
 'use strict';
 const C=window.RubikCatalogProduct;if(!C)return;
 const tx=(es,en,zh)=>({es,en,zh})[typeof LANG==='string'?LANG:'es']||es;
 const li=()=>({es:0,en:1,zh:2})[typeof LANG==='string'?LANG:'es']||0;
 const msg=code=>(C.MESSAGES[code]||C.MESSAGES['invalid-shape'])[li()];
 const el=(tag,attrs={},parent,text)=>{const n=document.createElement(tag);for(const [k,v] of Object.entries(attrs))if(v!==undefined&&v!==null&&v!==false)n.setAttribute(k,v===true?'':v);if(text!==undefined)n.textContent=text;parent?.append(n);return n;};
 const storage=(()=>{try{const s=window.localStorage;s.getItem('x');return s;}catch{const m=new Map();return {getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k)};}})();
 const today=()=>new Date().toISOString().slice(0,10);
 const FAMILY_LABEL={cocinas:['Cocinas','Kitchens','厨房'],electrodomesticos:['Electrodomésticos','Appliances','家电'],encimeras:['Encimeras','Worktops','台面'],mobiliario:['Mobiliario','Furniture','家具'],dormitorios:['Dormitorios','Bedrooms','卧室'],banos:['Baños','Bathrooms','浴室'],sanitarios:['Sanitarios','Sanitaryware','洁具'],pavimentos:['Pavimentos','Flooring','地面'],revestimientos:['Revestimientos','Wall finishes','墙面'],iluminacion:['Iluminación','Lighting','照明'],carpinterias:['Carpinterías','Joinery','门窗'],decoracion:['Decoración','Decoration','装饰'],textiles:['Textiles','Textiles','纺织品']};
 const fam=f=>(FAMILY_LABEL[f]||[f,f,f])[li()];

 // ── Diálogo ─────────────────────────────────────────────────────────────────────────────────────────────────────
 const dlg=el('dialog',{id:'catalogDialog',class:'catalog-dialog','aria-labelledby':'catalogTitle'},document.body);
 const wrap=el('div',{class:'catalog'},dlg),head=el('div',{class:'catalog-head'},wrap);
 const title=el('h2',{id:'catalogTitle'},head),closeBtn=el('button',{type:'button',class:'btn',id:'catalogClose'},head);
 const truth=el('p',{class:'catalog-truth',id:'catalogTruth'},wrap);
 const bar=el('div',{class:'catalog-bar'},wrap);
 const studioLabel=el('label',{class:'catalog-field'},bar),studioText=el('span',{},studioLabel),studioSel=el('select',{id:'catalogStudio'},studioLabel);
 const catLabel=el('label',{class:'catalog-field'},bar),catText=el('span',{},catLabel),catSel=el('select',{id:'catalogSelect'},catLabel);
 const revision=el('p',{class:'catalog-revision',id:'catalogRevision','aria-live':'polite'},wrap);
 const imp=el('section',{class:'catalog-import','aria-labelledby':'catalogImportTitle'},wrap);const impTitle=el('h3',{id:'catalogImportTitle'},imp);
 const impRow=el('div',{class:'catalog-actions'},imp),pilotBtn=el('button',{type:'button',class:'btn primary',id:'catalogLoadPilot'},impRow);
 const fileLabel=el('label',{class:'btn catalog-file'},impRow),fileText=el('span',{},fileLabel),file=el('input',{type:'file',id:'catalogImportFile',accept:'application/json,.json'},fileLabel);
 const report=el('div',{id:'catalogImportReport',class:'catalog-report',role:'status'},imp);
 const find=el('section',{class:'catalog-find','aria-labelledby':'catalogFindTitle'},wrap);const findTitle=el('h3',{id:'catalogFindTitle'},find);
 const filters=el('div',{class:'catalog-filters'},find);
 const q=el('input',{type:'search',id:'catalogSearch',autocomplete:'off'},filters);
 const famSel=el('select',{id:'catalogFamily'},filters),priceSel=el('select',{id:'catalogPrice'},filters),dimsSel=el('select',{id:'catalogDims'},filters);
 const count=el('p',{id:'catalogCount',class:'catalog-count','aria-live':'polite'},find);
 const body=el('div',{class:'catalog-body'},wrap);
 const list=el('ul',{id:'catalogList',class:'catalog-list'},body);
 const preview=el('article',{id:'catalogPreview',class:'catalog-preview',hidden:true,'aria-labelledby':'catalogPreviewTitle'},body);
 const selSec=el('section',{id:'catalogSelectionBox',class:'catalog-selection','aria-labelledby':'catalogSelTitle'},wrap);const selTitle=el('h3',{id:'catalogSelTitle'},selSec);
 const selList=el('ul',{id:'catalogSelection'},selSec),selRow=el('div',{class:'catalog-actions'},selSec);
 const freezeBtn=el('button',{type:'button',class:'btn primary',id:'catalogFreeze',disabled:true},selRow),clearSelBtn=el('button',{type:'button',class:'btn',id:'catalogClearSel',disabled:true},selRow);
 const selNote=el('p',{id:'catalogSelNote',class:'catalog-note','aria-live':'polite'},selSec);
 const budgetBox=el('section',{id:'catalogBudgetBox',class:'catalog-selection',hidden:!window.RubikCatalogPlacementUI},wrap); // CAT-03 line items

 let studioId='local',catalog=null,current=null,selection=[];
 const imageCache=new Map(); // path → {ok, url, dataUrl} after checking the SHA-256 declared by the sheet
 async function image(ref){
  if(imageCache.has(ref.path))return imageCache.get(ref.path);
  let out={ok:false};try{const r=await fetch(ref.path,{credentials:'same-origin'});if(r.ok){const buf=new Uint8Array(await r.arrayBuffer());if(C.sha256(buf)===ref.sha256){const blob=new Blob([buf],{type:ref.mediaType});let bin='';for(let i=0;i<buf.length;i+=0x8000)bin+=String.fromCharCode(...buf.subarray(i,i+0x8000));out={ok:true,url:URL.createObjectURL(blob),dataUrl:`data:${ref.mediaType};base64,${btoa(bin)}`};}else out={ok:false,reason:'sha'};}}catch{}
  imageCache.set(ref.path,out);return out;
 }
 function studios(){
  const out=[{id:'local',name:tx('Este navegador (sin perfil)','This browser (no profile)','本浏览器（无配置）')}];
  try{const B=window.FloorPlanBrand,s=window.FloorPlanBrandUI?.store;if(B&&s)for(const p of B.readProfiles(s).profiles){const id='brd-'+p.id.slice(4).toLowerCase().replace(/[^a-z0-9-]/g,'');if(/^[a-z0-9][a-z0-9-]{1,63}$/.test(id))out.push({id,name:p.name});}}catch{}
  return out;
 }
 function labels(){
  title.textContent=tx('Mis catálogos','My catalogues','我的目录');closeBtn.textContent=tx('Cerrar','Close','关闭');
  truth.textContent=tx('Piloto local en este navegador: fichas orientativas de productos con su fuente. No es una cuenta en la nube ni separa estudios de forma segura. Nada se envía ni cambia tu proyecto.','Local pilot in this browser: indicative product sheets with their source. Not a cloud account and it does not separate studios securely. Nothing is sent and your project does not change.','本浏览器中的本地试点：附来源的参考产品资料。不是云账户，也不能安全隔离工作室。不会发送任何内容，也不会更改项目。');
  studioText.textContent=tx('Estudio','Studio','工作室');catText.textContent=tx('Catálogo','Catalogue','目录');
  impTitle.textContent=tx('Importar colección','Import collection','导入系列');pilotBtn.textContent=tx('Cargar piloto sintético (5 fichas)','Load synthetic pilot (5 sheets)','加载合成试点（5 份）');fileText.textContent=tx('Importar JSON…','Import JSON…','导入 JSON…');
  findTitle.textContent=tx('Buscar','Search','搜索');q.placeholder=tx('Nombre, SKU, colección…','Name, SKU, collection…','名称、SKU、系列…');q.setAttribute('aria-label',tx('Buscar productos','Search products','搜索产品'));
  const opts=(sel,items,aria)=>{const v=sel.value;sel.replaceChildren();for(const[val,t]of items)el('option',{value:val},sel,t);sel.value=v||'';sel.setAttribute('aria-label',aria);};
  opts(famSel,[['',tx('Todas las familias','All families','全部类别')],...C.FAMILIES.map(f=>[f,fam(f)])],tx('Familia','Family','类别'));
  opts(priceSel,[['',tx('Cualquier precio','Any price','任意价格')],['known',tx('Con precio y fuente','With sourced price','有来源价格')],['unknown',tx('Precio desconocido','Unknown price','价格未知')]],tx('Precio','Price','价格'));
  opts(dimsSel,[['',tx('Cualquier medida','Any dimensions','任意尺寸')],['verified',tx('Medidas verificadas','Verified dimensions','尺寸已核实')],['partial',tx('Medidas parciales','Partial dimensions','部分尺寸')],['unknown',tx('Medidas desconocidas','Unknown dimensions','尺寸未知')]],tx('Medidas','Dimensions','尺寸'));
  selTitle.textContent=tx('Selección para una entrega','Selection for a delivery','交付选择');freezeBtn.textContent=tx('Congelar selección (JSON)','Freeze selection (JSON)','冻结选择（JSON）');clearSelBtn.textContent=tx('Vaciar','Clear','清空');
 }
 function fillStudios(){const v=studioId;studioSel.replaceChildren();for(const s of studios())el('option',{value:s.id},studioSel,s.name);studioSel.value=studios().some(s=>s.id===v)?v:'local';studioId=studioSel.value;}
 function fillCatalogs(keep){const cats=C.loadCatalogs(storage,studioId);catSel.replaceChildren();if(!cats.length)el('option',{value:''},catSel,tx('— sin catálogos —','— no catalogues —','— 无目录 —'));for(const c of cats)el('option',{value:c.catalogId},catSel,c.name);
  catSel.value=cats.some(c=>c.catalogId===keep)?keep:(cats[0]?.catalogId||'');catalog=cats.find(c=>c.catalogId===catSel.value)||null;}
 function renderRevision(){revision.textContent=catalog?tx(`Revisión ${catalog.revision} · ${catalog.products.length} fichas · huella ${catalog.revisionHash.slice(0,12)}…`,`Revision ${catalog.revision} · ${catalog.products.length} sheets · hash ${catalog.revisionHash.slice(0,12)}…`,`修订 ${catalog.revision} · ${catalog.products.length} 份 · 哈希 ${catalog.revisionHash.slice(0,12)}…`):tx('Sin catálogo en este estudio. Importa una colección.','No catalogue in this studio. Import a collection.','此工作室无目录。请导入系列。');}
 function badges(p,parent){const b=el('span',{class:'catalog-badges'},parent);
  if(p.commercial.netUnitPrice==null)el('span',{class:'badge warn'},b,tx('Precio desconocido','Unknown price','价格未知'));
  if(p.dimensionsStatus!=='verified')el('span',{class:'badge warn'},b,p.dimensionsStatus==='unknown'?tx('Medidas desconocidas','Unknown dimensions','尺寸未知'):tx('Medidas parciales','Partial dimensions','部分尺寸'));
  if(p.source.kind==='synthetic-fixture')el('span',{class:'badge'},b,tx('Sintético','Synthetic','合成'));
  if(p.affiliation==='none')el('span',{class:'badge'},b,tx('Sin afiliación','No affiliation','无隶属'));return b;}
 function renderList(){
  list.replaceChildren();const items=catalog?C.search(catalog,{q:q.value,family:famSel.value||undefined,price:priceSel.value||undefined,dims:dimsSel.value||undefined}):[];
  count.textContent=catalog?tx(`${items.length} de ${catalog.products.length} fichas`,`${items.length} of ${catalog.products.length} sheets`,`${items.length} / ${catalog.products.length} 份`):'';
  for(const p of items){const row=el('li',{},list),btn=el('button',{type:'button',class:'catalog-item','data-key':C.keyOf(p),'aria-pressed':current&&C.keyOf(current)===C.keyOf(p)?'true':'false'},row);
   const thumb=el('span',{class:'catalog-thumb','aria-hidden':'true'},btn);if(p.imageRefs[0])image(p.imageRefs[0]).then(r=>{if(r.ok&&thumb.isConnected){const i=el('img',{alt:'',src:r.url},thumb);i.decoding='async';}});
   const txt=el('span',{class:'catalog-item-text'},btn);el('strong',{},txt,p.displayName);el('small',{},txt,`${p.sku} · ${fam(p.family)}`);badges(p,txt);
   btn.onclick=()=>show(p.productId,p.variantId);}
  if(catalog&&!items.length)el('li',{class:'catalog-empty'},list,tx('Ninguna ficha coincide con la búsqueda.','No sheet matches the search.','没有匹配的资料。'));
 }
 function download(name,type,text){const url=URL.createObjectURL(new Blob([text],{type}));const a=el('a',{href:url,download:name},document.body);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
 function brandSnap(){try{const p=window.FloorPlanBrandUI?.snapshot()?.profile;return p?{name:p.name,email:p.email||'',phone:p.phone||'',web:p.web||''}:null;}catch{return null;}}
 async function show(productId,variantId){
  if(!catalog)return;const s=C.sheet(catalog,productId,variantId,{lang:typeof LANG==='string'?LANG:'es',brand:brandSnap()});current=s.product;preview.hidden=false;preview.replaceChildren();preview.dataset.key=C.keyOf(s.product);
  el('h3',{id:'catalogPreviewTitle'},preview,s.title);if(s.description)el('p',{class:'catalog-desc'},preview,s.description);
  const fig=el('figure',{class:'catalog-figure'},preview);const ref=s.product.imageRefs[0];
  if(ref){const r=await image(ref);if(r.ok)el('img',{src:r.url,alt:ref.alt,id:'catalogPreviewImage'},fig);else el('p',{class:'catalog-error',role:'alert'},fig,tx('La imagen no coincide con su huella SHA-256: no se muestra.','The image does not match its SHA-256: not shown.','图片与 SHA-256 不符：不显示。'));if(ref.license.attribution)el('figcaption',{},fig,ref.license.attribution);}
  const tbl=el('table',{class:'catalog-sheet',id:'catalogSheetTable'},preview),tb=el('tbody',{},tbl);
  for(const[k,label,value,status]of s.rows){const tr=el('tr',{'data-k':k},tb);el('th',{scope:'row'},tr,label);el('td',{class:status==='unknown'?'unknown':''},tr,value);}
  const notes=el('div',{class:'catalog-notices',id:'catalogNotices'},preview);for(const n of s.notices)el('p',{},notes,n);
  const act=el('div',{class:'catalog-actions'},preview);
  const html=el('button',{type:'button',class:'btn primary',id:'catalogSheetHtml'},act,tx('Descargar ficha (HTML)','Download sheet (HTML)','下载资料（HTML）'));
  const json=el('button',{type:'button',class:'btn',id:'catalogSheetJson'},act,tx('Descargar ficha (JSON)','Download sheet (JSON)','下载资料（JSON）'));
  const add=el('button',{type:'button',class:'btn',id:'catalogAddSel'},act,tx('Añadir a la selección','Add to selection','加入选择'));
  html.onclick=async()=>{const data={};for(const i of s.images){const ref2=s.product.imageRefs.find(r=>r.path===i.path),r=ref2&&await image(ref2);if(r?.ok)data[i.path]=r.dataUrl;}download(`rubik-ficha-${s.product.sku}.html`,'text/html',C.sheetHtml(s,{imageData:data}));};
  json.onclick=()=>download(`rubik-ficha-${s.product.sku}.json`,'application/json',JSON.stringify(s,null,1));
  add.onclick=()=>{const k=C.keyOf(s.product);const e=selection.find(x=>x.key===k);if(e)e.quantity+=1;else selection.push({key:k,productId:s.product.productId,variantId:s.product.variantId,name:s.product.displayName,sku:s.product.sku,quantity:1});renderSelection();};
  window.RubikCatalogPlacementUI?.decorate(act,catalog,s.product); // CAT-03: «Colocar en el proyecto»
  for(const b of list.querySelectorAll('.catalog-item'))b.setAttribute('aria-pressed',String(b.dataset.key===C.keyOf(s.product)));
  // Una columna (teléfono, apaisado): la ficha queda debajo de la lista; se lleva a la vista.
  try{if(matchMedia('(max-width:859px)').matches)preview.scrollIntoView({block:'start'});}catch{}
 }
 function renderSelection(){selList.replaceChildren();for(const s of selection){const li2=el('li',{'data-key':s.key},selList);el('span',{},li2,`${s.quantity} × ${s.name} (${s.sku})`);const rm=el('button',{type:'button',class:'btn small','aria-label':tx('Quitar ','Remove ','移除 ')+s.name},li2,'×');rm.onclick=()=>{selection=selection.filter(x=>x!==s);renderSelection();};}
  freezeBtn.disabled=clearSelBtn.disabled=!selection.length||!catalog;if(!selection.length)selNote.textContent=tx('Añade fichas para congelarlas en una entrega. Los cambios posteriores del catálogo no alteran una selección congelada.','Add sheets to freeze them for a delivery. Later catalogue changes do not alter a frozen selection.','添加资料以冻结到交付中。目录后续更改不影响已冻结的选择。');}
 freezeBtn.onclick=()=>{if(!catalog||!selection.length)return;const projectId=(()=>{try{return window.FloorPlanApp?.entryId||null;}catch{return null;}})();
  const frozen=C.freezeSelection(catalog,selection.map(s=>({productId:s.productId,variantId:s.variantId,quantity:s.quantity})),{projectId});
  download(`rubik-seleccion-${catalog.catalogId}-r${catalog.revision}.json`,'application/json',JSON.stringify(frozen,null,1));
  selNote.textContent=tx(`Selección congelada: revisión ${frozen.catalogRevision}, huella ${frozen.hash.slice(0,12)}…`,`Frozen selection: revision ${frozen.catalogRevision}, hash ${frozen.hash.slice(0,12)}…`,`已冻结：修订 ${frozen.catalogRevision}，哈希 ${frozen.hash.slice(0,12)}…`);dlg.dataset.frozen=frozen.hash;};
 clearSelBtn.onclick=()=>{selection=[];renderSelection();};
 function renderReport(r,source){
  report.replaceChildren();const ok=el('p',{class:'catalog-ok'},report,tx(`${source}: ${r.added.length} nuevas, ${r.updated.length} nuevas versiones, ${r.unchanged.length} sin cambios, ${r.rejected.length} rechazadas.`,`${source}: ${r.added.length} new, ${r.updated.length} new versions, ${r.unchanged.length} unchanged, ${r.rejected.length} rejected.`,`${source}：新增 ${r.added.length}，新版本 ${r.updated.length}，未变 ${r.unchanged.length}，拒绝 ${r.rejected.length}。`));ok.id='catalogImportSummary';
  if(r.rejected.length){const ul=el('ul',{class:'catalog-rejected',id:'catalogRejected'},report);for(const x of r.rejected){const li2=el('li',{'data-sku':x.sku||''},ul);el('strong',{},li2,(x.sku||x.productId||('#'+(x.index+1)))+': ');el('span',{},li2,[...new Set(x.errors.map(e=>msg(e.code)))].join(' '));}}
  dlg.dataset.imported=String(r.accepted.length);dlg.dataset.rejected=String(r.rejected.length);
 }
 function importPayload(payload,source){
  const catalogId=payload&&typeof payload.catalogId==='string'&&/^[a-z0-9][a-z0-9-]{1,63}$/.test(payload.catalogId)?payload.catalogId:null;
  if(!payload||payload.schema!==C.COLLECTION_SCHEMA||!catalogId||!Array.isArray(payload.products)){report.replaceChildren();el('p',{class:'catalog-error',role:'alert',id:'catalogImportError'},report,tx('El archivo no es una colección RUBIK (rubik-catalog-collection/1).','The file is not a RUBIK collection (rubik-catalog-collection/1).','该文件不是 RUBIK 系列。'));return;}
  const existing=C.getCatalog(storage,studioId,catalogId)||C.createCatalog({catalogId,studioId,name:payload.name||catalogId});
  let r;try{r=C.importCollection(existing,payload,{today:today()});}catch(e){report.replaceChildren();el('p',{class:'catalog-error',role:'alert',id:'catalogImportError'},report,tx('Colección no válida: ','Invalid collection: ','系列无效：')+e.message);return;}
  if(r.changed||!C.getCatalog(storage,studioId,catalogId))C.saveCatalog(storage,r.catalog);
  fillCatalogs(catalogId);renderRevision();renderList();renderReport(r,source);
 }
 pilotBtn.onclick=async()=>{pilotBtn.disabled=true;try{const res=await fetch('assets/cat-ia/fixtures/pilot-collection.json',{credentials:'same-origin'});importPayload(await res.json(),tx('Piloto sintético','Synthetic pilot','合成试点'));}catch{report.textContent=tx('No se pudo cargar el piloto.','Could not load the pilot.','无法加载试点。');}finally{pilotBtn.disabled=false;}};
 file.onchange=async()=>{const f=file.files?.[0];file.value='';if(!f)return;if(f.size>2*1024*1024){report.textContent=tx('El archivo supera 2 MB.','The file is over 2 MB.','文件超过 2 MB。');return;}let data;try{data=JSON.parse(await f.text());}catch{report.replaceChildren();el('p',{class:'catalog-error',role:'alert',id:'catalogImportError'},report,tx('El archivo no es JSON válido.','The file is not valid JSON.','文件不是有效 JSON。'));return;}importPayload(data,tx('Archivo importado','Imported file','导入的文件'));};
 for(const c of [q,famSel,priceSel,dimsSel])c.addEventListener('input',renderList);
 studioSel.onchange=()=>{studioId=studioSel.value;selection=[];current=null;preview.hidden=true;report.replaceChildren();fillCatalogs();renderRevision();renderList();renderSelection();};
 catSel.onchange=()=>{fillCatalogs(catSel.value);current=null;preview.hidden=true;selection=[];renderRevision();renderList();renderSelection();};
 closeBtn.onclick=()=>dlg.close();
 function open(){labels();fillStudios();fillCatalogs(catalog?.catalogId);renderRevision();renderList();renderSelection();if(window.RubikCatalogPlacementUI){budgetBox.hidden=false;window.RubikCatalogPlacementUI.budget(budgetBox);}preview.hidden=!current;if(current&&catalog&&C.findProduct(catalog,current.productId,current.variantId))show(current.productId,current.variantId);dlg.showModal();(catalog?q:pilotBtn).focus();}

 // ── Entrada en «Mi estudio» (la tarjeta se vuelve a pintar al cambiar de área: se añade si falta) ───────────────────
 const addCard=()=>{const grid=document.querySelector('#professionalWorkspace[data-area="studio"] .professional-grid');if(!grid||grid.querySelector('#catalogStudioCard'))return;
  const c=el('article',{class:'professional-card',id:'catalogStudioCard','data-module':'catalogs'},grid);el('h3',{},c,tx('Mis catálogos','My catalogues','我的目录'));
  const n=C.loadCatalogs(storage,'local').reduce((a,x)=>a+x.products.length,0);el('p',{class:'professional-state'},c,n?tx(`${n} fichas en este navegador`,`${n} sheets in this browser`,`本浏览器中 ${n} 份`):tx('Piloto local: productos y variantes con fuente','Local pilot: products and variants with source','本地试点：附来源的产品与款式'));
  el('p',{},c,tx('Fichas con SKU, medidas y precio con fuente y fecha, o «desconocido». Exporta fichas y congela selecciones.','Sheets with SKU, dimensions and dated, sourced price, or «unknown». Export sheets and freeze selections.','含 SKU、尺寸及带来源和日期的价格（或“未知”）。可导出资料并冻结选择。'));
  const b=el('button',{type:'button',class:'btn',id:'catalogOpen'},c,tx('Abrir Mis catálogos','Open My catalogues','打开我的目录'));b.onclick=open;};
 let queued=false;new MutationObserver(()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;addCard();});}).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['data-area']});addCard();

 window.RubikCatalogUI={open,get studioId(){return studioId;},get catalog(){return catalog&&JSON.parse(JSON.stringify(catalog));},
  capabilities:C.assistantCapabilities(()=>C.loadCatalogs(storage,studioId))};
})();
