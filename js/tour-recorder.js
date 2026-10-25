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
  const plan=presentation.plan,back=presentation.current,chunks=[],marks=[];
  let recorder=null,stream=null,raf=0,frames=0,failed=false,started=0,ended=0;
  busy=true;
  try{
   // Everything that can throw (canvas stream, recorder, start) happens inside try: «busy» is always released.
   const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;const ctx=canvas.getContext('2d');
   stream=canvas.captureStream(fps);recorder=new MediaRecorder(stream,{mimeType:type,videoBitsPerSecond:5_000_000});
   recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};
   let painted=null;const nextPaint=()=>new Promise(r=>painted=r);
   const paintOnce=()=>{ctx.fillStyle='#000';ctx.fillRect(0,0,width,height);cover(ctx,source,width,height);frames++;const done=painted;painted=null;done?.();},paint=()=>{paintOnce();raf=requestAnimationFrame(paint);};
   // The video's clock starts with its first encoded frame, the first one painted after start(): marks are measured
   // from it, so the moment of each stop in the file matches what it shows even when frames come slowly.
   // The video opens on its first stop, not on whatever the presentation showed before recording.
   paint();await window.View3D.presentationGo(plan.stops[0],true);await nextPaint();await nextPaint();
   recorder.start(250);await nextPaint();started=performance.now();
   for(const stop of plan.stops){
    if(signal?.aborted)throw new DOMException('Grabación cancelada','AbortError');
    await window.View3D.presentationGo(stop,false);
    // The stop is in the video only once frames showing it are painted: two of them before its hold starts, so a
    // slow renderer (a frame every second or more) never skips a stop. Marks are in ms from the first frame.
    await nextPaint();await nextPaint();
    marks.push({kind:stop.kind,roomId:stop.roomId||null,atMs:Math.round(performance.now()-started),holdMs});
    await wait(holdMs,signal);
   }
   // The last view is painted once more and given time to be encoded, so the video lasts until the end of the
   // last hold even where the scene paints few frames (software rendering).
   paintOnce();await nextPaint();await wait(400,signal);
  }catch(error){failed=true;throw error;}
  finally{
   cancelAnimationFrame(raf);
   // Only a recorder that really started sends «stop»; it is awaited with a limit so a lost event cannot hang.
   ended=performance.now();
   if(recorder&&recorder.state!=='inactive'){const done=new Promise(r=>recorder.addEventListener('stop',r,{once:true}));try{recorder.stop();}catch{}await Promise.race([done,new Promise(r=>setTimeout(r,3000))]);}
   stream?.getTracks().forEach(t=>t.stop());
   if(failed)chunks.length=0;
   // The presentation returns to the view it showed before recording.
   if(back&&presentation.active)try{await window.View3D.presentationGo(back,true);}catch{}
   busy=false;
  }
  const blob=new Blob(chunks,{type:type.split(';')[0]});
  return {blob,type,extension:extension(type),width,height,fps,frames,stops:plan.stops.length,marks,durationMs:Math.round(ended-started),framesPerSecond:+(frames/((ended-started)/1000)).toFixed(2)};
 }
 window.FloorPlanTourRecorder={record,pickType,get busy(){return busy;}};
})();
