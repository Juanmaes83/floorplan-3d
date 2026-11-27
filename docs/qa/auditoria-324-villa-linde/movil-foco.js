async page => {
 await page.goto('http://127.0.0.1:18765/#editor');await page.reload();
 await page.waitForFunction(()=>document.documentElement.dataset.editorReady==='true');
 await page.setViewportSize({width:360,height:800});
 await page.getByRole('button',{name:'Entregar',exact:true}).click();
 const d3=page.getByRole('button',{name:'Preparar dossier',exact:true});
 await d3.click();
 await page.locator('#dossierStyle').selectOption('client');
 const stages=[];
 for (const step of ['client','note','review']){
  await page.locator('.dc-steps button[data-dc-step="'+step+'"]').click();
  const sample=await page.locator('#dossierDialog').evaluate(d=>({step:d.dataset.dcStep,dialogWidth:d.getBoundingClientRect().width,viewport:innerWidth,horizontalOverflow:d.scrollWidth>d.clientWidth,hasReturn:!!d.querySelector('.dc-back:not([hidden])')}));
  stages.push(sample);
 }
 await page.screenshot({path:'AUDIT_WORKSPACE/output/auditoria-324/d3-360-revision.png'});
 await page.keyboard.press('Escape');
 const d3Focus=await page.evaluate(()=>({text:document.activeElement?.innerText?.trim().slice(0,100),id:document.activeElement?.id}));
 await page.getByRole('button',{name:'Presupuestar',exact:true}).click();
 const b=page.getByRole('button',{name:'Abrir presupuesto',exact:true});
 await b.click();await page.keyboard.press('Escape');
 const budgetFocus=await b.evaluate(e=>e===document.activeElement);
 return {stages,d3Focus,budgetFocus};
}
