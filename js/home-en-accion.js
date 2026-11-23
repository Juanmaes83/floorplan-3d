/* UX-312 · Home · seis capacidades nuevas en «Descubre RUBIK en acción».
   - Recorrer (?demo=recorrido) y Asistente (?demo=asistente) abren la vivienda de ejemplo por el MISMO camino que
     «Probar el ejemplo» (como «Dibujo vivo», js/home-demos.js) y dejan al visitante en el recorrido táctil o en la
     consulta guiada; «Volver al inicio» reabre el proyecto que tenía.
   - Vídeo, comparativa, estilos y entrega abren una MUESTRA con archivos reales de RUBIK (assets/welcome/en-accion,
     procedencia en assets/welcome/PROCEDENCIA.md). No genera, no publica ningún enlace y no consume créditos.
   API: window.RubikHomeEnAccion.open(id, origen) · .demo (estado de la demo por URL). */
(function(){
 'use strict';
 const L=()=>{try{return typeof LANG==='string'?LANG:'es';}catch{return 'es';}},tx=(es,en,zh)=>L()==='en'?en:L()==='zh'?zh:es;
 const el=(tag,cls,parent,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;parent?.append(n);return n;};
 const button=(text,parent,fn,primary)=>{const b=el('button','btn'+(primary?' primary':''),parent,text);b.type='button';b.onclick=fn;return b;};
 const A='assets/welcome/en-accion/';
 const wait=(cond,ms=120000)=>new Promise((ok,ko)=>{const t0=Date.now();(function tick(){let v=null;try{v=cond();}catch{}if(v)return ok(v);if(Date.now()-t0>ms)return ko(new Error('timeout'));setTimeout(tick,200);})();});

 // ── Muestras (diálogo): solo archivos reales; el foco vuelve a la tarjeta que la abrió ──
 const MUESTRAS={
  video:()=>({title:tx('Vídeo del recorrido · ejemplo','Tour video · example','漫游视频 · 示例'),
   body:b=>{const v=el('video','home-muestra-media',b);v.src=A+'recorrido-ejemplo.mp4';v.controls=true;v.playsInline=true;v.preload='metadata';v.setAttribute('aria-label',tx('Vídeo MP4 real grabado con RUBIK','Real MP4 video recorded with RUBIK','用 RUBIK 录制的真实 MP4 视频'));},
   note:tx('MP4 real grabado con «Grabar vídeo» en la presentación de la vivienda de ejemplo (1280 × 720, dos paradas). Esta muestra se grabó con render por CPU, por eso avanza a pocos fotogramas por segundo; en un equipo con GPU el movimiento es continuo.','Real MP4 recorded with «Record video» in the example home presentation (1280 × 720, two stops). This sample was recorded with CPU rendering, so it runs at few frames per second; on a computer with a GPU the movement is continuous.','在示例住宅演示中通过“录制视频”录制的真实 MP4（1280 × 720，两个停靠点）。此示例使用 CPU 渲染录制，因此帧率较低；在有 GPU 的电脑上运动是连续的。')}),
  comparativa:()=>({title:tx('RUBIK y Blender Cycles · misma cámara','RUBIK and Blender Cycles · same camera','RUBIK 与 Blender Cycles · 同一相机'),
   body:b=>{const i=el('img','home-muestra-media',b);i.src=A+'muestra-comparativa.webp';i.alt=tx('A la izquierda, la vista 3D de RUBIK; a la derecha, el render de Blender Cycles con la misma cámara','Left, the RUBIK 3D view; right, the Blender Cycles render with the same camera','左为 RUBIK 三维视图，右为同一相机的 Blender Cycles 渲染');},
   note:tx('Render real de la vivienda de ejemplo con la escena que exporta RUBIK: Blender 5.2.1 LTS, Cycles por CPU, 128 muestras, 1600 × 1000. Es el flujo actual de imágenes fijas (Escena para Blender en Entregar).','Real render of the example home from the scene RUBIK exports: Blender 5.2.1 LTS, Cycles on CPU, 128 samples, 1600 × 1000. It is the current still-image workflow (Scene for Blender in Deliver).','使用 RUBIK 导出场景的示例住宅真实渲染：Blender 5.2.1 LTS，CPU Cycles，128 采样，1600 × 1000。这是当前的静态图像流程（交付中的 Blender 场景）。')}),
  estilos:()=>({title:tx('Render IA · explora estilos','AI render · explore styles','AI 渲染 · 探索风格'),
   body:b=>{const i=el('img','home-muestra-media',b);i.src=A+'muestra-estilos-origen.webp';i.alt=tx('Vista de origen real del proyecto de ejemplo','Real source view of the example project','示例项目的真实源视图');},
   note:tx('Vista de origen real del proyecto de ejemplo. Las variantes de estilo se mostrarán aquí cuando haya ejemplos generados y acreditados sobre este mismo encuadre: abrir esta muestra no inicia ninguna generación ni consume créditos.','Real source view of the example project. Style variants will be shown here once generated, credited examples exist for this same framing: opening this sample starts no generation and uses no credits.','示例项目的真实源视图。在同一构图上有经过认证的生成示例后，风格变体将在此显示：打开此示例不会启动生成，也不会消耗额度。')}),
  entrega:()=>({title:tx('Una entrega con tu firma · ejemplo','A delivery with your signature · example','带你签名的交付 · 示例'),
   body:b=>{const g=el('div','home-muestra-grid',b);for(const[f,alt]of [['muestra-lamina.webp',tx('Lámina de distribución firmada','Signed layout sheet','签名的布局图纸')],['muestra-dossier.webp',tx('Dossier del proyecto firmado','Signed project dossier','签名的项目档案')],['muestra-presentacion.webp',tx('Presentación 3D de la misma vivienda','3D presentation of the same home','同一住宅的三维演示')]]){const fig=el('figure',null,g);const i=el('img','home-muestra-media',fig);i.src=A+f;i.alt=alt;i.loading='lazy';el('figcaption',null,fig,alt);}},
   note:tx('Lámina, dossier y presentación reales de la vivienda de ejemplo con una firma de demostración («Estudio Demo · firma de ejemplo»). Ver esta muestra no publica ningún enlace.','Real sheet, dossier and presentation of the example home with a demo signature («Estudio Demo · firma de ejemplo»). Viewing this sample publishes no link.','示例住宅的真实图纸、档案与演示，带演示签名（“Estudio Demo · firma de ejemplo”）。查看此示例不会发布任何链接。')})};
 let dlg=null,origin=null;
 function dialog(){if(dlg)return dlg;dlg=el('dialog','home-muestra',document.body);dlg.id='homeMuestra';dlg.setAttribute('aria-labelledby','homeMuestraTitle');
  dlg.addEventListener('close',()=>{dlg.querySelector('video')?.pause();const o=origin;origin=null;if(o?.isConnected)o.focus({preventScroll:true});});return dlg;}
 function open(id,from){
  if(id==='recorrido'||id==='asistente'){location.href=location.pathname+'?demo='+id;return;}
  const m=MUESTRAS[id]?.();if(!m)return;const d=dialog();origin=from||document.activeElement;d.replaceChildren();
  const head=el('div','home-muestra-head',d);const h=el('h2',null,head,m.title);h.id='homeMuestraTitle';
  const close=button(tx('Cerrar','Close','关闭'),head,()=>d.close());close.id='homeMuestraClose';
  const body=el('div','home-muestra-body',d);m.body(body);el('p','home-muestra-note',d,m.note);
  d.showModal();close.focus({preventScroll:true});
 }

 // ── Demos por URL: recorrido táctil y consulta guiada sobre la vivienda de ejemplo ──
 const q=new URLSearchParams(location.search).get('demo'),demo={id:null,previous:null,ready:false,error:null};
 window.RubikHomeEnAccion=Object.freeze({open,get demo(){return {...demo};}});
 if(q!=='recorrido'&&q!=='asistente')return;
 demo.id=q;
 const lib=()=>{try{return typeof library==='object'&&library?library:null;}catch{return null;}};
 const bar=el('div','home-demo-bar',null);bar.id='homeEnAccionBar';bar.setAttribute('role','region');bar.setAttribute('aria-label',tx('Demostración','Demo','演示'));
 const tag=el('span','home-demo-tag',bar);
 button(tx('Volver al inicio','Back to start','返回首页'),bar,()=>home()).id='homeEnAccionHome';
 async function home(){try{const prev=demo.previous,L2=lib();if(L2&&prev&&prev!==L2.activeId()&&L2.list().some(e=>e.id===prev))switchProject(L2.open(prev));}catch(e){console.warn(e);}location.href=location.pathname;}
 async function prepare(){
  await wait(()=>lib()&&window.View3D&&window.FloorPlanApp);
  try{demo.previous=library.activeId();}catch{}
  const entry=await wait(()=>document.getElementById('welcomeExample'));
  if(!document.querySelector('#welcomeDialog[open]')){window.FloorPlanGuideUI?.openWelcome?.();await wait(()=>document.querySelector('#welcomeDialog[open]'),20000);}
  entry.click();await wait(()=>!document.querySelector('#welcomeDialog[open]'));
  if(q==='asistente'){
   tag.textContent=tx('Demostración · consulta guiada con la vivienda de ejemplo','Demo · guided query with the example home','演示 · 示例住宅的引导查询');
   const o=await wait(()=>document.getElementById('assistantOpen'));o.click();
   const chip=await wait(()=>[...document.querySelectorAll('#assistantPanel button')].find(b=>/^¿Cuántas estancias hay\?$|^How many rooms are there\?$/.test(b.textContent.trim())),20000).catch(()=>null);
   chip?.click();
  }else{
   tag.textContent=tx('Demostración · recorrido táctil por la vivienda de ejemplo','Demo · touch walkthrough of the example home','演示 · 示例住宅触控漫游');
   await window.setView('3d');await wait(()=>document.body.classList.contains('m3d'));
   const t=await wait(()=>document.getElementById('nav3dToggle'));if(t.getAttribute('aria-expanded')==='false')t.click();
   // Misma estancia que la portada (el salón): la lista se rellena con el 3D; se espera a que el encuadre termine.
   const sel=await wait(()=>{const s=document.getElementById('nav3dRoom');return s&&!s.disabled&&[...s.options].some(o=>/Salón|Living/.test(o.textContent))&&s;},60000);
   const salon=[...sel.options].find(o=>/Salón|Living/.test(o.textContent));sel.value=salon.value;
   sel.dispatchEvent(new Event('input',{bubbles:true}));sel.dispatchEvent(new Event('change',{bubbles:true}));
   await wait(()=>!sel.disabled&&document.getElementById('nav3dStatus')?.textContent&&!window.View3D.navState?.busy,60000);
   (await wait(()=>document.getElementById('nav3dMode-walk'))).click();
   await wait(()=>window.View3D.walking?.()&&!window.View3D.navState?.busy,60000);
   (await wait(()=>document.getElementById('walkStart'))).click();
  }
  demo.ready=true;
 }
 const mount=()=>{document.body.append(bar);prepare().catch(e=>{demo.error=String(e.message||e);tag.textContent=tx('No se pudo preparar la demostración. Vuelve al inicio e inténtalo de nuevo.','The demo could not be prepared. Go back to start and try again.','无法准备演示。请返回首页重试。');});};
 if(document.readyState==='loading')addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();
