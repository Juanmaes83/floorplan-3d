/* Read the source manifest; facts alone do not establish permission. No I/O. */
(function(root){
 'use strict';
 const validId=v=>typeof v==='string'&&/^[a-z0-9][a-z0-9-]{2,127}$/.test(v);
 const hash=v=>typeof v==='string'&&/^[0-9a-f]{64}$/.test(v);
 const path=v=>typeof v==='string'&&/^assets\/f3\/[A-Za-z0-9.-]+$/.test(v)&&!v.includes('..');
 const clone=v=>JSON.parse(JSON.stringify(v));
 // The Furniture Kit admission applies only to the two reviewed plants and exact published bytes.
 const kenneyPlants=new Map([
  ['op11-plant-small-1','3cb86c041cf44ea4d76d071b8ab443ad6408391c886d13d6cc7ad0fcbcf98503'],
  ['op11-potted-plant','40e9483b6906ef4d2241e64ca7d9159d8a2807b57486c5b85de7f03a1d66262f']
 ]);
 function permitsKenneyPlant(item,e,p){
  return item?.category==='plant'&&item.brand==='Kenney'&&item.licenseType==='CC0-1.0'
   &&kenneyPlants.has(item.id)&&kenneyPlants.get(item.id)===e?.modelSha256&&item.modelPath==='assets/f3/'+item.id+'.glb'
   &&item.permissionDocumentRef==='assets/f3/LICENSE-op11-furniture-kit.txt'
   &&e.permissionSha256==='78c8043c884b33abee06000a32e11530f25957c5210be8ae2573244f14ba9bbc'
   &&p?.authorizationKind==='cc0-public-domain-dedication'&&p.brand==='third-party-identification-no-affiliation'
   &&p.attribution==='Kenney — Furniture Kit (CC0-1.0)'
   &&e.source?.repository==='laanlabs/openPlan3D'&&e.source.revision==='771c9e1ad30bd1c3cc7584d6eca74deb2e14943d'
   &&e.source.url==='https://kenney.nl/assets/furniture-kit'&&hash(e.source.sha256);
 }
 function canUse(entry,object){
  return !!entry&&(!kenneyPlants.has(entry.id)||object?.type==='plant');
 }
 function adapt(source,{catalog,revision,evidence={},today=new Date().toISOString().slice(0,10)}={}){
  if(!Array.isArray(source)||!['rubik-sota-local','immersphere-asset-lab'].includes(catalog)||!/^([0-9a-f]{40})$/.test(revision||''))throw Error('Invalid manifest identity');
  const seen=new Set(),entries=[],excluded=[];
  for(const item of source){let reason='';const e=catalog==='rubik-sota-local'?item?.f3Evidence:evidence[item?.id];
   if(!validId(item?.id)||seen.has(item.id))reason='invalid-or-duplicate-id';else seen.add(item.id);
   const p=e?.permission,d=item?.dimensions,factor={mm:1,cm:10,m:1000}[d?.unit];
   const localPermission=p?.commercial===true&&p?.redistribution===true&&p?.streaming===true&&p?.modification===true&&p?.territory==='worldwide'&&(kenneyPlants.has(item?.id)?permitsKenneyPlant(item,e,p):p?.brand==='own-no-third-party-mark');
   const prepared=e?.pipeline?.tool==='glTF Transform'&&e.pipeline.version==='4.3.0'&&e.pipeline.inputSha256===e?.source?.sha256&&e.pipeline.outputSha256===e.modelSha256&&e.dimensionsKind==='model-geometry'&&['width','height','depth'].every(k=>e.pipeline.geometryBoundsMm?.[k]===d?.[k]);
   const externalPermission=p?.authorizationKind==='owner-confirmed-project-use'&&p?.authorizedBy==='Juanma'&&p?.project==='Juanmaes83/floorplan-3d'&&p?.scope==='local-app-git-and-review-preview'&&p?.brand==='third-party-identification-no-affiliation'&&e?.source?.repository==='Juanmaes83/immersphere-asset-lab'&&e.source.revision===revision&&typeof e.source.path==='string'&&e.source.path.startsWith('assets/ikea/')&&hash(e.source.sha256)&&(e.source.sha256===e.modelSha256||(e.optimization?.inputSha256===e.source.sha256&&e.optimization?.outputSha256===e.modelSha256&&e.optimization?.script==='scripts/prepare-f3-pouf.py'&&e.optimization?.tool==='Pillow'&&e.optimization?.version==='12.3.0'&&e.optimization?.geometryChanged===false)||prepared)&&item.brand==='IKEA';
   if(!reason&&(!p||!hash(e.permissionSha256)||!path(item.permissionDocumentRef)||!(catalog==='rubik-sota-local'?localPermission:externalPermission)||typeof p.attribution!=='string'||!p.attribution||!(p.expires===null||(/^\d{4}-\d{2}-\d{2}$/.test(p.expires)&&p.expires>=today))))reason='permission-not-verified-for-this-use';
   if(!reason&&(!factor||!['width','height','depth'].every(k=>Number.isFinite(d[k])&&d[k]>0&&d[k]*factor<=10000)||typeof e.dimensionsSource!=='string'||!e.dimensionsSource))reason='dimensions-not-verifiable';
   const n=e?.normalization;
   if(!reason&&(!n||!Number.isFinite(n.unitToMeter)||n.unitToMeter<=0||n.unitToMeter>1000||!Array.isArray(n.rotationDeg)||n.rotationDeg.length!==3||!n.rotationDeg.every(v=>Number.isFinite(v)&&Math.abs(v)<=360)||!n.provenance))reason='normalization-not-verifiable';
   if(!reason&&(item.format!=='glb'||!path(item.modelPath)||!hash(e.modelSha256)||!Number.isSafeInteger(e.bytes)||e.bytes<20||e.bytes>8*1024*1024||!Array.isArray(e.extensionsRequired)||e.extensionsRequired.length||item.qaStatus!=='approved'))reason='unsupported-or-unverified-resource';
   // Pilot supports self-contained core JPEG textures; runtime validates actual bytes.
   if(reason){excluded.push({id:validId(item?.id)?item.id:null,reason});continue;}
   entries.push(Object.freeze({id:item.id,name:String(item.productName),catalog,revision,url:item.modelPath,permissionUrl:item.permissionDocumentRef,permissionSha256:e.permissionSha256,sha256:e.modelSha256,bytes:e.bytes,dimensionsMm:{width:d.width*factor,height:d.height*factor,depth:d.depth*factor},dimensionsKind:e.dimensionsKind||'product',type:item.category,room:item.room,normalization:clone(n),attribution:p.attribution,extensionsRequired:[]}));
  }
  return {entries,excluded};
 }
 function resolve(entries,ref){return entries.find(e=>e.catalog===ref?.catalog&&e.id===ref.assetId&&(!ref.catalogRevision||e.revision===ref.catalogRevision))||null;}
 function associate(object,entry){const next=clone(object);if(canUse(entry,object))next.assetRef={catalog:entry.catalog,assetId:entry.id,catalogRevision:entry.revision};else if(!entry)delete next.assetRef;return next;}
 const api={adapt,resolve,associate,canUse};if(typeof module==='object')module.exports=api;else root.FloorPlanAssets=api;
})(globalThis);
