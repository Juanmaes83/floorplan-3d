async page=>{
 const out='AUDIT_WORKSPACE/output/auditoria-324/villa-linde/aceptacion/';
 await page.keyboard.press('Escape');
 await page.getByRole('button',{name:'Entregar',exact:true}).click();
 await page.getByRole('button',{name:'Preparar evolución de obra',exact:true}).click();
 const f=page.frameLocator('#evolutionFrame');
 await f.locator('#costMode').selectOption('none');
 await f.locator('#brandTitle').fill('Villa Linde · evolución de obra');
 await f.locator('#deliverGo').click({timeout:15000});
 const report={};
 try{
  for(const [id,file] of [['videoDownload','evolucion-producto'],['docDownload','evolucion-cliente'],['manifestDownload','evolucion-manifiesto']]){
   const b=f.locator('#'+id);
   if(id==='manifestDownload'&&!(await b.isVisible()))continue;
   await b.waitFor({timeout:100000});
   const [d]=await Promise.all([page.waitForEvent('download'),b.click()]);
   const ext=d.suggestedFilename().split('.').pop();
   await d.saveAs(out+file+'.'+ext);
   report[id]=d.suggestedFilename();
  }
 }catch(e){report.error=e.message;}
 report.status=await f.locator('#videoStatus').innerText();
 report.result=await f.locator('#deliverResult').innerText();
 await page.screenshot({path:out+'P4-generacion.png'});
 return report;
}
