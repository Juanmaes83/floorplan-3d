async page=>{
 const out='AUDIT_WORKSPACE/output/auditoria-324/villa-linde/aceptacion/';
 const report={};
 async function check(key,run){try{report[key]=await run();}catch(e){report[key]={error:e.message};await page.screenshot({path:out+'error-'+key+'.png'});}}
 await page.getByRole('button',{name:'Entregar',exact:true}).click();
 await check('P2',async()=>{
   const p2=page.locator('[data-entrega-code="P2"]');
   await p2.getByRole('button',{name:/Preparar \d+ vistas|Actualizar vistas/}).click({timeout:8000});
   await page.waitForFunction(()=>FloorPlanProjectViews.status()==='ready',null,{timeout:35000});
   const views=await page.evaluate(()=>FloorPlanProjectViews.current().map(v=>({label:v.label,bytes:v.dataUrl?.length})));
   await p2.screenshot({path:out+'P2-vistas-preparadas.png'});
   const reference=await page.evaluate(()=>FloorPlanProjectViews.current()[0]?.dataUrl);
   if(reference)await page.evaluate(async data=>{const a=document.createElement('a');a.href=data;a.download='villa-linde-referencia-3d.png';a.click();},reference);
   return views;
 });
 await check('P5',async()=>{
   await page.getByRole('button',{name:'Ver material board',exact:true}).first().click({timeout:8000});
   const dl=page.locator('#moodboardDownload');
   await dl.waitFor({timeout:15000});
   const [f]=await Promise.all([page.waitForEvent('download'),dl.click()]);
   await f.saveAs(out+'material-board.png');
   await page.keyboard.press('Escape');
   return f.suggestedFilename();
 });
 await check('P7',async()=>{
   const route=page.locator('[data-route="client-file"]:visible').first();
   if(!(await route.isVisible()))await page.locator('[data-entrega-code="P7"] .perla-card-selector').click();
   const btn=await route.isVisible()?route:page.getByRole('button',{name:'Descargar archivo',exact:true});
   const [f]=await Promise.all([page.waitForEvent('download',{timeout:15000}),btn.click({timeout:8000})]);
   await f.saveAs(out+'archivo-cliente.html');
   return f.suggestedFilename();
 });
 return report;
}
