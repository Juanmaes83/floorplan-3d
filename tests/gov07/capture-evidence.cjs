'use strict';
/* GOV-07 · capturas de evidencia de los estados de la vista 3D de la Evolución, en escritorio 1440×900, móvil vertical
   390×844 y móvil horizontal 844×390: 0 normal · 1 contexto perdido (aviso) · 2 recuperado · 3 sin respuesta (recargar)
   · 4 degradado · 5 sin WebGL; y el banco para dispositivos con su resultado. Fixture sintética A. */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');const K=require('./kit.cjs');
const OUT=path.join(K.ROOT,'docs/qa/gov07-webgl-dispositivos-2026-11-12/evidencias');
(async()=>{fs.mkdirSync(OUT,{recursive:true});const env=await K.start();const manifest=[];
  const shot=async(page,name,extra={})=>{const file=path.join(OUT,name+'.png');await page.screenshot({path:file});manifest.push({file:name+'.png',sha256:crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'),...extra});};
  const VIEWS=[['escritorio-1440x900',{}],['movil-390x844',{viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true}],
    ['movil-horizontal-844x390',{viewport:{width:844,height:390},deviceScaleFactor:2,isMobile:true,hasTouch:true}]];
  try{
    for(const [tag,opt] of VIEWS){
      // Un momento del plan con obra visible, la cámara quieta (capturas comparables).
      let {context,page,watch}=await K.openEvolution(env,{...opt,query:'glRestoreMs=1500'});
      await page.evaluate(()=>{const f=window.__ft3dFidelity;f.scene.setAuto(false);f.setPos(Math.floor(f.timeline.positions*.6));});await K.frames(page,8);
      await shot(page,`0-normal-${tag}`);
      await K.loseContext(page);await page.waitForFunction(()=>window.__ft3dGlGuard.state==='lost');await shot(page,`1-perdida-aviso-${tag}`);
      await K.restoreContext(page);await page.waitForFunction(()=>window.__ft3dGlGuard.state==='ok');await K.frames(page,8);await shot(page,`2-recuperado-${tag}`);
      await K.loseContext(page);await page.waitForFunction(()=>window.__ft3dGlGuard.state==='failed',null,{timeout:10000});await shot(page,`3-sin-respuesta-recargar-${tag}`);
      await K.restoreContext(page);await page.waitForFunction(()=>window.__ft3dGlGuard.degraded);await K.frames(page,8);
      await shot(page,`4-degradado-${tag}`,{errors:watch.errors.length,external:watch.external.length});await context.close();
      const {chromium}=require('playwright');const b=await chromium.launch({...(process.env.CHROME?{executablePath:process.env.CHROME}:{}),args:['--no-sandbox','--disable-webgl','--disable-3d-apis']});
      const ctx=await b.newContext({viewport:opt.viewport||{width:1440,height:900},deviceScaleFactor:opt.deviceScaleFactor||1,isMobile:!!opt.isMobile,hasTouch:!!opt.hasTouch});const p=await ctx.newPage();
      await p.goto(env.base+'evolucion/index.html?lab=1&case=A');await p.waitForFunction(()=>document.body.classList.contains('ready'),null,{timeout:60000});await K.showEvolution(p);
      await shot(p,`5-sin-webgl-${tag}`);await b.close();
    }
    for(const [tag,opt] of [VIEWS[0],VIEWS[1]]){
      const context=await env.browser.newContext({viewport:opt.viewport||{width:1440,height:900},deviceScaleFactor:opt.deviceScaleFactor||1,isMobile:!!opt.isMobile,hasTouch:!!opt.hasTouch});const page=await context.newPage();
      await page.goto(env.base+'labs/gov07/index.html');await page.getByRole('button',{name:/Ejecutar banco/}).click();
      await page.waitForFunction(()=>/Terminado|Error/.test(document.getElementById('status').textContent),null,{timeout:200000});
      await page.locator('h2').scrollIntoViewIfNeeded();await shot(page,`6-banco-resultado-${tag}`);await context.close();
    }
  }finally{await env.stop();}
  fs.writeFileSync(path.join(OUT,'manifest.json'),JSON.stringify({generated:new Date().toISOString(),engine:'Chromium + SwiftShader (CPU, sin GPU real)',data:'fixture sintética A de laboratorio',files:manifest},null,1));
  console.log(manifest.map(m=>m.file+' '+m.sha256.slice(0,8)).join('\n'));
})().catch(e=>{console.error(e);process.exit(1);});
