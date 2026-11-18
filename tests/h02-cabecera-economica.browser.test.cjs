'use strict';
/* H02 · la cabecera del dossier económico muestra el nombre y el responsable del perfil de marca elegido
   (snapshot {profile,title,intro,takenAt}); sin marca no inventa ninguna línea. Datos sintéticos; sin red. */
const test=require('node:test'),assert=require('node:assert/strict');const {K,project}=require('./h0x-kit.cjs');
let env;test.before(async()=>{env=await K.start();});test.after(async()=>{await env?.stop();});
for(const brand of [true,false])test(`H02 · marca ${brand?'elegida':'ausente'}`,async()=>{const {ctx,page}=await project(env,{budget:true,brand});try{
  await page.evaluate(()=>FloorPlanEconomicDossierUI.open());await page.waitForFunction(()=>!!document.querySelector('.econ-head'),null,{timeout:15000});const t=await page.evaluate(()=>document.querySelector('.econ-brand')?.textContent||null);
  const snap=await page.evaluate(()=>FloorPlanBrandUI.snapshot());if(brand)assert.equal(t,'Estudio de prueba (datos sintéticos) · Profesional de prueba',JSON.stringify(snap));else assert.equal(t,null);}finally{await ctx.close();}});
