/* Tour video, cut V1 (internal): records the stops of the active presentation into one video Blob, from a
   composition canvas fed by the 3D view only (no panels, cursor or editor), so the preview and a later download are
   the same bytes. Nothing in the interface calls it: «Grabar» is not offered until a checked preview and a
   downloadable file exist (cuts V2/V3). The container is the first type the browser really supports, H.264 MP4
   first; a WebM file is never renamed .mp4. Cancelling leaves no Blob. */
(()=>{'use strict';
 const TYPES=['video/mp4;codecs=avc1.42E01E','video/mp4;codecs=avc1','video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm'];
 const pickType=()=>TYPES.find(t=>window.MediaRecorder?.isTypeSupported?.(t))||null;
 const extension=type=>type.startsWith('video/mp4')?'mp4':'webm';
 const wait=(ms,signal)=>new Promise((resolve,reject)=>{const t=setTimeout(resolve,ms);signal?.addEventListener('abort',()=>{clearTimeout(t);reject(new DOMException('Grabación cancelada','AbortError'));},{once:true});});
 let busy=false;

 // Draws the 3D canvas over the whole frame, cropped to keep its proportions (no stretching, no bars).
 function cover(ctx,source,width,height){
  const sw=source.width,sh=source.height;if(!sw||!sh)return;const scale=Math.max(width/sw,height/sh),w=width/scale,h=height/scale;
  ctx.drawImage(source,(sw-w)/2,(sh-h)/2,w,h,0,0,width,height);
 }

 async function record({width=1280,height=720,fps=30,holdMs=1500,signal}={}){
  const presentation=window.FloorPlanPresentation;
  if(busy)throw Error('Ya hay una grabación en curso.');
  if(!presentation?.active||!presentation.plan)throw Error('Inicia una presentación antes de grabar.');
  const type=pickType();if(!type)throw Error('Este navegador no puede grabar vídeo.');
  const source=document.querySelector('#view3d canvas');if(!source)throw Error('Vista 3D no disponible.');
  if(signal?.aborted)throw new DOMException('Grabación cancelada','AbortError');
  busy=true;
  const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;const ctx=canvas.getContext('2d');
  const stream=canvas.captureStream(fps),recorder=new MediaRecorder(stream,{mimeType:type,videoBitsPerSecond:5_000_000}),chunks=[];
  let frames=0,raf=0;const paint=()=>{ctx.fillStyle='#000';ctx.fillRect(0,0,width,height);cover(ctx,source,width,height);frames++;raf=requestAnimationFrame(paint);};
  recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};
  const stopped=new Promise(r=>recorder.onstop=r);
  const plan=presentation.plan,back=presentation.current,started=performance.now();
  let cancelled=false;
  try{
   paint();recorder.start(250);
   for(const stop of plan.stops){
    if(signal?.aborted)throw new DOMException('Grabación cancelada','AbortError');
    await window.View3D.presentationGo(stop,false);await wait(holdMs,signal);
   }
  }catch(error){cancelled=true;throw error;}
  finally{
   if(recorder.state!=='inactive')recorder.stop();await stopped;cancelAnimationFrame(raf);stream.getTracks().forEach(t=>t.stop());
   if(cancelled)chunks.length=0;
   // The presentation returns to the view it showed before recording.
   if(back&&presentation.active)try{await window.View3D.presentationGo(back,true);}catch{}
   busy=false;
  }
  const blob=new Blob(chunks,{type:type.split(';')[0]});
  return {blob,type,extension:extension(type),width,height,fps,frames,stops:plan.stops.length,durationMs:Math.round(performance.now()-started)};
 }
 window.FloorPlanTourRecorder={record,pickType,get busy(){return busy;}};
})();
