async page => {
 await page.reload();await page.waitForFunction(()=>document.documentElement.dataset.editorReady==='true');
 const id=await page.evaluate(()=>FloorPlanApp.entryId);
 await page.getByRole('button',{name:'Analizar',exact:true}).click();
 const analyze=(await page.locator('#professionalWorkspace').innerText()).split('\n').filter(x=>/32\b|calibra/i.test(x)).slice(0,5);
 await page.getByRole('button',{name:'Presupuestar',exact:true}).click();await page.getByRole('button',{name:'Abrir presupuesto',exact:true}).click();
 const line=page.locator('tr[data-item="floor:mat_tile600"]');
 const price=line.locator('[data-field="price"]'); await price.fill('25');await price.press('Tab');
 const lineText=await line.innerText();
 const partial=await page.locator('#budgetTotals').innerText();await page.locator('#budgetClose').click();
 await page.getByRole('button',{name:'Entregar',exact:true}).click();
 await page.getByRole('button',{name:'Preparar dossier',exact:true}).click();
 await page.locator('#dossierStyle').selectOption('client'); await page.locator('#dossierDialog [data-dc-step="review"]').click();
 const dossier=(await page.locator('#dossierDocument').innerText()).split('\n').filter(x=>/32|Patio claro/i.test(x)).slice(0,6);
 await page.screenshot({path:'AUDIT_WORKSPACE/output/auditoria-324/proyecto-a-dossier.png'});
 await page.keyboard.press('Escape');await page.getByRole('button',{name:'Preparar dossier económico',exact:true}).click();
 await page.locator('#econVariantClient').click();const d4=(await page.locator('#economicDossierPaper').innerText()).split('\n').filter(x=>/Patio claro|Total|parcial|definitiv/i.test(x)).slice(0,9);
 await page.keyboard.press('Escape');await page.getByRole('button',{name:'Diseñar',exact:true}).click();
 await page.getByText('Exportar diseño',{exact:true}).click();
 const [dxf]=await Promise.all([page.waitForEvent('download'),page.locator('#exportDxf').click()]);
 await dxf.saveAs('AUDIT_WORKSPACE/output/auditoria-324/proyecto-a-patio-claro.dxf');
 return {analyze,lineText,partial,dossier,d4,dxf:dxf.suggestedFilename(),identity:id===await page.evaluate(()=>FloorPlanApp.entryId)};
}
