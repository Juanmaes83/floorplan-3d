/* STUDIO · «Personalización HERO FINAL» (corte B del HERO universal). Tarjeta del área Entregar → «La vivienda, para tu cliente».
 *
 * STUDIO es el centro de personalización audiovisual; Mi estudio sigue siendo la AUTORIDAD de la identidad profesional.
 * Una sola autoridad de datos: todo se lee y se escribe con FloorPlanBrand sobre el mismo almacén de FloorPlanBrandUI.
 *   - del estudio (perfil elegido en «Firmar con»): nombre, logotipo, lema, web y CTA → B.saveProfile;
 *   - del proyecto (entrega de esta entrada de biblioteca): título, cliente (con autorización expresa), mensaje de cierre y
 *     estilo → B.setDelivery(..., {title, hero}).
 * Sin segundo gestor de marca ni almacén propio. La previsualización usa EL MISMO contrato de composición que el vídeo
 * descargado (RubikFinalTitulos.pintar): logo, límites de texto, encuadre y firma idénticos por construcción.
 * Privacidad (OP-05): no se muestran correo, teléfono ni persona responsable; el cliente solo con autorización.
 */
(function(){
 'use strict';
 const B=window.FloorPlanBrand,T=window.RubikFinalTitulos,C=window.RubikFinalCore;if(!B||!T||!C)return;
 const L=()=>{const l=typeof LANG==='string'?LANG:'es';return ['es','en','zh'].includes(l)?l:'es';};
 const tx=(es,en,zh)=>({es,en,zh})[L()]||es;
 const el=(tag,text,parent,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;parent?.append(n);return n;};
 const store=()=>window.FloorPlanBrandUI?.store,entry=()=>window.FloorPlanApp?.entryId;
 const nombreProyecto=()=>C.textoVisible(window.FloorPlanApp?.project?.name||'',L());
 const imgs=new Map();const img=src=>{if(!src)return null;if(!imgs.has(src)){const i=new Image();i.src=src;imgs.set(src,i);}return imgs.get(src);};

 /** Estado actual desde la autoridad (FloorPlanBrand). */
 function leer(){
  const s=store(),id=entry();if(!s||!id)return null;
  const d=B.delivery(s,id),perfil=d.profileId?B.readProfiles(s).profiles.find(p=>p.id===d.profileId):null;
  return {perfil,titulo:d.title||nombreProyecto(),hero:d.hero||{cliente:'',clienteAutorizado:false,cierre:'',estilo:'cine',incluirWeb:false}};}
 /** Marca para la firma: exactamente la forma que recibe el vídeo exportado (brandFor + hero). */
 function marca(st){const p=st?.perfil;if(!p)return null;
  // OP-05: la web solo con consentimiento expreso para ESTA entrega (hero.incluirWeb); la misma regla que brandFor().
  return {present:true,name:p.name,tagline:p.tagline,logo:p.logo,web:st.hero?.incluirWeb===true?p.web:'',cta:p.cta,hero:st.hero};}

 // ---------------------------------------------------------------- previsualización (mismo contrato que el vídeo)
 function fondo(){const v=window.FloorPlanProjectViews?.current?.()||[];return v.find(x=>x.kind==='overview')?.dataUrl||null;}
 function pintarFotograma(cv,st,progreso){
  const x=cv.getContext('2d'),W=cv.width,H=cv.height,f=fondo(),bg=f&&img(f);
  if(bg&&bg.complete&&bg.naturalWidth){const k=Math.max(W/bg.naturalWidth,H/bg.naturalHeight),w=bg.naturalWidth*k,h=bg.naturalHeight*k;x.drawImage(bg,(W-w)/2,(H-h)/2,w,h);}
  else{const g=x.createLinearGradient(0,0,0,H);g.addColorStop(0,'#c9d6de');g.addColorStop(.55,'#e9e4dc');g.addColorStop(1,'#a7b58c');x.fillStyle=g;x.fillRect(0,0,W,H);}
  const fm=C.firma({marca:marca(st),proyecto:st?.titulo||nombreProyecto(),lang:L()});
  return T.pintar(x,W,H,fm,{progreso,estilo:fm.estilo,logo:img(fm.logo)});}

 function card(parent){
  if(!parent||parent.querySelector('[data-module="studio-hero"]'))return null;
  const c=el('article',undefined,parent,'professional-card studio-hero');c.dataset.module='studio-hero';
  el('small','STUDIO',c,'studio-hero-kicker');el('h3',tx('Personalización HERO FINAL','HERO FINAL personalisation','HERO 终幕个性化'),c);
  el('p',tx('Diferentes historias, un mismo lenguaje visual.','Different stories, one visual language.','不同的故事，同一种视觉语言。'),c,'professional-state');
  const fig=el('figure',undefined,c,'studio-hero-preview');const cv=el('canvas',undefined,fig);cv.width=960;cv.height=540;cv.setAttribute('role','img');
  cv.setAttribute('aria-label',tx('Previsualización del cierre del vídeo con tu firma','Preview of the video ending with your signature','带有您签名的视频结尾预览'));
  const cap=el('figcaption',undefined,fig);
  const barra=el('div',undefined,c,'studio-hero-bar');
  const ver=el('button',tx('Ver en movimiento','Play preview','播放预览'),barra,'btn');ver.type='button';
  const formato=el('select',undefined,barra);formato.setAttribute('aria-label',tx('Formato','Format','格式'));
  for(const [v,t] of [['16:9',tx('Horizontal 16:9','Landscape 16:9','横屏 16:9')],['9:16',tx('Vertical 9:16','Portrait 9:16','竖屏 9:16')]]){const o=el('option',t,formato);o.value=v;}
  const form=el('div',undefined,c,'studio-hero-form');const st0=leer();
  const campo=(etq,id,valor,{max,tipo='input',ayuda}={})=>{const l=el('label',undefined,form);el('span',etq,l);const i=el(tipo,undefined,l);i.id=id;if(max)i.maxLength=max;i.value=valor||'';if(ayuda)el('small',ayuda,l);return i;};
  const err=el('p','',c,'err');err.setAttribute('role','alert');
  let anim=0;
  const redibujar=(p=1)=>{const st=leer();pintarFotograma(cv,st,p);
   cap.textContent=fondo()?tx('Fondo: vista general real de tu vivienda. Títulos: los mismos del vídeo descargado.','Background: real overview of your home. Titles: the same as in the downloaded video.','背景：住宅真实总览。标题与下载视频相同。')
    :tx('Prepara las vistas para ver tu vivienda de fondo. Los títulos son los mismos del vídeo descargado.','Prepare the views to see your home behind. Titles match the downloaded video.','准备视图后可看到住宅背景。标题与下载视频相同。');};
  if(!st0?.perfil){
   const p=el('p',tx('Elige tu firma en «Firmar con» o configura Mi estudio: el nombre, el logotipo, el lema, la web y la CTA salen de ahí.','Choose your signature in “Sign with” or set up My studio: name, logo, tagline, website and CTA come from there.','请在“签名”中选择或配置“我的事务所”。'),form,'studio-hero-sin');
   // La tarjeta ya está en Mi estudio: no navega a sí misma (acción circular); abre el editor de perfiles existente
   // (FloorPlanBrandUI, la misma autoridad que usa «Configurar Mi estudio» fuera del estudio).
   const b=el('button',tx('Crear mi firma profesional','Create my professional signature','创建我的专业签名'),form,'btn');b.type='button';b.onclick=()=>window.FloorPlanBrandUI?.open?.();void p;
  }else{
   const P=st0.perfil;
   el('h4',tx('Tu estudio · Mi estudio','Your studio · My studio','您的事务所'),form);
   const nombre=campo(tx('Nombre del estudio','Studio name','事务所名称'),'shName',P.name,{max:B.LIMITS.name});
   // Selector de archivo con texto propio (el control nativo se rotula en el idioma del navegador, no en el de la sesión).
   const logoL=el('div',undefined,form,'studio-hero-logo');el('span',tx('Logotipo (PNG, JPG o WebP)','Logo (PNG, JPG or WebP)','标志'),logoL);
   const fila=el('div',undefined,logoL,'studio-hero-logo-fila');if(P.logo){const pv=el('img',undefined,fila,'studio-hero-logo-img');pv.src=P.logo;pv.alt='';}
   const logoIn=el('input',undefined,fila);logoIn.type='file';logoIn.id='shLogo';logoIn.accept='image/png,image/jpeg,image/webp';logoIn.className='studio-hero-oculto';
   const logoB=el('label',P.logo?tx('Cambiar logotipo','Change logo','更换标志'):tx('Elegir logotipo','Choose logo','选择标志'),fila,'btn');logoB.htmlFor='shLogo';logoB.tabIndex=0;
   logoB.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();logoIn.click();}});
   const lema=campo(tx('Lema','Tagline','标语'),'shTagline',P.tagline,{max:B.LIMITS.tagline});
   const web=campo('URL','shWeb',P.web,{max:B.LIMITS.web});
   const webL=el('label',undefined,form,'studio-hero-check');const webOk=el('input',undefined,webL);webOk.type='checkbox';webOk.id='shWebOk';webOk.checked=st0.hero.incluirWeb===true;
   el('span',tx('Mostrar la web en la firma de esta entrega','Show the website in this delivery’s signature','在此交付的签名中显示网址'),webL);
   const cta=campo(tx('Llamada a la acción','Call to action','行动号召'),'shCta',P.cta,{max:B.LIMITS.cta||60,ayuda:tx('Ej.: «Agenda una visita»','E.g. “Book a visit”','例如：预约参观')});
   el('h4',tx('Este proyecto','This project','此项目'),form);
   const original=window.FloorPlanApp?.project?.name||'',sinTraducir=!st0.titulo||st0.titulo===C.textoVisible(original,L())&&C.tieneChino(original)&&L()!=='zh';
   const titulo=campo(tx('Título del proyecto','Project title','项目标题'),'shTitle',st0.titulo,{max:B.LIMITS.title,
    ayuda:sinTraducir?tx('El nombre original no tiene traducción: escribe el título que verá tu cliente (el original se conserva).','The original name has no translation: type the title your client will see (the original is kept).','原名称没有翻译：请输入客户将看到的标题（原名称保留）。'):undefined});
   const cliente=campo(tx('Destinatario (opcional)','Recipient (optional)','收件人（可选）'),'shClient',st0.hero.cliente,{max:B.LIMITS.cliente||80});
   const autL=el('label',undefined,form,'studio-hero-check');const aut=el('input',undefined,autL);aut.type='checkbox';aut.id='shClientOk';aut.checked=!!st0.hero.clienteAutorizado;
   el('span',tx('Tengo autorización para mostrar su nombre en la entrega','I am authorised to show their name in the delivery','我已获授权在交付中显示其姓名'),autL);
   const cierre=campo(tx('Mensaje de cierre','Closing message','结束语'),'shClosing',st0.hero.cierre,{max:B.LIMITS.cierre||160,tipo:'textarea'});
   const est=el('fieldset',undefined,form,'studio-hero-estilos');el('legend',tx('Estilo','Style','风格'),est);
   for(const [v,t] of [['cine',tx('Cinematográfico','Cinematic','电影感')],['editorial',tx('Editorial','Editorial','编辑风格')]]){const l=el('label',undefined,est);const r=el('input',undefined,l);r.type='radio';r.name='shStyle';r.value=v;r.checked=(st0.hero.estilo||'cine')===v;el('span',t,l);}
   const guardarPerfil=async()=>{err.textContent='';try{const f=logoIn.files?.[0];let logo=P.logo;
     if(f){if(!['image/png','image/jpeg','image/webp'].includes(f.type))throw Object.assign(Error(tx('El logo debe ser PNG, JPG o WebP.','The logo must be PNG, JPG or WebP.','标志必须为 PNG、JPG 或 WebP。')),{field:'logo'});
      const bmp=await createImageBitmap(f),k=Math.min(1,600/bmp.width,240/bmp.height),cvl=document.createElement('canvas');cvl.width=Math.max(1,Math.round(bmp.width*k));cvl.height=Math.max(1,Math.round(bmp.height*k));cvl.getContext('2d').drawImage(bmp,0,0,cvl.width,cvl.height);logo=B.logo(cvl.toDataURL('image/png'));}
     Object.assign(P,B.saveProfile(store(),{...P,name:nombre.value,tagline:lema.value,web:web.value,cta:cta.value,logo}));}catch(e){err.textContent=(e.field?e.field+': ':'')+e.message;}redibujar();};
   const guardarProyecto=()=>{err.textContent='';try{B.setDelivery(store(),entry(),{title:titulo.value,hero:{cliente:cliente.value,clienteAutorizado:aut.checked,incluirWeb:webOk.checked,cierre:cierre.value,estilo:form.querySelector('input[name=shStyle]:checked')?.value||'cine'}});}
    catch(e){err.textContent=(e.field?e.field+': ':'')+e.message;}redibujar();};
   for(const i of [nombre,lema,web,cta])i.addEventListener('change',guardarPerfil);logoIn.addEventListener('change',guardarPerfil);
   for(const i of [titulo,cliente,cierre])i.addEventListener('change',guardarProyecto);aut.addEventListener('change',guardarProyecto);webOk.addEventListener('change',guardarProyecto);est.addEventListener('change',guardarProyecto);
  }
  formato.onchange=()=>{const v=formato.value==='9:16';cv.width=v?405:960;cv.height=v?720:540;fig.classList.toggle('vertical',v);redibujar();};
  ver.onclick=()=>{cancelAnimationFrame(anim);const t0=performance.now(),dur=4200,red=matchMedia('(prefers-reduced-motion: reduce)').matches;
   if(red){redibujar(1);return;}const paso=now=>{const k=Math.min(1,(now-t0)/dur);redibujar(k);if(k<1)anim=requestAnimationFrame(paso);else anim=0;};anim=requestAnimationFrame(paso);};
  const bg=fondo();if(bg)img(bg).addEventListener('load',()=>redibujar(),{once:true});const lg=st0?.perfil?.logo;if(lg)img(lg).addEventListener('load',()=>redibujar(),{once:true});
  redibujar();return c;}
 // ---------------------------------------------------------------- STUDIO (área «Mi estudio»): visión + tarjeta principal
 /** Banda «Imaginar. Diseñar. Construir. Presentar.» conectada a las rutas reales del producto (no es una página aparte). */
 /** Imagen REAL de RUBIK sobre la vivienda de ejemplo (dibujo vivo de Hybrid V2 con three.js; evolución de obra), rotulada.
  *  Si el recurso no carga, la alternativa del propio proyecto. Decorativa (su columna ya está rotulada: número, título y
  *  resumen; el contenedor es aria-hidden). Se crea y se pide SOLO cuando su columna entra en pantalla: abrir la Home o
  *  entrar al editor no descarga nada que nadie vea (contrato de privacidad F2). Mismo archivo y misma calidad; el hueco
  *  conserva tamaño y color, sin salto de maquetación. Sin IntersectionObserver, se carga como siempre. */
 function ejemplo(box,src,alternativa){
  const poner=()=>{if(box.querySelector('img'))return;const i=document.createElement('img');i.className='studio-vision-shot';i.alt='';i.decoding='async';i.width=960;i.height=600;
   i.onerror=()=>{i.remove();box.querySelector('.studio-vision-badge')?.remove();alternativa();};i.src=src;box.prepend(i);};
  if(typeof IntersectionObserver!=='function')poner();
  else{const io=new IntersectionObserver(es=>{if(es.some(e=>e.isIntersecting)){io.disconnect();poner();}});io.observe(box);}
  el('span',tx('Vivienda de ejemplo','Example home','示例住宅'),box,'studio-vision-badge');}
 /* Visión STUDIO (referencia del propietario 20/11): cinco columnas — imagen real de la vivienda de ejemplo, número, título
    y resumen — y, al pulsar «Opciones de …», la columna se amplía con sus servicios, cada uno conectado a la ruta EXISTENTE
    del producto. Debajo, la banda del Asistente (consulta guiada + MCP local). Se monta en STUDIO, en la Home (bienvenida) y en Entregar. */
 const ICON={subir:'M12 16V4m0 0l-4 4m4-4l4 4M4 16v3h16v-3',hoja:'M7 3h7l5 5v13H7zM14 3v5h5',rejilla:'M4 4h16v16H4zM4 12h16M12 4v16',escaner:'M4 8V4h4M16 4h4v4M20 16v4h-4M8 20H4v-4',cubo:'M12 3l8 4.5v9L12 21l-8-4.5v-9zM12 12l8-4.5M12 12v9M12 12L4 7.5',
  plano:'M4 4h16v16H4zM4 10h6v10M10 4v6',cama:'M3 18V8M3 14h18v4M7 11h4v3M21 14v4',muro:'M4 4h16v16H4zM9 4v16M15 4v16',techo:'M3 13l9-7 9 7',capas:'M12 3l9 5-9 5-9-5zM3 13l9 5 9-5',arbol:'M12 21v-6M7 15h10l-5-11z',sofa:'M4 12h16v5H4zM6 12V9h12v3M5 17v2M19 17v2',
  pin:'M12 21s-6-6-6-11a6 6 0 0112 0c0 5-6 11-6 11zM12 10h0',euro:'M15 6a6 6 0 100 12M6 10h7M6 14h7',calendario:'M4 6h16v14H4zM4 10h16M8 3v4M16 3v4',barras:'M5 20v-6M10 20V9M15 20v-9M20 20V5',
  blender:'M4 14a8 6 0 0016 0M12 8a4 4 0 100 8 4 4 0 000-8',monitor:'M3 5h18v11H3zM8 20h8M12 16v4',chispa:'M12 3l2 6 6 2-6 2-2 6-2-6-6-2 6-2z',corte:'M6 3v15h15M3 6h15v15',
  ojo:'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 9a3 3 0 100 6 3 3 0 000-6',play:'M7 5l12 7-12 7z',ruta:'M6 19a2 2 0 100-4 2 2 0 000 4zM18 9a2 2 0 100-4 2 2 0 000 4zM6 15c0-6 12-2 12-8',
  gente:'M9 11a3 3 0 100-6 3 3 0 000 6zM3 20c0-3 3-5 6-5s6 2 6 5M17 11a3 3 0 000-6M21 20c0-2-1-4-4-5',enlace:'M10 14l4-4M8 12l-2 2a3 3 0 004 4l2-2M16 12l2-2a3 3 0 00-4-4l-2 2',
  guia:'M12 3l9 5-9 5-9-5zM3 13l9 5 9-5',chat:'M4 5h16v11H9l-5 4z',estrella:'M12 3l2.5 6.5L21 10l-5 4.5L17.5 21 12 17.5 6.5 21 8 14.5 3 10l6.5-.5z',rayo:'M13 2L4 14h7l-1 8 9-12h-7z',enchufe:'M9 3v5M15 3v5M6 8h12v4a6 6 0 01-12 0zM12 18v3',armario:'M5 3h14v18H5zM12 3v18M10 11v2M14 11v2'};
 const svg=(k,cls='studio-ico')=>{const n=document.createElementNS('http://www.w3.org/2000/svg','svg');n.setAttribute('viewBox','0 0 24 24');n.setAttribute('aria-hidden','true');n.setAttribute('class',cls);
  const p=document.createElementNS('http://www.w3.org/2000/svg','path');p.setAttribute('d',ICON[k]||ICON.hoja);n.append(p);return n;};
 const ir=area=>document.getElementById('workArea-'+area)?.click();
 const salirBienvenida=()=>{const d=document.getElementById('welcomeDialog');if(d?.open)d.close();};
 const editor=()=>{salirBienvenida();ir('design');};
 const vista3d=()=>{editor();document.querySelector('[data-view="3d"]')?.click();};
 const existe=(obj,fn)=>!!(window[obj]&&typeof window[obj][fn]==='function');
 const llamar=(obj,fn,...a)=>{const o=window[obj];if(!o||typeof o[fn]!=='function')throw Error(tx('No disponible en esta versión.','Not available in this version.','此版本不可用。'));return o[fn](...a);};
 const presentar=(opcion)=>{vista3d();document.getElementById('presentationBtn')?.click();if(opcion)setTimeout(()=>{const o=document.getElementById(opcion);if(o&&!o.checked)o.click();o?.scrollIntoView?.({block:'center'});},450);};
 const modoRecorrer=()=>{vista3d();const m=()=>document.querySelector('#modes3d [data-mode="walk"]')?.click();if(window.FloorPlanApp?.viewMode==='3d')m();else addEventListener('floorplan-view-ready',m,{once:true});setTimeout(m,600);};
 const hayPresentacion=()=>!!document.getElementById('presentationBtn');
 const FASES=()=>[
  {id:'imaginar',n:1,t:tx('Imaginar','Imagine','构想'),d:tx('El plano, en el editor.','The plan, in the editor.','编辑器中的平面图。'),img:'studio-01-plano-ejemplo.jpg',ico:'subir',
   s:[{k:'subir',t:tx('Sube tu plano','Upload your plan','上传平面图'),h:tx('PDF o imagen de tu plano','PDF or image of your plan','PDF 或图片'),ok:existe('FloorPlanUpload','pick'),go:()=>{editor();llamar('FloorPlanUpload','pick');}},
      {k:'hoja',t:tx('Lienzo en blanco','Blank canvas','空白画布'),h:tx('Dibuja desde cero','Draw from scratch','从零绘制'),ok:existe('FloorPlanRoomUI','createBlankProject'),go:()=>{editor();llamar('FloorPlanRoomUI','createBlankProject');}},
      {k:'rejilla',t:tx('Usar plantilla','Use a template','使用模板'),h:tx('Estancias con medidas','Rooms with dimensions','按尺寸的房间'),ok:existe('FloorPlanRoomUI','createProject'),go:()=>{editor();llamar('FloorPlanRoomUI','createProject');}},
      {k:'escaner',t:tx('Importar escáner','Import a scan','导入扫描件'),h:tx('Foto o escaneado, calcado a escala','Photo or scan, traced to scale','照片或扫描件，按比例描绘'),ok:existe('FloorPlanTraceUI','openImage'),go:()=>{editor();llamar('FloorPlanTraceUI','openImage',true);}},
      {k:'cubo',t:tx('Importar CAD','Import CAD','导入 CAD'),h:tx('DXF · IFC · DWG convertido a DXF','DXF · IFC · DWG converted to DXF','DXF · IFC · DWG 需先转为 DXF'),ok:existe('FloorPlanUpload','pick'),go:()=>{editor();llamar('FloorPlanUpload','pick');}}]},
  {id:'disenar',n:2,t:tx('Diseñar','Design','设计'),d:tx('La vivienda en 3D.','The home in 3D.','三维住宅。'),img:'studio-02-dibujo-vivo-ejemplo.jpg',ico:'capas',
   s:[{k:'plano',t:tx('Redistribuir planos','Redistribute the plan','重新布局'),h:tx('Cambia la distribución','Change the layout','修改布局'),ok:existe('FloorPlanBuildPalette','select'),go:()=>{editor();llamar('FloorPlanBuildPalette','select','build');}},
      {k:'cama',t:tx('Habitaciones','Rooms','房间'),h:tx('Estancias, nombres y superficies','Rooms, names and areas','房间、名称与面积'),ok:existe('FloorPlanBuildPalette','select'),go:()=>{editor();llamar('FloorPlanBuildPalette','select','build');}},
      {k:'muro',t:tx('Muros','Walls','墙体'),h:tx('Muros, puertas y ventanas','Walls, doors and windows','墙体与门窗'),ok:existe('FloorPlanBuildPalette','focusOpenings'),go:()=>{editor();llamar('FloorPlanBuildPalette','select','build');window.FloorPlanBuildPalette.focusOpenings?.();}},
      {k:'techo',t:tx('Techos','Ceilings','天花'),h:tx('Acabados de techo','Ceiling finishes','天花饰面'),ok:existe('FloorPlanSurfaceUI','open'),go:()=>{editor();llamar('FloorPlanSurfaceUI','open');}},
      {k:'capas',t:tx('Suelos','Floors','地面'),h:tx('Materiales de suelo','Floor materials','地面材料'),ok:existe('FloorPlanSurfaceUI','open'),go:()=>{editor();llamar('FloorPlanSurfaceUI','open');}},
      {k:'arbol',t:tx('Exterior','Exterior','室外'),h:tx('Parcela y entorno','Plot and surroundings','地块与环境'),ok:existe('FloorPlanTerritoryUI','open'),go:()=>{vista3d();llamar('FloorPlanTerritoryUI','open');}},
      {k:'sofa',t:tx('Muebles','Furniture','家具'),h:tx('Catálogo, a medida real','Catalogue, real sizes','目录家具，真实尺寸'),ok:existe('FloorPlanBuildPalette','select'),go:()=>{editor();llamar('FloorPlanBuildPalette','select','furnish');}},
      // UX-312 Home · acceso 28: «Armarios» abre el interior a medida (R03) del armario seleccionado, con el mismo botón
      // de Propiedades; sin armario seleccionado explica qué falta y abre Muebles para elegirlo o añadirlo.
      {k:'armario',id:'studio-disenar-armarios',t:tx('Armarios','Wardrobes','衣柜'),h:tx('Interior a medida de un armario seleccionado','Custom interior of a selected wardrobe','所选衣柜的定制内部'),ok:true,
       // R03 carga después de esta banda: la disponibilidad se comprueba al pulsar, no al dibujar (mismo criterio que E02).
       go:()=>{if(!existe('RubikCabinetRubikUI','open'))throw Error(tx('El editor de armarios todavía se está cargando o no está disponible en esta versión.','The wardrobe editor is still loading or is not available in this version.','衣柜编辑器仍在加载或此版本不可用。'));editor();const b=document.getElementById('aInterior');if(b){b.click();return;}if(existe('FloorPlanBuildPalette','select'))llamar('FloorPlanBuildPalette','select','furnish');
        throw Error(tx('Para diseñar el interior, selecciona un armario en el plano y pulsa «Interior del armario…» en Propiedades. Si no hay ninguno, añádelo desde Muebles.','To design the interior, select a wardrobe on the plan and choose «Cabinet interior…» in Properties. If there is none, add one from Furniture.','要设计内部，请在平面图中选择衣柜，并在属性中点击“柜体内部…”。如果没有衣柜，请从家具中添加。'));}}]},
  {id:'construir',n:3,t:tx('Construir','Build','建造'),d:tx('La evolución de la obra.','The construction evolution.','施工演进。'),img:'studio-03-evolucion-ejemplo.jpg',ico:'calendario',
   s:[{k:'pin',t:tx('Localización','Location','位置'),h:tx('Emplazamiento, orientación y sol','Site, orientation and sun','选址、朝向与日照'),ok:existe('FloorPlanSitePreview','openReport')||existe('FloorPlanSolarUI','open'),go:()=>{salirBienvenida();if(existe('FloorPlanSitePreview','openReport'))llamar('FloorPlanSitePreview','openReport');else llamar('FloorPlanSolarUI','open');}},
      {k:'capas',t:tx('Catastro','Cadastre','地籍'),h:tx('Parcela y referencia catastral','Plot and cadastral reference','地块与地籍编号'),ok:existe('FloorPlanTerritoryUI','open'),go:()=>{vista3d();llamar('FloorPlanTerritoryUI','open');}},
      {k:'euro',t:tx('Presupuesto','Budget','预算'),h:tx('Partidas, mediciones y precios','Items, quantities and prices','分项、工程量与价格'),ok:existe('FloorPlanBudgetUI','open'),go:()=>{salirBienvenida();llamar('FloorPlanBudgetUI','open');}},
      {k:'calendario',t:tx('Planificación','Schedule','计划'),h:tx('Plan de obra por fases','Construction plan by phases','分阶段施工计划'),ok:existe('FloorPlanConstructionPlanUI','open'),go:()=>{salirBienvenida();llamar('FloorPlanConstructionPlanUI','open');}},
      {k:'barras',t:'Gantt',h:tx('La obra, día a día (4D)','The works, day by day (4D)','逐日施工（4D）'),ok:existe('FloorPlanConstructionUI','openEvolution'),go:()=>{salirBienvenida();return llamar('FloorPlanConstructionUI','openEvolution');}}]},
  {id:'presentar',n:4,t:tx('Presentar','Present','呈现'),d:tx('El HERO FINAL, con tu firma.','The HERO FINAL, with your signature.','带签名的 HERO 终幕。'),img:'studio-04-hero-ejemplo.jpg',ico:'monitor',
   s:[{k:'blender',t:'Blender',h:tx('Escena OP-10 para render profesional','OP-10 scene for professional rendering','OP-10 专业渲染场景'),ok:existe('RubikSceneExport','open'),go:()=>{salirBienvenida();llamar('RubikSceneExport','open');}},
      {k:'monitor',t:tx('Normal','Standard','标准'),h:tx('Presentación guiada de la vivienda','Guided presentation of the home','住宅导览演示'),ok:hayPresentacion(),go:()=>presentar()},
      {k:'chispa',t:tx('Render IA','AI render','AI 渲染'),h:tx('Imágenes fotorrealistas','Photorealistic images','逼真图像'),ok:existe('FloorPlanAIRender','open'),go:()=>{salirBienvenida();llamar('FloorPlanAIRender','open');}},
      {k:'capas',t:tx('Híbrido','Hybrid','混合'),h:tx('Dibujo vivo: del grafito a la realidad','Living drawing: graphite to reality','活绘：从铅笔稿到真实'),ok:hayPresentacion(),go:()=>presentar('presentationLivingDrawing')},
      {k:'corte',t:tx('Corte','Section','剖切'),h:tx('La vivienda abierta, por dentro','The home opened, inside','剖开查看内部'),ok:hayPresentacion(),go:()=>presentar('presentationSection')}]},
  {id:'recorrer',n:5,t:tx('Recorrer','Walk through','漫游'),d:tx('Navega por la vivienda y entrégala a tu cliente.','Walk through the home and deliver it to your client.','漫游住宅并交付给客户。'),img:'studio-05-recorrer-ejemplo.jpg',ico:'ruta',
   s:[{k:'cubo',id:'studio-recorrer-3d',t:tx('Navegar en 3D','Navigate in 3D','3D 浏览'),h:tx('Orbita, acerca y mira la vivienda','Orbit, zoom and look around','环绕、缩放与查看'),ok:true,go:vista3d},
      {k:'play',id:'studio-recorrer-libre',t:tx('Recorrido libre','Free walk','自由漫游'),h:tx('A la altura de los ojos · WASD y ratón','At eye level · WASD and mouse','视线高度 · WASD 与鼠标'),ok:true,go:modoRecorrer},
      {k:'ruta',id:'studio-recorrer-ejemplo',t:tx('Visita guiada','Guided visit','导览参观'),h:tx('Recorre la vivienda de ejemplo','Walk the example home','漫游示例住宅'),ok:!!document.getElementById('welcomeWalkExample'),go:()=>{salirBienvenida();document.getElementById('welcomeWalkExample').click();}},
      {k:'gente',id:'studio-recorrer-cliente',t:tx('Ver como cliente','See it as your client','以客户视角查看'),h:tx('Vista previa: no se publica nada','Preview: nothing is published','预览：不发布'),ok:existe('FloorPlanDeliveryPreview','preview'),go:()=>{salirBienvenida();window.FloorPlanDeliveryPreview.preview();}},
      {k:'enlace',id:'studio-recorrer-enlace',t:tx('Enviar enlace','Send link','发送链接'),h:tx('Con tu consentimiento y tu código','With your consent and code','经同意并凭代码'),ok:existe('FloorPlanShareLink','open'),go:()=>{salirBienvenida();window.FloorPlanShareLink.open();}}]}];
 const RESULTADOS=()=>({imaginar:[[null,tx('Plano de partida','Starting plan','起始平面图')]],
  disenar:[['D1',tx('Ficha','Area schedule','面积表')],['D2',tx('Lámina','Drawing sheet','图纸')],['P5','Material board']],
  construir:[['S1',tx('Presupuesto','Budget','预算')],['P4',tx('Evolución de obra','Construction evolution','施工演进')]],
  presentar:[['P1',tx('Presentación 3D','3D presentation','三维演示')],['P2',tx('Imágenes','Images','图像')],['P6',tx('Cierre','Closing','终幕')],['T1','Blender']],
  recorrer:[['P3',tx('Visita 3D','3D visit','三维参观')],['P7',tx('Archivo para tu cliente','File for your client','客户文件')]]});
 const FIRMA=()=>({imaginar:[],
  disenar:[tx('Cajetín y crédito de la lámina','Sheet title block and credit','图纸标题栏与署名'),tx('Pie de la ficha de superficies','Area schedule footer','面积表页脚'),tx('Dossier del proyecto','Project dossier','项目资料'),'Material board'],
  construir:[tx('Cabecera del dossier económico','Economic dossier header','经济资料页眉'),tx('Análisis del emplazamiento','Site analysis','场地分析'),tx('Entrega de obra (contacto que elijas)','Construction handover (contact you choose)','施工交付（你选择的联系人）')],
  presentar:[tx('Presentación 3D','3D presentation','三维演示'),tx('Vistas e imágenes con render IA','Views and AI-rendered images','视图与 AI 渲染图像'),tx('Cierre HERO FINAL','HERO FINAL closing','HERO 终幕'),tx('Entregables profesionales','Professional deliverables','专业交付物'),tx('Revisión del render Blender','Blender render review','Blender 渲染审阅')],
  recorrer:[tx('Archivo y enlace para el cliente','File and link for the client','客户文件与链接')]});
 function fichas(col,fase,donde){const items=(donde==='entregar'?RESULTADOS():FIRMA())[fase]||[];if(!items.length)return;
  const box=el('div',undefined,col,'studio-fase-fichas');el('span',donde==='entregar'?tx('Resultados','Results','成果'):tx('Tu firma aparece en','Your signature appears in','你的签名出现在'),box,'studio-fichas-t');const ul=el('ul',undefined,box);
  for(const it of items){const li=el('li',undefined,ul);
   if(donde!=='entregar'){li.textContent=it;continue;}
   const [code,label]=it;if(!code){li.textContent=label;continue;}
   // Enlace a su fila del índice de Entregar (mismo documento): lleva el foco a la tarjeta, sin abrir nada.
   const b=el('button',undefined,li,'studio-ficha-link');b.type='button';b.dataset.entrega=code;el('span',code,b,'studio-ficha-code');b.append(' '+label);
   b.onclick=()=>{const t=document.querySelector('#professionalWorkspace [data-entrega-code="'+code+'"]');if(!t)return;t.scrollIntoView({block:'center'});const h=t.querySelector('h3');if(h){h.tabIndex=-1;h.focus({preventScroll:true});}};}}
 let visionN=0;
 function vision(parent,{donde='studio'}={}){
  const uid='sv'+(++visionN);
  const s=el('section',undefined,parent,'studio-vision');s.dataset.module='studio-vision';s.dataset.donde=donde;s.setAttribute('aria-labelledby',uid+'T');
  el('small','STUDIO · RUBIK SOTA',s,'studio-hero-kicker');
  // UX-312 Home: en la Home el título aprobado ya encabeza la página; la banda no lo repite y dice qué contiene.
  const h=el('h2',donde==='home'?tx('Las herramientas de cada fase','The tools of each phase','各阶段的工具'):tx('Imaginar. Diseñar. Construir. Presentar. Recorrer.','Imagine. Design. Build. Present. Walk through.','构想。设计。建造。呈现。漫游。'),s);h.id=uid+'T';
  const cajonera=donde!=='home';
  if(!cajonera)el('p',donde==='home'?tx('Cada fase abre las herramientas reales de RUBIK. Si una necesita un proyecto, una selección o permisos, te lo explica al abrirla.','Each phase opens RUBIK’s real tools. If one needs a project, a selection or permissions, it tells you when you open it.','每个阶段都打开 RUBIK 的真实工具。如需项目、选择或权限，打开时会说明。'):tx('Cinco fases para llevar un proyecto desde la idea hasta la experiencia final. Una única firma profesional.','Five phases to take a project from the idea to the final experience. One professional signature.','五个阶段，把项目从构想带到最终体验。唯一的专业签名。'),s,'studio-vision-sub');
  else{const sub=el('p',undefined,s,'studio-vision-sub');
   // UX-312 V2.6 · A.2: la misma banda tiene un propósito distinto en cada área (la Home conserva la suya).
   if(donde==='entregar'){el('b',tx('Cómo se hace lo que entregas.','How what you deliver is made.','你交付的内容是如何完成的。'),sub);sub.append(' '+tx('De qué fase sale cada resultado. Las herramientas de cada fase, bajo demanda.','Which phase each result comes from. Each phase\'s tools, on demand.','每个成果来自哪个阶段。各阶段的工具，按需打开。'));}
   else{el('b',tx('Tu marca en RUBIK.','Your brand in RUBIK.','你在 RUBIK 中的品牌。'),sub);sub.append(' '+tx('Dónde aparece la identidad que configuras aquí. Las herramientas de cada fase, bajo demanda.','Where the identity you set up here appears. Each phase\'s tools, on demand.','你在此配置的身份出现在哪里。各阶段的工具，按需打开。'));}}
  s.dataset.cajonera=String(cajonera);
  const row=el('div',undefined,s,'studio-vision-row');if(!cajonera)row.setAttribute('role','list');
  const cajones=[];
  const cerrarCajon=(c,devolver)=>{if(c.lista.hidden)return;c.lista.hidden=true;c.tog.setAttribute('aria-expanded','false');c.col.classList.remove('abierta');if(devolver)c.tog.focus({preventScroll:true});};
  for(const f of FASES()){
   const col=el('article',undefined,row,'studio-fase');if(!cajonera)col.setAttribute('role','listitem');col.dataset.fase=f.id;
   const img=el('div',undefined,col,'studio-vision-img');img.setAttribute('aria-hidden','true');ejemplo(img,'assets/studio/'+f.img,()=>{});
   const cab=el('div',undefined,col,'studio-fase-cab');el('span','0'+f.n,cab,'studio-fase-n');const fh=el('h3',f.t,cab);fh.id=uid+'-'+f.id+'-t';el('p',f.d,col,'studio-fase-d');
   if(cajonera)fichas(col,f.id,donde);
   const tog=el('button',undefined,col,'studio-fase-toggle');tog.type='button';tog.dataset.route='studio-'+f.id;const lid=uid+'-'+f.id;tog.setAttribute('aria-controls',lid);tog.setAttribute('aria-expanded','false');
   tog.append(svg(f.ico));const tl=el('span',tx('Opciones de ','Options for ','选项：')+f.t,tog);tog.append(svg('techo','studio-ico studio-flecha'));
   let lista;
   if(cajonera){el('small',' · '+f.s.length+' '+tx('herramientas','tools','个工具'),tl,'studio-fase-cuenta');tog.setAttribute('aria-describedby',fh.id);
    // Cajonera de planos (V2.4 · A.4): un cajón por fase, uno abierto a la vez; en escritorio ocupa el ancho bajo las
    // fases, en móvil se abre bajo su fase. Mismas herramientas y mismas rutas que antes.
    lista=el('div',undefined,row,'studio-cajon');lista.id=lid;lista.hidden=true;lista.setAttribute('role','region');lista.setAttribute('aria-label',tx('Herramientas de ','Tools for ','工具：')+f.t);
    const cc=el('div',undefined,lista,'studio-cajon-cab');const ch=el('h4',tx('Herramientas de ','Tools for ','工具：')+f.t,cc);el('span',String(f.s.length),ch,'studio-cajon-n');
    const cerrar=el('button',tx('Cerrar','Close','关闭'),cc,'studio-cajon-cerrar');cerrar.type='button';cerrar.setAttribute('aria-label',tx('Cerrar herramientas de ','Close tools for ','关闭工具：')+f.t);
    const ul=el('ul',undefined,lista,'studio-fase-opciones');const ref={col,tog,lista};cajones.push(ref);
    cerrar.onclick=()=>cerrarCajon(ref,true);lista.addEventListener('keydown',e=>{if(e.key==='Escape'){e.stopPropagation();cerrarCajon(ref,true);}});
    tog.addEventListener('keydown',e=>{if(e.key==='Escape'&&!lista.hidden){e.stopPropagation();cerrarCajon(ref,true);}});
    lista.listaHerr=ul;}
   else{lista=el('ul',undefined,col,'studio-fase-opciones');lista.id=lid;lista.hidden=true;lista.listaHerr=lista;}
   for(const sv of f.s){const li=el('li',undefined,lista.listaHerr);const b=el('button',undefined,li,'studio-opcion');b.type='button';if(sv.id)b.dataset.route=sv.id;b.dataset.servicio=sv.t;b.disabled=!sv.ok;
    b.title=sv.ok?sv.h:tx('No disponible en esta versión','Not available in this version','此版本不可用');b.append(svg(sv.k));const tt=el('span',undefined,b);el('b',sv.t,tt);el('small',sv.ok?sv.h:b.title,tt);
    b.onclick=()=>{try{const r=sv.go();r?.catch?.(e=>window.toast?.(e.message,5000));}catch(e){window.toast?.(e.message,5000);}};}
   tog.onclick=()=>{const abierta=lista.hidden;if(abierta&&cajonera)for(const c of cajones)if(c.lista!==lista)cerrarCajon(c,false);
    lista.hidden=!abierta;tog.setAttribute('aria-expanded',String(abierta));col.classList.toggle('abierta',abierta);if(abierta)lista.listaHerr.querySelector('button:not(:disabled)')?.focus({preventScroll:true});};}
  // UX-312 Home: varios módulos (plan de obra, Gantt, Blender…) cargan después de esta banda. Al terminar la carga se
  // vuelve a comprobar cada acceso deshabilitado con la API real; los que ya existen se habilitan con su descripción.
  const resincronizar=()=>{const todos=FASES().flatMap(f=>f.s);for(const b of s.querySelectorAll('.studio-opcion:disabled')){const sv=todos.find(x=>x.t===b.dataset.servicio&&(x.id||'')===(b.dataset.route||''));
   if(sv?.ok){b.disabled=false;b.title=sv.h;const sm=b.querySelector('small');if(sm)sm.textContent=sv.h;}}};
  if(document.readyState!=='complete')addEventListener('load',resincronizar,{once:true});
  // Capa secundaria: «Todas las herramientas» (las cinco fases organizan RUBIK, no lo limitan).
  const todas=el('button',undefined,s,'studio-todas');todas.type='button';todas.dataset.route='studio-todas';todas.append(svg('rejilla'));
  el('span',tx('Todas las herramientas de RUBIK','All RUBIK tools','RUBIK 全部工具'),todas);el('small',tx('Buscar por nombre o por fase · estado real de cada una','Search by name or phase · real status of each','按名称或阶段搜索 · 每项的真实状态'),todas);
  todas.onclick=()=>catalogo(todas);
  // Asistente (consulta guiada) + MCP local: ayuda transversal (el Asistente del producto y las propuestas del servidor MCP de RUBIK).
  // UX-312 C3 (aprobado 22/11/2026): en Mi estudio y Entregar se abre desde el botón «Asistente» de la barra superior.
  if(cajonera)return s;
  const ia=el('div',undefined,s,'studio-vision-ia');ia.dataset.module='studio-ia';
  const insignia=el('div',undefined,ia,'studio-ia-insignia');insignia.append(svg('chispa','studio-ico studio-ia-ico'));
  // UX-312 E03: el acceso declara el modo REAL (el mismo que muestra el panel, #assistantMode): consulta guiada con los datos
  // del proyecto y su fuente, propuestas que confirmas tú y MCP local sobre una copia JSON. Sin promesas de automatización.
  const txt=el('div',undefined,ia,'studio-ia-txt');el('h3',tx('Asistente RUBIK · consulta guiada','RUBIK Assistant · guided query','RUBIK 助手 · 引导式查询'),txt);
  el('p',tx('Responde sobre el proyecto abierto con los datos y motores de RUBIK y muestra la fuente de cada cifra. Sus propuestas las revisas, aplicas y deshaces tú. Funciona en este navegador sin modelo de lenguaje.','It answers about the open project with RUBIK’s data and engines and shows the source of every figure. You review, apply and undo its proposals. It works in this browser without a language model.','使用 RUBIK 的数据和引擎回答当前项目的问题，并显示每个数字的来源。建议由你审阅、应用和撤销。在此浏览器中运行，不使用语言模型。'),txt);
  el('p',tx('MCP local: guarda una copia JSON y revísala en tu cliente MCP; nunca cambia tu proyecto. La conversación con IA y cualquier conexión que consuma créditos requieren la autorización expresa del titular.','Local MCP: save a JSON copy and review it in your MCP client; it never changes your project. AI conversation and any connection that uses credits need the owner’s express authorisation.','本地 MCP：保存 JSON 副本并在你的 MCP 客户端中检查；不会更改你的项目。AI 对话及任何消耗额度的连接都需要所有者明确授权。'),txt,'studio-ia-modo');
  const caps=el('div',undefined,ia,'studio-ia-caps');
  for(const [k,t] of [['guia',tx('Guía cada fase','Guides each phase','引导每个阶段')],['chat',tx('Responde con tus datos','Answers with your data','用你的数据回答')],['estrella',tx('Muestra fuente y alcance','Shows source and scope','显示来源与范围')],['rayo',tx('Propone; tú confirmas','Proposes; you confirm','提出建议，由你确认')],['enchufe',tx('MCP sobre una copia','MCP on a copy','在副本上使用 MCP')]]){
   const c=el('span',undefined,caps,'studio-ia-cap');c.append(svg(k));el('span',t,c);}
  const iaB=el('button',tx('Abrir el Asistente','Open the Assistant','打开助手'),ia,'btn primary studio-ia-btn');iaB.type='button';iaB.dataset.route='studio-asistente';
  // UX-312 E02: el Asistente se carga DESPUÉS que esta banda (index.html), así que la disponibilidad no se decide una sola vez
  // al dibujar: se sincroniza con la API real cuando termina de cargar. Si no existe, el botón dice por qué está deshabilitado.
  const sincronizarIA=()=>{const ok=existe('RubikAssistantUI','open');iaB.disabled=!ok;if(ok)iaB.removeAttribute('title');else iaB.title=tx('El Asistente todavía se está cargando o no está disponible en esta versión.','The Assistant is still loading or is not available in this version.','助手仍在加载或此版本不可用。');return ok;};
  if(!sincronizarIA()){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',sincronizarIA,{once:true});addEventListener('load',sincronizarIA,{once:true});}
  iaB.onclick=()=>{if(!sincronizarIA())return;try{
   // Origen de foco: al cerrar el panel vuelve aquí si este botón sigue a la vista; si no, se respeta el destino del Asistente.
   addEventListener('rubik-assistant',function volver(e){if(e.detail?.type!=='close')return;removeEventListener('rubik-assistant',volver);if(iaB.isConnected&&iaB.checkVisibility?.())iaB.focus({preventScroll:true});});
   salirBienvenida();llamar('RubikAssistantUI','open');}catch(e){window.toast?.(e.message,5000);}};
  return s;}
 /* «Todas las herramientas»: catálogo con búsqueda y categorías GENERADO desde el registro único (FloorPlanCapabilities,
    GOV-03/K9). No declara estados propios: el estado visible se deriva del nivel con homeState/aiState del registro, como
    en la Home; solo lo «Disponible» o en «Piloto»/«Simulación» rotulados tiene acceso, y siempre por su ruta existente
    (la misma convención `access` del registro: upload · walk · area:<área>). Lo «developed» nunca se anuncia. */
 const FASE_DE={import:'imaginar',walk3d:'recorrer',presentation:'presentar','render-ai':'presentar',sheet:'presentar','client-file':'presentar',
  analyze:'construir',budget:'construir','construction-plan':'construir','evolution-4d':'construir',variants:'disenar',building:'disenar',furnish:'disenar','room-type':'disenar',
  brand:'estudio',assistant:'ia','assistant-catalogs':'ia','assistant-llm':'ia',catalogs:'disenar','catalog-budget':'construir','visual-studio':'ia','photo-reform':'ia','photo-real':'ia'};
 const ESTADO={available:['Disponible','Available','可用'],validation:['En validación','In validation','验证中'],preparation:['En preparación','In preparation','准备中'],pilot:['Piloto','Pilot','试点'],simulation:['Simulación','Simulation','模拟']};
 function capacidades(){const C=window.FloorPlanCapabilities;if(!C)return [];const L=i=>Array.isArray(i)?i[{es:0,en:1,zh:2}[L_()]||0]:i;
  const vistos=new Set(),out=[];
  for(const c of [...(C.CAPABILITIES||[]),...(C.INTEGRATED||[])]){if(c.level==='developed'||c.level==='planned'&&!c.state)continue;vistos.add(c.id);
   out.push({id:c.id,nombre:L(c.name),texto:L(c.benefit||c.what||''),estado:C.homeState?C.homeState(c.level):c.state,access:c.access||null,fase:FASE_DE[c.id]||'estudio'});}
  for(const a of C.AI_SERVICES||[]){if(vistos.has(a.id))continue;out.push({id:a.id,nombre:L(a.name),texto:L(a.what||''),estado:C.aiState?C.aiState(a.level):a.state,access:a.access||null,fase:FASE_DE[a.id]||'ia',ia:true});}
  return out;}
 const L_=()=>{const l=typeof LANG==='string'?LANG:'es';return ['es','en','zh'].includes(l)?l:'es';};
 function abrirAcceso(c){
  const area=k=>{salirBienvenida();if(window.FloorPlanProfessionalUI?.open)window.FloorPlanProfessionalUI.open(k);else ir(k);};
  if(c.access==='upload'){editor();return llamar('FloorPlanUpload','pick');}
  if(c.access==='walk'){salirBienvenida();return document.getElementById('welcomeWalkExample')?.click();}
  if(c.access==='render-band')return (salirBienvenida(),llamar('FloorPlanAIRender','open'));
  if(c.access==='assistant')return (salirBienvenida(),llamar('RubikAssistantUI','open'));
  if(c.access==='catalogs')return (salirBienvenida(),llamar('RubikCatalogUI','open'));
  if(c.access==='visual-studio')return (salirBienvenida(),llamar('RubikVisualStudio','open'));
  if(c.access==='photo-reform')return (salirBienvenida(),llamar('RubikPhotoReform','open'));
  if(c.access?.startsWith('area:')){const k=c.access.slice(5);return k==='design'?editor():area(k);}
  throw Error(tx('Sin acceso directo en esta versión.','No direct access in this version.','此版本无直接入口。'));}
 let dlg=null;
 function catalogo(origen){
  if(!dlg){dlg=document.createElement('dialog');dlg.id='studioTodas';dlg.className='studio-todas-dlg';dlg.setAttribute('aria-labelledby','studioTodasT');document.body.append(dlg);
   dlg.addEventListener('close',()=>dlg._origen?.focus?.());}
  dlg._origen=origen;dlg.replaceChildren();
  const cab=el('div',undefined,dlg,'studio-todas-cab');const h=el('h2',tx('Todas las herramientas de RUBIK','All RUBIK tools','RUBIK 全部工具'),cab);h.id='studioTodasT';
  const cerrar=el('button','×',cab,'studio-vision-cerrar');cerrar.type='button';cerrar.setAttribute('aria-label',tx('Cerrar','Close','关闭'));cerrar.onclick=()=>dlg.close();
  el('p',tx('Estado real según el registro único de capacidades de RUBIK. Solo lo disponible, en piloto o en simulación rotulada tiene acceso.','Real status from RUBIK’s single capability registry. Only available, pilot or labelled simulation items have access.','状态来自 RUBIK 唯一能力注册表。'),dlg,'studio-todas-nota');
  const q=el('input',undefined,dlg,'studio-todas-q');q.type='search';q.id='studioTodasQ';q.placeholder=tx('Buscar una herramienta…','Search a tool…','搜索工具…');q.setAttribute('aria-label',q.placeholder);
  const filtros=el('div',undefined,dlg,'studio-todas-filtros');const cuerpo=el('div',undefined,dlg,'studio-todas-cuerpo');
  const CATS=[['todas',tx('Todas','All','全部')],...FASES().map(f=>[f.id,f.t]),['estudio',tx('Tu estudio','Your studio','你的事务所')],['ia',tx('IA y Asistente','AI and Assistant','AI 与助手')]];
  let cat='todas';const items=capacidades();
  const pintar=()=>{cuerpo.replaceChildren();const t=q.value.trim().toLowerCase();let n=0;
   for(const [id,nombre] of CATS.slice(1)){const grupo=items.filter(c=>c.fase===id&&(cat==='todas'||cat===id)&&(!t||(c.nombre+' '+c.texto).toLowerCase().includes(t)));if(!grupo.length)continue;
    const sec=el('section',undefined,cuerpo,'studio-todas-grupo');sec.dataset.cat=id;el('h3',nombre,sec);
    for(const c of grupo){n++;const row=el('div',undefined,sec,'studio-todas-item');row.dataset.cap=c.id;row.dataset.estado=c.estado;const tt=el('div',undefined,row);el('b',c.nombre,tt);el('small',c.texto,tt);
     el('span',tx(...ESTADO[c.estado]||ESTADO.preparation),row,'studio-chip studio-chip-'+c.estado);
     const accesible=['available','pilot','simulation'].includes(c.estado)&&c.access;
     if(accesible){const b=el('button',tx('Abrir','Open','打开'),row,'btn');b.type='button';b.onclick=()=>{try{dlg.close();const r=abrirAcceso(c);r?.catch?.(e=>window.toast?.(e.message,5000));}catch(e){window.toast?.(e.message,5000);}};}
     else el('span',tx('Sin acceso aún','Not accessible yet','暂不可用'),row,'studio-todas-sin');}}
   if(!n)el('p',tx('Ninguna herramienta coincide.','No tool matches.','没有匹配的工具。'),cuerpo,'studio-todas-nada');};
  for(const [id,nombre] of CATS){const b=el('button',nombre,filtros,'studio-todas-filtro');b.type='button';b.dataset.cat=id;b.setAttribute('aria-pressed',String(id===cat));b.onclick=()=>{cat=id;for(const x of filtros.children)x.setAttribute('aria-pressed',String(x.dataset.cat===cat));pintar();};}
  q.oninput=pintar;pintar();dlg.showModal();q.focus();}
 /** Home: la misma visión en la bienvenida de RUBIK (se monta una vez cuando la bienvenida existe). */
 function home(){const d=document.getElementById('welcomeDialog');if(!d||d.querySelector('[data-module="studio-vision"]'))return false;
  // Home de RUBIK = #welcomeDialog (HOM-01…04: no hay otra página de inicio). Se coloca tras «Descubre RUBIK en acción» y
  // antes de «Lo que puedes hacer hoy»; ninguna sección existente se quita ni se mueve.
  // Solo cuando master ha construido la bienvenida (buildWelcome: existe su ancla). En una sesión que entra directa al editor
  // el diálogo está vacío: no se monta nada, ni imágenes ni peticiones; se montará si la bienvenida llega a construirse.
  const ancla=d.querySelector('#welcomeInAction');if(!ancla)return false;const w=document.createElement('div');w.className='studio-hero-area studio-home';
  ancla.after(w);vision(w,{donde:'home'});return true;}
 /** Área STUDIO: la visión y la tarjeta PRINCIPAL de personalización. */
 function studio(grid){if(!grid||grid.querySelector('[data-module="studio-vision"]'))return;const wrap=document.createElement('div');wrap.className='studio-hero-area';grid.prepend(wrap);vision(wrap);card(wrap);}
 /** Entregar: solo un ACCESO DIRECTO a la misma configuración (misma tarjeta, misma autoridad FloorPlanBrand). */
 function acceso(parent){
  if(!parent||parent.querySelector('[data-module="studio-hero-acceso"]'))return null;const st=leer();
  // Entregar: la visión completa arriba (mismas cinco fases) y el acceso a la personalización en su grupo.
  {const grid=parent.closest('.professional-grid')||parent.parentElement?.parentElement;if(grid&&!grid.querySelector('[data-module="studio-vision"]')){const w=document.createElement('div');w.className='studio-hero-area';grid.prepend(w);vision(w,{donde:'entregar'});}}
  const c=el('article',undefined,parent,'professional-card studio-hero-acceso');c.dataset.module='studio-hero-acceso';el('small','STUDIO',c,'studio-hero-kicker');
  el('h3',tx('Personalización HERO FINAL','HERO FINAL personalisation','HERO 终幕个性化'),c);
  el('p',st?.perfil?tx(`Firma: ${st.perfil.name} · estilo ${st.hero.estilo==='editorial'?'editorial':'cinematográfico'}`,`Signature: ${st.perfil.name} · ${st.hero.estilo==='editorial'?'editorial':'cinematic'} style`,`签名：${st.perfil.name}`):tx('Sin firma elegida','No signature chosen','尚未选择签名'),c,'professional-state');
  const b=el('button',tx('Personalizar el cierre en Mi estudio','Customise the closing in My studio','在“我的事务所”中个性化终幕'),c,'btn');b.type='button';b.dataset.route='studio-hero';
  b.onclick=()=>{document.getElementById('workArea-studio')?.click();setTimeout(()=>{const k=document.querySelector('[data-module="studio-hero"]');k?.scrollIntoView({block:'start'});k?.querySelector('h3')?.setAttribute('tabindex','-1');k?.querySelector('h3')?.focus();},60);};
  return c;}
 window.RubikStudioHero={card,studio,acceso,vision,home,catalogo,capacidades,leer,marca,pintarFotograma};
 // Home: la bienvenida aparece al cargar o al pulsar «Inicio»; se monta en cuanto existe.
 // La Home se reconstruye con welcome.replaceChildren() al pulsar Inicio y cambiar idioma.
 // Vigilar solo los hijos DIRECTOS del diálogo: no observar todo el editor en cada render.
 function observarBienvenida(){
  const d=document.getElementById('welcomeDialog');if(!d)return false;
  if(d.__rubikStudioObservado)return true;d.__rubikStudioObservado=true; // un solo observador por diálogo
  const mo=new MutationObserver(()=>{if(!d.querySelector('[data-module="studio-vision"]'))home();});
  mo.observe(d,{childList:true});home();return true;
 }
 if(!observarBienvenida()){
  // Respaldo acotado: solo hasta que exista la bienvenida (y como mucho 30 s). Donde no hay Home (p. ej. la vista del
  // cliente ?entrega=…) no queda un observador sobre todo el DOM.
  const mo=new MutationObserver(()=>{if(observarBienvenida()){mo.disconnect();clearTimeout(fin);}});
  mo.observe(document.body,{childList:true,subtree:true});const fin=setTimeout(()=>mo.disconnect(),30000);
 }
 // Estilos propios, pequeños (la tarjeta hereda .professional-card).
 const css=document.createElement('style');css.textContent=`
 .studio-hero .studio-hero-kicker{letter-spacing:.24em;font-weight:700;font-size:11px;color:#8a5a1f}
 .studio-hero-preview{margin:10px 0;display:flex;flex-direction:column;gap:6px}.studio-hero-preview canvas{width:100%;height:auto;border-radius:10px;background:var(--line);box-shadow:0 1px 0 rgba(0,0,0,.06)}
 .studio-hero-preview.vertical canvas{max-width:260px;align-self:center}.studio-hero-preview figcaption{font-size:12px;color:var(--ink-muted)}
 .studio-hero-bar{display:flex;gap:8px;flex-wrap:wrap;align-items:center}.studio-hero-bar select{min-height:40px}
 .studio-hero .studio-hero-form{display:grid;gap:10px;margin-top:10px;min-width:0}.studio-hero .studio-hero-form h4{margin:10px 0 0;font-size:13px;letter-spacing:.04em}
 .studio-hero .studio-hero-form label{display:flex;flex-direction:column;align-items:stretch;gap:4px;font-size:13px;margin:0}
 .studio-hero .studio-hero-form input:not([type=checkbox]):not([type=radio]),.studio-hero .studio-hero-form textarea{width:100%;box-sizing:border-box;min-height:40px;font:inherit;padding:6px 10px}
 .studio-hero .studio-hero-form textarea{min-height:64px;resize:vertical}.studio-hero .studio-hero-form small{color:var(--ink-muted)}
 .studio-hero .studio-hero-form label.studio-hero-check{flex-direction:row;align-items:center;gap:8px}.studio-hero .studio-hero-check input{width:20px;height:20px;flex:none}
 .studio-hero .studio-hero-estilos{display:flex;gap:16px;border:0;padding:0;margin:0;flex-wrap:wrap}.studio-hero .studio-hero-estilos label{flex-direction:row;align-items:center;gap:6px;min-height:40px}
 .studio-hero .studio-hero-bar .btn{min-height:40px}
 .studio-hero-area{grid-column:1/-1;display:grid;gap:18px;min-width:0;max-width:100%}.studio-hero-area>*,.studio-vision-row>*{min-width:0}.studio-hero{min-width:0;max-width:100%;box-sizing:border-box}.studio-vision{background:var(--surface-panel);border-radius:14px;padding:18px 18px 14px}
 .studio-vision h2{font-family:var(--font-sans);font-weight:600;font-size:clamp(24px,3vw,40px);line-height:1.05;margin:6px 0 8px}
 .studio-vision-sub{margin:0 0 12px;color:var(--ink)}.studio-vision-row{display:grid;grid-template-columns:repeat(5,1fr);gap:12px}
 .studio-vision-recorrer{cursor:default}.studio-vision-recorrer:hover{background:none}.studio-vision-acciones{display:flex;flex-direction:column;gap:6px;margin-top:6px}.studio-vision-acciones .btn{min-height:40px;margin:0;width:100%;white-space:normal;line-height:1.2;border:1px solid rgba(43,40,36,.28);border-radius:10px;background:var(--surface-panel)}.studio-vision-acciones .btn.primary{background:var(--action);color:#fff;border-color:var(--action)}
 .studio-vision-tile{all:unset;box-sizing:border-box;display:flex;flex-direction:column;gap:4px;cursor:pointer;border-radius:12px;padding:8px;min-height:44px}
 .studio-vision-tile:hover{background:rgba(0,0,0,.04)}.studio-vision-tile:focus-visible{outline:3px solid #1f4fb5;outline-offset:2px}
 .studio-vision-img{aspect-ratio:16/10;border-radius:10px;overflow:hidden;background:var(--line);display:flex;align-items:center;justify-content:center}
 .studio-vision-img{position:relative}.studio-vision-teclas{position:absolute;right:6px;top:6px;display:flex;gap:3px;align-items:center;z-index:1;font-size:10.5px;color:#fff;text-shadow:0 1px 4px rgba(0,0,0,.6)}.studio-vision-teclas kbd{font:600 10px/1.6 Inter,Arial,sans-serif;min-width:1.5em;text-align:center;padding:0 4px;border-radius:5px;background:rgba(251,248,243,.92);color:var(--ink);border:1px solid rgba(0,0,0,.15);text-shadow:none}
 .studio-vision-badge{position:absolute;left:6px;bottom:6px;font-size:10.5px;font-weight:600;padding:2px 7px;border-radius:999px;background:rgba(251,248,243,.92);color:var(--ink)}
 .studio-vision-img img,.studio-vision-img canvas{width:100%;height:100%;object-fit:cover;display:block}.studio-vision-img .delivery-paper{transform:scale(.9)}
 .studio-vision-ph{font-size:12px;color:var(--ink-muted);padding:10px;text-align:center}.studio-vision-n{font-size:11px;letter-spacing:.2em;color:var(--ink-muted);font-weight:700}
 .studio-vision-tile b{font-family:var(--font-sans);font-size:20px;font-weight:600}.studio-vision-t{font-size:13px;color:var(--ink-muted)}
 .studio-vision-tile.on .studio-vision-img{outline:3px solid var(--action);outline-offset:2px}
 .studio-vision-panel{position:relative;display:grid;grid-template-columns:minmax(0,1.1fr) minmax(0,1fr);gap:18px;margin-top:14px;padding:14px;border-radius:14px;background:var(--surface-panel);border:1px solid rgba(43,40,36,.12)}
 .studio-vision-panel-img{position:relative;border-radius:10px;overflow:hidden;aspect-ratio:16/10;background:var(--line)}.studio-vision-panel-img img{width:100%;height:100%;object-fit:cover;display:block}
 .studio-vision-panel-body h3{font-family:var(--font-sans);font-size:26px;font-weight:600;margin:2px 0 6px}.studio-vision-panel-intro{margin:0 0 10px;color:var(--ink)}
 .studio-vision-servicios{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
 .studio-vision-servicio{all:unset;box-sizing:border-box;display:flex;flex-direction:column;gap:2px;min-height:44px;padding:9px 11px;border-radius:10px;border:1px solid rgba(43,40,36,.2);background:#fff;cursor:pointer}
 .studio-vision-servicio b{font-size:14px;color:var(--action)}.studio-vision-servicio span{font-size:12px;color:var(--ink-muted)}.studio-vision-servicio:hover{border-color:var(--action)}.studio-vision-servicio:focus-visible{outline:3px solid #1f4fb5;outline-offset:2px}.studio-vision-servicio:disabled{opacity:.55;cursor:default}
 .studio-vision-cerrar{position:absolute;top:8px;right:8px;width:40px;height:40px;border-radius:999px;border:1px solid rgba(43,40,36,.2);background:#fff;font-size:20px;cursor:pointer}
 .studio-vision-ia{display:flex;gap:14px;align-items:center;justify-content:space-between;flex-wrap:wrap;margin-top:14px;padding:12px 14px;border-radius:12px;background:var(--select);color:var(--surface-sunken)}.studio-vision-ia div{display:flex;flex-direction:column;gap:2px;max-width:760px}.studio-vision-ia span{font-size:13px;opacity:.85}.studio-vision-ia .btn{min-height:40px}
 @media(max-width:820px){.studio-vision-panel{grid-template-columns:minmax(0,1fr)}.studio-vision-servicios{grid-template-columns:minmax(0,1fr)}}
 .studio-vision-row{grid-template-columns:repeat(5,minmax(0,1fr))!important;gap:14px!important;align-items:start}
 .studio-fase{display:flex;flex-direction:column;gap:6px;padding:10px;border-radius:14px;background:#fff;border:1px solid rgba(43,40,36,.1);min-width:0}
 .studio-fase .studio-vision-img{aspect-ratio:16/10}.studio-fase-cab{display:flex;align-items:baseline;gap:10px;margin-top:6px}.studio-fase-n{font-weight:700;color:var(--action);font-size:15px;letter-spacing:.04em}
 .studio-fase h3{font-family:var(--font-sans);font-weight:600;font-size:clamp(20px,1.8vw,26px);margin:0}.studio-fase-d{margin:0 0 4px;color:var(--ink-muted);font-size:14px;min-height:2.6em}
 .studio-fase-toggle{all:unset;box-sizing:border-box;display:flex;align-items:center;gap:8px;min-height:44px;padding:8px 10px;border-radius:10px;background:var(--surface-sunken);color:var(--ink);font-size:13.5px;cursor:pointer}
 .studio-fase-toggle span{flex:1}.studio-fase-toggle:focus-visible,.studio-opcion:focus-visible{outline:3px solid #1f4fb5;outline-offset:2px}.studio-flecha{transform:rotate(180deg);transition:transform .2s}.studio-fase.abierta .studio-flecha{transform:none}
 .studio-fase-opciones{list-style:none;margin:2px 0 0;padding:0;display:flex;flex-direction:column}.studio-fase-opciones li+li{border-top:1px solid rgba(43,40,36,.08)}
 .studio-opcion{all:unset;box-sizing:border-box;display:flex;gap:10px;align-items:center;width:100%;min-height:44px;padding:7px 6px;cursor:pointer;border-radius:8px}.studio-opcion:hover{background:var(--surface-sunken)}.studio-opcion:disabled{opacity:.5;cursor:default}
 .studio-opcion span{display:flex;flex-direction:column;min-width:0}.studio-opcion b{font-weight:500;font-size:14px;color:var(--ink)}.studio-opcion small{font-size:11.5px;color:var(--ink-muted)}
 .studio-ico{width:20px;height:20px;flex:none;fill:none;stroke:currentColor;stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round;color:var(--action)}
 .studio-vision-ia{display:grid!important;grid-template-columns:auto minmax(0,1.3fr) minmax(0,2fr) auto;gap:16px!important;align-items:center;background:var(--surface-sunken)!important;color:var(--ink)!important;border:1px solid rgba(43,40,36,.1)}
 .studio-ia-insignia{width:56px;height:56px;border-radius:14px;background:var(--action);display:grid;place-items:center}.studio-ia-ico{width:30px;height:30px;color:#fff}
 .studio-ia-txt h3{font-family:var(--font-sans);font-size:24px;margin:0}.studio-ia-txt p{margin:2px 0 0;font-size:13px;color:var(--ink-muted)}
 .studio-ia-caps{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px}.studio-ia-cap{display:flex;flex-direction:column;align-items:center;gap:4px;text-align:center;font-size:12.5px;color:var(--ink)}
 .studio-home{margin-top:14px}
 .studio-todas{all:unset;box-sizing:border-box;display:flex;flex-wrap:wrap;gap:4px 10px;align-items:center;margin-top:12px;min-height:44px;padding:8px 12px;border-radius:12px;border:1px dashed rgba(43,40,36,.3);cursor:pointer;color:var(--ink)}
 .studio-todas span{font-weight:600}.studio-todas small{color:var(--ink-muted)}.studio-todas:focus-visible{outline:3px solid #1f4fb5;outline-offset:2px}
 .studio-todas-dlg{width:min(920px,94vw);max-height:88vh;border:0;border-radius:16px;padding:18px;background:var(--surface-panel);color:var(--ink)}.studio-todas-dlg::backdrop{background:rgba(20,18,16,.45)}
 .studio-todas-cab{display:flex;justify-content:space-between;align-items:center}.studio-todas-cab h2{font-family:var(--font-sans);margin:0;font-size:26px}.studio-todas-cab .studio-vision-cerrar{position:static}
 .studio-todas-nota{font-size:13px;color:var(--ink-muted);margin:6px 0 10px}.studio-todas-q{width:100%;box-sizing:border-box;min-height:44px;padding:8px 12px;border-radius:10px;border:1px solid rgba(43,40,36,.25);font:inherit}
 .studio-todas-filtros{display:flex;flex-wrap:wrap;gap:6px;margin:10px 0}.studio-todas-filtro{min-height:40px;padding:6px 12px;border-radius:999px;border:1px solid rgba(43,40,36,.2);background:#fff;cursor:pointer;font:inherit;font-size:13px}
 .studio-todas-filtro[aria-pressed=true]{background:var(--action);color:#fff;border-color:var(--action)}.studio-todas-grupo h3{font-family:var(--font-sans);font-size:18px;margin:14px 0 6px}
 .studio-todas-item{display:grid;grid-template-columns:minmax(0,1fr) auto auto;gap:10px;align-items:center;padding:8px 0;border-top:1px solid rgba(43,40,36,.08)}
 .studio-todas-item b{display:block;font-weight:600;font-size:14px}.studio-todas-item small{display:block;font-size:12px;color:var(--ink-muted)}.studio-todas-item .btn{min-height:40px}
 .studio-chip{font-size:11px;font-weight:700;padding:3px 8px;border-radius:999px;white-space:nowrap}.studio-chip-available{background:#e3efe7;color:#1d5a3a}.studio-chip-pilot{background:#fff1d6;color:#7a4b00}.studio-chip-simulation{background:#efe6f7;color:#5a3a7a}.studio-chip-validation{background:#e6eef7;color:#24496b}.studio-chip-preparation{background:#eee;color:#555}
 .studio-todas-sin{font-size:12px;color:var(--ink-muted)}
 @media(max-width:620px){.studio-todas-item{grid-template-columns:minmax(0,1fr) auto}.studio-todas-item .btn,.studio-todas-sin{grid-column:1/-1}}
 @media(max-width:1100px){.studio-vision-row{grid-template-columns:repeat(3,minmax(0,1fr))!important}.studio-vision-ia{grid-template-columns:auto minmax(0,1fr) auto}.studio-ia-caps{grid-column:1/-1}}
 @media(max-width:720px){.studio-vision-row{grid-template-columns:minmax(0,1fr)!important}.studio-vision-ia{grid-template-columns:minmax(0,1fr)}.studio-ia-caps{grid-template-columns:repeat(2,minmax(0,1fr))}}
 .studio-vision-cierre{font-family:var(--font-sans);font-size:18px;margin:12px 0 0}
 @media(max-width:1100px){.studio-vision-row{grid-template-columns:repeat(3,1fr)}}@media(max-width:720px){.studio-vision-row{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:420px){.studio-vision-row{grid-template-columns:minmax(0,1fr)}}
 .studio-hero .studio-hero-logo{display:flex;flex-direction:column;gap:4px;font-size:13px}.studio-hero .studio-hero-logo-fila{display:flex;gap:10px;align-items:center}
 .studio-hero .studio-hero-logo-fila .btn{display:inline-flex;align-items:center;min-height:40px;margin:0;cursor:pointer}.studio-hero .studio-hero-logo-img{height:36px;max-width:140px;object-fit:contain;background:var(--ink);border-radius:6px;padding:4px}
 .studio-hero .studio-hero-oculto{position:absolute;width:1px;height:1px;opacity:0;pointer-events:none}`;
 document.head.append(css);
})();
