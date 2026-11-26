/* UX-312 · PERLA · Editor en dos filas (V4 aprobada). Capa de DISPOSICIÓN, no de comportamiento:
   - mueve los controles existentes (mismos id, mismos manejadores, mismos destinos) a su sitio de la V4;
   - no crea acciones nuevas: los pocos botones propios (proyecto, tareas, acción principal, ayuda, pestañas del
     Inspector) delegan en el control vigente (`projectsBtn`, la guía, `guidePrimary`, los atajos, el panel);
   - el estado sigue siendo de quien lo tenía: la guía decide la tarea y su acción, el visor el zoom, el panel la selección.
   Mapa funcional: QA-CODEX/UX-312/editor-dos-filas/MAPA-FUNCIONAL-EDITOR.md (laboratorio, 52b06bd3).
   Script clásico; se carga al final, después de guide-ui, app-shell, build-palette y professional-workspace-ui. */
(function(){
 'use strict';
 const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
 const header=$('.app > header'),app=$('.app');if(!header||!app)return;
 const tx=(es,en,zh)=>{const l=typeof LANG==='string'?LANG:'es';return l==='en'?en:l==='zh'?zh:es;};
 const el=(tag,attrs={},parent,text)=>{const n=document.createElement(tag);for(const[k,v]of Object.entries(attrs))if(v!==undefined&&v!==null)n.setAttribute(k,v);if(text!==undefined)n.textContent=text;parent?.append(n);return n;};
 const move=(sel,parent)=>{const n=typeof sel==='string'?$(sel):sel;if(n&&parent)parent.append(n);return n;};
 const ICON={
  home:'<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  copy:'<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>',
  chev:'<path d="M6 9l6 6 6-6"/>',search:'<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',
  help:'<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6V14"/><circle cx="12" cy="17.5" r=".6"/>',
  more:'<circle cx="5" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="19" cy="12" r="1.4"/>',
  upload:'<path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3"/>',
  file:'<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4"/>',list:'<path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1"/><circle cx="4.5" cy="12" r="1"/><circle cx="4.5" cy="18" r="1"/>',
  present:'<rect x="3" y="4" width="18" height="12" rx="1"/><path d="M12 16v4M8 20h8"/>',studio:'<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/>',
  layers:'<path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/>',lib:'<rect x="3" y="4" width="18" height="16" rx="1"/><path d="M9 4v16"/>',
  panel:'<rect x="3" y="4" width="18" height="16" rx="1"/><path d="M15 4v16"/>',spark:'<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/>'};
 const svg=(name,size=18)=>`<svg class="perla-ico" viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[name]||''}</svg>`;
 document.body.classList.add('perla');

 // ── Fila 1 · identidad · áreas centradas · utilidades ──
 const r1=el('div',{class:'perla-r1',role:'toolbar','aria-label':tx('Proyecto y áreas','Project and areas','项目与区域')}),r2=el('div',{class:'perla-r2',role:'toolbar','aria-label':tx('Archivo, vista y paso','File, view and step','文件、视图与步骤')});
 header.prepend(r1,r2);
 const left=el('div',{class:'perla-left'},r1),center=el('div',{class:'perla-areas'},r1),right=el('div',{class:'perla-utils'},r1);
 // Marca: lleva a Inicio con el mismo control de siempre (`welcomeBtn`, nombre accesible «Ir a Inicio»).
 const home=move('#welcomeBtn',left);if(home){home.classList.add('perla-brand');home.innerHTML=`${svg('home',20)}<b>Rubik Sota</b>`;home.setAttribute('aria-label',tx('Ir a Inicio','Go to Home','前往首页'));}
 const brand=$('header .brand');if(brand)brand.classList.add('perla-brand-meta'),left.append(brand);
 // Selector de proyecto: nombre compacto (completo en el título); abre la biblioteca local por la vía existente.
 // Selector de proyecto = el propio #projectsBtn (mismo manejador: abre la biblioteca local). Su texto i18n se conserva
 // en el DOM; la ficha muestra el nombre del proyecto con data-perla-name (CSS), sin pisar las traducciones del botón.
 const proj=move('#projectsBtn',left)||el('button',{type:'button',class:'btn'},left);proj.classList.add('perla-project');proj.setAttribute('aria-haspopup','dialog');
 const projName=()=>{let n='';try{n=(typeof project==='object'&&project?.name)||'';}catch{}const shown=typeof nm==='function'?nm(n):n;return shown||tx('Proyecto','Project','项目');};
 const paintProject=()=>{const raw=projName(),ex=$('#guideBar')?.getAttribute('data-project-kind')==='example'&&!window.FloorPlanApp?.entryInfo?.()?.variantOf/* §7.2: una variante se nombra siempre por su nombre, para saber cuál se edita */,n=ex?tx('Proyecto de ejemplo','Example project','示例项目'):raw;proj.dataset.perlaName=n;proj.title=tx(`Proyecto activo: ${n}. Abrir la biblioteca de proyectos`,`Active project: ${n}. Open the project library`,`当前项目：${n}。打开项目库`);proj.setAttribute('aria-label',proj.title);};
 // «Crear copia» del ejemplo: es el MISMO botón de la guía (copia local con id propio); solo visible en el ejemplo.
 const exampleLine=$('.guide-example'),copyBtn=move('#guideCopyExample',left);
 if(copyBtn){copyBtn.classList.add('perla-copy');const lbl=()=>{copyBtn.innerHTML=`${svg('copy',15)}<span class="perla-copy-label">${tx('Crear copia','Create copy','创建副本')}</span>`;copyBtn.setAttribute('aria-label',tx('Crear una copia local del ejemplo','Create a local copy of the example','创建示例的本地副本'));};lbl();
  // Visible mientras el proyecto activo sea el ejemplo (dato que publica la guía en #guideBar[data-project-kind]).
  const isExample=()=>$('#guideBar')?.getAttribute('data-project-kind')==='example';
  const sync=()=>{copyBtn.hidden=!isExample();paintProject();};
  const gb=$('#guideBar');if(gb)new MutationObserver(sync).observe(gb,{attributes:true,attributeFilter:['data-project-kind']});sync();copyBtn._perlaLabel=lbl;copyBtn._perlaExample=isExample;}
 // §9 · Un único control de proyecto: el nombre real (abre la biblioteca, como siempre) y su menú ▾ con las acciones de
 // proyecto, cada una con el efecto en su etiqueta. Cada entrada acciona el flujo existente (mismos ids y manejadores).
 const projWrap=el('div',{class:'perla-projwrap',role:'group'},left);projWrap.append(proj);
 const pmenu=el('details',{class:'perla-dd perla-menu perla-projmenu',id:'perlaProjectMenu'},projWrap),pmSum=el('summary',{class:'btn perla-icon'},pmenu),pmPop=el('div',{class:'menu-pop perla-pop perla-projpop',role:'menu'},pmenu);
 const pmItem=(id,run)=>{const b=el('button',{type:'button',class:'btn perla-pm-item',id,role:'menuitem'},pmPop);b.onclick=async ev=>{pmenu.open=false;try{await run(ev);}catch(e){window.toast?.(e.message,6000);}};return b;};
 const pmOpen=pmItem('pmOpenOther',()=>$('#projectsBtn').click());
 const pmUpload=pmItem('pmUpload',()=>$('#importImage').click());
 const pmCopy=pmItem('pmCopy',()=>{if($('#guideBar')?.getAttribute('data-project-kind')==='example'&&$('#guideCopyExample'))return $('#guideCopyExample').click();return window.FloorPlanApp.duplicateActive();});
 const pmVariant=pmItem('pmVariant',ev=>window.FloorPlanStoryLayersUI?.createVariant?window.FloorPlanStoryLayersUI.createVariant(ev):window.FloorPlanApp.createVariant(ev));
 const pmJson=pmItem('pmDownloadJson',()=>$('#exportJsonQuick').click());
 el('hr',{class:'perla-pm-sep','aria-hidden':'true'},pmPop);
 const pmMore=el('div',{class:'perla-pm-more',role:'group'},pmPop);
 for(const id of ['newProjectBtn','importJson','joinRoomPlan'])move('#'+id,pmMore);
 const pmSave=el('p',{class:'perla-pm-note',id:'pmSaveNote'},pmPop);
 const paintProjectMenu=()=>{const ex=$('#guideBar')?.getAttribute('data-project-kind')==='example';
  const set=(b,t,d)=>{b.innerHTML=`<b>${t}</b><small>${d}</small>`;b.setAttribute('aria-label',t+'. '+d);};
  set(pmOpen,tx('Abrir otro proyecto…','Open another project…','打开其他项目…'),tx('Biblioteca de este navegador: cambia el proyecto activo','This browser’s library: switches the active project','本浏览器项目库：切换当前项目'));
  set(pmUpload,tx('Subir plano o proyecto…','Upload plan or project…','上传平面图或项目…'),tx('Imagen, PDF o proyecto: crea un proyecto nuevo; el abierto no cambia','Image, PDF or project: creates a new project; the open one is unchanged','图片、PDF 或项目：新建项目；当前项目不变'));
  set(pmCopy,tx('Crear copia','Create copy','创建副本'),ex?tx('Copia independiente del ejemplo para editarla','Independent copy of the example to edit','可编辑的示例独立副本'):tx('Proyecto independiente con id propio; el original no cambia','Independent project with its own id; the original is unchanged','独立项目（新 ID）；原项目不变'));
  set(pmVariant,tx('Crear variante','Create variant','创建变体'),tx('Vinculada al original para comparar y contar el cambio','Linked to the original to compare and tell the change','与原项目关联，用于比较与说明'));
  set(pmJson,tx('Descargar proyecto JSON','Download project JSON','下载项目 JSON'),tx('Archivo editable a tu equipo','Editable file to your computer','可编辑文件下载到电脑'));
  pmSave.textContent=tx('«Guardado local» = se guarda solo en este navegador. Para llevarlo a otro equipo, descarga el JSON.','«Saved locally» = kept only in this browser. To take it to another computer, download the JSON.','“本地保存”仅保存在此浏览器。要带到其他电脑，请下载 JSON。');
  pmSum.innerHTML=svg('chev',14);pmSum.setAttribute('aria-label',tx('Acciones del proyecto','Project actions','项目操作'));pmSum.title=pmSum.getAttribute('aria-label');projWrap.setAttribute('aria-label',tx('Proyecto','Project','项目'));};
 pmenu.addEventListener('toggle',()=>{if(pmenu.open){paintProjectMenu();pmOpen.focus({preventScroll:true});}});
 pmPop.addEventListener('keydown',e=>{const items=[...pmPop.querySelectorAll('button:not([hidden])')],i=items.indexOf(document.activeElement);
  if(e.key==='Escape'){e.preventDefault();pmenu.open=false;pmSum.focus();}else if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();items[(i+(e.key==='ArrowDown'?1:-1)+items.length)%items.length]?.focus();}});
 document.addEventListener('pointerdown',e=>{if(pmenu.open&&!pmenu.contains(e.target))pmenu.open=false;});
 // «Crear copia» vive en el menú: el botón de la guía conserva id y manejador, dentro del menú (oculto en la fila).
 if(copyBtn){copyBtn.classList.add('perla-copy-moved');pmPop.append(copyBtn);}
 // Áreas: los mismos botones de la barra de áreas, centrados y con más peso.
 for(const id of ['workArea-design','workArea-analyze','workArea-budget','workArea-deliver'])move('#'+id,center);
 center.setAttribute('role','navigation');center.setAttribute('aria-label',tx('Áreas de trabajo','Work areas','工作区域'));
 // Utilidades compactas: búsqueda de acciones, historial de sesión, Mi estudio, ayuda, idioma y «Más».
 const search=move('#actionSearchBtn',right);if(search){search.classList.add('perla-icon');search.insertAdjacentHTML('afterbegin',svg('search'));search.setAttribute('aria-label',tx('Buscar una acción','Search an action','搜索操作'));}
 const hist=move('#editHistory',right);if(hist){hist.setAttribute('role','group');hist.setAttribute('aria-label',tx('Historial de sesión','Session history','会话历史'));}
 const studio=move('#workArea-studio',right);if(studio)studio.classList.add('perla-studio');
 el('span',{class:'perla-assistant-slot'},right);
 const help=el('button',{type:'button',id:'perlaHelp',class:'btn perla-icon','aria-haspopup':'dialog'},right);help.innerHTML=svg('help');
 const lang=move('#langBtn',right);if(lang)lang.classList.add('perla-lang');
 const more=el('details',{class:'perla-dd perla-more',id:'perlaMore'},right),moreSum=el('summary',{class:'btn perla-icon'},more);moreSum.innerHTML=svg('more');const morePop=el('div',{class:'menu-pop perla-pop'},more);
 for(const id of ['fullscreen'])move('#'+id,morePop);
 if(hist){
  const compactHistory=matchMedia('(max-width:760px), (max-width:1100px) and (max-height:500px)');
  const placeHistory=()=>{if(compactHistory.matches)morePop.prepend(hist);else{const v=$('.perla-r2 #viewSeg');if(v)v.after(hist);else right.insertBefore(hist,studio);}};
  placeHistory();compactHistory.addEventListener('change',placeHistory);
 }
 const legal=$('#legalLink');if(legal){const b=el('button',{type:'button',id:'perlaLegal',class:'btn'},morePop);b.onclick=()=>{more.open=false;legal.click();};b._t=()=>b.textContent=tx('Legal y uso','Legal and use','法律与使用');b._t();}
 // Ayuda general = atajos y ayuda existentes (la guía tiene su propio botón «Tareas del proyecto»).
 help.onclick=()=>{const k=$('#panel [data-group="keys"] summary,#panel [data-group="keys"]');if(k){openTab('informe');const d=k.closest('details');if(d)d.open=true;k.scrollIntoView({block:'nearest'});(d?.querySelector('summary')||k).focus?.({preventScroll:true});}};

 // ── Fila 2 · Importar · Archivo · vista · paso · tareas · Presentar · acción principal ──
 // §9 · «Subir plano» y sus variantes pasan al menú de proyecto (mismo id y manejador); la fila 2 queda para la tarea actual.
 const impWrap=el('div',{class:'perla-split perla-pm-import',role:'group'},pmPop);const up=move('#uploadPlanBtn',impWrap);if(up)up.classList.add('perla-split-main');
 const imp=el('details',{class:'perla-dd perla-menu',id:'perlaImport'},impWrap),impSum=el('summary',{class:'btn'},imp),impPop=el('div',{class:'menu-pop perla-pop'},imp);
 // «Importar proyecto JSON» sigue en «Archivo» (junto a «Guardar»), como en la app; aquí, plano, RoomPlan, nuevo, imagen y unir.
 for(const id of ['uploadPlanHelp','roomPlanJoinQuick','newProjectBtn','importImage','joinRoomPlan'])move('#'+id,impPop);
 // Una entrada visible por acción: «Subir plano o proyecto…» (pmUpload) acciona este mismo flujo; los botones de siempre
 // conservan id y manejador pero no se repiten en el menú. «Nuevo proyecto» y «Unir escaneo RoomPlan…» siguen visibles.
 impWrap.classList.add('perla-pm-dup');for(const id of ['newProjectBtn','joinRoomPlan'])move('#'+id,pmMore);
 // Estado de las medidas en la barra de estado (V4: «Medidas orientativas»), con su id y su manejador.
 {const sc=$('#scaleConfidence'),foot=$('.app > footer');if(sc&&foot){sc.classList.add('perla-scale-state');foot.prepend(sc);}}
 move('#uploadCancel',r2);
 const fileMenu=$$('header details.menu').find(d=>d.querySelector('#exportPng'));
 if(fileMenu){fileMenu.classList.add('perla-menu');fileMenu.id='perlaFile';r2.append(fileMenu);fileMenu.querySelector('.menu-pop')?.classList.add('perla-pop');}
 // «Guardar proyecto JSON» es la descarga: su entrada visible es «Descargar proyecto JSON» del menú de proyecto.
 move('#exportJsonQuick',pmMore);$('#exportJsonQuick')?.classList.add('perla-pm-dup-btn');
 const view=move('#viewSeg',r2);
 // §9 · Deshacer/rehacer son de la tarea actual: van tras la vista (en pantalla compacta siguen en «Más»).
 if(hist&&view&&!matchMedia('(max-width:760px), (max-width:1100px) and (max-height:500px)').matches)view.after(hist);
 move('#levelBar',r2);move('#levelStatus',r2);
 el('span',{class:'perla-break','aria-hidden':'true'},r2);
 const prog=el('div',{class:'perla-progress',id:'perlaProgress',role:'status','aria-live':'polite'},r2);
 const step=el('div',{class:'perla-step'},prog),bar=el('div',{class:'perla-meter',role:'progressbar','aria-valuemin':'0','aria-valuemax':'100'},prog);el('i',{},bar);
 move('#guideResume',r2);
 const tasks=el('button',{type:'button',id:'perlaTasks',class:'btn perla-tasks','aria-expanded':'false','aria-controls':'guideBar'},r2);
 el('span',{class:'perla-spacer'},r2);
 const present=move('#presentationBtn',r2);if(present)present.classList.add('perla-secondary');
 const primary=el('button',{type:'button',id:'perlaPrimary',class:'btn perla-primary'},r2);
 // Herramientas de trabajo que la V4 no muestra en la cabecera conservan su control y su id (ocultos donde ya lo estaban).
 const keep=el('div',{class:'perla-keep',hidden:''},header);for(const c of [...header.children])if(c!==r1&&c!==r2&&c!==keep&&c.id!=='mobileDock'&&!/^(fileIn|uploadIn|roomPlanJoinIn)$/.test(c.id)&&c.tagName!=='INPUT')keep.append(c);

 // ── Guía a demanda: «Tareas del proyecto» abre/cierra la guía real; el resumen lee su progreso real ──
 const guide=$('#guideBar');
 // Si la guía se cierra (o pasa al editor completo) con su panel abierto, el panel se retira con ella.
 if(guide)new MutationObserver(()=>{if(guide.hidden&&document.body.classList.contains('perla-guide-open')){document.body.classList.remove('perla-guide-open');$('#perlaTasks')?.setAttribute('aria-expanded','false');}}).observe(guide,{attributes:true,attributeFilter:['hidden']});
 function readGuide(){
  const journey=guide?.querySelector('.guide-journey-label')?.textContent||'',prog=guide?.querySelector('.guide-progress-line strong')?.textContent||'',meter=guide?.querySelector('.guide-progress');
  const m=journey.match(/(\d)\D+(\d)\s*·\s*(.+)$/),pct=+(meter?.getAttribute('aria-valuenow')||0),t=(prog.split('·')[1]||'').match(/(\d+)\D+(\d+)/);
  return {stepN:m?m[1]:null,stepT:m?m[2]:null,stepName:m?m[3].trim():'',pct,done:t?t[1]:null,total:t?t[2]:null};
 }
 function paintProgress(){
  const g=readGuide(),closed=!guide||(guide.hidden&&!document.body.classList.contains('perla-guide-open'));
  step.innerHTML=g.stepN?`<b>${tx(`Paso ${g.stepN} de ${g.stepT}`,`Step ${g.stepN} of ${g.stepT}`,`第 ${g.stepN}/${g.stepT} 步`)}</b> · ${g.stepName}<small>${g.done?tx(`${g.done}/${g.total} tareas necesarias`,`${g.done}/${g.total} required tasks`,`${g.done}/${g.total} 项必要任务`):''}</small>`:`<b>${tx('Proyecto','Project','项目')}</b>`;
  bar.setAttribute('aria-valuenow',String(g.pct));bar.querySelector('i').style.width=g.pct+'%';bar.setAttribute('aria-label',tx('Progreso del recorrido','Journey progress','进度'));
  tasks.innerHTML=`${svg('list',16)}<span>${tx('Tareas del proyecto','Project tasks','项目任务')}</span>${svg('chev',14)}`;
  // Acción principal = la acción real de la tarea actual (`guidePrimary`): mismo texto, mismo estado, mismo efecto.
  const gp=$('#guidePrimary');primary.hidden=!gp||!gp.textContent.trim()||gp.hidden;if(gp){const t=gp.textContent.trim(),is3d=/^(Abrir 3D|Open 3D|打开 3D)$/.test(t);primary.textContent=is3d?tx('Revisar en 3D (paso)','Review in 3D (step)','在 3D 中检查（步骤）'):t;primary.dataset.task3d=is3d?'1':'';primary.disabled=gp.disabled;primary.title=is3d?tx('Abre la misma escena 3D y marca como hecho el paso «Revisa la distribución en 3D». «Escena 3D» solo cambia la vista, sin marcar el paso.','Opens the same 3D scene and marks the step «Review the layout in 3D» as done. «3D scene» only switches the view, without marking the step.','打开同一 3D 场景并将“在 3D 中检查布局”标记为完成。“3D 场景”仅切换视图。'):(gp.title||'');}
  if(present){present.textContent=tx('Presentar vivienda','Present the home','展示住宅');present.insertAdjacentHTML('afterbegin',svg('present',16));}
  if(impSum){impSum.innerHTML=svg('chev',16);impSum.setAttribute('aria-label',tx('Más formas de importar o empezar','More ways to import or start','更多导入或开始方式'));impSum.title=impSum.getAttribute('aria-label');}impWrap.setAttribute('aria-label',tx('Importar','Import','导入'));
  const fs=fileMenu?.querySelector('summary');if(fs)fs.innerHTML=`${svg('file',16)}<span>${tx('Archivo','File','文件')}</span>${svg('chev',14)}`;
  help.setAttribute('aria-label',tx('Ayuda y atajos','Help and shortcuts','帮助与快捷键'));help.title=help.getAttribute('aria-label');moreSum.setAttribute('aria-label',tx('Más opciones','More options','更多选项'));
  copyBtn?._perlaLabel?.();paintProject();paintProjectMenu();
 }
 primary.onclick=()=>$('#guidePrimary')?.click();
 function setGuide(open,{focus=true}={}){
  document.body.classList.toggle('perla-guide-open',open);tasks.setAttribute('aria-expanded',String(open));
  if(open){if(guide?.hidden){$('#guideResume')?.click();}guide?.querySelector('#guideCompact,#guidePrimary,button')?.focus?.({preventScroll:true});}
  else if(focus)tasks.focus({preventScroll:true});
 }
 guide?.addEventListener('rubik:guide-reveal',()=>setGuide(true,{focus:false}));
 $('#guideResume')?.addEventListener('click',()=>{if(guide&&!guide.hidden)setGuide(true);});
 tasks.onclick=()=>setGuide(!document.body.classList.contains('perla-guide-open'));
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&document.body.classList.contains('perla-guide-open')&&guide?.contains(document.activeElement)){e.preventDefault();setGuide(false);}},true);
 if(guide)new MutationObserver(()=>paintProgress()).observe(guide,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['aria-valuenow','hidden','disabled']});
 const gp=$('#guidePrimary');if(gp)new MutationObserver(paintProgress).observe(gp,{childList:true,characterData:true,subtree:true,attributes:true});

 // ── Lienzo: capas, zoom/Ajustar/escala, norte y paneles junto al dibujo ──
 const stage=$('#stage');
 if(stage){
  const top=el('div',{class:'perla-canvas-top',role:'toolbar','aria-label':tx('Representación del plano','Plan display','平面显示')},stage);
  const layers=$('#layers'),layersMenu=$('#layersMenu');
  for(const k of ['dims','labels','furn']){const b=layers?.querySelector(`[data-layer="${k}"]`);if(b)top.append(b);}
  // U9: «Estancias» del lienzo (mostrar u ocultar) y la pestaña «Estancias» del Inspector se distinguen por su nombre accesible.
  const layerNames={dims:['Mostrar u ocultar cotas','Show or hide dimensions','显示或隐藏尺寸'],labels:['Mostrar u ocultar nombres de estancias','Show or hide room names','显示或隐藏房间名称'],furn:['Mostrar u ocultar muebles','Show or hide furniture','显示或隐藏家具']};
  const nameLayers=()=>{for(const [k,n] of Object.entries(layerNames)){const b=top.querySelector(`[data-layer="${k}"]`);if(b){b.setAttribute('aria-label',tx(...n));b.title=tx(...n);}}};nameLayers();
  document.addEventListener('rubik:languagechange',()=>queueMicrotask(nameLayers));
  if(layersMenu){top.append(layersMenu);const s=layersMenu.querySelector('summary');if(s){s.innerHTML=svg('layers',18);s.setAttribute('aria-label',tx('Mostrar: rejilla, muros de carga y ajuste magnético','Show: grid, bearing walls and wall snap','显示：网格、承重墙和贴墙吸附'));s.title=s.getAttribute('aria-label');}}
  // 3D: los mismos grupos de escena (solo visibles en 3D por su clase only3d).
  for(const n of [$('#modes3d'),$('#roofGroup'),...$$('.perla-keep .grp.only3d')])if(n)top.append(n);
  const north=$('#solarNorth');if(north)stage.append(north);
  const bottom=el('div',{class:'perla-canvas-bottom',role:'toolbar','aria-label':tx('Zoom y escala','Zoom and scale','缩放与比例')},stage);
  for(const id of ['zoomOut','fit','zoomIn'])move('#'+id,bottom);
  const zin=$('#zoomIn'),zout=$('#zoomOut');if(zin)zin.setAttribute('aria-label',tx('Ampliar','Zoom in','放大'));if(zout)zout.setAttribute('aria-label',tx('Reducir','Zoom out','缩小'));
  const scales=el('details',{class:'perla-dd perla-scales'},bottom),ss=el('summary',{class:'btn'},scales),sp=el('div',{class:'menu-pop perla-pop'},scales);for(const id of ['s60','s100'])move('#'+id,sp);
  ss.textContent='1:60 · 1:100';ss.setAttribute('aria-label',tx('Vistas de escala 1:60 y 1:100','1:60 and 1:100 scale views','1:60 和 1:100 比例视图'));
  move('#scalebar',bottom);
  // Paneles: plegar/reabrir desde fuera del cajón (los mismos tgLib/tgPanel) y Asistente en el Inspector (escritorio) o en la barra inferior (móvil).
  const dock=$('#mobileDock');if(dock){stage.append(dock);dock.classList.add('perla-dock');}
 }
 const PHONE='(max-width:760px),(max-width:1100px) and (max-height:500px)';
 const tgLib=$('#tgLib'),tgPanel=$('#tgPanel');
 const paneIcons=()=>{const phone=matchMedia(PHONE).matches;
  if(tgLib){tgLib.innerHTML=phone?`${svg('lib',18)}<span>${tx('Construir','Build','构建')}</span>`:svg('lib',18);tgLib.setAttribute('aria-label',tx('Mostrar u ocultar Construir y Amueblar','Show or hide Build and Furnish','显示或隐藏构建与布置'));tgLib.title=tgLib.getAttribute('aria-label');}
  if(tgPanel){tgPanel.innerHTML=phone?`${svg('panel',18)}<span>${tx('Inspector','Inspector','检查器')}</span>`:svg('panel',18);tgPanel.setAttribute('aria-label',tx('Mostrar u ocultar el Inspector','Show or hide the Inspector','显示或隐藏检查器'));tgPanel.title=tgPanel.getAttribute('aria-label');}
  // Con un área profesional abierta el Inspector queda detrás (inerte): el Asistente pasa a la fila 1, junto a Mi estudio,
  // como estaba en la barra de áreas anterior. En el editor: barra inferior (teléfono) o pie del Inspector (escritorio).
  const area=document.body.classList.contains('professional-area');
  let host=area?$('.perla-assistant-slot'):phone?$('#mobileDock'):$('.perla-inspector-foot');for(const h of $$('[data-assistant-opener-host]'))if(h!==host)h.toggleAttribute('data-assistant-opener-host',false);host?.setAttribute('data-assistant-opener-host','');
  const a=$('#assistantOpen');if(a&&host&&a.parentElement!==host)host.append(a);
 };

 // ── Inspector: Estancias · Propiedades · Informe (filtra el panel vigente; la selección sigue siendo del plano) ──
 const rightAside=$('aside.right'),panel=$('#panel');let tab='estancias';
 const head=el('div',{class:'perla-inspector-head'}),title=el('h2',{class:'perla-inspector-title'},head);
 const tabs=el('div',{class:'perla-tabs',role:'tablist'},head);
 const TABS=[['estancias',['Estancias','Rooms','房间']],['propiedades',['Propiedades','Properties','属性']],['informe',['Informe','Report','报告']]];
 const tabBtn={};for(const[id,l]of TABS){const b=el('button',{type:'button',role:'tab',id:'perlaTab-'+id,class:'btn','aria-controls':'panel'},tabs);b.onclick=()=>openTab(id,true);b.addEventListener('keydown',e=>{const order=TABS.map(t=>t[0]),i=order.indexOf(id);if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();const n=order[(i+(e.key==='ArrowRight'?1:2))%3];openTab(n,true);tabBtn[n][0].focus();}});tabBtn[id]=[b,l];}
 const foot=el('div',{class:'perla-inspector-foot'});
 if(rightAside&&panel){rightAside.insertBefore(head,panel);rightAside.append(foot);}
 const hint=el('p',{class:'perla-props-hint',hidden:''});if(panel)panel.before(hint);
 const isOverview=()=>!!panel?.querySelector('[data-group="areas"]');
 function openTab(id,user=false){
  tab=id;if(user&&id!=='propiedades'&&!isOverview())$('#back')?.click();
  for(const[k,[b]]of Object.entries(tabBtn)){b.setAttribute('aria-selected',String(k===tab));b.tabIndex=k===tab?0:-1;}
  rightAside?.setAttribute('data-perla-tab',tab);
  hint.hidden=!(tab==='propiedades'&&isOverview());hint.textContent=tx('Selecciona una estancia, un muro, un hueco o un mueble en el plano para ver y editar sus propiedades.','Select a room, a wall, an opening or a furniture item on the plan to see and edit its properties.','在平面上选择房间、墙、洞口或家具以查看和编辑其属性。');
 }
 window.FloorPlanPerla=Object.freeze({openTab,setGuide,get tab(){return tab;}});
 if(panel)new MutationObserver(()=>{const ov=isOverview();if(!ov&&tab!=='propiedades')openTab('propiedades');else if(ov&&tab==='propiedades'&&hint.hidden)openTab('estancias');else openTab(tab);}).observe(panel,{childList:true});
 function paintTexts(){
  title.textContent=tx('Inspector','Inspector','检查器');tabs.setAttribute('aria-label',tx('Contenido del Inspector','Inspector content','检查器内容'));
  for(const[,[b,l]]of Object.entries(tabBtn))b.textContent=tx(...l);
  paneIcons();paintProgress();openTab(tab);
 }
 // Retirar/restaurar tabiques: mismo modo `demolish` (V/M/X), con nombre que explica ambas direcciones.
 const demo=$('#paletteBuild [data-tool="demolish"], #paletteBuild [data-palette-tool="demolish"]');
 const demoName=()=>{const re=/Modificar muros|Demolish|拆改墙体|Retirar tabique|Remove partition|拆除隔墙/;
  const b=(demo?.isConnected&&demo)||$('#paletteBuild [data-tool="demolish"], #paletteBuild [data-palette-tool="demolish"]')||$$('#paletteBuild button').find(x=>re.test(x.textContent));if(!b)return;
  const lab=[...b.querySelectorAll('span,b')].find(s=>re.test(s.textContent))||b,name=tx('Retirar tabique','Remove partition','拆除隔墙');
  if(lab===b){if(b.lastChild&&b.lastChild.textContent!==name)b.lastChild.textContent=name;}else if(lab.textContent!==name)lab.textContent=name;
  const t=tx('Retirar o restaurar tabiques no portantes (X). Pulsa un tabique para retirarlo; pulsa uno retirado para restaurarlo.','Remove or restore non-bearing partitions (X). Press a partition to remove it; press a removed one to restore it.','拆除或恢复非承重隔墙 (X)。');if(b.title!==t)b.title=t;};
 // Idioma: re-etiquetar al cambiar (el resto de la app traduce sus propios textos).
 // Cabecera: etiquetas propias de PERLA y textos de controles trasladados que su módulo solo pinta al crearlos. Igual que
 // una carga nueva en ese idioma (tests/language-home-navigation compara ambos estados).
 const perlaBrand=()=>{if(!home)return;if(!home.querySelector('.perla-ico')||home.textContent.trim()!=='Rubik Sota')home.innerHTML=`${svg('home',20)}<b>Rubik Sota</b>`;
  const a=tx('Ir a Inicio','Go to Home','前往首页');if(home.getAttribute('aria-label')!==a)home.setAttribute('aria-label',a);};
 if(home)new MutationObserver(()=>{if(!home.querySelector(".perla-ico"))perlaBrand();}).observe(home,{childList:true});
 function paintHeader(){
  try{paintProject();}catch{}
  r1.setAttribute('aria-label',tx('Proyecto y áreas','Project and areas','项目与区域'));r2.setAttribute('aria-label',tx('Archivo, vista y paso','File, view and step','文件、视图与步骤'));
  center.setAttribute("aria-label",tx("Áreas de trabajo","Work areas","工作区域"));perlaBrand();
  $('#actionSearchBtn')?.setAttribute('aria-label',tx('Buscar una acción','Search an action','搜索操作'));$('#editHistory')?.setAttribute('aria-label',tx('Historial de sesión','Session history','会话历史'));
  $('#perlaLegal')?._t?.();
  const set=(id,es,en,zh)=>{const n=document.getElementById(id);if(n&&n.textContent!==tx(es,en,zh))n.textContent=tx(es,en,zh);};
  set('guideDeliverSheet','Abrir lámina','Open sheet','打开图纸');set('guideDeliverSurfaceSheet','Ficha de superficies','Area schedule','面积明细表');
  set('guideDeliverReview','Observaciones del cliente…','Client observations…','客户意见…');set('guideDeliverImage','Exportar imagen','Export image','导出图片');
  set('territoryOpen','Contexto territorial','Territorial context','地理背景');
  set('openSheet','Abrir lámina','Open sheet','打开图纸');
 }
 // Idioma: se repinta cuando la app cambia <html lang> (cualquier vía: selector, atajo, carga), no solo con #langBtn.
 new MutationObserver(()=>setTimeout(()=>{paintTexts();demoName();paintHeader();setTimeout(()=>{paintHeader();demoName();},120);},0)).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
 // Paseo 3D: mientras el joystick está a la vista, la barra de escena no tapa la vista y la inferior deja libre el minimapa.
 const joy=$('#joy');if(joy){const walk=()=>document.body.classList.toggle('perla-walking',joy.getClientRects().length>0&&getComputedStyle(joy).visibility!=='hidden');
  new MutationObserver(walk).observe(joy,{attributes:true});new MutationObserver(walk).observe(document.body,{attributes:true,attributeFilter:['class']});}
 // Menús PERLA: se cierran como los de la app (clic fuera) y tras elegir una opción.
 document.addEventListener('pointerdown',e=>{for(const m of $$('details.perla-dd[open]'))if(!m.contains(e.target))m.open=false;});
 document.addEventListener('click',e=>{const b=e.target.closest?.('details.perla-dd .perla-pop button');if(b)b.closest('details.perla-dd').open=false;});
 document.addEventListener('keydown',e=>{if(e.key!=='Escape')return;const m=document.activeElement?.closest?.('details.perla-dd[open]');if(m){m.open=false;m.querySelector('summary')?.focus();}});
 addEventListener('resize',paneIcons);
 // «Mostrar ▾» en teléfono: sus opciones se abren bajo el botón, dentro de la pantalla y por encima del lienzo.
 const layersMenu=$('#layersMenu'),layersPop=$('#layers');
 const placeLayers=()=>{if(!layersMenu||!layersPop)return;const small=matchMedia('(max-width:760px), (max-width:1100px) and (max-height:500px)').matches;
  if(!layersMenu.open||!small){for(const k of ['position','top','right','left','zIndex','maxHeight','overflow'])layersPop.style[k]='';return;}
  const r=layersMenu.getBoundingClientRect();Object.assign(layersPop.style,{position:'fixed',top:Math.round(r.bottom+6)+'px',right:'12px',left:'auto',zIndex:'80',maxHeight:Math.max(120,innerHeight-r.bottom-18)+'px',overflow:'auto'});};
 layersMenu?.addEventListener('toggle',placeLayers);addEventListener('resize',placeLayers);
 let wasArea=document.body.classList.contains('professional-area');
 new MutationObserver(()=>{const now=document.body.classList.contains('professional-area');if(now!==wasArea){wasArea=now;paneIcons();}}).observe(document.body,{attributes:true,attributeFilter:['class']});
 const compactTools=matchMedia('(max-width:900px), (max-width:1100px) and (max-height:500px)');
 // Deshacer / Rehacer: en teléfono y horizontal, a la vista en la barra del lienzo (antes solo dentro de «⋯»); en
 // escritorio, en la fila 1. Mismo control (#editHistory, #undo, #redo) y mismo efecto.
 const histNode=$('#editHistory'),histHome=histNode?.parentElement,histNext=histNode?.nextSibling;
 const phoneHistory=matchMedia('(max-width:760px)');
 const placeHistory=()=>{const top=$('.perla-canvas-top');if(!histNode||!top)return;
  const dock=$('#mobileDock');
  // Teléfono vertical: Deshacer/Rehacer en la barra inferior, siempre alcanzables aunque haya un cajón abierto.
  if(phoneHistory.matches&&dock){if(histNode.parentElement!==dock)dock.prepend(histNode);}
  else if(compactTools.matches){if(histNode.parentElement!==top)top.append(histNode);}
  else if(histHome&&histNode.parentElement!==histHome)histHome.insertBefore(histNode,histNext&&histNext.parentElement===histHome?histNext:null);};
 const placeFullTools=()=>{if(compactTools.matches)morePop.append(keep);else header.append(keep);placeHistory();};
 placeFullTools();compactTools.addEventListener('change',placeFullTools);phoneHistory.addEventListener('change',placeHistory);
 setGuide(false,{focus:false});paintTexts();demoName();paintHeader();
 // La paleta se reconstruye al cambiar de idioma o de pestaña: «Retirar tabique» vuelve a nombrarse cuando su botón cambia.
 const pb=$('#paletteBuild');if(pb){let q=false;new MutationObserver(()=>{if(q)return;q=true;requestAnimationFrame(()=>{q=false;demoName();});}).observe(pb,{childList:true,subtree:true,attributes:true,attributeFilter:['title']});}
 // El dibujo vuelve a encajar en el lienzo reorganizado (mismo «Ajustar» del visor, sin cambiar el proyecto).
 requestAnimationFrame(()=>$('#fit')?.click());
 // Si el diseño de PERLA encoge el lienzo (cabecera, guía, avisos, paneles) y la persona no ha movido ni ampliado el plano
 // desde el último ajuste, se vuelve a «Ajustar»: la vivienda sigue entera a la vista. Si la ha movido, se respeta.
 {const plan=$('#plan');let touched=false,lw=0,lh=0,t=0;
  if(plan){for(const ev of ['wheel','pointerdown'])plan.addEventListener(ev,()=>{touched=true;},{passive:true});
   for(const id of ['zoomIn','zoomOut'])$('#'+id)?.addEventListener('click',()=>{touched=true;});
   $('#fit')?.addEventListener('click',()=>{touched=false;});
   new ResizeObserver(()=>{const w=plan.clientWidth,h=plan.clientHeight;if(!w||!h)return;const shrank=lw&&(w<lw-8||h<lh-8);lw=w;lh=h;
    if(shrank&&!touched){clearTimeout(t);t=setTimeout(()=>{if(!touched)$('#fit')?.click();},60);}}).observe(plan);}}
 addEventListener('load',()=>{paneIcons();dispatchEvent(new Event('resize'));});
})();
