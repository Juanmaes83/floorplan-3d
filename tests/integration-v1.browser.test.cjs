'use strict';
/* QA del árbol COMBINADO #225, #226, #227. Clics reales con Playwright/Chromium y fotos sintéticas. */
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs/promises'),path=require('node:path');
const K=require('./photo-project/kit.cjs'),SF=require('./smart-furnishing/kit.cjs');
const OUT=path.join(K.ROOT,'qa-results','integration-225-227');
const manifest={synthetic:true,head:process.env.TESTED_SHA||require('node:child_process').execSync('git rev-parse HEAD').toString().trim(),createdAt:new Date().toISOString(),
  sources:{'#225':'9118152e1bd22664bb9ce55cc7d5644dd9fab756','#226':'0ac6b4a0205183eca00ec506b949275c728dab27','#227':'fbf1730003dae2190e28a63347c3b27be602a385'},base:'c8021fcfb27d02d8577e9520c47950a97c7b434c',
  provider:'FOT-01 solo simulado y rotulado; generación real desactivada; ninguna llamada a /api/ ni a terceros',steps:[],screens:[],videos:[]};
let env,jpg;
test.before(async()=>{await fs.mkdir(OUT,{recursive:true});env=await K.start();jpg=await K.synthPhoto(env.browser,{label:'QA INTEGRADA'});});
test.after(async()=>{await fs.writeFile(path.join(OUT,'manifest.json'),JSON.stringify(manifest,null,2));await env?.stop();});
const projectState=page=>page.evaluate(()=>({json:JSON.stringify(FloorPlanApp.project),undo:undoStack.length,saved:localStorage.getItem('rubik-sota-project-library-v1')}));
async function capture(page,name){await page.screenshot({path:path.join(OUT,name)});manifest.steps.push(name);manifest.screens.push(name);}
async function finish(context,page,name){await context.close();if(page.video()){await fs.copyFile(await page.video().path(),path.join(OUT,name));manifest.videos.push(name);}}
test('escritorio: UX-12 -> NAV3D -> MUE-01 -> FOT-01 -> reabrir',{timeout:480000},async()=>{
  const {context,page,watch}=await K.editor(env,{recordVideo:{dir:OUT,size:{width:1440,height:900}}});
  try{
    await SF.importFixture(page);await K.selectRoom(page,'rom_living');
    await page.locator('#sfSummary').click();await page.locator('#sfUse').selectOption('living');
    await page.locator('#sfDensity label',{hasText:'Alta'}).click();
    const before=await projectState(page);
    await page.locator('#sfGenerate').click();
    const count=+(await page.locator('#sfProposal').getAttribute('data-sf-count'));assert.ok(count>=4);
    assert.deepEqual(await projectState(page),before,'proponer no modifica datos');
    await capture(page,'01-propuesta.png');
    if(await page.locator('#sfAck').count())await page.locator('#sfAck').check();
    await page.locator('#sfApply').click();await page.locator('#sfApplied').waitFor();
    assert.equal(await page.evaluate(()=>FloorPlanApp.project.objects.filter(o=>o.id.startsWith('obj_sf')).length),count);
    await capture(page,'02-amueblado.png');
    await page.locator('#viewSeg .btn[data-view="3d"]').click();
    await page.waitForFunction(()=>FloorPlanApp.viewMode==='3d'&&!document.querySelector('#nav3d')?.hidden&&View3D.navState?.available&&!View3D.navState.busy,null,{timeout:60000});
    assert.ok((await page.locator('#nav3dRoom option').count())>1);
    await page.locator('#nav3dWhite').click();assert.equal(await page.evaluate(()=>View3D.navState.white),true);
    assert.equal(await page.evaluate(()=>FloorPlanApp.project.objects.filter(o=>o.id.startsWith('obj_sf')).length),count);
    await capture(page,'03-nav3d-muebles.png');
    await page.locator('#nav3dFinishes').click();await page.locator('#nav3dFurniture').click();
    assert.equal(await page.evaluate(()=>View3D.navState.furniture),false);
    await page.locator('#nav3dFurniture').click();assert.equal(await page.evaluate(()=>View3D.navState.furniture),true);
    await page.locator('#viewSeg .btn[data-view="2d"]').click();
    await page.waitForFunction(()=>FloorPlanApp.viewMode==='2d');
    const tab=page.locator('#paletteTabFurnish');
    if(await tab.getAttribute('aria-selected')!=='true')await tab.click();
    await page.locator('#ownFurnOpen').click();await page.locator('#ownFurn-name').fill('Silla propia QA integrada');
    await page.locator('#ownFurn-type').selectOption('chair');
    await page.locator('#ownFurn-photo').setInputFiles({name:'qa-sintetica.jpg',mimeType:'image/jpeg',buffer:jpg});
    await page.waitForFunction(()=>!/Preparando/.test(document.querySelector('#ownFurnStatus').textContent));
    for(const [id,val] of [['#ownFurn-widthMm','350'],['#ownFurn-depthMm','350'],['#ownFurn-heightMm','620']])await page.locator(id).fill(val);
    await page.locator('#ownFurnCreate').click();await page.locator('#ownFurnDialog').waitFor({state:'hidden',timeout:30000});
    const own=await page.evaluate(()=>FloorPlanApp.project.objects.find(o=>o.name==='Silla propia QA integrada')||null);
    assert.ok(own);assert.deepEqual(own.size,{widthMm:350,depthMm:350,heightMm:620});
    assert.equal(await page.evaluate(()=>FloorPlanApp.project.objects.filter(o=>o.id.startsWith('obj_sf')).length),count,'nuevas funciones conservan amueblamiento');
    await capture(page,'04-mueble-propio.png');
    const unchanged=await projectState(page);
    await page.locator('details.menu > summary').click();await page.locator('#photoReformMenu').click();
    await page.locator('#photoReformFile').setInputFiles({name:'qa-sintetica.jpg',mimeType:'image/jpeg',buffer:jpg});
    await page.locator('#photoReformOriginal:not([hidden])').waitFor();
    await page.locator('#photoReformIntent').selectOption('walls');await page.locator('#photoReformFinish').selectOption('sage');
    assert.equal(await page.locator('#photoReformReal').isDisabled(),true);
    await page.locator('#photoReformConsent').check();await page.locator('#photoReformSimulate').click();
    await page.waitForFunction(()=>RubikPhotoReform.state?.status==='done',null,{timeout:30000});
    assert.match(await page.locator('#photoReformCmpTag').innerText(),/SIMULACIÓN/);
    assert.equal(await page.locator('#photoReformDownload').isDisabled(),true);
    await capture(page,'05-fot01-simulacion.png');
    await page.locator('#photoReformDiscard').click();await page.locator('#photoReformClose').click();
    assert.deepEqual(await projectState(page),unchanged,'FOT-01 nunca altera el proyecto');
    await K.reopen(page);
    assert.equal(await page.evaluate(()=>FloorPlanApp.project.objects.filter(o=>o.id.startsWith('obj_sf')).length),count);
    assert.ok(await page.evaluate(()=>FloorPlanApp.project.objects.some(o=>o.name==='Silla propia QA integrada')));
    await page.locator('#viewSeg .btn[data-view="3d"]').click();
    await page.waitForFunction(()=>FloorPlanApp.viewMode==='3d'&&!document.querySelector('#nav3d')?.hidden,null,{timeout:60000});
    await capture(page,'06-reabierto-3d.png');
    assert.deepEqual(watch.errors,[]);assert.deepEqual(watch.external,[]);
  }finally{await finish(context,page,'integracion-escritorio.webm');}
});
test('móvil táctil: UX-12, paseo NAV3D con joystick y minimapa, mueble propio y FOT-01 sobre el mismo proyecto',{timeout:360000},async()=>{
  const {context,page,watch}=await K.editor(env,{viewport:{width:390,height:844},hasTouch:true,isMobile:true,recordVideo:{dir:OUT,size:{width:390,height:844}}});
  try{
    await SF.panel(page,false);await SF.importFixture(page);await SF.panel(page,false);
    await K.selectRoom(page,'rom_living',{touch:true});await SF.panel(page,true);
    await SF.tap(page,page.locator('#sfSummary'),true);
    await page.locator('#sfUse').selectOption('living');
    await SF.tap(page,page.locator('#sfGenerate'),true);
    assert.ok(+(await page.locator('#sfProposal').getAttribute('data-sf-count'))>0);
    await capture(page,'movil-01-propuesta.png');
    await SF.tap(page,page.locator('#sfView3D'),true);
    await page.waitForFunction(()=>FloorPlanApp.viewMode==='3d'&&document.querySelector('#nav3d')&&!document.querySelector('#nav3d').hidden,null,{timeout:60000});
    assert.equal(await page.locator('#nav3d').count(),1);
    assert.equal(await page.locator('#ownFurnOpen').count(),1);
    assert.equal(await page.locator('#photoReformMenu').count(),1);
    assert.equal(await K.hScroll(page),false);
    await capture(page,'movil-02-nav3d.png');
    // NAV3D táctil sobre el amueblamiento propuesto: paseo con joystick y minimapa, y salida.
    if(!(await page.locator('#nav3dBody').isVisible()))await page.locator('#nav3dToggle').tap();
    await page.locator('#nav3dMode-walk').tap();await page.waitForFunction(()=>View3D.walking()&&!View3D.navState.busy,null,{timeout:60000});
    await page.locator('#walkStart').tap();await page.waitForFunction(()=>!document.querySelector('#nav3dMap').hidden&&RubikNav3D.marker.state==='ok',null,{timeout:60000});
    const j=await page.locator('#joy').boundingBox(),jx=j.x+j.width/2,jy=j.y+j.height/2,cdp=await context.newCDPSession(page),p0=await page.evaluate(()=>View3D.walkPose());
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:jx,y:jy,id:1}]});
    for(let i=1;i<=5;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:jx,y:jy-i*9,id:1}]});
    await page.waitForFunction(p0=>{const p=View3D.walkPose();return Math.hypot(p.x-p0.x,p.y-p0.y)>300;},p0,{timeout:60000});
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    assert.equal(await page.evaluate(()=>RubikNav3D.marker.state),'ok');await capture(page,'movil-03-paseo-minimapa.png');
    await page.locator('#walkExit').tap();await page.waitForFunction(()=>!View3D.walking()&&!View3D.navState.busy,null,{timeout:60000});
    await page.locator('#viewSeg .btn[data-view="2d"]').tap();await page.waitForFunction(()=>FloorPlanApp.viewMode==='2d');
    // MUE-01 en el teléfono: crear el mueble propio desde «Crear y amueblar».
    if(!(await page.locator('aside.lib.open').count())){await page.locator('#tgLib').tap();await page.locator('aside.lib.open').waitFor();}
    const tab=page.locator('#paletteTabFurnish');if(await tab.getAttribute('aria-selected')!=='true')await tab.tap();
    await page.locator('#ownFurnOpen').scrollIntoViewIfNeeded();await page.locator('#ownFurnOpen').tap();await page.locator('#ownFurnDialog[open]').waitFor();
    await page.locator('#ownFurn-name').fill('Butaca móvil QA');await page.locator('#ownFurn-type').selectOption('armchair');
    await page.locator('#ownFurn-photo').setInputFiles({name:'IMG_1234.jpg',mimeType:'image/jpeg',buffer:jpg});await page.waitForFunction(()=>!/Preparando/.test(document.querySelector('#ownFurnStatus').textContent));
    for(const [k,v] of [['widthMm','800'],['depthMm','850'],['heightMm','1000']])await page.locator('#ownFurn-'+k).fill(v);
    await page.locator('#ownFurnCreate').tap();await page.locator('#ownFurnDialog').waitFor({state:'hidden',timeout:30000});
    assert.deepEqual(await page.evaluate(()=>FloorPlanApp.project.objects.find(o=>o.name==='Butaca móvil QA')?.size),{widthMm:800,depthMm:850,heightMm:1000});
    assert.equal(await page.locator('aside.lib.open, aside.right.open').count(),0,'el plano queda a la vista');await capture(page,'movil-04-mueble-propio.png');
    // FOT-01 en el teléfono: consentimiento y simulación rotulada; el proyecto no cambia.
    const before=await projectState(page);
    await page.locator('#workArea-deliver').tap();await page.locator('#photoReformCard').scrollIntoViewIfNeeded();await page.locator('#photoReformCard').tap();await page.locator('#photoReformDialog[open]').waitFor();
    await page.locator('#photoReformFile').setInputFiles({name:'salon.jpg',mimeType:'image/jpeg',buffer:jpg});await page.locator('#photoReformOriginal:not([hidden])').waitFor();
    await page.locator('#photoReformIntent').selectOption('light');await page.locator('#photoReformConsent').check();await page.locator('#photoReformSimulate').tap();
    await page.waitForFunction(()=>RubikPhotoReform.state?.status==='done',null,{timeout:30000});assert.equal(await page.locator('#photoReformCmpTag').innerText(),'SIMULACIÓN · no generada por IA');
    await page.locator('#photoReformCompare').scrollIntoViewIfNeeded();await capture(page,'movil-05-fot01-simulacion.png');
    await page.locator('#photoReformDiscard').scrollIntoViewIfNeeded();await page.locator('#photoReformDiscard').tap();
    await page.locator('#photoReformClose').scrollIntoViewIfNeeded();await page.locator('#photoReformClose').tap();await page.locator('#photoReformDialog').waitFor({state:'hidden'});
    assert.deepEqual(await projectState(page),before,'FOT-01 no altera el proyecto');assert.equal(await K.hScroll(page),false);
    assert.deepEqual(watch.errors,[]);assert.deepEqual(watch.external,[]);
  }finally{await finish(context,page,'integracion-movil.webm');}
});
// ── Cadena completa sobre UN MISMO proyecto (fixture UX-12): R02-A + R03 → UX-12 → NAV3D → MUE-01 → FOT-01 → cerrar y
// reabrir en otra pestaña. Solo controles visibles; las lecturas de estado son comprobaciones. Fotos sintéticas.
const sec=page=>page.locator('section.r02a-ceiling');
const exts=page=>page.evaluate(()=>{const e=FloorPlanApp.project.extensions||{};return structuredClone({r03:e['x-r03-cabinet']??null,r02a:e['x-r02a-ceiling']??null,mue01:e['x-mue01-furniture-photo']??null});});
const freeCeilingSpot=(page,room)=>page.evaluate(room=>{const p=FloorPlanApp.project,S=window.RubikCeilingSession,X=window.RubikCeilingContract,r=p.rooms.find(x=>x.id===room),c=S.CATALOG.ceilinglight;
  const xs=r.polygon.map(q=>q.x),ys=r.polygon.map(q=>q.y);
  for(let i=1;i<12;i++)for(let j=1;j<12;j++){const pos={x:Math.round(Math.min(...xs)+(Math.max(...xs)-Math.min(...xs))*i/12),y:Math.round(Math.min(...ys)+(Math.max(...ys)-Math.min(...ys))*j/12)};
   const ev=S.evaluate({project:p,ceiling:X.verticalFor(p,room),request:{id:'cei_probe-1',type:'ceilinglight',position:pos,size:{widthMm:c.widthMm,depthMm:c.depthMm,heightMm:c.heightMm},dropMm:0},accepted:X.asRequests(p)});
   if(ev.ok&&ev.proposal.roomId===room&&ev.state==='candidate-reviewable'&&!ev.diff.relocated)return pos;}return null;},room);
const clickFurn=async(page,id)=>{const b=await page.locator(`#plan g.furn[data-fid="${id}"]`).boundingBox();await page.mouse.click(b.x+b.width/2,b.y+b.height/2);await page.waitForTimeout(250);};
const SECRET=/sk-(?:proj-)?[A-Za-z0-9_-]{20,}|OPENAI_API_KEY\s*[:=]\s*['"][^'"]+|Bearer\s+[A-Za-z0-9._-]{20,}/;

test('cadena completa escritorio: techo R02-A + armario R03, UX-12, NAV3D, mueble propio, FOT-01, cerrar y reabrir',{timeout:900000},async()=>{
  const {context,page,watch}=await K.editor(env,{acceptDownloads:true,recordVideo:{dir:OUT,size:{width:1440,height:900}}});
  const api=[],bodies=[];page.on('request',r=>{if(/\/api\//.test(r.url()))api.push(r.url());});
  page.on('response',async r=>{try{if(/\.(js|html)(\?|$)|\/$/.test(new URL(r.url()).pathname+'/')||/javascript|html/.test(r.headers()['content-type']||''))bodies.push(await r.text());}catch{}});
  const step=(name,detail)=>manifest.steps.push(`cadena · ${name}${detail?` · ${detail}`:''}`);
  let pageNow=page;
  try{
    await SF.importFixture(page);step('fixture UX-12 importado (Archivo ▸ Importar)');
    // R02-A: referencia vertical y plafón en el dormitorio principal.
    await K.selectRoom(page,'rom_master');await K.openSection(page);
    await sec(page).locator('[data-f="clear"]').fill('2600');await sec(page).locator('[data-f="source"]').fill('medición sintética de prueba');await sec(page).locator('[data-r02a="ref-save"]').click();
    const pos=await freeCeilingSpot(page,'rom_master');assert.ok(pos,'hay sitio para un plafón');
    await sec(page).locator('[data-f="type"]').selectOption('ceilinglight');await sec(page).locator('[data-f="x"]').fill(String(pos.x));await sec(page).locator('[data-f="y"]').fill(String(pos.y));
    await sec(page).locator('[data-r02a="check"]').click();await sec(page).locator('[data-f="confirmed"]').check();await sec(page).locator('[data-r02a="save"]').click();
    let e=await exts(page);assert.equal(e.r02a?.items?.length,1,'R02-A guardado');step('R02-A plafón guardado');
    // R03: interior del armario del dormitorio principal desde su diálogo.
    await clickFurn(page,'obj_template-004');await page.locator('#aInterior').click();await page.locator('.r03-rubik-dialog').waitFor();
    await page.locator('.r03-rubik-dialog button',{hasText:'Dividir módulo'}).first().click();
    await page.locator('.r03-rubik-dialog button',{hasText:'Guardar interior'}).first().click();await page.waitForTimeout(200);await page.keyboard.press('Escape');await page.waitForTimeout(200);
    e=await exts(page);assert.equal(e.r03?.entries?.length,1,'R03 guardado');step('R03 interior guardado');
    const base=structuredClone(e);await capture(page,'cadena-01-r02a-r03.png');
    // UX-12/13: proponer, aplicar (un paso), deshacer y rehacer.
    await K.selectRoom(page,'rom_living');await page.locator('#sfSummary').click();await page.locator('#sfUse').selectOption('living');
    await page.locator('#sfGenerate').click();const count=+(await page.locator('#sfProposal').getAttribute('data-sf-count'));assert.ok(count>=3,'propuesta con muebles');
    if(await page.locator('#sfAck').count())await page.locator('#sfAck').check();
    const u0=await page.evaluate(()=>undoStack.length);await page.locator('#sfApply').click();await page.locator('#sfApplied').waitFor();
    const sfCount=()=>page.evaluate(()=>FloorPlanApp.project.objects.filter(o=>o.id.startsWith('obj_sf')).length);
    assert.equal(await sfCount(),count);assert.equal(await page.evaluate(()=>undoStack.length),u0+1,'aplicar = un paso');
    await page.keyboard.press('Control+z');assert.equal(await sfCount(),0,'deshacer retira la propuesta');
    await page.keyboard.press('Control+Shift+z');assert.equal(await sfCount(),count,'rehacer la repone');
    assert.deepEqual(await exts(page),base,'UX-12 no toca R03/R02-A');step('UX-12 aplicar/deshacer/rehacer',`${count} muebles`);
    await capture(page,'cadena-02-ux12-aplicado.png');
    // NAV3D: estancia, maqueta blanca, puertas, paseo con minimapa y salida.
    await page.locator('#viewSeg .btn[data-view="3d"]').click();
    await page.waitForFunction(()=>FloorPlanApp.viewMode==='3d'&&!document.querySelector('#nav3d')?.hidden&&View3D.navState?.available&&!View3D.navState.busy,null,{timeout:90000});
    const living=await page.locator('#nav3dRoom option').evaluateAll(o=>o.map(x=>x.value).find(v=>/rom_living/.test(v)));assert.ok(living,'el salón está en el selector');
    await page.locator('#nav3dRoom').selectOption(living);await page.waitForFunction(()=>!View3D.navState.busy&&/Encuadre/.test(document.querySelector('#nav3dStatus').textContent),null,{timeout:60000});
    await page.locator('#nav3dWhite').click();await page.waitForFunction(()=>View3D.navState.white);await capture(page,'cadena-03-nav3d-maqueta.png');
    await page.locator('#nav3dFinishes').click();await page.waitForFunction(()=>!View3D.navState.white);
    await page.locator('#nav3dDoors').click();await page.waitForFunction(()=>View3D.walkDoors.every(d=>!d.open));
    await page.locator('#nav3dDoors').click();await page.waitForFunction(()=>View3D.walkDoors.every(d=>d.open));
    await page.locator('#nav3dMode-walk').click();await page.waitForFunction(()=>View3D.walking()&&!View3D.navState.busy,null,{timeout:60000});
    await page.locator('#walkStart').click();await page.waitForFunction(()=>!document.querySelector('#nav3dMap').hidden&&RubikNav3D.marker.state==='ok',null,{timeout:60000});
    const p0=await page.evaluate(()=>View3D.walkPose());await page.keyboard.down('KeyW');
    await page.waitForFunction(p0=>{const p=View3D.walkPose();return Math.hypot(p.x-p0.x,p.y-p0.y)>400;},p0,{timeout:60000});await page.keyboard.up('KeyW');
    assert.equal(await page.evaluate(()=>RubikNav3D.marker.state),'ok','el minimapa sigue al paseo');await capture(page,'cadena-04-nav3d-paseo-minimapa.png');
    await page.keyboard.press('Escape');await page.waitForFunction(()=>!document.pointerLockElement);
    await page.locator('#nav3dToggle').click();await page.locator('#nav3dMode-interior').click();
    await page.waitForFunction(()=>!View3D.walking()&&!View3D.navState.busy,null,{timeout:60000});
    await page.locator('#viewSeg .btn[data-view="2d"]').click();await page.waitForFunction(()=>FloorPlanApp.viewMode==='2d');
    assert.equal(await sfCount(),count);assert.deepEqual(await exts(page),base,'NAV3D no modifica el proyecto');step('NAV3D estancia, maqueta, puertas, paseo con minimapa y salida');
    // MUE-01: mueble propio con foto; cotas UX-08; duplicar conservando la foto; conflicto de colocación.
    const tab=page.locator('#paletteTabFurnish');if(await tab.getAttribute('aria-selected')!=='true')await tab.click();
    const own=async({name,type,w,d,h,room})=>{await page.locator('#ownFurnOpen').click();await page.locator('#ownFurnDialog[open]').waitFor();
      await page.locator('#ownFurn-name').fill(name);await page.locator('#ownFurn-type').selectOption(type);
      await page.locator('#ownFurn-photo').setInputFiles({name:'IMG_0007.jpg',mimeType:'image/jpeg',buffer:jpg});await page.waitForFunction(()=>!/Preparando/.test(document.querySelector('#ownFurnStatus').textContent));
      for(const [k,v] of [['widthMm',w],['depthMm',d],['heightMm',h]])await page.locator('#ownFurn-'+k).fill(v);if(room)await page.locator('#ownFurn-room').selectOption(room);
      await page.locator('#ownFurnCreate').click();await page.locator('#ownFurnDialog').waitFor({state:'hidden',timeout:30000});};
    await own({name:'Butaca propia QA',type:'armchair',w:'800',d:'850',h:'1000',room:'rom_kid'});
    const mine=await page.evaluate(()=>{const o=FloorPlanApp.project.objects.find(x=>x.name==='Butaca propia QA');return o&&structuredClone(o);});
    assert.deepEqual(mine.size,{widthMm:800,depthMm:850,heightMm:1000});await page.waitForFunction(()=>document.querySelector('#ownFurnPhotoState')?.dataset.state==='ok');
    const g=await page.locator(`#plan g.furn[data-fid="${mine.id}"]`).boundingBox();await page.mouse.move(g.x+g.width/2,g.y+g.height/2);await page.mouse.down();
    await page.mouse.move(g.x+g.width/2-30,g.y+g.height/2-10,{steps:4});await page.waitForTimeout(80);const dims=await page.locator('#gSel .live-dims').count();await page.mouse.up();
    assert.ok(dims>0,'cotas UX-08 al mover el mueble propio');
    const u1=await page.evaluate(()=>undoStack.length);await page.keyboard.press('Control+d');
    const copy=await page.evaluate(()=>{const id=ui.sel?.id;const it=FloorPlanApp.project.extensions['x-mue01-furniture-photo'].items;return {id,key:it.find(i=>i.objectId===id)?.photo?.imageKey};});
    const origKey=(await exts(page)).mue01.items.find(i=>i.objectId===mine.id).photo.imageKey;
    assert.notEqual(copy.id,mine.id);assert.equal(copy.key,origKey,'el duplicado conserva la foto');assert.equal(await page.evaluate(()=>undoStack.length),u1+1);
    await capture(page,'cadena-05-mue01-duplicado.png');await page.keyboard.press('Control+z');
    assert.ok(!(await exts(page)).mue01.items.some(i=>i.objectId===copy.id),'deshacer retira la copia y su referencia');
    const nObj=await page.evaluate(()=>FloorPlanApp.project.objects.length);
    await own({name:'Aparador enorme QA',type:'cabinet',w:'6000',d:'3000',h:'900',room:'rom_gbath'});
    assert.match(await page.locator('#toast').innerText(),/no había sitio libre|estancia con sitio libre más cercana/,'conflicto de colocación explicado');
    const big=await page.evaluate(()=>FloorPlanApp.project.objects.find(o=>o.name==='Aparador enorme QA')?.id||null);
    if(big){await page.keyboard.press('Control+z');}assert.equal(await page.evaluate(()=>FloorPlanApp.project.objects.length),nObj,'sin restos del conflicto');
    const e2=await exts(page);assert.deepEqual({r03:e2.r03,r02a:e2.r02a},{r03:base.r03,r02a:base.r02a},'MUE-01 no toca R03/R02-A');step('MUE-01 crear, cotas, duplicar con foto, conflicto, deshacer');
    // FOT-01: consentimiento, simulación, cancelación, descarte; deslizador y notas limpios; registro; proyecto intacto.
    const before=await projectState(page);
    await page.locator('details.menu > summary').click();await page.locator('#photoReformMenu').click();await page.locator('#photoReformDialog[open]').waitFor();
    await page.locator('#photoReformFile').setInputFiles({name:'IMG_9999.jpg',mimeType:'image/jpeg',buffer:jpg});await page.locator('#photoReformOriginal:not([hidden])').waitFor();
    await page.locator('#photoReformIntent').selectOption('floor');await page.locator('#photoReformFinish').selectOption('walnut');await page.locator('#photoReformAlternatives').selectOption('2');
    await page.locator('#photoReformSimulate').click();assert.match(await page.locator('#photoReformStatus').innerText(),/Falta tu consentimiento/);
    await page.locator('#photoReformConsent').check();await page.locator('#photoReformSimulate').click();
    await page.waitForFunction(()=>RubikPhotoReform.state?.status==='done',null,{timeout:30000});
    assert.equal(await page.locator('#photoReformCmpTag').innerText(),'SIMULACIÓN · no generada por IA');assert.equal(await page.locator('#photoReformDownload').isDisabled(),true);
    assert.equal(await page.locator('#photoReformReal').isDisabled(),true,'generación real desactivada');await capture(page,'cadena-06-fot01-simulacion.png');
    await page.locator('#photoReformScenario').selectOption('slow');await page.locator('#photoReformSimulate').click();await page.locator('#photoReformCancel:not([hidden])').click();
    await page.waitForFunction(()=>RubikPhotoReform.state?.status==='cancelled',null,{timeout:30000});
    assert.equal(await page.locator('#photoReformSlider').isHidden(),true,'sin deslizador tras cancelar sin imágenes');assert.equal(await page.locator('#photoReformResultNote').innerText(),'','sin nota antigua');
    await page.locator('#photoReformTrace summary').click();
    const ev=await page.locator('#photoReformTraceList li').evaluateAll(l=>l.map(x=>x.dataset.event));for(const k of ['photo-accepted','consent-missing','run-started','item-done','run-finished','run-cancelled'])assert.ok(ev.includes(k),k);
    const [tdl]=await Promise.all([page.waitForEvent('download'),page.locator('#photoReformTraceDownload').click()]);
    const trace=await fs.readFile(await tdl.path(),'utf8');await fs.writeFile(path.join(OUT,'cadena-fot01-registro.json'),trace);
    assert.ok(!/IMG_9999|data:image|base64|Exif/i.test(trace),'registro sin nombre de archivo ni imagen');
    await page.locator('#photoReformDiscard').click();await page.locator('#photoReformClose').click();await page.locator('#photoReformDialog').waitFor({state:'hidden'});
    assert.deepEqual(await projectState(page),before,'FOT-01 no modifica el proyecto');assert.deepEqual(api,[],'FOT-01 sin llamadas a /api/');step('FOT-01 consentimiento, simulación, cancelación, descarte, registro');
    // Guardar (automático en la biblioteca), CERRAR la pestaña y reabrir en otra.
    const saved={exts:await exts(page),sf:await sfCount(),own:mine.id,id:await page.evaluate(()=>FloorPlanApp.project.id)};
    await capture(page,'cadena-07-antes-de-cerrar.png');await page.close();
    pageNow=await context.newPage();const w2=K.watch(pageNow,env.base);await pageNow.route('https://cdn.jsdelivr.net/**',r=>r.abort());
    pageNow.on('response',async r=>{try{if(/javascript|html/.test(r.headers()['content-type']||''))bodies.push(await r.text());}catch{}});
    await pageNow.goto(env.base);await pageNow.waitForFunction(()=>!!window.FloorPlanApp?.project&&!!window.RubikPhotoReform);
    // Igual que K.reopen: en una pestaña nueva la guía puede estar ya cerrada (su estado se guarda).
    if(await pageNow.locator('#welcomeDialog').evaluate(d=>d.open).catch(()=>false))await pageNow.locator('#welcomeActionInput').press('Escape');
    if(await pageNow.locator('#guideDetails').isVisible().catch(()=>false))await require('./editor-fixture.cjs')(pageNow);
    await pageNow.waitForFunction(id=>FloorPlanApp.project.id===id,saved.id,{timeout:60000});
    assert.deepEqual(await exts(pageNow),saved.exts,'R03, R02-A y MUE-01 intactos tras cerrar y reabrir');
    assert.equal(await pageNow.evaluate(()=>FloorPlanApp.project.objects.filter(o=>o.id.startsWith('obj_sf')).length),saved.sf,'amueblamiento intacto');
    await clickFurn(pageNow,saved.own);await pageNow.waitForFunction(()=>document.querySelector('#ownFurnPhotoState')?.dataset.state==='ok',null,{timeout:30000});
    const g2=await pageNow.locator(`#plan g.furn[data-fid="${saved.own}"]`).boundingBox();await pageNow.mouse.move(g2.x+g2.width/2,g2.y+g2.height/2);await pageNow.mouse.down();
    await pageNow.mouse.move(g2.x+g2.width/2+25,g2.y+g2.height/2,{steps:4});await pageNow.waitForTimeout(80);assert.ok(await pageNow.locator('#gSel .live-dims').count()>0,'cotas UX-08 tras reabrir');await pageNow.mouse.up();
    await pageNow.keyboard.press('Control+z');
    await pageNow.locator('#viewSeg .btn[data-view="3d"]').click();await pageNow.waitForFunction(()=>FloorPlanApp.viewMode==='3d'&&!document.querySelector('#nav3d')?.hidden,null,{timeout:90000});
    await capture(pageNow,'cadena-08-reabierto-3d.png');step('cerrar pestaña y reabrir: extensiones, amueblamiento, foto local y cotas intactos');
    assert.deepEqual(watch.errors,[]);assert.deepEqual(w2.errors,[]);assert.deepEqual(watch.external,[]);assert.deepEqual(w2.external,[]);
    const leaked=bodies.find(b=>SECRET.test(b));assert.equal(leaked,undefined,'ningún secreto en el código servido al navegador');step('sin secretos en el navegador',`${bodies.length} respuestas JS/HTML revisadas`);
  }finally{await context.close();const v=pageNow.video()||page.video();if(page.video()){await fs.copyFile(await page.video().path(),path.join(OUT,'cadena-escritorio-parte1.webm'));manifest.videos.push('cadena-escritorio-parte1.webm');}
    if(pageNow!==page&&pageNow.video()){await fs.copyFile(await pageNow.video().path(),path.join(OUT,'cadena-escritorio-parte2-reabierto.webm'));manifest.videos.push('cadena-escritorio-parte2-reabierto.webm');}}
});
