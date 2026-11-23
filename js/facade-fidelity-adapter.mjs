import {resolveFacade,facadeEligibility,compatibleFacade,registry,resolveFacadeV2,facadeEligibilityV2,planFacadeBudget,v2Recipe} from './facade-fidelity-core.mjs';
const MANIFEST='assets/materials/f03/derivatives-manifest.json';
const MANIFEST_V2='assets/materials/f03/v2-manifest.json';
const digest=async data=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',data)),v=>v.toString(16).padStart(2,'0')).join('');
export function metricFacadeGeometry(T,mesh){
 const geometry=mesh.geometry.clone(),position=geometry.attributes.position,normal=geometry.attributes.normal,uv=geometry.attributes.uv;
 if(!position||!normal||!uv){geometry.dispose();throw Error('Facade geometry lacks position/normal/uv');}
 const angle=-mesh.rotation.y,c=Math.cos(angle),s=Math.sin(angle),along=mesh.position.x*c+mesh.position.z*s,cross=-mesh.position.x*s+mesh.position.z*c,vertical=mesh.position.y;
 for(let i=0;i<position.count;i++){
  const x=position.getX(i),y=position.getY(i),z=position.getZ(i),nx=normal.getX(i),ny=normal.getY(i),nz=normal.getZ(i);
  if(Math.abs(ny)>.5)uv.setXY(i,along+x,cross+z);
  else if(Math.abs(nx)>.5)uv.setXY(i,cross+Math.sign(nx)*z,vertical+y);
  else uv.setXY(i,along+Math.sign(nz)*x,vertical+y);
 }
 uv.needsUpdate=true;geometry.userData.f03MetricUV=true;return geometry;
}
/** V2: UV métrica en metros escalada por la repetición física del material (mm). Topología intacta. */
export function metricFacadeGeometryScaled(T,mesh,repeatMm){
 const geometry=metricFacadeGeometry(T,mesh),uv=geometry.attributes.uv,kx=1000/repeatMm.x,ky=1000/repeatMm.y;
 for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*kx,uv.getY(i)*ky);
 uv.needsUpdate=true;geometry.userData.f03RepeatMm={...repeatMm};return geometry;
}
export class FacadeFidelityAdapter{
 constructor(T){this.T=T;this.bindings=new Map();this.decision=resolveFacade();this.records=new Map();this.active=[];this.epoch=0;this.disposals=0;this.status='off';this.error=null;this.loadMs=0;}
 register(project,exterior,meshes,reserved=new Set()){
  const classifications=new Map(exterior.walls.map(w=>[w.wallId,w.status]));
  for(const mesh of meshes){
   const wall=project.walls.find(w=>w.id===mesh.userData.wallId);if(!wall)continue;
   const material=project.materials.find(m=>m.id===wall.surfaceMaterialId);
   const source={projectId:project.id,id:wall.id,exterior:classifications.get(wall.id)||'unavailable',reserved:reserved.has(mesh),materialId:material?.id||null,category:material?.category||null,preset:material?.appearance?.preset||null};
   // V2 (sólo lectura): superficie del muro para el presupuesto y repetición que el profesional dejó en el acabado.
   const len=wall.start&&wall.end?Math.hypot(wall.end.x-wall.start.x,wall.end.y-wall.start.y):0;
   source.areaM2=Number.isFinite(len)&&Number.isFinite(wall.heightMm)?len*wall.heightMm/1e6:0;
   source.repeatMm=material?.appearance?.repeatMm?{...material.appearance.repeatMm}:null;
   source.catalogRepeatMm=source.preset&&globalThis.FloorPlanSurfaces?.get?.(source.preset)?.repeatMm||null;
   this.bindings.set(mesh,{source,mesh,material:mesh.material,geometry:mesh.geometry});
  }
 }
 async verifiedMap(file,record,role){
  const response=await fetch(file.path,{signal:record.controller.signal});if(!response.ok)throw Error(`HTTP ${response.status}: ${file.path}`);
  if(!(response.headers.get('content-type')||'').toLowerCase().startsWith('image/webp'))throw Error('MIME incorrecto: '+file.path);
  const data=await response.arrayBuffer();if(data.byteLength!==file.bytes)throw Error('Tamaño incorrecto: '+file.path);
  if(await digest(data)!==file.sha256)throw Error('SHA-256 incorrecto: '+file.path);
  const bitmap=await createImageBitmap(new Blob([data],{type:'image/webp'}),{imageOrientation:'flipY'});
  if(bitmap.width!==file.width||bitmap.height!==file.height){bitmap.close();throw Error('Dimensiones incorrectas: '+file.path);}
  if(record.controller.signal.aborted){bitmap.close();return null;}
  const texture=new this.T.Texture(bitmap);texture.wrapS=texture.wrapT=this.T.RepeatWrapping;texture.repeat.set(1000/record.decision.repeatMm,1000/record.decision.repeatMm);texture.colorSpace=role==='albedo'?this.T.SRGBColorSpace:this.T.NoColorSpace;texture.anisotropy=4;texture.needsUpdate=true;
  return {texture,bitmap,bytes:file.bytes,gpuBytes:file.estimatedGpuBytesWithMipmaps};
 }
 async load(record){
  const began=performance.now();
  try{
   const response=await fetch(MANIFEST,{signal:record.controller.signal});if(!response.ok)throw Error('Manifiesto F03 no disponible');
   const manifest=await response.json(),materialRecord=manifest.materials?.[record.decision.materialId],variant=materialRecord?.variants?.[record.decision.profile];if(manifest.schema!=='F03/pbr-derivatives@1'||!variant)throw Error('Material/perfil F03 ausente');
   if(materialRecord.integration?.compatiblePreset!==registry.F03.recipes['facade-material'].compatibility[record.decision.materialId]||materialRecord.integration.tintLinear?.length!==3||materialRecord.integration.tintLinear.some(v=>!Number.isFinite(v)||v<=0||v>1))throw Error('Calibración cromática F03 ausente o incompatible');
   const entries=Object.entries(variant.maps),loaded=[];
   for(const [role,file]of entries){const item=await this.verifiedMap(file,record,role);if(!item)return;loaded.push(item);record.resources.push(item);}
   if(record.controller.signal.aborted)return;
   const byRole=Object.fromEntries(entries.map(([role],i)=>[role,loaded[i]]));
   const material=new this.T.MeshStandardMaterial({color:0xffffff,map:byRole.albedo.texture,normalMap:byRole.normal.texture,roughnessMap:byRole.roughness.texture,roughness:1,metalness:0});material.color.setRGB(...materialRecord.integration.tintLinear);material.normalScale.setScalar(record.decision.normalStrength);record.material=material;record.state='ready';record.bytes=loaded.reduce((n,item)=>n+item.bytes,0);record.gpuBytes=loaded.reduce((n,item)=>n+item.gpuBytes,0);this.loadMs=performance.now()-began;
  }catch(error){if(record.controller.signal.aborted)return;record.state='fallback';record.error=error.message;this.status='fallback';this.error=error.message;}
  finally{if(!record.controller.signal.aborted)globalThis.dispatchEvent?.(new Event('facade-fidelity-status'));}
 }
 apply(next=this.decision){
  this.release();const epoch=this.epoch;this.decision=next;this.error=null;this.loadMs=0;
  if(!next.enabled){this.status='off';return Promise.resolve(this.snapshot());}
  const selected=[...this.bindings.values()].filter(b=>compatibleFacade(b.source,next));
  const budget=registry.F03.recipes['facade-material'].renderBudget;
  if(!selected.length){this.status='unavailable';return Promise.resolve(this.snapshot());}
  if(selected.length>budget.instances){this.status='fallback';this.error='Visual facade budget exceeded';return Promise.resolve(this.snapshot());}
  this.status='loading';const record={decision:next,controller:new AbortController(),resources:[],material:null,state:'loading',bytes:0,gpuBytes:0};this.records.set('active',record);record.promise=this.load(record);
  return record.promise.then(async()=>{
   if(epoch!==this.epoch||record.controller.signal.aborted)return this.snapshot();
   if(record.state!=='ready'||!record.material){this.release();this.status='fallback';this.error=record.error||'Carga F03 incompleta';return this.snapshot();}
   try{
    for(const binding of selected){const geometry=metricFacadeGeometry(this.T,binding.mesh);record.resources.push({geometry});binding.mesh.geometry=geometry;binding.mesh.material=record.material;this.active.push(binding);}
    this.status='ready';
   }catch(error){this.release();this.status='fallback';this.error=error.message;}
   globalThis.dispatchEvent?.(new Event('facade-fidelity-status'));return this.snapshot();
  });
 }
 set(input){
  // V2 se reconoce por recipeVersion 2: el material sale del acabado asignado a cada muro.
  if(input&&input.recipeVersion===2){const next=resolveFacadeV2(input);return this.applyV2(next).then(()=>this.snapshot());}
  const next=resolveFacade(input);return this.apply(next).then(()=>this.snapshot());}
 /** V2 sin cargar nada: la clasificación muro a muro que aplicaría la activación (para explicar la elegibilidad). */
 previewV2(projectId){const d=resolveFacadeV2({projectId,enabled:false});const dec={...d,projectId};return [...this.bindings.values()].map(b=>({wallId:b.source.id,...facadeEligibilityV2(b.source,dec)}));}
 async manifestV2(kind,signal){
  this.manifests??=new Map();if(this.manifests.has(kind))return this.manifests.get(kind);
  const response=await fetch(kind==='v1'?MANIFEST:MANIFEST_V2,{signal});if(!response.ok)throw Error(`Manifiesto F03 ${kind} no disponible (HTTP ${response.status})`);
  const manifest=await response.json();if(manifest.schema!==(kind==='v1'?'F03/pbr-derivatives@1':'F03/pbr-derivatives@2'))throw Error('Esquema de manifiesto F03 '+kind+' incorrecto');
  this.manifests.set(kind,manifest);return manifest;}
 async mapV2(file,signal,role){
  const response=await fetch(file.path,{signal});if(!response.ok)throw Error(`HTTP ${response.status}: ${file.path}`);
  if(!(response.headers.get('content-type')||'').toLowerCase().startsWith('image/webp'))throw Error('MIME incorrecto: '+file.path);
  const data=await response.arrayBuffer();if(data.byteLength!==file.bytes)throw Error('Tamaño incorrecto: '+file.path);
  if(await digest(data)!==file.sha256)throw Error('SHA-256 incorrecto: '+file.path);
  const bitmap=await createImageBitmap(new Blob([data],{type:'image/webp'}),{imageOrientation:'flipY'});
  if(bitmap.width!==file.width||bitmap.height!==file.height){bitmap.close();throw Error('Dimensiones incorrectas: '+file.path);}
  if(signal.aborted){bitmap.close();return null;}
  const texture=new this.T.Texture(bitmap);texture.wrapS=texture.wrapT=this.T.RepeatWrapping;texture.colorSpace=role==='albedo'?this.T.SRGBColorSpace:this.T.NoColorSpace;
  // Anisotropía: las fachadas se miran en rasante desde la altura de una persona.
  texture.anisotropy=Math.max(1,Math.min(v2Recipe.maxAnisotropy,this.maxAnisotropy||4));texture.needsUpdate=true;
  return {texture,bitmap,bytes:file.bytes,gpuBytes:file.estimatedGpuBytesWithMipmaps};}
 async loadV2(record){
  const began=performance.now();
  try{
   const info=v2Recipe.materials[record.materialId],manifest=await this.manifestV2(info.manifest,record.controller.signal),entry=manifest.materials?.[record.materialId],variant=entry?.variants?.[record.profile];
   if(!variant)throw Error('Material/perfil F03 ausente: '+record.materialId);
   const tint=entry.integration?.tintLinear;if(tint?.length!==3||tint.some(v=>!Number.isFinite(v)||v<=0||v>1))throw Error('Calibración cromática F03 ausente: '+record.materialId);
   const roles=[['albedo','albedo'],['normal','normal'],['roughness','roughness']],loaded={};
   for(const [role,key] of roles){const item=await this.mapV2(variant.maps[key],record.controller.signal,role);if(!item)return;loaded[role]=item;record.resources.push(item);}
   if(record.controller.signal.aborted)return;
   const material=new this.T.MeshStandardMaterial({color:0xffffff,map:loaded.albedo.texture,normalMap:loaded.normal.texture,roughnessMap:loaded.roughness.texture,roughness:1,metalness:0});
   material.color.setRGB(...tint);material.normalScale.setScalar(v2Recipe.normalStrength);material.name='F03V2:'+record.materialId;
   record.material=material;record.repeatMm=variant.repeatMm;record.state='ready';
   record.bytes=Object.values(loaded).reduce((n,i)=>n+i.bytes,0);record.gpuBytes=Object.values(loaded).reduce((n,i)=>n+i.gpuBytes,0);record.loadMs=performance.now()-began;
  }catch(error){if(record.controller.signal.aborted)return;record.state='fallback';record.error=String(error?.message||error);}
 }
 applyV2(next){
  this.release();const epoch=this.epoch;this.decision=next;this.error=null;this.loadMs=0;this.plan=null;
  if(!next.enabled){this.status='off';return Promise.resolve(this.snapshot());}
  const chosen=[...this.bindings.values()].map(b=>({b,e:facadeEligibilityV2(b.source,next)})).filter(x=>x.e.eligible);
  if(!chosen.length){this.status='unavailable';return Promise.resolve(this.snapshot());}
  const budget=v2Recipe.renderBudget;
  if(chosen.length>budget.instances){this.status='fallback';this.error='Visual facade budget exceeded';return Promise.resolve(this.snapshot());}
  const groups=new Map();
  for(const {b,e} of chosen){const g=groups.get(e.materialId)||{materialId:e.materialId,areaM2:0,walls:new Set(),bindings:[]};
   if(!g.walls.has(b.source.id)){g.walls.add(b.source.id);g.areaM2+=b.source.areaM2||0;}g.bindings.push(b);groups.set(e.materialId,g);}
  this.plan=planFacadeBudget([...groups.values()].map(g=>({materialId:g.materialId,areaM2:Math.round(g.areaM2*100)/100,walls:g.walls.size})),next.profile,budget);
  const controller=new AbortController(),began=performance.now();this.status='loading';
  const records=this.plan.plan.filter(p=>p.profile).map(p=>{const r={materialId:p.materialId,profile:p.profile,controller,resources:[],material:null,state:'loading',bytes:0,gpuBytes:0,bindings:groups.get(p.materialId).bindings};this.records.set(p.materialId,r);return r;});
  globalThis.dispatchEvent?.(new Event('facade-fidelity-status'));
  return Promise.all(records.map(r=>this.loadV2(r))).then(()=>{
   if(epoch!==this.epoch||controller.signal.aborted)return this.snapshot();
   const failed=[];
   for(const r of records){
    if(r.state!=='ready'){failed.push(r.materialId+': '+(r.error||'carga incompleta'));for(const item of r.resources){item.texture?.dispose();item.bitmap?.close?.();this.disposals++;}r.resources=[];continue;}
    try{
     for(const b of r.bindings){
      // Repetición: la del profesional si la cambió respecto del catálogo; si no, la física de la fuente.
      // El catálogo se consulta al aplicar (se carga de forma asíncrona y puede no estar listo al registrar).
      const own=b.source.repeatMm,cat=b.source.catalogRepeatMm||globalThis.FloorPlanSurfaces?.get?.(b.source.preset)?.repeatMm||null,useOwn=own&&(!cat||own.x!==cat.x||own.y!==cat.y);
      const geometry=metricFacadeGeometryScaled(this.T,b.mesh,useOwn?own:r.repeatMm);r.resources.push({geometry});b.mesh.geometry=geometry;b.mesh.material=r.material;this.active.push(b);}
    }catch(error){failed.push(r.materialId+': '+error.message);r.state='fallback';r.error=error.message;}
   }
   const ready=records.filter(r=>r.state==='ready').length,excluded=this.plan.plan.some(p=>!p.profile);
   this.status=!ready?'fallback':failed.length||excluded?'partial':'ready';
   if(!ready)this.release();
   this.error=failed.length?failed.join(' · '):null;this.loadMs=performance.now()-began;
   globalThis.dispatchEvent?.(new Event('facade-fidelity-status'));return this.snapshot();
  });
 }
 release(){
  this.epoch++;for(const binding of this.active){binding.mesh.material=binding.material;binding.mesh.geometry=binding.geometry;}this.active=[];
  for(const record of this.records.values()){
   record.controller.abort();for(const item of record.resources){if(item.texture)item.texture.dispose();if(item.bitmap)item.bitmap.close();if(item.geometry)item.geometry.dispose();this.disposals++;}record.material?.dispose();if(record.material)this.disposals++;
  }
  this.records.clear();return this.snapshot();
 }
 clearBindings(){this.release();this.bindings.clear();this.status='off';}
 dispose(){this.clearBindings();this.decision=resolveFacade();}
 snapshot(){
  const v2=this.decision?.recipeVersion===2,eligibility=b=>v2?facadeEligibilityV2(b.source,this.decision):facadeEligibility(b.source,this.decision);
  const base=this.snapshotV1(eligibility);if(!v2)return base;
  base.version=2;base.plan=this.plan?{cap:this.plan.cap,used:this.plan.used}:null;
  base.materials=(this.plan?.plan||[]).map(p=>{const r=this.records.get(p.materialId),info=v2Recipe.materials[p.materialId];
   return {materialId:p.materialId,identity:info.identity,sameAsset:info.sameAsset,approval:info.approval,walls:p.walls,areaM2:p.areaM2,profile:p.profile,
    state:p.profile?(r?.state||'off'):'budget',error:r?.error||null,gpuBytes:r?.state==='ready'?r.gpuBytes:0};});
  return base;}
 snapshotV1(eligibility){return {decision:this.decision,status:this.status,error:this.error,loadMs:this.loadMs,candidates:[...this.bindings.values()].map(b=>({wallId:b.source.id,...eligibility(b)})),active:[...new Set(this.active.map(b=>b.source.id))],meshCount:this.active.length,resources:{geometries:this.active.length,materials:[...this.records.values()].filter(r=>r.material).length,textures:[...this.records.values()].reduce((n,r)=>n+r.resources.filter(x=>x.texture).length,0),pending:[...this.records.values()].filter(r=>r.state==='loading').length,bytes:[...this.records.values()].reduce((n,r)=>n+r.bytes,0),gpuBytes:[...this.records.values()].reduce((n,r)=>n+r.gpuBytes,0)},disposals:this.disposals};}
}
