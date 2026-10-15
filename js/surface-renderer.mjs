/* Active assignments only. Verified bytes are decoded before GPU publication. */
export class SurfaceRenderer{
 constructor(THREE,library){this.THREE=THREE;this.library=library;this.cache=new Map();this.used=new Set();this.history=[];this.quality='base';}
 setQuality(quality){if(!['base','enhanced'].includes(quality))throw Error('Calidad de material inválida');this.quality=quality;}
 begin(){this.used.clear();}
 get(material){
  if(!material?.appearance)return null;
  const entry=this.library.get(material.appearance.preset),T=this.THREE;
  if(!entry){if(material.appearance.preset?.startsWith('surface-'))this.library.notify(material.appearance.preset,'Acabado desconocido: '+material.appearance.preset+'; se muestra el color de respaldo.');return null;}
  if(!entry.applications.includes(material.category)){this.library.notify(entry.id,'Acabado incompatible: '+entry.name+'; se muestra el color de respaldo.');return null;}
  const repeat=material.appearance.repeatMm||entry.repeatMm;
  const enhanced=this.quality==='enhanced'&&!!entry.maps.normal&&!!entry.maps.roughness;
  const key=JSON.stringify([material.id,entry.id,repeat.x,repeat.y,enhanced]);this.used.add(key);
  if(this.cache.has(key))return this.cache.get(key).material;
  const m=new T.MeshStandardMaterial({color:material.appearance.color,roughness:entry.roughness});
  const record={material:m,entry,key,state:'loading',detailState:enhanced?'waiting':'off',controller:new AbortController(),textures:[],bitmaps:[]};
  this.cache.set(key,record);record.promise=this.load(record,repeat,enhanced);return m;
 }
 async verifiedMap(file,record,repeat,linear){
  const response=await fetch(file.path,{signal:record.controller.signal});
  if(!response.ok)throw Error(`HTTP ${response.status}: ${file.path}`);
  if(!(response.headers.get('content-type')||'').toLowerCase().startsWith(file.format))throw Error('MIME incorrecto: '+file.path);
  const data=await response.arrayBuffer();
  if(data.byteLength!==file.bytes)throw Error('Tamaño incorrecto: '+file.path);
  const bytes=new Uint8Array(data);
  if(String.fromCharCode(...bytes.slice(0,4))!=='RIFF'||String.fromCharCode(...bytes.slice(8,12))!=='WEBP')throw Error('Formato incorrecto: '+file.path);
  const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',data)),v=>v.toString(16).padStart(2,'0')).join('');
  if(hash!==file.sha256)throw Error('SHA-256 incorrecto: '+file.path);
  const bitmap=await createImageBitmap(new Blob([data],{type:file.format}),{imageOrientation:'flipY'});
  if(bitmap.width!==file.width||bitmap.height!==file.height){bitmap.close();throw Error('Dimensiones incorrectas: '+file.path);}
  if(record.controller.signal.aborted){bitmap.close();return null;}
  const texture=new this.THREE.Texture(bitmap);
  texture.wrapS=texture.wrapT=this.THREE.RepeatWrapping;
  texture.repeat.set(1000/repeat.x,1000/repeat.y);
  texture.colorSpace=linear?this.THREE.NoColorSpace:this.THREE.SRGBColorSpace;
  texture.anisotropy=1;texture.needsUpdate=true;
  return {texture,bitmap,bytes:data.byteLength,gpuBytes:Math.ceil(file.width*file.height*4*4/3)};
 }
 async load(record,repeat,enhanced){
  const start=performance.now();let base;
  try{
   base=await this.verifiedMap(record.entry.maps.baseColor,record,repeat,false);
   if(!base)return;
   record.textures.push(base.texture);record.bitmaps.push(base.bitmap);
   record.material.map=base.texture;record.material.color.set('#ffffff');record.material.needsUpdate=true;
   record.state='ready';record.bytes=base.bytes;record.gpuBytes=base.gpuBytes;record.loadMs=performance.now()-start;
   this.library.status.delete(record.entry.id);dispatchEvent(new Event('surface-status'));
  }catch(e){if(record.controller.signal.aborted)return;record.state='fallback';record.detailState='fallback';record.error=e.message;this.library.notify(record.entry.id,`${record.entry.name}: ${e.message}; se muestra el color de respaldo.`);return;}
  if(!enhanced)return;
  record.detailState='loading';let normal,roughness;
  try{
   normal=await this.verifiedMap(record.entry.maps.normal,record,repeat,true);
   if(!normal)return;
   roughness=await this.verifiedMap(record.entry.maps.roughness,record,repeat,true);
   if(!roughness)return;
   if(record.controller.signal.aborted)return;
   record.textures.push(normal.texture,roughness.texture);
   record.bitmaps.push(normal.bitmap,roughness.bitmap);
   record.material.normalMap=normal.texture;record.material.roughnessMap=roughness.texture;
   record.material.needsUpdate=true;record.detailState='ready';
   record.bytes+=normal.bytes+roughness.bytes;record.gpuBytes+=normal.gpuBytes+roughness.gpuBytes;
   record.loadMs=performance.now()-start;
  }catch(e){if(record.controller.signal.aborted)return;record.detailState='fallback';record.detailError=e.message;this.library.notify(record.entry.id,`${record.entry.name}: ${e.message}; se conserva el albedo verificado.`);}
  finally{if(record.detailState!=='ready')for(const item of [normal,roughness]){item?.texture.dispose();item?.bitmap.close();}}
 }
 end(){for(const [key,r]of this.cache)if(!this.used.has(key)){
  r.controller.abort();for(const texture of r.textures)texture.dispose();for(const bitmap of r.bitmaps)bitmap.close();r.material.dispose();
  this.history.push({id:r.entry.id,state:'disposed',quality:r.detailState});if(this.history.length>100)this.history.shift();this.cache.delete(key);
 }}
 disposeAll(){this.used.clear();this.end();}
 metrics(){return [...this.cache.values()].map(r=>({id:r.entry.id,key:r.key,state:r.state,detailState:r.detailState,bytes:r.bytes||0,gpuBytes:r.gpuBytes||0,loadMs:r.loadMs,error:r.error,detailError:r.detailError,
  map:r.material.map?{repeat:r.material.map.repeat.toArray(),colorSpace:r.material.map.colorSpace}:null,
  normalMap:r.material.normalMap?{repeat:r.material.normalMap.repeat.toArray(),colorSpace:r.material.normalMap.colorSpace}:null,
  roughnessMap:r.material.roughnessMap?{repeat:r.material.roughnessMap.repeat.toArray(),colorSpace:r.material.roughnessMap.colorSpace}:null}));}
}
