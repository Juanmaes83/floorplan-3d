/* CAT-02 · CatalogProductV1: professional catalogues of products and variants (pure part, no I/O, no DOM).
   docs/cat-ia/00-inventario-firmado-2026-11-14.md and docs/cat-ia/01-contratos-v1.md.
   - Authorities stay separate: a product sheet identifies a product (SKU, variant, measured dimensions, dated price)
     but never edits FloorPlanProjectV1 and never proves that an image reproduces it.
   - Unknown is a value: a missing dimension or price is null and is shown as «no verificada»/«desconocido»; zero,
     guesses and «en stock» without a dated source are rejected.
   - Brand honesty: synthetic fixtures carry a synthetic brand; a third-party mark needs a documented source and
     affiliation stays «none» unless an authorized-brand source with proof says otherwise.
   - Versioning: every accepted change produces a new catalogue revision with a SHA-256 of the canonical products and a
     new productVersion; selections and sheets are frozen snapshots that later edits cannot change.
   - Storage: the pilot keeps catalogues in the browser of one professional («local-pilot»). Studio scoping here is a
     logical guard against mix-ups, NOT access control: real isolation between studios needs GOV-06a and a private store.
   UMD: window.RubikCatalogProduct in the browser, module.exports in Node tests. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.RubikCatalogProduct=api;})(typeof self!=='undefined'?self:this,function(){
 'use strict';
 const SCHEMA='rubik-catalog-product/1',CATALOG_SCHEMA='rubik-catalog/1',SHEET_SCHEMA='rubik-catalog-sheet/1',SELECTION_SCHEMA='rubik-catalog-selection/1',COLLECTION_SCHEMA='rubik-catalog-collection/1';
 const ASSISTANT_INTERFACE='CatalogCapabilitiesForAssistantV1',STORAGE_PREFIX='rubik-cat-ia-catalogs-v1:';
 const FAMILIES=Object.freeze(['cocinas','electrodomesticos','encimeras','mobiliario','dormitorios','banos','sanitarios','pavimentos','revestimientos','iluminacion','carpinterias','decoracion','textiles']);
 // Plausible range per kind, in millimetres (a check against typos and swapped units, not a product rule).
 const KINDS=Object.freeze({furniture:[50,6000],appliance:[150,2500],material:[1,4000],lighting:[20,3000],fixture:[50,3000]});
 const SOURCES=Object.freeze(['synthetic-fixture','retailer','client','authorized-brand']);
 const BRAND_KINDS=Object.freeze(['synthetic','own','third-party']);
 const REVIEW=Object.freeze(['DRAFT','REVIEWED','APPROVED','REJECTED']);
 const AVAILABILITY=Object.freeze(['unknown','in-stock','on-order','discontinued']);
 const CURRENCIES=Object.freeze(['EUR','USD']),PRICE_UNITS=Object.freeze(['ud','m2','ml']);
 const IMAGE_SCOPES=Object.freeze(['catalog-sheet','reference-image','qa','review-preview','commercial-delivery']);
 // Well-known third-party marks. A product may name one only as a documented third-party brand, never as synthetic
 // or own, and never with an official affiliation that has no proof.
 const THIRD_PARTY_MARKS=Object.freeze(['ikea','bosch','siemens','samsung','lg','balay','neff','miele','whirlpool','electrolux','aeg','smeg','teka','franke','roca','porcelanosa','silestone','cosentino','dekton','grohe','hansgrohe','zanussi','beko','haier','gorenje','leroy merlin','apple','philips','gaggenau','liebherr','fagor','candy','hotpoint','kave home','maisons du monde']);
 const LIMITS=Object.freeze({text:120,description:600,ref:200,products:500,images:3,batch:200});
 const MESSAGES=Object.freeze({
  'invalid-shape':['La ficha no es un objeto válido.','The sheet is not a valid object.','产品资料格式无效。'],
  'required':['Falta un dato obligatorio.','A required field is missing.','缺少必填项。'],
  'invalid-id':['Identificador no válido (minúsculas, cifras y guiones).','Invalid identifier (lower case, digits and hyphens).','标识无效。'],
  'invalid-sku':['SKU no válido (A–Z, 0–9, «.», «-», «_»).','Invalid SKU (A–Z, 0–9, «.», «-», «_»).','SKU 无效。'],
  'invalid-enum':['Valor fuera de la lista permitida.','Value outside the allowed list.','值不在允许列表中。'],
  'dimension-invalid':['Medida no válida: debe ser mayor que 0 mm o quedar desconocida.','Invalid dimension: it must be above 0 mm or stay unknown.','尺寸无效。'],
  'dimension-implausible':['Medida incongruente con este tipo de producto (¿unidades?).','Dimension not plausible for this kind of product (units?).','尺寸与产品类型不符。'],
  'dimensions-without-provenance':['Las medidas necesitan su procedencia.','Dimensions need their provenance.','尺寸需要来源。'],
  'price-invalid':['Precio no válido: mayor que 0 o desconocido (nunca 0 ficticio).','Invalid price: above 0 or unknown (never a fictitious 0).','价格无效。'],
  'price-without-source':['El precio necesita su fuente.','The price needs its source.','价格需要来源。'],
  'price-without-date':['El precio necesita la fecha en que se comprobó.','The price needs the date it was checked.','价格需要核实日期。'],
  'vat-invalid':['IVA no válido (entre 0 y 30 %).','Invalid VAT (0 to 30 %).','增值税无效。'],
  'date-invalid':['Fecha no válida o futura.','Invalid or future date.','日期无效或在未来。'],
  'availability-unverified':['La disponibilidad sólo puede afirmarse con fuente y fecha.','Availability can only be stated with a source and date.','库存状态需要来源和日期。'],
  'image-permission':['Imagen sin permiso documentado para fichas de catálogo.','Image without documented permission for catalogue sheets.','图片缺少目录使用授权。'],
  'image-invalid':['Imagen no válida (ruta, tipo o huella SHA-256).','Invalid image (path, type or SHA-256).','图片无效。'],
  'license-expired':['La licencia ha caducado.','The licence has expired.','许可证已过期。'],
  'brand-misattributed':['Marca de terceros usada como propia o sintética.','Third-party mark used as own or synthetic.','第三方品牌被误标。'],
  'brand-without-source':['Una marca de terceros necesita una fuente documentada.','A third-party brand needs a documented source.','第三方品牌需要来源。'],
  'affiliation-without-proof':['No se puede declarar afiliación oficial sin prueba de la marca.','An official affiliation cannot be claimed without proof from the brand.','无证明不得声明官方合作。'],
  'url-invalid':['Enlace no válido: sólo https://, sin usuario ni contraseña.','Invalid link: https:// only, no user or password.','链接无效。'],
  'model-ref-invalid':['Referencia 3D no válida.','Invalid 3D reference.','三维引用无效。'],
  'sku-duplicate':['Ese SKU ya existe en el catálogo para otro producto o variante.','That SKU already exists in the catalogue for another product or variant.','该 SKU 已用于其他产品或款式。'],
  'variant-contradictory':['Variante contradictoria: las variantes de un producto comparten familia, tipo, fabricante y marca.','Contradictory variant: variants of a product share family, kind, manufacturer and brand.','款式矛盾。'],
  'catalog-mismatch':['La ficha pertenece a otro catálogo.','The sheet belongs to another catalogue.','资料属于其他目录。'],
  'studio-mismatch':['El catálogo pertenece a otro estudio.','The catalogue belongs to another studio.','目录属于其他工作室。'],
  'too-many':['Demasiados elementos.','Too many items.','条目过多。']
 });

 // ---- small helpers ---------------------------------------------------------------------------------------------
 const isObj=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
 const clean=(v,max=LIMITS.text)=>String(v??'').replace(/[\u0000-\u001f\u007f\u2028\u2029]/g,' ').replace(/\s+/g,' ').trim().slice(0,max);
 const slug=v=>typeof v==='string'&&/^[a-z0-9][a-z0-9-]{1,63}$/.test(v);
 const fold=v=>String(v||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
 const isDate=v=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v)&&!Number.isNaN(Date.parse(v+'T00:00:00Z'));
 const todayOf=t=>isDate(t)?t:new Date().toISOString().slice(0,10);
 function canonical(v){if(Array.isArray(v))return '['+v.map(canonical).join(',')+']';if(isObj(v))return '{'+Object.keys(v).sort().filter(k=>v[k]!==undefined).map(k=>JSON.stringify(k)+':'+canonical(v[k])).join(',')+'}';return JSON.stringify(v===undefined?null:v);}
 function deepFreeze(v){if(v&&typeof v==='object'&&!Object.isFrozen(v)){Object.freeze(v);for(const k of Object.keys(v))deepFreeze(v[k]);}return v;}
 const copy=v=>v==null?v:JSON.parse(JSON.stringify(v));
 // Synchronous SHA-256 (FIPS 180-4) so revisions, selections and sheets carry a verifiable hash without async I/O.
 const K=new Uint32Array([0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2]);
 function sha256(input){
  const msg=typeof input==='string'?new TextEncoder().encode(input):input,len=msg.length,blocks=((len+9+63)>>6)<<6,buf=new Uint8Array(blocks);buf.set(msg);buf[len]=0x80;
  const bits=len*8,dv=new DataView(buf.buffer);dv.setUint32(blocks-4,bits>>>0);dv.setUint32(blocks-8,Math.floor(bits/4294967296));
  const H=new Uint32Array([0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19]),W=new Uint32Array(64),r=(x,n)=>(x>>>n)|(x<<(32-n));
  for(let o=0;o<blocks;o+=64){for(let i=0;i<16;i++)W[i]=dv.getUint32(o+i*4);for(let i=16;i<64;i++){const s0=r(W[i-15],7)^r(W[i-15],18)^(W[i-15]>>>3),s1=r(W[i-2],17)^r(W[i-2],19)^(W[i-2]>>>10);W[i]=(W[i-16]+s0+W[i-7]+s1)>>>0;}
   let[a,b,c,d,e,f,g,h]=H;for(let i=0;i<64;i++){const t1=(h+(r(e,6)^r(e,11)^r(e,25))+((e&f)^(~e&g))+K[i]+W[i])>>>0,t2=((r(a,2)^r(a,13)^r(a,22))+((a&b)^(a&c)^(b&c)))>>>0;h=g;g=f;f=e;e=(d+t1)>>>0;d=c;c=b;b=a;a=(t1+t2)>>>0;}
   H[0]+=a;H[1]+=b;H[2]+=c;H[3]+=d;H[4]+=e;H[5]+=f;H[6]+=g;H[7]+=h;}
  return Array.from(H,x=>x.toString(16).padStart(8,'0')).join('');
 }
 const hashOf=v=>sha256(canonical(v));
 function markIn(...texts){const all=' '+fold(texts.join(' ')).replace(/[^a-z0-9]+/g,' ')+' ';return THIRD_PARTY_MARKS.find(m=>all.includes(' '+m+' '))||null;}
 function httpsUrl(v){if(v==null||v==='')return {ok:true,value:null};let u;try{u=new URL(String(v));}catch{return {ok:false};}if(u.protocol!=='https:'||u.username||u.password)return {ok:false};return {ok:true,value:u.href};}

 // ---- CatalogProductV1 validation -------------------------------------------------------------------------------
 function validateProduct(input,{catalogId,today}={}){
  const errors=[],err=(field,code)=>errors.push({field,code,message:MESSAGES[code][0]}),day=todayOf(today);
  if(!isObj(input)){err('product','invalid-shape');return {ok:false,errors};}
  const p=input,out={schema:SCHEMA};
  const id=(field,{optional=false}={})=>{const v=p[field];if(v==null||v===''){if(!optional)err(field,'required');return null;}if(!slug(v)){err(field,'invalid-id');return null;}return v;};
  const text=(field,{required=true,max}={})=>{const v=clean(p[field],max);if(!v&&required)err(field,'required');return v||null;};
  const oneOf=(field,list,value,fallback)=>{const v=value===undefined?fallback:value;if(!list.includes(v)){err(field,'invalid-enum');return fallback??null;}return v;};
  const date=(field,v,{future=false}={})=>{if(v==null||v==='')return null;if(!isDate(v)||(!future&&v>day)){err(field,'date-invalid');return null;}return v;};
  out.catalogId=id('catalogId');if(catalogId&&out.catalogId&&out.catalogId!==catalogId)err('catalogId','catalog-mismatch');
  out.productId=id('productId');out.variantId=id('variantId',{optional:true});
  if(p.sku==null||p.sku==='')err('sku','required');else if(typeof p.sku!=='string'||!/^[A-Z0-9][A-Z0-9._-]{0,63}$/.test(p.sku))err('sku','invalid-sku');out.sku=typeof p.sku==='string'?p.sku:null;
  out.displayName=text('displayName');out.manufacturer=text('manufacturer');out.brand=text('brand');out.collection=text('collection',{required:false});out.description=text('description',{required:false,max:LIMITS.description});
  out.brandKind=oneOf('brandKind',BRAND_KINDS,p.brandKind);out.family=oneOf('family',FAMILIES,p.family);out.kind=oneOf('kind',Object.keys(KINDS),p.kind);
  // Source and brand honesty.
  const src=isObj(p.source)?p.source:{};out.source={kind:oneOf('source.kind',SOURCES,src.kind),ref:clean(src.ref,LIMITS.ref)||null,proofRef:clean(src.proofRef,LIMITS.ref)||null};
  out.affiliation=oneOf('affiliation',['none','official'],p.affiliation,'none');
  const mark=markIn(out.brand||'',out.manufacturer||'',out.displayName||'',out.collection||'');
  if(mark&&out.brandKind!=='third-party')err('brand','brand-misattributed');
  if(out.brandKind==='synthetic'&&out.source.kind!=='synthetic-fixture')err('brandKind','invalid-enum');
  if(out.source.kind==='synthetic-fixture'&&out.brandKind!=='synthetic')err('brandKind','invalid-enum');
  if(out.brandKind==='third-party'&&(!['retailer','client','authorized-brand'].includes(out.source.kind)||!out.source.ref))err('source','brand-without-source');
  if(out.affiliation==='official'&&(out.source.kind!=='authorized-brand'||!out.source.proofRef))err('affiliation','affiliation-without-proof');
  // Dimensions: each value is a positive number or null; any number needs its provenance.
  const d=isObj(p.dimensionsMm)?p.dimensionsMm:{},range=KINDS[out.kind]||[1,20000];out.dimensionsMm={};
  for(const k of ['width','height','depth']){const v=d[k];if(v==null){out.dimensionsMm[k]=null;continue;}if(typeof v!=='number'||!Number.isFinite(v)||v<=0||v>20000){err('dimensionsMm.'+k,'dimension-invalid');out.dimensionsMm[k]=null;continue;}if(v<range[0]||v>range[1])err('dimensionsMm.'+k,'dimension-implausible');out.dimensionsMm[k]=Math.round(v);}
  const known=Object.values(out.dimensionsMm).filter(v=>v!=null).length;
  out.dimensionsProvenance=clean(p.dimensionsProvenance,LIMITS.ref)||null;if(known&&!out.dimensionsProvenance)err('dimensionsProvenance','dimensions-without-provenance');
  out.dimensionsStatus=known===3&&out.dimensionsProvenance?'verified':known?'partial':'unknown';
  // Technical sheet.
  const ts=isObj(p.technicalSheet)?p.technicalSheet:{},tsUrl=httpsUrl(ts.url);if(!tsUrl.ok)err('technicalSheet.url','url-invalid');
  out.technicalSheet={url:tsUrl.ok?tsUrl.value:null,version:clean(ts.version,40)||null,verifiedAt:date('technicalSheet.verifiedAt',ts.verifiedAt)};
  // Commercial data: a price is either unknown (null) or positive with source and date.
  const c=isObj(p.commercial)?p.commercial:{};out.commercial={currency:oneOf('commercial.currency',CURRENCIES,c.currency,'EUR'),unit:oneOf('commercial.unit',PRICE_UNITS,c.unit,'ud'),netUnitPrice:null,vatRate:null,priceSource:clean(c.priceSource,LIMITS.ref)||null,verifiedAt:date('commercial.verifiedAt',c.verifiedAt)};
  if(c.netUnitPrice!=null){if(typeof c.netUnitPrice!=='number'||!Number.isFinite(c.netUnitPrice)||c.netUnitPrice<=0||c.netUnitPrice>1e7)err('commercial.netUnitPrice','price-invalid');else{out.commercial.netUnitPrice=Math.round(c.netUnitPrice*100)/100;if(!out.commercial.priceSource)err('commercial.priceSource','price-without-source');if(!out.commercial.verifiedAt)err('commercial.verifiedAt','price-without-date');}}
  if(c.vatRate!=null){if(typeof c.vatRate!=='number'||!(c.vatRate>=0&&c.vatRate<=0.3))err('commercial.vatRate','vat-invalid');else out.commercial.vatRate=c.vatRate;}
  out.commercial.priceStatus=out.commercial.netUnitPrice==null?'unknown':'sourced';
  // Availability is unknown unless a dated source says otherwise.
  const a=isObj(p.availability)?p.availability:{};out.availability={status:oneOf('availability.status',AVAILABILITY,a.status,'unknown'),source:clean(a.source,LIMITS.ref)||null,verifiedAt:date('availability.verifiedAt',a.verifiedAt)};
  if(out.availability.status!=='unknown'&&(!out.availability.source||!out.availability.verifiedAt))err('availability','availability-unverified');
  // Data licence of the sheet itself.
  const lic=isObj(p.license)?p.license:{};out.license={scope:Array.isArray(lic.scope)?lic.scope.filter(s=>IMAGE_SCOPES.includes(s)):[],proofRef:clean(lic.proofRef,LIMITS.ref)||null,expiresAt:date('license.expiresAt',lic.expiresAt,{future:true})};
  if(!out.license.proofRef||!out.license.scope.includes('catalog-sheet'))err('license','image-permission');
  if(out.license.expiresAt&&out.license.expiresAt<day)err('license.expiresAt','license-expired');
  // Images: 0–3, each with its own documented permission for catalogue sheets.
  const imgs=Array.isArray(p.imageRefs)?p.imageRefs:[];if(imgs.length>LIMITS.images)err('imageRefs','too-many');out.imageRefs=[];
  imgs.slice(0,LIMITS.images).forEach((im,i)=>{const f='imageRefs.'+i;if(!isObj(im)){err(f,'image-invalid');return;}
   const pathOk=typeof im.path==='string'&&/^assets\/cat-ia\/fixtures\/[a-z0-9][a-z0-9.-]{0,80}\.(png|jpg|webp)$/.test(im.path)&&!im.path.includes('..');
   const type={png:'image/png',jpg:'image/jpeg',webp:'image/webp'}[String(im.path||'').split('.').pop()];
   if(!slug(im.assetId)||!pathOk||im.mediaType!==type||typeof im.sha256!=='string'||!/^[0-9a-f]{64}$/.test(im.sha256)){err(f,'image-invalid');return;}
   const l=isObj(im.license)?im.license:{},scope=Array.isArray(l.scope)?l.scope.filter(s=>IMAGE_SCOPES.includes(s)):[];
   if(!['own','licensed'].includes(im.usageRights)||!clean(l.proofRef)||!scope.includes('catalog-sheet')){err(f,'image-permission');return;}
   const exp=l.expiresAt==null?null:isDate(l.expiresAt)?l.expiresAt:'bad';if(exp==='bad'){err(f+'.license.expiresAt','date-invalid');return;}if(exp&&exp<day){err(f+'.license.expiresAt','license-expired');return;}
   out.imageRefs.push({assetId:im.assetId,path:im.path,mediaType:type,sha256:im.sha256,usageRights:im.usageRights,alt:clean(im.alt)||out.displayName,license:{scope,proofRef:clean(l.proofRef,LIMITS.ref),expiresAt:exp,attribution:clean(l.attribution,LIMITS.ref)||null}});});
  // Optional link to a validated 3D asset (CAT-03 resolves it through FloorPlanAssets; nothing is loaded here).
  if(p.model3dRef==null)out.model3dRef=null;else{const m=p.model3dRef;if(!isObj(m)||!/^[a-z0-9][a-z0-9-]{2,63}$/.test(m.catalog||'')||!/^[a-z0-9][a-z0-9-]{2,127}$/.test(m.assetId||'')||(m.catalogRevision!=null&&!/^[0-9a-f]{40}$/.test(m.catalogRevision))){err('model3dRef','model-ref-invalid');out.model3dRef=null;}else out.model3dRef={catalog:m.catalog,assetId:m.assetId,catalogRevision:m.catalogRevision||null};}
  out.reviewStatus=oneOf('reviewStatus',REVIEW,p.reviewStatus,'DRAFT');
  return errors.length?{ok:false,errors}:{ok:true,product:out};
 }
 const keyOf=p=>p.productId+'@'+(p.variantId||'-');
 const contentOf=p=>{const{productVersion,updatedAt,...rest}=p;return rest;};

 // ---- catalogues -------------------------------------------------------------------------------------------------
 function createCatalog({catalogId,studioId,name,at}={}){
  if(!slug(catalogId))throw Error('invalid catalogId');if(!slug(studioId))throw Error('invalid studioId');
  const products=[];return {schema:CATALOG_SCHEMA,scope:'local-pilot',catalogId,studioId,name:clean(name)||catalogId,revision:0,revisionHash:hashOf(products),createdAt:at||new Date().toISOString(),products,history:[]};
 }
 function checkCatalog(c){if(!isObj(c)||c.schema!==CATALOG_SCHEMA||!slug(c.catalogId)||!slug(c.studioId)||!Array.isArray(c.products))throw Error('invalid catalog');}
 // Import a batch atomically per item: valid items enter (new or a new version), invalid ones are reported with
 // their codes. A new revision is produced only if something changed.
 function importCollection(catalog,items,{today,at}={}){
  checkCatalog(catalog);const list=Array.isArray(items)?items:isObj(items)&&items.schema===COLLECTION_SCHEMA&&Array.isArray(items.products)?items.products:null;
  if(!list)throw Error('invalid collection');if(list.length>LIMITS.batch)throw Error('collection too large');
  const now=at||new Date().toISOString(),products=catalog.products.map(copy),accepted=[],rejected=[],added=[],updated=[],unchanged=[];
  list.forEach((item,index)=>{
   const r=validateProduct(item,{catalogId:catalog.catalogId,today});const ref={index,productId:isObj(item)?item.productId??null:null,variantId:isObj(item)?item.variantId??null:null,sku:isObj(item)?item.sku??null:null};
   if(!r.ok){rejected.push({...ref,errors:r.errors});return;}
   const p=r.product,k=keyOf(p),errors=[];
   const skuOwner=products.find(o=>o.sku===p.sku&&keyOf(o)!==k);if(skuOwner)errors.push({field:'sku',code:'sku-duplicate',message:MESSAGES['sku-duplicate'][0]});
   const sibling=products.find(o=>o.productId===p.productId&&keyOf(o)!==k);
   if(sibling&&['family','kind','manufacturer','brand','brandKind'].some(f=>sibling[f]!==p[f]))errors.push({field:'variantId',code:'variant-contradictory',message:MESSAGES['variant-contradictory'][0]});
   if(errors.length){rejected.push({...ref,errors});return;}
   const i=products.findIndex(o=>keyOf(o)===k);
   if(i<0){if(products.length>=LIMITS.products){rejected.push({...ref,errors:[{field:'products',code:'too-many',message:MESSAGES['too-many'][0]}]});return;}products.push({...p,productVersion:1,updatedAt:now});added.push(k);}
   else if(canonical(contentOf(products[i]))===canonical(p))unchanged.push(k);
   else{products[i]={...p,productVersion:products[i].productVersion+1,updatedAt:now};updated.push(k);}
   accepted.push(k);});
  products.sort((a,b)=>keyOf(a)<keyOf(b)?-1:1);
  const changed=added.length+updated.length>0,next={...catalog,products,history:catalog.history.map(copy)};
  if(changed){next.revision=catalog.revision+1;next.revisionHash=hashOf(products.map(contentOf));next.history.push({revision:next.revision,at:now,added,updated,revisionHash:next.revisionHash});}
  return {catalog:next,accepted,rejected,added,updated,unchanged,changed};
 }
 function findProduct(catalog,productId,variantId){return catalog.products.find(p=>p.productId===productId&&(p.variantId||null)===(variantId||null))||null;}
 function variants(catalog,productId){return catalog.products.filter(p=>p.productId===productId);}
 function search(catalog,{q,family,kind,source,price,dims,review,brandKind}={}){
  checkCatalog(catalog);const words=fold(clean(q,80)).split(' ').filter(Boolean);
  return catalog.products.filter(p=>{
   if(family&&p.family!==family)return false;if(kind&&p.kind!==kind)return false;if(source&&p.source.kind!==source)return false;if(review&&p.reviewStatus!==review)return false;if(brandKind&&p.brandKind!==brandKind)return false;
   if(price==='known'&&p.commercial.netUnitPrice==null)return false;if(price==='unknown'&&p.commercial.netUnitPrice!=null)return false;
   if(dims&&p.dimensionsStatus!==dims)return false;
   if(words.length){const hay=fold([p.displayName,p.sku,p.collection,p.brand,p.manufacturer,p.family,p.variantId].join(' '));if(!words.every(w=>hay.includes(w)))return false;}
   return true;}).map(copy);
 }
 // Frozen selection for a delivery: later catalogue edits cannot change it.
 function freezeSelection(catalog,refs,{at,projectId}={}){
  checkCatalog(catalog);if(!Array.isArray(refs)||!refs.length||refs.length>100)throw Error('invalid selection');
  const items=refs.map(r=>{const p=findProduct(catalog,r?.productId,r?.variantId);if(!p)throw Error('unknown product '+r?.productId);const quantity=r.quantity==null?1:Number(r.quantity);if(!Number.isFinite(quantity)||quantity<=0||quantity>10000)throw Error('invalid quantity');return {product:copy(p),quantity};});
  const body={schema:SELECTION_SCHEMA,studioId:catalog.studioId,catalogId:catalog.catalogId,catalogRevision:catalog.revision,revisionHash:catalog.revisionHash,projectId:projectId||null,takenAt:at||new Date().toISOString(),items};
  return deepFreeze({...body,hash:hashOf(body)});
 }

 // ---- commercial sheet -------------------------------------------------------------------------------------------
 const L=(lang,es,en,zh)=>lang==='en'?en:lang==='zh'?zh:es;
 function fmtMoney(v,cur,lang){try{return new Intl.NumberFormat(lang==='en'?'en-GB':lang==='zh'?'zh-CN':'es-ES',{style:'currency',currency:cur}).format(v);}catch{return v+' '+cur;}}
 function sheet(catalog,productId,variantId,{lang='es',brand=null,at}={}){
  checkCatalog(catalog);const p=findProduct(catalog,productId,variantId);if(!p)throw Error('unknown product');
  const unknown=L(lang,'No verificada','Not verified','未核实'),unk=L(lang,'Desconocido','Unknown','未知'),d=p.dimensionsMm;
  const dim=k=>d[k]==null?unknown:d[k]+' mm',c=p.commercial;
  const rows=[
   ['sku','SKU',p.sku,'ok'],['variant',L(lang,'Variante','Variant','款式'),p.variantId||'—','ok'],
   ['brand',L(lang,'Marca','Brand','品牌'),p.brand,'ok'],['manufacturer',L(lang,'Fabricante','Manufacturer','制造商'),p.manufacturer,'ok'],
   ['collection',L(lang,'Colección','Collection','系列'),p.collection||'—','ok'],['family',L(lang,'Familia','Family','类别'),p.family,'ok'],
   ['width',L(lang,'Ancho','Width','宽'),dim('width'),d.width==null?'unknown':'ok'],['height',L(lang,'Alto','Height','高'),dim('height'),d.height==null?'unknown':'ok'],['depth',L(lang,'Fondo','Depth','深'),dim('depth'),d.depth==null?'unknown':'ok'],
   ['dimensionsProvenance',L(lang,'Procedencia de las medidas','Dimension source','尺寸来源'),p.dimensionsProvenance||unknown,p.dimensionsProvenance?'ok':'unknown'],
   ['price',L(lang,'Precio neto','Net price','净价'),c.netUnitPrice==null?unk:fmtMoney(c.netUnitPrice,c.currency,lang)+' / '+c.unit,c.netUnitPrice==null?'unknown':'ok'],
   ['vat',L(lang,'IVA','VAT','增值税'),c.vatRate==null?unk:Math.round(c.vatRate*100)+' %',c.vatRate==null?'unknown':'ok'],
   ['priceSource',L(lang,'Fuente y fecha del precio','Price source and date','价格来源与日期'),c.netUnitPrice==null?'—':c.priceSource+' · '+c.verifiedAt,c.netUnitPrice==null?'unknown':'ok'],
   ['availability',L(lang,'Disponibilidad','Availability','库存'),p.availability.status==='unknown'?unk:p.availability.status+' · '+p.availability.source+' · '+p.availability.verifiedAt,p.availability.status==='unknown'?'unknown':'ok'],
   ['technicalSheet',L(lang,'Ficha técnica','Technical sheet','技术资料'),p.technicalSheet.url?(p.technicalSheet.url+(p.technicalSheet.version?' · v'+p.technicalSheet.version:'')):unknown,p.technicalSheet.url?'ok':'unknown'],
   ['model3d',L(lang,'Modelo 3D','3D model','三维模型'),p.model3dRef?p.model3dRef.catalog+' / '+p.model3dRef.assetId:L(lang,'Sin modelo validado','No validated model','无已验证模型'),p.model3dRef?'ok':'unknown'],
   ['review',L(lang,'Revisión','Review','审核'),p.reviewStatus,'ok'],
   ['version',L(lang,'Versión','Version','版本'),'v'+p.productVersion+' · '+L(lang,'revisión de catálogo','catalogue revision','目录修订')+' '+catalog.revision,'ok']
  ];
  const notices=[L(lang,'Ficha orientativa: producto, medidas, precio y disponibilidad deben confirmarse con la fuente indicada.','Indicative sheet: product, dimensions, price and availability must be confirmed with the stated source.','参考资料：产品、尺寸、价格和库存需与来源确认。')];
  if(p.affiliation==='none')notices.push(L(lang,'Sin afiliación con el fabricante ni la marca.','No affiliation with the manufacturer or brand.','与制造商或品牌无隶属关系。'));
  if(p.source.kind==='synthetic-fixture')notices.push(L(lang,'Fixture sintético de QA: no es un producto real a la venta.','Synthetic QA fixture: not a real product for sale.','合成测试数据：非真实在售产品。'));
  if(p.dimensionsStatus!=='verified')notices.push(L(lang,'Medidas incompletas: no usar para colocar ni presupuestar sin comprobarlas.','Incomplete dimensions: do not use for placement or budgeting until checked.','尺寸不完整：核实前请勿用于布置或预算。'));
  if(c.netUnitPrice==null)notices.push(L(lang,'Precio desconocido: no se incluye en presupuestos.','Unknown price: not included in budgets.','价格未知：不计入预算。'));
  const body={schema:SHEET_SCHEMA,lang,studioId:catalog.studioId,catalogId:catalog.catalogId,catalogName:catalog.name,catalogRevision:catalog.revision,revisionHash:catalog.revisionHash,product:copy(p),title:p.displayName,description:p.description,rows,notices,images:p.imageRefs.map(i=>({path:i.path,alt:i.alt,sha256:i.sha256,attribution:i.license.attribution})),brand:brand?copy(brand):null,generatedAt:at||new Date().toISOString()};
  return deepFreeze({...body,hash:hashOf(body)});
 }
 const esc=v=>String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[ch]);
 // Stand-alone HTML for download: no scripts, a CSP that forbids them, every value escaped, nothing truncated.
 function sheetHtml(s,{imageData={}}={}){
  if(!s||s.schema!==SHEET_SCHEMA)throw Error('invalid sheet');
  const img=s.images.map(i=>imageData[i.path]&&/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+=*$/.test(imageData[i.path])?`<figure><img src="${imageData[i.path]}" alt="${esc(i.alt)}"><figcaption>${esc(i.attribution||'')}</figcaption></figure>`:'').join('');
  const brand=s.brand?.name?`<p class="brand">${esc(s.brand.name)}${s.brand.email?' · '+esc(s.brand.email):''}${s.brand.phone?' · '+esc(s.brand.phone):''}</p>`:'';
  return `<!doctype html><html lang="${esc(s.lang)}"><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data:; style-src 'unsafe-inline'"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(s.title)} · ${esc(s.product.sku)}</title><style>body{font:14px/1.45 system-ui,sans-serif;margin:24px;color:#1d2433;background:#fff}h1{font-size:22px;margin:0 0 4px}table{border-collapse:collapse;width:100%;max-width:760px}th,td{border-bottom:1px solid #d9dee8;padding:6px 8px;text-align:left;vertical-align:top;overflow-wrap:anywhere}td.unknown{color:#8a4b00;font-style:italic}.notices{background:#fff7e6;border:1px solid #f0c36d;padding:8px 12px;max-width:740px}img{max-width:320px;height:auto;border:1px solid #d9dee8}.meta{color:#5b6475;font-size:12px}</style></head><body>${brand}<h1>${esc(s.title)}</h1><p class="meta">${esc(s.catalogName)} · rev. ${esc(s.catalogRevision)} · ${esc(s.generatedAt)} · sha256 ${esc(s.hash)}</p>${s.description?`<p>${esc(s.description)}</p>`:''}${img}<table><tbody>${s.rows.map(([k,label,value,status])=>`<tr data-k="${esc(k)}"><th>${esc(label)}</th><td class="${status==='unknown'?'unknown':''}">${esc(value)}</td></tr>`).join('')}</tbody></table><div class="notices">${s.notices.map(n=>`<p>${esc(n)}</p>`).join('')}</div></body></html>`;
 }

 // ---- local pilot storage (one professional, one browser) -------------------------------------------------------
 function loadCatalogs(storage,studioId){
  if(!slug(studioId))throw Error('invalid studioId');let raw;try{raw=JSON.parse(storage.getItem(STORAGE_PREFIX+studioId)||'null');}catch{raw=null;}
  if(!isObj(raw)||raw.version!==1||raw.studioId!==studioId||!Array.isArray(raw.catalogs))return [];
  const out=[];for(const c of raw.catalogs){try{checkCatalog(c);if(c.studioId!==studioId)continue;
   // Re-validate stored products: damaged or tampered local data never reaches the interface.
   const r=importCollection(createCatalog({catalogId:c.catalogId,studioId,name:c.name,at:c.createdAt}),c.products.map(contentOf),{today:'9999-12-31'});
   if(r.rejected.length||hashOf(c.products.map(contentOf))!==c.revisionHash)continue;out.push(c);}catch{}}
  return out;
 }
 function saveCatalog(storage,catalog){checkCatalog(catalog);const list=loadCatalogs(storage,catalog.studioId).filter(c=>c.catalogId!==catalog.catalogId);list.push(catalog);storage.setItem(STORAGE_PREFIX+catalog.studioId,JSON.stringify({version:1,studioId:catalog.studioId,catalogs:list}));return catalog;}
 function getCatalog(storage,studioId,catalogId){const c=loadCatalogs(storage,studioId).find(x=>x.catalogId===catalogId)||null;if(c&&c.studioId!==studioId){const e=Error(MESSAGES['studio-mismatch'][0]);e.code='studio-mismatch';throw e;}return c;}

 // ---- CatalogCapabilitiesForAssistantV1: read-only interface for the Assistant (owned by Claude Code 1) -----------
 function assistantCapabilities(listCatalogs){
  if(typeof listCatalogs!=='function')throw Error('listCatalogs required');
  const cats=()=>(listCatalogs()||[]).filter(c=>{try{checkCatalog(c);return true;}catch{return false;}});
  const api={version:ASSISTANT_INTERFACE,readOnly:true,
   listCatalogs:()=>cats().map(c=>({catalogId:c.catalogId,name:c.name,revision:c.revision,revisionHash:c.revisionHash,products:c.products.length})),
   search:(catalogId,params)=>{const c=cats().find(x=>x.catalogId===catalogId);return c?search(c,params):[];},
   sheet:(catalogId,productId,variantId,opts)=>{const c=cats().find(x=>x.catalogId===catalogId);return c?sheet(c,productId,variantId,opts):null;},
   limits:Object.freeze(['read-only','no-prices-from-images','no-affiliation-claims','no-project-writes'])};
  return Object.freeze(api);
 }

 return Object.freeze({SCHEMA,CATALOG_SCHEMA,SHEET_SCHEMA,SELECTION_SCHEMA,COLLECTION_SCHEMA,ASSISTANT_INTERFACE,STORAGE_PREFIX,FAMILIES,KINDS,SOURCES,BRAND_KINDS,REVIEW,AVAILABILITY,CURRENCIES,PRICE_UNITS,IMAGE_SCOPES,THIRD_PARTY_MARKS,LIMITS,MESSAGES,
  sha256,canonical,hashOf,markIn,validateProduct,createCatalog,importCollection,findProduct,variants,search,freezeSelection,sheet,sheetHtml,loadCatalogs,saveCatalog,getCatalog,assistantCapabilities,keyOf});
});
