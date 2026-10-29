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
 let result=null,url='',controller=null,returnFocus=null;
 const slug=s=>String(s||'').normalize('NFD').replace(/[^\w]+/g,'-').replace(/^-|-$/g,'').toLowerCase()||'proyecto';
 const projectName=()=>typeof nm==='function'?nm(app.project.name):app.project.name;
 const filename=r=>`rubik-sota-recorrido-${slug(projectName())}.${r.extension}`;
 const seconds=ms=>(Math.round(ms/100)/10).toLocaleString(typeof LANG==='string'&&LANG==='en'?'en':'es')+' s';
 const sizeText=bytes=>bytes>=1048576?(bytes/1048576).toFixed(1).replace('.',',')+' MB':Math.max(1,Math.round(bytes/1024))+' KB';
 function clear(){if(url)URL.revokeObjectURL(url);url='';result=null;}

 const tools=document.querySelector('#presentationTools'),overlay=document.querySelector('#presentationOverlay');
 const open=btn(tx('Grabar vídeo','Record video','录制视频'),tools);open.id='presentationVideo';open.hidden=!Recorder.pickType();
 open.title=tx('Graba el recorrido de esta presentación para descargarlo','Record this presentation tour to download it','录制此展示路线以便下载');
 const dialog=el('dialog',undefined,document.body,'ai-render-dialog tour-video-dialog');dialog.id='tourVideoDialog';dialog.setAttribute('aria-labelledby','tourVideoTitle');
 // While the camera moves between stops, or a batch of images is running, recording waits.
 const sync=()=>{open.disabled=Recorder.busy||overlay?.dataset.moving==='true'||document.querySelector('#presentationBatchCancel')?.hidden===false;};
 if(overlay)new MutationObserver(sync).observe(overlay,{attributes:true,attributeFilter:['data-moving']});
 open.onclick=()=>{if(open.disabled)return;returnFocus=document.activeElement;draw();dialog.showModal();dialog.querySelector('#tourVideoGo,#tourVideoDownload')?.focus();};
 dialog.addEventListener('cancel',e=>{if(controller){e.preventDefault();controller.abort();}});
 dialog.addEventListener('close',()=>{returnFocus?.focus?.({preventScroll:true});sync();});
 // A new presentation (or leaving it) forgets the previous video: it showed another selection or another project state.
 window.addEventListener('floorplan-presentation-started',clear);

 function draw(state=result?'done':'intro',message=''){
  dialog.replaceChildren();const head=el('div',undefined,dialog,'ai-render-head');const h=el('h2',tx('Vídeo del recorrido','Tour video','路线视频'),head);h.id='tourVideoTitle';
  const close=btn(tx('Cerrar','Close','关闭'),head);close.id='tourVideoClose';close.disabled=state==='recording';close.onclick=()=>dialog.close();
  const plan=window.FloorPlanPresentation.plan,stops=plan?.stops.length||0,type=Recorder.pickType()||'';
  const note=el('p',undefined,dialog,'ai-render-note');note.id='tourVideoNote';
  note.textContent=tx(`Se graba la vista 3D de las ${stops} paradas de esta presentación, unos ${Math.round(stops*HOLD_MS/1000)} s más los desplazamientos. Sin paneles, cursor ni editor. El vídeo se queda en este equipo: nada se envía.`,`The 3D view of the ${stops} stops of this presentation is recorded, about ${Math.round(stops*HOLD_MS/1000)} s plus the moves. No panels, cursor or editor. The video stays on this device: nothing is sent.`,`录制此展示 ${stops} 个停留点的三维视图，约 ${Math.round(stops*HOLD_MS/1000)} 秒加移动时间。不含面板、光标或编辑器。视频保留在本设备，不会发送。`);
  const format=el('p',undefined,dialog,'tour-video-format');format.id='tourVideoFormat';
  format.textContent=type.startsWith('video/mp4')?tx('Formato: MP4 (H.264), se abre en cualquier móvil u ordenador.','Format: MP4 (H.264), plays on any phone or computer.','格式：MP4 (H.264)，任何手机或电脑均可播放。'):tx('Formato: WebM. Este navegador no puede crear MP4. WebM se abre en Chrome, Edge, Firefox y Android; en iPhone o Safari antiguos, y en algunas apps de mensajería, puede no reproducirse: conviértelo a MP4 antes de enviarlo si es tu caso.','Format: WebM. This browser cannot create MP4. WebM plays in Chrome, Edge, Firefox and Android; on older iPhone or Safari, and in some messaging apps, it may not play: convert it to MP4 before sending if that is your case.','格式：WebM。此浏览器无法生成 MP4。WebM 可在 Chrome、Edge、Firefox 和 Android 播放；旧版 iPhone/Safari 及部分通讯应用可能无法播放。');
  if(!type.startsWith('video/mp4'))format.classList.add('is-warning');
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
  try{const r=await Recorder.record({holdMs:HOLD_MS,signal:controller.signal});
   if(!r.blob.size)throw Error(tx('El navegador no generó ningún fotograma. Vuelve a intentarlo.','The browser produced no frames. Try again.','浏览器未生成任何帧，请重试。'));
   clear();result=r;url=URL.createObjectURL(r.blob);controller=null;draw('done');dialog.querySelector('#tourVideoDownload')?.focus();}
  catch(error){const aborted=error?.name==='AbortError';controller=null;draw(result?'done':'intro',aborted?tx('Grabación cancelada. No se ha guardado nada.','Recording cancelled. Nothing was kept.','录制已取消，未保留任何内容。'):error.message);}
  finally{controller=null;sync();}
 }
 function download(){if(!result)return;const a=document.createElement('a');a.href=url;a.download=filename(result);document.body.append(a);a.click();a.remove();}
 window.FloorPlanTourVideo={open:()=>open.click(),get result(){return result;},filename:()=>result?filename(result):null};
})();
