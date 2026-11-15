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
 // Studio of the catalogue the references were taken from. rubik-visual-result-sheet/1 does not carry it (its hash must
 // not change), so RUBIK records it in the LINK entry; a link without it cannot claim «placed» or «current sheet».
 const STUDIO=/^[a-z0-9][a-z0-9-]{0,63}$/;
 function link(project,sheet,{at,studioId}={}){if(studioId!==undefined&&studioId!==null&&!STUDIO.test(String(studioId)))throw Object.assign(Error('invalid studio id'),{code:'studio'});
  const v=verify(sheet);if(!v.ok)throw Object.assign(Error('visual sheet refused: '+v.reason),{code:v.reason});
  project.extensions=isObj(project.extensions)?project.extensions:{};
  const ext=extOf(project)||{version:VERSION,refs:{}};
  if(!ext.refs[sheet.hash]&&Object.keys(ext.refs).length>=MAX_REFS)throw Object.assign(Error('too many visual references'),{code:'too-many'});
  ext.refs={...ext.refs,[sheet.hash]:{sheet:clone(sheet),projectId:project.id,linkedAt:at||new Date().toISOString(),...(studioId?{studioId:String(studioId)}:{})}};
  project.extensions[EXT]=ext;return project;
 }
 function unlink(project,hash){const ext=extOf(project);if(!ext?.refs?.[hash])return {changed:false};const refs={...ext.refs};delete refs[hash];project.extensions[EXT]={version:VERSION,refs};return {changed:true};}
 // What Presupuestar and the assistant may read: statuses only, never an amount.
 function list(project,{catalogs=[],studioId=null}={}){
  const ext=extOf(project);if(!ext)return [];
  const active=Object.values(P.links(project).active),idOf=x=>`${x.catalogId}|${x.productId}|${x.variantId||'-'}`;
  return Object.entries(ext.refs).map(([hash,e])=>{
   const s=e?.sheet,v=verify(s||{}),otherProject=e?.projectId!==project.id,refStudio=STUDIO.test(String(e?.studioId||''))?e.studioId:null;
   const status=!v.ok||s.hash!==hash?'unverifiable':otherProject?'other-project':'verified';
   const ok=status!=='unverifiable';
   return {hash,status,reason:v.ok?(s.hash!==hash?'key-mismatch':null):v.reason,linkedAt:e?.linkedAt||null,
    decision:ok?s.decision:null,resultKind:ok?s.result?.kind:null,simulated:ok?s.result?.kind==='simulated':null,deliverable:ok?!!s.deliverable:false,label:ok?s.label:null,
    review:ok?{status:s.review?.status||null,reasons:(s.review?.reasons||[]).slice(0,10)}:null,recipe:ok?{id:s.recipe?.recipeId||s.request?.recipeId||null,zone:s.request?.zone||null,intensity:s.request?.intensity||null}:null,
    generatedAt:ok?s.generatedAt:null,skuCertified:false,monetary:false,
    references:ok?(s.references||[]).map(r=>{
     // Placement and sheet are checked ONLY within the studio of the link: same catalogue/product/variant ids in another
     // studio are a different product. Without a studio the relation is ambiguous and nothing is claimed.
     const same=active.filter(a=>idOf(a)===idOf(r)),placedStatus=!same.length?'not-placed':!refStudio?'ambiguous':same.some(a=>a.studioId===refStudio)?'placed':'not-placed';
     const cat=refStudio?(catalogs||[]).find(c=>c.studioId===refStudio&&c.catalogId===r.catalogId):null;const prod=cat?.products?.find(p=>p.productId===r.productId&&(p.variantId||null)===(r.variantId||null));
     const catalogStatus=!refStudio?'studio-unknown':studioId&&studioId!==refStudio?'other-studio':!cat?'catalog-missing':!prod?'sheet-missing':cat.revision===r.catalogRevision?'current':'older-revision';
     return {sku:r.sku,displayName:r.displayName,catalogId:r.catalogId,catalogRevision:r.catalogRevision,productId:r.productId,variantId:r.variantId??null,imageSha256:r.imageSha256,studioId:refStudio,
      placed:placedStatus==='placed',placedStatus,catalogStatus};}):[]};
  }).sort((a,b)=>String(a.linkedAt).localeCompare(String(b.linkedAt)));
 }
 return Object.freeze({EXT,VERSION,MAX_REFS,verify,link,unlink,list});
});
