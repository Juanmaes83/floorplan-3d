/* Delivery 3D Client Experience V1 — the client's visit (index.html?entrega=…).
   The same Rubik app, in a read-only client mode started by the boot script in <head> (in-memory storage, editor chrome
   hidden): this file loads the authorised delivery snapshot (FloorPlanDelivery contract) from this deployment's
   /api/delivery — or, for the professional's preview, from the opener window — imports it through Rubik's own
   importer, and offers the client exactly what the delivery says is available:
   - «Explorar la vivienda»: Rubik's 3D view and its walk mode (keyboard + mouse on a computer, joystick + swipe on a
     phone), with doors and collisions, unchanged;
   - «Ver la presentación»: Rubik's presentation, with the rooms and order the professional chose (the presentation
     sidecar carried by the delivery, put in this tab's memory before the presentation reads it).
   Nothing here edits, saves or uploads: the editor is hidden, storage is memory, and the project never leaves the page. */
(function(){
 'use strict';
 const D=window.RUBIK_DELIVERY,app=window.FloorPlanApp,Delivery=window.FloorPlanDelivery;
 if(!D||!app||!Delivery)return;
 let snap=null,lang='es',mode='gate';
 // Dialogs the client mode hides (css/delivery-client.css) must never stay open as modals: a hidden modal makes the
 // whole page inert. The editor's welcome dialog never opens for a client; the presentation's set-up dialog is closed
 // whenever the client is back at the gate.
 const HIDDEN_DIALOGS=['#welcomeDialog','#presentationConfig'];
 const welcome=document.querySelector('#welcomeDialog');if(welcome){welcome.showModal=()=>{};welcome.show=()=>{};}
 const closeHidden=()=>{for(const q of HIDDEN_DIALOGS)document.querySelector(q+'[open]')?.close();};
 const tx=(es,en,zh)=>({es,en,zh})[lang]||es;
 const el=(tag,text,parent,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;parent?.append(n);return n;};
 const btn=(text,parent,cls='btn')=>{const b=el('button',text,parent,cls);b.type='button';return b;};
 const touch=matchMedia('(pointer: coarse)').matches;
 const webgl=(()=>{try{const c=document.createElement('canvas');return !!(c.getContext('webgl2')||c.getContext('webgl'));}catch{return false;}})();
 // Read in <head> before the app's router rewrites the hash; going back skips the entries the app pushed since.
 const fromDocument=!!D.fromDocument;
 // ── Gate: what the client sees first, before and between visits ──────────────────────────────────────────────────
 const gate=el('section',undefined,document.body,'delivery-gate');gate.id='deliveryGate';gate.setAttribute('aria-live','polite');gate.dataset.state='loading';
 const bar=el('div',undefined,document.body,'delivery-bar');bar.id='deliveryBar';bar.hidden=true;
 function header(parent){
  const h=el('header',undefined,parent,'delivery-studio');
  if(snap?.studio?.logo){const img=el('img',undefined,h);img.src=snap.studio.logo;img.alt='';}
  el('span',snap?.studio?.name?tx(`Entrega de ${snap.studio.name}`,`Delivered by ${snap.studio.name}`,`由 ${snap.studio.name} 交付`):tx('Entrega con Rubik Sota','Delivered with Rubik Sota','通过 Rubik Sota 交付'),h);
 }
 function back(parent){
  if(!fromDocument)return;const b=btn(tx('Volver al documento','Back to the document','返回文档'),parent,'btn delivery-back');b.id='deliveryBack';b.onclick=()=>history.go(-(Math.max(0,history.length-D.historyStart)+1));
 }
 function render(state,detail=''){
  closeHidden();gate.dataset.state=state;gate.hidden=false;gate.replaceChildren();bar.hidden=true;mode='gate';document.documentElement.classList.remove('delivery-in-visit');
  const card=el('div',undefined,gate,'delivery-card');header(card);
  if(state==='loading'){el('p',tx('Preparando tu vivienda…','Preparing your home…','正在准备您的住宅…'),card,'delivery-status').setAttribute('role','status');return;}
  if(state==='error'){
   el('h1',detail==='missing'?tx('Esta visita ya no está disponible','This visit is no longer available','该参观已不可用'):tx('No se pudo abrir la visita','The visit could not be opened','无法打开参观'),card,'delivery-title');
   el('p',detail==='missing'?tx('Puede que el profesional la haya retirado o que el enlace esté incompleto. Pídele un enlace nuevo.','The professional may have withdrawn it, or the link is incomplete. Ask for a new link.','专业人员可能已撤回，或链接不完整。请索取新链接。')
    :tx('Comprueba tu conexión y vuelve a intentarlo.','Check your connection and try again.','请检查网络后重试。'),card,'delivery-lead');
   const row=el('div',undefined,card,'delivery-actions');if(detail!=='missing'){const r=btn(tx('Reintentar','Try again','重试'),row,'btn primary');r.id='deliveryRetry';r.onclick=load;}back(row);return;
  }
  // ready / no-3d
  const fig=el('figure',undefined,card,'delivery-hero');
  if(snap.hero){const img=el('img',undefined,fig);img.src=snap.hero;img.alt=tx('Vista real del modelo 3D de la vivienda','Real view of the 3D model of the home','住宅三维模型的真实视图');}
  // No prepared view: the axonometric scheme drawn from the delivered model itself (never a stock image).
  else if(!window.FloorPlanProjectPreview?.axonometric(fig,{label:tx('Esquema de la vivienda entregada','Scheme of the delivered home','交付住宅示意图')})){fig.classList.add('is-empty');el('span',snap.title,fig);}
  else fig.classList.add('is-scheme');
  el('p',tx('Descubre tu vivienda en 3D','Discover your home in 3D','以三维方式探索您的住宅'),card,'delivery-eyebrow');
  el('h1',snap.title,card,'delivery-title').id='deliveryTitle';
  const caps=snap.capabilities;
  el('p',caps.guided?tx('Explora los espacios a tu ritmo o sigue la presentación que tu profesional ha preparado para ti.','Explore the spaces at your own pace or follow the presentation your professional prepared for you.','按自己的节奏探索空间，或观看专业人员为您准备的展示。')
   :tx('Explora los espacios a tu ritmo, como si caminaras por ellos.','Explore the spaces at your own pace, as if walking through them.','按自己的节奏探索空间，如同身临其境。'),card,'delivery-lead');
  const row=el('div',undefined,card,'delivery-actions');
  if(state==='no-3d'){
   el('p',tx('Este dispositivo no puede mostrar la visita 3D. Puedes abrirla desde otro ordenador o móvil reciente.','This device cannot show the 3D visit. Open it on another recent computer or phone.','此设备无法显示三维参观。请在其他较新的电脑或手机上打开。'),card,'delivery-note is-warn').id='deliveryNo3d';back(row);return;
  }
  if(caps.walk){const w=btn(tx('Explorar la vivienda','Explore the home','探索住宅'),row,'btn primary');w.id='deliveryWalk';w.onclick=()=>visit('walk');}
  if(caps.guided){const g=btn(tx('Ver la presentación','Watch the presentation','观看展示'),row,caps.walk?'btn':'btn primary');g.id='deliveryGuided';g.onclick=()=>visit('guided');}
  back(row);
  const facts=el('ul',undefined,card,'delivery-facts');facts.id='deliveryFacts';
  const rooms=roomNames();if(caps.guided)el('li',tx(`Presentación: ${rooms.length} ${rooms.length===1?'estancia':'estancias'}${snap.presentation.levels.length>1?` en ${snap.presentation.levels.length} plantas`:''} · ${rooms.slice(0,4).join(', ')}${rooms.length>4?'…':''}`,`Presentation: ${rooms.length} room${rooms.length===1?'':'s'}${snap.presentation.levels.length>1?` on ${snap.presentation.levels.length} levels`:''}`,`展示：${rooms.length} 个房间`),facts);
  el('li',touch?tx('En el móvil: mueve el joystick para caminar y desliza para mirar alrededor.','On a phone: move the joystick to walk and swipe to look around.','手机上：拖动摇杆行走，滑动环顾四周。')
   :tx('En el ordenador: teclas W A S D o flechas para caminar y el ratón para mirar. Esc para pausar.','On a computer: W A S D or arrow keys to walk and the mouse to look. Esc to pause.','电脑上：用 W A S D 或方向键行走，用鼠标环顾。Esc 暂停。'),facts);
  el('li',tx('Visita de solo lectura: la vivienda no se puede modificar desde aquí. Necesita conexión a internet.','Read-only visit: the home cannot be changed from here. Needs an internet connection.','只读参观：无法在此修改住宅。需要联网。'),facts);
  const foot=el('p',tx(`Versión entregada el ${new Date(snap.createdAt).toLocaleDateString(({es:'es-ES',en:'en-GB',zh:'zh-CN'})[lang])}${snap.source.versionCode?` · ${snap.source.versionCode}`:''}`,`Version delivered on ${new Date(snap.createdAt).toLocaleDateString('en-GB')}`,`交付版本 ${new Date(snap.createdAt).toLocaleDateString('zh-CN')}`),card,'delivery-version');foot.id='deliveryVersion';
  if(interrupted){const n=el('p',tx('La vista 3D se interrumpió (el dispositivo liberó la memoria gráfica). Vuelve a entrar; si se repite, cierra otras pestañas.','The 3D view was interrupted (the device released graphics memory). Enter again; if it happens again, close other tabs.','三维视图已中断。请重新进入；若再次发生，请关闭其他标签页。'),card,'delivery-note is-warn');n.id='deliveryInterrupted';interrupted=false;}
  if(D.preview){const p=el('p',tx('Vista previa: así lo verá tu cliente. No se ha publicado nada.','Preview: this is what your client will see. Nothing has been published.','预览：客户将看到此内容。尚未发布任何内容。'),card,'delivery-note');p.id='deliveryPreviewNote';}
  (row.querySelector('.primary')||row.querySelector('button'))?.focus({preventScroll:true});
 }
 function roomNames(){
  const out=[];const projects=snap.content.building?snap.content.building.levels.map(l=>l.project):[snap.content.project];
  for(const s of snap.presentation.sidecars){const p=projects.find(x=>x.id===s.projectId);for(const id of s.roomIds){const r=p?.rooms.find(x=>x.id===id);if(r)out.push(typeof nm==='function'?nm(r.name):r.name);}}
  return out;
 }
 // ── Visit: Rubik's own 3D view, walk mode and presentation ───────────────────────────────────────────────────────
 function showBar(label){
  bar.replaceChildren();bar.hidden=false;el('strong',snap.title,bar,'delivery-bar-title');el('span',label,bar,'delivery-bar-mode');
  const x=btn(tx('Salir de la visita','Leave the visit','退出参观'),bar,'btn delivery-bar-exit');x.id='deliveryExit';x.onclick=leave;
 }
 let watch=0;
 async function visit(kind){
  gate.hidden=true;document.documentElement.classList.add('delivery-in-visit');mode=kind;
  try{
   if(kind==='walk'){
    if(!await app.enterPresentation3D())throw Error('3d');
    showBar(tx('Exploración libre','Free exploration','自由探索'));document.querySelector('[data-mode="walk"]')?.click();
   }else{
    showBar(tx('Presentación preparada','Prepared presentation','预设展示'));seedPresentation();
    window.FloorPlanPresentation.open();
    const start=document.querySelector('#presentationConfig .presentation-config-actions .btn');if(!start)throw Error('presentation');start.click();
    // Back to the gate when the presentation ends — only once it has really started (a building's presentation takes a
    // moment to start); if it never starts, the client gets the gate back instead of an empty screen.
    clearInterval(watch);let seen=false;const since=Date.now();
    watch=setInterval(()=>{if(mode!=='guided')return clearInterval(watch);const on=!!window.FloorPlanPresentation.active;if(on)seen=true;
     if((seen&&!on&&!document.querySelector('#presentationConfig[open]'))||(!seen&&Date.now()-since>90000))leave();},700);
   }
  }catch{render('ready');}
 }
 function leave(){
  clearInterval(watch);
  if(window.FloorPlanPresentation?.active)document.querySelector('#presentationClose')?.click();
  document.querySelector('#walkExit')?.offsetParent&&document.querySelector('#walkExit').click();
  document.querySelector('[data-mode="orbit"]')?.click();
  render(webgl?'ready':'no-3d');
 }
 // The professional's decision (rooms and order, per level) becomes this tab's presentation sidecar: the presentation
 // then opens with exactly that selection, never a default of the client's browser.
 function seedPresentation(){
  const Core=window.FloorPlanPresentationCore;if(!Core)return;
  const projects=snap.content.building?(window.FloorPlanBuildingUI?.building?.levels||[]).map(l=>l.project):[app.project];
  for(const s of snap.presentation.sidecars){const p=projects.find(x=>x.id===s.projectId);if(!p)continue;
   try{localStorage.setItem(Core.key(app.entryId,p.id),JSON.stringify(Core.sidecar(p.id,app.entryId,FloorPlanGuide.revision(p),s.roomIds)));}catch{}}
 }
 // ── Loading ───────────────────────────────────────────────────────────────────────────────────────────────────────
 async function receive(){
  if(D.preview){
   return new Promise((resolve,reject)=>{
    const t=setTimeout(()=>reject(Error('timeout')),15000);
    addEventListener('message',e=>{if(e.origin!==location.origin||e.source!==window.opener||e.data?.type!=='rubik-delivery-snapshot')return;clearTimeout(t);resolve(e.data.snapshot);});
    if(!window.opener){clearTimeout(t);reject(Error('missing'));return;}
    window.opener.postMessage({type:'rubik-delivery-ready'},location.origin);
   });
  }
  const r=await fetch('api/delivery?f='+encodeURIComponent(D.source),{cache:'no-store'});
  if(r.status===404)throw Error('missing');if(!r.ok)throw Error('network');return r.json();
 }
 async function load(){
  render('loading');
  try{
   const raw=await receive();snap=Delivery.validate(raw);lang=snap.lang;
   if(typeof setLang==='function'&&typeof LANG==='string'&&LANG!==lang){try{setLang(lang);}catch{}}
   document.title=`${snap.title} · ${tx('Visita 3D','3D visit','三维参观')}`;
   const content=snap.content.building||snap.content.project;
   const file=new File([JSON.stringify(content)],'entrega.json',{type:'application/json'});
   if(!await app.importProjectFile(file))throw Error('import');
   render(webgl?'ready':'no-3d');
  }catch(e){snap=snap&&snap.content?snap:null;render('error',/missing/.test(e.message)?'missing':'network');}
 }
 let interrupted=false;
 addEventListener('webglcontextlost',()=>{if(mode!=='gate'){interrupted=true;leave();}},true);
 window.FloorPlanDeliveryClient={get state(){return gate.dataset.state;},get mode(){return mode;},get snapshot(){return snap&&structuredClone(snap);},visit,leave};
 if(document.readyState==='complete')load();else addEventListener('load',load,{once:true});
})();
