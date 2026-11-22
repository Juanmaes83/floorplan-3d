/* Phase B3 (tour video, cut V2): «Grabar vídeo» inside the client presentation. It records every stop of the running
   presentation with FloorPlanTourRecorder, shows the SAME Blob in a preview and downloads exactly those bytes. MP4 when
   the browser can encode it; otherwise WebM, said plainly with where it may not play. Cancelling keeps nothing. The
   video only shows the 3D view (no panels, cursor or editor) and never changes the project. */
(function(){
 'use strict';
 const app=window.FloorPlanApp,Recorder=window.FloorPlanTourRecorder;if(!app||!Recorder||!window.FloorPlanPresentation)return;
 const tx=(es,en,zh)=>({es,en,zh})[typeof LANG==='string'?LANG:'es']||es;
 const el=(tag,text,parent,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;parent?.append(n);return n;};
 const btn=(text,parent,cls='btn')=>{const b=el('button',text,parent,cls);b.type='button';return b;};
 const HOLD_MS=2000;
 // SIMULATOR B: recorrido cinematográfico (guion por tiempo, exportación determinista). «Paradas» es la grabación de siempre.
 const Film=window.FloorPlanPresentationFilm,byStopsType=Recorder.pickType();let mode=null,cineOK=false;
 let result=null,url='',controller=null,previewController=null,returnFocus=null;
 const slug=s=>String(s||'').normalize('NFD').replace(/[^\w]+/g,'-').replace(/^-|-$/g,'').toLowerCase()||'proyecto';
 const projectName=()=>typeof nm==='function'?nm(app.project.name):app.project.name;
 const filename=r=>`rubik-sota-recorrido-${slug(projectName())}.${r.extension}`;
 const seconds=ms=>(Math.round(ms/100)/10).toLocaleString(typeof LANG==='string'&&LANG==='en'?'en':'es')+' s';
 const sizeText=bytes=>bytes>=1048576?(bytes/1048576).toFixed(1).replace('.',',')+' MB':Math.max(1,Math.round(bytes/1024))+' KB';
 function clear(){if(url)URL.revokeObjectURL(url);url='';result=null;}

 const tools=document.querySelector('#presentationTools'),overlay=document.querySelector('#presentationOverlay');
 const open=btn(tx('Grabar vídeo','Record video','录制视频'),tools);open.id='presentationVideo';open.hidden=!byStopsType;
 const filmReady=Film?.disponible().then(ok=>{
  cineOK=ok;
  open.hidden=!cineOK&&!byStopsType;
 }).catch(()=>{});
 const selectedMode=()=>mode??(byStopsType?'paradas':cineOK?'cine':null);
 open.title=tx('Graba el recorrido de esta presentación para descargarlo','Record this presentation tour to download it','录制此展示路线以便下载');
 const dialog=el('dialog',undefined,document.body,'ai-render-dialog tour-video-dialog');dialog.id='tourVideoDialog';dialog.setAttribute('aria-labelledby','tourVideoTitle');
 // While the camera moves between stops, or a batch of images is running, recording waits.
 const sync=()=>{open.disabled=!!previewController||Recorder.busy||overlay?.dataset.moving==='true'||document.querySelector('#presentationBatchCancel')?.hidden===false;};
 if(overlay)new MutationObserver(sync).observe(overlay,{attributes:true,attributeFilter:['data-moving']});
 open.onclick=async()=>{await filmReady;if(open.hidden||open.disabled||dialog.open)return;returnFocus=document.activeElement;draw();dialog.showModal();dialog.querySelector('#tourVideoGo,#tourVideoDownload')?.focus();};
 dialog.addEventListener('cancel',e=>{if(controller){e.preventDefault();controller.abort();}});
 dialog.addEventListener('close',()=>{returnFocus?.focus?.({preventScroll:true});sync();});
 // A new presentation (or leaving it) forgets the previous video: it showed another selection or another project state.
 window.addEventListener('floorplan-presentation-started',clear);

 function draw(state=result?'done':'intro',message=''){
  dialog.replaceChildren();const head=el('div',undefined,dialog,'ai-render-head');const h=el('h2',tx('Vídeo del recorrido','Tour video','路线视频'),head);h.id='tourVideoTitle';
  const close=btn(tx('Cerrar','Close','关闭'),head);close.id='tourVideoClose';close.disabled=state==='recording';close.onclick=()=>dialog.close();
  const plan=window.FloorPlanPresentation.plan,stops=plan?.stops.length||0,type=byStopsType||'';
  const note=el('p',undefined,dialog,'ai-render-note');note.id='tourVideoNote';
  note.textContent=tx(`Se graba la vista 3D de las ${stops} paradas de esta presentación, unos ${Math.round(stops*HOLD_MS/1000)} s más los desplazamientos. Sin paneles, cursor ni editor. El vídeo se queda en este equipo: nada se envía.`,`The 3D view of the ${stops} stops of this presentation is recorded, about ${Math.round(stops*HOLD_MS/1000)} s plus the moves. No panels, cursor or editor. The video stays on this device: nothing is sent.`,`录制此展示 ${stops} 个停留点的三维视图，约 ${Math.round(stops*HOLD_MS/1000)} 秒加移动时间。不含面板、光标或编辑器。视频保留在本设备，不会发送。`);
  const format=el('p',undefined,dialog,'tour-video-format');format.id='tourVideoFormat';
  format.textContent=type.startsWith('video/mp4')?tx('Formato: MP4 (H.264), se abre en cualquier móvil u ordenador.','Format: MP4 (H.264), plays on any phone or computer.','格式：MP4 (H.264)，任何手机或电脑均可播放。'):tx('Formato: WebM. Este navegador no puede crear MP4. WebM se abre en Chrome, Edge, Firefox y Android; en iPhone o Safari antiguos, y en algunas apps de mensajería, puede no reproducirse: conviértelo a MP4 antes de enviarlo si es tu caso.','Format: WebM. This browser cannot create MP4. WebM plays in Chrome, Edge, Firefox and Android; on older iPhone or Safari, and in some messaging apps, it may not play: convert it to MP4 before sending if that is your case.','格式：WebM。此浏览器无法生成 MP4。WebM 可在 Chrome、Edge、Firefox 和 Android 播放；旧版 iPhone/Safari 及部分通讯应用可能无法播放。');
  if(!type.startsWith('video/mp4'))format.classList.add('is-warning');
  // Cinematográfico: la nota y el formato describen ESE vídeo (no la estimación ni el formato de «Por paradas»).
  if(Film&&cineOK&&selectedMode()==='cine'){note.textContent=tx(`Se exporta la vista 3D de las ${stops} paradas con el guion cinematográfico: escena de entrada, pausa en cada estancia y traslados. La duración depende de las estancias elegidas y se indica al terminar. Sin paneles, cursor ni editor. El vídeo se queda en este equipo: nada se envía.`,`The 3D view of the ${stops} stops is exported with the cinematic script: opening scene, a pause in each room and moves. The length depends on the rooms chosen and is shown when it finishes. No panels, cursor or editor. The video stays on this device: nothing is sent.`,`按电影式脚本导出 ${stops} 个停留点的三维视图：开场、每个房间停留与过渡。时长取决于所选房间，完成后显示。不含面板、光标或编辑器。视频保留在本设备，不会发送。`);
   format.textContent=tx('Formato: MP4 (H.264) · 1280×720 · 30 fps.','Format: MP4 (H.264) · 1280×720 · 30 fps.','格式：MP4 (H.264) · 1280×720 · 30 fps。');format.classList.remove('is-warning');}
  if(Film&&state!=='recording'){const modo=el('fieldset',undefined,dialog,'tour-video-mode');modo.id='tourVideoMode';el('legend',tx('Tipo de recorrido','Tour type','路线类型'),modo);
   const opc=(v,t,d,ok,reason)=>{const l=el('label',undefined,modo,'tour-video-mode-opt');const r=el('input',undefined,l);r.type='radio';r.name='tourVideoMode';r.value=v;r.disabled=!ok;r.checked=selectedMode()===v&&ok;r.onchange=()=>{mode=v;draw(state==='done'?'done':'intro');dialog.querySelector('input[name=tourVideoMode][value='+v+']')?.focus();};
    const s=el('span',undefined,l);el('b',t,s);el('small',ok?d:reason,s);};
   opc('cine',tx('Cinematográfico','Cinematic','电影式'),tx('Recorrido continuo: del plano a la vivienda, entrada en las estancias con traslados suaves y cortes declarados. Se exporta fotograma a fotograma a 30 fps según el guion: la duración no depende de la velocidad del equipo.','Continuous tour: from plan to home, into the rooms with smooth moves and declared cuts. Exported frame by frame at 30 fps from the script: the length does not depend on the device speed.','连续路线：从平面到住宅，平滑过渡与明确剪切。按脚本以 30 fps 逐帧导出：时长不取决于设备速度。'),cineOK,
    tx('Este navegador necesita WebCodecs H.264 para exportar en modo cinematográfico.','This browser needs H.264 WebCodecs to export in cinematic mode.','此浏览器需要 H.264 WebCodecs 才能导出电影式路线。'));
   opc('paradas',tx('Por paradas','By stops','按停留点'),tx('Graba en tiempo real cada parada con una pausa (la grabación de siempre).','Records each stop in real time with a pause (the usual recording).','实时录制每个停留点（原有录制）。'),!!type,
    tx('Este navegador no ofrece grabación en tiempo real. Usa Cinematográfico.','This browser cannot record in real time. Use Cinematic.','此浏览器不支持实时录制。请选择电影式。'));
   if(selectedMode()==='cine'&&state!=='done'){const ver=btn(tx('Ver el recorrido en la presentación','Watch the tour in the presentation','在展示中观看路线'),modo,'btn');ver.id='tourVideoWatch';
    ver.onclick=async()=>{dialog.close();previewController=new AbortController();sync();
     try{await Film.previsualizar({signal:previewController.signal});}catch(e){if(e?.name!=='AbortError')window.toast?.(e.message,5000);}finally{previewController=null;sync();}
     if(!window.FloorPlanPresentation.active)return;
     returnFocus=open;draw('intro');dialog.showModal();dialog.querySelector('#tourVideoGo')?.focus();};}}
  const status=el('p',message,dialog,'ai-render-status');status.id='tourVideoStatus';status.setAttribute('role','status');status.setAttribute('aria-live','polite');
  // Actions go after the preview: first the video and what it is, then what to do with it.
  const actions=el('div',undefined,undefined,'tour-video-actions');
  if(state==='recording'){
   status.textContent=message||tx('Grabando… no cambies de pestaña hasta que termine.','Recording… do not switch tabs until it finishes.','正在录制…完成前请勿切换标签页。');
   dialog.append(actions);const cancel=btn(tx('Cancelar grabación','Cancel recording','取消录制'),actions);cancel.id='tourVideoCancel';cancel.onclick=()=>controller?.abort();return;
  }
  if(state==='done'&&result){
   const video=el('video',undefined,dialog,'tour-video-preview');video.id='tourVideoPreview';video.controls=true;video.playsInline=true;video.muted=true;video.src=url;
   video.setAttribute('aria-label',tx('Vista previa del vídeo del recorrido','Tour video preview','路线视频预览'));
   const meta=el('p',`${result.extension.toUpperCase()} · ${result.width}×${result.height} · ${seconds(result.durationMs)} · ${result.stops} ${tx('paradas','stops','个停留点')} · ${sizeText(result.blob.size)}`,dialog,'tour-video-meta');meta.id='tourVideoMeta';
   if(!status.textContent)status.textContent=tx('Revisa el vídeo antes de descargarlo: es exactamente el archivo que se descarga.','Check the video before downloading it: it is exactly the file that is downloaded.','下载前请检查视频：它就是将要下载的文件。');
   const dl=btn(tx('Descargar vídeo','Download video','下载视频'),actions,'btn primary');dl.id='tourVideoDownload';dl.onclick=download;
  }
  dialog.append(actions);
  const go=btn(state==='done'?tx('Grabar de nuevo','Record again','重新录制'):tx('Grabar recorrido','Record tour','录制路线'),actions,state==='done'?'btn':'btn primary');go.id='tourVideoGo';go.onclick=record;
 }
 async function record(){
  if(!window.FloorPlanPresentation.active){draw('intro',tx('La presentación ya no está activa.','The presentation is no longer active.','展示已不再进行。'));return;}
  controller=new AbortController();draw('recording');sync();
  const cine=selectedMode()==='cine'&&cineOK;
  const avance=(k,l)=>{const s=dialog.querySelector('#tourVideoStatus');if(s)s.textContent=(p=>tx(`Exportando ${p} %`,`Exporting ${p} %`,`正在导出 ${p} %`))(k<.01?(k*100).toFixed(1):Math.round(k*100))+(l?' · '+l:'');};
  try{const r=cine?await Film.exportar({signal:controller.signal,onProgress:avance}):await Recorder.record({holdMs:HOLD_MS,signal:controller.signal});
   if(!r.blob.size)throw Error(tx('El navegador no generó ningún fotograma. Vuelve a intentarlo.','The browser produced no frames. Try again.','浏览器未生成任何帧，请重试。'));
   clear();result=r;url=URL.createObjectURL(r.blob);controller=null;draw('done');dialog.querySelector('#tourVideoDownload')?.focus();}
  catch(error){const aborted=error?.name==='AbortError';controller=null;draw(result?'done':'intro',aborted?tx('Grabación cancelada. No se ha guardado nada.','Recording cancelled. Nothing was kept.','录制已取消，未保留任何内容。'):error.message);}
  finally{controller=null;sync();}
 }
 (()=>{const st=document.createElement('style');st.textContent='.tour-video-mode{border:0;padding:0;margin:8px 0;display:grid;gap:6px}.tour-video-mode legend{font-weight:700;margin-bottom:4px}.tour-video-mode-opt{display:flex;gap:8px;align-items:flex-start;padding:8px;border:1px solid rgba(0,0,0,.12);border-radius:10px;cursor:pointer;min-height:44px}.tour-video-mode-opt input{width:20px;height:20px;margin-top:2px}.tour-video-mode-opt span{display:flex;flex-direction:column}.tour-video-mode-opt small{opacity:.8}.tour-video-mode .btn{justify-self:start;min-height:44px}';document.head.append(st);})();
 function download(){if(!result)return;const a=document.createElement('a');a.href=url;a.download=filename(result);document.body.append(a);a.click();a.remove();}
 window.FloorPlanTourVideo={open:()=>open.click(),get result(){return result;},filename:()=>result?filename(result):null,
  cancelPreview(){if(!previewController)return false;previewController.abort();return true;}};
})();
