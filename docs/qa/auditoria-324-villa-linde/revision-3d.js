async page => {
 await page.setViewportSize({width:1440,height:900});
 await page.waitForFunction(()=>document.documentElement.dataset.editorReady==='true');
 const done=()=>page.getByRole('button',{name:/Revisa la distribución en 3D: hecho/}).count();
 const before = await done();
 const primary = page.getByRole('button',{name:'Revisar en 3D',exact:true}).filter({visible:true});
 const tooltip = await primary.getAttribute('title').catch(()=>null);
 await page.screenshot({path:'AUDIT_WORKSPACE/output/auditoria-324/revision-3d-antes.png'});
 await page.getByRole('button',{name:'Escena 3D',exact:true}).click();
 await page.waitForFunction(()=>window.FloorPlanApp.viewMode==='3d');
 await page.getByRole('button',{name:/Revisa la distribución en 3D: hecho/}).waitFor();
 await page.screenshot({path:'AUDIT_WORKSPACE/output/auditoria-324/revision-3d-despues.png'});
 return {before,after:await done(),tooltip,click:'Escena 3D'};
}
