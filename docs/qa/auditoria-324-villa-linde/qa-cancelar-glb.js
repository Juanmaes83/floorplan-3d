async page => {
 await page.reload();
 await page.waitForFunction(()=>document.documentElement.dataset.editorReady==='true');
 await page.getByRole('button',{name:'Entregar',exact:true}).click();
 const card=page.locator('#sceneExportCard'), action=card.locator('#sceneExportOpen');
 if(!(await action.isVisible())) await card.getByRole('button',{name:/Ver detalles/}).click();
 await action.click();
 const d=page.getByRole('dialog',{name:'Escena para Blender'});
 const opener=d.getByRole('button',{name:'Abrir la vista 3D',exact:true});
 if(await opener.isVisible()) await opener.click();
 await page.evaluate(()=>{
   const capture=View3D.captureScene;
   View3D.captureScene=function(o){ View3D.captureScene=capture; return new Promise((resolve,reject)=> {
     const stop=()=>reject(Object.assign(new Error('Cancelación QA'),{code:'CANCELLED'}));
     if(o.signal.aborted) stop(); else o.signal.addEventListener('abort',stop,{once:true});
   });};
 });
 const initial=await page.evaluate(()=>JSON.stringify(FloorPlanApp.project));
 let downloads=0;page.on('download',()=>downloads++);
 await d.getByRole('button',{name:'Preparar escena',exact:true}).click();
 await d.getByRole('button',{name:'Cancelar',exact:true}).click();
 await d.getByRole('button',{name:'Reintentar',exact:true}).waitFor();
 const state=await d.getAttribute('data-state');
 const readyToDownloadAtCancel=await d.getByRole('button',{name:'Descargar ZIP',exact:true}).count();
 await page.screenshot({path:'AUDIT_WORKSPACE/output/auditoria-324/qa-glb-cancelado.png'});
 await d.getByRole('button',{name:'Reintentar',exact:true}).click();
 await d.getByRole('button',{name:'Descargar ZIP',exact:true}).waitFor({timeout:60000});
 return {state,readyToDownloadAtCancel,downloads,retry:await d.getAttribute('data-state'),projectUnchanged:initial===await page.evaluate(()=>JSON.stringify(FloorPlanApp.project))};
}

