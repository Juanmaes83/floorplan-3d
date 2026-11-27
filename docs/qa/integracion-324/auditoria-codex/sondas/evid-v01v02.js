async page => {
 const fs=require('fs');const O='AUDIT_WORKSPACE/output/evid/';const r={};
 await page.waitForFunction(()=>document.documentElement.dataset.editorReady==='true');
 await page.locator('#uploadIn').setInputFiles('AUDIT_WORKSPACE/output/auditoria-324/edificio-nombre-neutro.json');
 await page.waitForFunction(()=>window.FloorPlanApp.levelContext?.levels===2);
 await page.getByRole('button',{name:'Presupuestar',exact:true}).click();await page.getByRole('button',{name:'Abrir presupuesto',exact:true}).click();
 const d=page.locator('#budgetDialog');for(const id of await d.locator('tr[data-item]').evaluateAll(x=>x.map(y=>y.dataset.item))){const f=d.locator(`tr[data-item="${id}"] [data-field="price"]`);await f.fill('100');await f.press('Tab');}
 await d.locator('#budgetVat').selectOption('21');await d.screenshot({path:O+'V01-presupuestar-alcance.png'});
 for(const [b,n] of [['#budgetCsv','V01-presupuesto.csv'],['#budgetJson','V01-presupuesto.json']]){const [dl]=await Promise.all([page.waitForEvent('download'),d.locator(b).click()]);await dl.saveAs(O+n);r[n]=dl.suggestedFilename();}
 await d.locator('#budgetClose').click();
 await page.getByRole('button',{name:'Entregar',exact:true}).click();await page.getByRole('button',{name:'Preparar dossier económico',exact:true}).click();
 const e=page.locator('#economicDossierDialog');await e.locator('#econVariantClient').click();
 await page.evaluate(()=>{const o=window.open;window.open=(...a)=>{const w=o.apply(window,a);if(w)w.print=()=>{};return w;};});
 const [out]=await Promise.all([page.context().waitForEvent('page'),e.locator('#econPrint').click()]);await out.locator('.econ-paper').waitFor();
 fs.writeFileSync(O+'V01-D4-cliente-impresion.html',await out.content());await out.pdf({path:O+'V01-D4-cliente.pdf',format:'A4',printBackground:true});await out.locator('.econ-paper').screenshot({path:O+'V01-D4-cliente.png'});await out.close();
 await page.keyboard.press('Escape');await e.evaluate(x=>x.open&&x.close());
 // V02 con el edificio de dos plantas (título no neutro) también: D3 y P7
 await page.evaluate(()=>window.FloorPlanDossier.open('technical'));const cov=page.locator('.dossier-cover');await cov.waitFor();await cov.screenshot({path:O+'V02-D3-portada.png'});
 await page.evaluate(()=>{const o=window.open;window.open=(...a)=>{const w=o.apply(window,a);if(w)w.print=()=>{};return w;};});
 const [dp]=await Promise.all([page.context().waitForEvent('page'),page.locator('#dossierPrint').click()]);await dp.waitForLoadState();await dp.waitForTimeout(800);await dp.pdf({path:O+'V02-D3-dossier.pdf',format:'A4',printBackground:true});await dp.close();
 fs.writeFileSync(O+'V02-P7-archivo-cliente.html',await page.evaluate(async()=>(await window.FloorPlanClientShare.build()).html));
 await page.keyboard.press('Escape');
 await page.getByRole('button',{name:'Analizar',exact:true}).click();await page.waitForTimeout(1200);await page.locator('#professionalWorkspace').screenshot({path:O+'V02-analizar.png'});
 return r;
}
