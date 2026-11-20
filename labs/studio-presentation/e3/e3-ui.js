/* RUBIK SOTA · Studio Presentation E3 · «Preparar entrega» en Entregar (laboratorio, copia aislada de master).
 * Una tarjeta en el grupo «Documentación» de Entregar y un <dialog> nativo (foco atrapado, Escape, retorno del foco).
 * Pasos: receta profesional → composición con fuentes reales → verificación (N05) → vista previa de la composición.
 * Solo lectura: FloorPlanPersistence.readConfirmed() (C1). No guarda, no envía, no escribe en ningún almacenamiento,
 * no llama a la sesión de persistencia ni a servicios externos. El candidato vive en memoria y se pierde al cerrar la pestaña.
 * Enganche en producto (propuesta para Codex): una línea en js/professional-workspace-ui.js, junto a FloorPlanDeliveryPreview.card. */
(function(){
 'use strict';
 const E3=window.RubikStudioE3,app=window.FloorPlanApp;if(!E3||!app)return;
 const lang=()=>{const l=typeof LANG==='string'?LANG:'es';return E3.LANGS.includes(l)?l:'es';};
 const U={
  card:['Preparar entrega','Prepare delivery','准备交付'],
  cardLead:['Elige una receta profesional y compón la entrega solo con lo confirmado del proyecto.','Choose a professional recipe and compose the delivery only from what the project has confirmed.','选择专业配方，仅用项目已确认的内容组成交付。'],
  cardMeta:['Laboratorio E3 · no envía ni publica nada','E3 lab · nothing is sent or published','E3 实验室 · 不发送也不发布任何内容'],
  open:['Preparar entrega','Prepare delivery','准备交付'],
  title:['Preparar entrega','Prepare delivery','准备交付'],
  sub:['Lectura de la revisión confirmada. No se guarda ni se envía nada; el candidato vive en esta sesión.','Reads the confirmed revision. Nothing is saved or sent; the candidate lives in this session.','读取已确认版本。不保存也不发送任何内容；候选仅存在于本次会话中。'],
  close:['Cerrar','Close','关闭'],reread:['Volver a leer','Read again','重新读取'],
  steps:[['1 · Receta','1 · Recipe','1 · 配方'],['2 · Composición','2 · Composition','2 · 组成'],['3 · Verificación','3 · Verification','3 · 验证'],['4 · Vista previa','4 · Preview','4 · 预览']],
  reading:['Leyendo la revisión confirmada…','Reading the confirmed revision…','正在读取已确认版本…'],
  confirmed:['Revisión confirmada','Confirmed revision','已确认版本'],work:['Trabajo (contentId)','Work (contentId)','作品（contentId）'],project:['Proyecto','Project','项目'],
  unsaved:['Cambios sin guardar','Unsaved changes','未保存的更改'],yes:['sí','yes','是'],no:['no','no','否'],
  profile:['Perfil','Profile','专业'],phase:['Fase','Phase','阶段'],all:['Todos','All','全部'],allF:['Todas','All','全部'],
  recipes:['Recetas profesionales','Professional recipes','专业配方'],
  lvl:{L:['L · entregable','L · deliverable','L · 可交付'],C:['C · contrato','C · contract','C · 合同'],F:['F · futura','F · future','F · 未来']},
  st:{preparable:['preparable','ready to prepare','可准备'],'preparable-parcial':['preparable con omisiones','ready, with omissions','可准备（有遗漏）'],bloqueada:['bloqueada','blocked','受阻'],
   'contrato-cumplido-sin-emision':['contrato cumplido · sin emisión','contract met · no issue','合同已满足 · 不签发'],'no-elegible':['no elegible','not eligible','不符合条件'],'no-disponible':['no disponible','not available','不可用']},
  credited:['Fuentes acreditadas','Credited sources','已认可来源'],partial:['Parciales (no portables)','Partial (not portable)','部分（不可移植）'],
  missing:['Obligatorias que faltan','Required, missing','缺失的必需项'],incomplete:['Alcance incompleto','Incomplete scope','范围不完整'],omitted:['Opcionales omitidas','Optional, omitted','已省略的可选项'],
  contract:['Contrato (sin emisión)','Contract (no issue)','合同（不签发）'],authority:['Límite','Limit','限制'],cut:['Corte','Cut','阶段'],
  language:['Idioma de la entrega','Delivery language','交付语言'],
  prepare:['Preparar candidato','Prepare candidate','准备候选'],cancel:['Cancelar preparación','Cancel preparation','取消准备'],verifyAgain:['Verificar de nuevo','Verify again','重新验证'],
  preparing:['Preparando sobre la revisión confirmada…','Preparing on the confirmed revision…','正在基于已确认版本准备…'],
  cause:['Causa','Cause','原因'],next:['Siguiente paso','Next step','下一步'],alt:['Alternativa segura','Safe alternative','安全替代'],data:['Tus datos','Your data','您的数据'],
  state:['Estado','State','状态'],
  n05:{preparado:['preparado','prepared','已准备'],verificado:['verificado','verified','已验证'],'verificado-desactualizado':['verificado · desactualizado','verified · out of date','已验证 · 已过期'],invalido:['inválido','invalid','无效']},
  previewTitle:['Vista previa de la composición','Composition preview','组成预览'],
  previewNote:['Composición del candidato, no el documento final. La emisión, la firma y la aceptación no están habilitadas.','Candidate composition, not the final document. Issuing, signing and acceptance are not enabled.','这是候选的组成，不是最终文档。签发、签署与验收均未启用。'],
  chapters:['Capítulos','Chapters','章节'],documents:['Documentos','Documents','文档'],modality:['Modalidad','Modality','模式'],
  selection:['Huella de la selección','Selection fingerprint','选择指纹'],none:['ninguna','none','无'],
  sel:['Selecciona una receta para ver su composición.','Select a recipe to see its composition.','选择一个配方以查看其组成。'],
  srcState:{disponible:['acreditada','credited','已认可'],parcial:['parcial','partial','部分'],ausente:['ausente','missing','缺失'],invalida:['inválida','invalid','无效']},
  verifying:['Verificando contra la revisión confirmada…','Verifying against the confirmed revision…','正在对照已确认版本验证…'],
  frozen:['Proyecto congelado','Frozen project','冻结的项目'],
  integrity:['Huella local de integridad (no es una firma)','Local integrity fingerprint (not a signature)','本地完整性指纹（不是签名）']
 };
 const t=v=>{const i=E3.LANGS.indexOf(lang());const s=v[i];if(typeof s!=='string')throw new Error('E3 UI sin texto '+lang());return s;};
 const el=(tag,text,parent,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;parent?.append(n);return n;};
 const btn=(text,parent,cls='btn')=>{const b=el('button',text,parent,cls);b.type='button';return b;};
 const css=document.createElement('link');css.rel='stylesheet';css.href='e3/e3.css';document.head.append(css);
 const hex=async b=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',b))].map(x=>x.toString(16).padStart(2,'0')).join('');
 // Dependencias: autoridades existentes del producto, solo lectura. Las vistas se identifican por su toma (takenAt), su
 // origen y su selección actual (ids y etiquetas), sin persistir cámaras.
 // Vistas: identidad de la toma normalizada en el núcleo (E3.vistasDesde) desde la autoridad real FloorPlanProjectViews.
 const vistasInfo=()=>E3.vistasDesde(window.FloorPlanProjectViews);
 const deps=()=>({P:window.FloorPlanPersistence,X:window.FloorPlanExpediente,Core:window.FloorPlanCore,Budget:window.FloorPlanBudget,digest:hex,observado:()=>app.project,
  imagenes:E3.adaptadorImagenes({indexedDB:window.indexedDB,Images:window.FloorPlanImages}),
  marca:()=>window.FloorPlanBrandUI?.snapshot?.()?.profile||null,
  entorno:()=>({motores:{Surface:window.FloorPlanSurfaceMetrics,Route:window.FloorPlanPresentationRoute,Living:window.FloorPlanLivingDrawing,Section:window.FloorPlanPresentationSection,Core:window.FloorPlanCore},vistas:vistasInfo()})});
 const short=h=>h?h.slice(0,12)+'…':'—';
 const filtros={perfil:'',fase:''};
 let dialog,refs,ctl=null;
 const S=()=>ctl?.estado||{};

 function notice(parent,code,kind){const x=E3.texto(code,lang());const box=el('div',undefined,parent,'e3-notice'+(kind?' is-'+kind:''));box.setAttribute('role',kind==='no'?'alert':'status');
  el('b',x.causa,box);const dl=el('dl',undefined,box);
  for(const [k,v] of [[U.next,x.siguiente],[U.alt,x.alternativa],[U.data,x.datos]])if(v&&v!=='—'){el('dt',t(k),dl);el('dd',v,dl);}
  box.dataset.code=code;return box;}
 function stCls(e){return e==='preparable'||e==='contrato-cumplido-sin-emision'?'e3-ok':e==='preparable-parcial'?'e3-part':'e3-no';}

 // ---------------------------------------------------------------- render (solo a partir del estado del controlador)
 function renderRead(){
  const box=refs.read;box.replaceChildren();const st=S();
  const l=st.lectura;if(!l||st.leyendo&&!st.fuentes){el('p',t(U.reading),box,'e3-sub').setAttribute('role','status');if(!l)return;}
  if(l.estado!=='confirmado'){notice(box,l.motivo,'no');return;}
  const A=st.analisis;if(!A?.ok){notice(box,A?.motivo||'c1-error','no');return;}
  const dl=el('dl',undefined,box);
  for(const [k,v] of [[U.confirmed,'#'+l.revision],[U.project,A.nombre||A.project.id],[U.unsaved,st.cambios?t(U.yes):t(U.no)]]){el('dt',t(k),dl);el('dd',v,dl);}
  if(st.cambios)notice(box,'cambios-sin-guardar');
 }
 function renderList(){
  const wrap=refs.list;const prevFocus=document.activeElement?.closest?.('#e3Dialog')?document.activeElement:null;const focusKey=prevFocus?.name==='e3-receta'?prevFocus.value:null;
  wrap.replaceChildren();const st=S();
  const f=el('div',undefined,wrap,'e3-filters');
  const mk=(label,opts,key,allLabel)=>{const lb=el('label',t(label),f);const s=el('select',undefined,lb);el('option',t(allLabel),s).value='';
   for(const [k,v] of Object.entries(opts)){const o=el('option',lang()==='zh'?v.en:v[lang()],s);o.value=k;if(lang()==='zh')o.lang='en';}s.value=filtros[key];s.addEventListener('change',()=>{filtros[key]=s.value;renderList();});};
  mk(U.profile,E3.CATALOGO.perfiles,'perfil',U.all);mk(U.phase,E3.CATALOGO.fases,'fase',U.allF);
  const fs=el('fieldset',undefined,wrap,'e3-list');el('legend',t(U.recipes),fs);
  const res=st.fuentes?E3.resolverTodas(st.fuentes):[];
  for(const r of E3.CATALOGO.recetas){
   if(filtros.perfil&&!r.perfiles.includes(filtros.perfil))continue;if(filtros.fase&&!r.fases.includes(filtros.fase))continue;
   const R=res.find(x=>x.key===r.key);const lab=el('label',undefined,fs,'e3-item');lab.dataset.receta=r.key;
   const inp=el('input',undefined,lab);inp.type='radio';inp.name='e3-receta';inp.value=r.key;inp.checked=st.sel===r.key;
   inp.addEventListener('change',()=>ctl.elegir(r.key));// nueva época: cancela y descarta toda operación en vuelo
   const n=E3.nombre(r,lang());const nm=el('span',r.key+' · '+n.texto,lab,'e3-name');if(n.lang!==lang())nm.lang=n.lang;
   const meta=el('span',undefined,lab,'e3-meta');el('span',t(U.lvl[r.nivel]),meta,'e3-badge e3-sub');
   if(R){el('span',t(U.st[R.estado]),meta,'e3-badge '+stCls(R.estado));lab.dataset.estado=R.estado;}
  }
  if(focusKey)fs.querySelector(`input[value="${focusKey}"]`)?.focus();
 }
 function sourceList(parent,ids,title,mark,cls){if(!ids.length)return;el('h4',t(title)+' · '+ids.length,parent);const ul=el('ul',undefined,parent,'e3-sources');const st=S();
  for(const id of ids){const li=el('li',undefined,ul);const m=el('span',mark,li,'e3-mark '+cls);m.setAttribute('aria-hidden','true');
   const n=E3.nombre(E3.CATALOGO.fuentes[id],lang());const s=el('span',n.texto,li);if(n.lang!==lang())s.lang=n.lang;
   const F=st.fuentes?.[id];const w=el('span',(F?t(U.srcState[F.estado])+' — '+E3.motivoFuente(F.motivo,lang()):''),li,'e3-why');
   if(F?.dato&&F.estado!=='ausente')w.textContent+=` (${F.dato})`;}}
 function renderDetail(){
  const d=refs.detail;const keep=document.activeElement&&d.contains(document.activeElement)?document.activeElement.id:null;d.replaceChildren();const st=S();
  if(!st.sel){el('p',t(U.sel),d,'e3-sub');return;}
  const r=E3.receta(st.sel);const n=E3.nombre(r,lang());const h=el('h3',r.key+' · '+n.texto,d);if(n.lang!==lang())h.lang=n.lang;
  el('p',`${t(U.lvl[r.nivel])} · ${t(U.cut)}: ${r.corte}`,d,'e3-sub');
  const au=E3.nombre(r.autoridad,lang());const ap=el('p',t(U.authority)+': '+au.texto,d);if(au.lang!==lang())ap.lang=au.lang;
  if(!st.fuentes)return;
  const R=E3.resolver(r.key,st.fuentes);
  const chip=el('p',undefined,d);el('span',t(U.state)+': ',chip);el('span',t(U.st[R.estado]),chip,'e3-state '+stCls(R.estado));
  if(R.aviso)notice(d,R.aviso,R.nivel==='L'?'no':null);
  sourceList(d,R.acreditadas,U.credited,'✓','e3-ok');sourceList(d,R.parciales,U.partial,'◐','e3-part');
  sourceList(d,R.falta,U.missing,'✕','e3-no');sourceList(d,R.incompleta.filter(i=>!R.parciales.includes(i)),U.incomplete,'○','e3-part');sourceList(d,R.omitidas,U.omitted,'–','e3-sub');
  if(r.contrato){el('h4',t(U.contract),d);const ul=el('ul',undefined,d,'e3-sources');for(const c of r.contrato){const li=el('li',undefined,ul);el('span','·',li,'e3-mark');const s=el('span',c,li);s.lang='es';}}
  if(R.preparable){
   const act=el('div',undefined,d,'e3-actions');
   const lb=el('label',t(U.language)+' ',act);const s=el('select',undefined,lb);s.id='e3Idioma';for(const [k,v] of [['es','Español'],['en','English']]){const o=el('option',v,s);o.value=k;o.lang=k;}
   s.value=st.idioma||(lang()==='en'?'en':'es');s.addEventListener('change',()=>ctl.idioma(s.value));
   const b=btn(t(U.prepare),act);b.dataset.emphasis='accent';b.id='e3Prepare';b.disabled=st.ocupado||!!st.cambios;b.addEventListener('click',()=>{if(!st.idioma)ctl.estado.idioma=s.value;ctl.preparar();});
   if(st.ocupado){const c=btn(t(U.cancel),act);c.id='e3Cancel';c.addEventListener('click',()=>ctl.cancelar());el('p',t(U.preparing),d,'e3-sub').setAttribute('role','status');}
   if(st.cambios)notice(d,'cambios-sin-guardar');
  }
  if(st.aviso&&st.aviso!==R.aviso)notice(d,st.aviso,st.aviso==='cancelada'?null:'no');
  if(keep)document.getElementById(keep)?.focus();
 }
 function renderPreview(){
  const p=refs.preview;const st=S();
  // Una vista previa solo existe para el candidato de la selección vigente; se retira en cuanto cambia la selección.
  if(!st.candidato){p.replaceChildren();p.hidden=true;return;}
  const keep=document.activeElement&&p.contains(document.activeElement)?document.activeElement.id:null;p.replaceChildren();p.hidden=false;
  const c=st.candidato,v=st.verificacion,k=c.congelado,r=E3.receta(k.receta.key);
  el('h3',t(U.steps[2]),p);
  const chip=el('p',undefined,p);el('span',t(U.state)+': ',chip);const estado=st.verificando?'preparado':(v?.estado||'preparado');
  const sp=el('span',t(U.n05[estado]),chip,'e3-state '+(estado==='verificado'?'e3-ok':estado==='invalido'?'e3-no':'e3-part'));sp.id='e3Estado';sp.dataset.estado=estado;sp.dataset.motivo=st.verificando?'verificando':(v?.motivo||'');
  if(st.verificando)el('p',t(U.verifying),p,'e3-sub').setAttribute('role','status');
  else if(v)notice(p,v.motivo,v.estado==='verificado'?'ok':v.estado==='invalido'?'no':null);
  const again=btn(t(U.verifyAgain),el('div',undefined,p,'e3-actions'));again.id='e3Reverify';again.disabled=!!st.verificando;again.addEventListener('click',()=>ctl.leer());
  el('h3',t(U.steps[3]),p);
  const pv=el('div',undefined,p,'e3-preview');const cov=el('div',undefined,pv,'e3-cover');
  el('small',t(U.previewTitle),cov);const n=E3.nombre(r,k.idioma);const h=el('h4',n.texto,cov);h.lang=k.idioma;
  // Identifica el proyecto CONGELADO (no el que esté abierto ahora).
  const fp=el('p',t(U.frozen)+': '+(k.proyectoNombre||k.proyectoId)+' · '+t(U.confirmed)+' #'+k.revision,cov,'e3-sub');fp.id='e3Congelado';
  const dl=el('dl',undefined,pv);
  const add=(key,val)=>{el('dt',t(key),dl);el('dd',val,dl);};
  add(U.modality,r.sel?.tipo||'—');add(U.work,short(k.contentId));add(U.selection,short(k.seleccionSha256));add(U.integrity,short(c.huella));
  if(r.sel?.capitulos){el('h4',t(U.chapters),pv);const ol=el('ol',undefined,pv);for(const x of r.sel.capitulos)el('li',x,ol).lang='es';}
  if(r.sel?.documentos){el('h4',t(U.documents),pv);const ol=el('ol',undefined,pv);for(const x of r.sel.documentos)el('li',x,ol);}
  const R=c.composicion.resolucion;el('h4',t(U.credited),pv);const ol=el('ol',undefined,pv);for(const id of [...R.acreditadas,...R.parciales]){const nn=E3.nombre(E3.CATALOGO.fuentes[id],lang());const li=el('li',nn.texto+(R.parciales.includes(id)?' · '+t(U.srcState.parcial):''),ol);if(nn.lang!==lang())li.lang=nn.lang;}
  if(!R.acreditadas.length&&!R.parciales.length)el('li',t(U.none),ol);
  el('p',t(U.previewNote),pv,'e3-sub');
  if(keep)document.getElementById(keep)?.focus();
 }
 function renderSteps(){const st=S();const i=st.candidato?(st.verificacion?3:2):st.sel?1:0;[...refs.steps.children].forEach((li,k)=>{if(k===i)li.setAttribute('aria-current','step');else li.removeAttribute('aria-current');});}
 function render(foco){if(!refs)return;renderRead();renderList();renderDetail();renderPreview();renderSteps();
  // El foco solo se mueve por resultados VIGENTES (el controlador no emite los tardíos).
  if(foco==='vista-previa')refs.preview.focus();else if(foco==='detalle')refs.detail.focus();else if(foco==='preparar')document.getElementById('e3Prepare')?.focus();}

 function build(){
  dialog=el('dialog',undefined,document.body,'e3-dialog');dialog.id='e3Dialog';dialog.setAttribute('aria-labelledby','e3Title');dialog.setAttribute('aria-describedby','e3Sub');
  const shell=el('div',undefined,dialog,'e3-shell');const head=el('header',undefined,shell,'e3-head');const tt=el('div',undefined,head);
  el('h2',t(U.title),tt).id='e3Title';el('p',t(U.sub),tt).id='e3Sub';
  const hb=el('div',undefined,head,'e3-actions');hb.style.margin='0';const rr=btn(t(U.reread),hb);rr.id='e3Reread';rr.addEventListener('click',()=>ctl.leer());const x=btn(t(U.close),hb);x.id='e3Close';x.addEventListener('click',()=>dialog.close());
  const body=el('div',undefined,shell,'e3-body');
  const steps=el('ol',undefined,body,'e3-steps');for(const s of U.steps)el('li',t(s),steps);
  const read=el('section',undefined,body,'e3-read');read.setAttribute('aria-live','polite');
  const list=el('section',undefined,body);const right=el('div',undefined,body);
  const detail=el('section',undefined,right,'e3-detail');detail.tabIndex=-1;detail.setAttribute('aria-live','polite');
  const preview=el('section',undefined,right,'e3-detail');preview.tabIndex=-1;preview.hidden=true;preview.id='e3Preview';
  refs={read,list,detail,preview,steps};
  // Cerrar abre una época nueva: toda operación en vuelo se descarta y el diálogo cerrado ya no emite nada.
  dialog.addEventListener('close',()=>{ctl?.cerrar();document.getElementById('e3Open')?.focus();});
 }
 function open(){
  ctl?.cerrar();if(dialog)dialog.remove();build();
  const mine=E3.controlador(deps,{onCambio:(st,foco)=>{if(ctl===mine)render(foco);}});ctl=mine;
  if(window.RUBIK_E3_QA===true)window.__e3=ctl.estado;// diagnóstico SOLO con la bandera de laboratorio; nunca en producto
  dialog.showModal();render();ctl.leer();
  setTimeout(()=>{const first=dialog.querySelector('input[name="e3-receta"]:checked')||dialog.querySelector('select');first?.focus?.();},0);}
 function card(container){
  if(!container)return;container.querySelector('#e3Card')?.remove();
  const c=el('article',undefined,container,'professional-card e3-card');c.id='e3Card';c.dataset.module='studio-e3';
  el('h3',t(U.card),c);el('p',t(U.cardLead),c,'e3-lead');el('p',t(U.cardMeta),c,'professional-state');
  const b=btn(t(U.open),el('div',undefined,c,'e3-actions'));b.id='e3Open';b.dataset.emphasis='accent';b.addEventListener('click',open);
 }
 window.RubikStudioE3UI={card,open};
})();
