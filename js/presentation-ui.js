/* Reversible presentation UI. Plan and progress are local derived state. */
(function(){
 'use strict';
 const Core=FloorPlanPresentationCore,app=FloorPlanApp,tx=(es,en,zh)=>FloorPlanGuide.text([es,en,zh||es],LANG);
 const roomName=name=>typeof nm==='function'?nm(name):name;
 const el=(tag,text,parent,cls)=>{const node=document.createElement(tag);if(text!==undefined)node.textContent=text;if(cls)node.className=cls;parent?.append(node);return node;};
 const button=(text,parent,fn)=>{const node=el('button',text,parent,'btn');node.type='button';node.onclick=fn;return node;};
 const headerButton=button('',document.querySelector('header'),()=>open());headerButton.id='presentationBtn';headerButton.classList.add('presentation-entry');
 const config=el('dialog',undefined,document.body,'presentation-config');config.id='presentationConfig';config.setAttribute('aria-labelledby','presentationConfigTitle');
 const overlay=el('section',undefined,document.querySelector('#stage'),'presentation-overlay');overlay.id='presentationOverlay';overlay.hidden=true;overlay.setAttribute('aria-label','Presentación de la vivienda');
 const card=el('div',undefined,overlay,'presentation-card');
 const top=el('div',undefined,card,'presentation-card-top');
 const title=el('h2',undefined,top),closeButton=button('',top,()=>stop());closeButton.id='presentationClose';
 const status=el('p',undefined,card,'presentation-status');status.setAttribute('role','status');
 const progress=el('p',undefined,card,'presentation-progress');progress.setAttribute('aria-live','polite');
 const info=el('p',undefined,card,'presentation-info');
 const warning=el('p',undefined,card,'presentation-warning');warning.setAttribute('role','alert');warning.hidden=true;
 const controls=el('div',undefined,card,'presentation-controls');
 const previous=button('',controls,()=>go(index-1)),next=button('',controls,()=>go(index+1));
 const captureButton=button('',controls,()=>capture());captureButton.id='presentationCapture';
 const batchButton=button('',controls,()=>{batchPromise=captureBatch().catch(error=>toast(error.message||String(error),6000)).finally(()=>{batchPromise=null;});});batchButton.id='presentationBatch';
 const cancelBatchButton=button('',controls,()=>cancelBatch());cancelBatchButton.id='presentationBatchCancel';cancelBatchButton.hidden=true;
 const batchStatus=el('p',undefined,card,'presentation-status');batchStatus.id='presentationBatchStatus';batchStatus.setAttribute('role','status');batchStatus.setAttribute('aria-live','polite');batchStatus.hidden=true;
 const captureOptions={size:'1280',aspect:'view'};
 const stops=el('div',undefined,card,'presentation-stops');
 let plan=null,entry=null,sceneState=null,index=0,epoch=0,movement=0,active=false,pendingStart=null,returnFocus=null,stopping=false,visited=new Set();
 let roomOrder=[],selectedRooms=[],configMessage=null,roomList=null,startButton=null;
 let batchActive=false,batchSerial=0,batchPromise=null,batchCancelled=false,batchResized=false;
 function sourceCurrent(){return !!plan&&Core.current(plan,app.project.id,app.entryId,FloorPlanGuide.revision(app.project));}
 function captureReady(){
  if(!active||stopping||batchActive||!sourceCurrent()||overlay.dataset.moving==='true'||!window.View3D?.contextAvailable)return false;
  const stage=document.querySelector('#stage'),canvas=View3D.canvasState,camera=View3D.cameraState;
  if(!stage||!canvas||!camera||!stage.clientWidth||!stage.clientHeight)return false;
  const ratio=canvas.pixelRatio||1;
  return Math.abs(canvas.width-stage.clientWidth*ratio)<=2&&Math.abs(canvas.height-stage.clientHeight*ratio)<=2&&
    Math.abs(camera.aspect-stage.clientWidth/stage.clientHeight)<.001;
 }
 function updateCapture(){
  captureButton.disabled=!captureReady();
  const busy=window.View3D?.lifecycleMetrics;
  batchButton.disabled=!captureReady()||!!busy?.pendingAssets||!!busy?.animating||!!busy?.flying;
  batchButton.textContent=tx('Descargar vistas ZIP','Download views ZIP','下载视图 ZIP');
  cancelBatchButton.textContent=tx('Cancelar lote','Cancel batch','取消批量');
  if(!active)return;
  try{const size=View3D.shotSize(captureOptions);captureButton.textContent=tx(`Guardar PNG ${size.width}×${size.height}` ,`Save PNG ${size.width}×${size.height}`,`保存 PNG ${size.width}×${size.height}`);}
  catch{captureButton.disabled=true;captureButton.textContent=tx('PNG no disponible','PNG unavailable','PNG 不可用');}
 }
 function capture(){
  if(!captureReady())return;
  captureButton.disabled=true;
  try{View3D.shot(captureOptions);}
  catch(error){toast(error.message||String(error),6000);}
  finally{updateCapture();}
 }
 function cancelBatch(){if(batchActive){batchCancelled=true;batchStatus.textContent=tx('Cancelando capturas…','Cancelling captures…','正在取消截图…');}}
 const batchCurrent=(serial,sourceEpoch)=>batchActive&&!batchCancelled&&serial===batchSerial&&active&&!stopping&&sourceEpoch===epoch&&sourceCurrent()&&View3D?.contextAvailable;
 const nextFrame=()=>new Promise(resolve=>requestAnimationFrame(resolve));
 function assetManifest(){
  const entries=window.FloorPlanAssetUI?.entries||[];
  return {
   sourceImages:(app.project.sourceImages||[]).map(image=>({id:image.id,sha256:image.sha256||null})),
   models:(app.project.objects||[]).map(object=>{const asset=object.assetRef?FloorPlanAssets.resolve(entries,object.assetRef):null;return {objectId:object.id,assetId:asset?.id||null,catalog:asset?.catalog||null,revision:asset?.revision||null,sha256:asset?.sha256||null,state:View3D.assetStatus(object.id)?.state||'generic'};}),
   surfaces:(app.project.materials||[]).map(material=>{const surface=material.appearance?.preset?window.FloorPlanSurfaces?.get(material.appearance.preset):null;return {materialId:material.id,preset:surface?.id||null,baseColorSha256:surface?.maps?.baseColor?.sha256||null,sampleSha256:surface?.sample?.sha256||null,color:material.appearance?.color||null};})
  };
 }
 async function captureBatch(){
  const busy=View3D.lifecycleMetrics;
  if(!captureReady()||busy.pendingAssets||busy.animating||busy.flying)return;
  const serial=++batchSerial,sourceEpoch=epoch,sourcePlan=plan,pose=View3D.presentationPose(),entries=new Map(),views=[];
  batchActive=true;batchCancelled=false;batchResized=false;batchStatus.hidden=false;cancelBatchButton.hidden=false;overlay.dataset.batch='true';
  const resources=assetManifest();updateCapture();draw();
  try{
   for(let i=0;i<sourcePlan.stops.length;i++){
    if(!batchCurrent(serial,sourceEpoch))return;
    batchStatus.textContent=tx(`Capturando ${i+1} de ${sourcePlan.stops.length}…`,`Capturing ${i+1} of ${sourcePlan.stops.length}…`,`正在截取 ${i+1} / ${sourcePlan.stops.length}…`);
    await View3D.presentationGo(sourcePlan.stops[i],true);await nextFrame();
    if(!batchCurrent(serial,sourceEpoch)||overlay.dataset.moving==='true'||View3D.lifecycleMetrics.pendingAssets)return;
    const camera=View3D.presentationPose(),shot=View3D.shot({...captureOptions,download:false});
    const encoded=shot.dataUrl.split(',')[1],bytes=Uint8Array.from(atob(encoded),char=>char.charCodeAt(0));
    if(bytes.length<24||bytes[0]!==137||bytes[1]!==80||bytes[2]!==78||bytes[3]!==71)throw Error('PNG incompleto.');
    const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
    if(view.getUint32(16)!==shot.width||view.getUint32(20)!==shot.height)throw Error('Dimensiones PNG incoherentes.');
    const filename=`views/view-${String(i+1).padStart(3,'0')}.png`;
    entries.set(filename,bytes);
    views.push({order:i+1,kind:sourcePlan.stops[i].kind,roomId:sourcePlan.stops[i].roomId,label:sourcePlan.stops[i].label,filename,width:shot.width,height:shot.height,bytes:bytes.length,sha256:await FloorPlanPackage.digest(bytes),camera});
    await nextFrame();
   }
   if(!batchCurrent(serial,sourceEpoch))return;
   const manifest={format:'rubik-sota.presentation-captures',version:1,projectId:sourcePlan.projectId,entryId:sourcePlan.entryId,revision:sourcePlan.revision,center:sourcePlan.center,resources,views};
   entries.set('presentation.json',new TextEncoder().encode(JSON.stringify(manifest,null,2)));
   const archive=FloorPlanPackage.zip(entries);
   View3D.presentationRestorePose(pose);
   if(!batchCurrent(serial,sourceEpoch))return;
   const link=document.createElement('a'),url=URL.createObjectURL(archive);link.href=url;link.download='presentacion-estancias.zip';link.click();setTimeout(()=>URL.revokeObjectURL(url),30000);
   batchStatus.textContent=tx(`${views.length} vistas descargadas.`,`Downloaded ${views.length} views.`,`已下载 ${views.length} 个视图。`);
   toast(batchStatus.textContent,3000);
  }catch(error){if(batchCurrent(serial,sourceEpoch)){batchStatus.textContent=error.message;toast(error.message,6000);}}
  finally{
   if(active&&sourceEpoch===epoch&&sourceCurrent()&&serial===batchSerial&&!batchResized)View3D.presentationRestorePose(pose);
   if(batchResized&&active&&sourceEpoch===epoch)batchStatus.textContent=tx('Lote cancelado por cambio de tamaño; no se descargó ningún archivo.','Batch cancelled after resize; no file was downloaded.','调整大小后已取消批量；未下载文件。');
   if(batchCancelled&&!batchResized&&active&&sourceEpoch===epoch)batchStatus.textContent=tx('Lote cancelado; no se descargó ningún archivo.','Batch cancelled; no file was downloaded.','批量已取消；未下载文件。');
   if(batchCancelled&&active&&sourceEpoch===epoch)toast(batchStatus.textContent,3000);
   if(serial===batchSerial){batchActive=false;cancelBatchButton.hidden=true;delete overlay.dataset.batch;updateCapture();draw();}
  }
 }
 function updateAssetWarning(){
  const count=active?(View3D?.assetMetrics||[]).filter(item=>item.state==='error').length:0;
  warning.hidden=!count;
  if(count)warning.textContent=tx(`${count} modelo(s) 3D no disponibles; se muestran muebles genéricos.`,`${count} 3D model(s) unavailable; generic furniture is shown.`,`有 ${count} 个 3D 模型不可用；显示通用家具。`);
 }
 function draw(){
  headerButton.textContent=tx('Presentar mi vivienda','Present my home','展示我的住宅');
  closeButton.textContent=tx('Volver a editar','Return to editor','返回编辑');
  previous.textContent=tx('← Anterior','← Previous','← 上一个');next.textContent=tx('Siguiente →','Next →','下一个 →');
  if(!plan)return;
  const stop=plan.stops[index];title.textContent=stop.kind==='room'?roomName(stop.label):tx('Vista general','Overview','总览');title.title=title.textContent;
  status.textContent=tx(`Vista ${index+1} de ${plan.stops.length}`,`View ${index+1} of ${plan.stops.length}`,`视图 ${index+1} / ${plan.stops.length}`);
  progress.textContent=tx(`Recorrido: ${visited.size} de ${plan.stops.length} vistas visitadas`,`Tour: ${visited.size} of ${plan.stops.length} views visited`,`参观：已访问 ${visited.size} / ${plan.stops.length} 个视图`);
  info.textContent=stop.kind==='room'?tx(`Superficie aproximada ${stop.areaM2.toFixed(2)} m² · medidas orientativas`,`Approximate area ${stop.areaM2.toFixed(2)} m² · indicative dimensions`,`约 ${stop.areaM2.toFixed(2)} 平方米 · 仅供参考`):tx('Vista general del proyecto actual','Overview of the current project','当前项目总览');
  previous.disabled=index===0;next.disabled=index===plan.stops.length-1;
  previous.disabled ||=batchActive;next.disabled ||=batchActive;
  updateCapture();
  stops.replaceChildren();
  plan.stops.forEach((item,i)=>{const b=button(item.kind==='room'?roomName(item.label):tx('Vista general','Overview','总览'),stops,()=>go(i));b.classList.toggle('on',i===index);b.disabled=batchActive;b.setAttribute('aria-current',i===index?'step':'false');});
 }
 function open(){
  if(active||pendingStart){closeButton.focus();return;}
  returnFocus=document.activeElement;
  config.replaceChildren();
  const heading=el('h2',tx('Presentar mi vivienda','Present my home','展示我的住宅'),config);heading.id='presentationConfigTitle';
  const possible=Core.create(app.project,app.geometry,app.entryId,FloorPlanGuide.revision(app.project));
  if(!possible){
   el('p',tx('Primero crea una estancia con muros en Distribuir. El proyecto actual se conserva.','Create a room with walls in Layout first. The current project is kept.','请先在布局中创建带墙的房间。当前项目会保留。'),config);
   const row=el('div',undefined,config,'presentation-config-actions');button(tx('Ir a Distribuir','Go to Layout','前往布局'),row,()=>{config.close();FloorPlanGuideUI?.openDetails('geometry');});
   button(tx('Cancelar','Cancel','取消'),row,()=>config.close());
  }else{
   el('p',tx('Vista general y estancias elegidas. La presentación no cambia el proyecto ni tu objetivo.','Overview and chosen rooms. The presentation does not change your project or goal.','总览和选定房间。展示不会更改项目或目标。'),config);
   const valid=app.geometry.rooms.filter(r=>r.poly.length>=3&&Core.area(r.poly)>0);
   const storageKey=Core.key(app.entryId,app.project.id);
   let saved=null,corrupt=false;
   try{const raw=localStorage.getItem(storageKey);if(raw!==null){saved=JSON.parse(raw);if(saved===null)corrupt=true;}}catch{corrupt=true;}
   const result=Core.reconcile(saved,app.project,app.geometry,app.entryId,FloorPlanGuide.revision(app.project));
   selectedRooms=result.selected;
   roomOrder=[...selectedRooms,...valid.map(r=>r.id).filter(id=>!selectedRooms.includes(id))];
   configMessage=el('p',undefined,config,'presentation-config-message');configMessage.setAttribute('role','status');
   if(corrupt||result.invalid)configMessage.textContent=tx('La configuración guardada no se pudo leer. Elige de nuevo las estancias.','Saved configuration could not be read. Choose rooms again.','无法读取已保存配置。请重新选择房间。');
   else if(result.changed)configMessage.textContent=tx(result.missing?`El plano cambió: ${result.missing} estancia(s) ya no existen. Revisa la selección.`:'El plano cambió. Las vistas se calcularán de nuevo.','The layout changed. Review the room selection; views will be recalculated.','布局已更改。请检查房间选择；视图将重新计算。');
   else configMessage.textContent=tx('Selecciona y ordena las estancias. La vista general va primero.','Select and order rooms. Overview comes first.','选择并排序房间。总览始终在前。');
   roomList=el('div',undefined,config,'presentation-room-list');roomList.setAttribute('role','group');roomList.setAttribute('aria-label',tx('Estancias','Rooms','房间'));
   const row=el('div',undefined,config,'presentation-config-actions');startButton=button(tx('Iniciar presentación','Start presentation','开始展示'),row,()=>{pendingStart=start();pendingStart.finally(()=>{pendingStart=null;});});
   button(tx('Cancelar','Cancel','取消'),row,()=>config.close());
   renderConfig();
  }
  config.showModal();
  (config.querySelector('input')||config.querySelector('button'))?.focus();
 }
 function renderConfig(){
  if(!roomList)return;
  roomList.replaceChildren();
  const names=new Map(app.geometry.rooms.map(r=>[r.id,roomName(r.name)]));
  roomOrder.forEach((id,i)=>{
   const row=el('div',undefined,roomList,'presentation-room-row');
   const label=el('label',undefined,row);const input=el('input',undefined,label);input.type='checkbox';input.value=id;input.checked=selectedRooms.includes(id);
   input.onchange=()=>{selectedRooms=input.checked?[...selectedRooms,id]:selectedRooms.filter(x=>x!==id);startButton.disabled=!selectedRooms.length;};
   el('span',names.get(id)||id,label);
   const up=button('↑',row,()=>reorder(i,-1)),down=button('↓',row,()=>reorder(i,1));
   up.setAttribute('aria-label',tx(`Subir ${names.get(id)}`,`Move ${names.get(id)} up`,`上移 ${names.get(id)}`));
   down.setAttribute('aria-label',tx(`Bajar ${names.get(id)}`,`Move ${names.get(id)} down`,`下移 ${names.get(id)}`));
   up.disabled=i===0;down.disabled=i===roomOrder.length-1;
  });
  startButton.disabled=!selectedRooms.length;
 }
 function reorder(i,delta){const j=i+delta;if(j<0||j>=roomOrder.length)return;[roomOrder[i],roomOrder[j]]=[roomOrder[j],roomOrder[i]];renderConfig();roomList.querySelectorAll('.presentation-room-row')[j]?.querySelector(delta<0?'button:first-of-type':'button:last-of-type')?.focus();}
 async function start(){
  const token=++epoch;
  batchStatus.hidden=true;batchStatus.textContent='';
  entry=app.capturePresentationEntry();entry.focus=returnFocus;
  const selected=roomOrder.filter(id=>selectedRooms.includes(id));
  plan=Core.create(app.project,app.geometry,app.entryId,FloorPlanGuide.revision(app.project),selected);
  if(!plan){config.close();return;}
  try{localStorage.setItem(Core.key(plan.entryId,plan.projectId),JSON.stringify(Core.sidecar(plan.projectId,plan.entryId,plan.revision,selected)));}
  catch{toast(tx('No se pudo guardar la configuración local de presentación.','Could not save the local presentation configuration.','无法保存本地展示配置。'),5000);}
  config.close();overlay.hidden=false;document.body.classList.add('presenting');
  title.textContent=tx('Preparando la escena','Preparing the scene','正在准备场景');
  status.textContent=tx('Cargando geometría 3D…','Loading 3D geometry…','正在加载 3D 几何…');
  info.textContent='';controls.hidden=true;stops.hidden=true;
  history.pushState({...history.state,rubikPresentation:true},'','#presentacion');
  try{
   if(!window.View3D||!await app.enterPresentation3D())throw Error(tx('3D no disponible. Puedes seguir editando en 2D.','3D unavailable. You can keep editing in 2D.','3D 不可用。可继续在 2D 编辑。'));
   if(token!==epoch)return;
   if(!sourceCurrent())throw Error(tx('El proyecto cambió. Vuelve a configurar la presentación.','The project changed. Configure the presentation again.','项目已更改。请重新配置展示。'));
   sceneState=View3D.presentationCapture();active=true;index=0;visited=new Set();controls.hidden=false;stops.hidden=false;updateAssetWarning();
   await go(0,token);closeButton.focus();
  }catch(error){
   if(token===epoch){status.textContent=error.message;info.textContent=tx('El plano permanece disponible.','Your plan remains available.','平面图仍可用。');
    toast(error.message,6000);
    document.body.classList.remove('presenting');document.body.classList.add('presentation-exiting');
    await app.restorePresentationEntry(entry,sceneState);document.body.classList.remove('presentation-exiting');overlay.hidden=true;active=false;entry=null;plan=null;sceneState=null;
    if(location.hash==='#presentacion')history.back();returnFocus?.focus?.({preventScroll:true});}
  }
 }
 async function go(target,token=epoch){
  if(!active||batchActive||target<0||target>=plan.stops.length)return;
  if(!sourceCurrent()){await stop();return;}
  const move=++movement;index=target;overlay.dataset.moving='true';draw();
  try{await View3D.presentationGo(plan.stops[index],matchMedia('(prefers-reduced-motion: reduce)').matches);if(active&&token===epoch&&move===movement&&sourceCurrent()){visited.add(target);draw();}}catch(error){if(token===epoch){status.textContent=error.message;}}
  finally{if(move===movement){overlay.dataset.moving='false';updateCapture();}}
 }
 async function stop(fromPop=false){
  if(stopping||(!entry&&!active&&!pendingStart))return;
  cancelBatch();
  stopping=true;++epoch;
  captureButton.disabled=true;
  if(sceneState)View3D?.presentationRestore(sceneState);
  if(pendingStart)await pendingStart.catch(()=>{});
  const saved=entry,three=sceneState;
  active=false;entry=null;sceneState=null;plan=null;visited=new Set();warning.hidden=true;
  document.body.classList.remove('presenting');document.body.classList.add('presentation-exiting');
  if(saved)await app.restorePresentationEntry(saved,three);
  overlay.hidden=true;document.body.classList.remove('presentation-exiting');
  if(!fromPop&&location.hash==='#presentacion'){
   const focus=saved?.focus;
   addEventListener('popstate',()=>{if(focus?.isConnected)focus.focus({preventScroll:true});},{once:true});
   history.back();
  }
  stopping=false;
 }
 function invalidate(){
  if(!active&&!pendingStart)return;
  cancelBatch();
  ++epoch;++movement;active=false;plan=null;sceneState=null;entry=null;visited=new Set();warning.hidden=true;
  captureButton.disabled=true;
  overlay.hidden=true;document.body.classList.remove('presenting','presentation-exiting');
  if(location.hash==='#presentacion')history.replaceState(history.state,'','#editor');
 }
 function onProjectChange(){if(active&&!sourceCurrent())stop();}
 function contextLost(){
  const saved=entry;
  invalidate();
  if(saved)app.restorePresentationEntry(saved,null,{force2D:true}).catch(()=>{});
 }
 function onKey(e){
  if(!active&&!pendingStart)return;
  if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();stop();return;}
  if(active&&e.target?.matches?.('input,select,textarea'))return;
  if(e.key==='ArrowRight'||e.key==='ArrowLeft'){
   e.preventDefault();e.stopImmediatePropagation();if(!batchActive)go(index+(e.key==='ArrowRight'?1:-1));return;
  }
  if(e.key!=='Tab')e.stopImmediatePropagation();
 }
 addEventListener('keydown',onKey,true);
 addEventListener('popstate',()=>{if(entry&&(active||pendingStart))stop(true);});
 addEventListener('resize',()=>{
  if(!active||!sourceCurrent())return;
  if(batchActive){batchResized=true;cancelBatch();}
  const token=epoch,move=++movement;overlay.dataset.moving='true';updateCapture();
  requestAnimationFrame(()=>{
   if(!active||token!==epoch)return;
   View3D.presentationGo(plan.stops[index],true).catch(()=>{}).finally(()=>{if(move===movement){overlay.dataset.moving='false';updateCapture();requestAnimationFrame(updateCapture);}});
  });
 });
 addEventListener('floorplan-asset-status',()=>{updateAssetWarning();updateCapture();});
 config.addEventListener('close',()=>{if(!active&&!pendingStart)returnFocus?.focus?.({preventScroll:true});});
 draw();
 window.FloorPlanPresentation={open,stop,invalidate,onProjectChange,contextLost,get active(){return active;},get plan(){return plan;}};
})();
