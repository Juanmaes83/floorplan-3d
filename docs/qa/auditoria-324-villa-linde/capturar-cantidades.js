async page => {
 const [csv]=await Promise.all([page.waitForEvent('download'),page.getByRole('button',{name:'Descargar cantidades (CSV)'}).click()]);
 await csv.saveAs('AUDIT_WORKSPACE/output/auditoria-324/cantidades.csv');
 await page.screenshot({path:'AUDIT_WORKSPACE/output/auditoria-324/mediciones-presupuesto.png'});
 const summary=await page.getByRole('heading',{name:'87,18 m² útiles'}).count();
 await page.getByRole('button',{name:'Cerrar',exact:true}).filter({visible:true}).click();
 await page.getByRole('button',{name:'Diseñar',exact:true}).click();
 await page.getByRole('button',{name:'Escena 3D',exact:true}).click();
 await page.waitForFunction(()=>[...document.querySelectorAll('canvas')].some(c=>c.clientWidth>100&&c.clientHeight>100));
 await page.screenshot({path:'AUDIT_WORKSPACE/output/auditoria-324/escena-3d-escritorio.png'});
 return {summary,screen:await page.evaluate(()=>({canvases:[...document.querySelectorAll('canvas')].filter(c=>c.clientWidth>100&&c.clientHeight>100).map(c=>({id:c.id,w:c.clientWidth,h:c.clientHeight}))}))};
}
