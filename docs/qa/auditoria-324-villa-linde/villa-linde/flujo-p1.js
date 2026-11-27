async page=>{
 const out='AUDIT_WORKSPACE/output/auditoria-324/villa-linde/';
 await page.keyboard.press('Escape');
 await page.getByRole('button',{name:'Diseñar',exact:true}).click();
 await page.locator('#presentationBtn').click();
 await page.getByRole('button',{name:'Iniciar presentación'}).click();
 await page.waitForFunction(()=>FloorPlanPresentation.active&&document.querySelector('#presentationOverlay').dataset.moving==='false',null,{timeout:35000});
 const plan=await page.evaluate(()=>FloorPlanPresentation.plan.stops.map(s=>({level:s.levelId,label:s.label,kind:s.kind})));
 await page.waitForFunction(()=>!document.querySelector('#presentationBatch').disabled,null,{timeout:30000});
 const [file]=await Promise.all([page.waitForEvent('download',{timeout:90000}),page.locator('#presentationBatch').click()]);
 await file.saveAs(out+'presentacion-edificio.zip');
 await page.screenshot({path:out+'P1-presentacion-zip.png'});
 return {plan,zip:file.suggestedFilename(),status:await page.locator('#presentationBatchStatus').innerText()};
}
