async page => {
 await page.waitForFunction(()=>document.documentElement.dataset.editorReady==='true');
 await page.setViewportSize({width:1440,height:900});
 await page.locator('#uploadIn').setInputFiles('AUDIT_WORKSPACE/output/auditoria-324/edificio-dos-plantas.json');
 await page.waitForFunction(()=>window.FloorPlanApp.levelContext?.levelId==='lvl_fixture-ground');
 await page.getByRole('button',{name:'Analizar',exact:true}).click();
 const analyze=(await page.locator('#professionalWorkspace').innerText()).split('\n').filter(s=>/27,36|Planta única|plantas/i.test(s)).slice(0,8);
 await page.getByRole('button',{name:'Presupuestar',exact:true}).click();
 await page.getByRole('button',{name:'Abrir presupuesto',exact:true}).click();
 const d=page.locator('#budgetTitle').locator('xpath=ancestor::dialog');
 const ids=await d.locator('tr[data-item]').evaluateAll(rows=>rows.map(r=>r.dataset.item));
 for(const id of ids){const e=d.locator('tr[data-item="'+id+'"] [data-field="price"]');await e.fill('100');await e.press('Tab');}
 await d.locator('#budgetVat').selectOption('21');
 const totals=await d.locator('#budgetTotals').innerText();
 const scope=(await d.innerText()).split('\n').filter(s=>/planta activa|planta baja|planta primera|edificio completo/i.test(s));
 await d.locator('#budgetTotals').screenshot({path:'AUDIT_WORKSPACE/output/auditoria-324/edificio-presupuesto-base-total.png'});
 return {analyze,items:ids.length,totals,scope,active:await page.evaluate(()=>FloorPlanApp.levelContext.levelName)};
}
