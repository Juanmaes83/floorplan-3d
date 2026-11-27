async page => {
 await page.getByRole('button',{name:'Analizar',exact:true}).click();
 const entry=page.getByRole('button',{name:'Comprobar el plano',exact:true}); await entry.click();
 const d=page.getByRole('dialog',{name:'Comprobar el plano'}), input=d.locator('#planAnalysisInput'), out=d.locator('#planAnalysisResults');
 const text=async()=> (await out.innerText()).split('\n').slice(0,2);
 const empty=await text(), negativeBefore=await out.innerText();
 await input.fill('-1'); await d.getByRole('button',{name:'Calcular'}).click();
 const negativeRejected=await input.evaluate(e=>e.validity.rangeUnderflow);
 const unchanged=negativeBefore===await out.innerText();
 await input.fill('2.5'); await d.getByRole('button',{name:'Calcular'}).click();
 const validWithoutParcel=await text();
 await page.screenshot({path:'AUDIT_WORKSPACE/output/auditoria-324/qa-analizar-sin-parcela.png'});
 await page.keyboard.press('Escape'); const focus=await entry.evaluate(e=>e===document.activeElement);
 await page.getByRole('button',{name:'Sol directo por estancia',exact:true}).click();
 const sun=await page.getByRole('dialog',{name:'Sol directo por estancia'}).locator('#planAnalysisResults').innerText();
 return {empty,negativeRejected,unchanged,validWithoutParcel,focus,sun};
}
