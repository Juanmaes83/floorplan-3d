async page => {
 await page.waitForFunction(()=>document.documentElement.dataset.editorReady==='true');
 await page.setViewportSize({width:1440,height:900});
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
  await file.saveAs('AUDIT_WORKSPACE/output/auditoria-324/villa-linde/escena-auditada.zip');
 }
 await page.screenshot({path:'AUDIT_WORKSPACE/output/auditoria-324/villa-linde/escena-blender-exportacion.png'});
 return {outcome,projectUnchanged:before===await fingerprint(),dialog:(await d.innerText()).slice(0,800)};
}

