async page => {
 await page.waitForFunction(()=>document.documentElement.dataset.editorReady==='true');
 await page.locator('#uploadIn').setInputFiles('AUDIT_WORKSPACE/output/auditoria-324/edificio-dos-plantas.json');
 await page.waitForFunction(()=>window.FloorPlanApp.levelContext?.levels===2);
 await page.getByRole('button',{name:'Analizar',exact:true}).click();await page.waitForTimeout(800);
 const an=(await page.locator('#professionalWorkspace').innerText()).split('\n').filter(s=>/m²|plantas|Planta/i.test(s)).slice(0,6);
 await page.getByRole('button',{name:'Entregar',exact:true}).click();await page.waitForTimeout(800);
 await page.evaluate(()=>window.FloorPlanDossier.open('technical'));await page.waitForTimeout(800);
 const cover=await page.locator('.dossier-cover').innerText();
 return {an,cover:cover.split('\n').slice(0,14)};
}
