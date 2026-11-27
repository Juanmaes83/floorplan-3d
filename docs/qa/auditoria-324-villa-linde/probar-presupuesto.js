async page => {
 await page.goto('http://127.0.0.1:18765/#editor'); await page.reload();
 await page.waitForFunction(()=>document.documentElement.dataset.editorReady==='true');
 await page.getByRole('button',{name:'Presupuestar',exact:true}).click();
 await page.getByRole('button',{name:'Abrir presupuesto',exact:true}).click();
 const line=page.getByRole('row').filter({has:page.getByRole('rowheader',{name:/Pavimento.*Parqué de roble/})});
 const field=name=>line.locator('[data-field="'+name+'"]');
 async function edit(name,value){await field(name).fill(value);await field(name).press('Tab');}
 await edit('waste','5');
 await edit('price','42.75');
 const unreviewed=!(await field('review').isChecked());
 await field('review').check();
 const out={unreviewed, reviewed:await field('review').isChecked(),lineText:await line.innerText(),totals:await page.locator('#budgetTotals').innerText()};
 for(const [button,ext] of [['budgetCsv','csv'],['budgetJson','json']]){
  const [download]=await Promise.all([page.waitForEvent('download'),page.locator('#'+button).click()]);
  await download.saveAs('AUDIT_WORKSPACE/output/auditoria-324/presupuesto-qa.'+ext);
 }
 await page.screenshot({path:'AUDIT_WORKSPACE/output/auditoria-324/presupuesto-qa.png'});
 return out;
}
