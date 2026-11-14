'use strict';
/* QA del árbol COMBINADO #225, #226, #227. Clics reales con Playwright/Chromium y fotos sintéticas. */
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs/promises'),path=require('node:path');
const K=require('./photo-project/kit.cjs'),SF=require('./smart-furnishing/kit.cjs');
const OUT=path.join(K.ROOT,'qa-results','integration-225-227');
const manifest={synthetic:true,steps:[],screens:[],videos:[]};
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
test('móvil táctil: tres módulos presentes durante el amueblamiento y el 3D',{timeout:360000},async()=>{
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
    assert.deepEqual(watch.errors,[]);assert.deepEqual(watch.external,[]);
  }finally{await finish(context,page,'integracion-movil.webm');}
});