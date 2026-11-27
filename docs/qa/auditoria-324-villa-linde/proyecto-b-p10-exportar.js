async page => {
 const d=page.getByRole('dialog',{name:'Historia del cambio'});
 await d.getByRole('button',{name:'Rehacer con las revisiones actuales'}).click();
 const save=d.getByRole('button',{name:'Guardar revisión',exact:true});await save.click();
 const preview=d.getByRole('button',{name:'Previsualizar como cliente',exact:true});await preview.click();
 const dl=d.getByRole('button',{name:'Descargar para el cliente',exact:true});
 const result={review:(await d.innerText()).split('\n').filter(t=>/baldosa|parqué|paviment|sin cambios|previsualizad/i.test(t)).slice(0,20)};
 const [out]=await Promise.all([page.waitForEvent('download',{timeout:15000}),dl.click()]);
 await out.saveAs('AUDIT_WORKSPACE/output/auditoria-324/proyecto-b-historia.zip');
 return {...result,filename:out.suggestedFilename()};
}
