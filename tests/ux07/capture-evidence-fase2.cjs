'use strict';
/* ENT-04 fase 2 · capturas de evidencia: presupuestos de las dos revisiones comparados (completa, parcial, no válida) en el
   laboratorio y en el dossier descargado, escritorio 1440×900 y móvil 390×844. Fixtures sintéticas y precios FICTICIOS. */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');const K=require('./kit.cjs');
const OUT=path.join(K.ROOT,'docs/qa/ux07-ent04-fase2-presupuestos-2026-11-12/evidencias');
(async()=>{fs.mkdirSync(OUT,{recursive:true});const env=await K.start();const files=[];
  const shot=async(page,name,opt={},meta={})=>{const f=path.join(OUT,name+'.png');await page.screenshot({path:f,...opt});files.push({file:name+'.png',sha256:crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex'),...meta});};
  const prepare=async(page,after,before)=>{await page.selectOption('#budgetSel',after);await page.selectOption('#budgetBeforeSel',before);
    await page.getByRole('button',{name:'Preparar dossier'}).click();await page.waitForSelector('#dosOut:not([hidden])');};
  try{for(const [tag,o] of [['escritorio-1440x900',{}],['movil-390x844',{viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2}]]){
    const {context,page}=await K.openLab(env,o);
    await page.getByRole('button',{name:'Comparar'}).click();await page.waitForSelector('#dosCard:not([hidden])');
    for(const [n,after,before,what] of [['1','test-complete','test-complete','completa'],['2','test-partial','test-complete','parcial'],['3','test-complete','test-after','no-valida']]){
      await prepare(page,after,before);await page.evaluate(()=>document.getElementById('bcOut').scrollIntoView({block:'start'}));
      const status=await page.evaluate(()=>document.getElementById('bcOut').dataset.status);await shot(page,`${n}-laboratorio-${what}-${tag}`,{},{status});}
    // Dossier descargado (completo), abierto solo, recortado a la sección nueva.
    await prepare(page,'test-complete','test-complete');await page.getByRole('button',{name:'Verificar ahora'}).click();
    await page.waitForFunction(()=>/Dossier verificado/.test(document.getElementById('verifyOut').textContent));
    await page.evaluate(()=>document.getElementById('verifyOut').scrollIntoView({block:'center'}));await shot(page,`4-verificado-${tag}`,{},{version:await page.evaluate(()=>window.__ux07.dossier.manifest.version)});
    const html=await page.evaluate(()=>window.__ux07.dossier.html);const p2=await context.newPage();await p2.setContent(html);
    await p2.locator('section.budget-compare').scrollIntoViewIfNeeded();await shot(p2,`5-dossier-descargado-seccion-presupuestos-${tag}`,{},{});await p2.close();
    // 6 · auditoría #212: cambiar el origen retira la comparación y el dossier anteriores (nada se atribuye al origen nuevo).
    await page.check('input[name=src][value=files]');await page.evaluate(()=>document.getElementById('srcTitle').scrollIntoView({block:'start'}));
    await shot(page,`6-origen-cambiado-resultados-retirados-${tag}`,{},{comparacionVisible:await page.evaluate(()=>!document.getElementById('cmpCard').hidden)});
    await context.close();}}finally{await env.stop();}
  fs.writeFileSync(path.join(OUT,'manifest.json'),JSON.stringify({generated:new Date().toISOString(),data:'fixtures sintéticas (vivienda de referencia) y precios FICTICIOS de laboratorio',navegador:'Chromium de Playwright; no es un dispositivo físico',files},null,1));
  console.log(files.map(f=>f.file+' '+f.sha256.slice(0,8)+' '+(f.status||'')).join('\n'));
})().catch(e=>{console.error(e);process.exit(1);});
