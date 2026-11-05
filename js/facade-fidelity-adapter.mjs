import {resolveFacade,facadeEligibility,compatibleFacade,registry} from './facade-fidelity-core.mjs';
const MANIFEST='assets/materials/f03/derivatives-manifest.json';
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
export class FacadeFidelityAdapter{
 constructor(T){this.T=T;this.bindings=new Map();this.decision=resolveFacade();this.records=new Map();this.active=[];this.epoch=0;this.disposals=0;this.status='off';this.error=null;this.loadMs=0;}
 register(project,exterior,meshes,reserved=new Set()){
  const classifications=new Map(exterior.walls.map(w=>[w.wallId,w.status]));
  for(const mesh of meshes){
   const wall=project.walls.find(w=>w.id===mesh.userData.wallId);if(!wall)continue;
   const material=project.materials.find(m=>m.id===wall.surfaceMaterialId);
   const source={projectId:project.id,id:wall.id,exterior:classifications.get(wall.id)||'unavailable',reserved:reserved.has(mesh),materialId:material?.id||null,category:material?.category||null,preset:material?.appearance?.preset||null};
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
  this.status='loading';const record={decision:next,controller:new AbortController(),resources:[],material:null,state:'loading',bytes:0,gpuBytes:0};this.records.set('active',record);record.promise=this.load(record);
  return record.promise.then(async()=>{
   if(epoch!==this.epoch||record.controller.signal.aborted)return this.snapshot();
   if(record.state!=='ready'||!record.material){this.release();this.status='fallback';this.error=record.error||'Carga F03 incompleta';return this.snapshot();}
   try{
    const budget=registry.F03.recipes['facade-material'].renderBudget,selected=[...this.bindings.values()].filter(b=>compatibleFacade(b.source,next));
    if(selected.length>budget.instances)throw Error('Visual facade budget exceeded');
    for(const binding of selected){const geometry=metricFacadeGeometry(this.T,binding.mesh);record.resources.push({geometry});binding.mesh.geometry=geometry;binding.mesh.material=record.material;this.active.push(binding);}
    this.status='ready';
   }catch(error){this.release();this.status='fallback';this.error=error.message;}
   globalThis.dispatchEvent?.(new Event('facade-fidelity-status'));return this.snapshot();
  });
 }
 set(input){const next=resolveFacade(input);return this.apply(next).then(()=>this.snapshot());}
 release(){
  this.epoch++;for(const binding of this.active){binding.mesh.material=binding.material;binding.mesh.geometry=binding.geometry;}this.active=[];
  for(const record of this.records.values()){
   record.controller.abort();for(const item of record.resources){if(item.texture)item.texture.dispose();if(item.bitmap)item.bitmap.close();if(item.geometry)item.geometry.dispose();this.disposals++;}record.material?.dispose();if(record.material)this.disposals++;
  }
  this.records.clear();return this.snapshot();
 }
 clearBindings(){this.release();this.bindings.clear();this.status='off';}
 dispose(){this.clearBindings();this.decision=resolveFacade();}
 snapshot(){return {decision:this.decision,status:this.status,error:this.error,loadMs:this.loadMs,candidates:[...this.bindings.values()].map(b=>({wallId:b.source.id,...facadeEligibility(b.source,this.decision)})),active:[...new Set(this.active.map(b=>b.source.id))],meshCount:this.active.length,resources:{geometries:this.active.length,materials:[...this.records.values()].filter(r=>r.material).length,textures:[...this.records.values()].reduce((n,r)=>n+r.resources.filter(x=>x.texture).length,0),pending:[...this.records.values()].filter(r=>r.state==='loading').length,bytes:[...this.records.values()].reduce((n,r)=>n+r.bytes,0),gpuBytes:[...this.records.values()].reduce((n,r)=>n+r.gpuBytes,0)},disposals:this.disposals};}
}
