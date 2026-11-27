async page => {
 const d=page.getByRole('dialog',{name:'Historia del cambio'});
 const save=d.getByRole('button',{name:'Guardar revisión',exact:true});await save.click({timeout:15000});
 const preview=d.getByRole('button',{name:'Previsualizar como cliente',exact:true});await preview.click({timeout:15000});
 const dl=d.getByRole('button',{name:'Descargar para el cliente',exact:true});
 const result={review:(await d.innerText()).split('\n').filter(t=>/baldosa|parqué|paviment|sin cambios|previsualizad/i.test(t)).slice(0,20)};
 const [out]=await Promise.all([page.waitForEvent('download',{timeout:15000}),dl.click()]);
 await out.saveAs('AUDIT_WORKSPACE/output/auditoria-324/villa-linde/aceptacion/villa-historia.zip');
 return {...result,filename:out.suggestedFilename()};
}


