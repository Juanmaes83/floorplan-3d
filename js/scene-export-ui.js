/* RUBIK SOTA · OP-10 C5 · «Entregar → Escena para Blender» (interfaz). Una tarjeta en «Documentación» abre un diálogo con
   una sola acción principal por estado: Preparar → (cancelable) → Descargar. Todo ocurre en este navegador: captura de solo
   lectura de la vista 3D (View3D.captureScene), GLB + manifiesto + LEEME en un ZIP local (FloorPlanPackage.zip). Nada se
   envía ni se guarda; el proyecto no cambia. Estados: inicial · sin-3d · preparando · lista · desactualizada · error · cancelada. */
(function(){
 'use strict';
 const app=window.FloorPlanApp,C=window.RubikSceneCapture,D=window.RubikSceneDelivery;if(!app||!C||!D)return;
 const tx=(es,en,zh)=>({es,en,zh})[typeof LANG==='string'?LANG:'es']||es;
 const el=(tag,attrs,parent,text)=>{const n=document.createElement(tag);for(const[k,v]of Object.entries(attrs||{}))n.setAttribute(k,v);if(text!=null)n.textContent=text;parent?.append(n);return n;};
 const hex=b=>[...new Uint8Array(b)].map(n=>n.toString(16).padStart(2,'0')).join(''),digest=async bytes=>hex(await crypto.subtle.digest('SHA-256',bytes));
 const size=n=>n<1048576?(n/1024).toFixed(0)+' KB':(n/1048576).toFixed(1)+' MB',num=n=>Number(n).toLocaleString(({en:'en-GB',zh:'zh-CN'})[typeof LANG==='string'?LANG:'es']||'es-ES');

 const dlg=el('dialog',{id:'sceneExportDialog',class:'scene-export-dialog','aria-labelledby':'seTitle','aria-describedby':'seLead'},document.body);
 const wrap=el('div',{class:'scene-export'},dlg),head=el('div',{class:'se-head'},wrap),title=el('h2',{id:'seTitle'},head);
 const lead=el('p',{id:'seLead',class:'se-lead'},wrap),facts=el('ul',{class:'se-facts'},wrap);
 const status=el('p',{id:'seStatus',class:'se-status',role:'status','aria-live':'polite'},wrap),detail=el('div',{class:'se-detail'},wrap);
 const actions=el('div',{class:'se-actions'},wrap),primary=el('button',{type:'button',class:'btn primary',id:'sePrimary'},actions),secondary=el('button',{type:'button',class:'btn',id:'seSecondary'},actions);
 let state='idle',abort=null,result=null,error=null;
 const stage={loading:tx('Esperando a que la vista 3D termine de cargar los muebles…','Waiting for the 3D view to finish loading furniture…','等待 3D 视图加载完家具…'),moving:tx('Esperando a que termine el movimiento de cámara o puertas…','Waiting for the camera or doors to stop moving…','等待相机或门停止移动…'),settling:tx('Comprobando que la escena está estable…','Checking that the scene is stable…','正在确认场景已稳定…')};

 // «Entregar» suspende el visor detrás del área. Cederlo solo durante la operación del diálogo.
 async function withActiveViewer(run){
  const view=window.View3D;
  if(!view?.suspended)return run();
  const area=window.FloorPlanProfessionalUI?.area;
  view.setSuspended(false);
  try{return await run();}
  finally{if(window.FloorPlanProfessionalUI?.area===area)view.setSuspended(true);}
 }
 function is3d(){return app.viewMode==='3d'&&window.View3D&&window.View3D.contextAvailable!==false;}
 function set(next){state=next;render();}
 function render(){
  title.textContent=tx('Escena para Blender','Scene for Blender','Blender 场景');
  lead.textContent=tx('Descarga la vivienda tal como se ve en la vista 3D, lista para abrir en Blender con sus medidas, materiales e identificadores.','Download the home as shown in the 3D view, ready to open in Blender with its dimensions, materials and identifiers.','按 3D 视图中的样子下载住宅，可在 Blender 中打开，保留尺寸、材质和标识。');
  facts.replaceChildren();for(const t of [tx('Incluye: muros, suelos, huecos, muebles, luminarias, la cámara actual y la luz del visor.','Includes: walls, floors, openings, furniture, light fixtures, the current camera and the viewer light.','包含：墙体、地面、门窗洞口、家具、灯具、当前相机和查看器光照。'),tx('No incluye fotos, texturas ni imágenes del proyecto: las superficies con textura viajan con su color.','Excludes project photos, textures and images: textured surfaces travel as their colour.','不包含项目照片、纹理或图像：带纹理的表面仅保留其颜色。'),tx('Se prepara en este navegador. No se envía nada y el proyecto no cambia.','Prepared in this browser. Nothing is sent and the project does not change.','在此浏览器中准备，不会发送任何内容，项目也不会改变。')])el('li',{},facts,t);
  detail.replaceChildren();primary.hidden=false;secondary.hidden=false;primary.disabled=false;dlg.dataset.state=state;
  secondary.textContent=tx('Cerrar','Close','关闭');secondary.onclick=()=>dlg.close();
  if(state==='idle'||state==='no3d'){
   const ok=is3d();state=ok?'idle':'no3d';dlg.dataset.state=state;
   status.textContent=ok?tx('Encuadra la vista 3D como quieras verla en Blender: la cámara actual se incluye.','Frame the 3D view as you want to see it in Blender: the current camera is included.','请按希望在 Blender 中看到的样子调整 3D 视图：当前相机将被包含。')
    :tx('Necesitas la vista 3D abierta: la escena se toma de lo que se ve allí.','The 3D view must be open: the scene is taken from what it shows.','需要打开 3D 视图：场景取自其中显示的内容。');
   primary.textContent=ok?tx('Preparar escena','Prepare scene','准备场景'):tx('Abrir la vista 3D','Open the 3D view','打开 3D 视图');
   primary.onclick=ok?prepare:async()=>{primary.disabled=true;status.textContent=tx('Abriendo la vista 3D…','Opening the 3D view…','正在打开 3D 视图…');try{await withActiveViewer(()=>window.setView?.('3d'));}catch{}for(let i=0;i<100&&!is3d();i++)await new Promise(r=>setTimeout(r,50));render();(primary.hidden?secondary:primary).focus();};
  }else if(state==='working'){
   primary.hidden=true;secondary.textContent=tx('Cancelar','Cancel','取消');secondary.onclick=()=>abort?.abort();
  }else if(state==='ready'||state==='stale'){
   const m=result.manifest,s=m.scene.stats,stale=state==='stale';
   status.textContent=stale?tx('El proyecto ha cambiado desde que preparaste la escena. Vuelve a prepararla para descargar la versión actual.','The project changed after you prepared the scene. Prepare it again to download the current version.','准备场景后项目已更改。请重新准备以下载当前版本。')
    :tx('Escena lista. El proyecto no se ha modificado.','Scene ready. The project was not modified.','场景已就绪，项目未被修改。');
   const dl=el('dl',{class:'se-summary'},detail);
   for(const[k,v]of [[tx('Elementos identificados','Identified elements','已识别元素'),num(s.entities)],[tx('Mallas · caras','Meshes · faces','网格 · 面'),num(s.meshes)+' · '+num(s.faces)],[tx('Tamaño de la descarga','Download size','下载大小'),size(result.bytes.size)],[tx('Cámara','Camera','相机'),m.scene.view?.camera?tx('vista actual','current view','当前视图'):tx('ninguna','none','无')],[tx('Huella de la escena','Scene fingerprint','场景指纹'),m.files['scene.glb'].sha256.slice(0,12)+'…']]){el('dt',{},dl,k);el('dd',{},dl,v);}
   const paths=el('div',{class:'se-paths',id:'sePaths'},detail),hasScript=!!m.blender.paths?.prepared?.script;
   el('p',{class:'se-paths-title'},paths,m.blender.paths?.render?.launchers?tx('Tres formas de usarla en Blender (no dan el mismo render):','Three ways to use it in Blender (they do not give the same render):','在 Blender 中有三种使用方式（渲染结果不同）：'):tx('Dos formas de abrirla en Blender (no dan el mismo render):','Two ways to open it in Blender (they do not give the same render):','在 Blender 中有两种打开方式（渲染结果不同）：'));
   const pl=el('ul',{},paths);
   const kitOk=!!m.blender.paths?.render?.launchers;
   if(kitOk){const li=el('li',{class:'se-kit',id:'seKit'},pl);el('strong',{},li,tx('Render y entrega sin código (recomendado): ','Render and delivery without code (recommended): ','无需代码的渲染与交付（推荐）：'));
    li.append(tx('descomprime el ZIP y ejecuta RENDERIZAR-windows.bat (Windows) o «sh renderizar.sh» (macOS/Linux) con Blender instalado. Después vuelve aquí y pulsa «Revisar render…».','unzip and run RENDERIZAR-windows.bat (Windows) or “sh renderizar.sh” (macOS/Linux) with Blender installed. Then come back here and press “Review render…”.','解压后在安装了 Blender 的电脑上运行 RENDERIZAR-windows.bat（Windows）或“sh renderizar.sh”（macOS/Linux），然后回到此处点击“审阅渲染…”。'));}
   el('li',{},pl,tx('Importación directa del GLB: geometría, colores, identificadores y cámara, con la luz por defecto de Blender.','Direct GLB import: geometry, colours, identifiers and camera, with Blender default lighting.','直接导入 GLB：几何体、颜色、标识和相机，使用 Blender 默认照明。'));
   el('li',{},pl,hasScript?tx('Preparación completa con el script incluido: añade el sol, el cielo y las luces del visor. Instrucciones en LEEME.txt.','Full preparation with the included script: adds the viewer sun, sky and lights. Instructions in LEEME.txt.','使用附带脚本完整准备：添加查看器的太阳、天空和灯光。说明见 LEEME.txt。')
    :tx('La preparación completa no se pudo incluir esta vez; la importación directa funciona igual.','Full preparation could not be included this time; direct import works the same.','本次未能包含完整准备脚本；直接导入仍可正常使用。'));
   if(m.fallbacks.assetErrors.length)el('p',{class:'se-note'},detail,tx(`${m.fallbacks.assetErrors.length} modelo(s) no se pudieron cargar y van con su representación genérica.`,`${m.fallbacks.assetErrors.length} model(s) could not load and travel as their generic representation.`,`${m.fallbacks.assetErrors.length} 个模型无法加载，将以通用表示导出。`));
   if(stale){primary.textContent=tx('Volver a preparar','Prepare again','重新准备');primary.onclick=prepare;}
   else{primary.textContent=tx('Descargar ZIP','Download ZIP','下载 ZIP');primary.onclick=download;secondary.textContent=tx('Volver a preparar','Prepare again','重新准备');secondary.onclick=prepare;}
  }else if(state==='error'||state==='cancelled'){
   status.textContent=state==='cancelled'?tx('Preparación cancelada. No se ha generado nada.','Preparation cancelled. Nothing was generated.','已取消准备，未生成任何内容。'):error;
   if(state==='error'&&error.hint)el('p',{class:'se-note'},detail,error.hint);
   primary.textContent=tx('Reintentar','Try again','重试');primary.onclick=prepare;
  }
 }
 function explain(e){
  const map={NOT_3D:[tx('La vista 3D no está abierta o no está disponible.','The 3D view is not open or not available.','3D 视图未打开或不可用。'),tx('Abre la vista 3D y vuelve a intentarlo.','Open the 3D view and try again.','请打开 3D 视图后重试。')],
   UNSTABLE:[tx('La vista 3D no terminó de cargar a tiempo.','The 3D view did not finish loading in time.','3D 视图未能及时加载完成。'),tx('Espera a que se vean todos los muebles y reintenta. Si un modelo no carga, la escena usará su representación genérica.','Wait until all furniture is visible and retry. If a model fails, the scene uses its generic representation.','请等待所有家具显示后重试。如果某个模型无法加载，场景将使用其通用表示。')],
   EMPTY:[tx('No hay nada visible que exportar.','There is nothing visible to export.','没有可导出的可见内容。'),tx('Comprueba que las capas de muros y muebles están activas en la vista 3D.','Check that the wall and furniture layers are on in the 3D view.','请检查 3D 视图中墙体和家具图层是否已开启。')],
   FACE_BUDGET:[tx('La escena supera el tamaño máximo admitido.','The scene exceeds the supported size.','场景超出支持的最大规模。'),tx('Oculta plantas o capas que no necesites (por ejemplo, «solo la planta activa») y reintenta.','Hide levels or layers you do not need (for example, “active level only”) and retry.','请隐藏不需要的楼层或图层（例如“仅当前楼层”）后重试。')],
   MUTATION:[tx('La preparación se detuvo para proteger tu proyecto.','Preparation stopped to protect your project.','为保护您的项目，准备已停止。'),tx('No se ha generado nada. Reintenta; si se repite, guarda el proyecto y recarga la página.','Nothing was generated. Retry; if it happens again, save the project and reload.','未生成任何内容。请重试；如再次发生，请保存项目并重新加载页面。')]};
  map.VERTEX_BUDGET=map.INSTANCE_BUDGET=map.BYTES=map.FACE_BUDGET;
  const [msg,hint]=map[e.code]||[tx('No se pudo preparar la escena.','The scene could not be prepared.','无法准备场景。'),tx('Reintenta. Si se repite, recarga la página; tu proyecto no se ha modificado.','Try again. If it persists, reload the page; your project was not modified.','请重试。如问题持续，请重新加载页面；您的项目未被修改。')];
  return Object.assign(new String(msg),{hint,code:e.code||'UNKNOWN'});
 }
 // Camino B: el script de preparación completa, leído del mismo origen (sin red externa). Se cachea; si falla, null.
 // M03 · Kit de render: copias exactas del repositorio leídas del mismo origen. Cada una se reconoce por su cabecera: nunca
 // se empaqueta una página de error en su lugar. Si alguna falta, el kit no se entrega a medias (el LEEME lo explica).
 const SPDX='# SPDX-License-Identifier: GPL-3.0-or-later';const KIT_HEAD={render:SPDX,verify:SPDX,profiles:'{',sh:'#!/bin/sh',bat:'@echo off',licence:'RUBIK SOTA · Licencia',copying:'                    GNU GENERAL PUBLIC LICENSE'};
 let kitCache;async function kit(){
  if(kitCache!==undefined)return kitCache;const out={};
  for(const [k,src] of Object.entries(D.KIT_SOURCES||{})){try{const r=await fetch(src,{cache:'no-store'});if(!r.ok){kitCache=null;return null;}const b=new Uint8Array(await r.arrayBuffer());
   if(!new TextDecoder().decode(b.subarray(0,64)).startsWith(KIT_HEAD[k])){kitCache=null;return null;}out[k]=b;}catch{kitCache=null;return null;}}
  try{JSON.parse(new TextDecoder().decode(out.profiles)).profiles.review.resolution;}catch{kitCache=null;return null;}
  return kitCache=out;}
 // Nombre VISIBLE de cada estancia: el embudo de RUBIK (nunca el nombre guardado en bruto).
 const roomLabel=r=>{try{if(typeof roomDisplay==='function')return roomDisplay(r);}catch{}return window.FloorPlanDisplayName?window.FloorPlanDisplayName(r.name,'room'):r.id;};
 // Imagen de referencia: la vista 3D con la cámara que viaja como RUBIK_camera (para comparar con el render «viewer»).
 function referenceShot(){try{const a=window.View3D.cameraState?.aspect||16/10,w=1280,s=window.View3D.deliveryShot({width:w,height:Math.round(w/a),frame:false});
  const bin=atob(String(s.dataUrl||s).split(',')[1]);const b=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)b[i]=bin.charCodeAt(i);return b;}catch{return null;}}
 let scriptBytes;async function script(){if(scriptBytes!==undefined)return scriptBytes;try{const r=await fetch('scripts/interop/blender-scene-import.py',{cache:'no-store'});scriptBytes=r.ok?new Uint8Array(await r.arrayBuffer()):null;}catch{scriptBytes=null;}if(scriptBytes&&!new TextDecoder().decode(scriptBytes.subarray(0,64)).startsWith(SPDX))scriptBytes=null;/* nunca una página de error servida en su lugar */return scriptBytes;}
 async function prepare(){
  if(state==='working')return;if(!is3d()){set('no3d');return;}
  abort=new AbortController();result=null;error=null;set('working');status.textContent=stage.settling;
  try{
   const project=app.project,entry=app.entryId,level=app.levelContext?.activeLevelId??null;
   const fingerprint=D.canonical(project);
   const stillCurrent=()=>app.entryId===entry&&(app.levelContext?.activeLevelId??null)===level&&D.canonical(app.project)===fingerprint;
   const ensureCurrent=()=>{if(!stillCurrent())throw Object.assign(Error('project changed'),{code:'MUTATION'});};
   let reference=null;
   const capture=await withActiveViewer(async()=>{const c=await window.View3D.captureScene({signal:abort.signal,onState:s=>{if(stage[s]&&status.textContent!==stage[s])status.textContent=stage[s];}});reference=referenceShot();return c;});
   status.textContent=tx('Empaquetando la escena…','Packaging the scene…','正在打包场景…');await new Promise(r=>setTimeout(r));if(abort.signal.aborted)throw Object.assign(Error('cancelled'),{code:'CANCELLED'});
   const prepareScript=await script(),kitBytes=await kit();ensureCurrent();
   const rooms=D.roomsDoc?D.roomsDoc({project,label:roomLabel}):null,glb=C.toGLB(capture.doc);
   const manifest=await D.manifest({capture,glb,project,digest,prepareScript,kit:kitBytes,rooms,reference,captureId:kitBytes&&prepareScript&&rooms?crypto.randomUUID():null,app:{revision:document.documentElement.dataset.appRevision||null}});
   const pkg=D.packageFiles({manifest,glb,prepareScript,kit:kitBytes,rooms,reference,lang:typeof LANG==='string'?LANG:'es',zip:window.FloorPlanPackage.zip});
   const record=await D.record({manifest,digest,confirmed:null});ensureCurrent();
   result={manifest,bytes:pkg.bytes,name:pkg.name,record,stillCurrent};
   set('ready');primary.focus();
  }catch(e){if(e.code==='CANCELLED'){set('cancelled');}else{error=explain(e);set('error');}primary.focus();}
  finally{abort=null;}
 }
 function download(){
  if(!result)return;if(!result.stillCurrent()){set('stale');return;}
  const url=URL.createObjectURL(result.bytes),a=el('a',{href:url,download:result.name},document.body);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
  status.textContent=tx('Descarga iniciada: ','Download started: ','已开始下载：')+result.name;
 }
 dlg.addEventListener('close',()=>{abort?.abort();});
 dlg.addEventListener('cancel',e=>{if(state==='working'){e.preventDefault();abort?.abort();}});
 function open(){if(state!=='ready')state='idle';else if(!result.stillCurrent())state='stale';render();dlg.showModal();(primary.hidden?secondary:primary).focus();}
 // Entrada: «Entregar» → grupo «Documentación». Botón SECUNDARIO, como las demás tarjetas (sin acciones primarias en tarjetas).
 const addCard=()=>{const items=document.querySelector('[data-group="documentation"] .professional-group-items');if(!items||document.getElementById('sceneExportCard'))return; // una sola tarjeta: Entregar puede colocarla en otro grupo (UX-312 F3)
  const card=el('article',{class:'professional-card scene-export-card',id:'sceneExportCard','data-module':'blender-scene'},items);el('h3',{},card,tx('Escena para Blender','Scene for Blender','Blender 场景'));
  el('p',{class:'professional-state'},card,tx('La vivienda en 3D con medidas e identificadores, para visualización profesional.','The home in 3D with dimensions and identifiers, for professional visualisation.','带尺寸和标识的 3D 住宅，用于专业可视化。'));
  const b=el('button',{type:'button',class:'btn',id:'sceneExportOpen'},card,tx('Preparar escena…','Prepare scene…','准备场景…'));b.onclick=open;
  // M03 · segundo paso del mismo recorrido: revisar el render hecho en Blender y preparar la entrega.
  const r=el('button',{type:'button',class:'btn',id:'blenderReviewOpen'},card,tx('Revisar render…','Review render…','审阅渲染…'));r.onclick=()=>window.RubikBlenderReview?.open();};
 let queued=false;new MutationObserver(()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;addCard();});}).observe(document.body,{childList:true,subtree:true});addCard();
 window.RubikSceneExport=Object.freeze({open,prepare,get state(){return state;},get result(){return result&&{manifest:result.manifest,record:result.record,name:result.name,size:result.bytes.size};},bytes:async()=>result&&new Uint8Array(await result.bytes.arrayBuffer())});
})();
