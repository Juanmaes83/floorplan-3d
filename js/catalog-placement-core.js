/* CAT-03 · SKU → 3D object → budget (pure part, no DOM, no network).
   - plan(): decides how a catalogue product (CatalogProductV1) enters the project. It needs VERIFIED dimensions (a
     product with unknown or partial measures is never placed) and is never a material. The 3D representation is the
     product's model3dRef ONLY when FloorPlanAssets resolves it (same permission, SHA-256, dimensions, normalisation
     and QA rules as every model) AND its dimensions match the product within 20 mm (the loader's own tolerance).
     Otherwise it falls back to a LABELLED generic volume with the product's exact measures and says why.
   - The link lives in project.extensions['x-cat03-catalog-link'] (catalogue, revision and hash, product version, SKU,
     representation): the SKU never changes geometry, and FloorPlanProjectV1 stays the authority for size and position.
     Written through FloorPlanApp.addOwnFurniture(spec, extra): ordinary placement, one undo step, saved.
   - Budget: a read-only cost provider that follows the C1–C4 FloorPlanCostProvider contract (cost-provider.js) and
     quotes ONLY the product sheet's own price with its source and date; no price → no quote. Never from an image or
     pixels. budgetLines() counts the linked objects in the project.
   UMD: window.RubikCatalogPlacement / module.exports. */
(function(root,factory){
 const node=typeof module==='object'&&module.exports;
 const deps=node?{A:require('./asset-catalog.js'),Cost:require('./cost-provider.js'),C:require('./catalog-product-core.js')}:{A:root.FloorPlanAssets,Cost:root.FloorPlanCostProvider,C:root.RubikCatalogProduct};
 const api=factory(deps);if(node)module.exports=api;else root.RubikCatalogPlacement=api;
})(typeof self!=='undefined'?self:this,function(deps){
 'use strict';
 const {A,Cost,C}=deps;
 const EXT='x-cat03-catalog-link',VERSION=1,TOLERANCE_MM=20,PROVIDER_ID='studio-catalog';
 // Generic editor type used for the volume/selection (never changes the product's measures).
 const TYPE=Object.freeze({furniture:{mobiliario:'dresser',dormitorios:'dresser',banos:'vanity',cocinas:'cabinet',decoracion:'sidetable'},appliance:{electrodomesticos:'ovencol'},lighting:{iluminacion:'floorlamp'},fixture:{sanitarios:'toilet'}});
 const DEFAULT_TYPE=Object.freeze({furniture:'cabinet',appliance:'cabinet',lighting:'floorlamp',fixture:'cabinet'});
 const clone=v=>v==null?v:JSON.parse(JSON.stringify(v));
 const isObj=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
 function plan(product,assetEntries=[]){
  if(!isObj(product)||product.schema!==C.SCHEMA)return {ok:false,reason:'invalid-product'};
  if(product.kind==='material')return {ok:false,reason:'material-not-placeable'};
  if(product.dimensionsStatus!=='verified')return {ok:false,reason:'dimensions-unknown'};
  const d=product.dimensionsMm,type=TYPE[product.kind]?.[product.family]||DEFAULT_TYPE[product.kind]||'cabinet';
  const base={type,w:d.width,d:d.depth,h:d.height};
  let representation='generic-volume',fallbackReason=null,entry=null;
  if(!product.model3dRef)fallbackReason='no-model';
  else{entry=A.resolve(assetEntries,product.model3dRef);
   if(!entry)fallbackReason='model-not-validated'; // missing, excluded by permission/expiry/units/QA or not loaded
   else if(['width','height','depth'].some(k=>Math.abs(entry.dimensionsMm[k]-d[k])>TOLERANCE_MM)){fallbackReason='model-dimensions-mismatch';entry=null;}
   else representation='validated-model';}
  const name=representation==='validated-model'?product.displayName:`${product.displayName} · volumen genérico`;
  return {ok:true,representation,fallbackReason,spec:{...base,name:name.slice(0,80)},asset:entry?{catalog:entry.catalog,assetId:entry.id,catalogRevision:entry.revision}:null};
 }
 function linkOf(catalog,product,p,at){
  return {catalogId:catalog.catalogId,studioId:catalog.studioId,catalogRevision:catalog.revision,revisionHash:catalog.revisionHash,productId:product.productId,variantId:product.variantId||null,sku:product.sku,productVersion:product.productVersion,
   displayName:product.displayName,representation:p.representation,fallbackReason:p.fallbackReason,asset:p.asset,linkedAt:at||new Date().toISOString()};
 }
 // Called inside FloorPlanApp.addOwnFurniture's commit: link + model reference on the new object.
 function attach(project,objectId,link){
  const o=(project.objects||[]).find(x=>x.id===objectId);if(!o)throw Error('object not found');
  if(link.asset)o.assetRef={...link.asset};else delete o.assetRef;
  project.extensions=isObj(project.extensions)?project.extensions:{};
  const ext=isObj(project.extensions[EXT])&&project.extensions[EXT].version===VERSION?project.extensions[EXT]:{version:VERSION,links:{}};
  ext.links={...ext.links,[objectId]:clone(link)};project.extensions[EXT]=ext;return project;
 }
 // Links of objects that still exist (a deleted object's link is ignored and reported, never re-created).
 function links(project){
  const ext=project?.extensions?.[EXT];if(!isObj(ext)||ext.version!==VERSION||!isObj(ext.links))return {active:{},orphans:[]};
  const ids=new Set((project.objects||[]).map(o=>o.id)),active={},orphans=[];
  for(const [id,l] of Object.entries(ext.links)){if(ids.has(id))active[id]=l;else orphans.push(id);}
  return {active,orphans};
 }
 // Copy the link when the editor duplicates an object (same SKU, new object id), inside the same mutate.
 function duplicate(project,fromId,toId){const ext=project?.extensions?.[EXT];const l=ext?.links?.[fromId];if(!l)return {changed:false};ext.links[toId]={...clone(l),linkedAt:new Date().toISOString()};return {changed:true};}

 // C1–C4 cost provider: quotes the sheet's own sourced price (EUR only, as the C1–C4 contract requires).
 function costProvider(getCatalogs){
  const find=sku=>{for(const c of getCatalogs()||[])for(const p of c.products)if(p.sku===sku)return {c,p};return null;};
  return Object.freeze({id:PROVIDER_ID,
   getCapabilities(){return {search:false,getItem:false,getPrice:true,network:'none'};},
   getSourceMetadata(){return {providerId:PROVIDER_ID,label:'Catálogo del estudio',kind:'commercial',sourceName:'Fichas CatalogProductV1 (precio con fuente y fecha)',sourceUrl:null,edition:null,region:null,attribution:null,license:{status:'not-applicable',name:null,url:null}};},
   getPrice(itemId){
    const hit=find(itemId);if(!hit)return {status:'not-found',providerId:PROVIDER_ID};
    const c=hit.p.commercial;if(c.netUnitPrice==null||!c.priceSource||!c.verifiedAt)return {status:'unavailable',providerId:PROVIDER_ID,reason:'price-unknown'};
    if(c.currency!==Cost.CURRENCY)return {status:'unsupported',providerId:PROVIDER_ID,reason:'currency'};
    const quote={providerId:PROVIDER_ID,itemId,code:hit.p.sku,description:hit.p.displayName,unit:c.unit==='ud'?'u':c.unit,unitPrice:c.netUnitPrice,currency:'EUR',priceKind:'reference',
     source:{label:c.priceSource,asOf:c.verifiedAt,retrievedAt:null,licenseStatus:'not-applicable'}};
    try{return {status:'available',providerId:PROVIDER_ID,quote:Cost.validateQuote(quote,PROVIDER_ID)};}catch{return {status:'invalid',providerId:PROVIDER_ID,reason:'invalid-quote'};}
   }});
 }
 // Budget lines from the project's linked objects (quantity = number of objects with that SKU).
 function budgetLines(project,getCatalogs){
  const prov=costProvider(getCatalogs),{active}=links(project),bySku=new Map();
  for(const [id,l] of Object.entries(active)){const e=bySku.get(l.sku)||{sku:l.sku,displayName:l.displayName,objects:[],quantity:0,linkedVersions:new Set()};e.objects.push(id);e.quantity++;e.linkedVersions.add(l.productVersion);bySku.set(l.sku,e);}
  const lines=[];let total=0;
  for(const e of bySku.values()){
   const r=prov.getPrice(e.sku),cur=(getCatalogs()||[]).flatMap(c=>c.products).find(p=>p.sku===e.sku);
   const versionChanged=!!cur&&[...e.linkedVersions].some(v=>v!==cur.productVersion);
   const line={sku:e.sku,description:e.displayName,quantity:e.quantity,objects:e.objects,status:r.status==='available'?'sourced':r.status==='not-found'?'catalog-missing':'no-price',versionChanged,
    unit:r.quote?.unit||null,unitPrice:r.quote?.unitPrice??null,currency:r.quote?.currency||null,source:r.quote?.source||null,vatRate:cur?.commercial.vatRate??null,
    subtotal:r.status==='available'?Math.round(r.quote.unitPrice*e.quantity*100)/100:null};
   if(line.subtotal!=null)total+=line.subtotal;lines.push(line);
  }
  lines.sort((a,b)=>a.sku<b.sku?-1:1);
  return {lines,netTotal:Math.round(total*100)/100,currency:'EUR',complete:lines.every(l=>l.status==='sourced'),excluded:lines.filter(l=>l.status!=='sourced').map(l=>l.sku),
   basis:'precio de la ficha con fuente y fecha; nunca desde imágenes; sin IVA'};
 }
 return Object.freeze({EXT,VERSION,TOLERANCE_MM,PROVIDER_ID,TYPE,plan,linkOf,attach,links,duplicate,costProvider,budgetLines});
});
