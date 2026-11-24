/* UX-312 · PERLA · Entregar: fichas compactas y catálogo completo de documentos y entregables.
   - Fichas compactas (índice y catálogo): de entrada, título, estado y acción; la descripción aparece al pasar el cursor
     y «Ver detalles» la abre y cierra con teclado o toque, superpuesta (la cuadrícula no se mueve).
   - «Ver todos los documentos y entregables»: catálogo desplegable con cada salida comprobada, su formato REAL, su
     estado, sus requisitos y su acción. Cada acción usa el MISMO generador que su tarjeta o su entrada E3 (botón de ruta
     de la tarjeta si está en pantalla; si no, la API global del generador). Nada se genera, publica ni gasta al abrir.
   - Vuelta al origen: los diálogos devuelven el foco a quien los abrió (la ficha del catálogo); el catálogo conserva su
     estado abierto y la ficha con el foco aunque Entregar se repinte.
   Script clásico; se carga al final (después de professional-workspace-ui y e3-entregas-ui). */
(function(){
 'use strict';
 const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
 const L=()=>typeof LANG==='string'?LANG:'es',tx=(es,en,zh)=>L()==='en'?en:L()==='zh'?zh:es,T=a=>Array.isArray(a)?tx(...a):a;
 const el=(tag,cls,parent,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;parent?.append(n);return n;};
 const ws=()=>$('#professionalWorkspace');
 const deliverOpen=()=>{const w=ws();return !!w&&!w.hidden&&w.dataset.area==='deliver';};
 let uid=0;const idFor=n=>n.id||(n.id='perla-e-'+(++uid));

 // ── Ficha compacta: «Ver detalles» con capa superpuesta ──
 function compact(card,{details=[],meta=[]}={}){
  // Ficha PERLA V3 de Codex (portada + «Ver detalles» que abre el panel lateral): el detalle vive en ese panel, no en una capa.
  if(card.querySelector('.perla-card-selector')){uncompact(card);card.dataset.perlaPanel='1';return;}
  if(card.dataset.perlaCompact==='1'){const d=card.querySelector(':scope>.perla-detail');if(d)fillMeta(d,meta);return;}
  card.dataset.perlaCompact='1';card.classList.add('perla-compact');
  const layer=el('div','perla-detail',null);layer.id='perla-det-'+(++uid);layer.hidden=true;layer.setAttribute('role','region');
  for(const p of details)if(p&&p.isConnected)layer.append(p);
  el('dl','perla-detail-meta',layer);fillMeta(layer,meta);
  const toggle=el('button','btn perla-more-btn');toggle.type='button';toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-controls',layer.id);
  const label=()=>{toggle.textContent=toggle.getAttribute('aria-expanded')==='true'?tx('Ocultar detalles','Hide details','收起详情'):tx('Ver detalles','View details','查看详情');layer.setAttribute('aria-label',tx('Detalles','Details','详情')+': '+(card.querySelector('h3')?.textContent||''));};
  toggle._label=label;label();
  toggle.onclick=()=>setOpen(card,toggle.getAttribute('aria-expanded')!=='true');
  // El botón va junto al estado: se ve sin abrir nada y no desplaza las acciones.
  const state=card.querySelector(':scope>.professional-state, :scope .professional-state');(state||card.querySelector('h3,h4,h5'))?.after(toggle);
  card.append(layer);
  if(!layer.querySelector('p,dd'))toggle.hidden=true;
 }
 function uncompact(card){if(card.dataset.perlaCompact!=='1')return;const layer=card.querySelector(':scope>.perla-detail'),body=card.querySelector(':scope>.body')||card;
  const anchor=body.querySelector(':scope>button[data-route], :scope>.perla-card-selector');for(const p of [...(layer?.children||[])])if(!p.matches('.perla-detail-meta'))anchor?anchor.before(p):body.append(p);
  layer?.remove();card.querySelector('.perla-more-btn')?.remove();card.classList.remove('perla-compact','perla-open');delete card.dataset.perlaCompact;}
 function fillMeta(layer,meta){const dl=layer.querySelector('.perla-detail-meta');if(!dl)return;dl.replaceChildren();
  for(const[k,v]of meta)if(v){el('dt',undefined,dl,k);el('dd',undefined,dl,v);}
  const t=layer.closest('.professional-card,.perla-cat-item')?.querySelector('.perla-more-btn');if(t)t.hidden=!layer.querySelector('p,dd');}
 function setOpen(card,open,{focus=false}={}){
  const t=card.querySelector('.perla-more-btn'),layer=card.querySelector(':scope>.perla-detail');if(!t||!layer)return;
  if(open)for(const c of $$('.perla-compact.perla-open'))if(c!==card)setOpen(c,false);
  t.setAttribute('aria-expanded',String(open));layer.hidden=!open;card.classList.toggle('perla-open',open);t._label?.();
  if(focus)t.focus({preventScroll:true});
 }
 document.addEventListener('keydown',e=>{if(e.key!=='Escape')return;const c=document.activeElement?.closest?.('.perla-open');if(c){e.preventDefault();e.stopPropagation();setOpen(c,false,{focus:true});}},true);
 document.addEventListener('click',e=>{for(const c of $$('.perla-compact.perla-open'))if(!c.contains(e.target))setOpen(c,false);},true);

 // ── Formato y requisitos por tarjeta del índice (lo que el detalle debe conservar) ──
 const CARD_META={
  'surface-sheet':[['PDF (Imprimir / Guardar PDF)','PDF (Print / Save PDF)','PDF（打印/另存为 PDF）'],['Un proyecto con estancias.','A project with rooms.','有房间的项目。']],
  sheet:[['SVG («Descargar SVG»)','SVG («Download SVG»)','SVG（“下载 SVG”）'],['Estancias; a escala, con el plano calibrado.','Rooms; to scale, with a calibrated plan.','房间；按比例需校准平面。']],
  dossier:[['PDF (Imprimir / Guardar PDF)','PDF (Print / Save PDF)','PDF（打印/另存为 PDF）'],['Un proyecto con estancias; las vistas y la firma lo completan.','A project with rooms; views and signature complete it.','有房间的项目；视图与签名使其完整。']],
  'economic-dossier':[['PDF (impresión) · CSV · JSON del informe · BC3','PDF (print) · CSV · report JSON · BC3','PDF（打印）· CSV · 报告 JSON · BC3'],['Presupuesto preparado en Presupuestar.','A budget prepared in Budget.','在预算中准备好的预算。']],
  'e3-entregas':[['Según el entregable elegido','Depends on the chosen deliverable','取决于所选交付物'],['Elegir, previsualizar y preparar.','Choose, preview and prepare.','选择、预览并准备。']],
  presentation:[['3D interactiva','Interactive 3D','交互式三维'],['Un proyecto con estancias.','A project with rooms.','有房间的项目。']],
  images:[['PNG','PNG','PNG'],['Plano 2D al pulsar; vistas 3D al prepararlas; Render IA con servicio y créditos.','2D plan on demand; 3D views once prepared; AI render with service and credits.','二维平面即时生成；三维视图需准备；AI 渲染需服务和额度。']],
  'construction-delivery':[['3D animado','Animated 3D','三维动画'],['Un plan de obra.','A construction plan.','施工计划。']],
  moodboard:[['PNG','PNG','PNG'],['Materiales y colores asignados.','Assigned materials and colours.','已指定的材料与颜色。']],
  'client-file':[['HTML de solo lectura · enlace (URL) con confirmación','Read-only HTML · link (URL) with confirmation','只读 HTML · 需确认的链接（URL）'],['El enlace exige confirmar la publicación.','The link requires confirming publication.','链接需确认发布。']],
  'blender-scene':[['ZIP · GLB (sin marca)','ZIP · GLB (no branding)','ZIP · GLB（无品牌）'],['Un proyecto con estancias en 3D.','A project with rooms in 3D.','有房间的三维项目。']],
  'bpdp-blueprint':[['Lámina PNG A3 200 ppp · vídeo MP4 1920 × 1080','PNG A3 sheet 200 ppi · MP4 video 1920 × 1080','PNG A3 图纸 200 ppi · MP4 视频 1920 × 1080'],['La vista 3D del proyecto activo; el vídeo, codificación H.264.','The active project in 3D; the video, H.264 encoding.','活动项目的三维视图；视频需 H.264 编码。']],
  'bpdp-despiece':[['Lámina PNG A3 200 ppp · vídeo MP4 1920 × 1080','PNG A3 sheet 200 ppi · MP4 video 1920 × 1080','PNG A3 图纸 200 ppi · MP4 视频 1920 × 1080'],['La vista 3D del proyecto activo; el vídeo, codificación H.264.','The active project in 3D; the video, H.264 encoding.','活动项目的三维视图；视频需 H.264 编码。']]};
 const metaFor=mod=>{const m=CARD_META[mod];return m?[[tx('Formato','Format','格式'),T(m[0])],[tx('Requisitos','Requirements','要求'),T(m[1])]]:[];};
 function compactIndex(){
  for(const card of $$('#professionalWorkspace .professional-index .professional-card, #professionalWorkspace [data-group="experience"] .bpdp-card')){
   const mod=card.dataset.module||'';
   const details=$$(':scope>p.professional-detail, :scope>.bpdp-card-body>p:not(.professional-state)',card);
   compact(card,{details,meta:metaFor(mod)});
  }
 }

 // ── Catálogo: cada salida con su generador real ──
 const views=()=>{try{return window.FloorPlanProjectViews?.current?.()||[];}catch{return [];}};
 // Plano 2D: el mismo generador que P2 (#exportPng en vista 2D); se vuelve a la vista que había, sin salir de Entregar.
 async function plan2d(){const was3d=document.body.classList.contains('m3d');if(was3d&&window.setView){await window.setView('2d');
  // exportPNG decide por la vista efectiva: se espera a que el editor esté de verdad en 2D (si no, haría una captura 3D).
  for(let i=0;i<60&&document.body.classList.contains('m3d');i++)await new Promise(r=>setTimeout(r,50));if(document.body.classList.contains('m3d'))throw Error(tx('No se pudo pasar a la vista 2D.','Could not switch to the 2D view.','无法切换到二维视图。'));}
  // La vista anterior vuelve cuando el generador anuncia que terminó («floorplan-export-ready»), no antes.
  if(was3d){let done=false;const back=()=>{if(done)return;done=true;window.setView?.('3d');};addEventListener('floorplan-export-ready',back,{once:true});setTimeout(back,90000);}
  $('#exportPng').click();}
 const route=r=>$(`#professionalWorkspace [data-route="${r}"]`);
 const call=(obj,fn,...a)=>{const o=window[obj];if(!o||typeof o[fn]!=='function')throw Error('sin generador');return o[fn](...a);};
 const stateOf=r=>$(`#professionalWorkspace [data-route="${r}"]`)?.closest('.professional-card')?.querySelector('.professional-state')?.textContent.trim()||'';
 const bp=(m,accion)=>origin=>window.BpdpEntregar?.abrir(m,{origen:origin,accion}).catch(e=>window.toast?.(e.message,6000));
 const bpState=m=>{const s=$('#bpdpState-'+m)?.textContent||'';return /Requiere la vista 3D|Requires the 3D/.test(s)?tx('Necesita la vista 3D','Needs the 3D view','需要三维视图'):tx('Candidata · revisión pendiente','Candidate · review pending','候选 · 待审核');};
 const bpNeeds3d=m=>{const s=$('#bpdpState-'+m)?.textContent||'';return /Requiere la vista 3D|Requires the 3D/.test(s);};
 // [id, grupo, tipo ('salida'|'acceso'), nombre, qué es, formato, requisitos, acción, estado, opciones]
 const S='salida',A='acceso';
 const CAT=()=>[
  ['superficies','docs',S,['Ficha de superficies','Area schedule','面积明细表'],['Superficies útiles por estancia, con la nota de miradores.','Usable area per room, with the bay-window note.','各房间使用面积，含凸窗说明。'],'PDF',CARD_META['surface-sheet'][1],{label:['Ver ficha','View schedule','查看明细'],run:()=>route('surface-sheet')?route('surface-sheet').click():call('FloorPlanSurfaceSheet','open')},()=>stateOf('surface-sheet'),[['Imprimir / Guardar PDF','Print / Save PDF','打印/另存为 PDF']]],
  ['lamina','docs',S,['Lámina profesional','Professional sheet','专业图纸'],['Plano a escala o ajustado a la hoja, con cajetín y tu firma.','Plan to scale or fitted to the sheet, with title block and your signature.','按比例或适配图幅的平面图，带图签与签名。'],'SVG',CARD_META.sheet[1],{label:['Abrir lámina','Open sheet','打开图纸'],run:()=>route('sheet')?route('sheet').click():call('FloorPlanSheet','open')},()=>stateOf('sheet'),[['Descargar SVG','Download SVG','下载 SVG']]],
  ['dossier','docs',S,['Dossier del proyecto','Project dossier','项目档案'],['Vistas, lámina, superficies, orientación y firma en un documento.','Views, sheet, areas, orientation and signature in one document.','视图、图纸、面积、朝向与签名合成一份文件。'],tx('PDF (impresión)','PDF (print)','PDF（打印）'),CARD_META.dossier[1],{label:['Preparar dossier','Prepare dossier','准备档案'],run:()=>route('dossier')?route('dossier').click():call('FloorPlanDossier','open')},()=>stateOf('dossier'),[['Imprimir / Guardar PDF','Print / Save PDF','打印/另存为 PDF']]],
  ['economico','docs',S,['Dossier económico','Economic dossier','经济档案'],['Presupuesto en versión profesional o para el cliente.','Budget in a professional or client version.','专业版或客户版预算。'],'PDF · CSV · JSON · BC3',CARD_META['economic-dossier'][1],{label:['Preparar dossier económico','Prepare economic dossier','准备经济档案'],run:()=>route('economic-dossier')?.click(),enabled:()=>!!route('economic-dossier')&&!route('economic-dossier').disabled},()=>stateOf('economic-dossier'),[['PDF mediante impresión','PDF by printing','通过打印生成 PDF'],['CSV','CSV','CSV'],['JSON del informe','Report JSON','报告 JSON'],['BC3','BC3','BC3']]],
  ['orientacion','docs',S,['Informe de orientación y emplazamiento','Orientation and site report','朝向与场地报告'],['El mismo informe que abre Analizar: norte, sol por estancias y emplazamiento.','The same report opened from Analyze: north, sun per room and site.','与“分析”中相同的报告：北向、各房间日照与场地。'],tx('PDF (impresión)','PDF (print)','PDF（打印）'),['La orientación real exige declarar el norte; sin norte, el informe lo indica.','Real orientation requires declaring north; without it, the report says so.','真实朝向需声明北向；未声明时报告会注明。'],{label:['Ver informe','View report','查看报告'],run:()=>call('FloorPlanSitePreview','openReport'),enabled:()=>!!window.FloorPlanSitePreview?.openReport},()=>tx('Disponible','Available','可用'),[['Imprimir / Guardar PDF','Print / Save PDF','打印/另存为 PDF']]],
  ['bp-lamina','docs',S,['Lámina Blueprint 3D','Blueprint 3D sheet','Blueprint 3D 图纸'],['Planta con cotas, alzados, sección y axonometría en A3.','Plan with dimensions, elevations, section and axonometric on A3.','A3 上的带尺寸平面、立面、剖面与轴测。'],tx('PNG A3 · 200 ppp','PNG A3 · 200 ppi','PNG A3 · 200 ppi'),['La vista 3D del proyecto activo. La escala 1:100 en papel se anunciará tras medir la impresión.','The active project in 3D. The 1:100 paper scale will be stated after measuring the print.','活动项目的三维视图。纸面 1:100 比例待实测打印后公布。'],{label:['Previsualizar lámina','Preview sheet','预览图纸'],run:bp('blueprint','lamina'),enabled:()=>!!window.BpdpEntregar},()=>bpState('blueprint'),[['Descargar PNG','Download PNG','下载 PNG']]],
  ['dp-lamina','docs',S,['Lámina Despiece 3D','3D exploded view sheet','3D 分解图纸'],['Despiece por sistemas y fases de montaje en A3.','Exploded view by system and assembly phases on A3.','A3 上按系统和装配阶段的分解图。'],tx('PNG A3 · 200 ppp','PNG A3 · 200 ppi','PNG A3 · 200 ppi'),['La vista 3D del proyecto activo.','The active project in 3D.','活动项目的三维视图。'],{label:['Previsualizar lámina','Preview sheet','预览图纸'],run:bp('despiece','lamina'),enabled:()=>!!window.BpdpEntregar},()=>bpState('despiece'),[['Descargar PNG','Download PNG','下载 PNG']]],
  ['plano-png','img',S,['Plano 2D','2D plan','二维平面'],['La planta activa tal como se ve, con cotas y nombres.','The active floor as shown, with dimensions and names.','当前楼层原样，含尺寸与名称。'],'PNG',['Un proyecto con estancias.','A project with rooms.','有房间的项目。'],{label:['Descargar PNG','Download PNG','下载 PNG'],run:plan2d,enabled:()=>!!$('#exportPng')},()=>tx('Se prepara al pulsar','Prepared on click','点击即生成'),[]],
  ['vistas','img',S,['Vistas reales del proyecto','Real project views','项目真实视图'],['Imágenes del 3D real, una por parada de la presentación, con tu firma.','Images of the real 3D, one per presentation stop, with your signature.','真实三维图像，每个演示停靠点一张，带签名。'],'PNG',['Se preparan desde el 3D del proyecto.','Prepared from the project 3D.','由项目三维生成。'],{label:['Preparar vistas','Prepare views','准备视图'],run:()=>route('prepare-views')?route('prepare-views').click():call('FloorPlanProjectViews','prepare'),enabled:()=>!route('prepare-views')?.disabled},()=>$('#professionalWorkspace .project-view-status')?.textContent.trim()||stateOf('images'),[]],
  ['render-ia','img',S,['Render IA','AI render','AI 渲染'],['Imágenes fotorrealistas a partir de tus vistas. Abrir no genera ni consume créditos.','Photorealistic images from your views. Opening neither generates nor uses credits.','由视图生成的逼真图像。打开不会生成或消耗额度。'],'PNG',['Una vista preparada del proyecto; servicio y créditos, que se confirman antes de generar.','A prepared project view; service and credits, confirmed before generating.','需已准备的项目视图；服务与额度在生成前确认。'],{label:['Abrir Render IA','Open AI render','打开 AI 渲染'],run:()=>call('FloorPlanAIRender','open',views()[0]),enabled:()=>!!window.FloorPlanAIRender&&views().length>0},()=>tx('Con condiciones','With conditions','有条件'),[]],
  ['moodboard','img',S,['Material board','Material board','材料板'],['Suelos, paredes y colores del proyecto en una lámina.','Project floors, walls and colours on one board.','项目的地面、墙面与颜色汇于一板。'],'PNG',CARD_META.moodboard[1],{label:['Ver material board','View material board','查看材料板'],run:()=>route('moodboard')?.click(),enabled:()=>!!route('moodboard')},()=>stateOf('moodboard'),[]],
  ['presentacion','anim',S,['Presentación 3D guiada','Guided 3D presentation','引导式 3D 展示'],['Recorrido guiado, dibujo vivo y sección.','Guided tour, living drawing and section.','导览、活绘与剖面。'],tx('3D interactiva','Interactive 3D','交互式三维'),['Un proyecto con estancias.','A project with rooms.','有房间的项目。'],{label:['Preparar presentación','Prepare presentation','准备演示'],run:()=>route('presentation')?route('presentation').click():call('FloorPlanPresentation','open')},()=>stateOf('presentation'),[]],
  ['video','anim',S,['Vídeo del recorrido','Tour video','漫游视频'],['Se graba desde la presentación con «Grabar vídeo».','Recorded from the presentation with «Record video».','在演示中通过“录制视频”录制。'],'WebM · MP4',['Inicia la presentación; el MP4 depende del navegador.','Start the presentation; MP4 depends on the browser.','先开始演示；MP4 取决于浏览器。'],{label:['Grabar vídeo','Record video','录制视频'],run:()=>window.FloorPlanPresentation&&!window.FloorPlanPresentation.active?call('FloorPlanPresentation','open'):call('FloorPlanTourVideo','open'),enabled:()=>!!window.FloorPlanTourVideo&&!!window.FloorPlanPresentation&&!!window.FloorPlanTourRecorder?.pickType?.()},()=>tx('Desde la presentación','From the presentation','来自演示'),[]],
  ['bp-visor','anim',S,['Blueprint 3D','Blueprint 3D','Blueprint 3D'],['Visor técnico: planta ortográfica con cotas, alzados, secciones y presentación.','Technical viewer: orthographic plan with dimensions, elevations, sections and presentation.','技术查看器：带尺寸正交平面、立面、剖面与演示。'],tx('3D interactiva','Interactive 3D','交互式三维'),['La vista 3D del proyecto activo.','The active project in 3D.','活动项目的三维视图。'],{label:['Abrir Blueprint','Open Blueprint','打开 Blueprint'],run:bp('blueprint',null),enabled:()=>!!window.BpdpEntregar},()=>bpState('blueprint'),[]],
  ['dp-visor','anim',S,['Despiece 3D','Exploded view 3D','3D 分解'],['Separa y vuelve a montar los componentes por sistemas.','Separates and reassembles components by system.','按系统拆分并重新组装构件。'],tx('3D interactiva','Interactive 3D','交互式三维'),['La vista 3D del proyecto activo.','The active project in 3D.','活动项目的三维视图。'],{label:['Abrir Despiece','Open exploded view','打开分解'],run:bp('despiece',null),enabled:()=>!!window.BpdpEntregar},()=>bpState('despiece'),[]],
  ['bp-video','anim',S,['Vídeo Blueprint 3D','Blueprint 3D video','Blueprint 3D 视频'],['Presentación técnica en vídeo con tu firma.','Technical presentation as a video with your signature.','带签名的技术演示视频。'],'MP4 1920 × 1080',['Vista 3D y codificación H.264 en este navegador.','3D view and H.264 encoding in this browser.','三维视图且本浏览器支持 H.264 编码。'],{label:['Preparar vídeo','Prepare video','准备视频'],run:bp('blueprint','video'),enabled:()=>!!window.BpdpEntregar},()=>bpState('blueprint'),[['Descargar MP4','Download MP4','下载 MP4']]],
  ['dp-video','anim',S,['Vídeo Despiece 3D','3D exploded view video','3D 分解视频'],['Montaje por fases en vídeo con tu firma.','Assembly by phases as a video with your signature.','带签名的分阶段装配视频。'],'MP4 1920 × 1080',['Vista 3D y codificación H.264 en este navegador.','3D view and H.264 encoding in this browser.','三维视图且本浏览器支持 H.264 编码。'],{label:['Preparar vídeo','Prepare video','准备视频'],run:bp('despiece','video'),enabled:()=>!!window.BpdpEntregar},()=>bpState('despiece'),[['Descargar MP4','Download MP4','下载 MP4']]],
  ['evolucion','anim',S,['Evolución de obra','Construction evolution','施工演变'],['La obra avanza por fases sobre el 3D del proyecto.','The works progress by phase on the project 3D.','在项目三维上分阶段推进施工。'],tx('3D animado','Animated 3D','三维动画'),CARD_META['construction-delivery'][1],{label:['Crear plan de obra','Create construction plan','创建施工计划'],run:()=>route('construction-plan-from-deliver')?.click(),enabled:()=>!!route('construction-plan-from-deliver')},()=>stateOf('construction-plan-from-deliver'),[]],
  ['archivo-cliente','cli',S,['Archivo para tu cliente','File for your client','客户文件'],['Archivo de solo lectura con vistas, lámina, superficies y observaciones.','Read-only file with views, sheet, areas and comments.','包含视图、图纸、面积与意见的只读文件。'],'HTML',['Sin servidor: se descarga en este equipo.','No server: downloads to this device.','无服务器：下载到本设备。'],{label:['Descargar archivo','Download file','下载文件'],run:()=>route('client-file')?.click(),enabled:()=>!!route('client-file')&&!route('client-file').disabled},()=>stateOf('client-file'),[]],
  ['enlace','cli',S,['Enlace para tu cliente','Link for your client','客户链接'],['Publicación con tu consentimiento y código; revocable.','Publication with your consent and code; revocable.','经你同意并凭代码发布，可撤销。'],'URL',['Confirmar la publicación antes de crear el enlace.','Confirm publication before the link is created.','创建链接前需确认发布。'],{label:['Publicar enlace…','Publish link…','发布链接…'],run:()=>route('client-link')?.click(),enabled:()=>!!route('client-link')&&!route('client-link').disabled},()=>tx('Requiere confirmación','Requires confirmation','需要确认'),[]],
  ['visita','cli',S,['Visita 3D interactiva','Interactive 3D visit','交互式三维参观'],['Prueba privada de cómo la verá tu cliente.','Private preview of how your client will see it.','私密预览客户将看到的效果。'],tx('3D interactiva (prueba privada)','Interactive 3D (private preview)','交互式三维（私密预览）'),['Un proyecto con estancias.','A project with rooms.','有房间的项目。'],{label:['Revisar como cliente','Review as client','以客户身份查看'],run:()=>$('#delivery3dPreview')?.click(),enabled:()=>!!$('#delivery3dPreview')},()=>tx('Prueba privada','Private preview','私密预览'),[]],
  ['proyecto','work',S,['Proyecto editable','Editable project','可编辑项目'],['Copia para seguir trabajando o compartir con otro profesional.','Copy to keep working or share with another professional.','用于继续工作或与其他专业人士共享的副本。'],'JSON',['Ninguno.','None.','无。'],{label:['Exportar proyecto','Export project','导出项目'],run:()=>$('#exportJson').click(),enabled:()=>!!$('#exportJson')},()=>tx('Listo','Ready','就绪'),[['JSON (también en Archivo ▾ del editor)','JSON (also in the editor File ▾ menu)','JSON（编辑器“文件”菜单中也有）']]],
  ['dxf','work',S,['DXF de la planta activa','Active floor DXF','当前楼层 DXF'],['Muros, huecos y estancias para CAD.','Walls, openings and rooms for CAD.','供 CAD 使用的墙体、洞口与房间。'],'DXF',['La planta activa con muros.','The active floor with walls.','有墙体的当前楼层。'],{label:['Exportar DXF','Export DXF','导出 DXF'],run:()=>$('#exportDxf').click(),enabled:()=>!!$('#exportDxf')},()=>tx('Se prepara al pulsar','Prepared on click','点击即生成'),[]],
  ['blender','work',S,['Escena para Blender','Scene for Blender','Blender 场景'],['La vivienda en 3D con medidas e identificadores, para render profesional; nunca lleva marca.','The home in 3D with dimensions and identifiers, for professional rendering; never branded.','带尺寸与标识的三维住宅，用于专业渲染；不含品牌。'],'ZIP · GLB',CARD_META['blender-scene'][1],{label:['Preparar escena…','Prepare scene…','准备场景…'],run:()=>$('#sceneExportOpen')?.click(),enabled:()=>!!$('#sceneExportOpen')},()=>tx('Herramienta de trabajo','Working tool','工作工具'),[]],
  ['e3','tools',A,['Preparar entregables','Prepare deliverables','准备交付物'],['Elige, previsualiza y prepara varios entregables a la vez.','Choose, preview and prepare several deliverables at once.','一次选择、预览并准备多个交付物。'],tx('Según lo elegido','Depends on the choice','取决于选择'),['Elegir, previsualizar y preparar.','Choose, preview and prepare.','选择、预览并准备。'],{label:['Preparar entregables','Prepare deliverables','准备交付物'],run:()=>route('e3-entregas')?.click(),enabled:()=>!!route('e3-entregas')},()=>tx('Acceso','Access','入口'),[]],
  ['presupuesto','tools',A,['Presupuesto','Budget','预算'],['Revisa precios y partidas en Presupuestar.','Review prices and items in Budget.','在“预算”中检查价格与条目。'],'—',['Ninguno.','None.','无。'],{label:['Revisar presupuesto','Review budget','检查预算'],run:()=>route('budget')?.click(),enabled:()=>!!route('budget')},()=>stateOf('budget'),[]],
  ['observaciones','tools',A,['Observaciones del cliente','Client comments','客户意见'],['Importa y gestiona lo que el cliente te devuelve.','Import and manage what the client sends back.','导入并处理客户反馈。'],'JSON',['Un archivo de observaciones del cliente.','A client comments file.','客户意见文件。'],{label:['Gestionar observaciones','Manage comments','管理意见'],run:()=>route('review')?.click(),enabled:()=>!!route('review')},()=>stateOf('review'),[]],
  ['revision-render','tools',A,['Revisión del render','Render review','渲染审核'],['Compara el render de Blender con el proyecto.','Compares the Blender render with the project.','将 Blender 渲染与项目对比。'],'—',['Un render importado.','An imported render.','已导入的渲染。'],{label:['Revisar render…','Review render…','审核渲染…'],run:()=>$('#blenderReviewOpen')?.click(),enabled:()=>!!$('#blenderReviewOpen')},()=>tx('Herramienta de trabajo','Working tool','工作工具'),[]],
  ['comparar','tools',A,['Comparar con el original','Compare with the original','与原方案比较'],['Variantes del proyecto frente al original.','Project variants against the original.','项目变体与原方案对比。'],'—',['Una variante guardada.','A saved variant.','已保存的变体。'],{label:['Abrir proyectos','Open projects','打开项目'],run:()=>route('compare-projects')?.click(),enabled:()=>!!route('compare-projects')},()=>stateOf('compare-projects'),[]],
  ['hero','tools',A,['Personalización HERO FINAL','HERO FINAL customisation','HERO FINAL 定制'],['El cierre de tus entregas, en Mi estudio.','The closing of your deliveries, in My studio.','在“我的事务所”中设置交付收尾。'],'—',['Ninguno.','None.','无。'],{label:['Personalizar en Mi estudio','Customise in My studio','在我的事务所中定制'],run:()=>route('studio-hero')?.click(),enabled:()=>!!route('studio-hero')},()=>stateOf('studio-hero'),[]],
  ['identidad','tools',A,['Identidad de la entrega','Delivery identity','交付身份'],['La firma con la que salen tus documentos.','The signature your documents carry.','文件所带的签名。'],'—',['Ninguno.','None.','无。'],{label:['Configurar Mi estudio','Set up My studio','设置我的事务所'],run:()=>route('studio')?.click(),enabled:()=>!!route('studio')},()=>stateOf('studio'),[]]];
 const GROUPS=()=>[['docs',tx('Documentación profesional','Professional documentation','专业文档')],['img',tx('Imágenes y render','Images and render','图像与渲染')],['anim',tx('Presentaciones y animaciones','Presentations and animations','演示与动画')],['cli',tx('Para tu cliente','For your client','给客户')],['work',tx('Exportaciones de trabajo','Working exports','工作导出')],['tools',tx('Herramientas y accesos (no son salidas)','Tools and access points (not outputs)','工具与入口（非输出）')]];
 window.FloorPlanPerlaCatalog=Object.freeze({entries:()=>CAT().map(([id,g,kind,name,que,format,req])=>({id,group:g,kind,name:T(name),format:T(format),requirements:T(req)}))});

 let catOpen=false,catFocus=null;
 function buildCatalog(index){
  let toggle=$('#perlaCatToggle'),panel=$('#perlaCatalog');
  const count=index.querySelector(':scope>.professional-count');
  if(!toggle){toggle=el('button','btn perla-cat-toggle');toggle.id='perlaCatToggle';toggle.type='button';toggle.setAttribute('aria-controls','perlaCatalog');
   toggle.onclick=()=>{catOpen=!catOpen;toggle._paint(true);};}
  // Delante del recuento: «arrange» de Entregar encadena recuento → grupos y movería lo que se ponga detrás.
  const head=index.querySelector(':scope>h2');if(head&&head.nextElementSibling!==toggle)head.after(toggle);
  if(!panel){panel=el('div','perla-catalog');panel.setAttribute('role','region');panel.id='perlaCatalog';panel.setAttribute('aria-labelledby','perlaCatTitle');}
  if(panel.previousElementSibling!==toggle)toggle.after(panel);
  function signature(items){return [catOpen,L(),...items.map(e=>{let s='',on=true;try{s=e[8]()||'';}catch{}try{on=e[7].enabled?e[7].enabled():true;}catch{on=false;}return e[0]+'|'+s+'|'+on;})].join('\n');}
  function paint(force){
   const items=CAT(),out=items.filter(e=>e[2]===S).length,acc=items.length-out;
   const sig=signature(items);if(!force&&panel._sig===sig&&(catOpen?panel.childElementCount>0:panel.hidden))return;panel._sig=sig;
   toggle.setAttribute('aria-expanded',String(catOpen));
   toggle.textContent=catOpen?tx('Ocultar el catálogo','Hide the catalogue','隐藏目录'):tx('Ver todos los documentos y entregables','View all documents and deliverables','查看全部文件与交付物');
   panel.hidden=!catOpen;if(!catOpen){panel.replaceChildren();return;}
   const keepFocus=document.activeElement&&panel.contains(document.activeElement)?document.activeElement.dataset.perlaAction:catFocus;
   panel.replaceChildren();
   const h=el('h3',undefined,panel,tx('Todos los documentos y entregables','All documents and deliverables','全部文件与交付物'));h.id='perlaCatTitle';
   el('p','perla-cat-count',panel,tx(`${out} salidas · ${acc} herramientas y accesos`,`${out} outputs · ${acc} tools and access points`,`${out} 项输出 · ${acc} 个工具与入口`));
   for(const[g,gname]of GROUPS()){const list=items.filter(e=>e[1]===g);if(!list.length)continue;
    const sec=el('div','perla-cat-group',panel);sec.setAttribute('role','group');sec.dataset.catGroup=g;const gh=el('h4',undefined,sec,gname);gh.id='perlaCatG-'+g;sec.setAttribute('aria-labelledby',gh.id);
    const grid=el('div','perla-cat-grid',sec);grid.setAttribute('role','list');
    for(const[id,,kind,name,que,format,req,act,state,opts]of list){
     const it=el('article','perla-cat-item',grid);it.setAttribute('role','listitem');it.dataset.catId=id;it.dataset.kind=kind;
     el('h5',undefined,it,T(name));
     const st=el('p','professional-state',it);let s='';try{s=state()||'';}catch{}st.textContent=s||tx('Disponible','Available','可用');
     el('span','perla-cat-format',it,T(format));
     let enabled=true;try{enabled=act.enabled?act.enabled():true;}catch{enabled=false;}
     const b=el('button','btn perla-cat-action',it,T(act.label));b.type='button';b.dataset.perlaAction=id;b.disabled=!enabled;
     // Requisito a la vista cuando condiciona la acción (no escondido en el detalle).
     const needs=!enabled||/^bp-|^dp-/.test(id)&&bpNeeds3d(id.startsWith('bp')?'blueprint':'despiece');
     if(needs){const r=el('p','perla-cat-req',it,tx('Requisito: ','Requirement: ','要求：')+T(req));b.setAttribute('aria-describedby',idFor(r));}
     b.onclick=()=>{catFocus=id;launched=id;try{const r=act.run(b);if(r&&r.then)r.catch(e=>window.toast?.(e.message,6000));}catch(e){window.toast?.(e.message,6000);}};
     const desc=el('p','perla-cat-desc',null,T(que));
     compact(it,{details:[desc],meta:[[tx('Formato','Format','格式'),T(format)],[tx('Requisitos','Requirements','要求'),T(req)],...(opts?.length?[[tx('Opciones','Options','选项'),opts.map(T).join(' · ')]]:[])]});
    }}
   if(keepFocus)panel.querySelector(`[data-perla-action="${keepFocus}"]`)?.focus({preventScroll:true});
  }
  toggle._paint=paint;paint(false);
 }

 // ── Maqueta PERLA c96888ac (docs/qa/rubik-perla-premium-c96888ac en codex/rubik-perla-premium-c96888ac @ 87f8d7e9) ──
 // Ficha: portada, título, una línea, estado con color (listo / al pulsar / falta) y UNA acción a la vista; toda la ficha
 // abre el panel. El panel reúne descripción completa, estado, lo que necesita, formato, la imagen y TODAS las acciones de
 // la ficha (cada botón del panel pulsa el control real, que sigue en el DOM). No se elimina ningún entregable ni acción.
 const REF={
  D1:[['Superficie útil por estancia, lista para imprimir.','Usable area per room, ready to print.','各房间使用面积，可直接打印。'],['Ninguna','None','无'],['Ficha real de la vivienda de ejemplo','Real schedule of the example home','示例住宅的真实明细表']],
  D2:[['Plano de distribución con acabados, cotas y tu cajetín.','Layout plan with finishes, dimensions and your title block.','带饰面、尺寸和图签的布局图。'],['Firma (opcional) en Mi estudio','Signature (optional) in My studio','我的工作室中的签名（可选）'],['Lámina real de la vivienda de ejemplo','Real sheet of the example home','示例住宅的真实图纸']],
  D3:[['Portada, plano, superficies, orientación y exterior en un documento.','Cover, plan, areas, orientation and exterior in one document.','封面、平面、面积、朝向与外部合为一份文件。'],['Imágenes 3D y observaciones completan las secciones restantes','3D images and comments complete the remaining sections','三维图像与意见补全其余章节'],['Portada real del dossier','Real dossier cover','档案的真实封面']],
  D4:[['El presupuesto en versión para el cliente.','The budget in a client version.','客户版预算。'],['S1 Presupuesto con precios','S1 Budget with prices','S1 带价格的预算'],['Ejemplo de estructura · sin importes inventados','Structure example · no invented amounts','结构示例 · 无虚构金额']],
  D5:[['Paquete por pasos: elegir, previsualizar y preparar.','Step-by-step package: choose, preview and prepare.','分步打包：选择、预览、准备。'],['Según el entregable','Depends on the deliverable','取决于交付物'],['Configurador E3 real','Real E3 configurator','真实的 E3 配置器']],
  P1:[['Recorrido guiado por la vivienda, con «Grabar vídeo».','Guided tour of the home, with «Record video».','住宅导览，可“录制视频”。'],['Ninguna','None','无'],['Vista 3D real de la vivienda de ejemplo','Real 3D view of the example home','示例住宅的真实三维视图']],
  P2:[['Vista general y estancias a color, limpias o con tu firma.','Overview and rooms in colour, clean or with your signature.','彩色总览与房间，无标记或带签名。'],['La vista 3D para preparar las 5 vistas','The 3D view to prepare the 5 views','需三维视图来准备 5 个视图'],['Vistas reales generadas con «Preparar 5 vistas»','Real views made with «Prepare 5 views»','用“准备 5 个视图”生成的真实视图']],
  P3:[['Tu cliente recorre la vivienda a la altura de los ojos.','Your client walks the home at eye level.','客户以视线高度漫游住宅。'],['Publicar el enlace requiere tu consentimiento','Publishing the link requires your consent','发布链接需你同意'],['Recorrido real de la vivienda de ejemplo','Real walkthrough of the example home','示例住宅的真实漫游']],
  P4:[['La obra día a día, sincronizada con su plan.','The works day by day, synced with its plan.','逐日施工，与计划同步。'],['Plan de obra (Presupuestar → Plan de obra)','Construction plan (Budget → Construction plan)','施工计划（预算 → 施工计划）'],['Ejemplo: demo con el plan de la vivienda de ejemplo','Example: demo with the example home plan','示例：示例住宅计划的演示']],
  P5:[['Suelos y mobiliario reales del proyecto en una lámina.','Real project floors and furniture on one board.','项目真实地面与家具汇于一板。'],['Ninguna','None','无'],['Material board real','Real material board','真实材料板']],
  P6:[['Cómo termina tu presentación, con tu firma.','How your presentation ends, with your signature.','演示的结尾，带你的签名。'],['Firma en Mi estudio','Signature in My studio','我的工作室中的签名'],['Ejemplo: cierre con un estudio ficticio','Example: ending with a fictitious studio','示例：虚构工作室的结尾']],
  P7:[['Un HTML que abre sin conexión y le permite dejarte observaciones.','An HTML file that opens offline and lets them leave you comments.','可离线打开并可留下意见的 HTML。'],['Publicar el enlace requiere tu confirmación','Publishing the link requires your confirmation','发布链接需你确认'],['Portada real del archivo descargado','Real cover of the downloaded file','下载文件的真实封面']],
  P8:[['Planta, cotas, alzados y secciones sobre el 3D del proyecto.','Plan, dimensions, elevations and sections on the project 3D.','基于项目三维的平面、尺寸、立面与剖面。'],['La vista 3D abierta','The 3D view open','打开三维视图'],['Portada de la Home · captura real de Blueprint 3D','Home cover · real Blueprint 3D capture','首页封面 · Blueprint 3D 真实截图']],
  P9:[['Cómo se separa y se monta la vivienda, pieza a pieza.','How the home comes apart and goes together, piece by piece.','住宅如何逐件拆分与组装。'],['La vista 3D abierta','The 3D view open','打开三维视图'],['Portada de la Home · captura real de Despiece 3D','Home cover · real Exploded 3D capture','首页封面 · 拆解三维真实截图']],
  S1:[['Partidas desde las cantidades del proyecto, con tus precios.','Items from the project quantities, with your prices.','根据项目数量与你的价格生成条目。'],['Tus precios','Your prices','你的价格'],['Presupuestar real','Real Budget area','真实的预算区']],
  S2:[['Lo que te devuelve el cliente, anclado al plano.','What your client sends back, pinned to the plan.','客户反馈，锚定在平面上。'],['El cliente responde desde P7','The client replies from P7','客户通过 P7 回复'],['Gestor real (sin comentarios inventados)','Real manager (no invented comments)','真实管理器（无虚构意见）']],
  T1:[['Paquete técnico ZIP con la escena 3D, medidas e identificadores. No es un vídeo.','Technical ZIP package with the 3D scene, dimensions and identifiers. It is not a video.','含三维场景、尺寸与标识的技术 ZIP 包。不是视频。'],['La vista 3D abierta','The 3D view open','打开三维视图'],['Render Cycles real de la vivienda de ejemplo','Real Cycles render of the example home','示例住宅的真实 Cycles 渲染']],
  T2:[['Antes y después, cambios reales y presupuesto de cada revisión.','Before and after, real changes and the budget of each revision.','前后对比、真实变更与每次修订的预算。'],['Crear una variante en Proyectos','Create a variant in Projects','在项目中创建变体'],['Original real · la variante aún no existe','Real original · the variant does not exist yet','真实原版 · 变体尚不存在']]};
 const GROUP_SUB={documentation:['Lo que se imprime o se archiva','What gets printed or archived','用于打印或归档'],experience:['Lo que verá y recibirá','What they will see and receive','客户将看到和收到的'],coordination:['Precios y respuesta del cliente','Prices and client response','价格与客户反馈'],tools:['No son para el cliente','Not for the client','不提供给客户']};
 const BPDP={blueprint:['P8','assets/welcome/demo-blueprint-3d.webp'],despiece:['P9','assets/welcome/demo-despiece-3d.webp']};
 const PRIMARY={P2:/5 vistas|5 views|5 个视图/};
 const narrow=()=>matchMedia('(max-width:1100px)').matches;
 const bodyOf=c=>c.querySelector(':scope>.body, :scope>.bpdp-card-body');
 // Todas las acciones de la ficha, también las que otros módulos añaden fuera de su cuerpo (Reformar desde fotografía, Estudio de imágenes…)
 const actionsOf=c=>$$('button, a[href]',c).filter(b=>!b.matches('.perla-card-selector,.perla-more-btn')&&!b.closest('.thumb'));
 function pillOf(code,card){const st=(card.querySelector('.professional-state')?.textContent||'').trim();
  if(code==='D5'){let n=0;try{n=(window.RubikE3Entregables?.catalogo?.()||[]).filter(i=>i.disponible).length;}catch{}return ['ok',tx(`${n} entregables disponibles`,`${n} deliverables available`,`${n} 项交付物可用`)];}
  if(code==='P3')return ['pend',tx('Prueba privada · no se publica','Private test · not published','私密测试 · 不发布')];
  if(code==='T1'||code==='P8'||code==='P9'){const ok3d=document.body.classList.contains('m3d')&&!/Requiere la vista 3D|Requires the 3D/.test(st);return ['pend',ok3d?tx('Se prepara al pulsar','Prepared on demand','点击时准备'):tx('Requiere la vista 3D abierta','Requires the 3D view open','需要打开三维视图')];}
  if(code==='P2'){let n=0;try{n=(window.FloorPlanProjectViews?.current?.()||[]).length;}catch{}return [n?'ok':'pend',st];}
  if(/Requiere|Necesita|Requires|Needs|Sin presupuesto|No budget|Sin firma|No signature|Sin variantes|No variants|^0 de|^0 of|no disponible|not available|sin precio|without price|unpriced|需要|没有|未选|尚未准备|尚未选择|无价格/i.test(st))return ['req',st];
  if(/Lista|Listo|Ready|disponible|available|m²|estancias|rooms|suelos|floors|就绪|房间|可供|可发送|单层|地面/i.test(st))return ['ok',st];
  return ['pend',st];}
 function tile(card){const code=card.dataset.entregaCode;if(!REF[code])return;card.classList.add('perla-ref');const body=bodyOf(card);if(!body)return;
  // Portada honesta: es una imagen de la vivienda de ejemplo; en otro proyecto (o en P2 sin vistas preparadas) lo dice.
  const th=card.querySelector(':scope>.thumb');if(th){let ex=false;try{ex=window.FloorPlanGuideUI?.state?.()?.kind==='example';}catch{}
   const noViews=code==='P2'&&!(window.FloorPlanProjectViews?.current?.()||[]).length;const need=!ex||noViews;
   let tag=th.querySelector(':scope>.tag-ej');if(need&&!tag){tag=el('span','tag-ej perla-tag-ej',th);}
   if(tag?.classList.contains('perla-tag-ej')){if(!need)tag.remove();else{const t=tx('Ejemplo','Example','示例');if(tag.textContent!==t)tag.textContent=t;}}}
  const [k,txt]=pillOf(code,card);card.dataset.perlaPill=k;
  let desc=body.querySelector(':scope>.perla-desc');if(!desc)desc=el('p','perla-desc',body);const d=T(REF[code][0]);if(desc.textContent!==d)desc.textContent=d;
  let meta=body.querySelector(':scope>.perla-meta');if(!meta){meta=el('div','perla-meta',body);el('span','perla-pill',meta);}
  const pill=meta.firstChild;if(pill.className!=='perla-pill '+k)pill.className='perla-pill '+k;if(pill.textContent!==txt)pill.textContent=txt;
  const acts=actionsOf(card),pri=acts.find(b=>code==='P2'&&b.dataset.route==='prepare-views')||acts.find(b=>PRIMARY[code]?.test(b.textContent))||acts[0];
  for(const b of acts)b.classList.toggle('perla-go',b===pri);
  let sel=body.querySelector(':scope>.perla-card-selector');
  if(!sel){sel=el('button','btn perla-card-selector professional-card-details',body,tx('Ver detalles','View details','查看详情'));sel.type='button';}
  const label=tx('Ver detalles','View details','查看详情')+' · '+code+' '+(card.querySelector('h3')?.textContent||'')+': '+txt;if(sel.getAttribute('aria-label')!==label)sel.setAttribute('aria-label',label);
  if(!sel.hasAttribute('aria-pressed'))sel.setAttribute('aria-pressed',String(selCard===card));}
 function bpdpTile(card){const m=card.id.replace('bpdpCard-','');const b=BPDP[m];if(!b)return;card.dataset.entregaCode=b[0];card.classList.add('perla-tile');
  if(!card.querySelector(':scope>.thumb')){const th=el('div','thumb',null);const i=el('img',undefined,th);i.src=b[1];i.alt='';i.loading='lazy';el('span','code',th,b[0]);card.prepend(th);}
  tile(card);}
 function groupHeads(index){for(const g of $$(':scope>.professional-delivery-group',index)){const s=GROUP_SUB[g.dataset.group];if(!s)continue;
  let p=g.querySelector(':scope>.perla-group-sub');if(!p){p=el('p','perla-group-sub',null);(g.querySelector(':scope>.professional-count')||g.querySelector('h2'))?.after(p);}const t=T(s);if(p.textContent!==t)p.textContent=t;}}
 const HERO_NAMES={D1:['ficha','area schedule','面积表'],D2:['lámina','sheet','图纸'],P1:['presentación 3D','3D presentation','三维演示'],P5:['material board','material board','材料板'],P7:['archivo para tu cliente','client file','客户文件'],P2:['imágenes','images','图像'],D3:['dossier del proyecto','project dossier','项目档案'],S1:['precios del presupuesto','budget prices','预算价格'],P4:['plan de obra','construction plan','施工计划']};
 const joinList=a=>a.length<2?a.join(''):a.slice(0,-1).join(', ')+tx(' y ',' and ','和')+a[a.length-1];
 function heroList(){const ul=$('#professionalWorkspace .hero-ent .listo');if(!ul)return;const g={ok:[],pend:[],req:[]};
  for(const[code,n]of Object.entries(HERO_NAMES)){const c=$(`#professionalWorkspace .professional-index [data-entrega-code="${code}"]`);if(c)g[c.dataset.perlaPill||'pend'].push(T(n));}
  const rows=[['ok',tx('Listo','Ready','就绪')],['pend',tx('Al pulsar','On demand','点击时')],['req',tx('Falta','Missing','缺少')]].filter(([k])=>g[k].length);
  const sig=JSON.stringify([rows,g]);if(ul.dataset.sig===sig)return;ul.dataset.sig=sig;ul.replaceChildren();
  for(const[k,l]of rows){const li=el('li',undefined,ul);el('span','perla-pill '+k,li,l);const t=joinList(g[k]);el('span',undefined,li,t.charAt(0).toUpperCase()+t.slice(1));}}
 // Panel (escritorio: lateral fijo; teléfono y tableta: hoja inferior sobre un velo)
 let selCard=null,lastMirror=null,returnCard=null;
 const deskPanel=()=>$('#professionalWorkspace .mesa .panel');
 function velo(){const mesa=$('#professionalWorkspace .mesa');if(!mesa)return null;let v=mesa.querySelector(':scope>.perla-velo');if(!v){v=el('div','perla-velo',mesa);v.hidden=true;v.onclick=()=>closePanel(true);}return v;}
 function emptyPanel(p){p.replaceChildren();const h=el('h3','vacio-panel',p,tx('Elige un entregable','Choose a deliverable','选择交付物'));el('p','perla-vacio-txt',h,tx('Verás aquí qué recibirá tu cliente, su estado y sus opciones, sin salir de Entregar.','Here you will see what your client will receive, its status and its options, without leaving Deliver.','在此查看客户将收到的内容、其状态和选项，无需离开交付。'));p.removeAttribute('aria-labelledby');}
 function pressed(){for(const s of $$('#professionalWorkspace .perla-ref .perla-card-selector'))s.setAttribute('aria-pressed',String(s.closest('.perla-ref')===selCard));}
 function openPanel(card){const p=deskPanel();if(!p||!card)return;selCard=card;pressed();const code=card.dataset.entregaCode,r=REF[code]||[];
  const head=el('div','panel-h');el('span','code perla-panel-code',head,code);const h=el('h2',undefined,head,card.querySelector('h3')?.textContent||'');h.id='perlaPanelT';
  const x=el('button','panel-x',head,'✕');x.type='button';x.setAttribute('aria-label',tx('Volver al índice','Return to index','返回索引'));x.onclick=()=>closePanel(true);
  const b=el('div','panel-b');const th=card.querySelector(':scope>.thumb');if(th){const prev=el('div','prev',b),c=th.cloneNode(true);c.querySelector('.code')?.remove();c.querySelectorAll('img').forEach(i=>i.loading='eager');prev.append(c);}
  if(r[0])el('p','perla-panel-desc',b,T(r[0]));
  const seen=new Set();const pillTxt=card.querySelector('.perla-pill')?.textContent.trim();for(const n of $$('p:not(.perla-desc):not(.perla-pill), figcaption, small',card)){const t=n.textContent.trim();if(!t||t===pillTxt||seen.has(t)||n.closest('.perla-meta,.thumb'))continue;seen.add(t);el('p','perla-panel-more',b,t);}
  const dl=el('dl',undefined,b);const row=(k,v,node)=>{el('dt',undefined,dl,k);const dd=el('dd',undefined,dl);node?dd.append(node):dd.textContent=v;};
  row(tx('Estado','Status','状态'),null,card.querySelector('.perla-pill')?.cloneNode(true));
  if(r[1])row(tx('Necesita','Needs','需要'),T(r[1]));
  const m=CARD_META[card.dataset.module||''];if(m)row(tx('Formato','Format','格式'),T(m[0]));
  if(r[2])row(tx('Imagen','Image','图像'),T(r[2]));
  row(tx('Al cerrar','On close','关闭后'),tx('Vuelves a esta tarjeta del índice','You return to this index card','返回此索引卡片'));
  const f=el('div','panel-f');const acts=actionsOf(card);acts.sort((a,c)=>(c.classList.contains('perla-go')?1:0)-(a.classList.contains('perla-go')?1:0));
  for(const a of acts){const mb=el('button','btn'+(a.classList.contains('perla-go')?' primary':''),f,a.textContent.trim());mb.type='button';mb.disabled=!!a.disabled;mb.dataset.perlaMirror=a.dataset.route||a.id||'';
   // En teléfono y tableta la hoja se cierra antes de lanzar la acción (no queda un velo encima); al volver, foco en la ficha.
   mb.onclick=()=>{lastMirror={text:mb.textContent,route:mb.dataset.perlaMirror};if(narrow()){returnCard=card;closePanel(false);}a.click();};}
  p.replaceChildren(head,b,f);p.setAttribute('aria-labelledby','perlaPanelT');p.tabIndex=-1;p.hidden=false;p.classList.add('perla-panel-open');
  const v=velo();if(v)v.hidden=!narrow();p.focus({preventScroll:true});if(!narrow())p.scrollIntoView({block:'nearest'});}
 function closePanel(focus){const p=deskPanel(),c=selCard;selCard=null;lastMirror=null;pressed();if(p){emptyPanel(p);p.classList.remove('perla-panel-open');}const v=velo();if(v)v.hidden=true;
  if(focus&&c?.isConnected)c.querySelector('.perla-card-selector')?.focus({preventScroll:true});}
 // Toda la ficha (su selector cubre la tarjeta) abre el panel; el de Codex no llega a ejecutarse: este lo sustituye.
 document.addEventListener('click',e=>{const s=e.target.closest?.('#professionalWorkspace .perla-ref .perla-card-selector');if(!s)return;e.stopPropagation();e.preventDefault();
  const c=s.closest('.perla-ref');if(selCard===c&&deskPanel()?.classList.contains('perla-panel-open'))closePanel(true);else openPanel(c);},true);
 document.addEventListener('keydown',e=>{if(e.key!=='Escape'||!selCard||document.querySelector('dialog[open]'))return;const p=deskPanel();
  if(narrow()||p?.contains(document.activeElement)||selCard.contains(document.activeElement)){e.preventDefault();e.stopPropagation();closePanel(true);}},true);
 // Al cerrar el generador, el panel se actualiza (el estado pudo cambiar) y el foco vuelve a su botón.
 document.addEventListener('close',()=>setTimeout(()=>{if(!selCard&&returnCard&&!document.querySelector('dialog[open]')){const c=returnCard,a=document.activeElement;returnCard=null;
   if(c.isConnected&&(!a||a===document.body||a.offsetParent===null||!a.isConnected))c.querySelector('.perla-card-selector')?.focus({preventScroll:true});return;}
  if(!selCard||!deliverOpen()||document.querySelector('dialog[open]'))return;
  // Entregar se repinta al cerrar algunos generadores (y lleva el foco a su título): se recupera la ficha por su código.
  if(!selCard.isConnected){const n=$(`#professionalWorkspace .professional-index [data-entrega-code="${selCard.dataset.entregaCode}"]`);if(n)selCard=n;}
  const a=document.activeElement;if(a&&a!==document.body&&a.id!=='professionalTitle'&&a!==deskPanel()&&a.offsetParent!==null&&a.isConnected)return;const t=lastMirror;
  if(selCard.isConnected)openPanel(selCard);const bs=[...(deskPanel()?.querySelectorAll('.panel-f .btn')||[])],mb=t&&(bs.find(b=>t.route&&b.dataset.perlaMirror===t.route)||bs.find(b=>b.textContent===t.text));(mb||deskPanel())?.focus({preventScroll:true});},60),true);
 // Barra inferior del teléfono: el producto ya tiene la suya (.professional-dock, mismo atajo de P7); solo cambia su color.
 function maqueta(index){
  for(const c of $$('#professionalWorkspace .professional-index .professional-card[data-entrega-code]'))if(c.querySelector(':scope>.thumb'))tile(c);
  for(const c of $$('#professionalWorkspace .professional-index .bpdp-card'))bpdpTile(c);
  groupHeads(index);heroList();
  const e3=index.querySelector(':scope>.professional-full-catalog>summary');if(e3){const t=tx('Preparación directa · entregables profesionales (E3)','Direct preparation · professional deliverables (E3)','直接准备 · 专业交付物 (E3)');if(e3.textContent!==t)e3.textContent=t;}
  const p=deskPanel();if(p&&!selCard&&!p.querySelector('.perla-vacio-txt'))emptyPanel(p);
  if(selCard&&!selCard.isConnected){const code=selCard.dataset.entregaCode;const n=$(`#professionalWorkspace .professional-index [data-entrega-code="${code}"]`);selCard=n||null;if(!n)closePanel(false);else pressed();}
  // Si Entregar se repintó con el panel abierto, el panel vuelve con su ficha (mismo contenido actualizado).
  if(selCard&&p&&!p.querySelector('.perla-panel-code'))openPanel(selCard);}

 // ── Aplicar al pintar Entregar (idempotente; no reordena lo que ya está en su sitio) ──
 let pending=false;
 function apply(){pending=false;if(!deliverOpen())return;const index=$('#professionalWorkspace .professional-index');if(!index)return;
  mo.disconnect();try{maqueta(index);compactIndex();buildCatalog(index);}finally{mo.observe(document.body,{childList:true,subtree:true});}}
 // Home · «Módulos para tu trabajo»: la misma ficha compacta. El detalle conserva qué es, qué no es y sus condiciones
 // (privacidad y créditos incluidos); estado, título, acción y el aviso que condiciona la acción siguen a la vista.
 let homePending=false;
 function compactHome(){homePending=false;const lis=$$('.welcome-modules-grid > li.ai-service:not([data-perla-compact])');if(!lis.length)return;
  mo.disconnect();try{for(const li of lis){const more=li.querySelector(':scope>.ai-service-more');const details=[li.querySelector(':scope>.ai-service-what'),...(more?$$(':scope>p',more):[])].filter(Boolean);
   compact(li,{details});if(more)more.hidden=true;}}finally{mo.observe(document.body,{childList:true,subtree:true});}}
 const mo=new MutationObserver(()=>{if(!pending&&deliverOpen()){pending=true;requestAnimationFrame(apply);}
  if(!homePending&&document.querySelector('.welcome-modules-grid > li.ai-service:not([data-perla-compact])')){homePending=true;requestAnimationFrame(compactHome);}});
 mo.observe(document.body,{childList:true,subtree:true});compactHome();
 // Al volver de un diálogo el foco regresa a la ficha del catálogo; si Entregar se repintó, se recupera por id.
 let launched=null;
 document.addEventListener('close',()=>setTimeout(()=>{if(!deliverOpen()||!catOpen||!catFocus)return;if(document.querySelector('dialog[open]'))return;
  const a=document.activeElement,mine=$(`[data-perla-action="${catFocus}"]`);
  if(mine&&(launched===catFocus||!a||a===document.body||!a.isConnected)){mine.focus({preventScroll:true});mine.scrollIntoView({block:'nearest'});}launched=null;},60),true);
 new MutationObserver(()=>setTimeout(()=>{$('#perlaCatToggle')?._paint?.(true);for(const t of $$('.perla-more-btn'))t._label?.();if(deliverOpen()){const i=$('#professionalWorkspace .professional-index');if(i){mo.disconnect();try{maqueta(i);if(selCard)openPanel(selCard);}finally{mo.observe(document.body,{childList:true,subtree:true});}}}},0)).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
})();
