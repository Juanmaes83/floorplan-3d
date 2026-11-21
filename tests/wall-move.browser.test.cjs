'use strict';
const assert = require('node:assert/strict');
const {test} = require('node:test');
const {start, editor} = require('./r02a/editor-kit.cjs');
const engines = require('playwright');
const Building = require('../js/building-core.js');
const Core = require('../js/project-core.js');
const Layout = require('../js/room-layout.js');
const Move = require('../js/wall-move-core.js');

const wallId = 'wal_ref-w38';
const fixtureName = 'Edificio sintético M08';
function stairFixture() {
  const floor = Core.initial();
  const building = Building.addLevel(Building.create(floor, {name: fixtureName}), Layout.blank('Planta superior'));
  const [ground, upper] = building.levels;
  const fixture = Building.setStair(building, {
    fromLevelId: ground.id, toLevelId: upper.id, startMm: {x:3580,y:600},
    rotationDeg:90, widthMm:800, runLengthMm:2400, risers:14
  });
  assert.equal(Building.stairConflicts(fixture).length, 0);
  const result = Move.plan(floor, wallId, 300);
  assert.equal(result.ok, true);
  assert.ok(Building.stairConflicts(Building.setProject(fixture, ground.id, result.next)).length > 0);
  return fixture;
}

async function instrument(page) {
  await page.evaluate(() => {
    window.wallMoveAudit = {events:0,toasts:[]};
    addEventListener('rubik-wall-moved', () => { wallMoveAudit.events++; });
    const original = toast;
    toast = (...args) => { wallMoveAudit.toasts.push(args[0]); return original(...args); };
  });
}

const snapshot = page => page.evaluate(() => ({
  project: snap(), history: undoStack.length, redo: redoStack.length,
  library: localStorage.getItem('rubik-sota-project-library-v1')
}));

async function chooseWall(page, id = wallId) {
  await page.locator('polygon[data-wall="'+id+'"]').first().click();
  const panel = page.locator('#wallMove');
  await panel.locator('summary').click();
  return panel;
}

async function preview(panel, mm) {
  await panel.locator('#wallMoveMm').fill(String(mm));
  await panel.locator('#wallMoveMm').press('Enter');
}

for (const name of (process.env.WALL_MOVE_BROWSERS || 'chromium').split(',')) {
  test('M08 · ' + name + ' · BW5 real, fallo de guardado, aplicación y deshacer', {timeout:120000}, async () => {
    const local = await start();
    const browser = name==='chromium' ? local.browser : await engines[name].launch();
    let context;
    try {
      const session = await editor({...local,browser});
      const {page,watch} = session;
      context = session.context;
      await page.locator('#fileIn').setInputFiles({name:'edificio-m08.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(stairFixture()))});
      await page.waitForFunction(name => FloorPlanBuildingUI.context?.buildingName===name, fixtureName);
      await instrument(page);
      const panel = await chooseWall(page);
      const apply = panel.locator('#wallMoveApply');
      for (const [lang,re] of [['es',/No se ha aplicado el cambio.*peldaños/],['en',/The change was not applied.*steps/],['zh',/未应用更改.*台阶/]]) {
        await page.evaluate(lang => setLang(lang), lang);
        if (!await panel.evaluate(node=>node.open)) await panel.locator('summary').click();
        await preview(panel, 300);
        assert.equal(await apply.isEnabled(),true);
        await page.evaluate(()=>{wallMoveAudit.toasts.length=0;});
        const before = await snapshot(page);
        await apply.click();
        assert.deepEqual(await snapshot(page),before);
        assert.equal(await apply.isEnabled(),false);
        assert.equal(await panel.getByRole('alert').isVisible(),true);
        assert.equal(await page.evaluate(()=>document.activeElement.id),'wallMovePreview');
        const audit=await page.evaluate(()=>wallMoveAudit);
        assert.equal(audit.events,0);
        assert.equal(audit.toasts.length,1);
        assert.match(audit.toasts[0],re);
        if(lang!=='zh')assert.doesNotMatch(audit.toasts[0],/[\u3400-\u9fff]/u);
      }
      await page.evaluate(()=>setLang('es'));
      const project=Core.initial();
      project.id='prj_m08_test_save';
      await page.locator('#fileIn').setInputFiles({name:'planta-m08.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(project))});
      await page.waitForFunction(id=>FloorPlanApp.project.id===id,project.id);
      const simple=await chooseWall(page);
      await preview(simple,300);
      assert.match(await simple.locator('#wallMoveResult').innerText(),/a lo largo de su muro/);
      const before=await snapshot(page);
      await page.evaluate(()=>{
        const write=storage.setItem;
        window.restoreWrite=()=>{storage.setItem=write;};
        storage.setItem=(key,value)=>{
          if(key===STORE)throw new DOMException('QA storage quota','QuotaExceededError');
          return write.call(storage,key,value);
        };
        wallMoveAudit.toasts.length=0;
      });
      await simple.locator('#wallMoveApply').click();
      assert.deepEqual(await snapshot(page),before);
      assert.equal(await page.evaluate(()=>wallMoveAudit.events),0);
      assert.equal(await simple.getByRole('alert').isVisible(),true);
      await page.evaluate(()=>restoreWrite());
      await preview(simple,300);
      await simple.locator('#wallMoveApply').click();
      const after = await snapshot(page);
      assert.equal(await page.evaluate(()=>wallMoveAudit.events),1);
      assert.equal(after.history,before.history+1);
      assert.notEqual(after.library,before.library);
      assert.equal(JSON.parse(after.project).walls.find(w=>w.id===wallId).start.x,4400);
      await page.keyboard.press('Control+z');
      assert.equal((await snapshot(page)).project,before.project);
      await page.keyboard.press('Control+y');
      assert.equal((await snapshot(page)).project,after.project);
      await page.reload();
      await page.waitForFunction(id=>FloorPlanApp?.project?.id===id,project.id);
      assert.equal((await snapshot(page)).project,after.project);
      assert.deepEqual(watch.errors,[]);
    } finally {
      await context?.close();
      if(browser!==local.browser)await browser.close();
      await local.stop();
    }
  });
}

test('M08 · móvil · vista previa táctil de un encuentro protegido', {timeout:60000}, async () => {
  const local = await start();
  let context;
  try {
    const session = await editor(local,{viewport:{width:390,height:844},isMobile:true,hasTouch:true});
    const {page} = session;
    context = session.context;
    const before = await snapshot(page);
    const wall = page.locator('polygon[data-wall="wal_ref-w26"]').first();
    const box = await wall.boundingBox();
    await page.touchscreen.tap(box.x+box.width/2,box.y+box.height/2);
    if (!await page.locator('aside.right').evaluate(node=>node.classList.contains('open'))) await page.locator('#tgPanel').tap();
    const panel = page.locator('#wallMove');
    await panel.locator('summary').tap();
    await panel.locator('#wallMoveMm').fill('100');
    await panel.locator('#wallMovePreview').tap();
    assert.match(await panel.getByRole('alert').innerText(),/muro de carga/);
    assert.equal(await panel.locator('#wallMoveApply').isEnabled(),false);
    assert.deepEqual(await snapshot(page),before);
    assert.equal(await panel.evaluate(el=>el.scrollWidth<=el.clientWidth+1),true);
  } finally {
    await context?.close();
    await local.stop();
  }
});
