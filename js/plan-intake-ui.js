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
 // The join reader leaves ordinary RoomPlan import unchanged, including its multi-room handling.
 async function readJoinScan(file){
  if(file.size>I.LIMITS.uploadBytes)throw Error('El archivo supera 200 MB. Exporta una planta más ligera.');
  let bytes;
  try{bytes=new Uint8Array(await file.arrayBuffer());}
  catch{throw Error('El navegador no ha podido leer el archivo. Guarda una copia en este dispositivo y selecciónala.');}
  if(I.sniff(bytes,file.name)!=='json')throw Error('Este archivo no es un RoomPlan en JSON.');
  let value;
  try{value=JSON.parse(decodeText(bytes));}catch{throw Error('El JSON está incompleto o dañado.');}
  if(I.classifyJson(value)!=='roomplan')throw Error('El JSON no contiene un escaneo RoomPlan.');
  const surfaces=['walls','doors','windows','openings'].flatMap(key=>Array.isArray(value[key])?value[key]:[]);
  const stories=new Set(surfaces.map(surface=>surface?.story).filter(story=>story!==undefined));
  if((Array.isArray(value.rooms)&&value.rooms.length>1)||stories.size>1)throw Error('El archivo contiene varias plantas. Exporta una planta por archivo.');
  let converted;
  try{converted=I.roomPlanToProject(value,{name:stem(file.name)});}
  catch{throw Error('No se pudo reconstruir la planta de este escaneo.');}
  const {project,report}=converted,notes=[];
  if(Array.isArray(value.objects)&&value.objects.length)notes.push('Los objetos detectados no se importan.');
  if(report.skippedOpenings)notes.push('Huecos sin muro cercano: '+report.skippedOpenings+'.');
  return {file,project,notes};
 }
 async function joinSource(file){
  try{return await readJoinScan(file);}
  catch(error){return {file,error:error.message+' Elige otro archivo RoomPlan en JSON. La planta actual no ha cambiado.'};}
 }
 const svgNode=(name,attrs)=>{
  const node=document.createElementNS('http://www.w3.org/2000/svg',name);
  for(const [key,value] of Object.entries(attrs))node.setAttribute(key,value);
  return node;
 };
 function drawRoomPlanJoin(preview,target,result){
  preview.replaceChildren();preview.toggleAttribute('hidden',!result?.view);
  if(!result?.view)return;
  const {addedWalls,targetReference,reference}=result.view;
  const fixed=target.walls.filter(w=>w.status!=='demolished'),walls=[...fixed,...addedWalls];
  const points=walls.flatMap(w=>[w.start,w.end]),xs=points.map(p=>p.x),ys=points.map(p=>p.y);
  const x=Math.min(...xs),y=Math.min(...ys),w=Math.max(...xs)-x,h=Math.max(...ys)-y,margin=Math.max(w,h)*.06+100;
  preview.setAttribute('viewBox',[x-margin,y-margin,w+2*margin,h+2*margin].join(' '));
  const draw=(list,color)=>list.forEach(wall=>preview.append(svgNode('line',{
   x1:wall.start.x,y1:wall.start.y,x2:wall.end.x,y2:wall.end.y,stroke:color,'stroke-width':wall.thicknessMm
  })));
  draw(fixed,'#344351');draw(addedWalls,'#b24c25');
  const clashes=result.state==='overlap';
  preview.setAttribute('aria-label',clashes?'Vista previa bloqueada. La trama señala el escaneo en conflicto y el contorno discontinuo los elementos afectados de la planta.':'Vista previa de la planta y del escaneo alineado');
  if(clashes){
   // User-space spacing follows the drawing scale, keeping the pattern legible at each zoom.
   const spacing=Math.max(w,h)*.030,stroke=spacing/5;
   const pattern=svgNode('pattern',{id:'roomPlanConflictHatch',width:spacing,height:spacing,patternUnits:'userSpaceOnUse'});
   pattern.append(svgNode('path',{d:'M '+(-spacing/2)+' '+spacing/2+' L '+spacing/2+' '+(-spacing/2)+' M 0 '+spacing+' L '+spacing+' 0 M '+spacing/2+' '+(spacing*1.5)+' L '+(spacing*1.5)+' '+spacing/2,stroke:'#a3261b','stroke-width':stroke}));
   const defs=svgNode('defs',{});defs.append(pattern);preview.append(defs);
   for(const conflict of result.conflicts){
    for(const [side,rings] of [['fixed',conflict.fixed],['moving',conflict.moving]])for(const ring of rings){
     preview.append(svgNode('polygon',{
      points:ring.map(p=>p.x+','+p.y).join(' '),
      fill:side==='moving'?'url(#roomPlanConflictHatch)':'none',stroke:'#a3261b','stroke-width':2,
      'stroke-dasharray':side==='fixed'?'5 3':'none','vector-effect':'non-scaling-stroke','data-conflict':side
     }));
    }
   }
  }
  const markerSize=Math.max(w,h)*.08;
  for(const [p,letter,color,direction] of [[targetReference,'A','#344351',1],[reference,'B','#b24c25',-1]]){
   const r=Math.max(45,margin*.16),x=p.x+direction*(r+markerSize/3);
   preview.append(svgNode('circle',{cx:p.x,cy:p.y,r,fill:color,stroke:'#fff','stroke-width':2,'vector-effect':'non-scaling-stroke'}));
   const mark=svgNode('text',{x,y:p.y,'text-anchor':direction>0?'start':'end','dominant-baseline':'middle','font-size':markerSize,'font-weight':700,fill:color,stroke:'#fff','stroke-width':r/2,'paint-order':'stroke'});
   mark.textContent=letter;preview.append(mark);
  }
 }
 let replaceJoinScan=null;
 function previewRoomPlan(initial,session,actions){
  const A=window.FloorPlanScanAlignment,target=app().project;
  const dialog=$('#roomPlanJoinDialog'),fixed=$('#roomPlanFixedDoor'),moving=$('#roomPlanMovingDoor');
  const preview=$('#roomPlanJoinPreview'),status=$('#roomPlanJoinStatus'),apply=$('#roomPlanJoinApply');
  const replace=$('#roomPlanReplace'),independent=$('#roomPlanIndependent'),tryPair=$('#roomPlanTryPair');
  const label=app().levelContext?.levelName||nm(target.name);
  $('#roomPlanJoinFloor').textContent='Destino: '+label+'. A = plano actual. B = escaneo naranja. Medidas estimadas.';
  const reason={wall:'Necesita un muro recto y presente en la planta.',interior:'Comunica varias estancias.',unbounded:'No limita con una estancia cerrada.'};
  let source,review,eligible,selection,suggestion,searchState,generation=0,busy=false,problem=null;
  const pair=()=>({targetId:fixed.value,movingId:moving.value});
  const inspect=(ids,details=true)=>{
   try{return review.inspect(ids,{details});}catch{return {state:'failed'};}
  };
  function doorOptions(select,choices){
   select.replaceChildren();
   const labels=[];
   for(const [i,choice] of choices.entries()){
    const {door,rooms,center}=choice;
    const names=rooms.map(room=>roomDisplay(room)).join(' / ');
    const text='Puerta '+(i+1)+' · '+(names?names+' · ':'')+door.widthMm+' mm'+(center?' · ('+Math.round(center.x)+', '+Math.round(center.y)+')':'');
    const option=new Option(text+(choice.reason?' · no elegible':''),door.id);
    option.disabled=!!choice.reason;select.append(option);
    if(choice.reason)labels.push(text+': '+reason[choice.reason]);
   }
   const first=[...select.options].find(option=>!option.disabled);
   if(first)select.value=first.value;
   else select.prepend(new Option('Sin puertas elegibles','',true,true));
   select.disabled=!first||busy;
   return labels;
  }
  function showStatus(){
   const valid=selection?.state==='compatible'&&!busy&&!problem?.blocks;
   apply.disabled=!valid;apply.classList.toggle('primary',valid);
   apply.textContent=valid?'Unir a esta planta':'Unión no disponible';
   tryPair.hidden=valid||busy||!suggestion||!!problem?.blocks;
   independent.hidden=valid||busy||!source||!!problem?.blocks;
   replace.disabled=busy;
   let tone='blocked',heading,message;
   if(busy){tone='info';heading='Leyendo el escaneo';message='La planta actual se conserva.';}
   else if(problem){tone='error';heading=problem.title;message=problem.message;}
   else if(!selection){heading='No hay puertas elegibles';message='Revisa A y B en «Cómo elegir las puertas». Usa un escaneo con una puerta al borde de una estancia cerrada, o impórtalo por separado. La planta actual no ha cambiado.';}
   else if(selection.state==='overlap'){
    heading='Estas puertas hacen que los planos se solapen';
    message='Las marcas muestran los muros o estancias afectados. Elige otra pareja o importa el escaneo por separado. La planta actual no ha cambiado.';
    if(searchState==='running')message+=' Estamos comprobando las otras parejas.';
    if(searchState==='none'){heading='Ninguna pareja compatible';message='Las puertas disponibles producen solapamiento al intentar unir estos planos. La vista previa marca el solapamiento. Prueba otro escaneo o impórtalo por separado. La planta actual no ha cambiado.';}
    if(searchState==='unconfirmed')message+=' Algunas parejas no se pudieron comprobar.';
   }else if(selection.state==='scale'){
    heading='La escala del destino impide unir esta planta';message='Añadir medidas estimadas cambiaría el estado de la escala. Importa el escaneo por separado para conservar las medidas actuales. La planta no ha cambiado.';
   }else if(valid){
    tone='info';heading='Pareja compatible';message='Distancia entre ejes de muro: '+selection.view.gapMm+' mm. Diferencia de ancho entre puertas: '+selection.view.widthDifferenceMm+' mm. Revisa la vista previa antes de unir.';
   }else{
    heading=['none','unconfirmed'].includes(searchState)?'Ninguna pareja se pudo confirmar':'Esta pareja no se pudo comprobar';
    message='Prueba otra pareja, elige otro escaneo o impórtalo por separado. La planta actual no ha cambiado.';
   }
   status.dataset.tone=tone;
   $('#roomPlanJoinState').textContent=heading;$('#roomPlanJoinMessage').textContent=message;
   $('#roomPlanConflictLegend').hidden=selection?.state!=='overlap';
  }
  function update(){
   const ids=pair();
   selection=ids.targetId&&ids.movingId?inspect(ids):null;
   drawRoomPlanJoin(preview,target,selection);showStatus();
  }
  async function search(){
   if(selection?.state==='compatible'){suggestion=pair();return;}
   if(!selection||selection.state==='scale')return;
   const token=generation,checked=pair();
   let unconfirmed=selection.state==='failed';
   searchState='running';showStatus();
   await new Promise(resolve=>setTimeout(resolve,0));
   let deadline=performance.now()+12;
   for(const targetId of eligible.target)for(const movingId of eligible.scan){
    if(token!==generation||!dialog.open)return;
    if(targetId===checked.targetId&&movingId===checked.movingId)continue;
    const ids={targetId,movingId};
    const state=inspect(ids,false).state;
    if(state==='failed')unconfirmed=true;
    if(state==='compatible'){
     suggestion=ids;searchState='found';showStatus();return;
    }
    if(performance.now()>deadline){
     await new Promise(resolve=>setTimeout(resolve,0));
     deadline=performance.now()+12;
    }
   }
   if(token===generation&&dialog.open){searchState=unconfirmed?'unconfirmed':'none';showStatus();}
  }
  function showSource(next){
   source=next?.project?next:null;
   review=null;
   problem=next?.error?{title:'No se pudo leer el escaneo',message:next.error}:null;
   if(source){
    try{review=A.review(target,source.project);}
    catch{problem={title:'No se pudo comprobar la planta',message:'Prueba otro escaneo o impórtalo por separado. La planta actual no ha cambiado.'};}
   }
   suggestion=null;searchState=null;
   const count=choices=>choices.filter(choice=>!choice.reason).map(choice=>choice.door.id);
   eligible={target:count(review?.targetDoors||[]),scan:count(review?.scanDoors||[])};
   const rejected=[...doorOptions(fixed,review?.targetDoors||[]).map(text=>'A · '+text),...doorOptions(moving,review?.scanDoors||[]).map(text=>'B · '+text)];
   const list=$('#roomPlanRejectedDoors');
   list.replaceChildren(...rejected.map(text=>{const li=document.createElement('li');li.textContent=text;return li;}));list.hidden=!rejected.length;
   $('#roomPlanDoorEligibility').textContent=review?'Puertas elegibles: A '+eligible.target.length+' de '+review.targetDoors.length+' · B '+eligible.scan.length+' de '+review.scanDoors.length+'.':'Selecciona un escaneo RoomPlan para comprobar sus puertas.';
   $('#roomPlanJoinFile').textContent=source?('Escaneo: '+source.file.name+'. '+source.notes.join(' ')):('Archivo: '+(next?.file?.name||'sin seleccionar'));
   update();
  }
  replaceJoinScan=async file=>{
   if(busy)return;
   const token=++generation;
   busy=true;fixed.disabled=moving.disabled=true;showStatus();
   const next=await joinSource(file);
   if(token!==generation||!dialog.open)return;
   busy=false;
   if(next.error&&source){
    fixed.disabled=!eligible.target.length;moving.disabled=!eligible.scan.length;
    problem={title:'El archivo nuevo no se pudo abrir',message:next.error+' Puedes seguir con el escaneo anterior, que sigue seleccionado.'};
    searchState=null;showStatus();search();return;
   }
   showSource(next);search();
  };
  fixed.onchange=moving.onchange=()=>{if(!problem?.blocks)problem=null;update();if(searchState===null)search();};
  replace.onclick=()=>joinInput.click();
  tryPair.onclick=()=>{
   if(!suggestion)return;
   fixed.value=suggestion.targetId;moving.value=suggestion.movingId;problem=null;update();apply.focus();
  };
  function finish(kind){
   if(busy||!source||problem?.blocks)return;
   if(!app().fileImportCurrent(session)){
    problem={title:'Cambió la planta abierta',message:'Cancela y abre de nuevo la unión en la planta correcta. La unión no ha cambiado tus datos.',blocks:true};showStatus();return;
   }
   try{
    if(kind==='join'&&selection?.state==='compatible'){
     const next=A.propose(target,source.project,pair());
     if(next.canApply&&actions.join(next.project)){dialog.close('join');return;}
    }else if(kind==='independent'&&actions.independent(source)){dialog.close('independent');return;}
   }catch{ /* Keep the scan and let the user retry through the same action. */ }
   problem={title:'No se pudo guardar',message:'Comprueba el espacio del navegador y vuelve a intentarlo, o cancela. El escaneo sigue seleccionado.'};
   showStatus();
  }
  apply.onclick=()=>finish('join');independent.onclick=()=>finish('independent');
  showSource(initial);
  return new Promise(resolve=>{
   dialog.addEventListener('close',()=>{
    ++generation;replaceJoinScan=null;fixed.onchange=moving.onchange=null;
    resolve(dialog.returnValue);
   },{once:true});
   dialog.returnValue='cancel';dialog.showModal();if(!selection)replace.focus();search();
  });
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
 function cancelDialogs(){active=null;setBusy(false);for(const id of ['uploadPdfPage','uploadPdfMode','roomPlanJoinDialog']){const dialog=$('#'+id);if(dialog.open){dialog.returnValue='cancel';dialog.close();}}}
 function cancel(){app().cancelFileImport();say('Importación cancelada. El proyecto actual se conserva.');}
 async function upload(file,{join=false}={}){
  if(active&&app().fileImportCurrent(active)){say('Ya se está procesando un plano. Puedes cancelar la importación.');return;}
  if(!file)return;
  if(!join&&file.size>Math.max(I.LIMITS.uploadBytes,T.LIMITS.packageBytes)){say('El archivo supera el límite de importación. Exporta una versión más ligera.');return;}
  const session=app().beginFileImport(),current=()=>app().fileImportCurrent(session);active=session;setBusy(true);
  const adopt=(project,name)=>traceUI().adoptProject(project,name,{transaction:session,origin:'import'});
  try{
   if(join){
    const initial=await joinSource(file);
    await script('js/scan-alignment.js');if(!current())return;
    const result=await previewRoomPlan(initial,session,{
     join:next=>app().applyRoomPlanJoin(next,session),
     independent:source=>adopt(source.project,stem(source.file.name))
    });
    if(result==='join'){
     const previous=$('#toast');previous.classList.remove('show');previous.textContent='';
     $('#roomPlanUndoJoin').focus({preventScroll:true});
    }else if(result==='independent')say('Escaneo importado como proyecto independiente. La planta original se conserva.',9000);
    else if(current()){
     say('Unión cancelada. El proyecto no ha cambiado.');
     const join = $('#roomPlanJoinQuick');
     (join.closest('details:not([open])')?.querySelector(':scope > summary') || join).focus();
    }
    return;
   }
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
    await script('vendor/dxf-parser/dxf-parser.js');if(!current())return;
    const {project,report}=await I.dxfFromText(decodeText(bytes),{name:stem(file.name),parse:text=>new window.DxfParser().parseSync(text)});
    if(!current()||!adopt(project,stem(file.name)))return;
    const o=report.openings,plural=(n,one,many)=>`${n} ${n===1?one:many}`;
    const notice=report.editedRubik?'DXF de RUBIK modificado o sin verificación. Se reconstruyó desde las capas de muros, sin usar la capa auxiliar. ':'';
    say(notice+`DXF importado en ${report.units}${report.assumedUnits?' (el archivo no declara unidades)':''}: ${plural(report.walls,'muro','muros')} (${report.paired} con grosor medido), ${plural(o.door,'puerta','puertas')}, ${plural(o.window,'ventana','ventanas')}${o.opening?`, ${plural(o.opening,'hueco','huecos')}`:''} y ${plural(report.rooms,'estancia','estancias')}${report.layerFilter?'':'; no hay capa de muros, se usaron todas las líneas'}${report.unplaced?`; ${report.unplaced} elementos sin muro cercano`:''}. Revisa el resultado.`,10000);return;
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
   if(image)say(`${out.detail?out.detail+'. ':''}${window.FloorPlanBuildingUI?.takeAdoptedLevel()?'Plano cargado como nueva planta del edificio':'Plano cargado como nuevo proyecto'}. Calibra con una cota conocida antes de trazar.`,9000);
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
 const joinInput=$('#roomPlanJoinIn');
 const pickJoin=()=>joinInput.click();
 $('#roomPlanJoinQuick').onclick=pickJoin;
 $('#joinRoomPlan').onclick=()=>{document.querySelector('details.menu').open=false;pickJoin();};
 joinInput.onchange=e=>{const file=e.target.files[0];e.target.value='';if(file&&replaceJoinScan)replaceJoinScan(file);else upload(file,{join:true});};

 const overlay=$('#dropOverlay');let depth=0;
 const hasFiles=e=>[...(e.dataTransfer?.types||[])].includes('Files');
 addEventListener('dragenter',e=>{if(!hasFiles(e))return;e.preventDefault();depth++;overlay.classList.add('show');});
 addEventListener('dragover',e=>{if(!hasFiles(e))return;e.preventDefault();e.dataTransfer.dropEffect='copy';});
 addEventListener('dragleave',e=>{if(!hasFiles(e))return;depth=Math.max(0,depth-1);if(!depth)overlay.classList.remove('show');});
 addEventListener('drop',e=>{if(!hasFiles(e))return;e.preventDefault();depth=0;overlay.classList.remove('show');const files=[...e.dataTransfer.files];if(files.length>1)say('Se sube un plano cada vez: se usará el primer archivo.');upload(files[0]);});

 addEventListener('keydown',e=>{if(e.key==='Escape'&&active&&!$('#uploadPdfMode').open&&!$('#uploadPdfPage').open&&!$('#roomPlanJoinDialog').open)cancel();});
 window.FloorPlanUpload={upload,pick,pickJoin,cancel,cancelDialogs};
})();
