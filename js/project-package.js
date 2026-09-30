/* Minimal ZIP reader/writer. No third-party dependency. Stored and bounded raw DEFLATE input. */
(function(root){
 const C=typeof module==='object'?require('./project-core.js'):root.FloorPlanCore,T=typeof module==='object'?require('./tracing-core.js'):root.FloorPlanTracing;
 const encoder=new TextEncoder(),decoder=new TextDecoder('utf-8',{fatal:true});
 const table=Array.from({length:256},(_,n)=>{for(let i=0;i<8;i++)n=(n>>>1)^((n&1)?0xedb88320:0);return n>>>0;});
 function crc(bytes){let n=0xffffffff;for(const b of bytes)n=(n>>>8)^table[(n^b)&255];return (n^0xffffffff)>>>0;}
 function path(name){if(name!=='project.json'&&!/^images\/img_[A-Za-z0-9][A-Za-z0-9_-]{2,63}\.(png|jpg)$/.test(name))throw Error('Ruta ZIP no permitida: '+name);return name;}
 function zip(entries){let offset=0;const locals=[],central=[];
  for(const [name,value]of entries){path(name);const filename=encoder.encode(name),bytes=new Uint8Array(value),checksum=crc(bytes),header=new Uint8Array(30+filename.length),v=new DataView(header.buffer);v.setUint32(0,0x04034b50,true);v.setUint16(4,20,true);v.setUint16(6,0x800,true);v.setUint32(14,checksum,true);v.setUint32(18,bytes.length,true);v.setUint32(22,bytes.length,true);v.setUint16(26,filename.length,true);header.set(filename,30);locals.push(header,bytes);
   const c=new Uint8Array(46+filename.length),d=new DataView(c.buffer);d.setUint32(0,0x02014b50,true);d.setUint16(4,20,true);d.setUint16(6,20,true);d.setUint16(8,0x800,true);d.setUint32(16,checksum,true);d.setUint32(20,bytes.length,true);d.setUint32(24,bytes.length,true);d.setUint16(28,filename.length,true);d.setUint32(42,offset,true);c.set(filename,46);central.push(c);offset+=header.length+bytes.length;
  }
  const size=central.reduce((n,b)=>n+b.length,0),end=new Uint8Array(22),v=new DataView(end.buffer);v.setUint32(0,0x06054b50,true);v.setUint16(8,entries.size,true);v.setUint16(10,entries.size,true);v.setUint32(12,size,true);v.setUint32(16,offset,true);return new Blob([...locals,...central,end],{type:'application/zip'});
 }
 async function inflate(data,limit){if(typeof DecompressionStream!=='function')throw Error('Este navegador no puede leer ZIP comprimidos; usa el ZIP exportado por esta app.');const reader=new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw')).getReader(),parts=[];let size=0;try{while(true){const r=await reader.read();if(r.done)break;size+=r.value.length;if(size>limit){await reader.cancel();throw Error('ZIP descomprimido supera el límite.');}parts.push(r.value);}}finally{reader.releaseLock();}const out=new Uint8Array(size);let at=0;for(const p of parts){out.set(p,at);at+=p.length;}return out;}
 async function unzip(buffer){const b=new Uint8Array(buffer),v=new DataView(b.buffer,b.byteOffset,b.byteLength),entries=new Map();
  if(b.length<22||b.length>T.LIMITS.packageBytes)throw Error('ZIP vacío, corrupto o demasiado grande.');
  let end=-1;for(let i=b.length-22;i>=Math.max(0,b.length-65557);i--)if(v.getUint32(i,true)===0x06054b50&&i+22+v.getUint16(i+20,true)===b.length){end=i;break;}
  if(end<0)throw Error('ZIP sin directorio válido.');const count=v.getUint16(end+10,true),offset=v.getUint32(end+16,true),size=v.getUint32(end+12,true);
  if(v.getUint16(end+4,true)||v.getUint16(end+6,true)||v.getUint16(end+8,true)!==count||count<1||count>21||offset+size!==end)throw Error('ZIP multipartes/ZIP64 o directorio no válido.');
  let at=offset,total=0;const intervals=[];
  for(let i=0;i<count;i++){
   if(at+46>end||v.getUint32(at,true)!==0x02014b50)throw Error('Directorio ZIP corrupto.');
   const flags=v.getUint16(at+8,true),method=v.getUint16(at+10,true),checksum=v.getUint32(at+16,true),compressed=v.getUint32(at+20,true),length=v.getUint32(at+24,true),n=v.getUint16(at+28,true),extra=v.getUint16(at+30,true),comment=v.getUint16(at+32,true),start=v.getUint32(at+42,true);
   if(at+46+n+extra+comment>end||v.getUint16(at+34,true)||flags&~0x808||![0,8].includes(method)||(v.getUint32(at+38,true)>>>16&0xf000)===0xa000)throw Error('ZIP cifrado, enlace o método no compatible.');
   const name=path(decoder.decode(b.slice(at+46,at+46+n))),limit=name==='project.json'?T.LIMITS.jsonBytes:T.LIMITS.bytes;
   if(entries.has(name)||length>limit||total+length>T.LIMITS.packageBytes||start+30>offset||v.getUint32(start,true)!==0x04034b50)throw Error('ZIP duplicado, corrupto o excede los límites.');
   const ln=v.getUint16(start+26,true),le=v.getUint16(start+28,true),dataAt=start+30+ln+le,finish=dataAt+compressed;
   if(finish>offset||v.getUint16(start+6,true)!==flags||v.getUint16(start+8,true)!==method||decoder.decode(b.slice(start+30,start+30+ln))!==name)throw Error('Cabecera ZIP incoherente.');
   if(!(flags&8)&&(v.getUint32(start+14,true)!==checksum||v.getUint32(start+18,true)!==compressed||v.getUint32(start+22,true)!==length))throw Error('Longitudes ZIP incoherentes.');
   if(intervals.some(([a,z])=>start<z&&finish>a))throw Error('Entradas ZIP solapadas.');intervals.push([start,finish]);
   const content=method===0?b.slice(dataAt,finish):await inflate(b.slice(dataAt,finish),length);
   if(content.length!==length||crc(content)!==checksum)throw Error('CRC o tamaño ZIP incorrecto.');entries.set(name,content);total+=length;at+=46+n+extra+comment;
  }if(at!==end||!entries.has('project.json'))throw Error('ZIP sin project.json válido.');return entries;
 }
 async function digest(bytes){return [...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(n=>n.toString(16).padStart(2,'0')).join('');}
 async function validateEntries(entries,decodeImage){const project=C.prepare(decoder.decode(entries.get('project.json'))).project,images=[];const used=new Set(['project.json']);
  for(const image of project.sourceImages||[]){
   if(image.storage.kind!=='sidecar-file'||!image.storage.ref)throw Error('El ZIP requiere imágenes sidecar-file locales.');const ref=path(image.storage.ref),bytes=entries.get(ref);
   if(ref==='project.json'||used.has(ref)||!bytes)throw Error('Falta una imagen o hay referencias duplicadas.');used.add(ref);
   const info=T.imageInfo(bytes,image.mediaType);if(T.orientationAngle(info)===undefined)throw Error('Orientación EXIF reflejada no compatible; convierte la imagen a PNG.');if(info.widthPx!==image.widthPx||info.heightPx!==image.heightPx||image.bytes!==undefined&&image.bytes!==bytes.length||image.sha256!==undefined&&image.sha256!==await digest(bytes))throw Error('La imagen no coincide con sus dimensiones, bytes o huella.');
   if(decodeImage)await decodeImage(bytes,info);images.push({image,bytes,info});
  }if(used.size!==entries.size)throw Error('El ZIP contiene entradas ajenas al proyecto.');return {project,images};
 }
 async function encode(project,get){C.validate(project);const p=C.clone(project),entries=new Map();for(const image of p.sourceImages||[]){const blob=await get(image.storage.ref||image.id);if(!blob)throw Error('Imagen local no disponible: '+image.id);const bytes=new Uint8Array(await blob.arrayBuffer()),info=T.imageInfo(bytes,image.mediaType);image.widthPx=info.widthPx;image.heightPx=info.heightPx;image.bytes=bytes.length;image.sha256=await digest(bytes);delete image.originalFileName;image.storage={kind:'sidecar-file',ref:`images/${image.id}.${image.mediaType==='image/png'?'png':'jpg'}`};entries.set(image.storage.ref,bytes);}entries.set('project.json',encoder.encode(JSON.stringify(p,null,2)));return zip(entries);}
 const api={crc,zip,unzip,digest,validateEntries,encode};if(typeof module==='object')module.exports=api;else root.FloorPlanPackage=api;
})(globalThis);
