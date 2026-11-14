/* CAT-01 + FOT-01 visual · «Estudio de imágenes» (pure part, no DOM, no network). Shared by the browser and by
   api/photo-reform.js so the server writes the instructions from the SAME closed lists the screen offers.
   - PromptRecipeV1: versioned recipes (kitchen-catalog-faithful, bath-product-fidelity, furniture-showcase,
     finish-material-match, lighting-catalog, developer-showroom) with allowed zones, catalogue families, intensities,
     reference count, providers and the invariants that are ALWAYS preserved. compile() builds the provider text from
     closed tokens only: no catalogue text (names, SKUs, descriptions), no file name and no free text ever reaches it,
     so a product name cannot inject instructions.
   - Zones are reviewable rectangles on the image (normalised 0–1). Outside them the image must not change.
   - Fidelity review: an automatic measure of what changed outside the zone (pixel difference) plus the professional's
     checks (openings intact, geometry intact). A result that erases or alters windows/doors or changes outside the zone
     beyond the tolerance of the chosen intensity is RECHAZADA and cannot be delivered. Resemblance to a reference never
     certifies the SKU.
   - Result sheet: frozen, hashed record of source, recipe, zone, references (catalogue revision and licence), result,
     review and decision. The project (FloorPlanProjectV1) is never touched.
   UMD: window.RubikVisualReform in the browser, module.exports in Node. */
(function(root,factory){const sha=typeof module==='object'&&module.exports?require('./catalog-product-core.js').sha256:(...a)=>root.RubikCatalogProduct.sha256(...a);const api=factory(sha);if(typeof module==='object'&&module.exports)module.exports=api;else root.RubikVisualReform=api;})(typeof self!=='undefined'?self:this,function(sha256){
 'use strict';
 const VERSION=1,SHEET_SCHEMA='rubik-visual-result-sheet/1',RECIPE_SCHEMA='PromptRecipeV1';
 const L=(es,en,zh)=>Object.freeze({es,en,zh});
 const ZONES=Object.freeze({
  floor:{label:L('Suelo','Floor','地面'),en:'the floor surface'},
  walls:{label:L('Paredes','Walls','墙面'),en:'the wall surfaces'},
  ceiling:{label:L('Techo','Ceiling','天花'),en:'the ceiling surface'},
  cabinetry:{label:L('Frentes de cocina','Kitchen fronts','橱柜门板'),en:'the kitchen cabinet fronts'},
  worktop:{label:L('Encimera','Worktop','台面'),en:'the worktop surface'},
  appliance:{label:L('Electrodoméstico','Appliance','家电'),en:'the appliance'},
  furniture:{label:L('Mueble','Furniture','家具'),en:'the piece of furniture'},
  lighting:{label:L('Iluminación','Lighting','照明'),en:'the light fittings'}});
 // Always preserved (the professional cannot untick them) and optionally preserved.
 const PRESERVE_MANDATORY=Object.freeze(['camera','walls','windows','doors','openings','installations']);
 const PRESERVE_OPTIONAL=Object.freeze(['furniture-layout','floor','ceiling']);
 const PRESERVE_LABEL=Object.freeze({camera:L('Encuadre y perspectiva','Framing and perspective','取景与透视'),walls:L('Muros y su posición','Walls and their position','墙体及位置'),windows:L('Ventanas','Windows','窗户'),doors:L('Puertas','Doors','门'),
  openings:L('Huecos y pasos','Openings','洞口'),installations:L('Instalaciones visibles','Visible installations','可见设施'),'furniture-layout':L('Posición del mobiliario','Furniture positions','家具位置'),floor:L('Suelo','Floor','地面'),ceiling:L('Techo','Ceiling','天花')});
 const PRESERVE_EN=Object.freeze({camera:'the camera position and perspective',walls:'every wall and its position',windows:'every window',doors:'every door',openings:'every opening and passage',installations:'visible installations (sockets, pipes, radiators, vents)','furniture-layout':'the position of every piece of furniture',floor:'the floor',ceiling:'the ceiling'});
 const INTENSITY=Object.freeze({
  faithful:{label:L('Fiel','Faithful','忠实'),en:'Change as little as possible: only the marked zone, matching the reference closely.',outsideTolerance:0.01},
  balanced:{label:L('Equilibrado','Balanced','均衡'),en:'Change the marked zone convincingly while keeping the rest of the photo identical.',outsideTolerance:0.02},
  creative:{label:L('Creativo','Creative','创意'),en:'Propose a more expressive look for the marked zone; the rest of the photo stays identical.',outsideTolerance:0.04}});
 const FAMILY_EN=Object.freeze({cocinas:'kitchen units',electrodomesticos:'appliance',encimeras:'worktop material',mobiliario:'furniture',dormitorios:'bedroom furniture',banos:'bathroom furniture',sanitarios:'sanitaryware',pavimentos:'floor material',revestimientos:'wall finish',iluminacion:'light fitting',carpinterias:'joinery',decoracion:'decoration',textiles:'textile'});
 const ALL_FAMILIES=Object.keys(FAMILY_EN);
 const R=(id,title,zones,families,intensities,maxReferences)=>Object.freeze({schema:RECIPE_SCHEMA,id,version:'1.0.0',title,zones:Object.freeze(zones),families:Object.freeze(families),intensities:Object.freeze(intensities),maxReferences,outputs:Object.freeze([1,3]),providers:Object.freeze(['openai-images']),invariants:PRESERVE_MANDATORY});
 const RECIPES=Object.freeze([
  R('kitchen-catalog-faithful',L('Cocina fiel al catálogo','Kitchen faithful to the catalogue','忠于目录的厨房'),['cabinetry','worktop','appliance','floor','walls'],['cocinas','electrodomesticos','encimeras','pavimentos','revestimientos','mobiliario'],['faithful','balanced'],3),
  R('bath-product-fidelity',L('Baño con producto fiel','Bathroom with faithful product','忠实产品的浴室'),['walls','floor','furniture','lighting'],['banos','sanitarios','revestimientos','pavimentos','iluminacion'],['faithful','balanced'],3),
  R('furniture-showcase',L('Mueble protagonista','Furniture showcase','家具展示'),['furniture','floor'],['mobiliario','dormitorios','textiles','decoracion'],['faithful','balanced','creative'],2),
  R('finish-material-match',L('Acabado o material','Finish or material','饰面或材料'),['floor','walls','worktop','ceiling'],['pavimentos','revestimientos','encimeras'],['faithful','balanced'],1),
  R('lighting-catalog',L('Iluminación de catálogo','Catalogue lighting','目录照明'),['lighting','ceiling'],['iluminacion'],['faithful','balanced','creative'],2),
  R('developer-showroom',L('Piso piloto de promotora','Developer show flat','开发商样板间'),['floor','walls','cabinetry','worktop','furniture','lighting'],ALL_FAMILIES,['balanced','creative'],3)]);
 const recipe=id=>RECIPES.find(r=>r.id===id)||null;
 const isObj=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
 // At most 4 decimals, tolerant of binary floating point (0.5583*1e4 is 5582.999…): |v − round4(v)| < 1e-9.
 const num4=v=>typeof v==='number'&&Number.isFinite(v)&&Math.abs(Math.round(v*1e4)/1e4-v)<1e-9;
 const fail=(code)=>({ok:false,code});
 // Closed request shared by browser and server. References carry only family, kind and the SHA-256 of the image bytes.
 function checkRequest(r){
  if(!isObj(r))return fail('request');
  if(Object.keys(r).sort().join(',')!=='alternatives,intensity,mask,mode,preserve,recipeId,recipeVersion,references,version,zone')return fail('request-keys');
  if(r.version!==VERSION||r.mode!=='catalog')return fail('request-version');
  const rc=recipe(r.recipeId);if(!rc||r.recipeVersion!==rc.version)return fail('recipe');
  if(!rc.zones.includes(r.zone))return fail('zone');
  if(!rc.intensities.includes(r.intensity))return fail('intensity');
  if(!rc.outputs.includes(r.alternatives))return fail('alternatives');
  if(!Array.isArray(r.preserve)||r.preserve.length>PRESERVE_OPTIONAL.length||new Set(r.preserve).size!==r.preserve.length||!r.preserve.every(p=>PRESERVE_OPTIONAL.includes(p)))return fail('preserve');
  if(r.preserve.includes(r.zone))return fail('preserve-zone'); // cannot preserve what is being changed
  if(!Array.isArray(r.mask)||!r.mask.length||r.mask.length>8)return fail('mask');
  for(const m of r.mask){if(!Array.isArray(m)||m.length!==4||!m.every(num4))return fail('mask');const[x,y,w,h]=m;if(x<0||y<0||w<0.02||h<0.02||x+w>1.0001||y+h>1.0001)return fail('mask');}
  if(!Array.isArray(r.references)||r.references.length>rc.maxReferences)return fail('references');
  for(const ref of r.references){if(!isObj(ref)||Object.keys(ref).sort().join(',')!=='family,kind,sha256'||!rc.families.includes(ref.family)||!['furniture','appliance','material','lighting','fixture'].includes(ref.kind)||typeof ref.sha256!=='string'||!/^[0-9a-f]{64}$/.test(ref.sha256))return fail('reference');}
  return {ok:true,request:{version:VERSION,mode:'catalog',recipeId:rc.id,recipeVersion:rc.version,zone:r.zone,intensity:r.intensity,alternatives:r.alternatives,preserve:[...r.preserve].sort(),mask:r.mask.map(m=>[...m]),references:r.references.map(x=>({family:x.family,kind:x.kind,sha256:x.sha256}))}};
 }
 // Provider text from closed tokens only. Reference images are numbered after the source photo (image 1).
 function compile(request){
  const c=checkRequest(request);if(!c.ok)throw Error('invalid request: '+c.code);const r=c.request,rc=recipe(r.recipeId),z=ZONES[r.zone];
  const preserve=[...PRESERVE_MANDATORY,...r.preserve].map(p=>PRESERVE_EN[p]);
  const refs=r.references.map((x,i)=>`Image ${i+2} is a reference photo of a ${FAMILY_EN[x.family]}: use it only as the visual reference for ${z.en}.`);
  const text=['Edit image 1, an interior photo, for an ILLUSTRATIVE visual proposal.',
   `Change ONLY ${z.en} inside the transparent area of the mask.`,INTENSITY[r.intensity].en,...refs,
   refs.length?'Reference images show products: do not copy any text, logo or brand from them, and do not claim it is the exact product.':'',
   `Keep EXACTLY the same: ${preserve.join('; ')}.`,
   'Do not add or remove walls, windows, doors, openings, rooms or large objects. Do not add text, logos, brands or people.'].filter(Boolean).join(' ');
  return Object.freeze({schema:RECIPE_SCHEMA,recipeId:rc.id,recipeVersion:rc.version,text,hash:sha256(text)});
 }
 // Fraction of pixels that changed (max channel delta > tol) inside and outside the zone. RGBA arrays, same size.
 function changeRatios(a,b,w,h,mask,tol=28){
  if(!a||!b||a.length!==b.length||a.length!==w*h*4)throw Error('image size');
  const inMask=(x,y)=>mask.some(([mx,my,mw,mh])=>x>=mx*w&&x<(mx+mw)*w&&y>=my*h&&y<(my+mh)*h);
  let inN=0,inC=0,outN=0,outC=0;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=(y*w+x)*4,d=Math.max(Math.abs(a[i]-b[i]),Math.abs(a[i+1]-b[i+1]),Math.abs(a[i+2]-b[i+2]))>tol;if(inMask(x+.5,y+.5)){inN++;if(d)inC++;}else{outN++;if(d)outC++;}}
  return {inside:inN?inC/inN:0,outside:outN?outC/outN:0};
 }
 // Fidelity review. Human checks are true/false/null (not yet answered).
 function review({ratios,intensity,human={}}){
  const reasons=[],tol=INTENSITY[intensity]?.outsideTolerance;if(tol===undefined)throw Error('intensity');
  if(ratios&&ratios.outside>tol)reasons.push('changes-outside-zone');
  if(human.openingsIntact===false)reasons.push('openings-altered');
  if(human.geometryIntact===false)reasons.push('geometry-altered');
  if(reasons.length)return {status:'RECHAZADA',reasons,deliverable:false,tolerance:tol};
  if(human.openingsIntact!==true||human.geometryIntact!==true||!ratios)return {status:'PENDIENTE',reasons:['review-incomplete'],deliverable:false,tolerance:tol};
  return {status:'ACEPTABLE',reasons:[],deliverable:true,tolerance:tol,productMatch:['similar','different','not-assessable'].includes(human.productMatch)?human.productMatch:'not-assessable',skuCertified:false};
 }
 const REVIEW_TEXT=Object.freeze({'changes-outside-zone':L('Hay cambios fuera de la zona marcada por encima de la tolerancia.','There are changes outside the marked zone above the tolerance.','标记区域外的变化超出容差。'),
  'openings-altered':L('Se han borrado o alterado ventanas, puertas o huecos.','Windows, doors or openings were erased or altered.','窗户、门或洞口被删除或改变。'),
  'geometry-altered':L('La geometría (muros, perspectiva, volúmenes) ha cambiado.','Geometry (walls, perspective, volumes) changed.','几何（墙体、透视、体量）已改变。'),
  'review-incomplete':L('Falta la revisión de huecos y geometría.','The openings and geometry review is missing.','缺少洞口和几何审核。')});
 function deepFreeze(v){if(v&&typeof v==='object'&&!Object.isFrozen(v)){Object.freeze(v);for(const k of Object.keys(v))deepFreeze(v[k]);}return v;}
 function canonical(v){if(Array.isArray(v))return '['+v.map(canonical).join(',')+']';if(isObj(v))return '{'+Object.keys(v).sort().filter(k=>v[k]!==undefined).map(k=>JSON.stringify(k)+':'+canonical(v[k])).join(',')+'}';return JSON.stringify(v===undefined?null:v);}
 // Result sheet: what was asked, with which references, what came out and what the professional decided.
 function resultSheet({source,request,references=[],result,review:rv,decision,at,lang='es'}){
  const c=checkRequest(request);if(!c.ok)throw Error('invalid request: '+c.code);
  if(!source||!/^[0-9a-f]{64}$/.test(source.sha256||''))throw Error('source');
  if(!result||!['simulated','generated'].includes(result.kind))throw Error('result');
  if(!['accepted','rejected','discarded'].includes(decision))throw Error('decision');
  if(decision==='accepted'&&!(rv&&rv.deliverable))throw Error('cannot accept a result that is not ACEPTABLE');
  const label=result.kind==='simulated'?L('SIMULACIÓN · no generada por IA · no se entrega','SIMULATION · not generated by AI · not deliverable','模拟 · 非 AI 生成 · 不可交付')[lang]
   :L('Propuesta visual generada por IA; producto y medidas por confirmar','AI-generated visual proposal; product and dimensions to be confirmed','AI 生成的视觉方案；产品与尺寸待确认')[lang];
  const body={schema:SHEET_SCHEMA,lang,source:{kind:source.kind==='view'?'view':'photo',sha256:source.sha256,width:source.width|0,height:source.height|0,metadata:'removed'},
   recipe:compile(c.request),request:c.request,references:references.map(r=>({catalogId:r.catalogId,catalogRevision:r.catalogRevision,productId:r.productId,variantId:r.variantId??null,sku:r.sku,displayName:r.displayName,family:r.family,imageSha256:r.imageSha256,license:r.license})),
   result:{kind:result.kind,provider:result.provider||null,cost:result.cost??null,costStatus:result.kind==='simulated'?'not-applicable':result.cost?'reported':'unknown',outputsBilled:result.kind==='simulated'?0:(Number.isInteger(result.outputsBilled)?result.outputsBilled:null),requestId:result.requestId||null,index:result.index|0,sha256:result.sha256||null},
   review:rv,decision,deliverable:decision==='accepted'&&result.kind==='generated',label,skuCertified:false,projectChanged:false,generatedAt:at||new Date().toISOString()};
  return deepFreeze({...body,hash:sha256(canonical(body))});
 }
 return Object.freeze({VERSION,SHEET_SCHEMA,RECIPE_SCHEMA,ZONES,PRESERVE_MANDATORY,PRESERVE_OPTIONAL,PRESERVE_LABEL,INTENSITY,FAMILY_EN,RECIPES,REVIEW_TEXT,recipe,checkRequest,compile,changeRatios,review,resultSheet,canonical});
});
