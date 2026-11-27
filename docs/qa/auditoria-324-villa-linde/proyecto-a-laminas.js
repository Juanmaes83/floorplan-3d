async page => {
 await page.getByRole('button',{name:'Escena 3D',exact:true}).click();
 await page.waitForFunction(()=>FloorPlanApp.viewMode==='3d');
 await page.getByRole('button',{name:'Entregar',exact:true}).click();
 const artifacts=[];
 for(const mod of ['blueprint','despiece']){
  await page.locator('#bpdpOpen-'+mod).click();
  await page.waitForFunction(()=>Boolean(window.BPDP?.studio));
  const d=page.locator('dialog.bpdp-host[open]');
  await d.getByRole('button',{name:'Lámina',exact:true}).click();
  const dl=d.getByRole('button',{name:'Descargar PNG',exact:true});
  await dl.waitFor({timeout:35000});
  const [out]=await Promise.all([page.waitForEvent('download'),dl.click()]);
  await out.saveAs('AUDIT_WORKSPACE/output/auditoria-324/proyecto-a-'+mod+'-lamina.png');
  artifacts.push(out.suggestedFilename());
  await d.locator('.sheet [data-a="close"]').click();
  await page.keyboard.press('Escape');await page.waitForFunction(()=>!window.BpdpEntregar.abierta);
 }
 return {artifacts};
}
