async page=>{
 const out='AUDIT_WORKSPACE/output/auditoria-324/villa-linde/aceptacion/';
 await page.waitForFunction(()=>document.documentElement.dataset.editorReady==='true');
 await page.locator('#uploadIn').setInputFiles(out+'villa-linde-aprobada.json');
 await page.waitForFunction(()=>FloorPlanApp.levelContext?.buildingId==='bld_linde-aprobada');
 await page.getByRole('button',{name:'Entregar',exact:true}).click();
 await page.getByRole('button',{name:/Ver detalles · P7/}).click();
 const b=page.locator('.perla-panel-open').getByRole('button',{name:'Descargar archivo para el cliente',exact:true});
 const [f]=await Promise.all([page.waitForEvent('download',{timeout:30000}),b.click({timeout:8000})]);
 await f.saveAs(out+'archivo-cliente.html');
 return {download:f.suggestedFilename()};
}
