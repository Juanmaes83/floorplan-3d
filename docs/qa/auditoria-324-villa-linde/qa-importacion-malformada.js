async page => {
 await page.waitForFunction(()=>document.documentElement.dataset.editorReady==='true');
 const sample=()=>page.evaluate(()=>({id:FloorPlanApp.entryId,project:JSON.stringify(FloorPlanApp.project)}));
 const before=await sample();
 await page.locator('#uploadIn').setInputFiles('AUDIT_WORKSPACE/output/auditoria-324/qa-malformado.json');
 await page.waitForFunction(()=>[...document.querySelectorAll('[role=status]')].some(x=>/rechazada|no se pudo|inválid|no es válido/i.test(x.textContent)));
 const after=await sample();
 const alerts=await page.evaluate(()=>[...document.querySelectorAll('[role=status]')].map(n=>n.textContent.trim()).filter(s=>/rechazada|no se pudo|inválid|no es válido/i.test(s)));
 await page.screenshot({path:'AUDIT_WORKSPACE/output/auditoria-324/qa-importacion-malformada.png'});
 return {alerts,sameIdentity:before.id===after.id,sameProject:before.project===after.project};
}

