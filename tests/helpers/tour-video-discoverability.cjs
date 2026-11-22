'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { test } = require('node:test');
const playwright = require('playwright');

const viewports = [[1440,900],[1366,768],[768,1024],[390,844],[360,800],[844,390]];
const options = ['presentationStoryOption','presentationSectionOption','presentationVisitOption','presentationElevationOption'];
const video = page => page.locator('#presentationVideo');
const availability = page => page.locator('#presentationVideoAvailability');
const scene = (page,state) => page.locator(`#presentationOverlay[data-story="${state}"]`).waitFor();
const settled = page => page.waitForFunction(() => window.FloorPlanPresentation.active &&
  !window.FloorPlanPresentation.story && document.getElementById('presentationOverlay').dataset.moving === 'false',
  null, {timeout: 180000});

async function assertReachable(page, reason, container='.presentation-card-top') {
  const control = video(page);
  assert.equal(await control.count(),1);
  assert.equal(await page.locator(container+' #presentationVideo').count(),1);
  const physical = await control.evaluate(e => {
    const r=e.getBoundingClientRect(), computed=getComputedStyle(e);
    const hit=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);
    return {
      visible: computed.visibility==='visible'&&r.width>0&&r.height>0,
      inside: r.left>=0&&r.top>=0&&r.right<=innerWidth+1&&r.bottom<=innerHeight+1,
      hit:e.contains(hit),
      touch:r.width>=44&&r.height>=44,
      noOverflow:document.documentElement.scrollWidth<=innerWidth+1,
    };
  });
  assert.deepEqual(physical,{visible:true,inside:true,hit:true,touch:true,noOverflow:true});
  const blocked=await control.getAttribute('aria-disabled');
  if(reason){
    assert.equal(blocked,'true');
    assert.match(await availability(page).innerText(),reason);
    assert.equal(await control.getAttribute('aria-describedby'),'presentationVideoAvailability');
    assert.equal(await availability(page).getAttribute('role'),'status');
  }else assert.equal(blocked,'false');
}

async function workspace(t,browser,origin,opts={}) {
  const context=await browser.newContext({viewport:{width:1440,height:900},...opts});
  t.after(()=>context.close());
  const page=await context.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.route('**/*',r=>r.request().url().startsWith(origin)||/^(blob|data):/.test(r.request().url())?r.continue():r.abort());
  page.setDefaultTimeout(45000);
  return {page,errors};
}

async function loadExample(page,origin) {
  await page.goto(origin);
  await page.locator('#welcomeExample').click();
  await page.waitForFunction(()=>window.FloorPlanPresentation&&window.FloorPlanTourVideo);
  return page.evaluate(()=>JSON.stringify(FloorPlanApp.project));
}
async function start(page,selected=[]) {
  const entry=page.locator('#presentationBtn:visible,#guidePresent:visible').first();
  await entry.click();
  for(const id of selected) await page.locator('#'+id).check();
  await page.getByRole('button',{name:'Iniciar presentación',exact:true}).click();
}

async function shot(page,name) {
  const output=process.env.QA_SHOTS;
  if(!output)return;
  await fs.mkdir(output,{recursive:true});
  await page.screenshot({path:path.join(output,`video-acceso-${name}.png`)});
}

module.exports = ({ getBrowser, getOrigin }) => {
  const engine=process.env.RUBIK_TOUR_BROWSER||'chromium';
  async function get(t){
    if(engine==='chromium')return getBrowser();
    const b=await playwright[engine].launch({headless:process.env.RUBIK_TOUR_HEADED!=='1'});
    t.after(()=>b.close());
    return b;
  }
  test(`Simulator B · acceso narrativo y Recorrer · ${engine}`,{timeout:420000},async t=>{
    const {page,errors}=await workspace(t,await get(t),getOrigin());
    const before=await loadExample(page,getOrigin());
    await start(page,options);
    await settled(page);
    await assertReachable(page);
    await page.locator('#presentationStoryFull').click();await scene(page,'playing');
    await assertReachable(page,/Termina la historia/);
    await shot(page,engine+'-historia-1440');
    await page.locator('#presentationStoryPlay').click();await scene(page,'paused');
    await assertReachable(page,/Elige una parada/);
    await page.locator('#presentationClose').focus();await page.keyboard.press('Tab');
    assert.equal(await page.evaluate(()=>document.activeElement.id),'presentationVideo');
    await page.keyboard.press('Enter');
    assert.equal(await page.locator('#tourVideoDialog[open]').count(),0);
    for (const [width,height] of viewports) {
      await page.setViewportSize({width,height});
      await assertReachable(page,/Elige una parada/);
    }
    await page.setViewportSize({width:390,height:844});
    await shot(page,engine+'-pausada-390');
    await page.locator('#presentationStoryPlay').click();await scene(page,'playing');
    await page.locator('#presentationVisitWalk').waitFor({timeout:260000});await scene(page,'end');
    await assertReachable(page,/Continuar presentación/);
    await page.locator('#presentationVisitWalk').click();
    await page.locator('#presentationWalkBack').waitFor();
    await assertReachable(page,/Vuelve a la presentación/,'#presentationWalkBar');
    await shot(page,engine+'-recorrer-390');
    await page.keyboard.press('Escape');await settled(page);
    await assertReachable(page);
    await page.locator('#presentationClose').focus();await page.keyboard.press('Tab');await page.keyboard.press('Enter');
    await page.locator('#tourVideoDialog[open]').waitFor();await page.keyboard.press('Escape');
    await page.waitForFunction(()=>document.activeElement.id==='presentationVideo');
    await page.keyboard.press('Escape');await page.locator('#presentationOverlay').waitFor({state:'hidden'});
    assert.equal(await page.evaluate(()=>JSON.stringify(FloorPlanApp.project)),before);
    assert.deepEqual(errors,[]);
  });

  test(`Simulator B · formatos pendientes, rechazo y falta de soporte · ${engine}`,{timeout:180000},async t=>{
    const browser=await get(t);
    const {page,errors}=await workspace(t,browser,getOrigin());
    await page.addInitScript(()=>{
      if(window.MediaRecorder)MediaRecorder.isTypeSupported=()=>false;
      window.VideoFrame??=class {};
      let reject;
      const fault=new Promise((_, fail)=>{reject=fail;});
      window.VideoEncoder={isConfigSupported:()=>fault};
      window.rejectVideoSupport=()=>reject(Error('synthetic codec detection failure'));
    });
    await loadExample(page,getOrigin());await start(page);await settled(page);
    await assertReachable(page,/Comprobando formatos/);
    await page.evaluate(()=>window.rejectVideoSupport());
    await page.waitForFunction(()=>document.getElementById('presentationVideoAvailability').textContent.includes('No se pudieron comprobar'));
    await assertReachable(page,/No se pudieron comprobar/);
    assert.deepEqual(errors,[]);
    await page.keyboard.press('Escape');await page.locator('#presentationOverlay').waitFor({state:'hidden'});
    const unsupported=await workspace(t,browser,getOrigin());
    await unsupported.page.addInitScript(()=>{
      if(window.MediaRecorder)MediaRecorder.isTypeSupported=()=>false;
      window.VideoEncoder=undefined;
    });
    await loadExample(unsupported.page,getOrigin());await start(unsupported.page);await settled(unsupported.page);
    await assertReachable(unsupported.page,/Este navegador no puede grabar/);
    assert.deepEqual(unsupported.errors,[]);
  });

  test(`Simulator B · cámara, lote y regreso durante la vista previa · ${engine}`,{timeout:240000},async t=>{
    const {page,errors}=await workspace(t,await get(t),getOrigin());
    const before=await loadExample(page,getOrigin());
    await start(page,['presentationElevationOption']);await settled(page);
    await assertReachable(page);
    const activeBlock=async(pattern)=>{
      await page.waitForFunction(text=>document.getElementById('presentationVideoAvailability').textContent.includes(text),pattern);
      await assertReachable(page,new RegExp(pattern));
    };
    // Let the real action enter its busy state and hold the next rendering call until it has been checked.
    // This observes the actual lock without depending on the number of frames the engine takes to move.
    const holdNextMove=()=>page.evaluate(()=>{
      const go=View3D.presentationGo;
      const hold=new Promise(resolve=>{window.releaseVideoTestMove=resolve;});
      View3D.presentationGo=async function(...args){
        View3D.presentationGo=go;
        await hold;
        return go.apply(this,args);
      };
    });
    const resumeMove=()=>page.evaluate(()=>window.releaseVideoTestMove());
    await holdNextMove();
    await page.locator('.presentation-nav button').last().click();
    await activeBlock('Espera a que la cámara');
    await resumeMove();
    await settled(page);await assertReachable(page);
    await holdNextMove();
    await page.locator('#presentationBatch').click();
    await activeBlock('Espera a que termine el lote');
    await page.locator('#presentationBatchCancel').click();
    await resumeMove();
    await page.waitForFunction(()=>document.getElementById('presentationVideo').getAttribute('aria-disabled')==='false');
    await video(page).click();
    const cine=page.locator('input[name=tourVideoMode][value=cine]');
    if(await cine.isEnabled()){
      await cine.check();
      await page.locator('#tourVideoWatch').click();
      await activeBlock('Vista previa en curso');
      await page.evaluate(()=>history.back());
      await page.locator('#presentationOverlay').waitFor({state:'hidden'});
      assert.equal(await page.evaluate(()=>FloorPlanPresentationFilm.busy),false);
      assert.equal(await page.locator('#tourVideoDialog[open]').count(),0);
    }else{
      await page.keyboard.press('Escape');
      await page.locator('#presentationClose').click();
      await page.locator('#presentationOverlay').waitFor({state:'hidden'});
    }
    assert.equal(await page.evaluate(()=>JSON.stringify(FloorPlanApp.project)),before);
    await page.reload();await loadExample(page,getOrigin());
    await start(page);await settled(page);
    await assertReachable(page);
    assert.deepEqual(errors,[]);
  });
};
