// v1.3 · §1.4 · H01 (inventario del dossier sin «economic») con y sin presupuesto, y H02 (cabecera económica lee
// brand.name) con y sin marca, sobre el producto real en solo lectura (worktree aparte, proyecto de ejemplo, identidad
// sintética .invalid, sin red). No modifica archivos del producto. Uso: node diagnostico/h01-h02.cjs <worktreeMaster>
'use strict';
const {chromium}=require('playwright'),fs=require('fs'),path=require('path'),{execFileSync}=require('child_process'),serve=require('../tools/serve.cjs');
const M=path.resolve(process.argv[2]);const head=execFileSync('git',['-C',M,'rev-parse','HEAD']).toString().trim(),st0=execFileSync('git',['-C',M,'status','--porcelain']).toString();
(async()=>{const srv=await serve(M),browser=await chromium.launch({args:['--no-sandbox','--enable-unsafe-swiftshader']});const res=[];const ext=[];
 for(const budget of [true,false])for(const brand of [true,false]){
  const ctx=await browser.newContext({viewport:{width:1440,height:900},locale:'es-ES'});ctx.on('request',r=>{const u=r.url();if(!u.startsWith(srv.url)&&!/^(data|blob|about):/.test(u))ext.push(u);});
  const page=await ctx.newPage();page.setDefaultTimeout(60000);await page.goto(srv.url);await page.locator('#welcomeExample').click();await page.waitForFunction(()=>window.FloorPlanDossier&&window.FloorPlanBrand&&window.FloorPlanApp?.entryId);
  if(brand){await page.evaluate(()=>{const p=FloorPlanBrand.saveProfile(localStorage,{name:'Estudio Ejemplo (datos de prueba)',email:'estudio@example.invalid'});FloorPlanBrand.setDelivery(localStorage,FloorPlanApp.entryId,{profileId:p.id,title:'Vivienda de ejemplo'});});await page.reload();await page.waitForFunction(()=>window.FloorPlanDossier&&window.FloorPlanBudgetUI);}
  if(budget){await page.evaluate(()=>FloorPlanBudgetUI.open());await page.waitForTimeout(1500);await page.evaluate(()=>document.querySelector('dialog[open]')?.close());}
  const h01=await page.evaluate(()=>{const c=FloorPlanDossier.contents();const paper=document.createElement('article');FloorPlanDossier.compose(paper,'technical');
   return {inventoryHasEconomic:'economic' in c.sections,economicReady:!!window.FloorPlanEconomicDossierUI?.current(),renderedEconomicPage:!!paper.querySelector('.dossier-economic')};});
  let h02=null;try{await page.evaluate(()=>FloorPlanEconomicDossierUI.open());await page.waitForTimeout(800);
   h02=await page.evaluate(()=>{const s=FloorPlanBrandUI.snapshot();const h=document.querySelector('.econ-brand');return {snapshotKeys:s?Object.keys(s):null,profileName:s?.profile?.name||null,econBrandLineShown:!!h};});}catch(e){h02={error:e.message.slice(0,120)};}
  res.push({presupuesto:budget,marca:brand,H01:{...h01,discrepancia:h01.renderedEconomicPage&&!h01.inventoryHasEconomic},H02:{...h02,reproducido:brand?!!h02?.profileName&&!h02?.econBrandLineShown:null}});await ctx.close();}
 await browser.close();srv.close?.();
 const out={schema:'rubik-lab-h01-h02/1',master:head,casos:res,externas:ext.length,productoSinCambios:execFileSync('git',['-C',M,'status','--porcelain']).toString()===st0};
 fs.mkdirSync(path.join(__dirname,'../evidence/e2'),{recursive:true});fs.writeFileSync(path.join(__dirname,'../evidence/e2/h01-h02.json'),JSON.stringify(out,null,1));console.log(JSON.stringify(out,null,1));process.exit(0);
})().catch(e=>{console.error(e);process.exit(1);});
