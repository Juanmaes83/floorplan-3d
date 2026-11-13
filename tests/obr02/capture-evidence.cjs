'use strict';
/* OBR-02 + OBR-03 · capturas de evidencia del panel «Plan a la fecha» y del fantasma (escritorio y móvil). */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');const K=require('./kit.cjs');
const OUT=path.join(K.ROOT,'docs/qa/obr02-obr03-plan-4d-2026-11-12/evidencias');
(async()=>{fs.mkdirSync(OUT,{recursive:true});const env=await K.start();const files=[];
  const shot=async(page,name)=>{const f=path.join(OUT,name+'.png');await page.screenshot({path:f});files.push({file:name+'.png',sha256:crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex')});};
  const at=(page,i,end=false)=>page.evaluate(([i,end])=>{const f=window.__ft3dFidelity;f.scene.setAuto(false);f.setDate(end?f.ctx.schedule.tasks[i].endDate:f.ctx.schedule.tasks[i].startDate);},[i,end]);
  try{for(const [tag,o] of [['escritorio-1440x900',{}],['movil-390x844',{viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2}]]){
    let {context,page}=await K.openEvolution(env,o);
    
    await at(page,2);await K.frames(page,4);await page.evaluate(()=>{document.querySelector('.plan-preview .pp-next-d').open=true;});await shot(page,`1-A-siguiente-cubierta-en-fantasma-${tag}`);
    await at(page,4,true);await K.frames(page,4);await page.evaluate(()=>{document.querySelector('.plan-preview .pp-next-d').open=true;});await shot(page,`2-A-avanzado-coste-planificado-${tag}`);
    await context.close();
    ({context,page}=await K.openEvolution(env,{...o,caseId:'B'}));
    await at(page,1);await K.frames(page,4);await page.evaluate(()=>{document.querySelector('.plan-preview .pp-next-d').open=true;});await shot(page,`3-B-coste-no-disponible-${tag}`);await context.close();
  }}finally{await env.stop();}
  fs.writeFileSync(path.join(OUT,'manifest.json'),JSON.stringify({generated:new Date().toISOString(),engine:'Chromium + SwiftShader',data:'fixtures sintéticas FT3D-8 (?lab=1), precios de tarifa FIXTURE',files},null,1));
  console.log(files.map(f=>f.file+' '+f.sha256.slice(0,8)).join('\n'));
})().catch(e=>{console.error(e);process.exit(1);});
