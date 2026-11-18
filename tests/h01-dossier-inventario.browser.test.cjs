'use strict';
/* H01 · el inventario del dossier (contents().sections) declara la página económica exactamente cuando el renderizador
   la compone: con y sin presupuesto, con y sin marca. Datos sintéticos; sin red. */
const test=require('node:test'),assert=require('node:assert/strict');const {K,project}=require('./h0x-kit.cjs');
let env;test.before(async()=>{env=await K.start();});test.after(async()=>{await env?.stop();});
for(const budget of [true,false])for(const brand of [true,false])test(`H01 · presupuesto ${budget?'sí':'no'}, marca ${brand?'sí':'no'}`,async()=>{
  const {ctx,page}=await project(env,{budget,brand});try{const r=await page.evaluate(()=>{const c=FloorPlanDossier.contents();const paper=document.createElement('article');FloorPlanDossier.compose(paper,'technical');
    return {inv:!!c.sections.economic,rendered:!!paper.querySelector('.dossier-economic')};});
   assert.equal(r.inv,r.rendered,'inventario = página compuesta');assert.equal(r.rendered,budget);}finally{await ctx.close();}});
