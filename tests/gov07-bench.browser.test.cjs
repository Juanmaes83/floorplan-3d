'use strict';
/* GOV-07 · el banco para dispositivos físicos (labs/gov07/) funciona de principio a fin: mide, simula la pérdida de
   contexto, devuelve un JSON completo y no hace peticiones externas. En CI mide SwiftShader, no un dispositivo. */
const test=require('node:test'),assert=require('node:assert/strict');
const K=require('./gov07/kit.cjs');
let env;test.before(async()=>{env=await K.start();});test.after(async()=>{await env?.stop();});
for(const vp of [{width:1440,height:900,dsf:1},{width:390,height:844,dsf:3,mobile:true}])
test(`banco GOV-07 completo ${vp.width}×${vp.height}`,{timeout:240000},async()=>{
  const context=await env.browser.newContext({viewport:{width:vp.width,height:vp.height},deviceScaleFactor:vp.dsf,isMobile:!!vp.mobile,hasTouch:!!vp.mobile});
  try{const page=await context.newPage();const w=K.watch(page,env.base);
    await page.goto(env.base+'labs/gov07/index.html');await page.getByRole('button',{name:/Ejecutar banco/}).click();
    await page.waitForFunction(()=>/Terminado|Error/.test(document.getElementById('status').textContent),null,{timeout:200000});
    const r=JSON.parse(await page.locator('#json').textContent());
    assert.equal(r.error,undefined,r.error);assert.equal(r.bench,'GOV-07');assert.equal(r.device.devicePixelRatio,vp.dsf);
    assert.ok(r.steps.load.ms>0);assert.ok(r.steps.orbit.frames>10&&r.steps.play.frames>10);
    assert.equal(r.steps.contextLoss.available,true);assert.equal(r.steps.contextLoss.messageWhileLost,'lost');assert.equal(r.steps.contextLoss.stateAfter,'ok');assert.ok(r.steps.contextLoss.drawnAfter>0);
    assert.equal(r.steps.memory.after.textures,r.steps.memory.before.textures);
    assert.equal(await page.locator('#out tr').count(),9);
    assert.ok(await page.evaluate(()=>document.scrollingElement.scrollWidth<=innerWidth+1),'sin scroll horizontal');
    assert.deepEqual(w.errors,[]);assert.deepEqual(w.external,[]);
    if(process.env.GOV07_BENCH_OUT)require('node:fs').writeFileSync(`${process.env.GOV07_BENCH_OUT}/bench-${vp.width}x${vp.height}.json`,JSON.stringify(r,null,1));
  }finally{await context.close();}
});
