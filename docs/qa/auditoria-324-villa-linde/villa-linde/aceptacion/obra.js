async page => {
 await page.setViewportSize({width:1440,height:900});
 await page.getByRole('button',{name:'Presupuestar',exact:true}).click();
 await page.locator('[data-route="construction-plan"]').click();
 await page.locator('#planCreate').click();
 const keys=[];
 for(const [title,start,end] of [['Montaje de tabiques','2026-11-28','2026-11-30'],['Tabiques de planta primera','2026-12-01','2026-12-03']]){
  await page.locator('#planAddTask').click();
  await page.locator('#taskTitle').fill(title);await page.locator('#taskStart').fill(start);await page.locator('#taskEnd').fill(end);
    const key=keys.length?'lvl_linde-aprobada-p/wal_linde-p-1':'lvl_linde-aprobada-b/wal_linde-b-1';
  const item=page.locator('#taskElements input[data-element="'+key+'"]');
  if(keys.length){await page.locator('#taskAddDep').click();await page.getByLabel('Tarea anterior',{exact:true}).selectOption({index:1});}
  keys.push(await item.getAttribute('data-element'));await item.check();
  await page.locator('#taskSave').click();
  if(await page.locator('#taskForm').count()) throw Error(await page.locator('#taskError').textContent());
 }
 await page.locator('#planSave').click();
 await page.locator('#planStatus').filter({hasText:'Plan guardado'}).waitFor();
  await page.locator('#planReview').click();
 await page.locator('#planReviewer').fill('Estudio Linde Mediterránea · QA');
 await page.locator('#planReviewConfirm').click();
 const plan=await page.locator('#planSubject').innerText();
 await page.screenshot({path:'AUDIT_WORKSPACE/output/auditoria-324/villa-linde/aceptacion/plan.png'});
 await page.locator('#planClose').click();
 await page.getByRole('button',{name:'Entregar',exact:true}).click();
 await page.getByRole('button',{name:'Preparar evolución de obra',exact:true}).click();
 await page.waitForFunction(()=>document.querySelector('#evolutionFrame')?.contentDocument?.body?.classList.contains('ready'),null,{timeout:45000});
 const f=page.frameLocator('#evolutionFrame');
 const view=await f.locator('body').evaluate(d=>({state:d.dataset.state,canvas:d.querySelectorAll('canvas').length,controls:[...d.querySelectorAll('button')].filter(b=>b.checkVisibility()).map(b=>b.innerText.trim()).filter(Boolean).slice(0,15)}));
 await page.screenshot({path:'AUDIT_WORKSPACE/output/auditoria-324/villa-linde/aceptacion/evolucion.png'});
 return {plan,keys,view,crumbs:await page.locator('#evolutionCrumbs').innerText()};
}




