async page => {
 await page.goto('http://127.0.0.1:18765/#editor');await page.reload();
 await page.waitForFunction(()=>document.documentElement.dataset.editorReady==='true');
 const id=()=>page.evaluate(()=>window.FloorPlanApp.entryId);
 const before=await id();
 const openBudget=async()=>{await page.getByRole('button',{name:'Presupuestar',exact:true}).click();await page.getByRole('button',{name:'Abrir presupuesto',exact:true}).click();return page.locator('tr[data-item="floor:mat_wood"] [data-field="price"]');};
 const price=await openBudget();await price.fill('77.77');await price.press('Tab');
 const initial=await price.inputValue();
 await page.locator('#budgetClose').click();
 await page.getByRole('button',{name:'Diseñar',exact:true}).click();
 await page.getByLabel('Acciones del proyecto',{exact:true}).click();
 await page.locator("#uploadIn").setInputFiles('AUDIT_WORKSPACE/output/auditoria-324/json-original.json');
 await page.waitForFunction(prior=>window.FloorPlanApp.entryId!==prior,before);
 const imported=await id();
 const newPrice=await (await openBudget()).inputValue();
 return {differentProject:before!==imported,originalPrice:initial,importedPrice:newPrice};
}

