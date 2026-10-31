/* Reversible presentation UI. Plan and progress are local derived state. */
(function(){
 'use strict';
 const Core=FloorPlanPresentationCore,app=FloorPlanApp,tx=(es,en,zh)=>FloorPlanGuide.text([es,en,zh||es],LANG);
 const roomName=(roomId,levelId)=>roomDisplay((buildingConfig?.find(level=>level.levelId===levelId)?.project||app.project).rooms.find(room=>room.id===roomId));
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
 // In the card header (sticky on short screens), so the level of the view stays visible when the card scrolls.
 const levelLine=el('p',undefined,top,'presentation-level');levelLine.id='presentationLevel';levelLine.hidden=true;levelLine.setAttribute('aria-live','polite');
 const progress=el('p',undefined,card,'presentation-progress');progress.setAttribute('aria-live','polite');
 const info=el('p',undefined,card,'presentation-info');
 const sectionNote=el('p',undefined,card,'presentation-section');sectionNote.id='presentationSection';sectionNote.hidden=true;
 const warning=el('p',undefined,card,'presentation-warning');warning.setAttribute('role','alert');warning.hidden=true;
 const controls=el('div',undefined,card,'presentation-controls');
 // The client's navigation first; the professional's tools (image, light, batch…) in their own group. On a phone the
 // group is one scrollable row, so each tool added later does not make the card cover more of the home.
 const nav=el('div',undefined,controls,'presentation-nav'),tools=el('div',undefined,controls,'presentation-tools');tools.id='presentationTools';tools.setAttribute('role','group');
 const previous=button('',nav,()=>go(index-1)),next=button('',nav,()=>go(index+1));
 const captureButton=button('',tools,()=>capture());captureButton.id='presentationCapture';
 const shareButton=button('',tools,()=>share());shareButton.id='presentationShare';
 const territoryButton=button('Contexto exterior',tools,async()=>{try{await View3D.presentationGo({kind:'territorial-context',bounds:{...app.geometry.envelope}},true,{region:viewRegion()});title.textContent='Contexto exterior';status.textContent='Colocación contextual del edificio';}catch(error){toast(error.message,6000);}});territoryButton.id='presentationTerritory';
 const materialButton=button('',tools,()=>{View3D.setSurfaceQuality(View3D.surfaceQuality==='enhanced'?'base':'enhanced');draw();});materialButton.id='presentationMaterialQuality';
 const lightButton=button('',tools,()=>{changeLighting();});lightButton.id='presentationLightPreset';
 const revealButton=button('',tools,()=>{revealCurrent();});revealButton.id='presentationReveal';
 const contactButton=button('',tools,()=>{changeContactShadows();});contactButton.id='presentationContactShadows';
 const routeButton=button('',tools,()=>{routeCurrent();});routeButton.id='presentationRoute';
 const batchButton=button('',tools,()=>startBatch());batchButton.id='presentationBatch';
 const cancelBatchButton=button('',tools,()=>cancelBatch());cancelBatchButton.id='presentationBatchCancel';cancelBatchButton.hidden=true;
 const batchStatus=el('p',undefined,card,'presentation-status');batchStatus.id='presentationBatchStatus';batchStatus.setAttribute('role','status');batchStatus.setAttribute('aria-live','polite');batchStatus.hidden=true;
 const routeStatus=el('p',undefined,card,'presentation-status');routeStatus.id='presentationRouteStatus';routeStatus.setAttribute('role','status');routeStatus.setAttribute('aria-live','polite');routeStatus.hidden=true;
 const captureOptions={size:'1280',aspect:'view'};
 const stops=el('div',undefined,card,'presentation-stops');
 let plan=null,entry=null,sceneState=null,index=0,epoch=0,movement=0,active=false,pendingStart=null,returnFocus=null,stopping=false,visited=new Set();
 // Focus goes back to the control that opened the presentation; if the guide has since moved the entry (one
 // presentation entry at a time), to the presentation entry that is visible now, never to an unrelated control.
 const shown=el=>!!el?.isConnected&&!el.closest('[hidden]')&&el.getClientRects().length>0;
 function refocus(target){(shown(target)?target:['#guidePresent','#presentationBtn'].map(q=>document.querySelector(q)).find(shown))?.focus?.({preventScroll:true});}
 let roomOrder=[],selectedRooms=[],configMessage=null,roomList=null,startButton=null;
 let batchActive=false,batchSerial=0,batchPromise=null,batchCancelled=false,batchResized=false;
 let mapOpen=false;
 // FT3D-1a «Empezar desde el plano» (js/presentation-story-core.js): chosen per presentation in the dialog, off by
 // default and never saved. Its controls exist only while it is chosen, so a presentation without it is unchanged.
 let storyChosen=false,storyEnabled=false,story=null,storyUi=null;
 // FT3D-3 «Incluir sección dinámica»: chosen per presentation, off by default, never saved. sectionLevels: the section
 // descriptor of each level (FloorPlanPresentationSection.derive), computed when the dialog opens; sectionAxis: the one
 // axis of a building (envelope of its levels in the building frame), so every level is cut the same way.
 let sectionChosen=false,sectionEnabled=false,sectionLevels=new Map(),sectionAxis=null;
 // FT3D-4 «Incluir alzado/fachada narrativa»: chosen per presentation, off by default, never saved. elevationDescriptor:
 // the façade candidates of the home or building (FloorPlanPresentationElevation.derive), computed when the dialog
 // opens; elevationCandidateId: the façade chosen in its selector (the automatic one by default); the solar snapshot is
 // taken once when the presentation starts and only when the person chose it.
 let elevationChosen=false,elevationEnabled=false,elevationDescriptor=null,elevationCandidateId=null,elevationSolarChosen=false,elevationSolar=null;
 const OVERVIEW_DIRECTION=[.42,.84,.34];
 // Brand snapshot taken when the presentation starts (FloorPlanBrandUI): what the client sees and receives.
 let brandSnap=null;
 // Building presentation (two levels): the configuration per level, the level that was active when it started (it
 // comes back when the presentation ends).
 let buildingConfig=null,startLevelId=null;
 const building=()=>window.FloorPlanBuildingUI;
 const isBuildingPlan=()=>plan?.scope==='building';
 const activeLevelId=()=>app.levelContext?.levelId||null;
 const svgEl=(tag,parent,attributes={})=>{const node=document.createElementNS('http://www.w3.org/2000/svg',tag);for(const [key,value] of Object.entries(attributes))node.setAttribute(key,String(value));parent.append(node);return node;};
 // FT3D-4 marks never outlive their scene, even when the map is hidden or the presentation ends mid-scene.
 const clearFacadeMarks=()=>mapSvg.querySelectorAll('.presentation-minimap-facade,.presentation-minimap-facade-look').forEach(n=>n.remove());
 function renderMinimap(){
  map.hidden=!active||!sourceCurrent();if(map.hidden){clearFacadeMarks();return;}
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
    path.setAttribute('role','button');path.setAttribute('tabindex','0');path.setAttribute('aria-label',tx(`Ir a ${roomName(room.id,plan.stops[index].levelId)}`,`Go to ${roomName(room.id,plan.stops[index].levelId)}`,`前往 ${roomName(room.id,plan.stops[index].levelId)}`));
    path.setAttribute('aria-current',room.active?'location':'false');
    path.addEventListener('click',()=>{if(!batchActive)go(chosen.get(room.id));});
    path.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();event.stopPropagation();if(!batchActive)go(chosen.get(room.id));}});
   }
  }
  const route=View3D.presentationRouteInfo;
  if(route?.points?.length>1&&['running','complete'].includes(route.status))svgEl('polyline',mapSvg,{points:route.points.map(point=>`${point.x},${point.y}`).join(' '),class:'presentation-minimap-route'});
  // FT3D-3: while the section is on, its cut line and the way the frontal camera looks, from the same descriptor.
  const cut=story&&story.scenes[story.i]?.kind==='section-open'&&story.p>0?View3D.presentationStoryInfo?.dynamicSection:null;
  if(cut){const [a,b]=cut.line,len=Math.max(data.viewBox[2],data.viewBox[3])*.09,mx=(a[0]+b[0])/2,my=(a[1]+b[1])/2;
   svgEl('line',mapSvg,{x1:a[0],y1:a[1],x2:b[0],y2:b[1],class:'presentation-minimap-section','data-section-line':'true'});
   svgEl('path',mapSvg,{d:`M ${mx-cut.look[0]*len} ${my-cut.look[1]*len} L ${mx} ${my} M ${mx} ${my} L ${mx-cut.look[0]*len*.35-cut.look[1]*len*.3} ${my-cut.look[1]*len*.35+cut.look[0]*len*.3} M ${mx} ${my} L ${mx-cut.look[0]*len*.35+cut.look[1]*len*.3} ${my-cut.look[1]*len*.35-cut.look[0]*len*.3}`,class:'presentation-minimap-section-look','data-look-x':cut.look[0],'data-look-y':cut.look[1]});
   mapSvg.setAttribute('aria-label',tx('Plano de orientación con la línea de la sección visual','Orientation map with the visual section line','带剖面线的方向平面图'));}
  // FT3D-4: while the façade scene runs, the walls of the chosen façade on this level and the frontal look at them.
  const fac=story&&story.scenes[story.i]?.kind==='elevation-open'&&story.p>0&&story.p<1?View3D.presentationStoryInfo?.elevation:null;
  if(fac){const levelId=plan.stops[index]?.levelId??null,project=levelProject(levelId),ids=new Set(fac.walls?elevationCandidate()?.wallRefs.filter(r=>(r.levelId??null)===(levelId??null)).map(r=>r.wallId):[]);
   const walls=(project?.walls||[]).filter(w=>ids.has(w.id)),len=Math.max(data.viewBox[2],data.viewBox[3])*.09,[nx,ny]=fac.normalPlan;
   for(const w of walls)svgEl('line',mapSvg,{x1:w.start.x,y1:w.start.y,x2:w.end.x,y2:w.end.y,class:'presentation-minimap-facade','data-facade-wall':w.id});
   if(walls.length){const mx=walls.reduce((v,w)=>v+(w.start.x+w.end.x)/2,0)/walls.length,my=walls.reduce((v,w)=>v+(w.start.y+w.end.y)/2,0)/walls.length,ax=mx+nx*len*1.6,ay=my+ny*len*1.6,lx=-nx,ly=-ny;
    svgEl('path',mapSvg,{d:`M ${ax+nx*len} ${ay+ny*len} L ${ax} ${ay} M ${ax} ${ay} L ${ax-lx*len*.35-ly*len*.3} ${ay-ly*len*.35+lx*len*.3} M ${ax} ${ay} L ${ax-lx*len*.35+ly*len*.3} ${ay-ly*len*.35-lx*len*.3}`,class:'presentation-minimap-facade-look','data-look-x':lx,'data-look-y':ly});}
   mapSvg.setAttribute('aria-label',tx('Plano de orientación con la fachada visual seleccionada','Orientation map with the selected visual façade','带所选可视立面的方向平面图'));}
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
 function sourceCurrent(){
  if(!plan)return false;
  if(!isBuildingPlan())return Core.current(plan,app.project.id,app.entryId,FloorPlanGuide.revision(app.project));
  // Only the active level can change on screen; the batch checks every level again before writing the ZIP.
  const level=plan.levels.find(l=>l.levelId===activeLevelId());
  return !!level&&plan.entryId===app.entryId&&level.projectId===app.project.id&&level.revision===FloorPlanGuide.revision(app.project);
 }
 const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
 // Waits until the 3D scene of the active level is rebuilt and its authorized models are loaded (bounded).
 async function settle(limit=20000){
  const begin=performance.now();await nextFrame();await nextFrame();
  while(performance.now()-begin<limit){const m=View3D.lifecycleMetrics;if(!m.pendingAssets&&!m.animating)return true;await wait(100);}
  return false;
 }
 // Makes `levelId` the active level of the building for the presentation (the editor's own level switch, without
 // invalidating the presentation). Throws if the level cannot be shown; nothing in the building changes.
 async function showLevel(levelId,{strict=false}={}){
  if(!levelId||activeLevelId()===levelId)return true;
  building()?.presentLevel(levelId);
  if(activeLevelId()!==levelId)throw Error(tx('No se pudo cambiar de planta; la presentación se detiene sin cambiar el proyecto.','Could not change level; the presentation stops without changing the project.','无法切换楼层；展示停止，项目未更改。'));
  const ready=await settle();
  if(strict&&!ready)throw Error(tx(`Los modelos 3D de «${app.levelContext.levelName}» siguen cargando; no se descargó ningún archivo. Vuelve a intentarlo.`,`3D models of «${app.levelContext.levelName}» are still loading; nothing was downloaded. Try again.`,`«${app.levelContext.levelName}» 的 3D 模型仍在加载；未下载任何文件。`));
  updateMaterialButton();updateAssetWarning();
  return ready;
 }
 // A building with a pending distribution is not presented as a finished proposal; the batch and the single PNG
 // check it again, so no internal path can export a blocked building.
 function blocked(){const st=building()?.status?.();return st&&st.state!=='clear'?st:null;}
 function blockedMessage(st){return tx(`No se exporta: ${st.state==='pending'?'la distribución está pendiente':'hay muebles sin evaluar'} (${st.headline}). Corrígelo en el editor.`,`Not exported: the layout is pending (${st.headline}).`,`未导出：布局待处理（${st.headline}）。`);}
 function updateMaterialButton(){
  const assigned=new Set([...app.project.rooms.map(r=>r.floorMaterialId),...app.project.walls.map(w=>w.surfaceMaterialId)]);
  materialButton.hidden=!app.project.materials.some(m=>assigned.has(m.id)&&FloorPlanSurfaces.get(m.appearance?.preset)?.maps?.normal);
 }
 function captureReady(){
  if(!active||stopping||batchActive||!sourceCurrent()||overlay.dataset.moving==='true'||!window.View3D?.contextAvailable)return false;
  if(View3D.presentationRevealInfo?.status==='running')return false;
  if(View3D.presentationRouteInfo?.status==='running')return false;
  if(story)return false;
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
  drawStory();
  shareButton.disabled=!captureReady();shareButton.textContent=tx('Compartir imagen','Share image','分享图片');
  const busy=window.View3D?.lifecycleMetrics;
  batchButton.disabled=!captureReady()||!!busy?.pendingAssets||!!busy?.animating||!!busy?.flying;
  batchButton.textContent=tx('Vistas + proyecto ZIP','Views + project ZIP','视图 + 项目 ZIP');
  batchButton.title=tx('PNG estáticos de las vistas y proyecto editable para reimportar; no es una escena 3D interactiva.','Static PNG views and an editable project to reimport; this is not an interactive 3D scene.','静态 PNG 视图及可重新导入的可编辑项目；不是交互式 3D 场景。');
  cancelBatchButton.textContent=tx('Cancelar lote','Cancel batch','取消批量');
  if(!active)return;
  try{const size=View3D.shotSize(captureOptions);captureButton.textContent=tx(`Guardar PNG ${size.width}×${size.height}` ,`Save PNG ${size.width}×${size.height}`,`保存 PNG ${size.width}×${size.height}`);}
  catch{captureButton.disabled=true;captureButton.textContent=tx('PNG no disponible','PNG unavailable','PNG 不可用');}
 }
 // «Compartir imagen»: prepares the image of the current view (with the brand strip when there is a brand) and opens a
 // panel. «Compartir…» there opens the system share sheet (WhatsApp, Gmail, LinkedIn…) with the prepared file in its
 // own tap, so the user activation is still valid; without file sharing, download, WhatsApp and e-mail with a text —
 // the person attaches the image. It shares an IMAGE, never a link to the project: nothing is uploaded by Rubik.
 // Delivery image (js/delivery-image.js): the whole home framed to fill the picture on the overview, the stop's own
 // camera on a room; the project data and the brand go in their own band (never over the home). The preview IS the
 // file that is downloaded or shared: same data URL, same bytes.
 async function viewImage({format='landscape',contact=false}={}){const stop=plan.stops[index],label=stop.kind==='room'?roomName(stop.roomId,stop.levelId):tx('Vista general','Overview','总览');
  // Landscape: image on the left and the data in a side column (a compact home keeps the whole height; measured in
  // docs/qa/delivery-image-2026-10-22.md). Portrait: image above a data band.
  const D=window.FloorPlanDeliveryImage,layout=format==='landscape'?'side':'band',A=D.imageArea(format,layout);
  const shot=View3D.deliveryShot({width:A.w,height:A.h,frame:stop.kind!=='room'});
  const room=stop.kind==='room'?app.geometry.rooms.find(r=>r.id===stop.roomId):null;
  const p=brandSnap?.profile,data=D.content({title:brandSnap?.title||app.project.name,view:label,level:(plan.levels?.length||0)>1?stop.levelName:'',rooms:room?[room]:app.geometry.rooms,
   brand:p&&p.name?{name:p.name,logo:p.logo,contact:contact?window.FloorPlanBrand?.contactLine?.(p)||'':''}:null});
  const out=await D.compose({image:shot.dataUrl,format,layout,data});const blob=await (await fetch(out.dataUrl)).blob();
  return {url:out.dataUrl,label,format,fill:shot.fill,data,file:new File([blob],`rubik-sota-vivienda-${format==='portrait'?'vertical':'horizontal'}.png`,{type:'image/png'})};}
 const shareDialog=el('dialog',undefined,document.body,'share-dialog');shareDialog.id='shareDialog';shareDialog.setAttribute('aria-labelledby','shareTitle');
 async function share(){
  if(!captureReady())return;const st=blocked();if(st){toast(blockedMessage(st),8000);return;}
  shareButton.disabled=true;
  try{const name=(brandSnap?.title||app.project.name||'').trim(),hasContact=!!(brandSnap?.profile&&window.FloorPlanBrand?.contactLine?.(brandSnap.profile));
   const opts={format:'landscape',contact:false};let img=await viewImage(opts);
   const text=()=>tx(`${name?name+' · ':''}${img.label}. Imagen creada con Rubik Sota; medidas orientativas.`,`${name?name+' · ':''}${img.label}. Image made with Rubik Sota; indicative dimensions.`,`${name?name+' · ':''}${img.label}。由 Rubik Sota 生成的图片；尺寸仅供参考。`);
   // The image is prepared first; the system share sheet is opened by its own tap in the panel, so the browser's
   // user-activation window is not spent while the PNG is being generated.
   shareDialog.replaceChildren();const h=el('h2',tx('Compartir imagen','Share image','分享图片'),shareDialog);h.id='shareTitle';h.tabIndex=-1;
   // Format and contact: each change regenerates the image; the preview and the file are always the same bytes.
   const choices=el('div',undefined,shareDialog,'share-choices');const fmt=el('div',undefined,choices,'share-format');fmt.setAttribute('role','group');fmt.setAttribute('aria-label',tx('Formato','Format','格式'));
   const fmtButtons=[['landscape',tx('Horizontal','Landscape','横向')],['portrait',tx('Vertical','Portrait','纵向')]].map(([value,label])=>{const b=el('button',label,fmt,'btn');b.type='button';b.dataset.format=value;b.setAttribute('aria-pressed',String(value===opts.format));b.onclick=()=>update({format:value});return b;});
   let contactBox=null;if(hasContact){const lab=el('label',undefined,choices,'share-contact');contactBox=el('input',undefined,lab);contactBox.type='checkbox';contactBox.id='shareContact';lab.append(' '+tx('Mostrar mi contacto en la imagen','Show my contact on the image','在图片上显示我的联系方式'));contactBox.onchange=()=>update({contact:contactBox.checked});}
   const preview=el('img',undefined,shareDialog,'share-preview');
   el('p',tx('Se comparte una imagen de esta vista, no un enlace al proyecto. «Compartir…» abre el menú de tu dispositivo cuando lo permite; si no, descárgala y adjúntala tú en WhatsApp, Gmail, LinkedIn o el portal inmobiliario.','You share an image of this view, not a link to the project. Download it and attach it in WhatsApp, Gmail, LinkedIn or a property portal.','分享的是此视图的图片，而不是项目链接。下载后在 WhatsApp、Gmail、LinkedIn 或房产平台中附上。'),shareDialog,'share-note');
   const row=el('div',undefined,shareDialog,'share-actions');
   let native=null;if(navigator.canShare?.({files:[img.file]})){native=el('button',tx('Compartir…','Share…','分享…'),row,'btn primary');native.type='button';native.id='shareNative';
    native.onclick=()=>{navigator.share({files:[img.file],title:name||'Rubik Sota',text:text()}).then(()=>shareDialog.close(),e=>{if(e?.name!=='AbortError')toast(tx('El sistema no pudo compartir la imagen. Descárgala y adjúntala.','The system could not share the image. Download it and attach it.','系统无法分享图片。请下载后附上。'),7000);});};}
   const dl=el('a',tx('Descargar imagen','Download image','下载图片'),row,native?'btn':'btn primary');dl.id='shareDownload';
   const wa=el('a',tx('WhatsApp','WhatsApp','WhatsApp'),row,'btn');wa.target='_blank';wa.rel='noopener';wa.id='shareWhatsApp';
   const mail=el('a',tx('Correo','E-mail','电子邮件'),row,'btn');mail.id='shareMail';
   const close=el('button',tx('Cerrar','Close','关闭'),row,'btn');close.type='button';close.onclick=()=>shareDialog.close();
   const show=()=>{preview.src=img.url;preview.alt=tx(`Imagen que se compartirá: ${img.label}`,`Image to be shared: ${img.label}`,`将分享的图片：${img.label}`);preview.dataset.format=img.format;shareDialog.dataset.contact=img.data.brand?.contact?'shown':'hidden';
    dl.href=img.url;dl.download=img.file.name;wa.href='https://wa.me/?text='+encodeURIComponent(text());
    mail.href='mailto:?subject='+encodeURIComponent(name||'Rubik Sota')+'&body='+encodeURIComponent(text()+'\n\n'+tx('(Adjunta la imagen descargada.)','(Attach the downloaded image.)','（请附上下载的图片。）'));
    for(const b of fmtButtons)b.setAttribute('aria-pressed',String(b.dataset.format===img.format));};
   const controls=()=>[...fmtButtons,contactBox,native,dl].filter(Boolean);
   async function update(change){Object.assign(opts,change);shareDialog.setAttribute('aria-busy','true');for(const c of controls())c.toggleAttribute('disabled',true);
    try{img=await viewImage(opts);show();}catch(error){toast(error.message||String(error),6000);}
    finally{shareDialog.removeAttribute('aria-busy');for(const c of controls())c.toggleAttribute('disabled',false);}}
   show();shareDialog.showModal();h.focus();
  }catch(error){toast(error.message||String(error),6000);}
  finally{shareButton.disabled=false;updateCapture();}
 }
 function capture(){
  if(!captureReady())return;
  const st=blocked();if(st){toast(blockedMessage(st),8000);return;}
  captureButton.disabled=true;
  // With a brand, the PNG the client receives carries its strip (same size); without a brand, as before.
  if(brandSnap){const stop=plan.stops[index];Promise.resolve().then(async()=>{const shot=View3D.shot({...captureOptions,download:false});const url=await FloorPlanBrandUI.stamp(shot.dataUrl,brandSnap,stop.kind==='room'?roomName(stop.roomId,stop.levelId):tx('Vista general','Overview','总览'));const a=document.createElement('a');a.download='rubik-sota-presentacion.png';a.href=url;a.click();}).catch(error=>toast(error.message||String(error),6000)).finally(()=>updateCapture());return;}
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
 // One PNG of the current view, checked (signature and IHDR size) before it goes into a batch.
 async function pngShot(label){
  const shot=View3D.shot({...captureOptions,download:false});
  const image=brandSnap?await FloorPlanBrandUI.stamp(shot.dataUrl,brandSnap,label):shot.dataUrl;
  const encoded=image.split(',')[1],bytes=Uint8Array.from(atob(encoded),char=>char.charCodeAt(0));
  if(bytes.length<24||bytes[0]!==137||bytes[1]!==80||bytes[2]!==78||bytes[3]!==71)throw Error('PNG incompleto.');
  const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
  if(view.getUint32(16)!==shot.width||view.getUint32(20)!==shot.height)throw Error('Dimensiones PNG incoherentes.');
  return {shot,bytes};
 }
 // Entry names of a building batch: the 1.x names minus the editable project, plus the editable building ZIP.
 const buildingBatchPath=name=>{if(name==='presentation.json'||name==='editable-building.zip'||/^views\/view-[0-9]{3}\.png$/.test(name))return name;throw Error('Ruta ZIP no permitida: '+name);};
 function startBatch(){
  const st=blocked();if(st){batchStatus.hidden=false;batchStatus.textContent=blockedMessage(st);toast(batchStatus.textContent,8000);return;}
  batchPromise=(isBuildingPlan()?captureBuildingBatch():captureBatch()).catch(error=>toast(error.message||String(error),6000)).finally(()=>{batchPromise=null;});
 }
 // Building batch: every stop of both levels in one ZIP. Each level is made active for its own views (its authorized
 // models and materials), the level that was active comes back afterwards and the building does not change.
 async function captureBuildingBatch(){
  const busy=View3D.lifecycleMetrics;
  if(!captureReady()||busy.pendingAssets||busy.animating||busy.flying)return;
  const serial=++batchSerial,sourceEpoch=epoch,sourcePlan=plan,pose=View3D.presentationViewState(),firstLevel=activeLevelId(),entries=new Map(),views=[],resources=new Map();
  batchActive=true;batchCancelled=false;batchResized=false;batchStatus.hidden=false;cancelBatchButton.hidden=false;overlay.dataset.batch='true';
  updateCapture();draw();
  let restored=false;
  const restore=async()=>{if(restored)return;restored=true;if(active&&sourceEpoch===epoch&&activeLevelId()!==firstLevel){await showLevel(firstLevel).catch(()=>{});}if(active&&sourceEpoch===epoch&&sourceCurrent()&&!batchResized)View3D.presentationRestoreView(pose);};
  try{
   for(let i=0;i<sourcePlan.stops.length;i++){
    if(!batchCurrent(serial,sourceEpoch))return;
    const stop=sourcePlan.stops[i];
    batchStatus.textContent=tx(`Capturando ${i+1} de ${sourcePlan.stops.length} · ${stop.levelName}…`,`Capturing ${i+1} of ${sourcePlan.stops.length} · ${stop.levelName}…`,`正在截取 ${i+1} / ${sourcePlan.stops.length} · ${stop.levelName}…`);
    await showLevel(stop.levelId,{strict:true});
    if(!batchCurrent(serial,sourceEpoch))return;
    if(!resources.has(stop.levelId))resources.set(stop.levelId,assetManifest());
    await View3D.presentationGo(stop,true);await nextFrame();
    if(!batchCurrent(serial,sourceEpoch)||overlay.dataset.moving==='true')return;
    if(View3D.lifecycleMetrics.pendingAssets)throw Error(tx('Los modelos 3D siguen cargando; no se descargó ningún archivo. Vuelve a intentarlo.','3D models are still loading; nothing was downloaded. Try again.','3D 模型仍在加载；未下载任何文件。'));
    const label=stop.kind==='room'?roomName(stop.roomId,stop.levelId):tx('Vista general','Overview','总览');
    const camera=View3D.presentationPose(),{shot,bytes}=await pngShot(`${stop.levelName} · ${label}`);
    if(!batchCurrent(serial,sourceEpoch))return;
    const filename=`views/view-${String(i+1).padStart(3,'0')}.png`;
    if(entries.has(filename))throw Error('Vista repetida en el lote.');
    entries.set(filename,bytes);
    views.push({order:i+1,levelId:stop.levelId,levelName:stop.levelName,levelOrder:stop.levelOrder,kind:stop.kind,roomId:stop.roomId,label:stop.label,filename,width:shot.width,height:shot.height,bytes:bytes.length,sha256:await FloorPlanPackage.digest(bytes),camera});
    await nextFrame();
   }
   if(!batchCurrent(serial,sourceEpoch))return;
   await restore();
   if(!batchCurrent(serial,sourceEpoch))return;
   batchStatus.textContent=tx('Preparando edificio editable…','Preparing editable building…','正在准备可编辑建筑…');
   // Every presented level must still be the one the views were taken from.
   const sources=building().presentationSources(),revisions=new Map(sources.levels.map(l=>[l.levelId,{projectId:l.project.id,revision:l.revision}]));
   if(!Core.currentBuilding(sourcePlan,app.entryId,revisions))throw Error(tx('El edificio cambió durante el lote; no se descargó ningún archivo.','The building changed during the batch; nothing was downloaded.','批量期间建筑已更改；未下载任何文件。'));
   // `buildingSha256` is the canonical hash of the packaged `building.json`, so a reader can check it.
   const {archive:buildingArchive,building:packaged}=await building().packageBuilding();
   if(!batchCurrent(serial,sourceEpoch))return;
   const buildingBytes=new Uint8Array(await buildingArchive.arrayBuffer());
   entries.set('editable-building.zip',buildingBytes);
   const B=window.FloorPlanBuilding,portableBuilding={filename:'editable-building.zip',format:'rubik-sota.editable-building',buildingId:packaged.id,
    buildingSha256:await B.sha256(B.canonical(packaged)),bytes:buildingBytes.length,sha256:await FloorPlanPackage.digest(buildingBytes)};
   const total=[...entries.values()].reduce((sum,bytes)=>sum+bytes.length,0);
   if(total>319*1024*1024)throw Error('La presentación portable supera el límite de 320 MB; reduce las imágenes o vistas.');
   const levels=sourcePlan.levels.map(level=>({...level,elevationMm:sources.levels.find(l=>l.levelId===level.levelId)?.elevationMm??null,resources:resources.get(level.levelId)||null}));
   const manifest={format:'rubik-sota.presentation-captures',version:2,scope:'building',viewRepresentation:'static-png',buildingId:sourcePlan.buildingId,buildingName:sourcePlan.buildingName,entryId:sourcePlan.entryId,levels,views,portableBuilding};
   const encoded=new TextEncoder().encode(JSON.stringify(manifest,null,2));
   Core.readCaptures(manifest,[...entries.keys()]);
   entries.set('presentation.json',encoded);
   const archive=FloorPlanPackage.zip(entries,{check:buildingBatchPath});
   if(!batchCurrent(serial,sourceEpoch))return;
   const link=document.createElement('a'),url=URL.createObjectURL(archive);link.href=url;link.download='presentacion-edificio.zip';link.click();setTimeout(()=>URL.revokeObjectURL(url),30000);
   const counts=sourcePlan.levels.map(level=>`${level.name}: ${views.filter(v=>v.levelId===level.levelId).length}`).join(' · ');
   batchStatus.textContent=tx(`${views.length} vistas PNG (${counts}) y edificio editable descargados.`,`Downloaded ${views.length} PNG views (${counts}) and editable building.`,`已下载 ${views.length} 个 PNG 视图（${counts}）及可编辑建筑。`);
   toast(batchStatus.textContent,3000);
  }catch(error){if(batchCurrent(serial,sourceEpoch)||active&&sourceEpoch===epoch){batchStatus.textContent=error.message;toast(error.message,6000);}}
  finally{
   await restore();
   if(batchResized&&active&&sourceEpoch===epoch)batchStatus.textContent=tx('Lote cancelado por cambio de tamaño; no se descargó ningún archivo.','Batch cancelled after resize; no file was downloaded.','调整大小后已取消批量；未下载文件。');
   if(batchCancelled&&!batchResized&&active&&sourceEpoch===epoch)batchStatus.textContent=tx('Lote cancelado; no se descargó ningún archivo.','Batch cancelled; no file was downloaded.','批量已取消；未下载文件。');
   if(batchCancelled&&active&&sourceEpoch===epoch)toast(batchStatus.textContent,3000);
   if(serial===batchSerial){batchActive=false;cancelBatchButton.hidden=true;delete overlay.dataset.batch;updateCapture();draw();}
  }
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
    const stopLabel=sourcePlan.stops[i].kind==='room'?roomName(sourcePlan.stops[i].roomId,sourcePlan.stops[i].levelId):tx('Vista general','Overview','总览');
    const camera=View3D.presentationPose(),{shot,bytes}=await pngShot(stopLabel);
    if(!batchCurrent(serial,sourceEpoch))return;
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

 // ── FT3D-1a «Empezar desde el plano» ─────────────────────────────────────────────────────────────────────────────
 // Plan → walls rising → lens opening → the existing overview → the presentation as it was. The narrative state is
 // f(p) (FloorPlanPresentationStory); the slider and the buttons only choose p, so going back is the same path.
 const reducedMotion=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
 function storyOption(parent){
  storyChosen=false;
  const box=el('div',undefined,parent,'presentation-story-option');
  const label=el('label',undefined,box);const input=el('input',undefined,label);input.type='checkbox';input.id='presentationStoryOption';input.checked=false;
  el('span',tx('Empezar desde el plano','Start from the plan','从平面图开始'),label);
  const hint=el('p',tx('Opcional: la presentación abre con el plano y los muros se levantan hasta la vista general 3D. No cambia el proyecto.','Optional: the presentation opens on the plan and the walls rise to the 3D overview. The project does not change.','可选：展示从平面图开始，墙体升起到 3D 总览。项目不变。'),box,'presentation-story-hint');hint.id='presentationStoryHint';
  input.setAttribute('aria-describedby',hint.id);
  input.onchange=()=>{storyChosen=input.checked;};
 }
 // FT3D-3: the option, enabled only when some level has a supported section; unsupported levels say why.
 function sectionOption(parent,levels){
  sectionChosen=false;sectionLevels=new Map();sectionAxis=null;
  const S=window.FloorPlanPresentationSection;if(!S||!window.FloorPlanPresentationStory)return;
  sectionAxis=levels.length>1?S.buildingAxis(levels.map(l=>({project:l.project,geometry:l.geometry,offsetMm:l.offsetMm})))?.axis||null:null;
  for(const l of levels)sectionLevels.set(l.levelId??null,S.derive({project:l.project,geometry:l.geometry},{overviewDirection:OVERVIEW_DIRECTION,axis:sectionAxis||undefined,levelId:l.levelId??null}));
  const supported=[...sectionLevels.values()].filter(d=>d.supported).length;
  const box=el('div',undefined,parent,'presentation-story-option presentation-section-option');box.id='presentationSectionOptionBox';
  const label=el('label',undefined,box);const input=el('input',undefined,label);input.type='checkbox';input.id='presentationSectionOption';input.checked=false;input.disabled=!supported;
  el('span',tx('Incluir sección dinámica','Include dynamic section','包含动态剖面'),label);
  const reasons=levels.length>1?levels.filter(l=>!sectionLevels.get(l.levelId??null)?.supported).map(l=>`«${l.name}»: ${sectionLevels.get(l.levelId??null)?.message}`):[];
  const text=!supported?tx(`No disponible: ${[...sectionLevels.values()][0]?.message||''}`,'Unavailable: no candidate plane crosses the model.','不可用：没有剖切面穿过模型。')
   :tx('Opcional: tras la vista general, un corte vertical del mismo modelo abre la vivienda. Sección visual · derivada del modelo · no es plano de ejecución.','Optional: after the overview, a vertical cut of the same model opens the home. Visual section · derived from the model · not a construction drawing.','可选：总览后，同一模型的竖向剖切展开住宅。可视剖面，非施工图。')+(reasons.length?' '+tx('Se omite en ','Skipped on ','跳过 ')+reasons.join(' · '):'');
  const hint=el('p',text,box,'presentation-story-hint');hint.id='presentationSectionHint';input.setAttribute('aria-describedby',hint.id);
  input.onchange=()=>{sectionChosen=input.checked&&!!supported;};
 }
 const sectionAt=stop=>!!stop&&stop.kind==='overview'&&!!sectionLevels.get(stop.levelId??null)?.supported;
 // FT3D-4: the option, enabled only when the model gives at least one façade with a demonstrable outside; when it does
 // not, the concrete reason. Its selector and the solar choice appear only while the option is on.
 function elevationOption(parent,levels){
  elevationChosen=false;elevationDescriptor=null;elevationCandidateId=null;elevationSolarChosen=false;
  const E=window.FloorPlanPresentationElevation;if(!E||!window.FloorPlanPresentationStory)return;
  const site=app.levelContext?building()?.site:app.project.site;
  elevationDescriptor=E.derive({levels:levels.map(l=>({levelId:l.levelId??null,project:l.project,geometry:l.geometry,offsetMm:l.offsetMm||{x:0,y:0},elevationMm:l.elevationMm||0})),northOffsetDeg:site?.northOffsetDeg});
  const d=elevationDescriptor,supported=!!d.supported;elevationCandidateId=d.defaultId;
  const box=el('div',undefined,parent,'presentation-story-option presentation-elevation-option');box.id='presentationElevationOptionBox';
  const label=el('label',undefined,box);const input=el('input',undefined,label);input.type='checkbox';input.id='presentationElevationOption';input.checked=false;input.disabled=!supported;
  el('span',tx('Incluir alzado/fachada narrativa','Include narrative elevation/façade','包含叙事立面'),label);
  const text=!supported?tx(`No disponible: ${d.message}`,`Unavailable: ${d.reason}`,`不可用：${d.reason}`)
   :tx('Opcional: tras la vista general, la cámara se alinea con una fachada del mismo modelo y abre una perspectiva exterior. Fachada visual · derivada del modelo · no es alzado de ejecución.','Optional: after the overview, the camera faces one façade of the same model and opens an exterior perspective. Visual façade · derived from the model · not a construction elevation.','可选：总览后，相机对准同一模型的一个立面并展开外部透视。可视立面 · 源自模型 · 非施工立面图。')
    +(d.partial?' '+tx('Se usan sólo las fachadas derivables del modelo.','Only façades derivable from the model are used.','仅使用可从模型推导的立面。'):'');
  const hint=el('p',text,box,'presentation-story-hint');hint.id='presentationElevationHint';input.setAttribute('aria-describedby',hint.id);
  if(!supported){input.onchange=null;return;}
  const details=el('div',undefined,box,'presentation-elevation-details');details.id='presentationElevationDetails';details.hidden=true;
  const pickLabel=el('label',undefined,details,'presentation-elevation-pick');el('span',tx('Fachada','Façade','立面'),pickLabel);
  const pick=el('select',undefined,pickLabel);pick.id='presentationElevationFacade';
  for(const c of d.candidates){const op=el('option',c.label+(c.id===d.defaultId?' · '+tx('selección automática','automatic selection','自动选择'):''),pick);op.value=c.id;op.selected=c.id===d.defaultId;}
  pick.onchange=()=>{elevationCandidateId=d.candidates.some(c=>c.id===pick.value)?pick.value:d.defaultId;};
  const solarUi=window.FloorPlanSolarUI,solarNow=solarUi?.result,solarOk=solarNow?.status==='available-orientative';
  const solarLabel=el('label',undefined,details);const solar=el('input',undefined,solarLabel);solar.type='checkbox';solar.id='presentationElevationSolar';solar.checked=false;solar.disabled=!solarOk;
  el('span',tx('Usar solar orientativo actual','Use the current indicative solar','使用当前日照示意'),solarLabel);
  const solarHint=el('p',solarOk?tx(`${solarUi.localDate} · ${solarUi.localTime}. Solar orientativo · no es estudio de soleamiento, certificación ni verificación normativa.`,`${solarUi.localDate} · ${solarUi.localTime}. Indicative solar · not a sunlight study, certification or regulatory verification.`,`${solarUi.localDate} · ${solarUi.localTime}。日照示意 · 不构成日照研究、认证或法规验证。`)
   :tx('No disponible: configura el norte, la ubicación y la hora en «Orientación y solar». La fachada no lo necesita.','Unavailable: set north, location and time in «Orientation and solar». The façade does not need it.','不可用：请在“朝向与日照”中设置北向、位置和时间。立面不依赖它。'),details,'presentation-story-hint');
  solarHint.id='presentationElevationSolarHint';solar.setAttribute('aria-describedby',solarHint.id);
  solar.onchange=()=>{elevationSolarChosen=solar.checked&&solarOk;};
  input.onchange=()=>{elevationChosen=input.checked;details.hidden=!input.checked;};
 }
 const elevationCandidate=()=>elevationDescriptor?.candidates.find(c=>c.id===elevationCandidateId)||elevationDescriptor?.candidates.find(c=>c.id===elevationDescriptor.defaultId)||null;
 const elevationAt=stop=>!!stop&&stop.kind==='overview'&&!!elevationDescriptor?.supported&&!!elevationCandidate();
 // The project of a level shown in the presentation (the minimap draws the chosen façade walls of that level).
 function levelProject(levelId){if(!isBuildingPlan())return app.project;return building()?.presentationSources()?.levels.find(l=>l.levelId===levelId)?.project||null;}
 const elevationView=()=>({candidate:elevationCandidate(),envelope:elevationDescriptor.envelope,solar:elevationSolar?.result||null});
 // ── FT3D-2 story player ──────────────────────────────────────────────────────────────────────────────────────────
 // One player for every narrative: a story is a list of scenes (narratives of FloorPlanPresentationStory) played as a
 // single progress P (FloorPlanPresentationStory.sequence). The chapter of 1a («Empezar desde el plano») and the descent
 // of 1b («Entrar en ‹estancia›») are stories of one scene; «Ver la historia completa» chains them for every level, in
 // the order and with the rooms chosen in the dialog. Scene: {kind, stop: stop index it is built for, from: stop index it
 // starts from (descent)}. Entering a scene ends the previous narrative and begins the next on the same scene graph.
 function storyControls(){
  if(storyUi)return storyUi;
  const panel=el('div',undefined,null,'presentation-story');panel.id='presentationStory';panel.setAttribute('role','group');panel.hidden=true;card.insertBefore(panel,controls);
  const counter=el('p',undefined,panel,'presentation-story-counter');counter.id='presentationStoryCounter';counter.hidden=true;
  const caption=el('p',undefined,panel,'presentation-story-caption');caption.id='presentationStoryCaption';caption.setAttribute('aria-live','polite');
  const slider=el('input',undefined,panel,'presentation-story-slider');slider.type='range';slider.min='0';slider.max='100';slider.step='1';slider.id='presentationStorySlider';
  slider.oninput=()=>{if(!story)return;const P=Number(slider.value)/(story.scenes.length>1?1000:100);pauseStory();seekStory(P);};
  const row=el('div',undefined,panel,'presentation-story-actions');
  // Single scene: back to its start (the plan, or the overview for a descent, which then hands over to that stop).
  // Several scenes: the start of this scene, or of the previous one when already there.
  const planButton=button('',row,()=>{const run=story;if(!run)return;const target=run.scenes.length>1?previousStart(run):0;
   playStory(target).then(done=>{if(done&&run===story&&target<=0&&(run.scenes[0].kind==='room-descent'||(run.scenes.length===1&&['section-open','elevation-open'].includes(run.scenes[0].kind))))finishStory(0);});});planButton.id='presentationStoryPlan';
  const play=button('',row,()=>{if(story?.playing)pauseStory();else if(story?.P>=1)finishStory();
   // Reduced motion with a section or a façade: one explicit step at a time (the open section; the frontal façade, then
   // its exterior perspective), so each state is seen before going on.
   else if(reducedMotion()&&hasSection(story)){const run=story,single=run.scenes.length===1,hold=nextHold(run);if(single&&hold===null)finishStory();else playStory(hold!==null?run.seq.at(run.i,hold):nextStart(run));}
   else playStory(1).then(done=>{if(done)finishStory();});});play.id='presentationStoryPlay';play.classList.add('primary');
  const nextButton=button('',row,()=>{const run=story;if(!run)return;playStory(nextStart(run));});nextButton.id='presentationStoryNext';nextButton.hidden=true;
  const replay=button('',tools,()=>{openStory(epoch,[{kind:'plan-reveal',stop:index}],{from:1,to:0});});replay.id='presentationStoryReplay';replay.hidden=true;
  const enter=button('',tools,()=>{const to=nextRoomIndex();if(to!==null)openStory(epoch,[{kind:'room-descent',stop:to,from:index}],{from:0,to:1});});enter.id='presentationStoryEnter';enter.hidden=true;
  // With reduced motion the story waits at its start, as the 1a chapter: scene buttons and «Reproducir historia» jump.
  const full=button('',tools,()=>{const scenes=fullStory();if(scenes.length>1)openStory(epoch,scenes,{from:0,to:reducedMotion()?null:1});});full.id='presentationStoryFull';full.hidden=true;
  // FT3D-3: only when the section was chosen, so a presentation without it keeps exactly its tools.
  let section=null;if(sectionEnabled){section=button('',tools,()=>{if(sectionAt(plan?.stops[index]))openStory(epoch,[{kind:'section-open',stop:index}],{from:0,to:reducedMotion()?null:1});});section.id='presentationSectionPlay';section.hidden=true;}
  // FT3D-4: likewise only when the façade was chosen; it plays the façade scene on the same player.
  let elevation=null;if(elevationEnabled){elevation=button('',tools,()=>{if(elevationAt(plan?.stops[index]))openStory(epoch,[{kind:'elevation-open',stop:index}],{from:0,to:reducedMotion()?null:1});});elevation.id='presentationElevationPlay';elevation.hidden=true;}
  storyUi={panel,counter,caption,slider,planButton,play,nextButton,replay,enter,full,section,elevation};return storyUi;
 }
 // FT3D-1b: the room after an overview on the same level, the one «Siguiente →» would go to.
 function nextRoomIndex(){const a=plan?.stops[index],b=plan?.stops[index+1];return a?.kind==='overview'&&b?.kind==='room'&&b.levelId===a.levelId?index+1:null;}
 // FT3D-2: the whole presentation as one story — for each level, its plan rising to its overview, then the descent into
 // its first chosen room. Derived from the presentation plan, so the dialog's order and selection edit it.
 function fullStory(){const scenes=[];let facade=false;plan?.stops.forEach((s,i)=>{if(s.kind!=='overview')return;scenes.push({kind:'plan-reveal',stop:i});if(sectionEnabled&&sectionAt(s))scenes.push({kind:'section-open',stop:i});
  // FT3D-4: the façade belongs to the whole building, so it is read once, at the first overview that can show it.
  if(elevationEnabled&&!facade&&elevationAt(s)){scenes.push({kind:'elevation-open',stop:i});facade=true;}const r=plan.stops[i+1];if(r?.kind==='room'&&r.levelId===s.levelId)scenes.push({kind:'room-descent',stop:i+1,from:i});});return scenes;}
 const sceneEnd=sc=>sc.stop,sceneHome=sc=>sc.kind==='room-descent'?sc.from:sc.stop;
 function previousStart(run){const here=run.seq.at(run.i,0);return run.P-here>.004?here:run.seq.at(Math.max(0,run.i-1),0);}
 // Reduced motion lands on the open section (its held state) instead of its untouched start (FT3D-3 §10).
 const sectionHold=()=>FloorPlanPresentationStory.SECTION_OPEN.reducedHold;
 // FT3D-4: reduced motion shows the façade in discrete states: frontal, then exterior perspective, then the overview.
 const elevationHolds=()=>{const o=FloorPlanPresentationStory.ELEVATION_OPEN;return [o.reducedFront,o.reducedPersp];};
 const holdsOf=kind=>kind==='section-open'?[sectionHold()]:kind==='elevation-open'?elevationHolds():[];
 function nextStart(run){if(run.i+1>=run.scenes.length)return 1;const k=run.scenes[run.i+1].kind;return run.seq.at(run.i+1,reducedMotion()&&holdsOf(k).length?holdsOf(k)[0]:0);}
 // The next held state of the current scene after its local p (null when none is left).
 function nextHold(run){const h=holdsOf(run.scenes[run.i]?.kind).find(v=>v>run.p+1e-6);return h===undefined?null:h;}
 const hasSection=run=>run.scenes.some(sc=>sc.kind==='section-open'||sc.kind==='elevation-open');
 function drawStory(){
  if(!storyUi)return;
  const u=storyUi,on=!!story;
  u.replay.textContent=tx('Volver al plano','Back to the plan','回到平面图');
  u.replay.hidden=!storyEnabled||on||!plan||plan.stops[index]?.kind!=='overview';
  u.replay.disabled=batchActive||overlay.dataset.moving==='true'||window.View3D?.presentationRouteInfo?.status==='running';
  const nextRoom=nextRoomIndex();
  u.enter.hidden=u.replay.hidden||nextRoom===null;u.enter.disabled=u.replay.disabled;
  if(nextRoom!==null)u.enter.textContent=tx(`Entrar en ${roomName(plan.stops[nextRoom].roomId,plan.stops[nextRoom].levelId)}`,`Enter ${roomName(plan.stops[nextRoom].roomId,plan.stops[nextRoom].levelId)}`,`进入 ${roomName(plan.stops[nextRoom].roomId,plan.stops[nextRoom].levelId)}`);
  u.full.textContent=tx('Ver la historia completa','Play the whole story','播放完整故事');u.full.hidden=u.replay.hidden||fullStory().length<2;u.full.disabled=u.replay.disabled;
  if(u.section){u.section.textContent=tx('Ver sección dinámica','See dynamic section','查看动态剖面');u.section.hidden=!sectionEnabled||on||!plan||!sectionAt(plan.stops[index]);u.section.disabled=batchActive||overlay.dataset.moving==='true'||window.View3D?.presentationRouteInfo?.status==='running';}
  if(u.elevation){u.elevation.textContent=tx('Ver fachada','See the façade','查看立面');u.elevation.hidden=!elevationEnabled||on||!plan||!elevationAt(plan.stops[index]);u.elevation.disabled=batchActive||overlay.dataset.moving==='true'||window.View3D?.presentationRouteInfo?.status==='running';}
  u.panel.hidden=!on;if(!on)return;
  const multi=story.scenes.length>1,sc=story.scenes[story.i],p=story.p;
  u.counter.hidden=!multi;u.nextButton.hidden=!multi;
  if(multi){const lvl=isBuildingPlan()?` · ${plan.stops[sc.stop].levelName}`:'';u.counter.textContent=tx(`Historia · escena ${story.i+1} de ${story.scenes.length}${lvl}`,`Story · scene ${story.i+1} of ${story.scenes.length}${lvl}`,`故事 · 第 ${story.i+1} / ${story.scenes.length} 幕${lvl}`);}
  let caption;
  if(sc.kind==='section-open'){const phase=View3D.presentationStoryInfo?.phase,base=tx('Sección visual · derivada del modelo · no es plano de ejecución','Visual section · derived from the model · not a construction drawing','可视剖面 · 源自模型 · 非施工图');
   caption=p<=0?tx('Vista general 3D','3D overview','3D 总览'):(phase==='cut'?tx('El corte entra en el mismo modelo','The cut enters the same model','剖切进入同一模型'):phase==='front'?tx('Sección frontal','Front section','正面剖面'):phase==='open'?tx('Abrimos perspectiva para leer los espacios detrás del corte','We open the perspective to read the spaces behind the cut','打开透视以查看剖切后的空间'):tx('Vista general seccionada','Sectioned overview','剖切总览'))+' — '+base;
   if(!multi){u.panel.setAttribute('aria-label',tx('Sección dinámica','Dynamic section','动态剖面'));u.slider.setAttribute('aria-label',tx('De la vista general (0) a la sección abierta (100)','From the overview (0) to the open section (100)','从总览 (0) 到剖面 (100)'));
    u.planButton.textContent=tx('Volver a la vista general','Back to the overview','回到总览');u.planButton.disabled=story.playing||p<=0;
    u.play.textContent=story.playing?tx('Pausa','Pause','暂停'):p>=1||(reducedMotion()&&p>=sectionHold())?tx('Continuar presentación','Continue presentation','继续展示'):tx('Ver sección','See the section','查看剖面');}}
  else if(sc.kind==='elevation-open'){const info=View3D.presentationStoryInfo,phase=p<=0||p>=1?'overview':info?.phase,c=elevationCandidate();
   const base=tx('Fachada visual · derivada del modelo · no es alzado de ejecución','Visual façade · derived from the model · not a construction elevation','可视立面 · 源自模型 · 非施工立面图');
   const name=c?(c.cardinal?tx(`${c.label} · orientación derivada del proyecto`,`${c.label.replace('Fachada','Façade')} · orientation derived from the project`,`${c.label} · 朝向源自项目`):tx(c.label,c.label.replace('Fachada','Façade'),c.label)):'';
   const solarOn=!!info?.solar&&!!elevationSolar;
   const text=phase==='align'?tx('Nos alineamos con la fachada','Facing the façade','对准立面'):phase==='front'?tx('Fachada frontal','Frontal façade','正立面'):phase==='light'?(solarOn?tx('Luz solar orientativa sobre la fachada','Indicative sunlight on the façade','立面上的日照示意'):tx('Materiales y huecos de la fachada','Façade materials and openings','立面材质与洞口')):phase==='perspective'?tx('Abrimos la perspectiva exterior','Opening the exterior perspective','展开外部透视'):phase==='exterior'?tx('Perspectiva exterior','Exterior perspective','外部透视'):phase==='return'?tx('Volvemos a la vista general','Back to the overview','回到总览'):tx('Vista general 3D','3D overview','3D 总览');
   caption=`${text} — ${name} — ${base}`+(solarOn?' — '+tx(`Solar orientativo ${elevationSolar.localDate} ${elevationSolar.localTime} · no es estudio de soleamiento, certificación ni verificación normativa.`,`Indicative solar ${elevationSolar.localDate} ${elevationSolar.localTime} · not a sunlight study, certification or regulatory verification.`,`日照示意 ${elevationSolar.localDate} ${elevationSolar.localTime} · 不构成日照研究、认证或法规验证。`):'');
   if(!multi){u.panel.setAttribute('aria-label',tx('Fachada visual','Visual façade','可视立面'));u.slider.setAttribute('aria-label',tx('De la vista general (0) a la fachada y de vuelta (100)','From the overview (0) to the façade and back (100)','从总览 (0) 到立面再返回 (100)'));
    u.planButton.textContent=tx('Volver a la vista general','Back to the overview','回到总览');u.planButton.disabled=story.playing||p<=0;
    u.play.textContent=story.playing?tx('Pausa','Pause','暂停'):p>=1||(reducedMotion()&&nextHold(story)===null&&p>0)?tx('Continuar presentación','Continue presentation','继续展示'):tx('Ver fachada','See the façade','查看立面');}}
  else if(sc.kind==='room-descent'){const t=plan.stops[sc.stop],name=roomName(t.roomId,t.levelId);caption=p<=0?tx('Vista general 3D','3D overview','3D 总览'):p>=1?name:tx(`Bajando a ${name}`,`Going down to ${name}`,`下降到 ${name}`);
   if(!multi){u.panel.setAttribute('aria-label',tx(`Entrar en ${name}`,`Enter ${name}`,`进入 ${name}`));u.slider.setAttribute('aria-label',tx(`De la vista general (0) a ${name} (100)`,`From the overview (0) to ${name} (100)`,`从总览 (0) 到 ${name} (100)`));
    u.planButton.textContent=tx('Volver a la vista general','Back to the overview','回到总览');u.planButton.disabled=story.playing;
    u.play.textContent=story.playing?tx('Pausa','Pause','暂停'):p>=1?tx('Continuar presentación','Continue presentation','继续展示'):tx(`Entrar en ${name}`,`Enter ${name}`,`进入 ${name}`);}}
  else{const phase=p<=0?'plan':p>=1?'3d':View3D.presentationStoryInfo?.phase;
   caption=phase==='plan'?tx('Plano de la vivienda','Plan of the home','住宅平面图'):phase==='3d'?tx('Vista general 3D','3D overview','3D 总览'):phase==='walls'?tx('Los muros se levantan desde el plano','Walls rise from the plan','墙体从平面图升起'):tx('La vista se abre en 3D','The view opens in 3D','视图展开为 3D');
   if(!multi){u.panel.setAttribute('aria-label',tx('Desde el plano','From the plan','从平面图'));u.slider.setAttribute('aria-label',tx('Del plano (0) a la vista 3D (100)','From plan (0) to 3D view (100)','从平面图 (0) 到 3D 视图 (100)'));
    u.planButton.textContent=tx('Ver el plano','Show the plan','查看平面图');u.planButton.disabled=story.playing||p<=0;
    u.play.textContent=story.playing?tx('Pausa','Pause','暂停'):p>=1?tx('Continuar presentación','Continue presentation','继续展示'):tx('Ver en 3D','See in 3D','查看 3D');}}
  u.caption.textContent=caption;
  if(multi){u.panel.setAttribute('aria-label',tx('Historia completa','Whole story','完整故事'));u.slider.max='1000';u.slider.value=String(Math.round(story.P*1000));
   u.slider.setAttribute('aria-label',tx('Progreso de la historia, del plano a la última estancia','Story progress, from the plan to the last room','故事进度'));
   u.planButton.textContent=tx('← Escena anterior','← Previous scene','← 上一幕');u.planButton.disabled=story.playing||story.busy||story.P<=0;
   u.nextButton.textContent=tx('Escena siguiente →','Next scene →','下一幕 →');u.nextButton.disabled=story.playing||story.busy||story.P>=1;
   u.play.textContent=story.playing?tx('Pausa','Pause','暂停'):story.P>=1?tx('Continuar presentación','Continue presentation','继续展示'):story.P<=0?tx('Reproducir historia','Play the story','播放故事'):tx('Seguir','Resume','继续');}
  else{u.slider.max='100';u.slider.value=String(Math.round(p*100));}
  u.slider.setAttribute('aria-valuetext',`${Math.round(story.P*100)} % · ${caption}`);
  u.panel.dataset.scene=sc.kind;
  if(sc.kind==='section-open'||sc.kind==='elevation-open'||u.panel.dataset.sectionMap)renderMinimap();
 }
 // Builds a scene on the scene graph: the card is measured as its stops show it (so its ends are the poses go() frames),
 // the previous narrative ends, the level of the scene is shown, and the narrative begins at local p.
 async function enterScene(run,i){
  const sc=run.scenes[i],levelId=plan.stops[sc.stop].levelId;
  if(activeLevelId()!==levelId){window.View3D?.presentationStoryEnd?.({keepPose:true});await showLevel(levelId);}
  if(story!==run||!active)return false;
  const saved=story;story=null;
  index=sceneEnd(sc);draw();const region=viewRegion();
  let fromRegion=null;if(sc.kind==='room-descent'){index=sc.from;draw();fromRegion=viewRegion();}
  index=sceneHome(sc);story=saved;story.i=i;draw();
  View3D.presentationStoryBegin(plan.stops[sc.stop],{region,startRegion:viewRegion(),...(sc.kind==='room-descent'&&run.scenes.length>1?{fromStop:plan.stops[sc.from],fromRegion}:{}),...(sc.kind==='section-open'&&sectionAxis?{sectionAxis}:{}),...(sc.kind==='elevation-open'?{elevation:elevationView()}:{})},sc.kind);
  sc.ms=View3D.presentationStoryInfo?.info?.playMs||FloorPlanPresentationStory.SCENE_MS[sc.kind];
  return true;
 }
 // Applies a global progress: within the current scene it is immediate; another scene is entered first.
 async function seekStory(P){
  const run=story;if(!run)return false;const loc=run.seq.locate(P);
  if(loc.i!==run.i){if(run.busy)return false;run.busy=true;drawStory();try{if(!await enterScene(run,loc.i))return false;}finally{run.busy=false;}if(story!==run)return false;}
  run.P=Math.min(1,Math.max(0,P));run.p=loc.p;View3D.presentationStoryApply(run.p);drawStory();return true;
 }
 function setStory(P){const run=story;if(!run)return;const loc=run.seq.locate(P);if(loc.i!==run.i){seekStory(P);return;}run.P=Math.min(1,Math.max(0,P));run.p=loc.p;View3D.presentationStoryApply(run.p);drawStory();}
 function pauseStory(){if(!story?.playing)return;cancelAnimationFrame(story.raf);story.playing=false;const done=story.resolve;story.resolve=null;done?.(false);drawStory();}
 // Plays P linearly in time (the easing is in each narrative); reduced motion goes straight to the target state.
 function playStory(target){
  if(!story)return Promise.resolve(false);
  pauseStory();
  const run=story,from=run.P,total=run.scenes.length>1?run.scenes.reduce((n,sc)=>n+(sc.ms||FloorPlanPresentationStory.SCENE_MS[sc.kind]),0):(run.scenes[0].ms||6000);
  const ms=FloorPlanPresentationStory.playMs(from,target,{reduced:reducedMotion(),fullMs:total});
  if(!ms)return seekStory(target).then(()=>story===run);
  run.playing=true;drawStory();
  return new Promise(resolve=>{let began=performance.now(),paused=0;run.resolve=resolve;
   const tick=async now=>{if(story!==run||!run.playing)return;const t=Math.min(1,(now-began-paused)/ms),P=from+(target-from)*t;
    // Entering another scene (a level change may take a while) does not eat play time.
    if(run.seq.locate(P).i!==run.i){const t0=performance.now();await seekStory(P);paused+=performance.now()-t0;if(story!==run||!run.playing)return;}else setStory(P);
    if(t<1){run.raf=requestAnimationFrame(tick);return;}
    run.playing=false;run.resolve=null;drawStory();resolve(true);};
   run.raf=requestAnimationFrame(tick);});
 }
 async function openStory(token,scenes,{from=0,to=null}={}){
  if(!active||batchActive||token!==epoch||plan.stops[index]?.kind!=='overview'||!scenes?.length)return;
  if(scenes.some(sc=>plan.stops[sc.stop]?.kind!==(sc.kind==='room-descent'?'room':'overview')||(sc.kind==='section-open'&&!sectionAt(plan.stops[sc.stop]))||(sc.kind==='elevation-open'&&!elevationAt(plan.stops[sc.stop]))))return;
  closeStory();
  View3D.clearPresentationReveal?.();View3D.clearPresentationRoute?.();routeStatus.hidden=true;routeStatus.textContent='';delete overlay.dataset.route;
  ++movement;
  const seq=FloorPlanPresentationStory.sequence(scenes.map(sc=>FloorPlanPresentationStory.SCENE_MS[sc.kind]));
  const start=seq.locate(from);
  try{await showLevel(plan.stops[scenes[start.i].stop].levelId);}catch(error){status.textContent=error.message;return;}
  if(!active||token!==epoch)return;
  storyControls();overlay.dataset.moving='false';
  const run={scenes:scenes.map(sc=>({...sc})),seq,i:-1,p:from,P:from,playing:false,raf:0,resolve:null,busy:false};story=run;
  try{await enterScene(run,start.i);if(story!==run)return;run.p=start.p;run.P=Math.min(1,Math.max(0,from));View3D.presentationStoryApply(run.p);drawStory();}
  catch(error){story=null;drawStory();toast(error.message||String(error),6000);await go(index,token);return;}
  draw();updateCapture();
  if(to!==null){const done=await playStory(to);if(done&&to>=1&&story===run)await finishStory();}
 }
 // Resize: the same P on the scene rebuilt for the new screen. A single descent that started from the camera of the
 // moment (1b) settles on the nearer of its two stops, as before.
 function restartStory(){if(!story)return;const run=story,P=run.P;pauseStory();
  if(run.scenes.length===1&&run.scenes[0].kind==='room-descent'){const sc=run.scenes[0],to=P>=.5?sc.stop:sc.from;closeStory();go(to);return;}
  requestAnimationFrame(async()=>{if(story!==run||!active)return;try{await enterScene(run,run.i);if(story===run)setStory(P);}catch{closeStory();go(index);}});}
 // The ends of a story are presentation stops (the last scene's stop; for a story that starts with a descent, its
 // overview too): the narrative ends there and the presentation continues from the same view. P = 0 of a plan is not a
 // stop: the story stays on the plan.
 async function finishStory(at=1){const run=story;if(!run)return;
  // A story that starts with a descent or a section starts on an overview stop: going back to 0 hands over there.
  const to=at>=1?sceneEnd(run.scenes.at(-1)):run.scenes[0].kind==='room-descent'?run.scenes[0].from:['section-open','elevation-open'].includes(run.scenes[0].kind)?run.scenes[0].stop:null;if(to===null)return;
  await seekStory(at);if(story!==run)return;closeStory();await go(to);}
 // The chapter's controls leave with the presentation: the next one starts as if the chapter never existed.
 function disposeStory(){storyEnabled=false;sectionEnabled=false;elevationEnabled=false;elevationSolar=null;if(storyUi){storyUi.panel.remove();storyUi.replay.remove();storyUi.enter.remove();storyUi.full.remove();storyUi.section?.remove();storyUi.elevation?.remove();storyUi=null;}}
 function closeStory(){clearFacadeMarks();if(!story)return;pauseStory();story=null;window.View3D?.presentationStoryEnd?.({keepPose:true});drawStory();updateCapture();}
 function draw(){
  territoryButton.hidden=!(window.FloorPlanBuildingUI?.site||app.project.site)?.buildingPlacement;
  headerButton.textContent=tx('Presentar mi vivienda','Present my home','展示我的住宅');
  closeButton.textContent=tx('Volver a editar','Return to editor','返回编辑');
  tools.setAttribute('aria-label',tx('Herramientas de la presentación','Presentation tools','演示工具'));previous.textContent=tx('← Anterior','← Previous','← 上一个');next.textContent=tx('Siguiente →','Next →','下一个 →');
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
  drawStory();
  if(!plan)return;
  const stop=plan.stops[index];title.textContent=stop.kind==='room'?roomName(stop.roomId,stop.levelId):tx('Vista general','Overview','总览');title.title=title.textContent;
  window.FloorPlanBrandUI?.decorate(card,brandSnap,{index,count:plan.stops.length,kind:stop.kind});
  // Building: the level of every view is named; the first view of a level says that the level changes.
  levelLine.hidden=!isBuildingPlan();
  if(isBuildingPlan()){
   const position=plan.levels.findIndex(l=>l.levelId===stop.levelId)+1,changed=index>0&&plan.stops[index-1].levelId!==stop.levelId;
   levelLine.textContent=changed?tx(`Cambio de planta: «${stop.levelName}» · planta ${position} de ${plan.levels.length}`,`Level change: «${stop.levelName}» · level ${position} of ${plan.levels.length}`,`切换楼层：«${stop.levelName}»（${position} / ${plan.levels.length}）`)
    :tx(`«${stop.levelName}» · planta ${position} de ${plan.levels.length}`,`«${stop.levelName}» · level ${position} of ${plan.levels.length}`,`«${stop.levelName}»（${position} / ${plan.levels.length}）`);
   levelLine.classList.toggle('changed',changed);levelLine.dataset.level=stop.levelId;
  }
  status.textContent=tx(`Vista ${index+1} de ${plan.stops.length}`,`View ${index+1} of ${plan.stops.length}`,`视图 ${index+1} / ${plan.stops.length}`);
  progress.textContent=tx(`Recorrido: ${visited.size} de ${plan.stops.length} vistas visitadas`,`Tour: ${visited.size} of ${plan.stops.length} views visited`,`参观：已访问 ${visited.size} / ${plan.stops.length} 个视图`);
  const framed=stop.kind==='room'?window.View3D?.presentationFrameInfo:null,section=framed?.roomId===stop.roomId&&framed.section;
  info.textContent=stop.kind==='room'?tx(`Superficie aproximada ${stop.areaM2.toFixed(2)} m² · medidas orientativas`,`Approximate area ${stop.areaM2.toFixed(2)} m² · indicative dimensions`,`约 ${stop.areaM2.toFixed(2)} 平方米 · 仅供参考`):
   isBuildingPlan()?tx(`Vista general de «${stop.levelName}» · ${stop.areaM2.toFixed(2)} m² aproximados`,`Overview of «${stop.levelName}» · approx. ${stop.areaM2.toFixed(2)} m²`,`«${stop.levelName}» 总览`):tx('Vista general del proyecto actual','Overview of the current project','当前项目总览');
  sectionNote.hidden=!section;sectionNote.textContent=section?tx(`Vista seccionada: muros a ${framed.wallTop.toFixed(1).replace('.',',')} m para ver la estancia; el proyecto no cambia.`,`Section view: walls cut at ${framed.wallTop.toFixed(1)} m to show the room; the project is unchanged.`,`剖切视图：墙体在 ${framed.wallTop.toFixed(1)} 米处剖切以显示整个房间。项目不变。`):'';
  // A control that gets disabled or rebuilt here may hold the focus: it is kept on the presentation (below).
  const focused=document.activeElement,focusOnStop=stops.contains(focused);
  previous.disabled=index===0;next.disabled=index===plan.stops.length-1;
  previous.disabled ||=batchActive;next.disabled ||=batchActive;
  updateCapture();
  stops.replaceChildren();
  plan.stops.forEach((item,i)=>{
   // Building: a level heading before the first view of each level; equal room names stay apart by level.
   if(isBuildingPlan()&&(i===0||plan.stops[i-1].levelId!==item.levelId)){const head=el('span',item.levelName,stops,'presentation-stops-level');head.dataset.level=item.levelId;}
   const text=item.kind==='room'?roomName(item.roomId,item.levelId):tx('Vista general','Overview','总览');
   const b=button(text,stops,()=>go(i));b.classList.toggle('on',i===index);b.disabled=batchActive;b.setAttribute('aria-current',i===index?'step':'false');
   if(isBuildingPlan()){b.dataset.level=item.levelId;b.setAttribute('aria-label',`${text} · ${item.levelName}`);}
  });
  // At the last (first) view «Siguiente» («Anterior») is disabled and the stop buttons are new: the focus goes to the
  // other arrow or to the active stop, never to the page, so the keyboard keeps its place in the presentation.
  // During a batch every control is disabled on purpose and the batch owns the focus: nothing moves then.
  if(!batchActive&&((focused===next&&next.disabled)||(focused===previous&&previous.disabled)||(focusOnStop&&!stops.contains(document.activeElement)))){
   const other=focused===next?previous:focused===previous?next:null,active=stops.querySelectorAll('button')[index];
   (other&&!other.disabled?other:active&&!active.disabled?active:closeButton).focus({preventScroll:true});
  }
  // Single-row stops scroll sideways to the active one; scrollIntoView would also scroll the card vertically
  // and push its close button out of the viewport.
  const current=stops.querySelectorAll('button')[index];
  if(current&&matchMedia('(max-height: 500px), (max-width: 600px)').matches){
   if(stops.scrollWidth>stops.clientWidth){const left=current.getBoundingClientRect().left-stops.getBoundingClientRect().left+stops.scrollLeft,right=left+current.offsetWidth;if(left<stops.scrollLeft)stops.scrollLeft=left;else if(right>stops.scrollLeft+stops.clientWidth)stops.scrollLeft=right-stops.clientWidth;}
   // A short card scrolls by itself (its header with the close button is sticky): bring the stops row into it.
   // Kept in view as the card content changes, but never during a batch, whose controls must stay put.
   if(!batchActive&&matchMedia('(max-height: 500px)').matches&&card.scrollHeight>card.clientHeight){const c=card.getBoundingClientRect(),r=stops.getBoundingClientRect();if(r.bottom>c.bottom)card.scrollTop+=r.bottom-c.bottom+4;}
  }
  if(active&&overlay.dataset.moving!=='true')renderMinimap();
 }
 // «Del plano a la vivienda»: what came from the plan, what was drawn in Rubik and what the client will see, read from
 // the project (FloorPlanProvenance); one block per level in a building. Collapsed: one line stays visible.
 function provenance(parent,levels){
  const P=window.FloorPlanProvenance;if(!P)return;
  const box=el('details',undefined,parent,'presentation-provenance');box.id='presentationProvenance';
  const lang=typeof LANG==='string'?LANG:'es',summaries=levels.map(l=>({name:l.name,s:P.summarize(l.project,{levelName:l.name})}));
  const first=P.lines(summaries[0].s,lang);el('summary',tx('Del plano a la vivienda','From plan to home','从平面图到住宅')+' · '+first[0]+(levels.length>1?tx(` · ${levels.length} plantas`,` · ${levels.length} levels`,` · ${levels.length} 层`):''),box);
  for(const {name,s} of summaries){if(levels.length>1)el('h3',name,box);const ul=el('ul',undefined,box);for(const line of P.lines(s,lang))el('li',line,ul);}
  el('p',P.T.experience[{es:0,en:1,zh:2}[lang]??0],box,'presentation-provenance-note');
 }
 function open(){
  if(active||pendingStart){closeButton.focus();return;}
  // A building with a pending distribution is not presented as a finished proposal (see FloorPlanBuildingUI.gate).
  if(window.FloorPlanBuildingUI&&!window.FloorPlanBuildingUI.gate('Presentar mi vivienda'))return;
  returnFocus=document.activeElement;
  config.replaceChildren();buildingConfig=null;roomList=null;
  const heading=el('h2',tx('Presentar mi vivienda','Present my home','展示我的住宅'),config);heading.id='presentationConfigTitle';
  // A building of two levels is presented as a whole: rooms chosen per level, one presentation and one batch.
  const sources=app.levelContext?.levels>1?building()?.presentationSources():null;
  if(sources&&sources.levels.length<=Core.MAX_LEVELS&&openBuilding(sources)){config.showModal();(config.querySelector('input')||config.querySelector('button'))?.focus();return;}
  const possible=Core.create(app.project,app.geometry,app.entryId,FloorPlanGuide.revision(app.project));
  if(!possible){
   el('p',tx('Primero crea una estancia con muros en Distribuir. El proyecto actual se conserva.','Create a room with walls in Layout first. The current project is kept.','请先在布局中创建带墙的房间。当前项目会保留。'),config);
   const row=el('div',undefined,config,'presentation-config-actions');button(tx('Ir a Distribuir','Go to Layout','前往布局'),row,()=>{config.close();FloorPlanGuideUI?.openDetails('geometry');});
   button(tx('Cancelar','Cancel','取消'),row,()=>config.close());
  }else{
   el('p',tx('Vista general y estancias elegidas. La presentación no cambia el proyecto ni tu objetivo.','Overview and chosen rooms. The presentation does not change your project or goal.','总览和选定房间。展示不会更改项目或目标。'),config);
   provenance(config,[{name:app.project.name,project:app.project}]);
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
   storyOption(config);
   sectionOption(config,[{levelId:activeLevelId(),name:app.project.name,project:app.project,geometry:app.geometry}]);
   elevationOption(config,[{levelId:activeLevelId(),project:app.project,geometry:app.geometry}]);
   window.FloorPlanBrandUI?.configFields(config);
   const row=el('div',undefined,config,'presentation-config-actions');startButton=button(tx('Iniciar presentación','Start presentation','开始展示'),row,()=>{pendingStart=start();pendingStart.finally(()=>{pendingStart=null;});});
   button(tx('Cancelar','Cancel','取消'),row,()=>config.close());
   renderConfig();
  }
  config.showModal();
  (config.querySelector('input')||config.querySelector('button'))?.focus();
 }
 // Building configuration: one group per level with its valid rooms, the selection saved per level (same local
 // sidecar as a single-level presentation of that level). Returns false when no level has a room to present.
 function openBuilding(sources){
  const levels=[...sources.levels].sort((a,b)=>a.order-b.order);
  buildingConfig=levels.map(level=>{
   const valid=level.geometry.rooms.filter(r=>r.poly.length>=3&&Core.area(r.poly)>0);
   const presentable=valid.length&&level.project.walls.some(w=>w.status!=='demolished');
   let saved=null,corrupt=false;
   try{const raw=localStorage.getItem(Core.key(app.entryId,level.project.id));if(raw!==null){saved=JSON.parse(raw);if(saved===null)corrupt=true;}}catch{corrupt=true;}
   const result=presentable?Core.reconcile(saved,level.project,level.geometry,app.entryId,level.revision):{selected:[],changed:false,missing:0,invalid:false};
   return {levelId:level.levelId,name:level.name,presentable,selected:result.selected,roomOrder:[...result.selected,...valid.map(r=>r.id).filter(id=>!result.selected.includes(id))],
    project:level.project,names:new Map(valid.map(r=>[r.id,roomDisplay(level.project.rooms.find(room=>room.id===r.id))])),message:corrupt||result.invalid?'invalid':result.changed?'changed':null};
  });
  if(!buildingConfig.some(level=>level.presentable)){buildingConfig=null;return false;}
  const note=el('p',tx(`Presentación del edificio «${sources.building.name}»: las estancias elegidas de sus ${levels.length} plantas, en una sola presentación y un solo lote. Cada planta empieza con su vista general; la escalera no se recorre.`,`Building presentation «${sources.building.name}»: the chosen rooms of its ${levels.length} levels in one presentation and one batch. Each level starts with its overview; the stair is not walked.`,`建筑展示：«${sources.building.name}»。`),config,'presentation-level-note');note.id='presentationLevelNote';
  provenance(config,levels.map(l=>({name:l.name,project:l.project})));
  configMessage=el('p',undefined,config,'presentation-config-message');configMessage.setAttribute('role','status');
  configMessage.textContent=buildingConfig.some(l=>l.message==='invalid')?tx('La configuración guardada no se pudo leer. Elige de nuevo las estancias.','Saved configuration could not be read. Choose rooms again.','无法读取已保存配置。请重新选择房间。')
   :buildingConfig.some(l=>l.message==='changed')?tx('El plano cambió. Revisa la selección de cada planta.','The layout changed. Review the selection of each level.','布局已更改。请检查各楼层的选择。')
   :tx('Selecciona y ordena las estancias de cada planta. Las plantas se presentan en orden, de abajo arriba.','Select and order the rooms of each level. Levels are presented from the bottom up.','选择并排序各楼层的房间。');
  roomList=el('div',undefined,config,'presentation-room-list');roomList.setAttribute('role','group');roomList.setAttribute('aria-label',tx('Estancias por planta','Rooms by level','按楼层的房间'));
  storyOption(config);
  sectionOption(config,levels.map(l=>({levelId:l.levelId,name:l.name,project:l.project,geometry:l.geometry,offsetMm:l.offsetMm})));
  elevationOption(config,levels.map(l=>({levelId:l.levelId,project:l.project,geometry:l.geometry,offsetMm:l.offsetMm,elevationMm:l.elevationMm})));
  window.FloorPlanBrandUI?.configFields(config);
  const row=el('div',undefined,config,'presentation-config-actions');startButton=button(tx('Iniciar presentación','Start presentation','开始展示'),row,()=>{pendingStart=start();pendingStart.finally(()=>{pendingStart=null;});});
  button(tx('Cancelar','Cancel','取消'),row,()=>config.close());
  renderConfig();return true;
 }
 function renderBuildingConfig(){
  roomList.replaceChildren();
  for(const level of buildingConfig){
   const group=el('fieldset',undefined,roomList,'presentation-level-group');group.dataset.level=level.levelId;el('legend',level.name,group);
   if(!level.presentable){el('p',tx('Sin estancias con muros: esta planta no se incluye.','No rooms with walls: this level is not included.','没有带墙的房间：不包含此楼层。'),group,'presentation-level-empty');continue;}
   level.roomOrder.forEach((id,i)=>{
    const row=el('div',undefined,group,'presentation-room-row'),name=level.names.get(id)||id;
    const label=el('label',undefined,row);const input=el('input',undefined,label);input.type='checkbox';input.value=id;input.dataset.level=level.levelId;input.checked=level.selected.includes(id);
    input.onchange=()=>{level.selected=input.checked?[...level.selected,id]:level.selected.filter(x=>x!==id);startButton.disabled=!buildingConfig.some(l=>l.selected.length);};
    el('span',name,label);
    const move=delta=>{const j=i+delta;if(j<0||j>=level.roomOrder.length)return;[level.roomOrder[i],level.roomOrder[j]]=[level.roomOrder[j],level.roomOrder[i]];renderConfig();roomList.querySelector(`fieldset[data-level="${CSS.escape(level.levelId)}"]`)?.querySelectorAll('.presentation-room-row')[j]?.querySelector(delta<0?'button:first-of-type':'button:last-of-type')?.focus();};
    const up=button('↑',row,()=>move(-1)),down=button('↓',row,()=>move(1));
    up.setAttribute('aria-label',tx(`Subir ${name} (${level.name})`,`Move ${name} up (${level.name})`,`上移 ${name}`));
    down.setAttribute('aria-label',tx(`Bajar ${name} (${level.name})`,`Move ${name} down (${level.name})`,`下移 ${name}`));
    up.disabled=i===0;down.disabled=i===level.roomOrder.length-1;
   });
  }
  startButton.disabled=!buildingConfig.some(l=>l.selected.length);
 }
 function renderConfig(){
  if(!roomList)return;
  if(buildingConfig){renderBuildingConfig();return;}
  roomList.replaceChildren();
  const names=new Map(app.geometry.rooms.map(r=>[r.id,roomName(r.id)]));
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
  brandSnap=window.FloorPlanBrandUI?.snapshot()||null;
  if(buildingConfig){
   const sources=building().presentationSources();
   const selection=buildingConfig.flatMap(level=>level.roomOrder.filter(id=>level.selected.includes(id)).map(roomId=>({levelId:level.levelId,roomId})));
   plan=sources&&Core.createBuilding(sources.building,sources.levels,app.entryId,selection);
   if(!plan){config.close();return;}
   startLevelId=sources.activeLevelId;
   try{for(const level of plan.levels)localStorage.setItem(Core.key(plan.entryId,level.projectId),JSON.stringify(Core.sidecar(level.projectId,plan.entryId,level.revision,selection.filter(s=>s.levelId===level.levelId).map(s=>s.roomId))));}
   catch{toast(tx('No se pudo guardar la configuración local de presentación.','Could not save the local presentation configuration.','无法保存本地展示配置。'),5000);}
  }else{
  const selected=roomOrder.filter(id=>selectedRooms.includes(id));
  plan=Core.create(app.project,app.geometry,app.entryId,FloorPlanGuide.revision(app.project),selected);
  if(!plan){config.close();return;}
  try{localStorage.setItem(Core.key(plan.entryId,plan.projectId),JSON.stringify(Core.sidecar(plan.projectId,plan.entryId,plan.revision,selected)));}
  catch{toast(tx('No se pudo guardar la configuración local de presentación.','Could not save the local presentation configuration.','无法保存本地展示配置。'),5000);}
  }
  config.close();overlay.hidden=false;overlay.dataset.moving='true';mapOpen=matchMedia('(min-width: 700px) and (min-height: 501px)').matches;map.hidden=true;document.body.classList.add('presenting');
  title.textContent=tx('Preparando la escena','Preparing the scene','正在准备场景');
  status.textContent=tx('Cargando geometría 3D…','Loading 3D geometry…','正在加载 3D 几何…');
  info.textContent='';controls.hidden=true;stops.hidden=true;
  history.pushState({...history.state,rubikPresentation:true},'','#presentacion');
  try{
   // With the chapter the 3D view opens on the plan as the 2D view shows it and the chapter continues from there.
   storyEnabled=storyChosen&&!!window.FloorPlanPresentationStory&&!!window.View3D?.presentationStoryBegin;
   sectionEnabled=sectionChosen&&!!window.FloorPlanPresentationSection&&!!window.View3D?.presentationStoryBegin;
   elevationEnabled=elevationChosen&&!!elevationDescriptor?.supported&&!!window.View3D?.presentationStoryBegin;
   // The solar snapshot, once: if solar is no longer available the façade goes on without it.
   const sun=elevationEnabled&&elevationSolarChosen?window.FloorPlanSolarUI:null,sunResult=sun?.result;
   elevationSolar=sunResult?.status==='available-orientative'?{result:structuredClone(sunResult),localDate:sun.localDate,localTime:sun.localTime}:null;
   if(!window.View3D||!await app.enterPresentation3D(storyEnabled?{hold:true}:undefined))throw Error(tx('3D no disponible. Puedes seguir editando en 2D.','3D unavailable. You can keep editing in 2D.','3D 不可用。可继续在 2D 编辑。'));
   if(token!==epoch)return;
   if(!sourceCurrent())throw Error(tx('El proyecto cambió. Vuelve a configurar la presentación.','The project changed. Configure the presentation again.','项目已更改。请重新配置展示。'));
   sceneState=View3D.presentationCapture();active=true;index=0;visited=new Set();controls.hidden=false;stops.hidden=false;updateAssetWarning();
   window.dispatchEvent(new Event('floorplan-presentation-started'));
   updateMaterialButton();
   if(!materialButton.hidden)View3D.setSurfaceQuality('enhanced');
   await View3D.setPresentationLightPreset('neutral');
   if(token!==epoch)return;
   updateAssetWarning();
   if(sectionEnabled||elevationEnabled)storyControls();
   if(storyEnabled&&plan.stops[0]?.kind==='overview')await openStory(token,[{kind:'plan-reveal',stop:0}],{from:0,to:reducedMotion()?null:1});else await go(0,token);closeButton.focus();
  }catch(error){
   if(token===epoch){status.textContent=error.message;info.textContent=tx('El plano permanece disponible.','Your plan remains available.','平面图仍可用。');
    toast(error.message,6000);
    document.body.classList.remove('presenting');document.body.classList.add('presentation-exiting');
    if(startLevelId&&activeLevelId()!==startLevelId)building()?.presentLevel(startLevelId);startLevelId=null;
    await app.restorePresentationEntry(entry,sceneState);document.body.classList.remove('presentation-exiting');overlay.hidden=true;active=false;entry=null;plan=null;sceneState=null;
    if(location.hash==='#presentacion')history.back();refocus(returnFocus);}
  }
 }
 async function go(target,token=epoch){
  if(!active||batchActive||target<0||target>=plan.stops.length)return;
  if(!sourceCurrent()){await stop();return;}
  closeStory();
  View3D.clearPresentationReveal?.();View3D.clearPresentationRoute?.();routeStatus.hidden=true;routeStatus.textContent='';delete overlay.dataset.route;
  const move=++movement;index=target;overlay.dataset.moving='true';draw();
  try{await showLevel(plan.stops[index].levelId);if(!active||token!==epoch||move!==movement)return;
   const pending=View3D.presentationGo(plan.stops[index],matchMedia('(prefers-reduced-motion: reduce)').matches,{region:viewRegion()});draw();await pending;if(active&&token===epoch&&move===movement&&sourceCurrent()){visited.add(target);draw();}}catch(error){if(token===epoch){status.textContent=error.message;}}
  finally{if(move===movement){overlay.dataset.moving='false';revealButton.disabled=batchActive;contactButton.disabled=batchActive;routeButton.disabled=batchActive;updateCapture();if(active&&sourceCurrent())renderMinimap();}}
 }
 async function stop(fromPop=false){
  if(stopping||(!entry&&!active&&!pendingStart))return;
  cancelBatch();closeStory();disposeStory();
  stopping=true;++epoch;
  captureButton.disabled=true;
  // A building presentation leaves the editor on the level it started from, before the camera and the entry return.
  if(startLevelId&&activeLevelId()!==startLevelId){try{await showLevel(startLevelId);}catch{}}
  startLevelId=null;
  if(sceneState)View3D?.presentationRestore(sceneState);
  if(pendingStart)await pendingStart.catch(()=>{});
  const saved=entry,three=sceneState;
  active=false;entry=null;sceneState=null;plan=null;visited=new Set();warning.hidden=true;
  document.body.classList.remove('presenting');document.body.classList.add('presentation-exiting');
  if(saved)await app.restorePresentationEntry(saved,three);
  overlay.hidden=true;map.hidden=true;document.body.classList.remove('presentation-exiting');
  if(!fromPop&&location.hash==='#presentacion'){
   const focus=saved?.focus;
   addEventListener('popstate',()=>refocus(focus),{once:true});
   history.back();
  }else if(document.activeElement===document.body||!shown(document.activeElement))refocus(saved?.focus);
  stopping=false;
 }
 function invalidate(){
  if(!active&&!pendingStart)return;
  cancelBatch();closeStory();disposeStory();
  ++epoch;++movement;active=false;plan=null;sceneState=null;entry=null;startLevelId=null;visited=new Set();warning.hidden=true;
  captureButton.disabled=true;
  overlay.hidden=true;map.hidden=true;document.body.classList.remove('presenting','presentation-exiting');
  if(location.hash==='#presentacion')history.replaceState(history.state,'','#editor');
 }
 function onProjectChange(){if(active&&!sourceCurrent())stop();}
 function contextLost(){
  const saved=entry,level=startLevelId;
  invalidate();
  if(level&&activeLevelId()!==level)building()?.presentLevel(level);
  if(saved)app.restorePresentationEntry(saved,null,{force2D:true}).catch(()=>{});
 }
 const modalOpen=()=>{try{return !!document.querySelector('dialog:modal');}catch{return !!document.querySelector('dialog[open]');}};
 function onKey(e){
  if(!active&&!pendingStart)return;
  // A dialog opened over the presentation («Añadir observación», «Compartir imagen») owns the keyboard: Escape closes
  // that dialog only and the arrows stay in it. A second Escape then ends the presentation.
  if(active&&modalOpen())return;
  if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();stop();return;}
  if(active&&e.target?.matches?.('input,select,textarea'))return;
  if(active&&map.contains(e.target)&&(e.key==='Enter'||e.key===' '))return;
  if(e.key==='ArrowRight'||e.key==='ArrowLeft'){
   e.preventDefault();e.stopImmediatePropagation();if(!batchActive)go(index+(e.key==='ArrowRight'?1:-1));return;
  }
  if(e.key!=='Tab')e.stopImmediatePropagation();
 }
 addEventListener('keydown',onKey,true);
 // Closing a dialog opened from the presentation returns the focus to the control that opened it, not to the page.
 let opener=null;addEventListener('focusin',e=>{if(active&&overlay.contains(e.target))opener=e.target;},true);
 addEventListener('close',e=>{if(!active||e.target?.tagName!=='DIALOG')return;setTimeout(()=>{const a=document.activeElement;
  if(active&&opener?.isConnected&&!opener.disabled&&(!a||a===document.body))opener.focus();},0);},true);
 addEventListener('popstate',()=>{if(entry&&(active||pendingStart))stop(true);});
 addEventListener('resize',()=>{
  if(!active||!sourceCurrent())return;
  if(batchActive){batchResized=true;cancelBatch();}
  if(story){restartStory();return;}
  const token=epoch,move=++movement;overlay.dataset.moving='true';updateCapture();
  requestAnimationFrame(()=>{
   if(!active||token!==epoch)return;
   View3D.presentationGo(plan.stops[index],true,{region:viewRegion()}).catch(()=>{}).finally(()=>{if(move===movement){overlay.dataset.moving='false';draw();updateCapture();renderMinimap();requestAnimationFrame(updateCapture);}});
  });
 });
 addEventListener('floorplan-asset-status',()=>{updateAssetWarning();updateCapture();});
 config.addEventListener('close',()=>{if(!active&&!pendingStart)refocus(returnFocus);});
 draw();
 window.FloorPlanPresentation={open,stop,invalidate,onProjectChange,contextLost,get active(){return active;},get plan(){return plan;},get current(){return active&&plan?plan.stops[index]||null:null;},get story(){return story?{p:story.scenes.length>1?story.P:story.p,local:story.p,P:story.P,playing:story.playing,kind:story.scenes[story.i]?.kind,scene:story.i,scenes:story.scenes.length,kinds:story.scenes.map(sc=>sc.kind),busy:story.busy}:null;},get storyEnabled(){return storyEnabled;},get section(){return {chosen:sectionChosen,enabled:sectionEnabled,axis:sectionAxis,levels:[...sectionLevels.entries()].map(([levelId,d])=>({levelId,supported:d.supported,reason:d.reason,message:d.message,axis:d.axis,fraction:d.fraction??null}))};}};
})();
