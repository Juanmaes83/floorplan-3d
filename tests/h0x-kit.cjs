const K=require('./ux07/kit.cjs');
async function project(env,{budget,brand}){const ctx=await env.browser.newContext({viewport:{width:1440,height:900}});const page=await ctx.newPage();
  await page.route('https://cdn.jsdelivr.net/**',r=>r.abort());await page.goto(env.base);await page.locator('#welcomeExample').click();await page.waitForFunction(()=>window.FloorPlanDossier&&window.FloorPlanBrand&&window.FloorPlanBudgetUI);
  if(brand){await page.evaluate(()=>{const p=FloorPlanBrand.saveProfile(localStorage,{name:'Estudio de prueba (datos sintéticos)',person:'Profesional de prueba',email:'estudio@example.invalid'});FloorPlanBrand.setDelivery(localStorage,FloorPlanApp.entryId,{profileId:p.id,title:'Vivienda de prueba'});});
    await page.reload();await page.waitForFunction(()=>window.FloorPlanDossier&&window.FloorPlanBudgetUI);}
  if(budget){await page.evaluate(()=>FloorPlanBudgetUI.open());await page.waitForTimeout(1200);await page.evaluate(()=>document.querySelector('dialog[open]')?.close());}
  return {ctx,page};}
module.exports={K,project};
