import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';

const MAX_BYTES=8*1024*1024;
export function inspectGLB(buffer){
 if(!(buffer instanceof ArrayBuffer)||buffer.byteLength<20||buffer.byteLength>MAX_BYTES)throw Error('Invalid GLB length');
 const view=new DataView(buffer);if(view.getUint32(0,true)!==0x46546c67||view.getUint32(4,true)!==2||view.getUint32(8,true)!==buffer.byteLength)throw Error('Invalid GLB header');
 let offset=12,document,bin=0,chunks=0;
 while(offset<buffer.byteLength){if(offset+8>buffer.byteLength)throw Error('Truncated GLB');const length=view.getUint32(offset,true),type=view.getUint32(offset+4,true);if(length%4||offset+8+length>buffer.byteLength)throw Error('Invalid GLB chunk');
  if(chunks===0&&type!==0x4e4f534a)throw Error('Missing JSON chunk');
  if(type===0x4e4f534a){if(document)throw Error('Duplicate JSON chunk');document=JSON.parse(new TextDecoder().decode(buffer.slice(offset+8,offset+8+length)));}else if(type===0x004e4942){bin++;if(bin>1)throw Error('Duplicate BIN chunk');}else throw Error('Unsupported chunk');offset+=8+length;chunks++;
 }
 if(document?.asset?.version!=='2.0'||!document.meshes?.length||document.animations?.length||document.skins?.length||document.textures?.length||document.images?.length)throw Error('Unsupported GLB scene');
 // Reject ALL extension occurrences, not only extensionsRequired. No subordinate fetches.
 function visit(value){if(!value||typeof value!=='object')return;if(value.extensions&&Object.keys(value.extensions).length)throw Error('Unsupported extension');for(const child of Object.values(value))visit(child);}visit(document);
 if(document.extensionsRequired?.length||document.extensionsUsed?.length||(document.buffers||[]).some(b=>b.uri)||bin!==1||document.buffers?.length!==1)throw Error('External or unsupported GLB resource');
 for(const mesh of document.meshes)for(const p of mesh.primitives||[]){if((p.mode??4)!==4||p.targets?.length)throw Error('Unsupported primitive');}
 if((document.accessors||[]).some(a=>a.sparse||!Number.isSafeInteger(a.count)||a.count<0||a.count>300000))throw Error('Unsupported accessor');
 return document;
}
export function dispose(scene){scene.traverse(o=>{o.geometry?.dispose();for(const m of Array.isArray(o.material)?o.material:[o.material])if(m){for(const v of Object.values(m))if(v?.isTexture)v.dispose();m.dispose();}});}
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
 const response=await fetch(absolute,{signal,credentials:'omit',redirect:'error',cache:'no-cache'});if(!response.ok)throw Error('Unavailable resource');
 const reader=response.body.getReader(),chunks=[];let length=0;try{while(true){const {done,value}=await reader.read();if(done)break;length+=value.length;if(length>limit)throw Error('Resource limit exceeded');chunks.push(value);}}finally{await reader.cancel();}
 const bytes=new Uint8Array(length);let n=0;for(const b of chunks){bytes.set(b,n);n+=b.length;}return bytes.buffer;
}
const digest=async buffer=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',buffer)),b=>b.toString(16).padStart(2,'0')).join('');
export async function load(entry,{timeoutMs=8000,signal}={}){
 const controller=new AbortController(),abort=()=>controller.abort();signal?.addEventListener('abort',abort,{once:true});if(signal?.aborted)abort();const timer=setTimeout(abort,timeoutMs),start=performance.now();let parsed;
 try{
  const permission=await download(entry.permissionUrl,32768,controller.signal);if(await digest(permission)!==entry.permissionSha256)throw Error('Permission document changed');
  const buffer=await download(entry.url,Math.min(entry.bytes,MAX_BYTES),controller.signal);if(buffer.byteLength!==entry.bytes||await digest(buffer)!==entry.sha256)throw Error('Model integrity changed');inspectGLB(buffer);
  parsed=await new GLTFLoader().parseAsync(buffer,'');if(controller.signal.aborted)throw Error('Loading aborted');const result=normalize(parsed.scene,entry);
  return {...result,bytes:buffer.byteLength,permissionBytes:permission.byteLength,durationMs:performance.now()-start,attribution:entry.attribution};
 }catch(error){if(parsed)dispose(parsed.scene);throw error;}finally{clearTimeout(timer);signal?.removeEventListener('abort',abort);}
}
