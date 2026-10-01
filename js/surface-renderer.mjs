/* Active assignments only. Hash/bytes/decode checks precede GPU publication. */
export class SurfaceRenderer{
 constructor(THREE,library){this.THREE=THREE;this.library=library;this.cache=new Map();this.used=new Set();this.history=[];}
 begin(){this.used.clear();}
 get(material){
  const entry=this.library.get(material.appearance.preset),T=this.THREE;
  if(!entry){if(material.appearance.preset?.startsWith('surface-'))this.library.notify(material.appearance.preset,'Acabado desconocido: '+material.appearance.preset+'; se muestra el color de respaldo.');return null;}
  if(!entry.applications.includes(material.category)){this.library.notify(entry.id,'Acabado incompatible: '+entry.name+'; se muestra el color de respaldo.');return null;}
  const repeat=material.appearance.repeatMm||entry.repeatMm,key=JSON.stringify([material.id,entry.id,repeat.x,repeat.y]);this.used.add(key);
  if(this.cache.has(key))return this.cache.get(key).material;
  const m=new T.MeshStandardMaterial({color:material.appearance.color,roughness:entry.roughness}),record={material:m,entry,key,state:'loading',controller:new AbortController()};this.cache.set(key,record);
  record.promise=this.load(record,repeat);return m;
 }
 async load(record,repeat){
  const start=performance.now(),f=record.entry.maps.baseColor,T=this.THREE;let bitmap;
  try{
   const response=await fetch(f.path,{signal:record.controller.signal});if(!response.ok)throw Error(`HTTP ${response.status}: ${f.path}`);
   const data=await response.arrayBuffer();if(data.byteLength!==f.bytes)throw Error('Tamaño incorrecto: '+f.path);
   const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',data)),v=>v.toString(16).padStart(2,'0')).join('');if(hash!==f.sha256)throw Error('SHA-256 incorrecto: '+f.path);
   bitmap=await createImageBitmap(new Blob([data],{type:f.format}),{imageOrientation:'flipY'});
   if(bitmap.width!==f.width||bitmap.height!==f.height)throw Error('Dimensiones incorrectas: '+f.path);
   if(record.controller.signal.aborted){bitmap.close();return;}
   const texture=new T.Texture(bitmap);texture.wrapS=texture.wrapT=T.RepeatWrapping;texture.repeat.set(1000/repeat.x,1000/repeat.y);texture.colorSpace=T.SRGBColorSpace;texture.anisotropy=1;texture.needsUpdate=true;
   record.material.map=texture;record.material.color.set('#ffffff');record.material.needsUpdate=true;record.bitmap=bitmap;record.state='ready';record.bytes=data.byteLength;record.gpuBytes=Math.ceil(f.width*f.height*4*4/3);record.loadMs=performance.now()-start;
   this.library.status.delete(record.entry.id);dispatchEvent(new Event('surface-status'));
  }catch(e){bitmap?.close();if(record.controller.signal.aborted)return;record.state='fallback';record.error=e.message;this.library.notify(record.entry.id,`${record.entry.name}: ${e.message}; se muestra el color de respaldo.`);}
 }
 end(){for(const [key,r]of this.cache)if(!this.used.has(key)){r.controller.abort();r.material.map?.dispose();r.material.dispose();r.bitmap?.close();this.history.push({id:r.entry.id,state:'disposed'});if(this.history.length>100)this.history.shift();this.cache.delete(key);}}
 metrics(){return [...this.cache.values()].map(r=>({id:r.entry.id,key:r.key,state:r.state,bytes:r.bytes||0,gpuBytes:r.gpuBytes||0,loadMs:r.loadMs,error:r.error,map:r.material.map?{repeat:r.material.map.repeat.toArray(),colorSpace:r.material.map.colorSpace}:null}));}
}
