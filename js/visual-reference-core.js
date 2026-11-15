/* CAT-04 · «Estudio de imágenes» → referencias visuales del proyecto (pure, no DOM, no network, no storage).
   A visual result sheet (rubik-visual-result-sheet/1, RubikVisualReform.resultSheet) can be LINKED explicitly to the
   open project. What is kept is METADATA ONLY — the sheet itself (recipe, request, review, decision, product
   references by catalogue/revision/SKU and image SHA-256, the photo's SHA-256 with metadata removed) and its hash —
   in project.extensions['x-cat04-visual-refs'], so it travels with the project export/import and with undo. No
   photo, pixels, EXIF, data: URI or personal data is ever stored; a sheet carrying any of them is refused.
   Reading a link re-verifies the hash (canonical body, same algorithm as the studio) and tells, per reference,
   whether that product is PLACED in the project (a CAT-03 link with the same identity) and whether the catalogue
   revision is still the current one. A visual reference never creates a budget amount, never certifies a SKU by
   resemblance, and a simulation is never a commercial or deliverable image.
   UMD: window.RubikVisualReferences / module.exports. */
(function(root,factory){
 const node=typeof module==='object'&&module.exports;
 const deps=node?{V:require('./visual-reform-core.js'),C:require('./catalog-product-core.js'),P:require('./catalog-placement-core.js')}:{V:root.RubikVisualReform,C:root.RubikCatalogProduct,P:root.RubikCatalogPlacement};
 const api=factory(deps);if(node)module.exports=api;else root.RubikVisualReferences=api;
})(typeof self!=='undefined'?self:this,function(deps){
 'use strict';
 const {V,C,P}=deps;if(!V||!C||!P)throw Error('RubikVisualReferences requires RubikVisualReform, RubikCatalogProduct and RubikCatalogPlacement.');
 const EXT='x-cat04-visual-refs',VERSION=1,MAX_REFS=50;
 const isObj=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
 const clone=v=>JSON.parse(JSON.stringify(v));
 const bodyOf=sheet=>{const {hash,...body}=sheet;return body;};
 // Any binary/image payload or obvious personal metadata anywhere in the sheet → refused.
 function leaks(v,path=''){if(typeof v==='string'){if(/^data:|base64,/i.test(v)||v.length>4000)return path||'value';return null;}
  if(Array.isArray(v)){for(let i=0;i<v.length;i++){const r=leaks(v[i],path+'['+i+']');if(r)return r;}return null;}
  if(isObj(v)){for(const [k,x] of Object.entries(v)){if(/^(exif|gps|pixels|imageData|dataUrl|blob|base64|author|email|phone)$/i.test(k))return path+'.'+k;const r=leaks(x,path+'.'+k);if(r)return r;}}return null;}
 function verify(sheet){
  if(!isObj(sheet)||sheet.schema!==V.SHEET_SCHEMA)return {ok:false,reason:'not-a-visual-sheet'};
  if(!/^[0-9a-f]{64}$/.test(sheet.hash||''))return {ok:false,reason:'hash-missing'};
  if(sheet.source?.metadata!=='removed')return {ok:false,reason:'metadata-not-removed'};
  const leak=leaks(sheet);if(leak)return {ok:false,reason:'binary-or-personal-data',at:leak};
  if(C.sha256(V.canonical(bodyOf(sheet)))!==sheet.hash)return {ok:false,reason:'hash-mismatch'};
  return {ok:true};
 }
 const extOf=project=>{const e=project?.extensions?.[EXT];return isObj(e)&&e.version===VERSION&&isObj(e.refs)?e:null;};
 // Link (inside the editor's commit: one undo step). Idempotent by sheet hash.
 function link(project,sheet,{at}={}){
  const v=verify(sheet);if(!v.ok)throw Object.assign(Error('visual sheet refused: '+v.reason),{code:v.reason});
  project.extensions=isObj(project.extensions)?project.extensions:{};
  const ext=extOf(project)||{version:VERSION,refs:{}};
  if(!ext.refs[sheet.hash]&&Object.keys(ext.refs).length>=MAX_REFS)throw Object.assign(Error('too many visual references'),{code:'too-many'});
  ext.refs={...ext.refs,[sheet.hash]:{sheet:clone(sheet),projectId:project.id,linkedAt:at||new Date().toISOString()}};
  project.extensions[EXT]=ext;return project;
 }
 function unlink(project,hash){const ext=extOf(project);if(!ext?.refs?.[hash])return {changed:false};const refs={...ext.refs};delete refs[hash];project.extensions[EXT]={version:VERSION,refs};return {changed:true};}
 // What Presupuestar and the assistant may read: statuses only, never an amount.
 function list(project,{catalogs=[]}={}){
  const ext=extOf(project);if(!ext)return [];
  const active=Object.values(P.links(project).active),idOf=x=>`${x.catalogId}|${x.productId}|${x.variantId||'-'}`,placed=new Set(active.map(idOf));
  return Object.entries(ext.refs).map(([hash,e])=>{
   const s=e?.sheet,v=verify(s||{}),otherProject=e?.projectId!==project.id;
   const status=!v.ok||s.hash!==hash?'unverifiable':otherProject?'other-project':'verified';
   const ok=status!=='unverifiable';
   return {hash,status,reason:v.ok?(s.hash!==hash?'key-mismatch':null):v.reason,linkedAt:e?.linkedAt||null,
    decision:ok?s.decision:null,resultKind:ok?s.result?.kind:null,simulated:ok?s.result?.kind==='simulated':null,deliverable:ok?!!s.deliverable:false,label:ok?s.label:null,
    review:ok?{status:s.review?.status||null,reasons:(s.review?.reasons||[]).slice(0,10)}:null,recipe:ok?{id:s.recipe?.recipeId||s.request?.recipeId||null,zone:s.request?.zone||null,intensity:s.request?.intensity||null}:null,
    generatedAt:ok?s.generatedAt:null,skuCertified:false,monetary:false,
    references:ok?(s.references||[]).map(r=>{const cat=(catalogs||[]).find(c=>c.catalogId===r.catalogId);const prod=cat?.products?.find(p=>p.productId===r.productId&&(p.variantId||null)===(r.variantId||null));
     return {sku:r.sku,displayName:r.displayName,catalogId:r.catalogId,catalogRevision:r.catalogRevision,productId:r.productId,variantId:r.variantId??null,imageSha256:r.imageSha256,
      placed:placed.has(idOf(r)),catalogStatus:!cat?'catalog-missing':!prod?'sheet-missing':cat.revision===r.catalogRevision?'current':'older-revision'};}):[]};
  }).sort((a,b)=>String(a.linkedAt).localeCompare(String(b.linkedAt)));
 }
 return Object.freeze({EXT,VERSION,MAX_REFS,verify,link,unlink,list});
});
