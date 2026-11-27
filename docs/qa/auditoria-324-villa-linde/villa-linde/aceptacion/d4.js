async page => {
 await page.waitForFunction(()=>document.documentElement.dataset.editorReady==='true');
 await page.setViewportSize({width:1440,height:900});
 await page.locator('#uploadIn').setInputFiles('AUDIT_WORKSPACE/output/auditoria-324/villa-linde/aceptacion/villa-linde-control-alcance.json');
 await page.waitForFunction(()=>FloorPlanApp.levelContext?.buildingId==='bld_linde-alcance');
 await page.getByRole('button',{name:'Presupuestar',exact:true}).click();
 await page.getByRole('button',{name:'Abrir presupuesto',exact:true}).click();
 const budget=page.locator('#budgetDialog');
 for(const row of await budget.locator('tr[data-item]').evaluateAll(rows=>rows.map(r=>r.dataset.item))){
  const field=budget.locator('tr[data-item="'+row+'"] [data-field="price"]'); await field.fill('100');await field.press('Tab');
 }
 await budget.locator('#budgetVat').selectOption('21');
 const budgetTotals=await budget.locator('#budgetTotals').innerText();
 await budget.locator('#budgetClose').click();
 await page.getByRole('button',{name:'Entregar',exact:true}).click();
 await page.getByRole('button',{name:'Preparar dossier económico',exact:true}).click();
 const d=page.locator('#economicDossierDialog');
 await d.locator('#econVariantClient').click();
 const paper=d.locator('#economicDossierPaper');
 await page.evaluate(()=>{const open=window.open;window.open=(...args)=>{const w=open.apply(window,args);if(w)w.print=()=>{};return w;};});
 const [out]=await Promise.all([page.context().waitForEvent('page'),d.locator('#econPrint').click()]);
 const screen=await paper.innerText(), printed=await out.locator('.econ-paper').innerText();
 await out.locator('.econ-paper').screenshot({path:'AUDIT_WORKSPACE/output/auditoria-324/villa-linde/aceptacion/D4-neutro.png'});
 await out.close();
 const lines=t=>t.split('\n').filter(x=>/^Villa Linde$|^Total con IVA$|28.125|planta|edificio completo/i.test(x)).slice(0,9);
 return {level:await page.evaluate(()=>FloorPlanApp.levelContext.levelName), budgetTotals,screen:lines(screen),printed:lines(printed),explicitScope:/planta activa|planta baja|planta primera|edificio completo/i.test(printed)};
}



