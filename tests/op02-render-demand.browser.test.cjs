'use strict';
const {test,before,after} = require('node:test');
const assert = require('node:assert/strict');
const K = require('./photo-project/kit.cjs');
const furniture = require('../docs/contracts/examples/floorplan-project-v1.f3.example.json');
let env;
before(async()=>{env=await K.start();});
after(async()=>{await env?.stop();});

const counts = page=>page.evaluate(()=>View3D.lifecycleMetrics);
async function sleep(page){
  await page.waitForFunction(()=>{
    const m=View3D.lifecycleMetrics;
    return !m.loopActive&&!m.animating&&!m.flying&&m.renderedFrames>0&&!document.querySelector('#stage').classList.contains('animating');
  });
  const before=(await counts(page)).renderedFrames;
  await page.waitForTimeout(450);
  assert.equal((await counts(page)).renderedFrames,before,'quiet view draws no new frames');
  return before;
}
async function wake(page, action, before=undefined){
  before??=(await counts(page)).renderedFrames;
  await action();
  await page.waitForFunction(n=>View3D.lifecycleMetrics.renderedFrames>n,before);
}
const open3D = page=>page.locator('#viewSeg [data-view="3d"]').click();

test('OP-02 sleeps after orbit, light, doors, 3D white model, and suspension',{timeout:90000},async()=>{
  const {context,page,watch}=await K.editor(env);
  try{
    await open3D(page);
    await sleep(page);
    const start=await page.evaluate(()=>View3D.cameraState.position);
    const box=await page.locator('#view3d > canvas').first().boundingBox();
    await wake(page,async()=>{
      await page.mouse.move(box.x+box.width*.55,box.y+box.height*.45);
      await page.mouse.down();
      await page.mouse.move(box.x+box.width*.64,box.y+box.height*.46,{steps:8});
      await page.mouse.up();
    });
    await sleep(page);
    assert.notDeepEqual(await page.evaluate(()=>View3D.cameraState.position),start);
    await wake(page,()=>page.evaluate(()=>{const sun=document.querySelector('#sun');sun.value='15';sun.dispatchEvent(new Event('input'));}));
    await sleep(page);
    await wake(page,()=>page.evaluate(()=>{View3D.setWhiteModel(true);}));
    await sleep(page);
    await wake(page,()=>page.evaluate(()=>{View3D.setAllDoors(false);}));
    await sleep(page);
    assert.ok(await page.evaluate(()=>View3D.walkDoors.every(d=>!d.open)));
    await page.evaluate(()=>View3D.setSuspended(true));
    const frame=(await counts(page)).renderedFrames;
    await page.evaluate(()=>{View3D.setEnvironment3D('garden');});
    await page.waitForTimeout(450);
    assert.equal((await counts(page)).renderedFrames,frame);
    await wake(page,()=>page.evaluate(()=>View3D.setSuspended(false)),frame);
    await sleep(page);
    assert.deepEqual(watch.errors,[]);
  }finally{await context.close();}
});

test('OP-02 renders a late authorised GLB after a quiet placeholder and returns to idle',{timeout:90000},async()=>{
  const {context,page,watch}=await K.editor(env);
  let release;
  try{
    const pause=new Promise(resolve=>{release=resolve;});
    await page.route('**/synthetic-bench.glb',async route=>{await pause;await route.continue().catch(()=>{});});
    const previous=await page.evaluate(()=>FloorPlanApp.entryId);
    await page.locator('#fileIn').setInputFiles({name:'op02-model.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(furniture))});
    await page.waitForFunction(id=>FloorPlanApp.entryId!==id,previous);
    await open3D(page);
    await page.waitForFunction(()=>View3D.lifecycleMetrics.pendingAssets===1);
    const frame=await sleep(page);
    await wake(page,async()=>{release();await page.waitForFunction(()=>View3D.assetMetrics.some(asset=>asset.state==='ready'));},frame);
    await sleep(page);
    assert.equal(await page.evaluate(()=>View3D.assetObjects.length),1);
    assert.deepEqual(watch.errors,[]);
  }finally{release?.();await context.close();}
});

test('OP-02 renders a late surface texture after the fallback frame has settled',{timeout:90000},async()=>{
  const {context,page,watch}=await K.editor(env);
  let release;
  try{
    await page.waitForFunction(()=>window.FloorPlanSurfaces?.entries.some(entry=>entry.applications.includes('floor')));
    const entry=await page.evaluate(()=>FloorPlanSurfaces.entries.find(e=>e.applications.includes('floor')));
    const pause=new Promise(resolve=>{release=resolve;});
    await page.route('**/'+entry.maps.baseColor.path,async route=>{await pause;await route.continue().catch(()=>{});});
    await page.evaluate(e=>{
      const p=FloorPlanRoomLayout.create(FloorPlanRoomLayout.blank('OP-02 textura'),{name:'Sala',width:4000,depth:3000,x:0,y:0}).project;
      FloorPlanApp.importProject(FloorPlanSurfaces.apply(p,e,{kind:'floor',id:p.rooms[0].id}));
    },entry);
    await open3D(page);
    await page.waitForFunction(id=>View3D.surfaceMetrics.some(m=>m.id===id&&m.state==='loading'),entry.id);
    const frame=await sleep(page);
    const fallback=await page.locator('#view3d > canvas').first().evaluate(canvas=>canvas.toDataURL());
    await wake(page,async()=>{
      release();
      await page.waitForFunction(id=>View3D.surfaceMetrics.some(m=>m.id===id&&m.state==='ready'),entry.id);
    },frame);
    await sleep(page);
    const textured=await page.locator('#view3d > canvas').first().evaluate(canvas=>canvas.toDataURL());
    assert.notEqual(textured,fallback,'verified texture changed the rendered pixels');
    assert.deepEqual(watch.errors,[]);
  }finally{release?.();await context.close();}
});
