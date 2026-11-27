async page => {
 await page.waitForFunction(()=>document.documentElement.dataset.editorReady==='true');
 await page.setViewportSize({width:1440,height:900});
 const level=await page.evaluate(()=>FloorPlanApp.levelContext);
 await page.getByRole('button',{name:'Analizar',exact:true}).click();
 const analyze=(await page.locator('#professionalWorkspace').innerText()).split('\n').filter(s=>s.includes('m²')||s.includes('Planta')).slice(0,13);
 await page.getByRole('button',{name:'Presupuestar',exact:true}).click();
 const summary=(await page.locator('#professionalWorkspace').innerText()).split('\n').filter(s=>s.includes('m²')||s.includes('Planta')).slice(0,13);
 await page.getByRole('button',{name:'Ver cantidades',exact:true}).click();
 const quantities=(await page.locator('#quantityDialog').innerText()).split('\n').filter(s=>s.includes('m²')||s.includes('planta')).slice(0,13);
 await page.locator('#quantityClose').click();
 await page.getByRole('button',{name:'Abrir presupuesto',exact:true}).click();
 const d=page.locator('#budgetTitle').locator('xpath=ancestor::dialog');
 const budget=(await d.innerText()).split('\n').filter(s=>/planta|parcial|partida|miembro/i.test(s)).slice(0,18);
 await page.screenshot({path:'AUDIT_WORKSPACE/output/auditoria-324/edificio-presupuesto.png'});
 return {level,analyze,summary,quantities,budget};
}

