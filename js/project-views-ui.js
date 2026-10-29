/* Project-First A2: automatic project views with real frames of the 3D view. The views are the presentation's own
   stops (FloorPlanPresentationCore.create: overview + rooms) framed by View3D.presentationGo and rendered by
   View3D.deliveryShot, exactly as the presentation and its images do. Frames live in memory for this session and
   are tied to the project revision: a later change marks them out of date. Nothing is persisted or invented. */
(function(){
 'use strict';
 const app=window.FloorPlanApp;if(!app)return;
 const tx=(es,en,zh)=>({es,en,zh})[typeof LANG==='string'?LANG:'es']||es;
 const nextFrame=()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
 const listeners=new Set();
 let views=null,busy=null,error=null;
 const revision=()=>FloorPlanGuide.revision(app.project);
 const key=()=>[app.entryId,app.project?.id,revision(),app.levelContext?.activeLevelId||''].join('|');
 const emit=()=>{for(const fn of listeners)try{fn();}catch{}};
 // The selection the professional saved for the presentation, when it is readable; otherwise null.
 function savedSelection(){try{const raw=localStorage.getItem(FloorPlanPresentationCore.key(app.entryId,app.project.id));const s=raw&&JSON.parse(raw);return s?.projectId===app.project.id&&Array.isArray(s.roomIds)?s.roomIds:null;}catch{return null;}}
 function roomName(id){const r=app.project.rooms.find(x=>x.id===id);return r?(typeof roomDisplay==='function'?roomDisplay(r):typeof nm==='function'?nm(r.name):r.name):id;}
 function plan(){
  const pick=FloorPlanProjectVisual.automaticRoomIds({geometry:app.geometry,project:app.project,saved:savedSelection()});
  const p=pick.roomIds.length?FloorPlanPresentationCore.create(app.project,app.geometry,app.entryId,revision(),pick.roomIds):null;
  return p&&{...p,source:pick.source};
 }
 // ready: frames of the current revision · stale: frames of an earlier revision · none · busy · error.
 function status(){if(busy)return 'busy';if(error)return 'error';if(!views)return 'none';return views.key===key()?'ready':'stale';}
 function current(){return status()==='ready'?views.items:[];}
 async function settle(){for(let i=0;i<900;i++){const m=window.View3D?.lifecycleMetrics;if(m&&!m.animating&&!m.flying&&!m.pendingAssets)return;await new Promise(r=>setTimeout(r,50));}throw Error(tx('La vista 3D no terminó de cargar. Vuelve a intentarlo.','The 3D view did not finish loading. Try again.','三维视图未完成加载，请重试。'));}
 async function prepare(onProgress){
  if(busy)return busy;
  const run=(async()=>{
   error=null;const p=plan();
   if(!p)throw Error(tx('Primero crea una estancia con muros: no hay nada que encuadrar.','Create a room with walls first: there is nothing to frame.','请先创建带墙的房间：没有可取景的内容。'));
   if(window.FloorPlanBuildingUI&&FloorPlanBuildingUI.status?.().state==='pending')throw Error(tx('Hay avisos de distribución pendientes. Corrígelos antes de preparar imágenes.','There are pending layout warnings. Fix them before preparing images.','存在待处理的布局警告，请先修正。'));
   const was=app.viewMode,at=key(),items=[];
   if(was!=='3d')await setView('3d');
   if(app.viewMode!=='3d'||!window.View3D)throw Error(tx('La vista 3D no está disponible en este dispositivo.','The 3D view is not available on this device.','此设备不支持三维视图。'));
   let state=null;
   try{
    await settle();state=View3D.presentationCapture();
    const A=FloorPlanDeliveryImage.imageArea('landscape','band');
    for(let i=0;i<p.stops.length;i++){
     const stop=p.stops[i];onProgress?.(i+1,p.stops.length);
     await View3D.presentationGo(stop,true);await nextFrame();await settle();
     const shot=View3D.deliveryShot({width:A.w,height:A.h,frame:stop.kind!=='room'});
     items.push({id:stop.id,kind:stop.kind,roomId:stop.roomId,label:stop.kind==='room'?roomName(stop.roomId):tx('Vista general','Overview','总览'),dataUrl:shot.dataUrl,width:shot.width,height:shot.height,attribution:shot.attribution||[]});
    }
   }finally{if(state)View3D.presentationRestore(state);if(was!=='3d')await setView(was);}
   if(at!==key())throw Error(tx('El proyecto cambió mientras se preparaban las vistas. Vuelve a prepararlas.','The project changed while the views were prepared. Prepare them again.','准备视图期间项目已更改，请重新准备。'));
   views={key:at,source:p.source,items,takenAt:new Date()};
  })();
  busy=run;emit();
  try{await run;}catch(e){error=e.message||String(e);}finally{busy=null;emit();}
 }
 // The delivery image of one view: the frame with the project data and the selected signature in their own band.
 async function image(id){
  const v=current().find(x=>x.id===id);if(!v)throw Error(tx('Esta vista no está preparada.','This view is not prepared.','此视图尚未准备。'));
  const snap=window.FloorPlanBrandUI?.snapshot()||null,p=snap?.profile,room=v.kind==='room'?app.geometry.rooms.find(r=>r.id===v.roomId):null;
  const data=FloorPlanDeliveryImage.content({title:snap?.title||(typeof nm==='function'?nm(app.project.name):app.project.name),view:v.label,rooms:room?[room]:app.geometry.rooms,brand:p&&p.name?{name:p.name,logo:p.logo,contact:''}:null});
  return FloorPlanDeliveryImage.compose({image:v.dataUrl,format:'landscape',layout:'band',data});
 }
 async function download(id){const out=await image(id),v=current().find(x=>x.id===id),a=document.createElement('a');a.href=out.dataUrl;a.download=`rubik-sota-${String(v.label).normalize('NFD').replace(/[^\w]+/g,'-').replace(/^-|-$/g,'').toLowerCase()||'vista'}.png`;a.click();return out;}
 window.FloorPlanProjectViews={plan,status,current,prepare,image,download,get error(){return error;},get takenAt(){return views?.takenAt||null;},get source(){return views?.source||plan()?.source||null;},onChange(fn){listeners.add(fn);}};
})();
