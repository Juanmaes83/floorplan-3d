/* STUDIO · E3 · Entregables profesionales — núcleo puro (UMD, sin DOM ni red).
 *
 * E3 NO compone firmas propias: la imagen firmada de RUBIK es la «imagen de entrega» de FloorPlanDeliveryImage
 * (content + compose: la información en su propia banda, nunca sobre la vivienda; logo incluido), la misma que ya usa
 * FloorPlanProjectViews.image()/download(). Este núcleo solo decide:
 *   - qué entregables existen y con qué generador EXISTENTE se preparan (catálogo);
 *   - cuáles están disponibles en esta versión (una selección nunca conserva un entregable sin generador);
 *   - con qué identidad se firma: la misma regla que FloorPlanProjectViews.image() — nombre y logo de FloorPlanBrand,
 *     contacto vacío (OP-05: nunca persona, teléfono, correo ni web en una imagen; no hay contrato de consentimiento de
 *     web en master);
 *   - el manifiesto de una salida firmada, que cita la limpia por su hash (la limpia nunca se reescribe).
 */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.RubikE3Core=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const VERSION='rubik-e3-entregas/2';
 /** `generador`: [objeto global, función] o ['#selector','click'] de RUBIK. `firma`:
  *   'imagen'   → limpia (bytes del generador) o firmada con FloorPlanDeliveryImage (E3 ofrece ambas);
  *   'producto' → el propio generador aplica la firma elegida en «Firmar con»;
  *   'nunca'    → salida técnica (escena de Blender y GLB): nunca lleva marca. */
 const CATALOGO=Object.freeze([
  {id:'vistas',grupo:'imagenes',nombre:['Vistas reales del proyecto','Real project views','项目真实视图'],que:['Imágenes del 3D real, una por parada de la presentación','Images of the real 3D, one per presentation stop','真实三维图像，每个演示停靠点一张'],generador:['FloorPlanProjectViews','prepare'],firma:'imagen',formato:'PNG'},
  {id:'render-ia',grupo:'imagenes',nombre:['Render IA','AI render','AI 渲染'],que:['Imágenes fotorrealistas a partir de tus vistas','Photorealistic images from your views','由视图生成的逼真图像'],generador:['FloorPlanAIRender','open'],firma:'producto',formato:'PNG'},
  {id:'blender',grupo:'imagenes',nombre:['Escena para Blender (OP-10)','Scene for Blender (OP-10)','Blender 场景（OP-10）'],que:['Paquete de escena y GLB para render profesional; la escena nunca lleva marca','Scene package and GLB for professional rendering; the scene never carries branding','用于专业渲染的场景包与 GLB；场景从不带标识'],generador:['RubikSceneExport','open'],firma:'nunca',formato:'ZIP · GLB'},
  {id:'lamina',grupo:'documentos',nombre:['Lámina a escala','Scaled sheet','比例图纸'],que:['Plano a escala con cajetín y tu firma','Scaled plan with title block and your signature','带图签和签名的比例图'],generador:['FloorPlanSheet','open'],firma:'producto',formato:'SVG'},
  {id:'superficies',grupo:'documentos',nombre:['Ficha de superficies','Area schedule','面积明细'],que:['Superficies útiles por estancia','Usable areas per room','各房间使用面积'],generador:['FloorPlanSurfaceSheet','open'],firma:'producto',formato:'PDF'},
  {id:'dossier',grupo:'documentos',nombre:['Dossier del proyecto','Project dossier','项目档案'],que:['Vistas, lámina, superficies, orientación y firma en un documento','Views, sheet, areas, orientation and signature in one document','视图、图纸、面积、朝向与签名合成一份文件'],generador:['FloorPlanDossier','open'],firma:'producto',formato:'PDF'},
  {id:'video',grupo:'animaciones',nombre:['Vídeo del recorrido','Tour video','漫游视频'],que:['Inicia la presentación y pulsa «Grabar vídeo».','Start the presentation and choose «Record video».','开始演示后选择“录制视频”。'],generador:['FloorPlanTourVideo','open'],firma:'producto',formato:'WebM · MP4'},
  {id:'presentacion',grupo:'animaciones',nombre:['Presentación 3D guiada','Guided 3D presentation','引导式 3D 展示'],que:['Recorrido guiado, dibujo vivo y sección','Guided tour, living drawing and section','导览、活绘与剖面'],generador:['FloorPlanPresentation','open'],firma:'producto',formato:'3D'},
  {id:'blueprint-lamina',grupo:'documentos',nombre:['Lámina Blueprint 3D','Blueprint 3D sheet','Blueprint 3D 图纸'],que:['Requiere la vista 3D del proyecto activo','Requires the active project in 3D','需要活动项目的三维视图'],generador:['BpdpEntregar','preparar'],bpdp:['blueprint','lamina'],firma:'producto',formato:'PNG · A3 · 200 ppp'},
  {id:'despiece-lamina',grupo:'documentos',nombre:['Lámina Despiece 3D','3D exploded view sheet','3D 分解图纸'],que:['Requiere la vista 3D del proyecto activo','Requires the active project in 3D','需要活动项目的三维视图'],generador:['BpdpEntregar','preparar'],bpdp:['despiece','lamina'],firma:'producto',formato:'PNG · A3 · 200 ppp'},
  {id:'blueprint-video',grupo:'animaciones',nombre:['Vídeo Blueprint 3D','Blueprint 3D video','Blueprint 3D 视频'],que:['Requiere vista 3D y codificación H.264','Requires 3D view and H.264 encoding','需要三维视图和 H.264 编码'],generador:['BpdpEntregar','preparar'],bpdp:['blueprint','video'],firma:'producto',formato:'MP4 · H.264 · 1080p'},
  {id:'despiece-video',grupo:'animaciones',nombre:['Vídeo Despiece 3D','3D exploded view video','3D 分解视频'],que:['Requiere vista 3D y codificación H.264','Requires 3D view and H.264 encoding','需要三维视图和 H.264 编码'],generador:['BpdpEntregar','preparar'],bpdp:['despiece','video'],firma:'producto',formato:'MP4 · H.264 · 1080p'},
  {id:'archivo-cliente',grupo:'cliente',nombre:['Archivo para tu cliente','File for your client','客户文件'],que:['Archivo de solo lectura con vistas, lámina, superficies y observaciones','Read-only file with views, sheet, areas and comments','包含视图、图纸、面积与意见的只读文件'],generador:['FloorPlanClientShare','download'],firma:'producto',formato:'HTML'},
  {id:'enlace',grupo:'cliente',nombre:['Enlace para tu cliente','Link for your client','客户链接'],que:['Publicación con tu consentimiento y código; revocable','Publication with your consent and code; revocable','经你同意并凭代码发布，可撤销'],generador:['FloorPlanShareLink','open'],firma:'producto',formato:'URL'}]);
 const GRUPOS=Object.freeze([['imagenes',['Imágenes y render','Images and render','图像与渲染']],['documentos',['Documentación profesional','Professional documentation','专业文档']],['animaciones',['Presentaciones y animaciones','Presentations and animations','演示与动画']],['cliente',['Para tu cliente','For your client','给客户']]]);
 const IDX={es:0,en:1,zh:2},t=(v,lang)=>Array.isArray(v)?v[IDX[lang]??0]:v;
 const PRIVADOS=Object.freeze(['person','phone','email','web']);
 function catalogo(lang='es'){return CATALOGO.map(e=>({...e,nombre:t(e.nombre,lang),que:t(e.que,lang)}));}
 function grupos(lang='es'){return GRUPOS.map(([id,n])=>({id,nombre:t(n,lang)}));}
 /** Selección efectiva: solo entregables del catálogo cuyo generador existe. `existe(generador)` lo decide el navegador. */
 function seleccionValida(sel,existe){const ok=new Set(CATALOGO.filter(e=>existe(e.generador)).map(e=>e.id));return [...new Set(sel||[])].filter(id=>ok.has(id));}
 /** Identidad de la firma de una imagen: la MISMA regla que FloorPlanProjectViews.image() (nombre y logo; contacto vacío). */
 function marcaImagen(snapshot){const p=snapshot?.profile;return p&&String(p.name||'').trim()?Object.freeze({name:String(p.name),logo:/^data:image\/png;base64,/.test(p.logo||'')?p.logo:null,contact:''}):null;}
 /** Auditoría OP-05 de los datos que se dibujarán (salida de FloorPlanDeliveryImage.content): devuelve los campos
  *  personales del perfil que aparecerían. Debe ser [] siempre. */
 function fugas(snapshot,datos){const p=snapshot?.profile||{},txt=JSON.stringify({...datos,brand:datos?.brand?{...datos.brand,logo:null}:null});
  return PRIVADOS.filter(k=>p[k]&&txt.includes(String(p[k]).replace(/^https?:\/\//,'')));}
 /** Manifiesto de una salida firmada: la limpia se cita por su hash y nunca se modifica. */
 function manifiesto({entregable,limpia,firmada,marcaSha256,compositor='FloorPlanDeliveryImage.compose'}){
  return Object.freeze({version:VERSION,entregable,compositor,salidas:{limpia:Object.freeze({...limpia,modificada:false}),firmada:Object.freeze({...firmada})},
   identidad:{fuente:'FloorPlanBrand.snapshot',regla:'nombre y logo; contacto vacío (OP-05)',sha256:marcaSha256,excluidos:[...PRIVADOS]}});}
 return Object.freeze({VERSION,CATALOGO,GRUPOS,PRIVADOS,catalogo,grupos,seleccionValida,marcaImagen,fugas,manifiesto});
});
