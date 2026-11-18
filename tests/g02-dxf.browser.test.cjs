'use strict';
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const K = require('./photo-project/kit.cjs');
const { editVisibleWalls } = require('./fixtures/g02-dxf-edits.cjs');
const DxfParser = require('../vendor/dxf-parser/dxf-parser.js');
const building = require('../docs/contracts/examples/floorplan-building-v1.example.json');
let env;
before(async()=>{env=await K.start();});
after(async()=>{await env?.stop();});

async function download(page) {
  const menu = page.locator('details.menu').first();
  if (!(await menu.evaluate(e=>e.open))) await menu.locator('summary').click();
  const [file] = await Promise.all([page.waitForEvent('download'),page.locator('#exportDxf').click()]);
  const buffer = await fs.readFile(await file.path());
  await menu.locator('summary').click();
  return {name:file.suggestedFilename(),buffer,entities:new DxfParser().parseSync(buffer.toString()).entities};
}
const roomNames = entities=>entities.filter(e=>e.layer==='ROOMS'&&e.type==='TEXT').map(e=>e.text);

test('G-02 downloads only the active building level without changing the editor or saved project',{timeout:90000},async()=>{
  const {context,page,watch}=await K.editor(env,{acceptDownloads:true});
  try {
    await page.locator('#fileIn').setInputFiles({name:'edificio.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(building))});
    await page.waitForFunction(()=>window.FloorPlanBuildingUI.context?.levels===2);
    for(const level of building.levels) {
      await page.locator(`#levelBar [data-level="${level.id}"]`).click();
      await page.waitForFunction(name=>FloorPlanBuildingUI.context.levelName===name,level.name);
      const before = await K.snapshot(page);
      const file = await download(page);
      assert.ok(file.name.endsWith(level.name+'.dxf'));
      assert.deepEqual(roomNames(file.entities),level.project.rooms.map(r=>r.name));
      assert.deepEqual(await K.snapshot(page),before);
    }
    assert.deepEqual(watch.errors,[]);
  } finally { await context.close(); }
});

test('G-02 downloads the current variant and reimports it in RUBIK with estimated scale',{timeout:90000},async()=>{
  const {context,page,watch}=await K.editor(env,{acceptDownloads:true});
  try {
    const original = await page.evaluate(()=>FloorPlanApp.entryId);
    await page.locator('#projectsBtn').click();
    await page.locator('#projectVariant').click();
    await page.waitForFunction(id=>FloorPlanApp.entryId!==id,original);
    if(await page.locator('#projectsDialog[open]').count())await page.locator('#projectClose').click();
    const variant = await page.evaluate(()=>({id:FloorPlanApp.entryId,walls:FloorPlanApp.project.walls.length,rooms:FloorPlanApp.project.rooms.map(r=>r.name)}));
    const before = await K.snapshot(page);
    const file = await download(page);
    assert.deepEqual(roomNames(file.entities),variant.rooms);
    assert.deepEqual(await K.snapshot(page),before);
    await page.locator('#uploadIn').setInputFiles({name:file.name,mimeType:'application/dxf',buffer:file.buffer});
    await page.waitForFunction(id=>FloorPlanApp.entryId!==id,variant.id);
    const imported = await page.evaluate(()=>({scale:FloorPlanApp.project.scale.confidence,walls:FloorPlanApp.project.walls.length,rooms:FloorPlanApp.project.rooms.length}));
    assert.deepEqual(imported,{scale:'estimated',walls:variant.walls,rooms:variant.rooms.length});
    assert.deepEqual(watch.errors,[]);
  } finally { await context.close(); }
});

test('G-02 warns when an edited DXF must be rebuilt from visible walls',{timeout:90000},async()=>{
  const {context,page,watch}=await K.editor(env,{acceptDownloads:true});
  try {
    const original = await page.evaluate(()=>({id:FloorPlanApp.entryId,walls:FloorPlanApp.project.walls}));
    const {buffer} = await download(page);
    const edited = editVisibleWalls(buffer.toString());
    await page.locator('#uploadIn').setInputFiles({name:'plan-editado.dxf',mimeType:'application/dxf',buffer:Buffer.from(edited)});
    await page.waitForFunction(id=>FloorPlanApp.entryId!==id,original.id);
    assert.match(await page.locator('#toast').textContent(),/modificado o sin verificación.*sin usar la capa auxiliar/);
    const imported = await page.evaluate(()=>({scale:FloorPlanApp.project.scale.confidence,walls:FloorPlanApp.project.walls}));
    const width = walls => {
      const xs=walls.flatMap(w=>[w.start.x,w.end.x]);
      return Math.max(...xs)-Math.min(...xs);
    };
    assert.equal(imported.scale,'estimated');
    assert.ok(width(imported.walls)>1.8*width(original.walls));
    assert.deepEqual(watch.errors,[]);
  } finally { await context.close(); }
});
