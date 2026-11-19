/* RUBIK SOTA · OP-10 C5 · «Entregar → Escena para Blender» (interfaz). Una tarjeta en «Documentación» abre un diálogo con
   una sola acción principal por estado: Preparar → (cancelable) → Descargar. Todo ocurre en este navegador: captura de solo
   lectura de la vista 3D (View3D.captureScene), GLB + manifiesto + LEEME en un ZIP local (FloorPlanPackage.zip). Nada se
   envía ni se guarda; el proyecto no cambia. Estados: inicial · sin-3d · preparando · lista · desactualizada · error · cancelada. */
(function(){
 'use strict';
 const app=window.FloorPlanApp,C=window.RubikSceneCapture,D=window.RubikSceneDelivery;if(!app||!C||!D)return;
 const tx=(es,en)=>(typeof LANG==='string'&&LANG!=='es'?en:es);
 const el=(tag,attrs,parent,text)=>{const n=document.createElement(tag);for(const[k,v]of Object.entries(attrs||{}))n.setAttribute(k,v);if(text!=null)n.textContent=text;parent?.append(n);return n;};
 const hex=b=>[...new Uint8Array(b)].map(n=>n.toString(16).padStart(2,'0')).join(''),digest=async bytes=>hex(await crypto.subtle.digest('SHA-256',bytes));
 const size=n=>n<1048576?(n/1024).toFixed(0)+' KB':(n/1048576).toFixed(1)+' MB',num=n=>Number(n).toLocaleString(typeof LANG==='string'&&LANG==='en'?'en-GB':'es-ES');

 const dlg=el('dialog',{id:'sceneExportDialog',class:'scene-export-dialog','aria-labelledby':'seTitle','aria-describedby':'seLead'},document.body);
 const wrap=el('div',{class:'scene-export'},dlg),head=el('div',{class:'se-head'},wrap),title=el('h2',{id:'seTitle'},head);
 const lead=el('p',{id:'seLead',class:'se-lead'},wrap),facts=el('ul',{class:'se-facts'},wrap);
 const status=el('p',{id:'seStatus',class:'se-status',role:'status','aria-live':'polite'},wrap),detail=el('div',{class:'se-detail'},wrap);
 const actions=el('div',{class:'se-actions'},wrap),primary=el('button',{type:'button',class:'btn primary',id:'sePrimary'},actions),secondary=el('button',{type:'button',class:'btn',id:'seSecondary'},actions);
 let state='idle',abort=null,result=null,error=null;
 const stage={loading:tx('Esperando a que la vista 3D termine de cargar los muebles…','Waiting for the 3D view to finish loading furniture…'),moving:tx('Esperando a que termine el movimiento de cámara o puertas…','Waiting for the camera or doors to stop moving…'),settling:tx('Comprobando que la escena está estable…','Checking that the scene is stable…')};

 function is3d(){return app.viewMode==='3d'&&window.View3D&&window.View3D.contextAvailable!==false;}
 function set(next){state=next;render();}
 function render(){
  title.textContent=tx('Escena para Blender','Scene for Blender');
  lead.textContent=tx('Descarga la vivienda tal como se ve en la vista 3D, lista para abrir en Blender con sus medidas, materiales e identificadores.','Download the home as shown in the 3D view, ready to open in Blender with its dimensions, materials and identifiers.');
  facts.replaceChildren();for(const t of [tx('Incluye: muros, suelos, huecos, muebles, luminarias, la cámara actual y la luz del visor.','Includes: walls, floors, openings, furniture, light fixtures, the current camera and the viewer light.'),tx('No incluye fotos, texturas ni imágenes del proyecto: las superficies con textura viajan con su color.','Excludes project photos, textures and images: textured surfaces travel as their colour.'),tx('Se prepara en este navegador. No se envía nada y el proyecto no cambia.','Prepared in this browser. Nothing is sent and the project does not change.')])el('li',{},facts,t);
  detail.replaceChildren();primary.hidden=false;secondary.hidden=false;primary.disabled=false;dlg.dataset.state=state;
  secondary.textContent=tx('Cerrar','Close');secondary.onclick=()=>dlg.close();
  if(state==='idle'||state==='no3d'){
   const ok=is3d();state=ok?'idle':'no3d';dlg.dataset.state=state;
   status.textContent=ok?tx('Encuadra la vista 3D como quieras verla en Blender: la cámara actual se incluye.','Frame the 3D view as you want to see it in Blender: the current camera is included.')
    :tx('Necesitas la vista 3D abierta: la escena se toma de lo que se ve allí.','The 3D view must be open: the scene is taken from what it shows.');
   primary.textContent=ok?tx('Preparar escena','Prepare scene'):tx('Abrir la vista 3D','Open the 3D view');
   primary.onclick=ok?prepare:async()=>{primary.disabled=true;status.textContent=tx('Abriendo la vista 3D…','Opening the 3D view…');try{await window.setView?.('3d');}catch{}for(let i=0;i<100&&!is3d();i++)await new Promise(r=>setTimeout(r,50));render();(primary.hidden?secondary:primary).focus();};
  }else if(state==='working'){
   primary.hidden=true;secondary.textContent=tx('Cancelar','Cancel');secondary.onclick=()=>abort?.abort();
  }else if(state==='ready'||state==='stale'){
   const m=result.manifest,s=m.scene.stats,stale=state==='stale';
   status.textContent=stale?tx('El proyecto ha cambiado desde que preparaste la escena. Vuelve a prepararla para descargar la versión actual.','The project changed after you prepared the scene. Prepare it again to download the current version.')
    :tx('Escena lista. El proyecto no se ha modificado.','Scene ready. The project was not modified.');
   const dl=el('dl',{class:'se-summary'},detail);
   for(const[k,v]of [[tx('Elementos identificados','Identified elements'),num(s.entities)],[tx('Mallas · caras','Meshes · faces'),num(s.meshes)+' · '+num(s.faces)],[tx('Tamaño de la descarga','Download size'),size(result.bytes.size)],[tx('Cámara','Camera'),m.scene.view?.camera?tx('vista actual','current view'):tx('ninguna','none')],[tx('Huella de la escena','Scene fingerprint'),m.files['scene.glb'].sha256.slice(0,12)+'…']]){el('dt',{},dl,k);el('dd',{},dl,v);}
   if(m.fallbacks.assetErrors.length)el('p',{class:'se-note'},detail,tx(`${m.fallbacks.assetErrors.length} modelo(s) no se pudieron cargar y van con su representación genérica.`,`${m.fallbacks.assetErrors.length} model(s) could not load and travel as their generic representation.`));
   if(stale){primary.textContent=tx('Volver a preparar','Prepare again');primary.onclick=prepare;}
   else{primary.textContent=tx('Descargar ZIP','Download ZIP');primary.onclick=download;secondary.textContent=tx('Volver a preparar','Prepare again');secondary.onclick=prepare;}
  }else if(state==='error'||state==='cancelled'){
   status.textContent=state==='cancelled'?tx('Preparación cancelada. No se ha generado nada.','Preparation cancelled. Nothing was generated.'):error;
   if(state==='error'&&error.hint)el('p',{class:'se-note'},detail,error.hint);
   primary.textContent=tx('Reintentar','Try again');primary.onclick=prepare;
  }
 }
 function explain(e){
  const map={NOT_3D:[tx('La vista 3D no está abierta o no está disponible.','The 3D view is not open or not available.'),tx('Abre la vista 3D y vuelve a intentarlo.','Open the 3D view and try again.')],
   UNSTABLE:[tx('La vista 3D no terminó de cargar a tiempo.','The 3D view did not finish loading in time.'),tx('Espera a que se vean todos los muebles y reintenta. Si un modelo no carga, la escena usará su representación genérica.','Wait until all furniture is visible and retry. If a model fails, the scene uses its generic representation.')],
   EMPTY:[tx('No hay nada visible que exportar.','There is nothing visible to export.'),tx('Comprueba que las capas de muros y muebles están activas en la vista 3D.','Check that the wall and furniture layers are on in the 3D view.')],
   FACE_BUDGET:[tx('La escena supera el tamaño máximo admitido.','The scene exceeds the supported size.'),tx('Oculta plantas o capas que no necesites (por ejemplo, «solo la planta activa») y reintenta.','Hide levels or layers you do not need (for example, “active level only”) and retry.')],
   MUTATION:[tx('La preparación se detuvo para proteger tu proyecto.','Preparation stopped to protect your project.'),tx('No se ha generado nada. Reintenta; si se repite, guarda el proyecto y recarga la página.','Nothing was generated. Retry; if it happens again, save the project and reload.')]};
  map.VERTEX_BUDGET=map.INSTANCE_BUDGET=map.BYTES=map.FACE_BUDGET;
  const [msg,hint]=map[e.code]||[tx('No se pudo preparar la escena.','The scene could not be prepared.'),tx('Reintenta. Si se repite, recarga la página; tu proyecto no se ha modificado.','Try again. If it persists, reload the page; your project was not modified.')];
  return Object.assign(new String(msg),{hint,code:e.code||'UNKNOWN'});
 }
 async function prepare(){
  if(state==='working')return;if(!is3d()){set('no3d');return;}
  abort=new AbortController();result=null;error=null;set('working');status.textContent=stage.settling;
  try{
   const capture=await window.View3D.captureScene({signal:abort.signal,onState:s=>{if(stage[s]&&status.textContent!==stage[s])status.textContent=stage[s];}});
   status.textContent=tx('Empaquetando la escena…','Packaging the scene…');await new Promise(r=>setTimeout(r));if(abort.signal.aborted)throw Object.assign(Error('cancelled'),{code:'CANCELLED'});
   const glb=C.toGLB(capture.doc),manifest=await D.manifest({capture,glb,project:app.project,digest,app:{revision:document.documentElement.dataset.appRevision||null}});
   const pkg=D.packageFiles({manifest,glb,lang:typeof LANG==='string'?LANG:'es',zip:window.FloorPlanPackage.zip});
   result={manifest,bytes:pkg.bytes,name:pkg.name,record:await D.record({manifest,digest,confirmed:null}),updatedAt:app.project?.updatedAt,projectId:app.project?.id};
   set('ready');primary.focus();
  }catch(e){if(e.code==='CANCELLED'){set('cancelled');}else{error=explain(e);set('error');}primary.focus();}
  finally{abort=null;}
 }
 function download(){
  if(!result)return;if(app.project?.updatedAt!==result.updatedAt||app.project?.id!==result.projectId){set('stale');return;}
  const url=URL.createObjectURL(result.bytes),a=el('a',{href:url,download:result.name},document.body);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
  status.textContent=tx('Descarga iniciada: ','Download started: ')+result.name;
 }
 dlg.addEventListener('close',()=>{abort?.abort();});
 dlg.addEventListener('cancel',e=>{if(state==='working'){e.preventDefault();abort?.abort();}});
 function open(){if(state!=='ready')state='idle';else if(app.project?.updatedAt!==result.updatedAt)state='stale';render();dlg.showModal();(primary.hidden?secondary:primary).focus();}
 // Entrada: «Entregar» → grupo «Documentación». Botón SECUNDARIO, como las demás tarjetas (sin acciones primarias en tarjetas).
 const addCard=()=>{const items=document.querySelector('[data-group="documentation"] .professional-group-items');if(!items||items.querySelector('#sceneExportCard'))return;
  const card=el('article',{class:'professional-card scene-export-card',id:'sceneExportCard','data-module':'blender-scene'},items);el('h3',{},card,tx('Escena para Blender','Scene for Blender'));
  el('p',{class:'professional-state'},card,tx('La vivienda en 3D con medidas e identificadores, para visualización profesional.','The home in 3D with dimensions and identifiers, for professional visualisation.'));
  const b=el('button',{type:'button',class:'btn',id:'sceneExportOpen'},card,tx('Preparar escena…','Prepare scene…'));b.onclick=open;};
 let queued=false;new MutationObserver(()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;addCard();});}).observe(document.body,{childList:true,subtree:true});addCard();
 window.RubikSceneExport=Object.freeze({open,prepare,get state(){return state;},get result(){return result&&{manifest:result.manifest,record:result.record,name:result.name,size:result.bytes.size};},bytes:async()=>result&&new Uint8Array(await result.bytes.arrayBuffer())});
})();
