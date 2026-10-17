/* "Subir plano": one picker and drag & drop. The format is detected from the bytes and routed to the existing
   project, ZIP and image flows; other formats are converted locally in the browser. Nothing is uploaded. */
(function(){
 const I=window.FloorPlanIntake,T=window.FloorPlanTracing,$=s=>document.querySelector(s);
 const traceUI=()=>window.FloorPlanTraceUI,app=()=>window.FloorPlanApp;
 const say=(message,ms=6000)=>toast(message,ms);
 const loaded=new Map(),base=document.baseURI;
 const script=src=>{if(!loaded.has(src))loaded.set(src,new Promise((ok,ko)=>{const s=document.createElement('script');s.src=new URL(src,base).href;s.onload=ok;s.onerror=()=>{loaded.delete(src);ko(Error('No se pudo cargar el conversor local ('+src+'). Revisa la conexión y vuelve a intentarlo.'));};document.head.append(s);}));return loaded.get(src);};
 async function webIfc(){const W=await import(new URL('vendor/web-ifc/web-ifc-api.js',base).href),api=new W.IfcAPI();api.SetWasmPath(new URL('vendor/web-ifc/',base).href,true);await api.Init();return {W,api};}
 async function pdfjs(){const lib=await import(new URL('vendor/pdfjs/pdf.min.mjs',base).href);lib.GlobalWorkerOptions.workerSrc=new URL('vendor/pdfjs/pdf.worker.min.mjs',base).href;return lib;}
 const stem=name=>(name||'plano').replace(/\.[^.]*$/,'').slice(0,120).trim()||'plano';
 const decodeText=bytes=>{try{return new TextDecoder('utf-8',{fatal:true}).decode(bytes);}catch{return new TextDecoder('windows-1252').decode(bytes);}};
 const canvasBlob=(canvas,type,quality)=>new Promise(ok=>canvas.toBlob(ok,type,quality));

 // Draws any decoded source on a white canvas within the app raster limits and encodes it under 15 MiB.
 async function rasterFile(source,width,height,name){
  const fit=I.fitRaster(width,height),canvas=document.createElement('canvas');canvas.width=fit.width;canvas.height=fit.height;
  const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,fit.width,fit.height);ctx.drawImage(source,0,0,fit.width,fit.height);
  let blob=await canvasBlob(canvas,'image/png'),type='png';
  for(const quality of [.92,.8,.65]){if(blob&&blob.size<=T.LIMITS.bytes)break;blob=await canvasBlob(canvas,'image/jpeg',quality);type='jpg';}
  if(!blob||blob.size>T.LIMITS.bytes)throw Error('La imagen convertida sigue superando 15 MiB. Exporta una versión más ligera.');
  return {file:new File([blob],`${stem(name)}.${type}`,{type:blob.type}),fit};
 }
 async function bitmap(blob){try{return await createImageBitmap(blob,{imageOrientation:'from-image'});}catch{throw Error('No se pudo decodificar la imagen. Puede estar dañada o usar una variante no compatible.');}}
 function pickPdfPage(total,name){
  const dialog=$('#uploadPdfPage'),input=$('#uploadPdfNumber');input.max=total;input.value=1;$('#uploadPdfInfo').textContent=`«${name}» tiene ${total} páginas. Elige la que contiene la planta.`;
  return new Promise(resolve=>{dialog.addEventListener('close',()=>{const n=Math.round(Number(input.value));resolve(dialog.returnValue==='ok'&&n>=1&&n<=total?n:null);},{once:true});dialog.returnValue='';dialog.showModal();});
 }

 function pickPdfMode(detected,count){
  const dialog=$('#uploadPdfMode'),input=$('#uploadPdfScale');input.value=detected||100;
  $('#uploadPdfModeInfo').textContent=`La página contiene ${count} trazos vectoriales. Puedes importar los muros, puertas, ventanas y estancias con medidas (escala ${detected?`1:${detected} detectada en el plano`:'no indicada en el plano: compruébala'}) o usarla como imagen para calibrar a mano.`;
  return new Promise(resolve=>{dialog.addEventListener('close',()=>{const scale=Math.round(Number(input.value));resolve(dialog.returnValue==='vector'?(scale>=1&&scale<=1000?{mode:'vector',scale}:{mode:'raster'}):dialog.returnValue==='raster'?{mode:'raster'}:null);},{once:true});dialog.returnValue='';dialog.showModal();});
 }
 const converters={
  async pdf(bytes,name,kind,session){
   const lib=await pdfjs(),task=lib.getDocument({data:bytes.slice(),isEvalSupported:false});let doc;try{doc=await task.promise;}catch{await task.destroy();throw Error('No se pudo abrir el PDF. Puede estar protegido con contraseña o dañado.');}
   try{
    if(!app().fileImportCurrent(session))return null;
    const number=doc.numPages>1?await pickPdfPage(doc.numPages,name):1;if(!number)return null;
    const page=await doc.getPage(number),vec=I.pdfVectorExtract(await page.getOperatorList(),lib.OPS),count=vec.rects.length*4+vec.heavy.length;
    if(!app().fileImportCurrent(session))return null;
    if(count>=8){
     const text=await page.getTextContent();if(!app().fileImportCurrent(session))return null;
     const labels=text.items.filter(t=>t.str&&t.str.trim()).map(t=>({text:t.str,point:{x:t.transform[4],y:t.transform[5]}})),choice=await pickPdfMode(I.pdfScaleFromText(labels.map(l=>l.text)),count);
     if(!choice)return null;
     if(choice.mode==='vector'){try{return {...I.pdfToProject(vec,{name:stem(name),scale:choice.scale,labels}),page:number,pages:doc.numPages};}catch(e){say(`${e.message} Se importa como imagen.`,8000);}}
    }
    const unit=page.getViewport({scale:1}),dpi=300,fit=I.fitRaster(unit.width*dpi/72,unit.height*dpi/72),scale=dpi/72*fit.factor,viewport=page.getViewport({scale});
    const canvas=document.createElement('canvas');canvas.width=Math.floor(viewport.width);canvas.height=Math.floor(viewport.height);const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);
    await page.render({canvasContext:ctx,viewport,background:'#ffffff'}).promise;
    const out=await rasterFile(canvas,canvas.width,canvas.height,name);
    return {...out,detail:`PDF página ${number} de ${doc.numPages} a ${Math.round(dpi*fit.factor)} ppp (${canvas.width}×${canvas.height} px)`};
   }finally{await task.destroy();}
  },
  async heic(bytes,name){
   await script('vendor/heic2any/heic2any.min.js');let out;
   try{out=await window.heic2any({blob:new Blob([bytes],{type:'image/heic'}),toType:'image/png'});}catch{throw Error('No se pudo decodificar el HEIC/HEIF. Exporta una copia JPG desde el dispositivo.');}
   const image=await bitmap(Array.isArray(out)?out[0]:out);try{const r=await rasterFile(image,image.width,image.height,name);return {...r,detail:`HEIC convertido (${r.fit.width}×${r.fit.height} px)`};}finally{image.close();}
  },
  async tiff(bytes,name){
   await script('vendor/pako/pako.min.js');await script('vendor/utif/UTIF.js');
   const U=window.UTIF,buffer=bytes.slice().buffer,ifds=U.decode(buffer).filter(f=>f.t256&&f.t257);if(!ifds.length)throw Error('TIFF sin imagen legible.');
   const ifd=ifds[0];if(ifd.t256[0]*ifd.t257[0]>150e6)throw Error('TIFF demasiado grande para convertirlo en el navegador (más de 150 megapíxeles).');
   U.decodeImage(buffer,ifd);const rgba=U.toRGBA8(ifd),w=ifd.width,h=ifd.height,full=document.createElement('canvas');full.width=w;full.height=h;full.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(rgba.buffer,rgba.byteOffset,w*h*4),w,h),0,0);
   const r=await rasterFile(full,w,h,name);return {...r,detail:`TIFF convertido (${w}×${h} → ${r.fit.width}×${r.fit.height} px)`};
  },
  async svg(bytes,name){
   const url=URL.createObjectURL(new Blob([bytes],{type:'image/svg+xml'}));
   try{
    const img=new Image();img.decoding='async';img.src=url;try{await img.decode();}catch{throw Error('SVG no válido o con referencias externas no admitidas.');}
    const w=img.naturalWidth||2000,h=img.naturalHeight||Math.round(2000*.75),k=4000/Math.max(w,h),r=await rasterFile(img,Math.round(w*k),Math.round(h*k),name);
    return {...r,detail:`SVG rasterizado (${r.fit.width}×${r.fit.height} px)`};
   }finally{URL.revokeObjectURL(url);}
  },
  // Native PNG/JPEG/WebP keep their original bytes when the existing validation accepts them as they are.
  async raster(bytes,name,kind){
   const mediaType={png:'image/png',jpeg:'image/jpeg',webp:'image/webp',gif:'image/gif',bmp:'image/bmp',avif:'image/avif'}[kind];
   if(['png','jpeg','webp'].includes(kind)){
    try{const info=T.imageInfo(bytes,mediaType,`plano.${kind==='jpeg'?'jpg':kind}`);if(T.orientationAngle(info)!==undefined)return {file:new File([bytes],`${stem(name)}.${kind==='jpeg'?'jpg':kind}`,{type:mediaType}),detail:null};}
    catch(e){if(!/8000 px|15 MiB|EXIF|Orientación/.test(e.message))throw e;}
   }
   const image=await bitmap(new Blob([bytes],{type:mediaType}));
   try{const r=await rasterFile(image,image.width,image.height,name),reduced=r.fit.factor<1;return {...r,detail:reduced?`${I.LABELS[kind]} reducido de ${image.width}×${image.height} a ${r.fit.width}×${r.fit.height} px`:`${I.LABELS[kind]} normalizado a ${r.file.type==='image/png'?'PNG':'JPG'} (orientación aplicada)`};}finally{image.close();}
  }
 };

 let active=null;
 const cancelButton=$('#uploadCancel');
 function setBusy(value){document.body.classList.toggle('uploading',value);cancelButton.hidden=!value;}
 function cancelDialogs(){active=null;setBusy(false);for(const id of ['uploadPdfPage','uploadPdfMode']){const dialog=$('#'+id);if(dialog.open){dialog.returnValue='cancel';dialog.close();}}}
 function cancel(){app().cancelFileImport();say('Importación cancelada. El proyecto actual se conserva.');}
 async function upload(file){
  if(active&&app().fileImportCurrent(active)){say('Ya se está procesando un plano. Puedes cancelar la importación.');return;}
  if(!file)return;
  if(file.size>Math.max(I.LIMITS.uploadBytes,T.LIMITS.packageBytes)){say('El archivo supera el límite de importación. Exporta una versión más ligera.');return;}
  const session=app().beginFileImport(),current=()=>app().fileImportCurrent(session);active=session;setBusy(true);
  const adopt=(project,name)=>traceUI().adoptProject(project,name,{transaction:session,origin:'import'});
  try{
   const bytes=new Uint8Array(await file.arrayBuffer()),kind=I.sniff(bytes,file.name);
   if(!current())return;
   if(kind==='zip'){if(await traceUI().importZip(file,{transaction:session}))say('Proyecto ZIP importado.');return;}
   if(file.size>I.LIMITS.uploadBytes)throw Error('El archivo supera 200 MB. Exporta una versión más ligera del plano.');
   if(kind==='json'){
    let value;try{value=JSON.parse(decodeText(bytes));}catch{throw Error('El archivo JSON no es válido o está incompleto.');}
    const type=I.classifyJson(value);
    if(type==='roomplan'){const {project,report}=I.roomPlanToProject(value,{name:stem(file.name)});if(adopt(project,stem(file.name)))say(`Escaneo RoomPlan importado: ${report.walls} muros, ${report.openings} puertas, ventanas o huecos y ${report.rooms} ${report.rooms===1?'estancia':'estancias'}${report.skippedOpenings?`; ${report.skippedOpenings} huecos sin muro cercano`:''}. Revisa las medidas.`,9000);return;}
    if(type==='geojson')throw Error(I.GUIDANCE.geojson);
    await app().importProjectFile(file,{fromUpload:true,transaction:session});return;
   }
   if(kind==='dxf'){
    await script('vendor/dxf-parser/dxf-parser.js');if(!current())return;let dxf;try{dxf=new window.DxfParser().parseSync(decodeText(bytes));}catch{throw Error('No se pudo leer el DXF. Guárdalo como DXF ASCII (R2000 o posterior) y súbelo de nuevo.');}
    const {project,report}=I.dxfToProject(dxf,{name:stem(file.name)});if(!adopt(project,stem(file.name)))return;
    const o=report.openings,plural=(n,one,many)=>`${n} ${n===1?one:many}`;
    say(`DXF importado en ${report.units}${report.assumedUnits?' (el archivo no declara unidades)':''}: ${plural(report.walls,'muro','muros')} (${report.paired} con grosor medido), ${plural(o.door,'puerta','puertas')}, ${plural(o.window,'ventana','ventanas')}${o.opening?`, ${plural(o.opening,'hueco','huecos')}`:''} y ${plural(report.rooms,'estancia','estancias')}${report.layerFilter?'':'; no hay capa de muros, se usaron todas las líneas'}${report.unplaced?`; ${report.unplaced} elementos sin muro cercano`:''}. Revisa el resultado.`,10000);return;
   }
   if(kind==='ifc'){
    say('Procesando IFC (BIM)…',60000);const {W,api}=await webIfc();let model;
    try{if(!current())return;model=I.ifcExtract(api,W,bytes);}catch(e){throw Error('No se pudo leer el IFC'+(e?.message?`: ${e.message}`:'')+'. Exporta IFC2x3 o IFC4 desde tu programa BIM.');}finally{api.Dispose?.();}
    const {project,report}=I.ifcToProject(model,{name:stem(file.name)});if(!adopt(project,stem(file.name)))return;
    const o=report.openings,plural=(n,one,many)=>`${n} ${n===1?one:many}`;
    say(`IFC importado: ${plural(report.walls,'muro','muros')}, ${plural(o.door,'puerta','puertas')}, ${plural(o.window,'ventana','ventanas')}${o.opening?`, ${plural(o.opening,'hueco','huecos')}`:''} y ${plural(report.rooms,'estancia','estancias')} (${report.roomsFrom==='IfcSpace'?'de los espacios IfcSpace':'deducidas de los muros'})${report.storeys>1?`. El modelo tiene ${report.storeys} plantas: se ha importado la que tiene más muros`:''}${report.unplaced?`; ${report.unplaced} huecos sin muro cercano`:''}. Revisa el resultado.`,10000);return;
   }
   const convert=kind==='pdf'?converters.pdf:kind==='heic'?converters.heic:kind==='tiff'?converters.tiff:kind==='svg'?converters.svg:['png','jpeg','webp','gif','bmp','avif'].includes(kind)?converters.raster:null;
   if(kind==='dwg'){const v=I.dwgVersion(bytes);throw Error(`DWG${v?` (AutoCAD ${v})`:''}: este formato cerrado no se puede abrir en el navegador. En AutoCAD usa «Guardar como › DXF» (o el conversor gratuito ODA File Converter) y sube el DXF: se importarán muros, puertas, ventanas y estancias con sus medidas.`);}
   if(!convert)throw Error(I.GUIDANCE[kind]||I.GUIDANCE.unknown);
   say(`Procesando ${I.LABELS[kind]}…`,60000);
   const out=await convert(bytes,file.name,kind,session);if(!current())return;if(!out){say('Subida cancelada.');return;}
   if(out.project){if(!adopt(out.project,stem(file.name)))return;const r=out.report,o=r.openings,plural=(n,one,many)=>`${n} ${n===1?one:many}`;say(`PDF vectorial (página ${out.page} de ${out.pages}, escala 1:${r.scale}): ${plural(r.walls,'muro','muros')}, ${plural(o.door,'puerta','puertas')}, ${plural(o.window,'ventana','ventanas')}${o.opening?`, ${plural(o.opening,'hueco','huecos')}`:''} y ${plural(r.rooms,'estancia','estancias')}. Revisa el resultado.`,10000);return;}
   const image=await traceUI().addImage(out.file,true,stem(file.name),{transaction:session});
   if(image)say(`${out.detail?out.detail+'. ':''}Plano cargado como nuevo proyecto. Calibra con una cota conocida antes de trazar.`,9000);
  }catch(err){if(current())say(err.message||String(err),9000);}
  finally{if(active===session){active=null;setBusy(false);}}
 }

 const input=$('#uploadIn');
 input.accept=['.pdf','.png','.jpg','.jpeg','.jfif','.webp','.heic','.heif','.tif','.tiff','.bmp','.gif','.avif','.svg','.dxf','.dwg','.ifc','.json','.zip','.usdz','application/pdf','image/*','application/json','application/zip'].join(',');
 const pick=()=>input.click();
 $('#uploadPlanBtn').onclick=pick;
 $('#importImage').onclick=()=>{document.querySelector('details.menu').open=false;pick();};
 cancelButton.onclick=cancel;
 input.onchange=e=>{const file=e.target.files[0];e.target.value='';upload(file);};

 const overlay=$('#dropOverlay');let depth=0;
 const hasFiles=e=>[...(e.dataTransfer?.types||[])].includes('Files');
 addEventListener('dragenter',e=>{if(!hasFiles(e))return;e.preventDefault();depth++;overlay.classList.add('show');});
 addEventListener('dragover',e=>{if(!hasFiles(e))return;e.preventDefault();e.dataTransfer.dropEffect='copy';});
 addEventListener('dragleave',e=>{if(!hasFiles(e))return;depth=Math.max(0,depth-1);if(!depth)overlay.classList.remove('show');});
 addEventListener('drop',e=>{if(!hasFiles(e))return;e.preventDefault();depth=0;overlay.classList.remove('show');const files=[...e.dataTransfer.files];if(files.length>1)say('Se sube un plano cada vez: se usará el primer archivo.');upload(files[0]);});

 addEventListener('keydown',e=>{if(e.key==='Escape'&&active&&!$('#uploadPdfMode').open&&!$('#uploadPdfPage').open)cancel();});
 window.FloorPlanUpload={upload,pick,cancel,cancelDialogs};
})();
