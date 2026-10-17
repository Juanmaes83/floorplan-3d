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
 const map=el('div',undefined,overlay,'presentation-minimap');map.id='presentationMinimap';map.hidden=true;
 const mapToggle=button('',map,()=>{mapOpen=!mapOpen;renderMinimap();});mapToggle.id='presentationMinimapToggle';
 const mapPanel=el('div',undefined,map,'presentation-minimap-panel');mapPanel.id='presentationMinimapPanel';
 const mapSvg=document.createElementNS('http://www.w3.org/2000/svg','svg');mapSvg.setAttribute('role','group');mapPanel.append(mapSvg);
 const card=el('div',undefined,overlay,'presentation-card');
 const top=el('div',undefined,card,'presentation-card-top');
 const title=el('h2',undefined,top),closeButton=button('',top,()=>stop());closeButton.id='presentationClose';
 const status=el('p',undefined,card,'presentation-status');status.setAttribute('role','status');
 const progress=el('p',undefined,card,'presentation-progress');progress.setAttribute('aria-live','polite');
 const info=el('p',undefined,card,'presentation-info');
 const sectionNote=el('p',undefined,card,'presentation-section');sectionNote.id='presentationSection';sectionNote.hidden=true;
 const warning=el('p',undefined,card,'presentation-warning');warning.setAttribute('role','alert');warning.hidden=true;
 const controls=el('div',undefined,card,'presentation-controls');
 const previous=button('',controls,()=>go(index-1)),next=button('',controls,()=>go(index+1));
 const captureButton=button('',controls,()=>capture());captureButton.id='presentationCapture';
 const materialButton=button('',controls,()=>{View3D.setSurfaceQuality(View3D.surfaceQuality==='enhanced'?'base':'enhanced');draw();});materialButton.id='presentationMaterialQuality';
 const lightButton=button('',controls,()=>{changeLighting();});lightButton.id='presentationLightPreset';
 const revealButton=button('',controls,()=>{revealCurrent();});revealButton.id='presentationReveal';
 const contactButton=button('',controls,()=>{changeContactShadows();});contactButton.id='presentationContactShadows';
 const routeButton=button('',controls,()=>{routeCurrent();});routeButton.id='presentationRoute';
 const batchButton=button('',controls,()=>{batchPromise=captureBatch().catch(error=>toast(error.message||String(error),6000)).finally(()=>{batchPromise=null;});});batchButton.id='presentationBatch';
 const cancelBatchButton=button('',controls,()=>cancelBatch());cancelBatchButton.id='presentationBatchCancel';cancelBatchButton.hidden=true;
 const batchStatus=el('p',undefined,card,'presentation-status');batchStatus.id='presentationBatchStatus';batchStatus.setAttribute('role','status');batchStatus.setAttribute('aria-live','polite');batchStatus.hidden=true;
 const routeStatus=el('p',undefined,card,'presentation-status');routeStatus.id='presentationRouteStatus';routeStatus.setAttribute('role','status');routeStatus.setAttribute('aria-live','polite');routeStatus.hidden=true;
 const captureOptions={size:'1280',aspect:'view'};
 const stops=el('div',undefined,card,'presentation-stops');
 let plan=null,entry=null,sceneState=null,index=0,epoch=0,movement=0,active=false,pendingStart=null,returnFocus=null,stopping=false,visited=new Set();
 let roomOrder=[],selectedRooms=[],configMessage=null,roomList=null,startButton=null;
 let batchActive=false,batchSerial=0,batchPromise=null,batchCancelled=false,batchResized=false;
 let mapOpen=false;
 const svgEl=(tag,parent,attributes={})=>{const node=document.createElementNS('http://www.w3.org/2000/svg',tag);for(const [key,value] of Object.entries(attributes))node.setAttribute(key,String(value));parent.append(node);return node;};
 function renderMinimap(){
  map.hidden=!active||!sourceCurrent();if(map.hidden)return;
  mapToggle.textContent=tx(mapOpen?'Ocultar plano':'Mostrar plano',mapOpen?'Hide map':'Show map',mapOpen?'隐藏平面图':'显示平面图');
  mapToggle.setAttribute('aria-expanded',String(mapOpen));mapPanel.hidden=!mapOpen;
  if(!mapOpen)return;
  const data=Core.minimap(app.geometry,overlay.dataset.moving==='true'?null:View3D.presentationPose(),plan.stops[index].roomId);
  if(!data){map.hidden=true;return;}
  mapSvg.replaceChildren();mapSvg.setAttribute('viewBox',data.viewBox.join(' '));
  mapSvg.setAttribute('aria-label',tx('Plano de orientación','Orientation map','方向平面图'));
  const chosen=new Map(plan.stops.map((stop,i)=>[stop.roomId,i]).filter(([id])=>id));
  for(const room of data.rooms){
   const path=svgEl('polygon',mapSvg,{points:room.poly.map(point=>point.join(',')).join(' '),'data-room-id':room.id,class:`presentation-minimap-room${room.active?' active':''}${chosen.has(room.id)?' selectable':''}`});
   if(chosen.has(room.id)){
    path.setAttribute('role','button');path.setAttribute('tabindex','0');path.setAttribute('aria-label',tx(`Ir a ${roomName(room.name)}`,`Go to ${roomName(room.name)}`,`前往 ${roomName(room.name)}`));
    path.setAttribute('aria-current',room.active?'location':'false');
    path.addEventListener('click',()=>{if(!batchActive)go(chosen.get(room.id));});
    path.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();event.stopPropagation();if(!batchActive)go(chosen.get(room.id));}});
   }
  }
  const route=View3D.presentationRouteInfo;
  if(route?.points?.length>1&&['running','complete'].includes(route.status))svgEl('polyline',mapSvg,{points:route.points.map(point=>`${point.x},${point.y}`).join(' '),class:'presentation-minimap-route'});
  if(data.heading){
   const {x,y,dx,dy}=data.heading,length=Math.max(data.viewBox[2],data.viewBox[3])*.10,half=length*.30;
   svgEl('path',mapSvg,{d:`M ${x-dx*length/2} ${y-dy*length/2} L ${x+dx*length/2} ${y+dy*length/2} M ${x+dx*length/2} ${y+dy*length/2} L ${x+dx*length/2-dx*half-dy*half} ${y+dy*length/2-dy*half+dx*half} M ${x+dx*length/2} ${y+dy*length/2} L ${x+dx*length/2-dx*half+dy*half} ${y+dy*length/2-dy*half-dx*half}`,class:'presentation-minimap-heading','data-heading-x':dx,'data-heading-y':dy});
  }
 }
 // Screen area not covered by the card, as stage fractions; room stops are framed inside it.
 function viewRegion(){
  const stage=document.querySelector('#stage')?.getBoundingClientRect(),box=card.getBoundingClientRect();
  if(!stage?.width||!stage.height||!box.width||!box.height)return null;
  const l=(box.left-stage.left)/stage.width,r=(box.right-stage.left)/stage.width,t=(box.top-stage.top)/stage.height,b=(box.bottom-stage.top)/stage.height;
  return [[0,0,l,1],[r,0,1,1],[0,0,1,t],[0,b,1,1]].map(x=>x.map(v=>Math.min(1,Math.max(0,v)))).sort((x,y)=>(y[2]-y[0])*(y[3]-y[1])-(x[2]-x[0])*(x[3]-x[1]))[0];
 }
 function sourceCurrent(){return !!plan&&Core.current(plan,app.project.id,app.entryId,FloorPlanGuide.revision(app.project));}
 function captureReady(){
  if(!active||stopping||batchActive||!sourceCurrent()||overlay.dataset.moving==='true'||!window.View3D?.contextAvailable)return false;
  if(View3D.presentationRevealInfo?.status==='running')return false;
  if(View3D.presentationRouteInfo?.status==='running')return false;
  if(View3D.presentationLight.status==='loading')return false;
  if(View3D.surfaceMetrics.some(m=>m.detailState==='loading'||m.detailState==='waiting'))return false;
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
  batchButton.textContent=tx('Vistas + proyecto ZIP','Views + project ZIP','视图 + 项目 ZIP');
  batchButton.title=tx('PNG estáticos de las vistas y proyecto editable para reimportar; no es una escena 3D interactiva.','Static PNG views and an editable project to reimport; this is not an interactive 3D scene.','静态 PNG 视图及可重新导入的可编辑项目；不是交互式 3D 场景。');
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
  const serial=++batchSerial,sourceEpoch=epoch,sourcePlan=plan,pose=View3D.presentationViewState(),entries=new Map(),views=[];
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
   batchStatus.textContent=tx('Preparando proyecto editable…','Preparing editable project…','正在准备可编辑项目…');
   const {archive:projectArchive,project:editableProject}=await FloorPlanPackage.encode(app.project,FloorPlanImages.get,{withProject:true});
   if(!batchCurrent(serial,sourceEpoch))return;
   const projectBytes=new Uint8Array(await projectArchive.arrayBuffer());
   const projectFile='editable-project.zip';
   entries.set(projectFile,projectBytes);
   const stableProject=structuredClone(editableProject);
   for(const image of stableProject.sourceImages||[])image.storage={kind:'sha256',ref:image.sha256};
   const portableProject={filename:projectFile,format:'rubik-sota.editable-project',projectId:editableProject.id,sourceRevisionSha256:await FloorPlanPackage.digest(new TextEncoder().encode(sourcePlan.revision)),editableRevisionSha256:await FloorPlanPackage.digest(new TextEncoder().encode(FloorPlanGuide.revision(editableProject))),reimportRevisionSha256:await FloorPlanPackage.digest(new TextEncoder().encode(FloorPlanGuide.revision(stableProject))),bytes:projectBytes.length,sha256:await FloorPlanPackage.digest(projectBytes)};
   if(portableProject.projectId!==sourcePlan.projectId)throw Error('El proyecto editable no coincide con la presentación.');
   const total=[...entries.values()].reduce((sum,bytes)=>sum+bytes.length,0);
   if(total>319*1024*1024)throw Error('La presentación portable supera el límite de 320 MB; reduce las imágenes o vistas.');
   if(!batchCurrent(serial,sourceEpoch))return;
   const manifest={format:'rubik-sota.presentation-captures',version:1,viewRepresentation:'static-png',projectId:sourcePlan.projectId,entryId:sourcePlan.entryId,revision:sourcePlan.revision,center:sourcePlan.center,resources,views,portableProject};
   entries.set('presentation.json',new TextEncoder().encode(JSON.stringify(manifest,null,2)));
   const archive=FloorPlanPackage.zip(entries);
   View3D.presentationRestoreView(pose);
   if(!batchCurrent(serial,sourceEpoch))return;
   const link=document.createElement('a'),url=URL.createObjectURL(archive);link.href=url;link.download='presentacion-estancias.zip';link.click();setTimeout(()=>URL.revokeObjectURL(url),30000);
   batchStatus.textContent=tx(`${views.length} vistas PNG y proyecto editable descargados.`,`Downloaded ${views.length} PNG views and editable project.`,`已下载 ${views.length} 个 PNG 视图及可编辑项目。`);
   toast(batchStatus.textContent,3000);
  }catch(error){if(batchCurrent(serial,sourceEpoch)){batchStatus.textContent=error.message;toast(error.message,6000);}}
  finally{
   if(active&&sourceEpoch===epoch&&sourceCurrent()&&serial===batchSerial&&!batchResized)View3D.presentationRestoreView(pose);
   if(batchResized&&active&&sourceEpoch===epoch)batchStatus.textContent=tx('Lote cancelado por cambio de tamaño; no se descargó ningún archivo.','Batch cancelled after resize; no file was downloaded.','调整大小后已取消批量；未下载文件。');
   if(batchCancelled&&!batchResized&&active&&sourceEpoch===epoch)batchStatus.textContent=tx('Lote cancelado; no se descargó ningún archivo.','Batch cancelled; no file was downloaded.','批量已取消；未下载文件。');
   if(batchCancelled&&active&&sourceEpoch===epoch)toast(batchStatus.textContent,3000);
   if(serial===batchSerial){batchActive=false;cancelBatchButton.hidden=true;delete overlay.dataset.batch;updateCapture();draw();}
  }
 }
 function updateAssetWarning(){
  const count=active?(View3D?.assetMetrics||[]).filter(item=>item.state==='error').length:0;
  const lighting=active?View3D?.presentationLight:null;
  warning.hidden=!count&&lighting?.status!=='fallback';
  warning.textContent=[count?tx(`${count} modelo(s) 3D no disponibles; se muestran muebles genéricos.`,`${count} 3D model(s) unavailable; generic furniture is shown.`,`有 ${count} 个 3D 模型不可用；显示通用家具。`):'',lighting?.status==='fallback'?tx('Entorno HDR no disponible; se usa iluminación sintética.','HDR environment unavailable; using synthetic lighting.','HDR 环境不可用；使用合成照明。'):''].filter(Boolean).join(' ');
 }
 async function changeLighting(){
  if(!active||batchActive||stopping)return;
  const token=epoch,next=View3D.presentationLight.preset==='warm'?'neutral':'warm';
  lightButton.disabled=true;
  try{await View3D.setPresentationLightPreset(next);if(active&&token===epoch){draw();updateAssetWarning();}}
  catch(error){if(active&&token===epoch)toast(error.message||String(error),6000);}
  finally{if(active&&token===epoch)lightButton.disabled=false;}
 }
 async function revealCurrent(){
  if(!active||stopping||batchActive||plan.stops[index]?.kind!=='room')return;
  const token=epoch,roomId=plan.stops[index].roomId;
  revealButton.disabled=true;
  try{const pending=View3D.presentationReveal(roomId,matchMedia('(prefers-reduced-motion: reduce)').matches);updateCapture();await pending;}
  catch(error){if(active&&token===epoch)toast(error.message||String(error),6000);}
  finally{if(active&&token===epoch){draw();updateCapture();}}
 }
 function changeContactShadows(){
  if(!active||stopping||batchActive)return;
  try{View3D.setPresentationContactShadows(!View3D.presentationContactShadows.enabled);draw();}
  catch(error){toast(error.message||String(error),6000);draw();}
 }
 function routeMessage(info){
  switch(info.code){
   case 'clear':return tx('Ruta interior libre de obstáculos.','Clear indoor route.','室内路线畅通。');
   case 'budget':return tx('La búsqueda interior supera el presupuesto; recorrido aéreo.','Indoor search exceeded its budget; aerial route.','室内搜索超出预算；使用空中路线。');
   case 'no_free':return tx('No hay espacio libre junto a la entrada o dentro de la estancia; recorrido aéreo.','No clear space by the entrance or inside the room; aerial route.','入口或房间内没有足够空间；使用空中路线。');
   case 'obstructed':return tx('Muros, puertas o muebles bloquean la ruta interior; recorrido aéreo.','Walls, doors or furniture block the indoor route; aerial route.','墙、门或家具阻挡室内路线；使用空中路线。');
   case 'interpolation':return tx('La ruta no conserva el margen de paso; recorrido aéreo.','The path loses its clearance; aerial route.','路径无法保持安全间距；使用空中路线。');
   case 'illegible':return tx('La ruta interior segura no ofrece una vista legible; recorrido aéreo.','The safe indoor route has no readable view; aerial route.','安全的室内路线视野不佳；使用空中路线。');
   case 'no_room':return tx('Estancia sin polígono válido.','Room has no valid polygon.','房间没有有效多边形。');
   case 'no_entry':return tx('No hay puerta de entrada identificada.','No entrance door is identified.','未找到入口门。');
   case 'low_entry':return tx('La entrada es demasiado baja para el recorrido.','The entrance is too low for the route.','入口高度不足，无法游览。');
   default:return info.reason||'';
  }
 }
 async function routeCurrent(){
  if(!active||stopping||batchActive||View3D.presentationRouteInfo?.status==='running'||plan.stops[index]?.kind!=='room')return;
  const token=epoch,roomId=plan.stops[index].roomId;
  // The card collapses to title, exit and route status while walking, so the walk is framed for (almost) the
  // whole stage instead of turning toward the strip beside a full card. It expands again when the route ends.
  overlay.dataset.route='true';routeStatus.hidden=false;routeStatus.textContent='';
  const stageBox=document.querySelector('#stage')?.getBoundingClientRect(),cardBox=card.getBoundingClientRect(),corner=stageBox?.width&&cardBox.width*cardBox.height<.2*stageBox.width*stageBox.height;
  try{const pending=View3D.presentationRoute(roomId,matchMedia('(prefers-reduced-motion: reduce)').matches,{region:corner?null:viewRegion()});const info=View3D.presentationRouteInfo;
   routeStatus.textContent=routeMessage(info);mapOpen=true;draw();renderMinimap();updateCapture();
   const result=await pending;if(active&&token===epoch){routeStatus.textContent=result.status==='complete'?tx('Recorrido terminado. Cámara restaurada a la estancia.','Route complete. Room camera restored.','游览完成。已恢复房间视角。'):result.status==='cancelled'?tx('Recorrido cancelado.','Route cancelled.','游览已取消。'):routeMessage(result);}
  }catch(error){if(active&&token===epoch){routeStatus.hidden=false;routeStatus.textContent=error.message||String(error);}}
  finally{if(active&&token===epoch){delete overlay.dataset.route;draw();updateCapture();}}
 }
 function draw(){
  headerButton.textContent=tx('Presentar mi vivienda','Present my home','展示我的住宅');
  closeButton.textContent=tx('Volver a editar','Return to editor','返回编辑');
  previous.textContent=tx('← Anterior','← Previous','← 上一个');next.textContent=tx('Siguiente →','Next →','下一个 →');
  materialButton.textContent=window.View3D?.surfaceQuality==='enhanced'?tx('Material: detalle','Material: detail','材质：细节'):tx('Material: básico','Material: basic','材质：基础');
  materialButton.setAttribute('aria-pressed',String(window.View3D?.surfaceQuality==='enhanced'));
  materialButton.disabled=batchActive||window.View3D?.presentationRouteInfo?.status==='running';
  lightButton.textContent=window.View3D?.presentationLight?.preset==='warm'?tx('Luz: cálida','Light: warm','灯光：暖色'):tx('Luz: neutra','Light: neutral','灯光：中性');
  lightButton.setAttribute('aria-pressed',String(window.View3D?.presentationLight?.preset==='warm'));
  lightButton.disabled=batchActive||window.View3D?.presentationLight?.status==='loading'||window.View3D?.presentationRouteInfo?.status==='running';
  revealButton.textContent=tx('Revelar acabados','Reveal finishes','显示饰面');
  revealButton.hidden=!plan||plan.stops[index]?.kind!=='room';
  revealButton.disabled=batchActive||overlay.dataset.moving==='true'||window.View3D?.presentationRevealInfo?.status==='running'||window.View3D?.presentationRouteInfo?.status==='running';
  contactButton.textContent=window.View3D?.presentationContactShadows?.enabled?tx('Sombras: suaves','Shadows: soft','阴影：柔和'):tx('Sombras: base','Shadows: base','阴影：基础');
  contactButton.setAttribute('aria-pressed',String(!!window.View3D?.presentationContactShadows?.enabled));
  contactButton.disabled=batchActive||overlay.dataset.moving==='true'||window.View3D?.presentationRouteInfo?.status==='running';
  routeButton.textContent=tx('Recorrer desde entrada','Tour from entrance','从入口游览');
  routeButton.hidden=!plan||plan.stops[index]?.kind!=='room';
  routeButton.disabled=batchActive||overlay.dataset.moving==='true'||window.View3D?.presentationRouteInfo?.status==='running'||window.View3D?.presentationRevealInfo?.status==='running';
  if(!plan)return;
  const stop=plan.stops[index];title.textContent=stop.kind==='room'?roomName(stop.label):tx('Vista general','Overview','总览');title.title=title.textContent;
  status.textContent=tx(`Vista ${index+1} de ${plan.stops.length}`,`View ${index+1} of ${plan.stops.length}`,`视图 ${index+1} / ${plan.stops.length}`);
  progress.textContent=tx(`Recorrido: ${visited.size} de ${plan.stops.length} vistas visitadas`,`Tour: ${visited.size} of ${plan.stops.length} views visited`,`参观：已访问 ${visited.size} / ${plan.stops.length} 个视图`);
  const framed=stop.kind==='room'?window.View3D?.presentationFrameInfo:null,section=framed?.roomId===stop.roomId&&framed.section;
  info.textContent=stop.kind==='room'?tx(`Superficie aproximada ${stop.areaM2.toFixed(2)} m² · medidas orientativas`,`Approximate area ${stop.areaM2.toFixed(2)} m² · indicative dimensions`,`约 ${stop.areaM2.toFixed(2)} 平方米 · 仅供参考`):tx('Vista general del proyecto actual','Overview of the current project','当前项目总览');
  // The note describes the user's stop; a batch frames other rooms internally and must not resize the card.
  if(!batchActive){sectionNote.hidden=!section;sectionNote.textContent=section?tx(`Vista seccionada: muros a ${framed.wallTop.toFixed(1).replace('.',',')} m para ver la estancia; el proyecto no cambia.`,`Section view: walls cut at ${framed.wallTop.toFixed(1)} m to show the room; the project is unchanged.`,`剖切视图：墙体在 ${framed.wallTop.toFixed(1)} 米处剖切以显示整个房间。项目不变。`):'';}
  previous.disabled=index===0;next.disabled=index===plan.stops.length-1;
  previous.disabled ||=batchActive;next.disabled ||=batchActive;
  updateCapture();
  stops.replaceChildren();
  plan.stops.forEach((item,i)=>{const b=button(item.kind==='room'?roomName(item.label):tx('Vista general','Overview','总览'),stops,()=>go(i));b.classList.toggle('on',i===index);b.disabled=batchActive;b.setAttribute('aria-current',i===index?'step':'false');});
  // Single-row stops scroll sideways to the active one; scrollIntoView would also scroll the card vertically
  // and push its close button out of the viewport.
  const current=stops.children[index];
  if(current&&matchMedia('(max-height: 500px), (max-width: 600px)').matches){
   if(stops.scrollWidth>stops.clientWidth){const left=current.getBoundingClientRect().left-stops.getBoundingClientRect().left+stops.scrollLeft,right=left+current.offsetWidth;if(left<stops.scrollLeft)stops.scrollLeft=left;else if(right>stops.scrollLeft+stops.clientWidth)stops.scrollLeft=right-stops.clientWidth;}
   // A short card scrolls by itself (its header with the close button is sticky): bring the stops row into it.
   // Kept in view as the card content changes, but never during a batch, whose controls must stay put.
   if(!batchActive&&matchMedia('(max-height: 500px)').matches&&card.scrollHeight>card.clientHeight){const c=card.getBoundingClientRect(),r=stops.getBoundingClientRect();if(r.bottom>c.bottom)card.scrollTop+=r.bottom-c.bottom+4;}
  }
  if(active&&overlay.dataset.moving!=='true')renderMinimap();
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
  config.close();overlay.hidden=false;overlay.dataset.moving='true';mapOpen=matchMedia('(min-width: 700px) and (min-height: 501px)').matches;map.hidden=true;document.body.classList.add('presenting');
  title.textContent=tx('Preparando la escena','Preparing the scene','正在准备场景');
  status.textContent=tx('Cargando geometría 3D…','Loading 3D geometry…','正在加载 3D 几何…');
  info.textContent='';controls.hidden=true;stops.hidden=true;
  history.pushState({...history.state,rubikPresentation:true},'','#presentacion');
  try{
   if(!window.View3D||!await app.enterPresentation3D())throw Error(tx('3D no disponible. Puedes seguir editando en 2D.','3D unavailable. You can keep editing in 2D.','3D 不可用。可继续在 2D 编辑。'));
   if(token!==epoch)return;
   if(!sourceCurrent())throw Error(tx('El proyecto cambió. Vuelve a configurar la presentación.','The project changed. Configure the presentation again.','项目已更改。请重新配置展示。'));
   sceneState=View3D.presentationCapture();active=true;index=0;visited=new Set();controls.hidden=false;stops.hidden=false;updateAssetWarning();
   const assigned=new Set([...app.project.rooms.map(r=>r.floorMaterialId),...app.project.walls.map(w=>w.surfaceMaterialId)]);
   materialButton.hidden=!app.project.materials.some(m=>assigned.has(m.id)&&FloorPlanSurfaces.get(m.appearance?.preset)?.maps?.normal);
   if(!materialButton.hidden)View3D.setSurfaceQuality('enhanced');
   await View3D.setPresentationLightPreset('neutral');
   if(token!==epoch)return;
   updateAssetWarning();
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
  View3D.clearPresentationReveal?.();View3D.clearPresentationRoute?.();routeStatus.hidden=true;routeStatus.textContent='';delete overlay.dataset.route;
  const move=++movement;index=target;overlay.dataset.moving='true';draw();
  try{const pending=View3D.presentationGo(plan.stops[index],matchMedia('(prefers-reduced-motion: reduce)').matches,{region:viewRegion()});draw();await pending;if(active&&token===epoch&&move===movement&&sourceCurrent()){visited.add(target);draw();}}catch(error){if(token===epoch){status.textContent=error.message;}}
  finally{if(move===movement){overlay.dataset.moving='false';revealButton.disabled=batchActive;contactButton.disabled=batchActive;routeButton.disabled=batchActive;updateCapture();if(active&&sourceCurrent())renderMinimap();}}
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
  overlay.hidden=true;map.hidden=true;document.body.classList.remove('presentation-exiting');
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
  overlay.hidden=true;map.hidden=true;document.body.classList.remove('presenting','presentation-exiting');
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
  if(active&&map.contains(e.target)&&(e.key==='Enter'||e.key===' '))return;
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
   View3D.presentationGo(plan.stops[index],true,{region:viewRegion()}).catch(()=>{}).finally(()=>{if(move===movement){overlay.dataset.moving='false';draw();updateCapture();renderMinimap();requestAnimationFrame(updateCapture);}});
  });
 });
 addEventListener('floorplan-asset-status',()=>{updateAssetWarning();updateCapture();});
 config.addEventListener('close',()=>{if(!active&&!pendingStart)returnFocus?.focus?.({preventScroll:true});});
 draw();
 window.FloorPlanPresentation={open,stop,invalidate,onProjectChange,contextLost,get active(){return active;},get plan(){return plan;}};
})();
