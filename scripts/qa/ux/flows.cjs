/* Before/after captures of the editor flows reviewed on 19-10-2026: welcome («Generar» entries), the guided example,
   a room (tap, panel, end of panel), its dimensions dialog, the wall finish dialog, adding a door from the room,
   direct selection of a door and of the 3070 mm example window, and image calibration with a coherent and a
   contradictory second dimension. Each step saves a PNG and records layout metrics, extra actions needed and a
   visible-text audit (Chinese text, internal IDs, English keys) in flows.json.
   Usage: node scripts/qa/ux/flows.cjs <checkout> <outdir> [1440x900 390x844 844x390] */
const fs=require('node:fs/promises'),path=require('node:path'),{createServer}=require('node:http'),{chromium}=require('playwright');
const [rootArg,outArg,...vpArgs]=process.argv.slice(2),root=path.resolve(rootArg),out=path.resolve(outArg);
const VPS=(vpArgs.length?vpArgs:['1440x900','390x844','844x390']).map(s=>s.split('x').map(Number));
const types={'.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml'};
const BAD=[[/[㐀-鿿]/,'cjk'],[/\b(opn|wal|rom|obj|prj|img|lvl|mat)_[A-Za-z0-9-]{3,}/,'id'],[/\b(left|right|top|bottom|start|end|undefined|null|NaN|offset|sliding-door|unreviewed)\b/,'key']];
(async()=>{
 await fs.mkdir(out,{recursive:true});
 const server=createServer(async(req,res)=>{try{const file=path.resolve(root,'.'+(req.url==='/'?'/index.html':new URL(req.url,'http://l').pathname));if(!file.startsWith(root+path.sep))throw 0;res.setHeader('Content-Type',types[path.extname(file)]||'text/html');res.end(await fs.readFile(file));}catch{res.statusCode=404;res.end();}}).listen(0);
 const url=`http://127.0.0.1:${server.address().port}/`,browser=await chromium.launch({executablePath:process.env.CHROME||undefined});
 const report={commit:(await require('node:util').promisify(require('node:child_process').execFile)('git',['-C',root,'rev-parse','HEAD'])).stdout.trim(),browser:browser.version(),steps:[]};
 for(const [w,h] of VPS){
  const narrow=w<=1100,ctx=await browser.newContext({viewport:{width:w,height:h},isMobile:narrow,hasTouch:narrow}),page=await ctx.newPage(),errors=[],name=`${w}x${h}`;
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&!/ERR_FAILED|cdn\.jsdelivr/.test(m.text()+m.location().url))errors.push(m.text());});
  await page.route('https://cdn.jsdelivr.net/**',r=>r.abort());
  const panelVisible=()=>page.evaluate(()=>{const a=document.querySelector('aside.right'),r=a.getBoundingClientRect();return r.width>40&&r.right>4&&r.left<innerWidth-4&&!document.querySelector('.app').classList.contains('hide-panel')&&(!matchMedia('(max-width:1100px)').matches||a.classList.contains('open'));});
  // Opens the properties panel the way a person would when it is hidden, and records that an extra action was needed.
  const ensurePanel=async label=>{if(await panelVisible())return;report.steps.push({viewport:name,id:'extra-action',note:`${label}: panel oculto, hizo falta abrir «Propiedades»`});if(narrow&&await page.locator('#fab [data-a=prop]').isVisible())await press('#fab [data-a=prop]');else await press('#tgPanel');await page.waitForTimeout(350);};
  // Close drawers like the app does and wait for the 0.3 s transition, so a tap never lands on a closing drawer.
  const closeAsides=async()=>{await page.evaluate(()=>drawer(null));await page.waitForTimeout(450);};
  const tap=async(x,y)=>narrow?page.touchscreen.tap(x,y):page.mouse.click(x,y);
  const press=async sel=>{const l=page.locator(sel).first();await l.scrollIntoViewIfNeeded();const b=await l.boundingBox();await tap(b.x+b.width/2,b.y+b.height/2);await page.waitForTimeout(250);};
  async function step(id,note){
   await page.waitForTimeout(350);await page.screenshot({path:path.join(out,`${name}-${id}.png`)});
   const m=await page.evaluate(([BADS])=>{const bad=BADS.map(([s,c])=>[new RegExp(s),c]),vis=e=>{if(!e)return null;const r=e.getBoundingClientRect();return {x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height),inViewport:r.width>0&&r.bottom>0&&r.top<innerHeight&&r.right>0&&r.left<innerWidth,fullyVisible:r.width>0&&r.top>=0&&r.bottom<=innerHeight&&r.left>=0&&r.right<=innerWidth};};
    const aside=document.querySelector('aside.right'),panel=document.querySelector('#panel'),ar=aside?.getBoundingClientRect(),panelShown=!!ar&&ar.width>40&&ar.right>4&&ar.left<innerWidth-4&&getComputedStyle(aside).visibility!=='hidden';
    const lines=[];const walk=n=>{for(const c of n.childNodes){if(c.nodeType===3){const e=c.parentElement;if(e&&e.getClientRects().length&&!e.closest('svg,script,style,[hidden]')&&c.textContent.trim())lines.push(c.textContent.trim());}else if(c.nodeType===1&&getComputedStyle(c).display!=='none')walk(c);}};walk(document.body);
    for(const e of document.querySelectorAll('input,select,textarea'))if(e.getClientRects().length&&!['number','radio','checkbox','hidden','file'].includes(e.type)){if(e.tagName==='SELECT'){for(const o of e.options)lines.push('[option] '+o.textContent);}else if(e.value)lines.push('[value] '+e.value);}
    const hits=[];for(const l of lines)for(const [re,c] of bad)if(re.test(l))hits.push(c+': '+l.slice(0,140));
    const dialog=[...document.querySelectorAll('dialog[open]')].map(d=>({id:d.id,text:d.innerText.replace(/\s+/g,' ').slice(0,400)}));
    return {panelShown,panelScroll:panel?{scrollHeight:panel.scrollHeight,clientHeight:(panel.closest('aside')||panel).clientHeight}:null,selection:typeof ui==='object'&&ui.sel?{...ui.sel}:null,
     back:vis(document.querySelector('#panel [data-panel-back],#back,#openingBack,#traceEditBack')),apply:vis(document.querySelector('#openingApply')),status:document.querySelector('#traceStatus:not([hidden])')?.textContent||document.querySelector('#openingPick:not([hidden])')?.textContent||null,
     dialog,hScroll:document.documentElement.scrollWidth>innerWidth+1,hits:[...new Set(hits)]};},[BAD.map(([r,c])=>[r.source,c])]);
   report.steps.push({viewport:name,id,note,...m});
  }
  await page.goto(url);await page.waitForTimeout(800);
  await step('g01-welcome','Inicio: ¿Qué quieres hacer?');
  // «Crear desde cero»: blank project and its first-room dialog, then back to the welcome.
  await press('#welcomeBlank');await step('g02-blank','Crear desde cero');
  if(await page.locator('#roomDesignCancel').isVisible())await press('#roomDesignCancel');
  await step('g03-blank-editor','Proyecto vacío tras cancelar la primera estancia');
  await press('#welcomeBtn');
  // «Subir un plano»: what opens before choosing a file.
  const chooser=page.waitForEvent('filechooser',{timeout:2500}).catch(()=>null);await press('#welcomeUpload');const fc=await chooser;
  await step('g04-upload',fc?'Selector de archivo del sistema abierto (no capturable); estado de la página':'Subir un plano');
  if(fc){await page.keyboard.press('Escape').catch(()=>{});}
  if(!(await page.locator('#welcomeDialog').evaluate(d=>d.open).catch(()=>false)))await press('#welcomeBtn');
  await press('#welcomeExample');await page.waitForTimeout(500);await step('e01-example','Ejemplo abierto');
  const ids=await page.evaluate(()=>{const p=FloorPlanApp.project,girl=p.rooms.find(r=>r.id==='rom_child');return {room:girl.id,door:'opn_door-0',window:'opn_window-1'};});
  // Room panel through a tap on the room label area.
  const roomPt=await page.evaluate(id=>{const c=FloorPlanApp.project.rooms.find(r=>r.id===id).labelAt;const m=new DOMPoint(c.x,c.y).matrixTransform(document.querySelector('#plan').getScreenCTM());return {x:m.x,y:m.y};},ids.room);
  if(narrow&&await page.evaluate(()=>document.querySelector('aside.right').classList.contains('open')||document.querySelector('aside.lib').classList.contains('open')))await closeAsides();
  await tap(roomPt.x,roomPt.y);{const sel=await page.evaluate(()=>ui.sel&&{...ui.sel});if(sel?.id!==ids.room){report.steps.push({viewport:name,id:'tap-miss',note:`Toque en la etiqueta de la estancia seleccionó ${JSON.stringify(sel)}`});await page.evaluate(id=>window.select({kind:'room',id}),ids.room);}}await step('r01-room-tap','Estancia «子女房» (Dormitorio juvenil) pulsada en el plano');
  await ensurePanel('Estancia');
  await step('r02-room-panel','Panel de la estancia (narrow: tras «Propiedades»)');
  await page.locator('#panel').evaluate(p=>{(p.closest('aside')||p).scrollTop=1e6;});await step('r03-room-panel-end','Final del panel de estancia');
  await page.locator('#panel').evaluate(p=>{(p.closest('aside')||p).scrollTop=0;});
  await press('#roomDimensions');await step('r04-dimensions','Diálogo «Dimensiones de la estancia»');
  await page.keyboard.press('Escape');await page.waitForTimeout(200);
  await ensurePanel('Estancia');
  await press('#surfaceWall');await step('r05-wall-finish','Diálogo «Acabado de una pared»');await page.keyboard.press('Escape');await page.waitForTimeout(200);
  await ensurePanel('Estancia');
  await press('#roomAddDoor');await step('a01-add-door-pick','Añadir puerta: elegir muro');
  await page.keyboard.press('Escape');await page.waitForTimeout(200);
  await page.evaluate(()=>window.select(null));if(narrow)await closeAsides();
  // Direct selection of a door on the plan.
  for(const [id,label] of [[ids.door,'o01-door-tap'],[ids.window,'o02-window-3070-tap']]){
   await page.evaluate(()=>window.select(null));if(narrow)await closeAsides();
   const pt=await page.evaluate(id=>{const o=FloorPlanApp.project.openings.find(o=>o.id===id),w=FloorPlanApp.project.walls.find(w=>w.id===o.wallId),L=Math.hypot(w.end.x-w.start.x,w.end.y-w.start.y),t=(o.offsetMm+o.widthMm/2)/L,c={x:w.start.x+(w.end.x-w.start.x)*t,y:w.start.y+(w.end.y-w.start.y)*t};const m=new DOMPoint(c.x,c.y).matrixTransform(document.querySelector('#plan').getScreenCTM());return {x:m.x,y:m.y};},id);
   await tap(pt.x,pt.y);await step(label,`Toque sobre ${id} con «Seleccionar»`);
  }
  // Calibration on a generated image: 1000 x 800 px with marks; valid and contradictory second dimensions.
  const png=Buffer.from(await page.evaluate(()=>{const c=document.createElement('canvas');c.width=1000;c.height=800;const g=c.getContext('2d');g.fillStyle='#fff';g.fillRect(0,0,1000,800);g.strokeStyle='#000';g.lineWidth=4;g.strokeRect(100,100,500,500);g.fillStyle='#c00';for(const [x,y]of [[100,100],[600,100],[100,200],[100,600]]){g.beginPath();g.arc(x,y,8,0,7);g.fill();}return c.toDataURL('image/png').split(',')[1];}),'base64');
  await page.evaluate(()=>window.select(null));
  const openTrace=async()=>{if(narrow&&!(await page.evaluate(()=>document.querySelector('aside.right').classList.contains('open'))))await page.evaluate(()=>drawer('panel',true));await page.waitForTimeout(350);};
  await page.evaluate(()=>document.querySelector('#traceBtn').click());await openTrace();
  const fc2=page.waitForEvent('filechooser');await page.evaluate(()=>document.querySelector('#traceNew').click());await (await fc2).setFiles({name:'plano-prueba.png',mimeType:'image/png',buffer:png});
  await page.waitForFunction(()=>FloorPlanApp.project.sourceImages?.length===1&&document.querySelector('#gTraceImage image, image[href^="blob:"]'));await page.waitForTimeout(400);
  // Screen point of an image pixel, from the rendered <image> as the person sees it.
  const imgPt=async(px,py)=>page.evaluate(([px,py])=>{const n=document.querySelector('image[href^="blob:"]'),m=new DOMPoint(px,py).matrixTransform(n.getScreenCTM());return {x:m.x,y:m.y};},[px,py]);
  const measure=async(btn,a,b,known)=>{await page.evaluate(id=>document.getElementById(id).click(),btn);await page.waitForTimeout(150);if(narrow)await closeAsides();
   for(const q of [a,b]){const s=await imgPt(...q);await tap(s.x,s.y);await page.waitForTimeout(120);}
   await page.locator('#traceKnown').fill(String(known));await page.locator('#traceDistanceSave').click();await page.waitForTimeout(250);};
  const scaleState=()=>page.evaluate(()=>({scale:JSON.parse(JSON.stringify(FloorPlanApp.project.scale)),mmPerPixel:FloorPlanApp.project.sourceImages[0].placement.mmPerPixel,walls:JSON.stringify(FloorPlanApp.project.walls)}));
  await measure('traceCalibrate',[100,100],[600,100],2500);
  const afterCal=await scaleState();await openTrace();await step('c01-calibrated','Calibración 500 px = 2500 mm');
  await measure('traceVerify',[100,200],[100,600],2000);const afterValid=await scaleState();await openTrace();await step('c02-second-valid','Segunda cota 400 px = 2000 mm (coherente)');
  await page.evaluate(()=>document.getElementById('traceConfirm').click());await page.waitForTimeout(200);await openTrace();await step('c03-confirm-valid','Confirmar escala tras cota coherente');const afterConfirm=await scaleState();
  await measure('traceVerify',[100,200],[100,600],3000);const afterBad=await scaleState();await openTrace();await step('c04-second-contradictory','Segunda cota 400 px = 3000 mm (contradictoria)');
  await page.evaluate(()=>document.getElementById('traceConfirm').click());await page.waitForTimeout(200);await openTrace();await step('c05-confirm-contradictory','Confirmar escala tras cota contradictoria');const afterBadConfirm=await scaleState();
  report.steps.push({viewport:name,id:'calibration-numbers',calibrated:afterCal.scale,valid:afterValid.scale.verification,confirmed:afterConfirm.scale.confidence,bad:afterBad.scale.verification,badConfirm:afterBadConfirm.scale.confidence,
   mmPerPixel:[afterCal.mmPerPixel,afterValid.mmPerPixel,afterBad.mmPerPixel,afterBadConfirm.mmPerPixel],wallsUnchanged:new Set([afterCal.walls,afterValid.walls,afterBad.walls,afterBadConfirm.walls]).size===1});
  report.steps.push({viewport:name,id:'errors',errors});
  await ctx.close();
 }
 await fs.writeFile(path.join(out,'flows.json'),JSON.stringify(report,null,1));
 for(const s of report.steps)console.log(s.viewport,s.id,s.id==='calibration-numbers'?JSON.stringify({cal:s.calibrated.calibration?.mmPerPixel,valid:[s.valid?.measuredLengthMm,s.valid?.status],confirmed:s.confirmed,bad:[s.bad?.measuredLengthMm,s.bad?.status],badConfirm:s.badConfirm,mm:s.mmPerPixel,walls:s.wallsUnchanged}):s.id==='errors'?JSON.stringify(s.errors):['extra-action','tap-miss'].includes(s.id)?s.id+': '+s.note:`panel=${s.panelShown} back=${s.back?`${s.back.y}/${s.back.fullyVisible}`:'-'} status=${(s.status||'').slice(0,90)} dialog=${s.dialog.map(d=>d.text.slice(0,120)).join('|')} hits=${s.hits.slice(0,4).join(' ;; ')}`);
 await browser.close();server.close();
})().catch(e=>{console.error(e);process.exit(1);});
