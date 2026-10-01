import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';

// Technical pilot guards, not an approved physical-device performance budget.
export const LIMITS=Object.freeze({bytes:8*1024*1024,images:4,textures:4,materials:8,maps:8,imageBytes:1024*1024,imageTotalBytes:4*1024*1024,imageSide:2048,decodedBytes:16*1024*1024,textureBytes:24*1024*1024});
const MAX_BYTES=LIMITS.bytes;
const integer=(v,min,max)=>Number.isSafeInteger(v)&&v>=min&&v<=max;
function jpegSize(bytes){
 if(bytes.length<4||bytes[0]!==255||bytes[1]!==216||bytes.at(-2)!==255||bytes.at(-1)!==217)throw Error('Invalid JPEG signature');
 let i=2;
 while(i<bytes.length){
  if(bytes[i++]!==255)throw Error('Invalid JPEG marker');while(bytes[i]===255)i++;
  const marker=bytes[i++];if(marker===218||marker===217)break;
  if(i+2>bytes.length)throw Error('Truncated JPEG');const n=(bytes[i]<<8)|bytes[i+1];
  if(n<2||i+n>bytes.length)throw Error('Invalid JPEG segment');
  if([192,193,194].includes(marker)){
   if(n<8||bytes[i+2]!==8||![1,3].includes(bytes[i+7]))throw Error('Unsupported JPEG encoding');
   const height=(bytes[i+3]<<8)|bytes[i+4],width=(bytes[i+5]<<8)|bytes[i+6];
   if(!integer(width,1,LIMITS.imageSide)||!integer(height,1,LIMITS.imageSide))throw Error('Image dimensions outside limit');
   return {width,height};
  }
  i+=n;
 }
 throw Error('JPEG dimensions missing');
}
function readGLB(buffer){
 if(!(buffer instanceof ArrayBuffer)||buffer.byteLength<20||buffer.byteLength>MAX_BYTES)throw Error('Invalid GLB length');
 const view=new DataView(buffer);if(view.getUint32(0,true)!==0x46546c67||view.getUint32(4,true)!==2||view.getUint32(8,true)!==buffer.byteLength)throw Error('Invalid GLB header');
 let offset=12,document,bin=0,chunks=0,binStart,binLength;
 while(offset<buffer.byteLength){if(offset+8>buffer.byteLength)throw Error('Truncated GLB');const length=view.getUint32(offset,true),type=view.getUint32(offset+4,true);if(length%4||offset+8+length>buffer.byteLength)throw Error('Invalid GLB chunk');
  if(chunks===0&&type!==0x4e4f534a)throw Error('Missing JSON chunk');
  if(type===0x4e4f534a){if(document)throw Error('Duplicate JSON chunk');document=JSON.parse(new TextDecoder().decode(buffer.slice(offset+8,offset+8+length)));}else if(type===0x004e4942){bin++;binStart=offset+8;binLength=length;if(bin>1)throw Error('Duplicate BIN chunk');}else throw Error('Unsupported chunk');offset+=8+length;chunks++;
 }
 if(document?.asset?.version!=='2.0'||!document.meshes?.length||document.animations?.length||document.skins?.length)throw Error('Unsupported GLB scene');
 function visit(value){if(!value||typeof value!=='object')return;if(value.extensions&&Object.keys(value.extensions).length)throw Error('Unsupported extension');for(const child of Object.values(value))visit(child);}visit(document);
 if(document.extensionsRequired?.length||document.extensionsUsed?.length||(document.buffers||[]).some(b=>'uri' in b)||bin!==1||document.buffers?.length!==1)throw Error('External or unsupported GLB resource');
 const declared=document.buffers[0].byteLength;if(!integer(declared,1,binLength)||binLength-declared>3)throw Error('Invalid binary buffer');
 for(const v of document.bufferViews||[])if(v.buffer!==0||!integer(v.byteOffset??0,0,declared)||!integer(v.byteLength,1,declared)||(v.byteOffset??0)+v.byteLength>declared)throw Error('Invalid buffer view');
 for(const mesh of document.meshes)for(const p of mesh.primitives||[]){if((p.mode??4)!==4||p.targets?.length)throw Error('Unsupported primitive');}
 if((document.accessors||[]).some(a=>a.sparse||!integer(a.count,0,300000)))throw Error('Unsupported accessor');
 return {document,binStart};
}
function textures(buffer,{document:d,binStart}){
 const images=d.images||[],maps=d.textures||[],materials=d.materials||[],samplers=d.samplers||[];
 if(![images,maps,materials,samplers].every(Array.isArray)||images.length>LIMITS.images||maps.length>LIMITS.textures||materials.length>LIMITS.materials||samplers.length>LIMITS.textures)throw Error('Image, texture or material count outside limit');
 let imageBytes=0,decodedBytes=0,textureBytes=0;
 const inspected=images.map(im=>{
  if('uri' in im||im.mimeType!=='image/jpeg'||!integer(im.bufferView,0,(d.bufferViews||[]).length-1))throw Error('Unsupported embedded image');
  const v=d.bufferViews[im.bufferView];if(v.byteStride!==undefined||v.target!==undefined||v.byteLength>LIMITS.imageBytes)throw Error('Embedded image outside limit');
  const offset=binStart+(v.byteOffset||0),bytes=new Uint8Array(buffer,offset,v.byteLength),size=jpegSize(bytes);
  imageBytes+=bytes.length;decodedBytes+=size.width*size.height*4;return {...size,offset,bytes:bytes.length};
 });
 for(const t of maps){
  if(!integer(t.source,0,images.length-1)||(t.sampler!==undefined&&!integer(t.sampler,0,samplers.length-1)))throw Error('Invalid texture reference');
  const im=inspected[t.source];textureBytes+=Math.ceil(im.width*im.height*4*4/3);
 }
 for(const sampler of samplers){for(const [key,allowed]of Object.entries({magFilter:[9728,9729],minFilter:[9728,9729,9984,9985,9986,9987],wrapS:[33071,33648,10497],wrapT:[33071,33648,10497]}))if(sampler[key]!==undefined&&!allowed.includes(sampler[key]))throw Error('Unsupported sampler');}
 let count=0;
 for(const m of materials){
  if(m.emissiveTexture)throw Error('Texture map outside pilot');
  if(m.normalTexture?.scale!==undefined&&(!Number.isFinite(m.normalTexture.scale)||Math.abs(m.normalTexture.scale)>4))throw Error('Invalid normal scale');
  for(const info of [m.pbrMetallicRoughness?.baseColorTexture,m.pbrMetallicRoughness?.metallicRoughnessTexture,m.normalTexture,m.occlusionTexture])if(info){count++;if(!integer(info.index,0,maps.length-1)||(info.texCoord??0)!==0)throw Error('Unsupported material texture');}
 }
 if(count>LIMITS.maps||imageBytes>LIMITS.imageTotalBytes||decodedBytes>LIMITS.decodedBytes||textureBytes>LIMITS.textureBytes)throw Error('Texture memory outside limit');
 return {images:inspected,stats:{images:images.length,textures:maps.length,maps:count,imageBytes,decodedBytes,textureBytes}};
}
export function inspectGLB(buffer){const data=readGLB(buffer);textures(buffer,data);return data.document;}
export function inspectTextures(buffer){return textures(buffer,readGLB(buffer)).stats;}
export function dispose(scene){
 const geometries=new Set(),materials=new Set(),textures=new Set(),images=new Set();
 scene.traverse(o=>{if(o.geometry)geometries.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material])if(m){materials.add(m);for(const v of Object.values(m))if(v?.isTexture){textures.add(v);if(v.image?.close)images.add(v.image);}}});
 geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());images.forEach(i=>i.close());
}
export function normalize(scene,entry){
 const root=new THREE.Group();root.add(scene);root.scale.setScalar(entry.normalization.unitToMeter);root.rotation.set(...entry.normalization.rotationDeg.map(v=>v*Math.PI/180));root.updateMatrixWorld(true);
 let bounds=new THREE.Box3().setFromObject(root),size=bounds.getSize(new THREE.Vector3());
 if(![size.x,size.y,size.z].every(v=>Number.isFinite(v)&&v>0))throw Error('Invalid bounding box');
 const measured={width:size.x*1000,height:size.y*1000,depth:size.z*1000};
 if(Object.keys(measured).some(k=>Math.abs(measured[k]-entry.dimensionsMm[k])>20))throw Error('Dimensions differ by more than 20 mm');
 const support=new THREE.Group();support.add(root);root.position.set(-(bounds.min.x+bounds.max.x)/2,-bounds.min.y,-(bounds.min.z+bounds.max.z)/2);support.updateMatrixWorld(true);
 let triangles=0,geometryBytes=0;support.traverse(o=>{if(o.isMesh){const p=o.geometry.attributes.position;triangles+=(o.geometry.index?.count??p.count)/3;geometryBytes+=Object.values(o.geometry.attributes).reduce((n,a)=>n+a.array.byteLength,0)+(o.geometry.index?.array.byteLength||0);o.castShadow=o.receiveShadow=true;}});
 if(!Number.isFinite(triangles)||triangles<=0)throw Error('Empty model');
 return {scene:support,dimensionsMm:measured,triangles,geometryBytes};
}
async function download(url,limit,signal){
 const absolute=new URL(url,location.href);if(absolute.origin!==location.origin||absolute.search||absolute.hash||!absolute.pathname.startsWith(new URL('assets/f3/',location.href).pathname))throw Error('Asset path is not approved');
 const response=await fetch(absolute,{signal,credentials:'same-origin',redirect:'error',cache:'no-cache'});if(!response.ok)throw Error(absolute.pathname+': HTTP '+response.status);
 const reader=response.body.getReader(),chunks=[];let length=0;try{while(true){const {done,value}=await reader.read();if(done)break;length+=value.length;if(length>limit)throw Error('Resource limit exceeded');chunks.push(value);}}finally{await reader.cancel();}
 const bytes=new Uint8Array(length);let n=0;for(const b of chunks){bytes.set(b,n);n+=b.length;}return bytes.buffer;
}
const digest=async buffer=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',buffer)),b=>b.toString(16).padStart(2,'0')).join('');
export async function load(entry,{timeoutMs=8000,signal}={}){
 const controller=new AbortController(),abort=()=>controller.abort();signal?.addEventListener('abort',abort,{once:true});if(signal?.aborted)abort();
 const timer=setTimeout(abort,timeoutMs),start=performance.now(),bitmaps=[],createdTextures=[];let parsed;
 const check=()=>{if(controller.signal.aborted)throw Error('Loading aborted');};
 const cleanup=()=>{if(parsed)dispose(parsed.scene);createdTextures.splice(0).forEach(t=>t.dispose());bitmaps.splice(0).forEach(i=>i.close());};
 let rejectAbort;const canceled=new Promise((_,reject)=>{rejectAbort=()=>reject(Error('Loading aborted'));controller.signal.addEventListener('abort',rejectAbort,{once:true});if(controller.signal.aborted)rejectAbort();});
 const task=(async()=>{try{
  check();const permission=await download(entry.permissionUrl,32768,controller.signal);check();if(await digest(permission)!==entry.permissionSha256)throw Error('Permission document changed');
  const buffer=await download(entry.url,Math.min(entry.bytes,MAX_BYTES),controller.signal);check();if(buffer.byteLength!==entry.bytes||await digest(buffer)!==entry.sha256)throw Error('Model integrity changed');
  const data=readGLB(buffer),info=textures(buffer,data);check();
  for(const im of info.images){
   const bitmap=await createImageBitmap(new Blob([new Uint8Array(buffer,im.offset,im.bytes)],{type:'image/jpeg'}),{premultiplyAlpha:'none',colorSpaceConversion:'none'});bitmaps.push(bitmap);check();
   if(bitmap.width!==im.width||bitmap.height!==im.height)throw Error('Decoded image size differs');
  }
  const filters={9728:THREE.NearestFilter,9729:THREE.LinearFilter,9984:THREE.NearestMipmapNearestFilter,9985:THREE.LinearMipmapNearestFilter,9986:THREE.NearestMipmapLinearFilter,9987:THREE.LinearMipmapLinearFilter},wraps={33071:THREE.ClampToEdgeWrapping,33648:THREE.MirroredRepeatWrapping,10497:THREE.RepeatWrapping};
  const loader=new GLTFLoader();loader.register(parser=>({name:'F3EmbeddedJPEG',loadTexture(index){
   check();const def=data.document.textures[index],sampler=data.document.samplers?.[def.sampler]||{},texture=new THREE.Texture(bitmaps[def.source]);
   texture.flipY=false;texture.name=def.name||'';texture.magFilter=filters[sampler.magFilter]||THREE.LinearFilter;texture.minFilter=filters[sampler.minFilter]||THREE.LinearMipmapLinearFilter;texture.wrapS=wraps[sampler.wrapS]||THREE.RepeatWrapping;texture.wrapT=wraps[sampler.wrapT]||THREE.RepeatWrapping;texture.needsUpdate=true;
   createdTextures.push(texture);parser.associations.set(texture,{textures:index});return Promise.resolve(texture);
  }}));
  parsed=await loader.parseAsync(buffer,'');check();const result=normalize(parsed.scene,entry);check();
  return {...result,bytes:buffer.byteLength,permissionBytes:permission.byteLength,durationMs:performance.now()-start,textureStats:info.stats,attribution:entry.attribution};
 }catch(error){cleanup();throw error;}})();
 try{return await Promise.race([task,canceled]);}catch(error){cleanup();throw error;}finally{clearTimeout(timer);controller.signal.removeEventListener('abort',rejectAbort);signal?.removeEventListener('abort',abort);}
}
