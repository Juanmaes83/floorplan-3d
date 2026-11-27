async page=>{
 const out='AUDIT_WORKSPACE/output/auditoria-324/villa-linde/';
 if (await page.locator('#economicDossierDialog[open]').isVisible()) await page.keyboard.press('Escape');
 await page.getByRole('button',{name:'Preparar dossier',exact:true}).click();
 await page.locator('#dossierStyle').selectOption('client');
 await page.locator('#dossierDialog [data-dc-step="review"]').click();
 const dossier=(await page.locator('#dossierDocument').innerText()).split('\n').filter(l=>/villa|1.?073|592|planta|estancia/i.test(l)).slice(0,22);
 await page.screenshot({path:out+'D3-cliente.png'});
 await page.keyboard.press('Escape');
 await page.getByRole('button',{name:'Diseñar',exact:true}).click();
 await page.getByText('Exportar diseño',{exact:true}).click();
 const [dxf]=await Promise.all([page.waitForEvent('download'),page.locator('#exportDxf').click()]);
 await dxf.saveAs(out+'villa-linde-baja.dxf');
 return {dossier,dxf:dxf.suggestedFilename()};
}
