/* SIMULATOR B · Recorrido cinematográfico de la presentación (navegador).
 *
 * Convierte la presentación activa («Presentar mi vivienda») en un GUION POR TIEMPO (RubikFilmPlan) y lo reproduce o
 * lo exporta fotograma a fotograma. No crea motor, escena ni grabador:
 *  - poses, cortes de muros y encuadres de cada parada: View3D.presentationGo/presentationViewState (los de RUBIK);
 *  - escenas: las narrativas de RUBIK (presentationStoryBegin/Apply/End), con su propia duración (info.playMs);
 *  - traslados entre paradas: RubikFilmPlan (contrato de suavidad medido en RUBIK); si un traslado suave no cabe en el
 *    contrato, se convierte en un CORTE declarado (nunca un barrido brusco);
 *  - vídeo: WebCodecs H.264 fotograma a fotograma + FloorPlanConstructionMp4 (el muxer de RUBIK, el mismo del vídeo de
 *    la Evolución): el número de fotogramas y la duración del archivo salen del guion (no de la velocidad del equipo).
 * La vista previa y la exportación usan el MISMO aplicador de fotogramas: lo que se ve es lo que se exporta.
 * Al terminar o cancelar: fin de la narrativa y restauración EXACTA de la vista anterior; el proyecto no se toca.
 * prefers-reduced-motion: escenas en su estado final y traslados como cortes (la regla de RUBIK).
 * Resiliencia: cada operación corre en UNA sesión exclusiva (sesion()) que registra la limpieza de cada recurso en
 * cuanto lo toma (narrativa, vista, capas, codificador) y la deshace SIEMPRE, en orden inverso, también si falla la
 * planificación o la inicialización. Un fallo nunca deja el módulo ocupado: se puede volver a intentar sin recargar.
 */
(function(){
 'use strict';
 const FP=window.RubikFilmPlan,MQ=window.RubikMotionQuality;if(!FP||!MQ)return;
 const tx=(es,en,zh)=>({es,en,zh})[typeof LANG==='string'?LANG:'es']||es;
 const reduce=()=>!!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
 const abortError=()=>new DOMException(tx('Grabación cancelada','Recording cancelled','录制已取消'),'AbortError');
 const H264=['avc1.42001f','avc1.4d001f','avc1.640028'];
 let busy=false;
 // Duraciones por plano (s). Pausas suficientes para leer cada estancia sin alargar el vídeo.
 const HOLD={overview:1.6,room:2.2,final:2.4};

 const nombre=(stop)=>{const app=window.FloorPlanApp,room=stop.roomId&&app?.project?.rooms?.find(r=>r.id===stop.roomId);
  try{if(room&&typeof roomDisplay==='function')return roomDisplay(room);}catch{}return stop.label||'';};
 /** Paradas, vistas exactas y poses con la autoridad de RUBIK. Restaura la vista que había. */
 function leerParadas(){
  const P=window.FloorPlanPresentation,Vw=window.View3D;if(!P?.active||!P.plan)throw Error(tx('Inicia una presentación antes.','Start a presentation first.','请先开始展示。'));
  const initial=Vw.presentationViewState(),stops=[],views={};
  try{for(const s of P.plan.stops){if(!s.bounds)continue;Vw.presentationGo(s,true);views[s.id]=Vw.presentationViewState();stops.push({id:s.id,kind:s.kind,roomId:s.roomId||null,levelId:s.levelId??null,label:nombre(s)});}}
  finally{Vw.presentationRestoreView(initial);}
  const poses=Object.fromEntries(Object.entries(views).map(([id,v])=>[id,{position:v.pose.position,target:v.pose.target,fov:v.pose.fov}]));
  return {stops,views,poses,initial};}
 /** Duración real de cada narrativa (la que usa el reproductor de la presentación). */
 function duracionEscena(stop,from,narrative){const P=window.FloorPlanPresentation,Vw=window.View3D,st=id=>P.plan.stops.find(x=>x.id===id),saved=Vw.presentationViewState();
  try{const info=Vw.presentationStoryBegin(st(stop),from?{fromStop:st(from)}:{},narrative);return (info?.playMs||window.FloorPlanPresentationStory.SCENE_MS[narrative])/1000;}
  finally{try{Vw.presentationStoryEnd({keepPose:true});}catch{}Vw.presentationRestoreView(saved);}}
 /** Guion: vista general (del plano a la vivienda) → bajada a la primera estancia → traslados suaves por las demás →
  *  vuelta a la vista general. Un cambio de planta, o un traslado que no cabe en el contrato, es un corte declarado. */
 function guion(stops,{reducedMotion=reduce()}={}){
  const ov=stops.find(s=>s.kind==='overview')||stops[0],rooms=stops.filter(s=>s.kind==='room');
  const t=(es,en,zh)=>tx(es,en,zh),shots=[];
  if(ov.kind==='overview'){shots.push({kind:'scene',narrative:'plan-reveal',stop:ov.id,label:t('Del plano a la vivienda','From plan to home','从平面到住宅')});}
  else shots.push({kind:'cut',to:ov.id,label:ov.label});
  shots.push({kind:'hold',seconds:HOLD.overview,stop:ov.id,label:t('Vista general','Overview','总览')});
  rooms.forEach((r,i)=>{
   if(i===0&&ov.kind==='overview'&&(r.levelId??null)===(ov.levelId??null))shots.push({kind:'scene',narrative:'room-descent',stop:r.id,from:ov.id,label:t('Entrar en ','Into ','进入 ')+r.label});
   else{const prev=i===0?ov:rooms[i-1];shots.push({kind:(prev.levelId??null)===(r.levelId??null)?'move':'cut',to:r.id,label:r.label});}
   shots.push({kind:'hold',seconds:HOLD.room,stop:r.id,label:r.label});});
  if(rooms.length)shots.push({kind:'move',to:ov.id,label:t('Vista general','Overview','总览')},{kind:'hold',seconds:HOLD.final,stop:ov.id,label:t('Vista general','Overview','总览')});
  return shots;}
 /** Plan por tiempo con las duraciones reales y la regla de contrato (traslado imposible de suavizar → corte). */
 function planificar({reducedMotion=reduce()}={}){
  const P=leerParadas();let shots=guion(P.stops,{reducedMotion});let anchor=null;
  shots=shots.map(s=>{if(s.kind==='scene'){const r={...s,seconds:duracionEscena(s.stop,s.narrative==='plan-reveal'?null:(s.from||anchor),s.narrative)};anchor=s.stop;return r;}if(s.to)anchor=s.to;return s;});
  for(let intento=0;intento<shots.length;intento++){
   try{return {plan:FP.create(shots,{poses:P.poses,reducedMotion,move:{limits:MQ.RUBIK_LIMITS}}),shots,...P};}
   catch(e){const m=/shots\[(\d+)\]/.exec(e.message||'');if(e.code!=='CONTRACT'||!m)throw e;shots=shots.map((s,i)=>i===+m[1]?{...s,kind:'cut'}:s);}}
  throw Error('RubikFilmPlan: guion no resoluble');}
 // ---------------------------------------------------------------- aplicador ÚNICO (vista previa y exportación)
 function aplicador(views){const F={scene:null,move:null,hold:null};const Vw=window.View3D,P=window.FloorPlanPresentation,stop=id=>P.plan.stops.find(x=>x.id===id);
  const aplicar=(plan,t)=>{const a=plan.at(t),s=a.shot;
   if(a.kind==='scene'){if(F.scene!==a.index){Vw.presentationStoryBegin(stop(s.stop),s.from?{fromStop:stop(s.from)}:{},s.narrative);F.scene=a.index;F.move=F.hold=null;}Vw.presentationStoryApply(a.p);}
   else{if(F.scene!==null){Vw.presentationStoryEnd({keepPose:true});F.scene=null;}
    if(a.kind==='move'){if(F.move!==a.index){Vw.presentationRestoreView(views[s.to]);F.move=a.index;F.hold=null;}Vw.presentationRestorePose(plan.poseAt(t));}
    else{const id=s.stop||s.to;if(F.hold!==a.index&&id){Vw.presentationRestoreView(views[id]);}F.hold=a.index;F.move=null;}}
   Vw.requestFrame?.();return a;};
  const cerrar=initial=>{if(F.scene!==null){try{Vw.presentationStoryEnd({keepPose:true});}catch{}F.scene=null;}try{Vw.presentationRestoreView(initial);}catch{}Vw.requestFrame?.();};
  return {aplicar,cerrar};}
 const dosFotogramas=()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
 const unFotograma=()=>new Promise(r=>requestAnimationFrame(r));
 /** Espera a que la cámara de la presentación esté quieta (sin vuelo ni animación en curso): RUBIK no da su pose
  *  mientras vuela entre paradas. Límite de 15 s con mensaje claro. */
 async function quieta(signal){for(let i=0;i<300;i++){if(signal?.aborted)throw abortError();const m=window.View3D?.lifecycleMetrics;if(m&&!m.animating&&!m.flying)return;await new Promise(r=>setTimeout(r,50));}
  throw Error(tx('La vista 3D sigue en movimiento. Espera a que se detenga y vuelve a intentarlo.','The 3D view is still moving. Wait until it stops and try again.','三维视图仍在移动，请稍候再试。'));}
 /** Sesión exclusiva: toma el módulo, ejecuta fn(alLimpiar) y deshace SIEMPRE lo registrado (orden inverso), con
  *  cada paso aislado para que un fallo de limpieza no impida los demás ni deje el módulo ocupado. */
 async function sesion(ocupado,fn){
  if(busy)throw Object.assign(Error(ocupado),{code:'BUSY'});busy=true;const pasos=[];
  try{return await fn(paso=>{pasos.push(paso);});}
  finally{for(const paso of pasos.reverse()){try{paso();}catch(e){console.warn('[presentation-film] limpieza',e);}}busy=false;}}
 /** Prepara una operación: cámara quieta → plan → aplicador → (capas). Registra cada limpieza al tomar el recurso. */
 async function preparar(alLimpiar,{signal,reducedMotion=reduce(),ocultarCapas=true}={}){
  await quieta(signal);const P=planificar({reducedMotion}),A=aplicador(P.views);alLimpiar(()=>A.cerrar(P.initial));
  if(ocultarCapas)alLimpiar(capas());return {...P,A};}
 function marcas(plan){return plan.shots.filter(s=>s.kind==='hold'&&s.stop).map(s=>({stop:s.stop,label:s.label,atMs:Math.round(s.t0*1000)}));}
 function capas(){const Vw=window.View3D,l=Vw.territoryLayers;const volver=()=>{if(l)Vw.setTerritoryLayers(l);};if(l){try{Vw.setTerritoryLayers({parcel:false,orthophoto:false,terrain:false,north:false});}catch(e){try{volver();}catch{}throw e;}}return volver;}
 /** Vista previa en la propia presentación, en tiempo real, con el mismo guion. */
 function previsualizar({signal,onProgress}={}){
  return sesion(tx('Ya hay un recorrido en curso.','A tour is already running.','已有路线在进行。'),async alLimpiar=>{
   const {plan,A}=await preparar(alLimpiar,{signal});const t0=performance.now();
   for(;;){if(signal?.aborted)throw abortError();const t=Math.min(plan.duration,(performance.now()-t0)/1000);A.aplicar(plan,t);onProgress?.(t/plan.duration,plan.at(t).shot.label);if(t>=plan.duration)break;await new Promise(r=>requestAnimationFrame(r));}
   return {duration:plan.duration,shots:plan.shots.length,cuts:plan.cuts.length};});}
 async function configuracion(width,height,fps){if(typeof VideoEncoder==='undefined'||typeof VideoFrame==='undefined'||!window.FloorPlanConstructionMp4)return null;
  for(const codec of H264){const cfg={codec,width,height,bitrate:6_000_000,framerate:fps,avc:{format:'avc'}};try{if((await VideoEncoder.isConfigSupported(cfg)).supported)return cfg;}catch{}}return null;}
 const disponible=async()=>!!(await configuracion(1280,720,30));
 function cubrir(ctx,source,w,h){const sw=source.width,sh=source.height;if(!sw||!sh)return;const k=Math.max(w/sw,h/sh),cw=w/k,ch=h/k;ctx.fillStyle='#000';ctx.fillRect(0,0,w,h);ctx.drawImage(source,(sw-cw)/2,(sh-ch)/2,cw,ch,0,0,w,h);}
 /** Exportación determinista: cada fotograma se renderiza en su instante exacto del guion. */
 function exportar({width=1280,height=720,fps=30,signal,onProgress}={}){
  return sesion(tx('Ya hay una grabación en curso.','A recording is already running.','已有录制在进行。'),async alLimpiar=>{
   const cfg=await configuracion(width,height,fps);if(!cfg)throw Object.assign(Error(tx('Este navegador no puede exportar el recorrido cinematográfico (sin WebCodecs H.264).','This browser cannot export the cinematic tour (no WebCodecs H.264).','此浏览器无法导出电影式路线（无 WebCodecs H.264）。')),{code:'NO_WEBCODECS'});
   const source=document.querySelector('#view3d canvas');if(!source)throw Error(tx('Vista 3D no disponible.','3D view not available.','三维视图不可用。'));
   const {plan,views,shots,A}=await preparar(alLimpiar,{signal});
   const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;const ctx=canvas.getContext('2d');
   const times=plan.frameTimes(fps),samples=[];let avcC=null,failure=null;const t0=performance.now();
   const enc=new VideoEncoder({output:(chunk,meta)=>{if(meta?.decoderConfig?.description&&!avcC)avcC=new Uint8Array(meta.decoderConfig.description);const d=new Uint8Array(chunk.byteLength);chunk.copyTo(d);samples.push({data:d,key:chunk.type==='key',ts:chunk.timestamp});},error:e=>{failure=e;}});
   alLimpiar(()=>{if(enc.state!=='closed')enc.close();});
   enc.configure(cfg);
   for(let i=0;i<times.length;i++){
    if(signal?.aborted)throw abortError();if(failure)throw failure;
    // Un fotograma basta: aplicar() pide el render (requestFrame) antes de nuestro rAF, así que en ese mismo fotograma
    // la escena ya está dibujada (preserveDrawingBuffer). SB-03 comprueba que lo exportado es lo que muestra la vista.
    A.aplicar(plan,times[i]);await unFotograma();cubrir(ctx,source,width,height);
    const vf=new VideoFrame(canvas,{timestamp:Math.round(i*1e6/fps),duration:Math.round(1e6/fps)});try{enc.encode(vf,{keyFrame:i%fps===0});}finally{vf.close();}
    while(enc.encodeQueueSize>6){if(failure)throw failure;await new Promise(r=>setTimeout(r,5));}
    if(i%3===0)onProgress?.(i/times.length,plan.at(times[i]).shot.label);}
   await enc.flush();if(failure)throw failure;
   if(!avcC||samples.length!==times.length)throw Error(tx('El codificador no devolvió todos los fotogramas: no se ha guardado nada.','The encoder did not return every frame: nothing was kept.','编码器未返回全部帧：未保存任何内容。'));
   samples.sort((a,b)=>a.ts-b.ts);
   const blob=new Blob([window.FloorPlanConstructionMp4.mux({width,height,fps,samples,avcC})],{type:'video/mp4'});
   // Duración del ARCHIVO: fotogramas × 1/fps. Los fotogramas son los instantes 0, 1/fps, … del guion más el instante
   // final exacto, así que el archivo dura entre el guion y el guion + 2/fps (p. ej. 29,13 s → 875 fotogramas = 29,167 s).
   return {blob,type:'video/mp4',extension:'mp4',container:'mp4-indexed',width,height,fps,frames:times.length,durationMs:Math.round(times.length*1000/fps),scriptMs:Math.round(plan.duration*1000),stops:Object.keys(views).length,
    marks:marcas(plan),plan:{duration:plan.duration,shots:plan.shots.map(s=>({kind:s.kind,label:s.label,t0:s.t0,t1:s.t1})),cuts:plan.cuts,reducedMotion:plan.reducedMotion},elapsedMs:Math.round(performance.now()-t0),guion:shots.map(s=>s.kind)};});}
 /** Diagnóstico de solo lectura (QA y revisión): la imagen del lienzo 3D en el instante t del guion, con el MISMO
  *  aplicador que la exportación. Restaura la vista. */
 function fotograma(t,{reducedMotion=reduce()}={}){
  return sesion('busy',async alLimpiar=>{const {plan,A}=await preparar(alLimpiar,{reducedMotion});
   A.aplicar(plan,Math.min(plan.duration,Math.max(0,t)));await dosFotogramas();const c=document.querySelector('#view3d canvas');
   return {dataUrl:c.toDataURL('image/png'),width:c.width,height:c.height,shot:plan.at(Math.min(plan.duration,Math.max(0,t))).shot.label};});}
 /** Diagnóstico de solo lectura: la pose REAL de la cámara en cada fotograma del guion (sin codificar). */
 function trayectoria({fps=10,reducedMotion=reduce()}={}){
  return sesion('busy',async alLimpiar=>{const {plan,A}=await preparar(alLimpiar,{reducedMotion,ocultarCapas:false});const out=[];
   for(const t of plan.frameTimes(fps)){const a=A.aplicar(plan,t),c=window.View3D.cameraState,pose=window.View3D.presentationPose();out.push({t,kind:a.kind,index:a.index,position:c.position,quaternion:c.quaternion,fov:c.fov,target:pose.target});}
   return {frames:out,cuts:plan.cuts,shots:plan.shots.map(s=>({kind:s.kind,t0:s.t0,t1:s.t1,label:s.label})),duration:plan.duration};});}
 window.FloorPlanPresentationFilm=Object.freeze({planificar,guion,previsualizar,exportar,disponible,fotograma,trayectoria,get busy(){return busy;}});
})();
