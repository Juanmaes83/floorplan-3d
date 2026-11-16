/* CAT-04 · Mis catálogos → Presupuestar (pure, deterministic, no DOM, no network, no storage).
   Turns the ACTIVE CAT-03 links of the open project (project.extensions['x-cat03-catalog-link'], RubikCatalogPlacement)
   into budget LINES that FloorPlanBudgetDraft.draft() puts inside the one budget Presupuestar keeps
   (FloorPlanBudgetV1, rubik-budget-v1[projectId]). There is no second calculator here: amounts are always
   FloorPlanBudget.calculateBudget() over that document.
   - Identity: studio + catalogue + product + variant (never the SKU alone). Item id `cat:<studio>:<catalog>:<product>:<variant>`
     cannot collide with the geometric items (floor:…, skirting, paint, opening:…).
   - Quantity: the number of linked objects that exist, as a MANUAL-source quantity with an explicit label (the C1–C4
     quantity engine does not count objects; the count is not attributed to it). A sheet priced per m² or ml is never
     multiplied by a number of objects: its quantity stays «unavailable — pending measurement». Without a sheet the
     unit already budgeted is kept and an unverifiable unit leaves the quantity unknown (cross audit XR-01).
   - Price: never automatic. Placing a product creates an item WITHOUT active price; the sheet price is offered as a
     reference through FloorPlanCostCatalog.previewApply/apply (explicit confirmation) by `priceSources()`.
   - A line whose objects were all removed is kept with 0 units only while it carries a price or a reference (so an
     undo of the removal finds it again); otherwise it disappears. It never revives a deleted object.
   - States per item: unknown price, sheet price available, reference kept, applied (unreviewed), reviewed, stale
     (the sheet changed after the reference/price was taken), sheet unavailable, other studio, ambiguous.
   UMD: window.RubikCatalogBudget / module.exports. */
(function(root,factory){
 const node=typeof module==='object'&&module.exports;
 const deps=node?{P:require('./catalog-placement-core.js'),C:require('./catalog-product-core.js'),Cost:require('./cost-provider.js')}
  :{P:root.RubikCatalogPlacement,C:root.RubikCatalogProduct,Cost:root.FloorPlanCostProvider};
 const api=factory(deps);if(node)module.exports=api;else root.RubikCatalogBudget=api;
})(typeof self!=='undefined'?self:this,function(deps){
 'use strict';
 const {P,C,Cost}=deps;
 if(!P||!C||!Cost)throw Error('RubikCatalogBudget requires RubikCatalogPlacement, RubikCatalogProduct and FloorPlanCostProvider.');
 const CHAPTER='catalog',PREFIX='cat:',PROVIDER_ID=P.PROVIDER_ID,VERSION=1;
 const UNIT={ud:'unit',m2:'m2',ml:'m'};                         // notation only (S2 unitCheck does the same)
 const isObj=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
 const L=(lang,es,en,zh)=>({es,en,zh})[['es','en','zh'].includes(lang)?lang:'es'];
 const isCatalogItem=id=>typeof id==='string'&&id.startsWith(PREFIX);
 const validCatalogs=list=>(Array.isArray(list)?list:[]).filter(c=>isObj(c)&&c.schema===C.CATALOG_SCHEMA&&Array.isArray(c.products));
 function countLabel(n,lang){return L(lang,`Recuento automático de ${n} objeto(s) vinculado(s) en el proyecto (CAT-03); no es una medición del motor de cantidades`,
  `Automatic count of ${n} linked object(s) in the project (CAT-03); not a quantity-engine measurement`,`项目中 ${n} 个已关联对象的自动计数（CAT-03），非数量引擎测量`);}
 const NOTATION={unit:'ud',m2:'m2',m:'ml'};
 function unverifiableLabel(histUnit,lang){const u=histUnit?NOTATION[histUnit]||histUnit:null;
  return u?L(lang,`Ficha no disponible: se conserva la unidad ya presupuestada (${u}); la cantidad queda pendiente y ningún recuento de objetos se convierte en ${u}`,
   `Sheet unavailable: the unit already budgeted (${u}) is kept; the quantity stays pending and no object count is turned into ${u}`,`资料不可用：保留已预算的单位（${u}）；数量待定，对象数量不会换算为 ${u}`)
  :L(lang,'Ficha no disponible: la unidad comercial no es verificable; la cantidad queda pendiente','Sheet unavailable: the commercial unit cannot be verified; the quantity stays pending','资料不可用：无法核实计价单位；数量待定');}
 function pendingLabel(unit,lang){return L(lang,`Pendiente de medición: la ficha tiene precio por ${unit}; un número de objetos no es una ${unit==='m2'?'superficie':'longitud'}`,
  `Pending measurement: the sheet is priced per ${unit}; a number of objects is not ${unit==='m2'?'an area':'a length'}`,`待测量：资料按 ${unit} 计价，对象数量不是${unit==='m2'?'面积':'长度'}`);}
 // Sheet behind a link, checked against the catalogues of the CURRENT studio only.
 function sheetOf(cats,link,studioId){
  if(studioId&&link.studioId!==studioId)return {status:'other-studio'};
  const c=cats.find(x=>x.studioId===link.studioId&&x.catalogId===link.catalogId);if(!c)return {status:'catalog-missing'};
  const p=c.products.find(x=>x.productId===link.productId&&(x.variantId||null)===(link.variantId||null));if(!p)return {status:'sheet-missing',catalog:c};
  if(p.sku!==link.sku)return {status:'sku-changed',catalog:c,product:p};
  return {status:'found',catalog:c,product:p};
 }
 function priceOf(cats,itemId){const r=P.costProvider(()=>cats).getPrice(itemId);
  return r.status==='available'?{status:'sourced',quote:r.quote}:{status:r.reason==='price-unknown'?'unknown':r.reason==='currency'?'unsupported-currency':r.reason==='ambiguous-sku'?'ambiguous':'unavailable',quote:null};}
 /* reconcile(project, catalogs, {studioId, previous, lang})
    → {lines: FloorPlanBudgetDraft line descriptors, report: per-item facts, orphans: link ids of deleted objects}. */
 function reconcile(project,catalogs,{studioId=null,previous=null,lang='es'}={}){
  const cats=validCatalogs(catalogs),{active,orphans}=P.links(project),groups=new Map();
  for(const [objectId,l] of Object.entries(active)){
   if(!isObj(l)||!l.catalogId||!l.studioId||!l.productId||!l.sku)continue;
   const itemId=P.itemIdOf(l);const g=groups.get(itemId)||{itemId,link:l,objects:[],linkedVersions:new Set(),linkedRevisions:new Set()};
   g.objects.push(objectId);g.linkedVersions.add(l.productVersion);g.linkedRevisions.add(l.catalogRevision);groups.set(itemId,g);}
  // A budget of another project or subject never contributes items (identity by subject id, never by name).
  const own=previous&&previous.subject?.type==='project'&&previous.subject.id===project?.id;
  const prevItems=new Map(((own&&Array.isArray(previous.items))?previous.items:[]).filter(i=>isCatalogItem(i?.id)).map(i=>[i.id,i]));
  const lines=[],report=[];
  for(const g of [...groups.values()].sort((a,b)=>a.link.sku<b.link.sku?-1:a.link.sku>b.link.sku?1:a.itemId<b.itemId?-1:1)){
   const sheet=sheetOf(cats,g.link,studioId),p=sheet.product,before=prevItems.get(g.itemId);
   // XR-01: the unit comes from the sheet. Without a sheet (catalogue or sheet gone, SKU changed) the commercial unit is
   // NOT verifiable: the unit already budgeted for this item is the only evidence and is kept (a price per m² or per m
   // never comes back counted in units); with no history at all the quantity stays unknown, never «N ud».
   const rawUnit=p?.commercial?.unit||null,histUnit=!rawUnit&&before?.quantity?.unit||null;
   const unit=rawUnit?UNIT[rawUnit]||null:histUnit||'unit';
   const n=g.objects.length,countable=rawUnit?rawUnit==='ud':histUnit?histUnit==='unit':sheet.status==='found';
   const quantityStatus=countable?'counted':rawUnit?'pending-measurement':histUnit?'unit-from-history':'unit-unverifiable';
   const quantity=countable?{value:n,unit:'unit',status:'measured',complete:true,source:{type:'manual',label:countLabel(n,lang)}}
    :{value:null,unit,status:'unavailable',complete:false,source:{type:'manual',label:rawUnit?pendingLabel(rawUnit,lang):unverifiableLabel(histUnit,lang)}};
   const name=p?.displayName||g.link.displayName||g.link.sku,synthetic=p?.source?.kind==='synthetic-fixture';
   lines.push({key:g.itemId,tariffKey:null,chapter:CHAPTER,description:`${name} · ${g.link.sku}${synthetic?L(lang,' · ficha sintética QA',' · synthetic QA sheet',' · 合成测试资料'):''}`.slice(0,200),quantity,waste:0});
   const price=sheet.status==='found'?priceOf([sheet.catalog],g.itemId):{status:sheet.status==='other-studio'?'other-studio':'unavailable',quote:null};
   report.push({itemId:g.itemId,identity:P.identityOf(g.link),sku:g.link.sku,displayName:name,objects:g.objects.slice().sort(),quantity:countable?n:null,count:n,unit:quantity.unit,rawUnit:rawUnit||(histUnit?NOTATION[histUnit]:null),
    quantityStatus,retired:false,synthetic,
    sheet:{status:sheet.status,catalogRevision:sheet.catalog?.revision??null,revisionHash:sheet.catalog?.revisionHash??null,productVersion:p?.productVersion??null,vatRate:p?.commercial?.vatRate??null},
    linked:{catalogRevisions:[...g.linkedRevisions].sort(),productVersions:[...g.linkedVersions].sort(),revisionHash:g.link.revisionHash||null},
    versionChanged:!!p&&[...g.linkedVersions].some(v=>v!==p.productVersion),revisionChanged:!!sheet.catalog&&[...g.linkedRevisions].some(r=>r!==sheet.catalog.revision),
    price:{status:price.status,quote:price.quote}});
  }
  // Items whose objects are all gone: kept with 0 units only if they carry a price or a reference (undo-safe).
  for(const [id,it] of prevItems){if(groups.has(id))continue;if(it.unitPrice===null&&!it.priceReference)continue;
   const lab=L(lang,'Sin objetos en el proyecto (0 ud): se conserva el precio por si deshaces; puedes retirar la partida','No objects in the project (0 pcs): the price is kept in case you undo; you can remove the item','项目中无对象（0 件）：保留价格以便撤销；可移除此条目');
   lines.push({key:id,tariffKey:null,chapter:CHAPTER,description:it.description,quantity:{value:0,unit:it.quantity.unit,status:'measured',complete:true,source:{type:'manual',label:lab}},waste:it.wastePercent??0});
   report.push({itemId:id,identity:P.parseItemId(id),sku:it.priceReference?.code||null,displayName:it.description,objects:[],quantity:0,count:0,unit:it.quantity.unit,rawUnit:null,quantityStatus:'retired',retired:true,synthetic:false,
    sheet:{status:'not-placed',catalogRevision:null,revisionHash:null,productVersion:null,vatRate:null},linked:{catalogRevisions:[],productVersions:[],revisionHash:null},versionChanged:false,revisionChanged:false,price:{status:'unavailable',quote:null}});}
  return {version:VERSION,chapter:CHAPTER,lines,report,orphans:orphans.slice().sort()};
 }
 const sameRef=(ref,q)=>!!ref&&!!q&&ref.providerId===q.providerId&&ref.itemId===q.itemId&&ref.unitPrice===q.unitPrice&&(ref.source?.edition??null)===(q.source?.edition??null);
 /* Budget-side state of each catalogue item, read from the SAME budget document Presupuestar shows. */
 function states(budget,report){
  const items=new Map((budget?.items||[]).map(i=>[i.id,i]));
  return report.map(r=>{const it=items.get(r.itemId)||null,ref=it?.priceReference||null,q=r.price.quote,fromCatalog=ref?.providerId===PROVIDER_ID;
   let state;
   // F3 (cross-audit #237): a price (manual or applied from S2) whose item unit no longer matches the sheet unit is a
   // UNIT CONFLICT, never «applied, pending review» nor «stale»: the price stays with its unit, without amount.
   const unitConflict=!!it&&it.unitPrice!==null&&!r.retired&&!!r.unit&&it.quantity?.unit!==r.unit;
   if(!it)state='missing';
   else if(unitConflict)state='unit-conflict';
   else if(it.unitPrice!==null&&it.priceSource?.type==='provider-reference'&&fromCatalog)state=q&&!sameRef(ref,q)?'stale':it.review.status==='reviewed'?'reviewed':'applied-unreviewed';
   else if(it.unitPrice!==null)state=it.review.status==='reviewed'?'reviewed':'other-price';
   else if(fromCatalog)state=q&&!sameRef(ref,q)?'stale':'reference-kept';
   else if(r.sheet.status==='other-studio')state='other-studio';
   else if(['catalog-missing','sheet-missing','sku-changed'].includes(r.sheet.status))state='sheet-unavailable';
   else if(r.price.status==='sourced')state='sheet-price-available';
   else if(r.price.status==='ambiguous')state='ambiguous';
   else state='unknown-price';
   const sheetGone=['catalog-missing','sheet-missing','sku-changed'].includes(r.sheet.status)&&!!ref;
   return {itemId:r.itemId,state,sheetGone,activeUnitPrice:it?.unitPrice??null,reviewed:it?.review?.status==='reviewed',reference:ref?{unitPrice:ref.unitPrice,code:ref.code,label:ref.source?.label||null,asOf:ref.source?.asOf||null,edition:ref.source?.edition||null,providerId:ref.providerId}:null,
    sheetPrice:q?{unitPrice:q.unitPrice,unit:q.unit,label:q.source.label,asOf:q.source.asOf,edition:q.source.edition}:null};});
 }
 /* S2-compatible price sources (FloorPlanCostCatalog.searchAll / previewApply): one per catalogue of the current studio,
    so a SKU is unique inside its source. Read-only, no network. */
 function priceSources(catalogs,{studioId=null}={}){
  return validCatalogs(catalogs).filter(c=>!studioId||c.studioId===studioId).map((c,i)=>{
   const prov=P.costProvider(()=>[c]),dates=c.products.map(p=>p.commercial?.verifiedAt).filter(Boolean).sort();
   const source=Object.freeze({id:`src_cat_${i}_${c.studioId}_${c.catalogId}`,kind:'studio-catalog',kindLabel:'Catálogo del estudio (fichas CatalogProductV1)',label:`Mi catálogo · ${c.name||c.catalogId} · rev ${c.revision}`,providerId:PROVIDER_ID,
    edition:null,region:null,asOf:dates.at(-1)||null,license:Object.freeze({status:'not-applicable',name:null,url:null,note:'Fichas del propio estudio (piloto local)'}),attribution:null,sourceUrl:null,
    legal:Object.freeze({status:'OWN',mode:'studio-catalog'}),columns:Object.freeze([]),column:null,families:Object.freeze([...new Set(c.products.map(p=>p.family))].sort()),count:c.products.filter(p=>p.commercial?.netUnitPrice!=null).length,
    studioId:c.studioId,catalogId:c.catalogId});
   const fold=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
   return {status:'available',source,
    async search(q){const t=fold(q?.text);const items=c.products.filter(p=>!t||fold(`${p.sku} ${p.displayName} ${p.collection||''}`).includes(t))
      .map(p=>({code:p.sku,description:p.displayName,unit:p.commercial?.unit||'ud',rawUnit:p.commercial?.unit||'ud',family:p.family,itemId:P.itemIdOf({...p,studioId:c.studioId,catalogId:c.catalogId})}));return {status:'available',items};},
    async quote(code){const r=prov.getPrice(code);if(r.status==='available')return {status:'available',state:'found',quote:r.quote,family:null};
      return {status:r.status,state:r.status==='not-found'?'not-found':r.reason==='currency'?'currency-mismatch':'no-price',reason:r.reason||null};}};
  });
 }
 // Synchronous quote for one catalogue item (identity), for pre-filling the S2 comparison in Presupuestar.
 function quoteFor(catalogs,itemId){const id=P.parseItemId(itemId);if(!id)return {state:'not-found',quote:null,code:null};
  const c=validCatalogs(catalogs).find(x=>x.studioId===id.studioId&&x.catalogId===id.catalogId);if(!c)return {state:'catalog-unavailable',quote:null,code:null};
  const p=c.products.find(x=>x.productId===id.productId&&(x.variantId||null)===id.variantId);if(!p)return {state:'not-found',quote:null,code:null};
  const r=P.costProvider(()=>[c]).getPrice(itemId);return {state:r.status==='available'?'found':r.reason==='currency'?'currency-mismatch':'no-price',quote:r.quote||null,code:p.sku,catalogId:c.catalogId};}
 return Object.freeze({VERSION,CHAPTER,PREFIX,PROVIDER_ID,UNIT,isCatalogItem,reconcile,states,priceSources,quoteFor,countLabel,pendingLabel});
});
