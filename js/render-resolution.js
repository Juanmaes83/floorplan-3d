/* Render IA · descarga 2K y 4K con dimensiones reales (§3, encargo 121ad35a).
   Para 16:9: 2560 × 1440 y 3840 × 2160 UHD. Otras proporciones: se conserva el encuadre con el lado largo equivalente
   (2560 o 3840) y se muestran las dimensiones exactas. «4K nativo» SOLO si el original ya tiene ese tamaño o más;
   si se amplía, «4K reescalado desde W × H». Tras generar el PNG se leen sus píxeles reales y eso es lo que se muestra. */
(function(root,factory){const c=factory();if(typeof module==='object'&&module.exports)module.exports=c;else root.RubikRenderResolution=c;})(typeof self!=='undefined'?self:globalThis,function(){'use strict';
 const TARGETS=Object.freeze([{key:'2k',name:'2K',long:2560},{key:'4k',name:'4K',long:3840}]);
 function size(w,h,long){if(!(w>0&&h>0))throw Error('size');const land=w>=h,r=land?h/w:w/h,short=Math.round(long*r);return land?{width:long,height:short}:{width:short,height:long};}
 function options(w,h){return TARGETS.map(t=>{const s=size(w,h,t.long),native=Math.max(w,h)>=t.long;
  return {...t,...s,native,source:{width:w,height:h},label:native?`${t.name} nativo · ${s.width} × ${s.height}`:`${t.name} reescalado desde ${w} × ${h} · ${s.width} × ${s.height}`};});}
 // Navegador: escala en un lienzo con suavizado de alta calidad y devuelve el PNG y sus píxeles REALES (leídos del archivo).
 async function exportPng(src,opt){const img=new Image();img.src=src;await img.decode();const c=document.createElement('canvas');c.width=opt.width;c.height=opt.height;
  const x=c.getContext('2d');x.imageSmoothingEnabled=true;x.imageSmoothingQuality='high';x.drawImage(img,0,0,opt.width,opt.height);
  const blob=await new Promise((ok,ko)=>c.toBlob(b=>b?ok(b):ko(Error('png')),'image/png'));const real=pngSize(new Uint8Array(await blob.slice(0,32).arrayBuffer()));
  if(!real||real.width!==opt.width||real.height!==opt.height)throw Error('size-mismatch');return {blob,...real,native:opt.native,label:opt.label};}
 function pngSize(b){if(!b||b.length<24||b[1]!==0x50||b[2]!==0x4e||b[3]!==0x47)return null;const v=new DataView(b.buffer,b.byteOffset,b.byteLength);return {width:v.getUint32(16),height:v.getUint32(20)};}
 return Object.freeze({TARGETS,size,options,exportPng,pngSize});});
