async page => {
 await page.reload();await page.waitForFunction(()=>document.documentElement.dataset.editorReady==='true');
 await page.setViewportSize({width:1440,height:900});
 await page.locator('#uploadIn').setInputFiles('AUDIT_WORKSPACE/output/auditoria-324/proyecto-c-obra.json');
 await page.waitForFunction(()=>FloorPlanApp.levelContext?.levels===2);
 await page.getByRole('button',{name:'Presupuestar',exact:true}).click();
 await page.locator('[data-route="construction-plan"]').click();
 await page.locator('#planCreate').click();
 const keys=[];
 for(const [title,start,end] of [['Montaje de tabiques QA','2026-11-28','2026-11-30'],['Pavimento de planta QA','2026-12-01','2026-12-03']]){
  await page.locator('#planAddTask').click();
  await page.locator('#taskTitle').fill(title);await page.locator('#taskStart').fill(start);await page.locator('#taskEnd').fill(end);
  const item=page.locator('#taskElements input[data-element]:enabled').nth(keys.length);
  keys.push(await item.getAttribute('data-element'));await item.check();
  await page.locator('#taskSave').click();
  if(await page.locator('#taskForm').count()) throw Error(await page.locator('#taskError').textContent());
 }
 await page.locator('#planSave').click();
 await page.locator('#planStatus').filter({hasText:'Plan guardado'}).waitFor();
 const plan=await page.locator('#planSubject').innerText();
 await page.screenshot({path:'AUDIT_WORKSPACE/output/auditoria-324/proyecto-c-plan.png'});
 await page.locator('#planClose').click();
 await page.getByRole('button',{name:'Entregar',exact:true}).click();
 await page.getByRole('button',{name:'Preparar evolución de obra',exact:true}).click();
 await page.waitForFunction(()=>document.querySelector('#evolutionFrame')?.contentDocument?.body?.classList.contains('ready'),null,{timeout:45000});
 const f=page.frameLocator('#evolutionFrame');
 const view=await f.locator('body').evaluate(d=>({state:d.dataset.state,canvas:d.querySelectorAll('canvas').length,controls:[...d.querySelectorAll('button')].filter(b=>b.checkVisibility()).map(b=>b.innerText.trim()).filter(Boolean).slice(0,15)}));
 await page.screenshot({path:'AUDIT_WORKSPACE/output/auditoria-324/proyecto-c-evolucion.png'});
 return {plan,keys,view,crumbs:await page.locator('#evolutionCrumbs').innerText()};
}
