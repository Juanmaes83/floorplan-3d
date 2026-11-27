async page=>{
 const out='AUDIT_WORKSPACE/output/auditoria-324/villa-linde/aceptacion/';
 await page.setViewportSize({width:1440,height:900});
 await page.waitForFunction(()=>document.documentElement.dataset.editorReady==='true');
 await page.locator('#uploadIn').setInputFiles(out+'villa-linde-aprobada.json');
 await page.waitForFunction(()=>FloorPlanApp.levelContext?.buildingId==='bld_linde-aprobada');
 await page.getByRole('button',{name:'Entregar',exact:true}).click();
 const p3=page.locator('[data-entrega-code="P3"]');
 const p3Status=await p3.innerText();
 await p3.screenshot({path:out+'P3-limite-edificio.png'});
 await page.getByRole('button',{name:'Preparar dossier',exact:true}).click();
 await page.locator('#dossierStyle').selectOption('client');
 await page.locator('#dossierDialog [data-dc-step="review"]').click();
 const doc=page.locator('#dossierDocument');
 const dossier=(await doc.innerText()).split('\n').filter(l=>/villa|²|planta|estancia/i.test(l)).slice(0,14);
 await page.screenshot({path:out+'D3-cliente.png'});
 await page.evaluate(()=>{const open=window.open;window.open=(...args)=>{const w=open.apply(window,args);if(w)w.print=()=>{w.printReadyForAudit=true};return w;};});
 const [print]=await Promise.all([page.context().waitForEvent('page'),page.locator('#dossierPrint').click()]);
 await print.waitForFunction(()=>window.printReadyForAudit===true,null,{timeout:15000});
 const paper=await print.locator('body').innerText();
 await print.pdf({path:out+'villa-linde-dossier-D3.pdf',preferCSSPageSize:true,printBackground:true});
 await print.close();
 await page.keyboard.press('Escape');
 await page.getByRole('button',{name:'Diseñar',exact:true}).click();
 const dxf=[];
 for(const [name,file] of [['Planta baja','baja'],['Planta primera','primera']]){
  await page.getByRole('group',{name:'Planta activa'}).getByRole('button',{name,exact:true}).click();
  await page.getByText('Exportar diseño',{exact:true}).click();
  const [download]=await Promise.all([page.waitForEvent('download'),page.locator('#exportDxf').click()]);
  await download.saveAs(out+'villa-linde-'+file+'.dxf');
  dxf.push(download.suggestedFilename());
  if(await page.locator('#exportDxf').isVisible())await page.keyboard.press('Escape');
 }
 return {p3Status,dossier,printedScope:paper.split('\n').filter(s=>/planta única|planta baja|planta primera/i.test(s)).slice(0,15),dxf};
}
