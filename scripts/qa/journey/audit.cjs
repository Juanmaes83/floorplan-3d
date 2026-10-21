/* Journey audit (docs/product/journey-orientation-2026-10-21.md §1). Runs the user journeys A–O end to end in
   Chromium, as a person would: real clicks (touch taps on phones) on visible controls, a fresh browser profile per
   journey unless the journey is about resuming, and a video per journey. Every step records a screenshot and a probe
   of what the screen offers at that moment: guide task and its button, palette state and tab, tool, selection,
   dialogs, the filled («dominant») controls, banners, toasts, project counts, undo/redo and the plan area left.
   Only visible controls are used (clicks; touch taps on phones; files through the chooser opened by the visible
   button; drawers closed with their own buttons). A press that fails is never retried by other means: the step is
   recorded as «blocked» with the reason, and the remaining steps of that journey are recorded as «no ejecutado», so
   a journey only counts as completed when every step was performed. Results: docs/qa/journey-orientation-2026-10-21.md.
   Usage: node scripts/qa/journey/audit.cjs <checkout> <outdir> [1440x900 390x844 844x390] [--only=A,B]
   Env: CHROME (Chromium path), THREE_LOCAL_DIR (three@0.160.0 unpacked, for 3D without network). */
const fs=require('node:fs/promises'),fss=require('node:fs'),path=require('node:path'),os=require('node:os'),{createServer}=require('node:http'),{chromium}=require('playwright');
const {execFileSync}=require('node:child_process');
const args=process.argv.slice(2),only=(args.find(a=>a.startsWith('--only='))||'').slice(7).split(',').filter(Boolean);
const [rootArg,outArg,...rest]=args.filter(a=>!a.startsWith('--')),root=path.resolve(rootArg),out=path.resolve(outArg);
const VPS=(rest.length?rest:['1440x900','390x844','844x390']).map(s=>s.split('x').map(Number));
const types={'.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.glb':'model/gltf-binary','.txt':'text/plain'};
const BAD=[[/[㐀-鿿]/,'cjk'],[/\b(opn|wal|rom|obj|prj|img|lvl|mat|str)_[A-Za-z0-9-]{3,}/,'id'],[/\b(undefined|null|NaN|sliding-door|unreviewed)\b/,'key']];
const threeModule=require(path.join(root,'tests/helpers/three-module.cjs'));

// What the screen offers right now. Runs in the page.
function probe(BADS){
 const vis=e=>{if(!e)return false;const r=e.getBoundingClientRect();if(r.width<2||r.height<2)return false;for(let n=e;n;n=n.parentElement){const s=getComputedStyle(n);if(s.display==='none'||s.visibility==='hidden'||+s.opacity===0)return false;}return r.bottom>0&&r.top<innerHeight&&r.right>0&&r.left<innerWidth;};
 const txt=e=>e?e.textContent.replace(/\s+/g,' ').trim():null,g=id=>document.getElementById(id);
 const colour=v=>{const i=document.createElement('i');i.style.color=`var(${v})`;document.body.append(i);const c=getComputedStyle(i).color;i.remove();return c;};
 const action=colour('--action');
 const filled=[...document.querySelectorAll('button,a,[role=button],[role=tab]')].filter(b=>vis(b)&&getComputedStyle(b).backgroundColor===action).map(b=>`${b.id||b.className.split(' ').slice(0,2).join('.')}: ${txt(b).slice(0,48)}`);
 const bar=g('guideBar'),lib=document.querySelector('aside.lib'),right=document.querySelector('aside.right');
 const open=a=>{if(!a)return false;const r=a.getBoundingClientRect();return r.width>60&&r.right>10&&r.left<innerWidth-10&&getComputedStyle(a).visibility!=='hidden'&&!(matchMedia('(max-width:1100px)').matches&&!a.classList.contains('open'));};
 const stage=g('stage').getBoundingClientRect();
 // Plan area really free: stage minus the overlays drawn over it (guide bar overlap, banners, fab, chips, drawers).
 const covers=[...document.querySelectorAll('.guide-bar,.opening-pick-banner,#fab.show,#levelConflicts,#guideEmpty,aside.lib,aside.right,#mobileDock,#paletteWallBanner,#relocationPanel')].filter(vis).map(e=>e.getBoundingClientRect());
 const cell=24;let free=0,total=0;for(let y=stage.top+cell/2;y<stage.bottom;y+=cell)for(let x=stage.left+cell/2;x<stage.right;x+=cell){if(x<0||y<0||x>innerWidth||y>innerHeight)continue;total++;if(!covers.some(r=>x>=r.left&&x<=r.right&&y>=r.top&&y<=r.bottom))free++;}
 const lines=[];const walk=n=>{for(const c of n.childNodes){if(c.nodeType===3){const e=c.parentElement;if(e&&vis(e)&&!e.closest('svg,script,style')&&c.textContent.trim())lines.push(c.textContent.trim());}else if(c.nodeType===1&&getComputedStyle(c).display!=='none')walk(c);}};walk(document.body);
 const hits=[];for(const l of lines)for(const [s,c] of BADS)if(new RegExp(s).test(l))hits.push(`${c}: ${l.slice(0,100)}`);
 const p=typeof project==='object'?project:null,bctx=window.FloorPlanBuildingUI?.context,st=window.FloorPlanBuildingUI?.status?.();
 const focus=document.activeElement;
 return {
  hash:location.hash,
  dialogs:[...document.querySelectorAll('dialog[open]')].map(d=>`${d.id}: ${txt(d.querySelector('h1,h2'))||''}`),
  guide:{shown:vis(bar),title:txt(bar?.querySelector('.guide-current h2')),instruction:txt(bar?.querySelector('.guide-current p')),primary:vis(g('guidePrimary'))?txt(g('guidePrimary')):null,
   progress:txt(bar?.querySelector('.guide-progress-line strong')),stage:txt(bar?.querySelector('[aria-current=step] .step-label')),resume:vis(g('guideResume')),compact:bar?.classList.contains('guide-compact'),height:vis(bar)?Math.round(bar.getBoundingClientRect().height):0,
   state:window.FloorPlanGuideUI?{current:FloorPlanGuideUI.state().current,goal:FloorPlanGuideUI.state().goal,kind:FloorPlanGuideUI.state().kind,manual:!!FloorPlanGuideUI.state().manualTask}:null},
  empty:vis(g('guideEmpty'))?txt(g('guideEmpty')):null,
  palette:{open:open(lib),tab:window.FloorPlanBuildPalette?.tab||null,newRoomVisible:vis(g('paletteNewRoom')),opening:vis(g('paletteOpeningContext'))?txt(g('paletteOpeningContext')):null},
  panel:{open:open(right),title:txt(g('panelTitle'))},
  tool:typeof ui==='object'?ui.tool:null,sel:typeof ui==='object'&&ui.sel?`${ui.sel.kind}:${ui.sel.kind==='room'?txt(document.querySelector('#panelTitle')):ui.sel.id}`:null,
  view:window.FloorPlanApp?.viewMode||null,walk:!!window.View3D?.walking||(()=>{const w=document.querySelector('#walkOverlay');return !!w&&getComputedStyle(w).display!=='none'&&w.getBoundingClientRect().width>0;})(),
  level:bctx?{order:bctx.order,levels:bctx.levels}:null,status:st?{state:st.state,headline:st.headline}:null,
  banners:[...document.querySelectorAll('.opening-pick-banner,#paletteWallBanner,#traceStatus,.palette-warn,#levelConflicts,#relocationPanel,.mode-hint,#modehint')].filter(vis).map(e=>`${e.id||e.className}: ${txt(e).slice(0,140)}`),
  toast:g('toast')?.classList.contains('show')?txt(g('toast')):null,
  filled,
  project:p?{name:p.name,rooms:p.rooms.length,objects:p.objects.length,openings:p.openings.length,walls:p.walls.filter(w=>w.status!=='demolished').length}:null,
  undo:g('undo')?!g('undo').disabled:null,redo:g('redo')?!g('redo').disabled:null,
  presentation:g('presentationBtn')?{text:txt(g('presentationBtn')),visible:vis(g('presentationBtn')),description:g('presentationBtn').getAttribute('aria-description')}:null,
  coherence:(()=>{const out=[];const prim=txt(g('guidePrimary'))||'',view=window.FloorPlanApp?.viewMode;
    if(vis(g('guidePrimary'))&&/Abrir 3D/.test(prim)&&view==='3d')out.push('La guía ofrece «Abrir 3D» con la escena 3D abierta');
    try{const pr=FloorPlanGuideUI.progress();if(vis(bar)&&pr.current.status==='completed'&&!pr.finished)out.push(`La guía muestra como actual una tarea ya completada: «${txt(bar.querySelector('.guide-current h2'))}»`);if(pr.finished&&vis(bar)&&/completado/.test(txt(bar.querySelector('.guide-current h2'))||''))out.push(`La guía declara el objetivo completado (${pr.goal}) con ${p?.rooms.length} estancias, ${p?.objects.length} muebles y ${p?.openings.length} huecos`);}catch{}
    const name=txt(document.querySelector('.guide-project'));if(name&&/^[a-z0-9]+([-_][a-z0-9]+)+$/i.test(name))out.push(`Nombre de proyecto con forma de archivo en la cabecera: «${name}»`);
    return out;})(),
  phone:matchMedia('(max-width:1100px)').matches?(()=>{const r=e=>e&&vis(e)?e.getBoundingClientRect():null,toast=r(document.querySelector('#toast.show')),fab=r(document.querySelector('#fab.show')),dock=r(g('mobileDock')),scale=r(g('scalebar'));
    const ov=(a,b)=>!!a&&!!b&&a.left<b.right&&b.left<a.right&&a.top<b.bottom&&b.top<a.bottom;
    const fabButtons=[...document.querySelectorAll('#fab.show button')].filter(vis).map(b=>{const c=b.getBoundingClientRect(),h=document.elementFromPoint(c.left+c.width/2,c.top+c.height/2);return {label:txt(b),hittable:!!h&&(h===b||b.contains(h)),inViewport:c.left>=0&&c.right<=innerWidth};});
    return {toastOverFab:ov(toast,fab),toastOverDock:ov(toast,dock),fabOverDock:ov(fab,dock),fabOverScale:ov(fab,scale),fabButtons};})():null,
  plan:{stageW:Math.round(stage.width),stageH:Math.round(stage.height),freeShare:total?+(free/total).toFixed(2):0},
  focus:focus&&focus!==document.body?`${focus.tagName.toLowerCase()}#${focus.id||''} ${txt(focus)?.slice(0,40)||focus.getAttribute('aria-label')||''}`:null,
  hScroll:document.documentElement.scrollWidth>innerWidth+1,hits:[...new Set(hits)].slice(0,8)};
}

(async()=>{
 await fs.mkdir(out,{recursive:true});
 const server=createServer(async(req,res)=>{try{const file=path.resolve(root,'.'+(req.url==='/'?'/index.html':decodeURIComponent(new URL(req.url,'http://l').pathname)));if(!file.startsWith(root+path.sep))throw 0;res.setHeader('Content-Type',types[path.extname(file)]||'text/html');res.end(await fs.readFile(file));}catch{res.statusCode=404;res.end();}}).listen(0);
 const url=`http://127.0.0.1:${server.address().port}/`,browser=await chromium.launch({executablePath:process.env.CHROME||undefined});
 const commit=execFileSync('git',['-C',root,'rev-parse','HEAD']).toString().trim();
 // Duplex fixture as a ZIP (same encoding as the stair-conflicts suite), and an image plan for the upload journey.
 const tmp=await fs.mkdtemp(path.join(os.tmpdir(),'journey-'));
 {const B=require(path.join(root,'js/building-core.js')),P=require(path.join(root,'js/project-package.js')),T=require(path.join(root,'js/tracing-core.js')),S=require(path.join(root,'tests/fixtures/stair-conflict-building.cjs'));
  const {entries}=await B.packageEntries(S.build().building,()=>null,T.imageInfo);await fs.writeFile(path.join(tmp,'duplex.zip'),Buffer.from(await P.zip(entries,{check:B.packagePath}).arrayBuffer()));}
 const planPng=path.join(root,'tests/fixtures/manual-plan.png');
 const report={commit,browser:browser.version(),renderer:null,started:new Date().toISOString(),journeys:[]};

 for(const [w,h] of VPS){
  const vp=`${w}x${h}`,narrow=w<=1100;
  async function journey(id,title,fn){
   if(only.length&&!only.includes(id))return;
   const dir=path.join(out,vp,id);await fs.mkdir(dir,{recursive:true});
   const ctx=await browser.newContext({viewport:{width:w,height:h},isMobile:narrow,hasTouch:narrow,acceptDownloads:true,recordVideo:{dir,size:{width:Math.min(w,960),height:Math.round(h*Math.min(w,960)/w)}}});
   const page=await ctx.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&!/ERR_FAILED|cdn\.jsdelivr|Failed to load resource/.test(m.text()))errors.push(m.text());});
   await page.route('https://cdn.jsdelivr.net/**',async r=>{try{await r.fulfill({contentType:'text/javascript',headers:{'access-control-allow-origin':'*'},body:await threeModule(r.request().url(),()=>Promise.reject(Error('no cdn')))});}catch{await r.abort();}});
   const J={viewport:vp,id,title,steps:[],blocked:[],hidden:[],searches:[],notes:[],timings:[],notRun:[],aborted:false,errors};let n=0;
   const snap=async(step,intent,did)=>{await page.waitForTimeout(450);const file=`${String(++n).padStart(2,'0')}-${step}.png`;await page.screenshot({path:path.join(dir,file)});J.steps.push({step,intent,did,shot:path.join(vp,id,file),...await page.evaluate(probe,BAD.map(([r,c])=>[r.source,c]))});};
   const loc=sel=>page.locator(sel).first();
   // A person's press: the control must be visible and not covered (Playwright actionability), scrolled into view if
   // its container scrolls. Records whether it was already inside the viewport.
   const press=async(sel,{timeout=5000}={})=>{const l=loc(sel);await l.waitFor({state:'visible',timeout});const inView=await l.evaluate(e=>{const r=e.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight&&r.left>=0&&r.right<=innerWidth;});await l.scrollIntoViewIfNeeded({timeout});if(narrow)await l.tap({timeout});else await l.click({timeout});await page.waitForTimeout(300);return inView;};
   const tapAt=async(x,y)=>{if(narrow)await page.touchscreen.tap(x,y);else await page.mouse.click(x,y);await page.waitForTimeout(300);};
   const world=async pt=>page.evaluate(p=>{const s=new DOMPoint(p.x,p.y).matrixTransform(document.querySelector('#plan').getScreenCTM());return {x:s.x,y:s.y};},pt);
   const roomCentre=name=>page.evaluate(n=>{const r=project.rooms.find(r=>nm(r.name)===n||r.name===n);if(!r)return null;const xs=r.polygon.map(p=>p.x),ys=r.polygon.map(p=>p.y);return {x:(Math.min(...xs)+Math.max(...xs))/2,y:(Math.min(...ys)+Math.max(...ys))/2+250};},name);
   const tapRoom=async name=>{const c=await roomCentre(name);if(!c)throw Error(`no room ${name}`);const s=await world(c);await tapAt(s.x,s.y);};
   const visible=sel=>page.locator(sel).first().isVisible();
   // A control hidden in the guided header: recorded as a finding, then reached through «Tareas y ayuda → Ver todas
   // las herramientas» (the visible way out of the guided header).
   const reach=async(sel,why)=>{if(await visible(sel))return press(sel);J.hidden.push({control:sel,why,guided:await page.evaluate(()=>document.body.classList.contains('guided'))});
    if(await visible('#guideDetails')){await press('#guideDetails');await press('#guideAllTools');await page.waitForTimeout(400);await closeDrawers();}
    return press(sel);};
   // The search «¿Qué quieres hacer?»: writes the words and takes the first result. Records what it offered.
   const ask=async(words)=>{await press('#actionSearchBtn');await page.locator('#editorActionInput').fill(words);await page.waitForTimeout(300);const offered=await page.locator('#editorActionResults .action-result strong').allTextContents();J.searches.push({words,offered});return offered;};
   // A press whose effect is slow (3D on SwiftShader): a long timeout for the press and its outcome, both through the
   // visible control; the duration is recorded. If either fails, the step is blocked.
   const pressThen=async(sel,cond,timeout=120000)=>{const t=Date.now();await press(sel,{timeout});await page.waitForFunction(cond,null,{timeout});J.timings.push({sel,ms:Date.now()-t});};
   // Closes the drawers a person sees open, with their own toggles (phones/narrow windows).
   const closeDrawers=async()=>{for(const [aside,toggle] of [['aside.lib','#tgLib'],['aside.right','#tgPanel']])if(await page.evaluate(a=>matchMedia('(max-width:1100px)').matches&&document.querySelector(a).classList.contains('open'),aside)){await press(toggle);await page.waitForTimeout(450);}};
   const props=async()=>{if(narrow&&!(await page.evaluate(()=>document.querySelector('aside.right').classList.contains('open')))){await press('#fab [data-a=prop]');await page.waitForTimeout(450);}};
   const step=async(label,fn)=>{if(J.aborted){J.notRun.push(label);return false;}try{await fn();return true;}catch(e){J.aborted=true;J.blocked.push({step:label,reason:String(e.message).split('\n')[0].slice(0,220)});await snap(`${label}-blocked`,'',`BLOQUEADO: ${String(e.message).split('\n')[0].slice(0,120)}`).catch(()=>{});return false;}};
   const t0=Date.now();
   try{await page.goto(url);await page.waitForFunction(()=>window.FloorPlanGuideUI&&window.FloorPlanBuildPalette,null,{timeout:20000});await fn({page,snap,press,tapAt,tapRoom,world,step,loc,J,ctx,narrow,reach,ask,visible,props,pressThen,closeDrawers});}
   catch(e){J.aborted=true;J.blocked.push({step:'journey',reason:String(e.message).split('\n')[0]});}
   J.completed=!J.aborted;
   J.ms=Date.now()-t0;
   if(!report.renderer)report.renderer=await page.evaluate(()=>{try{const c=document.createElement('canvas').getContext('webgl');const d=c.getExtension('WEBGL_debug_renderer_info');return c.getParameter(d?d.UNMASKED_RENDERER_WEBGL:c.RENDERER);}catch{return 'n/a';}}).catch(()=>null);
   await ctx.close();{const vids=(await fs.readdir(dir)).filter(f=>f.endsWith('.webm'));for(const [i,f] of vids.entries())await fs.rename(path.join(dir,f),path.join(dir,`video${i?'-'+i:''}.webm`));}
   report.journeys.push(J);console.log(vp,id,`steps=${J.steps.length} blocked=${J.blocked.length} errors=${errors.length} ${(J.ms/1000).toFixed(1)}s`);
  }
  // A file chosen in the chooser opened by a visible button (the way a person uploads).
  const upload=async({page,press},button,file)=>{const fc=page.waitForEvent('filechooser',{timeout:8000});fc.catch(()=>{});await press(button);await (await fc).setFiles(file);};
  const createRoom=async({press,page},name='Salón')=>{await page.locator('#roomDesignName').fill(name);await press('#roomDesignReview');await press('#roomDesignConfirm');};
  const furnishFirst=async({press,page},query)=>{await page.locator('#furnitureSearch').fill(query);await page.waitForTimeout(400);await press('#searchResults .item');};
  const openPalette=async({press,narrow,page})=>{const open=await page.evaluate(()=>{const a=document.querySelector('aside.lib'),r=a.getBoundingClientRect();return r.width>60&&r.right>10&&!(matchMedia('(max-width:1100px)').matches&&!a.classList.contains('open'));});if(!open)await press('#tgLib');};
  const closeWelcomeTo=async(entry,{press})=>press(entry);

  // A. First visit and the three entries.
  await journey('A','Primera visita: bienvenida y elección de entrada',async c=>{const {snap,press,page,step}=c;
   await snap('welcome','Entender qué ofrece la herramienta y elegir cómo empezar','Abrir la URL de entrada (perfil limpio)');
   await step('blank',async()=>{await press('#welcomeBlank');await snap('blank-chosen','Crear desde cero','Pulsar «Crear desde cero»');});
   await step('blank-cancel',async()=>{await page.keyboard.press('Escape');await snap('blank-cancelled','Cambiar de idea antes de la primera estancia','Escape en «Nueva estancia»');});
   await step('home',async()=>{if(!(await page.locator('#welcomeDialog').evaluate(d=>d.open)))await press('#welcomeBtn');await snap('back-home','Volver a la bienvenida','«← Inicio» (o ya en la bienvenida tras cancelar)');});
   await step('example',async()=>{await press('#welcomeExample');await snap('example-chosen','Probar el ejemplo','Pulsar «Probar el ejemplo»');});
   await step('upload',async()=>{await press('#welcomeBtn');const fc=page.waitForEvent('filechooser',{timeout:5000});fc.catch(()=>{});await press('#welcomeUpload');await (await fc).setFiles([]);await snap('upload-cancelled','Subir un plano y cancelar el selector','Pulsar «Subir un plano» y cerrar el selector sin elegir');});
  });

  // B. Empty project: first room, name, save, reload.
  await journey('B','Proyecto vacío: primera estancia, nombre y guardado',async c=>{const {snap,press,page,step}=c;
   await press('#welcomeBlank');await snap('room-dialog','Crear la primera estancia','«Crear desde cero»');
   await step('create',async()=>{await createRoom(c,'Salón');await snap('first-room','Saber qué hacer tras crear la estancia','«Ver cambio» y «Confirmar y guardar»');});
   await step('guide-next',async()=>{await press('#guidePrimary');await snap('guide-next','Seguir la siguiente acción de la guía','Pulsar el botón principal de la guía');});
   await step('second-room',async()=>{await page.keyboard.press('Escape');await openPalette(c);await snap('palette','Encontrar dónde crear otra estancia','Abrir «Crear y amueblar» si está cerrada');await press('#paletteNewRoom');await createRoom(c,'Cocina');await snap('second-room','Segunda estancia creada','«Nueva estancia» de la paleta');});
   await step('reload',async()=>{await page.reload();await page.waitForFunction(()=>window.FloorPlanGuideUI);await snap('reload','Recargar (F5) a mitad de trabajo','F5');});
  });

  // C. Example already furnished: three intentions.
  await journey('C','Ejemplo amueblado: construir, amueblar o revisar',async c=>{const {snap,press,page,step}=c;
   await press('#welcomeExample');await snap('example','Entender el ejemplo y qué se puede hacer','«Probar el ejemplo»');
   await step('build-intent',async()=>{await openPalette(c);await snap('palette-open','Quiero crear una estancia: ¿dónde?','Abrir «Crear y amueblar»');
    await press('#paletteTabBuild');await snap('build-tab','Ir a «Construir»','Pulsar la pestaña «Construir»');
    await press('#paletteNewRoom');await snap('new-room-example','Crear una estancia en el ejemplo','«Nueva estancia»');await page.keyboard.press('Escape');await snap('cancel-room','Cancelar','Escape');});
   await step('furnish-intent',async()=>{await openPalette(c);await press('#paletteTabFurnish');await furnishFirst(c,'cama');await snap('furnished','Colocar un mueble','Buscar «cama» y pulsar el primer resultado');});
   await step('review-intent',async()=>{await c.pressThen('#guidePrimary',()=>FloorPlanApp.viewMode==='3d'&&!document.body.classList.contains('busy'));await page.waitForTimeout(1500);await snap('review','Revisar el ejemplo (acción de la guía)','Botón principal de la guía');});
  });

  // D. Image import, scale and recovery.
  await journey('D','Subir una imagen: escala, segunda cota y trazado',async c=>{const {snap,press,page,step,tapAt}=c;
   const fc=page.waitForEvent('filechooser',{timeout:5000});fc.catch(()=>{});await press('#welcomeUpload');await (await fc).setFiles(planPng);
   await page.waitForFunction(()=>project.sourceImages?.length&&project.sourceImages.every(i=>FloorPlanTraceUI.imageReady(i.id)),null,{timeout:30000}).catch(()=>{});await page.waitForTimeout(800);await snap('imported','Qué hacer después de subir la imagen','Elegir manual-plan.png');
   await step('guide-scale',async()=>{await press('#guidePrimary');await snap('scale-start','Empezar a ajustar la escala','Botón principal de la guía');if(await page.locator('#guideDialog').evaluate(d=>d.open)){c.J.notes.push('«Empezar a ajustar» abrió «Tu recorrido» en vez de la calibración');await press('#guideTask-scale');await snap('scale-from-list','Segundo intento desde la lista de tareas','«Empezar a ajustar» en «Tu recorrido»');}});
   // Points as fractions of the image (the fixture is small): a horizontal known distance and a vertical second one.
   const size=await page.evaluate(()=>({w:project.sourceImages[0].widthPx,h:project.sourceImages[0].heightPx}));
   const imgTap=async f=>{const pt={x:f.x*size.w,y:f.y*size.h};const s=await page.evaluate(p=>{const im=project.sourceImages[0],q=FloorPlanTracing.imageToWorld(im,p),sc=new DOMPoint(q.x,q.y).matrixTransform(document.querySelector('#plan').getScreenCTM());return {x:sc.x,y:sc.y};},pt);await tapAt(s.x,s.y);};
   await step('calibrate',async()=>{await imgTap({x:.2,y:.2});await imgTap({x:.8,y:.2});await page.locator('#traceKnown').fill('2500');await press('#traceDistanceSave');await snap('calibrated','Primera cota hecha: ¿y ahora?','Dos puntos y 2500 mm');});
   await step('second-bad',async()=>{if(await page.locator('#guidePrimary').isVisible())await press('#guidePrimary');await imgTap({x:.2,y:.3});await imgTap({x:.2,y:.8});await page.locator('#traceKnown').fill('3000');await press('#traceDistanceSave');await snap('second-contradictory','Segunda cota contradictoria: ¿cómo corregir?','Dos puntos y 3000 mm (contradice)');});
   await step('second-good',async()=>{if(await page.locator('#guidePrimary').isVisible())await press('#guidePrimary');await snap('after-bad-guide','Siguiente acción tras el error','Botón de la guía');});
  });

  // E. Rooms and walls: select, edit, cancel, undo/redo.
  await journey('E','Estancias y muros: seleccionar, editar, cancelar y deshacer',async c=>{const {snap,press,page,step,tapRoom,reach}=c;
   await press('#welcomeBlank');await createRoom(c,'Salón');await page.waitForTimeout(400);
   await step('select-room',async()=>{if(await page.evaluate(()=>matchMedia('(max-width:1100px)').matches&&document.querySelector('aside.right').classList.contains('open')))await press('#tgPanel');await tapRoom('Salón');await snap('room-selected','Editar la estancia: ¿dónde están sus acciones?','Tocar la estancia en el plano');});
   await step('dimensions',async()=>{await c.props();await press('#roomDimensions');await snap('dimensions','Cambiar una dimensión','«Dimensiones»');await page.keyboard.press('Escape');await snap('dimensions-cancel','Cancelar el cambio','Escape');});
   await step('wall',async()=>{await openPalette(c);await press('#paletteTabBuild');await press('#paletteWall');await snap('wall-mode','Dibujar un muro','«Dibujar muro»');await page.keyboard.press('Escape');await snap('wall-escape','Salir del modo muro','Escape');});
   await step('undo-redo',async()=>{await reach('#undo','Deshacer');await snap('undo','Deshacer la estancia','Deshacer');await reach('#redo','Rehacer');await snap('redo','Rehacer','Rehacer');});
  });

  // F. Doors and windows.
  await journey('F','Puertas y ventanas: añadir, seleccionar, editar y volver',async c=>{const {snap,press,page,step,tapRoom,world,tapAt}=c;
   await press('#welcomeBlank');await createRoom(c,'Salón');await page.waitForTimeout(400);
   await step('palette-window-no-room',async()=>{if(await c.visible('#fab.show [data-a=done]'))await press('#fab.show [data-a=done]');await openPalette(c);await press('#paletteTabBuild');await press('#paletteOpening-window');await snap('window-without-room','Añadir una ventana sin estancia seleccionada','«Ventana» en la paleta');});
   await step('window',async()=>{await tapRoom('Salón');await openPalette(c);await press('#paletteTabBuild');await press('#paletteOpening-window');await snap('window-pick','Elegir el muro','Seleccionar estancia y «Ventana»');
    const p=await page.evaluate(()=>{const r=project.rooms[0],xs=r.polygon.map(p=>p.x),ys=r.polygon.map(p=>p.y);return {x:(Math.min(...xs)+Math.max(...xs))/2,y:Math.min(...ys)-60};});const s=await world(p);await tapAt(s.x,s.y);await snap('window-placed','Ver el resultado y la siguiente acción','Tocar el muro superior');});
   await step('escape',async()=>{await page.keyboard.press('Escape');await snap('window-escape','Volver','Escape');});
  });

  // G. Furniture: search, add, duplicate, no room, stair conflict (duplex).
  await journey('G','Muebles: buscar, añadir, duplicar, sin sitio y conflicto con escalera',async c=>{const {snap,press,page,step}=c;
   await press('#welcomeBlank');await createRoom(c,'Salón');await page.waitForTimeout(400);
   await step('find',async()=>{await openPalette(c);await snap('palette','Amueblar: ¿dónde están los muebles?','Abrir «Crear y amueblar»');await press('#paletteTabFurnish');await furnishFirst(c,'sofá');await snap('added','Mueble añadido: ¿dónde está y qué hago?','Buscar «sofá» y pulsar el primero');});
   await step('duplicate',async()=>{const dup=narrow?'#fab [data-a=dup]':'#aDup';const covered=await page.evaluate(()=>{const t=document.querySelector('#toast.show'),b=document.querySelector('#fab.show');if(!t||!b)return false;const a=t.getBoundingClientRect(),c=b.getBoundingClientRect();return a.left<c.right&&c.left<a.right&&a.top<c.bottom&&c.top<a.bottom;});if(covered)c.J.notes.push('El aviso «Añadido…» tapa la barra de selección tras añadir un mueble');await page.waitForFunction(()=>!document.querySelector('#toast').classList.contains('show'),null,{timeout:8000}).catch(()=>{});await page.waitForTimeout(400);await press(dup);await snap('duplicated','Duplicar','Duplicar en la barra de selección');});
   await step('no-space',async()=>{for(let i=0;i<6;i++){await openPalette(c);await press('#paletteTabFurnish');await furnishFirst(c,'cama');}await snap('crowded','Sin sitio válido','Añadir seis camas');});
   await step('stair-conflict',async()=>{await upload(c,'#uploadPlanBtn',path.join(tmp,'duplex.zip'));await page.waitForFunction(()=>window.FloorPlanBuildingUI?.context?.levels===2,null,{timeout:60000});await page.waitForTimeout(800);await snap('duplex','Dúplex con muebles sobre la escalera','Importar dúplex (ZIP)');});
  });

  // H. Floors, walls and finishes.
  await journey('H','Suelos y paredes: encontrar, previsualizar, aplicar y deshacer',async c=>{const {snap,press,page,step,tapRoom}=c;
   await press('#welcomeBlank');await createRoom(c,'Salón');await page.waitForTimeout(400);
   await step('select',async()=>{if(await page.evaluate(()=>matchMedia('(max-width:1100px)').matches&&document.querySelector('aside.right').classList.contains('open')))await press('#tgPanel');await tapRoom('Salón');await snap('room','Cambiar el suelo: ¿dónde?','Tocar la estancia');});
   await step('floor',async()=>{await c.props();await press('#surfaceFloor');await snap('floor-dialog','Elegir un suelo','«Suelo»');await press('#surfaceCards button');await snap('floor-preview','Previsualizar y aplicar','Elegir el primer acabado');});
   await step('close',async()=>{await page.keyboard.press('Escape');await snap('floor-close','Cerrar','Escape');await press('#undo');await snap('undo','Deshacer','Deshacer');});
  });

  // I. Multi-level: change level, all levels, conflicts.
  await journey('I','Edificio de dos plantas: cambiar planta, ver todas y resolver conflictos',async c=>{const {snap,press,page,step,reach,ask}=c;
   await upload(c,'#welcomeUpload',path.join(tmp,'duplex.zip'));await page.waitForFunction(()=>window.FloorPlanBuildingUI?.context?.levels===2,null,{timeout:60000});await page.waitForTimeout(800);
   await snap('duplex','Entender el estado del edificio','Importar dúplex con conflictos');
   await step('level',async()=>{await reach('#levelBar [data-level] >> nth=1','Cambiar de planta');await snap('upper','Cambiar a la planta alta','Pulsar la planta alta');});
   await step('conflicts',async()=>{await press('#levelConflicts');await snap('conflicts','Ver y localizar los conflictos','Pulsar el aviso de conflictos');});
   await step('presentation-blocked',async()=>{await page.keyboard.press('Escape');await reach('#presentationBtn','Presentar');await snap('presentation-blocked','Presentar con conflictos','«Presentar mi vivienda»');});
  });

  // J. Layout review and diagnostics (example).
  await journey('J','Revisar distribución y diagnósticos',async c=>{const {snap,press,page,step,reach,ask}=c;
   await press('#welcomeExample');
   await step('search-review',async()=>{await ask('revisar distribución');await snap('search','Buscar cómo revisar','Buscar «revisar distribución»');await page.keyboard.press('Escape');await page.keyboard.press('Escape');});
   await step('review',async()=>{await openPalette(c);await press('#paletteTabBuild');await press('#paletteTrace');await snap('trace-panel','Abrir «Plano propio»','«Plano propio»');if(await page.locator('#layoutReview').isVisible())await press('#layoutReview');await snap('review','Revisión de distribución','«Revisar distribución»');});
  });

  // K. 2D / 3D / walk.
  await journey('K','2D, 3D y recorrido: entrar, entender y volver',async c=>{const {snap,press,page,step,tapRoom,reach}=c;
   await press('#welcomeExample');await page.waitForTimeout(400);
   await step('select',async()=>{if(await page.evaluate(()=>matchMedia('(max-width:1100px)').matches&&document.querySelector('aside.right').classList.contains('open')))await press('#tgPanel');await tapRoom('Salón');await snap('selected-2d','Selección en 2D','Tocar «Salón»');});
   await step('3d',async()=>{await press('#viewSeg [data-view="3d"]').catch(()=>{});await page.waitForFunction(()=>FloorPlanApp.viewMode==='3d'&&!document.body.classList.contains('busy'),null,{timeout:60000});await page.waitForTimeout(1500);await snap('3d','Entender la vista 3D y sus controles','Pulsar 3D');});
   await step('walk',async()=>{await reach('#wo3','Recorrer');await page.waitForTimeout(1500);await snap('walk','Recorrer','«Recorrer»');if(await page.locator('#walkExit').isVisible())await press('#walkExit');await snap('walk-exit','Salir del recorrido','«Salir»');});
   await step('2d',async()=>{await c.pressThen('#viewSeg [data-view="2d"]',()=>FloorPlanApp.viewMode==='2d');await page.waitForTimeout(800);await snap('back-2d','Volver a 2D con el contexto','Pulsar 2D');});
  });

  // L. Presentation (one level) and blocked presentation is in I.
  await journey('L','Presentar la vivienda (una planta)',async c=>{const {snap,press,page,step,reach,visible}=c;
   await press('#welcomeExample');
   await step('open',async()=>{if(await visible('#guidePresent'))await press('#guidePresent');else await reach('#presentationBtn','Presentar');await snap('config','Preparar la presentación','«Presentar mi vivienda»');});
   await step('start',async()=>{await c.pressThen('#presentationConfig .presentation-config-actions .btn',()=>FloorPlanPresentation.active&&document.querySelector('#presentationOverlay')?.dataset.moving==='false',90000);await page.waitForTimeout(2500);await snap('presenting','Presentar al cliente','Iniciar');});
   await step('close',async()=>{await page.locator('#presentationClose').waitFor({state:'visible',timeout:30000});await c.pressThen('#presentationClose',()=>!FloorPlanPresentation.active&&!document.body.classList.contains('presentation-exiting'));await page.waitForTimeout(800);await snap('after','Volver al editor: ¿qué sigue?','Cerrar presentación');});
  });

  // M. Save, export and what the client receives.
  await journey('M','Guardar, exportar y entregar',async c=>{const {snap,press,page,step,reach}=c;
   await press('#welcomeExample');
   await step('projects',async()=>{await press('#projectsBtn');await snap('projects','Dónde está guardado mi trabajo','«Proyectos»');await page.keyboard.press('Escape');});
   await step('file-menu',async()=>{await reach('#exportJson >> xpath=ancestor::details[1]/summary','Menú Archivo');await snap('file-menu','Exportar: ¿qué recibe el cliente?','Abrir el menú de archivo');});
   await step('sheet',async()=>{await reach('#openSheet','Lámina');await page.waitForTimeout(800);await snap('sheet','Lámina para el cliente','«Lámina»');await page.keyboard.press('Escape');});
  });

  // N. Resume: an own project half done, opened again from the entry URL.
  await journey('N','Reabrir un trabajo a medio hacer y continuar',async c=>{const {snap,press,page,step}=c;
   await press('#welcomeBlank');await createRoom(c,'Salón');await page.waitForTimeout(500);
   await page.goto(url);await page.waitForFunction(()=>window.FloorPlanGuideUI);await snap('return','Volver a la herramienta otro día','Abrir la URL de entrada');
   await step('continue',async()=>{const id=await page.locator('#welcomeContinue').isVisible()?'#welcomeContinue':'#welcomeReturn';await press(id);await snap('continued','Continuar donde lo dejé','«Continuar mi proyecto»');});
   await step('previous-steps',async()=>{for(let i=1;i<=4;i++){if(!(await page.locator('#guidePrevious').isVisible()))break;await press('#guidePrevious');await snap(`previous-${i}`,'«← Paso anterior»',`«← Paso anterior» (${i})`);if(await page.locator('#welcomeDialog').evaluate(d=>d.open))break;}});
  });

  // O. Change of intention, close, back, cancel, undo/redo, browser back.
  await journey('O','Cambiar de intención, cerrar, atrás, cancelar, deshacer',async c=>{const {snap,press,page,step,tapRoom}=c;
   await press('#welcomeBlank');await createRoom(c,'Salón');await page.waitForTimeout(400);
   await step('opening-then-close',async()=>{await tapRoom('Salón');await openPalette(c);await press('#paletteTabBuild');await press('#paletteOpening-door');await snap('door-mode','Empiezo a añadir una puerta','«Puerta abatible»');
    await press('#tgLib');await snap('drawer-closed','Cierro el panel: ¿sigue el modo activo?','Cerrar «Crear y amueblar»');});
   await step('goal-change',async()=>{await page.keyboard.press('Escape');if(await page.locator('#guideGoalChange').isVisible()){await press('#guideGoalChange');await snap('goal','Cambiar el objetivo','«Cambiar objetivo»');await page.keyboard.press('Escape');}});
   await step('close-guide',async()=>{await press('#guideClose');await snap('guide-closed','Cerrar la guía','«×»');await press('#guideResume');await snap('guide-resumed','Recuperar la guía','«Recuperar guía»');});
   await step('browser-back',async()=>{await page.goBack();await page.waitForTimeout(600);await snap('browser-back','Atrás del navegador','Atrás');});
  });
  // P. Professional delivery: two-level building → conflicts → presentation → brand → batch ZIP → back to editing.
  await journey('P','Entrega profesional: dúplex, conflictos, presentación, marca, lote ZIP y vuelta',async c=>{const {snap,press,page,step,reach,visible,narrow}=c;
   await upload(c,'#welcomeUpload',path.join(tmp,'duplex.zip'));await page.waitForFunction(()=>window.FloorPlanBuildingUI?.context?.levels===2,null,{timeout:60000});await page.waitForTimeout(800);
   await snap('imported','Recibo un dúplex: ¿qué tengo que hacer?','«Subir un plano» con el ZIP del dúplex');
   await step('conflicts',async()=>{await press('#levelConflictsOpen');await page.locator('#conflictsDialog[open]').waitFor({timeout:8000});await snap('conflicts','Entender los conflictos','Abrir la lista de conflictos');});
   // Each conflict, first row first: «Buscar sitio libre» and apply; when there is no free place, locate the piece and
   // delete it (the professional's decision). Until the building is clear.
   await step('resolve',async()=>{const clear=()=>page.evaluate(()=>FloorPlanBuildingUI.status().state==='clear');
    for(let i=1;i<=4&&!(await clear());i++){
     if(!(await page.locator('#conflictsDialog').evaluate(d=>d.open))){await press('#levelConflictsOpen');await page.locator('#conflictsDialog[open]').waitFor({timeout:8000});}
     await press('#conflictsDialog[open] [data-action="propose"]');await page.locator('#relocationPanel').waitFor({state:'visible',timeout:15000});await c.closeDrawers();await snap(`proposal-${i}`,'Revisar la propuesta de recolocación','«Buscar sitio libre»');
     if(await visible('#relocationApply:not([disabled])')){await press('#relocationApply');await page.waitForTimeout(600);await snap(`applied-${i}`,'Propuesta aplicada: ¿qué queda?','«Aplicar»');continue;}
     c.J.notes.push(`Conflicto ${i}: la propuesta no ofrece sitio libre; se localiza y elimina el mueble`);await press('#relocationCancel');await page.waitForTimeout(400);
     await press('#levelConflictsOpen');await page.locator('#conflictsDialog[open]').waitFor({timeout:8000});await press('#conflictsDialog[open] [data-action="locate"]');await page.waitForTimeout(600);await snap(`located-${i}`,'Localizar el mueble que no cabe','«Localizar en el plano 2D»');
     await page.waitForFunction(()=>!document.querySelector('#toast').classList.contains('show'),null,{timeout:10000}).catch(()=>{});await press('#fab.show [data-a=del]');await page.waitForTimeout(500);await snap(`deleted-${i}`,'Eliminar el mueble','«Eliminar»');}
    if(!(await clear()))throw Error('El edificio sigue con conflictos: '+await page.evaluate(()=>FloorPlanBuildingUI.status().headline));
    await snap('clear','Edificio sin conflictos: ¿qué sigue?','Conflictos resueltos');});
   await step('present',async()=>{if(await visible('#guidePresent'))await press('#guidePresent');else await reach('#presentationBtn','Presentar');await page.locator('#presentationConfig[open]').waitFor({timeout:8000});await snap('config','Preparar la presentación de las dos plantas','«Presentar mi vivienda»');});
   await step('brand',async()=>{await press('#brandConfigManage');await page.locator('#brandDialog[open]').waitFor({timeout:8000});await snap('brand-empty','Crear mi marca','«Tu marca profesional…» desde la presentación');
    await page.locator('#brand-name').fill('Estudio Prueba');await page.locator('#brand-phone').fill('+34 600 000 000');await page.locator('#brand-web').fill('estudio-prueba.es');await press('#brandSave');await page.waitForTimeout(400);await snap('brand-saved','Marca guardada','Rellenar y «Guardar marca»');
    await press('#brandClose');await page.waitForTimeout(400);const sel=page.locator('#presentationConfig[open] .brand-select');await sel.selectOption({label:'Estudio Prueba'});await page.locator('#brandDeliveryTitle').fill('Propuesta dúplex');await snap('signed','Firmar la entrega','Elegir la marca y escribir el título');});
   await step('start',async()=>{await c.pressThen('#presentationConfig .presentation-config-actions .btn',()=>FloorPlanPresentation.active&&document.querySelector('#presentationOverlay')?.dataset.moving==='false',180000);await page.waitForTimeout(1500);await snap('presenting','Presentar al cliente','Iniciar');});
   await step('batch',async()=>{const dl=page.waitForEvent('download',{timeout:900000});dl.catch(()=>{});await press('#presentationBatch',{timeout:60000});const d=await dl;const file=path.join(path.dirname(path.join(out,vp,'P','x')),d.suggestedFilename());await d.saveAs(file);c.J.download={name:d.suggestedFilename(),bytes:(await fs.stat(file)).size,entries:require('node:child_process').execFileSync('unzip',['-Z1',file]).toString().trim().split('\n')};await fs.unlink(file);await snap('batch-done','Lote descargado: ¿qué recibe el cliente?','«Vistas + proyecto ZIP»');});
   await step('back',async()=>{await c.pressThen('#presentationClose',()=>!FloorPlanPresentation.active&&!document.body.classList.contains('presentation-exiting'));await page.waitForTimeout(800);await snap('back','Volver al editor tras entregar: ¿qué sigue?','«Volver a editar»');});
  });

 }
 report.finished=new Date().toISOString();
 await fs.writeFile(path.join(out,'audit.json'),JSON.stringify(report,null,1));
 await browser.close();server.close();
 console.log('renderer',report.renderer);
})().catch(e=>{console.error(e);process.exit(1);});
