async page => {


 await page.setViewportSize({width:1440,height:900});
 await page.goto('http://127.0.0.1:18765/#editor');
 await page.reload();
 await page.getByRole('button',{name:'Diseñar',exact:true}).click();
 const id = () => page.evaluate(() => window.FloorPlanApp.entryId);
 const active = page.getByRole('button',{name:/^Proyecto activo/});
 const menu = () => page.getByLabel('Acciones del proyecto',{exact:true}).click();
 const original = await id();
 const download = async path => {
  await menu();
  const [file] = await Promise.all([page.waitForEvent('download'),page.getByRole('menuitem',{name:/^Descargar proyecto JSON/}).click()]);
  await file.saveAs(path); return file;
 };
 const path='AUDIT_WORKSPACE/output/auditoria-324/json-original.json'; const first = await download(path);
 await menu();
 const [chooser] = await Promise.all([page.waitForEvent('filechooser'),page.getByRole('menuitem',{name:/^Subir plano o proyecto/}).click()]);
 await chooser.setFiles(path);
 await page.waitForFunction(prior => window.FloorPlanApp.entryId !== prior,original);
 const imported = await id();
 const afterImportLabel=await active.getAttribute('aria-label');
 await download('AUDIT_WORKSPACE/output/auditoria-324/json-reimportado.json');
 await page.reload();
 const reloaded=await id();
 return {downloadName:first.suggestedFilename(),distinctProject:original!==imported,afterImportLabel,identityAfterReload:imported===reloaded};
}

