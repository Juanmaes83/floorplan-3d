async page => {
 const open=async()=>{await page.getByRole('button',{name:'Entregar',exact:true}).click(); await page.getByRole('button',{name:'Preparar dossier',exact:true}).click(); await page.getByRole('combobox',{name:'Estilo'}).selectOption('client'); return page.getByRole('textbox',{name:'Nombre del cliente',exact:true});};
 const id=async()=>page.evaluate(()=>window.FloorPlanApp.entryId);
 const first=await id();
 await (await open()).fill('Cliente de copia QA');
 await page.reload();
 const second=await id();
 return {sameProject:first===second, name:await (await open()).inputValue()};
}
