async page => {
 const dialog=page.locator('#budgetTitle').locator('xpath=ancestor::dialog');
 const ids=await dialog.locator('tr[data-item]').evaluateAll(rows=>rows.map(r=>r.dataset.item));
 for(const id of ids){const el=dialog.locator('tr[data-item="'+id+'"] [data-field="price"]');await el.fill('100');await el.press('Tab');}
 await dialog.locator('#budgetVat').selectOption('21');
 const totals=await dialog.locator('#budgetTotals').innerText();
 const note=await dialog.locator('#budgetNote').innerText();
 const [out]=await Promise.all([page.waitForEvent('download'),dialog.locator('#budgetJson').click()]);
 await out.saveAs('AUDIT_WORKSPACE/output/auditoria-324/edificio-presupuesto-baja.json');
 await page.screenshot({path:'AUDIT_WORKSPACE/output/auditoria-324/edificio-presupuesto-total.png'});
 await dialog.locator('#budgetTotals').screenshot({path:'AUDIT_WORKSPACE/output/auditoria-324/edificio-presupuesto-total-detalle.png'});
 return {numberOfItems:ids.length, note, totals, visibleScope:(await dialog.innerText()).split('\n').filter(x=>/planta activa|planta baja|planta primera|edificio completo/i.test(x))};
}
