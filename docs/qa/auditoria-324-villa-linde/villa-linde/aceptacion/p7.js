async page=>{
 const out='AUDIT_WORKSPACE/output/auditoria-324/villa-linde/aceptacion/';
 if(await page.getByRole('dialog',{name:'Escena para Blender'}).isVisible())await page.keyboard.press('Escape');
 await page.getByRole('button',{name:'Entregar',exact:true}).click();
 await page.locator('[data-entrega-code="P7"] .perla-card-selector').click();
 const b=page.locator('.perla-panel-open').getByRole('button',{name:'Descargar archivo para el cliente',exact:true});
 const [f]=await Promise.all([page.waitForEvent('download',{timeout:30000}),b.click({timeout:8000})]);
 await f.saveAs(out+'archivo-cliente.html');
 return {download:f.suggestedFilename()};
}
