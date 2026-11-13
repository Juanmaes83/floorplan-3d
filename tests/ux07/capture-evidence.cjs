'use strict';
/* UX-07 + ENT-04 · capturas de evidencia del laboratorio (escritorio 1440×900 y móvil 390×844). */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');const K=require('./kit.cjs');
const OUT=path.join(K.ROOT,'docs/qa/ux07-ent04-antes-despues-2026-11-12/evidencias');
(async()=>{fs.mkdirSync(OUT,{recursive:true});const env=await K.start();const files=[];
  const shot=async(page,name,opt={})=>{const f=path.join(OUT,name+'.png');await page.screenshot({path:f,...opt});files.push({file:name+'.png',sha256:crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex')});};
  try{for(const [tag,o] of [['escritorio-1440x900',{}],['movil-390x844',{viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2}]]){
    const {context,page}=await K.openLab(env,o);
    await page.getByRole('button',{name:'Comparar'}).click();await page.waitForSelector('#cmpCard:not([hidden])');await page.locator('#slider').fill('45');
    await page.locator('#cmpCard').scrollIntoViewIfNeeded();await page.evaluate(()=>document.getElementById('cmpTitle').scrollIntoView());await shot(page,`1-cortina-${tag}`);
    await page.evaluate(()=>document.getElementById('chgTitle').scrollIntoView());await shot(page,`2-cambios-materiales-${tag}`);
    await page.getByRole('button',{name:'Lado a lado'}).click();await page.evaluate(()=>document.getElementById('cmpTitle').scrollIntoView());await shot(page,`3-lado-a-lado-${tag}`);
    await page.selectOption('#budgetSel','test-partial');await page.getByRole('button',{name:'Preparar dossier'}).click();await page.waitForSelector('#dosOut:not([hidden])');
    await page.getByRole('button',{name:'Verificar ahora'}).click();await page.waitForFunction(()=>/verificado/.test(document.getElementById('verifyOut').textContent));
    await page.evaluate(()=>document.getElementById('dosTitle').scrollIntoView());await shot(page,`4-dossier-parcial-verificado-${tag}`);
    // El dossier tal y como se descarga, abierto solo.
    const html=await page.evaluate(()=>window.__ux07.dossier.html);const p2=await context.newPage();await p2.setContent(html);await shot(p2,`5-dossier-descargado-${tag}`,{fullPage:true});
    await context.close();}}finally{await env.stop();}
  fs.writeFileSync(path.join(OUT,'manifest.json'),JSON.stringify({generated:new Date().toISOString(),data:'fixtures sintéticas (vivienda de referencia) y precios FICTICIOS de laboratorio',files},null,1));
  console.log(files.map(f=>f.file+' '+f.sha256.slice(0,8)).join('\n'));
})().catch(e=>{console.error(e);process.exit(1);});
