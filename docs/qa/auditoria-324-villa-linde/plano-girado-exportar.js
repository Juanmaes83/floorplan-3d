async page => {
 await page.goto('http://127.0.0.1:18765/#editor');await page.reload();
 await page.waitForFunction(()=>document.documentElement.dataset.editorReady==='true');
 await page.setViewportSize({width:1440,height:900});
 await page.locator('#uploadIn').setInputFiles('AUDIT_WORKSPACE/output/auditoria-324/plano-girado-30.json'); await page.waitForFunction(()=>FloorPlanApp.project.rooms.some(r=>r.polygon[0].x!==r.polygon[1].x && r.polygon[0].y!==r.polygon[1].y));
 const fingerprint=()=>page.evaluate(()=>JSON.stringify(window.FloorPlanApp.project));
 const before=await fingerprint();
 await page.getByRole('button',{name:'Entregar',exact:true}).click();
 const card=page.locator('#sceneExportCard');
 const action=card.locator('#sceneExportOpen');
 if(!(await action.isVisible())) await card.getByRole('button',{name:/Ver detalles/}).click();
 await action.click();
 const d=page.getByRole('dialog',{name:'Escena para Blender'});
 const open=d.getByRole('button',{name:'Abrir la vista 3D',exact:true});
 if(await open.isVisible()) await open.click();
 await d.getByRole('button',{name:'Preparar escena',exact:true}).click();
 const outcome=await d.getByRole('button',{name:/^(Descargar ZIP|Reintentar)$/}).innerText({timeout:60000});
 if(outcome==='Descargar ZIP'){
  const [file]=await Promise.all([page.waitForEvent('download'),d.getByRole('button',{name:'Descargar ZIP',exact:true}).click()]);
  await file.saveAs('AUDIT_WORKSPACE/output/auditoria-324/escena-girada-30.zip');
 }
 await page.screenshot({path:'AUDIT_WORKSPACE/output/auditoria-324/escena-girada-30.png'});
 return {outcome,projectUnchanged:before===await fingerprint(),dialog:(await d.innerText()).slice(0,800)};
}

