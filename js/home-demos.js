/* HOM-04 · «Descubre RUBIK en acción»: arranque directo de Hybrid V2 «Dibujo vivo» (?demo=dibujo-vivo).
   Reutiliza exactamente el recorrido que ya existe —«Probar el ejemplo» → Presentar → «Dibujo vivo» → Iniciar
   presentación— sobre la vivienda de ejemplo; no reimplementa el efecto ni toca su motor (presentation-living-drawing).
   - Introducción corta, controles discretos y, al terminar: «Volver a ver», «Cómo hacerlo con mi proyecto» y
     «Volver al inicio».
   - No cambia el proyecto (la presentación nunca lo hace), no publica nada y no llama a ningún proveedor de IA.
   - Al volver al inicio, si el visitante tenía otro proyecto abierto, se reabre con el mismo camino que «Abrir» de la
     lista de proyectos (switchProject(library.open(id))). Sin parámetro ?demo, este archivo no hace nada. */
(function(){
 'use strict';
 const q=new URLSearchParams(location.search);if(q.get('demo')!=='dibujo-vivo')return;
 const lang=()=>{try{return typeof LANG==='string'?LANG:'es';}catch{return 'es';}};
 const tx=(es,en,zh)=>({en,zh}[lang()]||es);
 const el=(tag,cls,parent,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;parent?.append(n);return n;};
 const button=(text,parent,fn,primary)=>{const b=el('button','btn'+(primary?' primary':''),parent,text);b.type='button';b.onclick=fn;return b;};
 const wait=(cond,ms=120000)=>new Promise((resolve,reject)=>{const t0=Date.now();(function tick(){let v=null;try{v=cond();}catch{}
  if(v)return resolve(v);if(Date.now()-t0>ms)return reject(new Error('timeout'));setTimeout(tick,200);})();});
 const visible=s=>[...document.querySelectorAll(s)].find(n=>n.getClientRects().length&&getComputedStyle(n).visibility!=='hidden');
 const state={previous:null,started:false,seen:false,ended:false};
 const api=window.RubikHomeDemos={state};

 // The discreet bar (always) and one card (intro → end) over the presentation.
 const bar=el('div','home-demo-bar',null);bar.id='homeDemoBar';bar.setAttribute('role','region');bar.setAttribute('aria-label',tx('Demostración','Demo','演示'));
 el('span','home-demo-tag',bar,tx('Demostración · Dibujo vivo con la vivienda de ejemplo','Demo · Living drawing with the example home','演示 · 示例住宅的活绘'));
 const helpBtn=button(tx('Cómo se usa','How it works','使用方法'),bar,()=>showHelp());helpBtn.id='homeDemoHelp';
 button(tx('Volver al inicio','Back to start','返回首页'),bar,()=>home()).id='homeDemoHome';
 const card=el('div','home-demo-card',null);card.id='homeDemoCard';card.setAttribute('role','dialog');card.setAttribute('aria-live','polite');
 function show(title,text,actions){card.replaceChildren();el('h2',null,card,title);for(const p of [].concat(text))el('p',null,card,p);
  const row=el('div','home-demo-actions',card);for(const [label,fn,primary,id] of actions){const b=button(label,row,fn,primary);if(id)b.id=id;}card.hidden=false;
  card.querySelector('.btn.primary')?.focus({preventScroll:true});}
 const hide=()=>{card.hidden=true;};

 function intro(ready){
  show(tx('Del dibujo a la realidad','From drawing to reality','从图纸到现实'),
   [tx('La vivienda de ejemplo empieza como un dibujo a grafito y cobra vida estancia a estancia con sus propios materiales.','The example home starts as a graphite drawing and comes to life room by room with its own materials.','示例住宅从石墨图纸开始，逐个房间以自身材料变得真实。'),
    ready?tx('Es la misma presentación que puedes hacer con tu proyecto. No cambia nada ni usa IA.','It is the same presentation you can make with your project. It changes nothing and uses no AI.','这与你可以用自己项目制作的演示相同。不会更改任何内容，也不使用 AI。')
     :tx('Preparando la vivienda de ejemplo…','Preparing the example home…','正在准备示例住宅…')],
   ready?[[tx('▶ Ver el dibujo vivo','▶ Watch the living drawing','▶ 观看活绘'),()=>start(),true,'homeDemoStart']]:[]);
 }
 function showHelp(){
  show(tx('Cómo se usa','How it works','使用方法'),[
   tx('Reproducir o pausar: el botón de reproducción de la historia. Arrastra la barra para ir atrás o adelante.','Play or pause: the story play button. Drag the bar to go back or forward.','播放或暂停：故事播放按钮。拖动进度条可后退或前进。'),
   tx('Explorar: al terminar, la presentación sigue con las paradas por estancia; puedes recorrerlas a tu ritmo.','Explore: when it ends, the presentation goes on with its room stops; go through them at your pace.','探索：结束后演示继续按房间停留，可按自己的节奏浏览。'),
   tx('Para profesionales: presenta así la propuesta a tu cliente antes de la obra.','For professionals: present the proposal to your client like this before the works.','专业人士：在施工前以这种方式向客户展示方案。')],
   [[tx('Entendido','Got it','知道了'),()=>{state.ended?end():state.started?hide():intro(true);},true]]);
 }
 function howTo(){
  show(tx('Hazlo con tu proyecto','Do it with your project','用你的项目来做'),[
   tx('1. Abre o crea tu proyecto (Subir un plano o Crear desde cero).','1. Open or create your project (Upload a plan or Create from scratch).','1. 打开或创建你的项目（上传平面图或从零创建）。'),
   tx('2. Entregar → Presentar mi vivienda.','2. Deliver → Present my home.','2. 交付 → 展示我的住宅。'),
   tx('3. En «Historia y escenas», marca «Dibujo vivo» e inicia la presentación.','3. In «Story and scenes», tick «Living drawing» and start the presentation.','3. 在「故事与场景」中勾选「活绘」并开始演示。')],
   [[tx('Volver al inicio','Back to start','返回首页'),()=>home(),true],[tx('Volver','Back','返回'),()=>end()]]);
 }
 function end(){
  state.ended=true;
  show(tx('Así se presenta una vivienda en RUBIK','This is how RUBIK presents a home','RUBIK 就是这样展示住宅的'),
   [tx('Puedes volver a verlo, recorrer las estancias o aprender a hacerlo con tu proyecto.','Watch it again, go through the rooms or learn to do it with your project.','可以再看一遍、浏览房间，或学习如何用你的项目来做。')],
   [[tx('Volver a ver','Watch again','再看一遍'),()=>replay(),true,'homeDemoReplay'],[tx('Cómo hacerlo con mi proyecto','How to do it with my project','如何用我的项目来做'),()=>howTo(),false,'homeDemoHowTo'],
    [tx('Explorar las estancias','Explore the rooms','浏览房间'),()=>hide(),false,'homeDemoExplore']]);
 }
 function fail(e){console.warn('Demostración no disponible:',e);
  show(tx('La demostración no se ha podido abrir','The demo could not open','无法打开演示'),[tx('Vuelve al inicio e inténtalo de nuevo, o prueba el ejemplo por tu cuenta.','Go back to the start and try again, or try the example yourself.','请返回首页重试，或自行试用示例。')],
   [[tx('Volver al inicio','Back to start','返回首页'),()=>home(),true]]);}

 async function prepare(){
  // `library` is a global const of index.html (a lexical binding, not a property of window).
  const lib=()=>{try{return typeof library==='object'&&library?library:null;}catch{return null;}};
  await wait(()=>window.FloorPlanPresentation&&window.View3D?.presentationLivingDrawingBegin&&window.FloorPlanLivingDrawingRenderer&&window.FloorPlanLivingDrawing&&lib());
  try{state.previous=library.activeId();}catch{}
  // The same entry as «Probar el ejemplo» (an unchanged example is reopened, never duplicated).
  const entry=await wait(()=>document.getElementById('welcomeExample'));
  if(!document.querySelector('#welcomeDialog[open]')){window.FloorPlanGuideUI?.openWelcome?.();await wait(()=>document.querySelector('#welcomeDialog[open]'),20000);}
  entry.click();
  await wait(()=>!document.querySelector('#welcomeDialog[open]')&&visible('#presentationBtn,#guidePresent'));
  intro(true);
 }
 async function start(){
  hide();state.started=true;state.ended=false;state.seen=false;
  try{
   visible('#presentationBtn,#guidePresent').click();await wait(()=>document.querySelector('#presentationConfig[open]'));
   const option=await wait(()=>document.getElementById('presentationLivingDrawing'));if(!option.checked)option.click();
   const go=[...document.querySelectorAll('#presentationConfig button')].find(b=>/Iniciar presentación|Start presentation|开始演示/.test(b.textContent));
   if(!go)throw new Error('no start button');go.click();
   await wait(()=>window.FloorPlanPresentation.story?.kind==='living-drawing');state.seen=true;watch();
  }catch(e){fail(e);}
 }
 function watch(){const tick=()=>{if(!state.seen)return;const P=window.FloorPlanPresentation;
   if(!P.active){state.seen=false;return;}
   if(!P.story){state.seen=false;end();return;}setTimeout(tick,300);};tick();}
 async function replay(){hide();const b=document.getElementById('presentationLivingPlay');
  if(b&&window.FloorPlanPresentation.active){b.hidden=false;b.click();try{await wait(()=>window.FloorPlanPresentation.story?.kind==='living-drawing',30000);state.seen=true;state.ended=false;watch();}catch(e){fail(e);}}
  else start();}
 async function home(){
  try{if(window.FloorPlanPresentation?.active){document.getElementById('presentationClose')?.click();await wait(()=>!window.FloorPlanPresentation.active,30000);}
   const prev=state.previous;
   if(prev&&prev!==library.activeId()&&library.list().some(e=>e.id===prev))switchProject(library.open(prev));
  }catch(e){console.warn(e);}
  location.href=location.pathname;
 }
 const mount=()=>{document.body.append(bar,card);card.hidden=true;intro(false);prepare().catch(fail);};
 if(document.readyState==='loading')addEventListener('DOMContentLoaded',mount,{once:true});else mount();
 Object.assign(api,{start,replay,home,end});
})();
