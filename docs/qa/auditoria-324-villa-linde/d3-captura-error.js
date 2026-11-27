async page => {
 await page.setViewportSize({width:1440,height:900});
 await page.getByRole('button',{name:'Plano 2D',exact:true}).click();
 await page.getByRole('button',{name:'Entregar',exact:true}).click();
 await page.getByRole('button',{name:'Preparar dossier',exact:true}).click();
 await page.getByRole('combobox',{name:'Estilo'}).selectOption('client');
 await page.getByRole('button',{name:/Revisar el dossier/}).first().click();
 const ready=await page.evaluate(()=>typeof window.View3D?.deliveryShot);
 if(ready!=='function') return {ready};
 await page.evaluate(()=>{window.View3D.deliveryShot=()=>{throw new Error('QA: captura 3D indisponible');};});
 await page.getByRole('button',{name:'Preparar imágenes',exact:true}).click();
 await page.waitForFunction(()=>window.FloorPlanProjectViews.status()==='error',{timeout:35000});
 await page.getByRole('dialog',{name:'Dossier del proyecto'}).waitFor();
 await page.screenshot({path:'AUDIT_WORKSPACE/output/auditoria-324/d3-captura-error-sin-aviso.png'});
 return await page.evaluate(()=>({status:FloorPlanProjectViews.status(),engineError:FloorPlanProjectViews.error,visibleError:[...document.querySelectorAll('dialog[open]')].some(d=>d.innerText.includes('QA: captura 3D indisponible')),toasts:[...document.querySelectorAll('[role=status]')].map(n=>n.innerText).filter(Boolean)}));
}
