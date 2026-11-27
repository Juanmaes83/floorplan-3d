async page => {
 await page.reload();
 await page.waitForFunction(()=>document.documentElement.dataset.editorReady==='true');
 await page.locator('#uploadIn').setInputFiles('AUDIT_WORKSPACE/output/auditoria-324/edificio-dos-plantas.json');
 await page.waitForFunction(()=>FloorPlanApp.levelContext?.levelId==='lvl_fixture-ground');
 const open=async()=>{await page.getByRole('button',{name:'Presupuestar',exact:true}).click(); await page.getByRole('button',{name:'Abrir presupuesto',exact:true}).click(); return page.locator('tr[data-item="floor:mat_wood"] [data-field="price"]');};
 const back=async()=>{await page.locator('#budgetClose').click();await page.getByRole('button',{name:'Diseñar',exact:true}).click();};
 let price=await open(); await price.fill('77.77');await price.press('Tab');await back();
 await page.getByRole('button',{name:'Planta primera',exact:true}).click();
 await page.waitForFunction(()=>FloorPlanApp.levelContext?.levelId==='lvl_fixture-upper');
 await page.getByRole('button',{name:'Presupuestar',exact:true}).click();
 await page.getByRole('button',{name:'Ver cantidades',exact:true}).click();
 const upperQuantity=(await page.locator('#quantitySummary').innerText()).split('\n').slice(0,2);
 await page.locator('#quantityClose').click();
 await page.getByRole('button',{name:'Abrir presupuesto',exact:true}).click();
 const upperPrices=await page.locator('#budgetDialog [data-field="price"]').evaluateAll(nodes=>nodes.map(n=>n.value));
 await back(); await page.getByRole('button',{name:'Planta baja',exact:true}).click();
 await page.waitForFunction(()=>FloorPlanApp.levelContext?.levelId==='lvl_fixture-ground');
 const lowerAfter=await (await open()).inputValue();
 return {upperQuantity,upperPrices,lowerAfter};
}

