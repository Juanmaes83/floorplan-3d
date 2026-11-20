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
  srcState:{disponible:['acreditada','credited','已认可'],parcial:['parcial','partial','部分'],ausente:['ausente','missing','缺失']}
 };
 const t=v=>{const i=E3.LANGS.indexOf(lang());const s=v[i];if(typeof s!=='string')throw new Error('E3 UI sin texto '+lang());return s;};
 const el=(tag,text,parent,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;parent?.append(n);return n;};
 const btn=(text,parent,cls='btn')=>{const b=el('button',text,parent,cls);b.type='button';return b;};
 const css=document.createElement('link');css.rel='stylesheet';css.href='e3/e3.css';document.head.append(css);
 const hex=async b=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',b))].map(x=>x.toString(16).padStart(2,'0')).join('');
 const deps=()=>({P:window.FloorPlanPersistence,X:window.FloorPlanExpediente,Core:window.FloorPlanCore,digest:hex,observado:()=>app.project,
  marca:()=>window.FloorPlanBrandUI?.snapshot?.()?.profile||null,
  entorno:()=>({motores:{superficies:!!window.FloorPlanSurfaceMetrics,dibujoVivo:!!window.FloorPlanLivingDrawing,recorrido:!!window.FloorPlanPresentationRoute,seccion:!!window.FloorPlanPresentationSection},
   vistas:{estado:window.FloorPlanProjectViews?.status?.()||'none',n:window.FloorPlanProjectViews?.current?.().length||0}})});
 const short=h=>h?h.slice(0,12)+'…':'—';
 const state={lectura:null,analisis:null,fuentes:null,cambios:null,ident:null,sel:null,perfil:'',fase:'',idioma:null,candidato:null,verificacion:null,aviso:null,busy:false,gen:0};
 window.__e3=state;// evidencia de laboratorio (solo lectura para la QA)
 const prep=E3.preparador();
 let dialog,refs;

 function notice(parent,code,kind){const x=E3.texto(code,lang());const box=el('div',undefined,parent,'e3-notice'+(kind?' is-'+kind:''));box.setAttribute('role',kind==='no'?'alert':'status');
  el('b',x.causa,box);const dl=el('dl',undefined,box);
  for(const [k,v] of [[U.next,x.siguiente],[U.alt,x.alternativa],[U.data,x.datos]])if(v&&v!=='—'){el('dt',t(k),dl);el('dd',v,dl);}
  box.dataset.code=code;return box;}
 function stCls(e){return e==='preparable'||e==='contrato-cumplido-sin-emision'?'e3-ok':e==='preparable-parcial'?'e3-part':'e3-no';}

 // ---------------------------------------------------------------- lectura (C1) y fuentes; resultados viejos se descartan
 async function leer(){
  const g=++state.gen;state.lectura=null;state.analisis=null;state.fuentes=null;renderRead();
  const d=deps();const l=await E3.leerConfirmado(d.P);if(g!==state.gen)return;
  state.lectura=l;
  if(l.estado==='confirmado'){const A=E3.analizar(l,{Core:d.Core});state.analisis=A;
   if(A.ok){state.cambios=E3.cambiosSinGuardar(A,d.observado());const marca=d.marca();state.fuentes=E3.evaluarFuentes(A,{...d.entorno(),cambios:state.cambios,marca});
    try{const I=await E3.identidad(A,{X:d.X,digest:d.digest,marca});if(g!==state.gen)return;state.ident=I;}catch{state.ident=null;}}}
  if(g!==state.gen)return;
  if(state.candidato)await verificar(false);
  render();
 }
 async function verificar(rerender=true){
  if(!state.candidato)return;const g=state.gen;
  const a=await E3.actualDesdeConfirmado(deps());if(g!==state.gen)return;
  state.verificacion=await E3.verificar(state.candidato,a.contentId?a:null,{digest:hex});
  if(rerender)render();
 }
 async function preparar(){
  if(!state.sel)return;const token=prep.iniciar();state.busy=true;state.aviso=null;state.candidato=null;state.verificacion=null;render();
  const r=await E3.preparar({key:state.sel,idioma:state.idioma||(lang()==='en'?'en':'es')},deps(),token,prep);
  if(r.motivo==='obsoleta')return;// otra preparación tomó el relevo
  state.busy=false;
  if(r.ok){state.candidato=r.candidato;await verificar(false);}else state.aviso=r.motivo;
  render();
  (r.ok?refs.preview:refs.detail)?.focus?.();
 }
 function cancelar(){prep.cancelar();state.busy=false;state.aviso='cancelada';render();refs.prepareBtn?.focus();}

 // ---------------------------------------------------------------- render
 function renderRead(){
  if(!refs)return;const box=refs.read;box.replaceChildren();
  const l=state.lectura;if(!l){el('p',t(U.reading),box,'e3-sub');return;}
  if(l.estado!=='confirmado'){notice(box,l.motivo,'no');return;}
  const A=state.analisis;if(!A?.ok){notice(box,A?.motivo||'c1-error','no');return;}
  const dl=el('dl',undefined,box);
  for(const [k,v] of [[U.confirmed,'#'+l.revision],[U.work,short(state.ident?.trabajo.contentId)],[U.project,A.project.name||A.project.id],[U.unsaved,state.cambios?t(U.yes):t(U.no)]]){el('dt',t(k),dl);el('dd',v,dl);}
  if(state.cambios)notice(box,'cambios-sin-guardar');
 }
 function renderList(){
  const wrap=refs.list;wrap.replaceChildren();
  const f=el('div',undefined,wrap,'e3-filters');
  const mk=(label,opts,val,on,allLabel)=>{const lb=el('label',t(label),f);const s=el('select',undefined,lb);el('option',t(allLabel),s).value='';
   for(const [k,v] of Object.entries(opts)){const o=el('option',lang()==='zh'?v.en:v[lang()],s);o.value=k;if(lang()==='zh')o.lang='en';}s.value=val;s.addEventListener('change',()=>{on(s.value);renderList();});};
  mk(U.profile,E3.CATALOGO.perfiles,state.perfil,v=>state.perfil=v,U.all);mk(U.phase,E3.CATALOGO.fases,state.fase,v=>state.fase=v,U.allF);
  const fs=el('fieldset',undefined,wrap,'e3-list');el('legend',t(U.recipes),fs);
  const res=state.fuentes?E3.resolverTodas(state.fuentes):[];
  for(const r of E3.CATALOGO.recetas){
   if(state.perfil&&!r.perfiles.includes(state.perfil))continue;if(state.fase&&!r.fases.includes(state.fase))continue;
   const R=res.find(x=>x.key===r.key);const lab=el('label',undefined,fs,'e3-item');lab.dataset.receta=r.key;
   const inp=el('input',undefined,lab);inp.type='radio';inp.name='e3-receta';inp.value=r.key;inp.checked=state.sel===r.key;
   inp.addEventListener('change',()=>{state.sel=r.key;state.aviso=null;state.candidato=null;state.verificacion=null;renderDetail();renderSteps();});
   const n=E3.nombre(r,lang());const nm=el('span',r.key+' · '+n.texto,lab,'e3-name');if(n.lang!==lang())nm.lang=n.lang;
   const meta=el('span',undefined,lab,'e3-meta');el('span',t(U.lvl[r.nivel]),meta,'e3-badge e3-sub');
   if(R){const s=el('span',t(U.st[R.estado]),meta,'e3-badge '+stCls(R.estado));lab.dataset.estado=R.estado;}
  }
 }
 function sourceList(parent,ids,title,mark,cls){if(!ids.length)return;el('h4',t(title)+' · '+ids.length,parent);const ul=el('ul',undefined,parent,'e3-sources');
  for(const id of ids){const li=el('li',undefined,ul);const m=el('span',mark,li,'e3-mark '+cls);m.setAttribute('aria-hidden','true');
   const n=E3.nombre(E3.CATALOGO.fuentes[id],lang());const s=el('span',n.texto,li);if(n.lang!==lang())s.lang=n.lang;
   const F=state.fuentes?.[id];const st=el('span',(F?t(U.srcState[F.estado])+' — ':'')+(F?E3.motivoFuente(F.motivo,lang()):''),li,'e3-why');
   if(F?.dato&&F.estado==='disponible')st.textContent+=` (${F.dato})`;}}
 function renderDetail(){
  const d=refs.detail;d.replaceChildren();
  if(!state.sel){el('p',t(U.sel),d,'e3-sub');return;}
  const r=E3.receta(state.sel);const n=E3.nombre(r,lang());const h=el('h3',r.key+' · '+n.texto,d);if(n.lang!==lang())h.lang=n.lang;
  const meta=el('p',`${t(U.lvl[r.nivel])} · ${t(U.cut)}: ${r.corte}`,d,'e3-sub');
  const au=E3.nombre(r.autoridad,lang());const ap=el('p',t(U.authority)+': '+au.texto,d);if(au.lang!==lang())ap.lang=au.lang;
  if(!state.fuentes){renderRead();return;}
  const R=E3.resolver(r.key,state.fuentes);
  const chip=el('p',undefined,d);el('span',t(U.state)+': ',chip);el('span',t(U.st[R.estado]),chip,'e3-state '+stCls(R.estado));
  if(R.aviso)notice(d,R.aviso,R.nivel==='L'?'no':null);
  sourceList(d,R.acreditadas,U.credited,'✓','e3-ok');sourceList(d,R.parciales,U.partial,'◐','e3-part');
  sourceList(d,R.falta,U.missing,'✕','e3-no');sourceList(d,R.incompleta.filter(i=>!R.parciales.includes(i)),U.incomplete,'○','e3-part');sourceList(d,R.omitidas,U.omitted,'–','e3-sub');
  if(r.contrato){el('h4',t(U.contract),d);const ul=el('ul',undefined,d,'e3-sources');for(const c of r.contrato){const li=el('li',undefined,ul);el('span','·',li,'e3-mark');const s=el('span',c,li);s.lang='es';}}
  if(R.preparable){
   const act=el('div',undefined,d,'e3-actions');
   const lb=el('label',t(U.language)+' ',act);const s=el('select',undefined,lb);for(const [k,v] of [['es','Español'],['en','English']]){const o=el('option',v,s);o.value=k;o.lang=k;}
   s.value=state.idioma||(lang()==='en'?'en':'es');s.addEventListener('change',()=>{state.idioma=s.value;state.candidato=null;state.verificacion=null;renderPreview();});
   const b=btn(t(U.prepare),act);b.dataset.emphasis='accent';b.id='e3Prepare';b.disabled=state.busy||!!state.cambios;b.addEventListener('click',preparar);refs.prepareBtn=b;
   if(state.busy){const c=btn(t(U.cancel),act);c.id='e3Cancel';c.addEventListener('click',cancelar);el('p',t(U.preparing),d,'e3-sub').setAttribute('role','status');}
   if(state.cambios)notice(d,'cambios-sin-guardar');
  }
  if(state.aviso&&state.aviso!==R.aviso)notice(d,state.aviso,state.aviso==='cancelada'?null:'no');
 }
 function renderPreview(){
  const p=refs.preview;p.replaceChildren();if(!state.candidato){p.hidden=true;return;}p.hidden=false;
  const c=state.candidato,v=state.verificacion,r=E3.receta(c.congelado.receta.key);
  el('h3',t(U.steps[2]),p);
  const chip=el('p',undefined,p);el('span',t(U.state)+': ',chip);const st=el('span',t(U.n05[v?.estado||'preparado']),chip,'e3-state '+(v?.estado==='verificado'?'e3-ok':v?.estado==='invalido'?'e3-no':'e3-part'));st.id='e3Estado';st.dataset.estado=v?.estado||'preparado';
  if(v)notice(p,v.motivo,v.estado==='verificado'?'ok':v.estado==='invalido'?'no':null);
  const again=btn(t(U.verifyAgain),el('div',undefined,p,'e3-actions'));again.addEventListener('click',()=>leer());
  el('h3',t(U.steps[3]),p);
  const pv=el('div',undefined,p,'e3-preview');const cov=el('div',undefined,pv,'e3-cover');
  el('small',t(U.previewTitle),cov);const n=E3.nombre(r,c.congelado.idioma);const h=el('h4',n.texto,cov);h.lang=c.congelado.idioma;
  el('p',(state.analisis?.project?.name||'')+' · '+t(U.confirmed)+' #'+c.congelado.revision,cov,'e3-sub');
  const dl=el('dl',undefined,pv);
  const add=(k,val)=>{el('dt',t(k),dl);el('dd',val,dl);};
  add(U.modality,r.sel?.tipo||'—');add(U.work,short(c.congelado.contentId));add(U.selection,short(c.congelado.seleccionSha256));
  if(r.sel?.capitulos){el('h4',t(U.chapters),pv);const ol=el('ol',undefined,pv);for(const x of r.sel.capitulos)el('li',x,ol).lang='es';}
  if(r.sel?.documentos){el('h4',t(U.documents),pv);const ol=el('ol',undefined,pv);for(const x of r.sel.documentos)el('li',x,ol);}
  const R=c.composicion.resolucion;el('h4',t(U.credited),pv);const ol=el('ol',undefined,pv);for(const id of [...R.acreditadas,...R.parciales]){const nn=E3.nombre(E3.CATALOGO.fuentes[id],lang());const li=el('li',nn.texto+(R.parciales.includes(id)?' · '+t(U.srcState.parcial):''),ol);if(nn.lang!==lang())li.lang=nn.lang;}
  if(!R.acreditadas.length&&!R.parciales.length)el('li',t(U.none),ol);
  el('p',t(U.previewNote),pv,'e3-sub');
 }
 function renderSteps(){const i=state.candidato?(state.verificacion?3:2):state.sel?1:0;[...refs.steps.children].forEach((li,k)=>{if(k===i)li.setAttribute('aria-current','step');else li.removeAttribute('aria-current');});}
 function render(){if(!refs)return;renderRead();renderList();renderDetail();renderPreview();renderSteps();}

 function build(){
  dialog=el('dialog',undefined,document.body,'e3-dialog');dialog.id='e3Dialog';dialog.setAttribute('aria-labelledby','e3Title');dialog.setAttribute('aria-describedby','e3Sub');
  const shell=el('div',undefined,dialog,'e3-shell');const head=el('header',undefined,shell,'e3-head');const tt=el('div',undefined,head);
  el('h2',t(U.title),tt).id='e3Title';el('p',t(U.sub),tt).id='e3Sub';
  const hb=el('div',undefined,head,'e3-actions');hb.style.margin='0';btn(t(U.reread),hb).addEventListener('click',()=>leer());const x=btn(t(U.close),hb);x.id='e3Close';x.addEventListener('click',()=>dialog.close());
  const body=el('div',undefined,shell,'e3-body');
  const steps=el('ol',undefined,body,'e3-steps');for(const s of U.steps)el('li',t(s),steps);
  const read=el('section',undefined,body,'e3-read');read.setAttribute('aria-live','polite');
  const list=el('section',undefined,body);const right=el('div',undefined,body);
  const detail=el('section',undefined,right,'e3-detail');detail.tabIndex=-1;detail.setAttribute('aria-live','polite');
  const preview=el('section',undefined,right,'e3-detail');preview.tabIndex=-1;preview.hidden=true;preview.id='e3Preview';
  refs={read,list,detail,preview,steps};
  dialog.addEventListener('close',()=>{prep.cancelar();state.busy=false;state.gen++;const o=document.getElementById('e3Open');o?.focus();});
 }
 function open(){if(dialog)dialog.remove();build();state.aviso=null;dialog.showModal();render();leer();
  setTimeout(()=>{const first=dialog.querySelector('input[name="e3-receta"]:checked')||dialog.querySelector('select');first?.focus?.();},0);}
 function card(container){
  if(!container)return;container.querySelector('#e3Card')?.remove();
  const c=el('article',undefined,container,'professional-card e3-card');c.id='e3Card';c.dataset.module='studio-e3';
  el('h3',t(U.card),c);el('p',t(U.cardLead),c,'e3-lead');el('p',t(U.cardMeta),c,'professional-state');
  const b=btn(t(U.open),el('div',undefined,c,'e3-actions'));b.id='e3Open';b.dataset.emphasis='accent';b.addEventListener('click',open);
 }
 window.RubikStudioE3UI={card,open,get state(){return state;}};
})();
