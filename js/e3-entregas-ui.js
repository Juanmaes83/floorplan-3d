/* STUDIO · E3 · «Entregables profesionales» (navegador).
 * Tarjeta en Entregar y en Mi estudio que abre un flujo en tres pasos — Elegir · Previsualizar · Preparar — sobre los
 * generadores existentes de RUBIK. El acceso sigue la jerarquía de las tarjetas de su área.
 * Sin sistemas paralelos:
 *  - identidad: FloorPlanBrandUI.snapshot() (FloorPlanBrand), sin editor propio;
 *  - imagen firmada: FloorPlanProjectViews.image()/download() y, para el render de Blender, FloorPlanDeliveryImage
 *    (la misma «imagen de entrega» de RUBIK: banda propia, logo, sin datos de contacto);
 *  - cada entregable se prepara con su generador; si no existe en la versión, no se puede elegir ni arrastrar.
 * Salidas «Limpia» y «Con tu firma» siempre separadas y rotuladas; la limpia son los bytes del generador. */
(function(){
 'use strict';
 const C=window.RubikE3Core;if(!C||!window.FloorPlanApp)return;
 const L=()=>{const l=typeof LANG==='string'?LANG:'es';return ['es','en','zh'].includes(l)?l:'es';};
 const tx=(es,en,zh)=>({es,en,zh})[L()]||es;
 const el=(tag,text,parent,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;parent?.append(n);return n;};
 const marca=()=>{try{return window.FloorPlanBrandUI?.snapshot?.()||null;}catch{return null;}};
 const existe=([obj,metodo])=>typeof window[obj]?.[metodo]==='function';
 const disponible=g=>{
  if(!existe(g))return false;
  if(g[0]==='FloorPlanAIRender')return existe(['FloorPlanProjectViews','prepare']);
  if(g[0]==='FloorPlanTourVideo')return existe(['FloorPlanPresentation','open'])&&!!window.FloorPlanTourRecorder?.pickType?.();
  return true;
 };
 // UX-312 E04/E08 (navegación continua): delegar en un generador no expulsa del flujo. Antes de cerrar E3 se registra el
 // retorno (paso, selección, entregable y desplazamiento); cuando se cierra el diálogo que abre el generador (Cerrar o
 // Escape), E3 se reabre en ese paso con su selección, su desplazamiento y el foco en la acción de ese entregable.
 // Si el generador no abre un diálogo (p. ej. la Presentación), no hay retorno que restaurar.
 function ejecutar(e){
  if(!disponible(e.generador))throw Error(tx('El generador no está disponible. Elige otro.','The generator is unavailable. Choose another.','生成器不可用，请选择其他交付物。'));
  const [obj,metodo]=e.generador;
  const retorno={paso,sel:valida().slice(),id:e.id,scroll:dlg.querySelector('.e3-cuerpo')?.scrollTop||0},antes=new Set(document.querySelectorAll('dialog[open]'));
  if(e.id==='render-ia'){
   const v=vistas()[0];
   if(!v)throw Error(tx('Prepara primero una vista actual del proyecto.','Prepare a current view of the project first.','请先准备当前项目视图。'));
   dlg.close();volverTras(retorno,antes);
   return window[obj][metodo](v);
  }
  dlg.close();
  if(e.id==='video'&&!window.FloorPlanPresentation.active)return window.FloorPlanPresentation.open();
  volverTras(retorno,antes);
  return window[obj][metodo]();
 }
 function volverTras(ret,antes){let intentos=0;
  const buscar=()=>{const d=[...document.querySelectorAll('dialog[open]')].find(x=>x!==dlg&&!antes.has(x));
   if(d){d.addEventListener('close',()=>setTimeout(()=>reabrir(ret),0),{once:true});return;}
   if(++intentos<30)setTimeout(buscar,100);};
  setTimeout(buscar,0);}
 async function reabrir(ret){
  if(!dlg||dlg.open||document.querySelector('dialog[open]'))return; // otra tarea ya ocupa la pantalla: no se le roba
  paso=ret.paso;sel=ret.sel.slice();valida();await pintar();if(!dlg.open)dlg.showModal();
  const cuerpo=dlg.querySelector('.e3-cuerpo');if(cuerpo)cuerpo.scrollTop=ret.scroll;
  const accion=dlg.querySelector(`.e3-prep[data-entregable="${CSS.escape(ret.id)}"] button`)||dlg.querySelector('#e3T');accion?.focus({preventScroll:true});
  estado(tx('Has vuelto a «Preparar». Tu selección se conserva.','Back to «Prepare». Your selection is kept.','已返回“准备”，你的选择已保留。'));}
 const EJEMPLO_OP10='assets/e3/op10-entrega-viewer.jpg'; // render Cycles real del OP-10 (perfil delivery) de la vivienda de ejemplo
 const vistas=()=>{try{return window.FloorPlanProjectViews?.current?.()||[];}catch{return [];}};
 const titulo=()=>{const s=marca();const n=window.FloorPlanApp?.project?.name||'';return s?.title||(typeof nm==='function'?nm(n):n);};
 const slug=s=>String(s||'').normalize('NFD').replace(/[^\w]+/g,'-').replace(/^-|-$/g,'').toLowerCase()||'rubik';
 const bajar=(href,nombre)=>{const a=document.createElement('a');a.href=href;a.download=nombre;document.body.append(a);a.click();a.remove();};
 /** Render de Blender firmado con la imagen de entrega de RUBIK (el original no se toca). */
 async function firmarRender(src){const D=window.FloorPlanDeliveryImage;if(!D)throw Error(tx('Compositor de entrega no disponible.','Delivery composer not available.','交付合成器不可用。'));
  // El render de ejemplo es de la vivienda de ejemplo de RUBIK: se rotula como tal, nunca con el título del proyecto abierto.
  const ejemplo=src===EJEMPLO_OP10;
  const data=D.content({title:ejemplo?tx('Vivienda de ejemplo de RUBIK','RUBIK example home','RUBIK 示例住宅'):titulo(),view:tx('Render Blender · Cycles','Blender render · Cycles','Blender 渲染 · Cycles')+(ejemplo?tx(' · ejemplo OP-10',' · OP-10 example',' · OP-10 示例'):''),brand:C.marcaImagen(marca())});
  const fug=C.fugas(marca(),data);if(fug.length)throw Error('OP-05: '+fug.join(', '));
  return D.compose({image:src,format:'landscape',layout:'band',data});}
 // ---------------------------------------------------------------- tarjeta (Entregar y Mi estudio)
 function card(grid,donde){
  if(!grid||grid.querySelector('[data-module="e3-entregas"]'))return null;
  const c=document.createElement('article');c.className='professional-card e3-card';c.dataset.module='e3-entregas';c.dataset.donde=donde;grid.append(c);
  const h=el('h3',tx('Entregables profesionales','Professional deliverables','专业交付物'),c);h.id='e3Card-'+donde;
  el('p',tx('Elige, previsualiza y prepara lo que recibirá tu cliente: imágenes, Blender, documentos, presentaciones y animaciones. Limpias o con tu firma.','Choose, preview and prepare what your client receives: images, Blender, documents, presentations and animations. Clean or signed.','选择、预览并准备客户将收到的内容：图像、Blender、文档、演示与动画。无标识或带签名。'),c,'professional-state');
  const btn=el('button',tx('Preparar entregables','Prepare deliverables','准备交付物'),c,'btn');btn.type='button';btn.dataset.route='e3-entregas';btn.setAttribute('aria-haspopup','dialog');btn.setAttribute('aria-describedby',h.id);btn.onclick=()=>abrir(btn);
  return c;}
 // ---------------------------------------------------------------- diálogo
 let dlg=null,sel=['vistas','blender','lamina'],paso=1,origen=null,ocupado=false,render=0;
 const valida=()=>{sel=C.seleccionValida(sel,disponible);return sel;};
 function abrir(desde){origen=desde||document.activeElement;
  if(!dlg){dlg=document.createElement('dialog');dlg.id='e3Entregas';dlg.className='e3-dlg';dlg.setAttribute('aria-labelledby','e3T');document.body.append(dlg);
   dlg.addEventListener('close',()=>{if(!document.activeElement||document.activeElement===document.body||dlg.contains(document.activeElement)){
    const trigger=origen?.isConnected?origen:document.querySelector('#professionalWorkspace [data-route="e3-entregas"]');
    trigger?.focus();
   }});}
  paso=1;valida();pintar();if(!dlg.open){origen?.focus?.({preventScroll:true});dlg.showModal();}dlg.querySelector('#e3T')?.focus();}
 function cabecera(){const h=el('div',undefined,dlg,'e3-cab');const t=el('h2',tx('Entregables profesionales','Professional deliverables','专业交付物'),h);t.id='e3T';t.tabIndex=-1;
  const x=el('button','×',h,'e3-cerrar');x.type='button';x.setAttribute('aria-label',tx('Cerrar','Close','关闭'));x.onclick=()=>dlg.close();
  const pasos=el('ol',undefined,dlg,'e3-pasos');pasos.setAttribute('aria-label',tx('Pasos','Steps','步骤'));
  [tx('Elegir','Choose','选择'),tx('Previsualizar','Preview','预览'),tx('Preparar','Prepare','准备')].forEach((n,i)=>{const li=el('li',(i+1)+' · '+n,pasos);if(i+1===paso)li.setAttribute('aria-current','step');});
  const m=C.marcaImagen(marca());const f=el('p',undefined,dlg,'e3-firma');
  f.textContent=m?tx(`Tu firma: ${m.name} (Mi estudio). En las imágenes firmadas aparecen tu nombre y tu logo; nunca tus datos de contacto.`,`Your signature: ${m.name} (My studio). Signed images show your name and logo, never your contact details.`,`你的签名：${m.name}（我的事务所）。签名图像只显示名称和标志，从不显示联系方式。`)
   :tx('Sin firma elegida: las imágenes «con tu firma» saldrán como imagen orientativa de RUBIK. Elige tu firma en Mi estudio.','No signature chosen: signed images will be RUBIK reference images. Choose your signature in My studio.','未选择签名：签名图像将作为 RUBIK 参考图像。请在“我的事务所”中选择签名。');
  const st=el('p','',dlg,'e3-estado');st.id='e3Estado';st.setAttribute('role','status');st.setAttribute('aria-live','polite');}
 const estado=msg=>{const s=dlg?.querySelector('#e3Estado');if(s)s.textContent=msg;};
 function pie(){const f=el('div',undefined,dlg,'e3-pie');
  if(paso>1){const a=el('button',tx('← Atrás','← Back','← 返回'),f,'btn');a.type='button';a.dataset.route='e3-atras';a.onclick=()=>{paso--;pintar();};}
  if(paso<3){const s=el('button',paso===1?tx('Previsualizar →','Preview →','预览 →'):tx('Preparar →','Prepare →','准备 →'),f,'btn primary');s.type='button';s.dataset.route='e3-siguiente';s.disabled=!valida().length;s.setAttribute('aria-describedby','e3Estado');s.onclick=()=>{paso++;pintar();};}}
 function miniatura(box,e){
  const proyecto=e.id==='vistas'?vistas()[0]?.dataUrl:null;
  const i=el('img',undefined,box);
  i.alt='';i.loading='lazy';i.decoding='async';
  i.width=360;i.height=225;
  i.addEventListener('error',()=>{
   box.replaceChildren();el('span',e.formato,box,'e3-formato');
  },{once:true});
  i.src=proyecto||`assets/e3/thumbs/${e.id}.webp`;
  el('span',proyecto?tx('Tu proyecto','Your project','你的项目'):e.id==='render-ia'?tx('Dormitorio','Bedroom','卧室'):tx('Ejemplo','Example','示例'),box,'e3-sello');
 }
 const seleccionVacia=()=>tx('Selecciona al menos un entregable para continuar.','Choose at least one deliverable to continue.','请至少选择一项交付物以继续。');
 const chip=e=>e.firma==='nunca'?tx('Siempre limpia','Always clean','始终无标识'):e.firma==='imagen'?tx('Limpia o con tu firma','Clean or signed','无标识或带签名'):tx('Opciones del generador','Generator options','生成器选项');
 function paso1(){const cuerpo=el('div',undefined,dlg,'e3-cuerpo');valida();
  for(const g of C.grupos(L())){const sec=el('fieldset',undefined,cuerpo,'e3-grupo');el('legend',g.nombre,sec);
   for(const e of C.catalogo(L()).filter(e=>e.grupo===g.id)){const ok=disponible(e.generador);const lab=el('label',undefined,sec,'e3-item'+(ok?'':' e3-off'));lab.dataset.entregable=e.id;
    const cb=el('input',undefined,lab);cb.type='checkbox';cb.checked=ok&&sel.includes(e.id);cb.disabled=!ok;
    cb.onchange=()=>{sel=cb.checked?[...sel,e.id]:sel.filter(x=>x!==e.id);valida();dlg.querySelector('[data-route="e3-siguiente"]').disabled=!sel.length;estado(sel.length?tx(`${sel.length} seleccionados`,`${sel.length} selected`,`已选 ${sel.length} 项`):seleccionVacia());};
    const box=el('span',undefined,lab,'e3-mini');box.setAttribute('aria-hidden','true');miniatura(box,e);
    const tt=el('span',undefined,lab,'e3-txt');el('b',e.nombre,tt);el('small',ok?e.que:tx('El generador no está disponible en este navegador o versión. Puedes elegir otro entregable.','The generator is unavailable in this browser or version. You can choose another deliverable.','此浏览器或版本无法使用生成器。请选择其他交付物。'),tt);
    el('span',chip(e),lab,'e3-chip e3-chip-'+e.firma);}}
  if(!sel.length)estado(seleccionVacia());
 }
 async function paso2(){const cuerpo=el('div',undefined,dlg,'e3-cuerpo');
  for(const e of C.catalogo(L()).filter(e=>valida().includes(e.id))){const sec=el('section',undefined,cuerpo,'e3-prev');sec.dataset.entregable=e.id;el('h3',e.nombre,sec);
   if(e.id==='vistas'||e.id==='blender'){
    const v=vistas()[0],src=e.id==='blender'?EJEMPLO_OP10:v?.dataUrl;
    if(!src){el('p',tx('Aún no hay vistas preparadas: prepáralas en el paso 3.','No views prepared yet: prepare them in step 3.','尚未准备视图：请在第 3 步准备。'),sec,'e3-nota');continue;}
    const par=el('div',undefined,sec,'e3-par');
    const f1=el('figure',undefined,par,'e3-fig');const i1=el('img',undefined,f1);i1.src=src;i1.alt=tx('Salida limpia','Clean output','无标识输出');el('figcaption',tx('Limpia · sin marca','Clean · no branding','无标识'),f1);
    const f2=el('figure',undefined,par,'e3-fig e3-firmada');const cap=el('figcaption',tx('Con tu firma · imagen de entrega de RUBIK','Signed · RUBIK delivery image','带签名 · RUBIK 交付图像'),f2);
    try{const out=e.id==='blender'?await firmarRender(src):await window.FloorPlanProjectViews.image(v.id);const i2=el('img',undefined);i2.src=out.dataUrl;i2.alt=tx('Salida con tu firma','Signed output','带签名输出');f2.insertBefore(i2,cap);}
    catch(err){el('p',tx('No se pudo componer la firma: ','Could not compose the signature: ','无法合成签名：')+err.message,f2,'e3-nota');}
    if(e.id==='blender')el('p',tx('La escena y el GLB del paquete OP-10 no se tocan: la firma se compone sobre una COPIA del render (prototipo de laboratorio, no activo). Imagen: render Cycles real de la vivienda de ejemplo.','The OP-10 scene and GLB are untouched: the signature is composed on a COPY of the render (lab prototype, not active). Image: real Cycles render of the example home.','OP-10 场景与 GLB 不变：签名合成于渲染副本（实验原型，未启用）。'),sec,'e3-nota');}
   else el('p',e.firma==='nunca'?tx('Salida técnica: siempre limpia.','Technical output: always clean.','技术输出：始终无标识。'):e.id==='lamina'?tx('Revisa el campo «Firmar con» al abrir la lámina.','Review the «Sign with» field when you open the sheet.','打开图纸后检查“签名”字段。'):tx('El generador aplica sus propias opciones de firma. Revísalas al abrirlo.','The generator applies its own signing options. Review them when you open it.','生成器使用自己的签名选项，请打开后检查。'),sec,'e3-nota');}}
 async function prepararVistas(){
  const V=window.FloorPlanProjectViews;
  if(!V?.prepare)throw Error(tx('El generador de vistas no está disponible. Puedes elegir otro entregable.','The view generator is unavailable. You can choose another deliverable.','视图生成器不可用，请选择其他交付物。'));
  const currentRender=render;
  estado(tx('Preparando las vistas reales del proyecto…','Preparing the real project views…','正在准备项目真实视图…'));
  await V.prepare();
  if(!dlg.open||render!==currentRender)return;
  if(V.status()!=='ready')throw Error(V.error||tx('No se prepararon las vistas. Inténtalo de nuevo.','Views were not prepared. Try again.','未能准备视图，请重试。'));
  await pintar();
  estado(tx(`${vistas().length} vistas preparadas.`,`${vistas().length} views prepared.`,`已准备 ${vistas().length} 个视图。`));
 }
 function paso3(){const cuerpo=el('div',undefined,dlg,'e3-cuerpo');
  for(const e of C.catalogo(L()).filter(e=>valida().includes(e.id))){const row=el('div',undefined,cuerpo,'e3-prep');row.dataset.entregable=e.id;const tt=el('div',undefined,row,'e3-txt');el('b',e.nombre,tt);el('small',e.formato,tt);
   const acc=el('div',undefined,row,'e3-acc');
   const b=(t,ruta,fn,primary)=>{const x=el('button',t,acc,'btn'+(primary?' primary':''));x.type='button';x.dataset.route=ruta;x.onclick=async()=>{if(ocupado)return;ocupado=true;x.setAttribute('aria-busy','true');
     try{await fn();}catch(err){estado(err.message);window.toast?.(err.message,5000);}finally{ocupado=false;x.removeAttribute('aria-busy');}};return x;};
   if(e.id==='vistas'){const v=vistas();
    if(!v.length)b(tx('Preparar las vistas','Prepare the views','准备视图'),'e3-preparar-vistas',prepararVistas,true);
    else{b(tx('Descargar limpias','Download clean','下载无标识'),'e3-vistas-limpias',()=>{v.forEach(x=>bajar(x.dataUrl,`rubik-sota-${slug(x.label)}-limpia.png`));estado(tx(`${v.length} imágenes limpias descargadas.`,`${v.length} clean images downloaded.`,`已下载 ${v.length} 张无标识图像。`));});
     b(tx('Descargar con tu firma','Download signed','下载签名版'),'e3-vistas-firmadas',async()=>{for(const x of v)await window.FloorPlanProjectViews.download(x.id);estado(tx(`${v.length} imágenes firmadas descargadas.`,`${v.length} signed images downloaded.`,`已下载 ${v.length} 张签名图像。`));},true);}}
   else if(e.id==='render-ia'&&!vistas().length){
    el('p',tx('Primero prepara las vistas del proyecto. Este paso es local.','Prepare the project views first. This step runs locally.','请先准备项目视图。此步骤在本地运行。'),tt,'e3-nota');
    b(tx('Preparar las vistas','Prepare the views','准备视图'),'e3-preparar-vistas-ia',prepararVistas,true);
   }else{
    const label=e.id==='video'&&!window.FloorPlanPresentation?.active?tx('Abrir Presentación','Open Presentation','打开演示'):tx('Abrir','Open','打开');
    b(label,'e3-preparar-'+e.id,()=>ejecutar(e),true);
   }}}
 async function pintar(){
  const currentRender=++render;
  dlg.replaceChildren();cabecera();
  if(paso===1)paso1();else if(paso===2)await paso2();else paso3();
  if(render!==currentRender)return;
  pie();dlg.querySelector('#e3T')?.focus();
 }
 window.RubikE3Entregables={card,abrir,firmarRender,get seleccion(){return valida().slice();},set seleccion(v){sel=[...v];valida();}};
 const css=document.createElement('style');css.textContent=`
 .e3-dlg{width:min(1040px,96vw);max-height:92vh;max-height:92dvh;border:0;border-radius:16px;padding:18px;background:var(--surface-app);color:var(--ink);box-sizing:border-box;overflow:hidden}
 .e3-dlg[open]{display:grid;grid-template-columns:auto minmax(0,1fr);grid-template-rows:auto auto auto auto minmax(0,1fr) auto}
 .e3-dlg::backdrop{background:rgb(31 35 38 / .42)}
 .e3-cab,.e3-pasos,.e3-firma,.e3-estado,.e3-cuerpo{grid-column:1/-1}
 .e3-cab{display:flex;justify-content:space-between;align-items:center;gap:8px}.e3-cab h2{font-family:var(--font-sans);margin:0;font-size:clamp(20px,3vw,26px)}
 .e3-cerrar{flex:none;width:44px;height:44px;border-radius:999px;border:1px solid var(--line);background:var(--surface-panel);font-size:22px;cursor:pointer}
 .e3-pasos{display:flex;gap:6px;list-style:none;padding:0;margin:6px 0;flex-wrap:wrap}
 .e3-pasos li{padding:4px 10px;border-radius:999px;background:var(--select-soft);font-size:13px}.e3-pasos li[aria-current]{background:var(--select);color:var(--select-ink);font-weight:600}
 .e3-firma{font-size:13px;color:var(--ink-muted);margin:0 0 4px}.e3-estado{font-size:13px;color:var(--ink);margin:2px 0 4px}
 .e3-estado:empty{margin:0}
 .e3-cuerpo{min-height:0;display:grid;align-content:start;gap:12px;overflow:auto;overscroll-behavior:contain;padding:4px;scroll-padding:4px;scrollbar-gutter:stable}
 .e3-grupo{min-width:0;border:0;padding:0;margin:0;display:grid;align-content:start;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.e3-grupo legend{font-family:var(--font-sans);font-size:18px;margin:6px 0}
 .e3-dlg .e3-item{margin:0}
 .e3-item{display:grid;grid-template-columns:auto 112px minmax(0,1fr);grid-template-areas:'c m t' 'c m h';gap:3px 8px;align-items:center;padding:8px;border-radius:12px;background:var(--surface-panel);border:1px solid var(--line);cursor:pointer;min-height:68px}
 .e3-item:has(input:checked){border-color:var(--line-strong);background:var(--select-soft)}
 .e3-item:focus-within{outline:2px solid var(--focus);outline-offset:1px}
 .e3-item input{grid-area:c;width:22px;height:22px;margin:0;accent-color:var(--select)}
 .e3-mini{grid-area:m;position:relative;width:100%;aspect-ratio:16/10;border-radius:7px;overflow:hidden;background:var(--surface-sunken);display:grid;place-items:center}
 .e3-mini img{width:100%;height:100%;object-fit:cover}.e3-txt{grid-area:t;display:flex;flex-direction:column;min-width:0}.e3-txt b{font-size:14px}.e3-txt small{font-size:12px;color:var(--ink-muted)}
 .e3-chip{grid-area:h;justify-self:start;font-size:11px;font-weight:600;padding:2px 7px;border-radius:999px;background:var(--surface-sunken);color:var(--ink)}
 .e3-chip-nunca{background:var(--action-soft);color:var(--action-pressed)}
 .e3-off{cursor:default}.e3-off .e3-mini{filter:grayscale(.65)}
 .e3-sello{position:absolute;left:3px;bottom:3px;font-size:9px;font-weight:700;padding:1px 5px;border-radius:999px;background:var(--surface-panel);color:var(--ink)}.e3-formato{font-size:10px;font-weight:700}
 .e3-prev h3{font-family:var(--font-sans);margin:4px 0}.e3-par{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.e3-fig{margin:0;display:flex;flex-direction:column;gap:4px}.e3-fig img{width:100%;height:auto;border-radius:10px;border:1px solid var(--line)}.e3-fig figcaption{font-size:12px;font-weight:600}
 .e3-firmada figcaption{color:var(--action)}.e3-nota{font-size:13px;color:var(--ink-muted);margin:0}
 .e3-prep{display:flex;gap:10px;align-items:center;justify-content:space-between;flex-wrap:wrap;padding:8px 0;border-top:1px solid var(--line)}.e3-acc{display:flex;gap:6px;flex-wrap:wrap}.e3-acc .btn,.e3-pie .btn{min-height:44px}
 .e3-acc .btn[aria-busy=true]{opacity:.7;cursor:progress}
 .e3-pie{grid-area:6/2;min-width:0;display:flex;flex-wrap:wrap;gap:6px;justify-content:flex-end;align-items:center;padding:6px 0 0 6px;border-top:1px solid var(--line)}
 .e3-dlg #assistantAccess{grid-area:6/1;position:static;align-self:start;margin:0;padding:6px 6px 0 0;max-width:none;border-top:1px solid var(--line)}
 @media(max-width:720px){.e3-grupo,.e3-par{grid-template-columns:minmax(0,1fr)}.e3-item{grid-template-columns:auto clamp(68px,23vw,100px) minmax(0,1fr)}.e3-dlg{padding:12px}}
 @media(max-height:440px){.e3-dlg{padding:8px 12px}.e3-cab h2{font-size:20px}.e3-pasos{margin:3px 0}.e3-firma{font-size:12px}}
 `;document.head.append(css);
})();
