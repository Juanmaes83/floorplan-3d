async page=>{
 const out='AUDIT_WORKSPACE/output/auditoria-324/villa-linde/';
 await page.setViewportSize({width:1680,height:1050});
 await page.waitForFunction(()=>document.documentElement.dataset.editorReady==='true');
 await page.locator('#uploadIn').setInputFiles(out+'villa-linde-edificio.json');
 await page.waitForFunction(()=>FloorPlanApp.levelContext?.buildingId==='bld_villa-linde');
 const shots=[];
 for (const [name,file] of [['Planta baja','planta-baja-actual.png'],['Planta primera','planta-primera-actual.png']]){
  const btn=page.getByRole('group',{name:'Planta activa'}).getByRole('button',{name,exact:true});
  await btn.click();
  await page.waitForFunction(n=>FloorPlanApp.levelContext?.levelName===n,name);
  const fit=page.getByRole('button',{name:'Ajustar',exact:true});
  if(await fit.isVisible())await fit.click();
  await page.screenshot({path:out+file});
  shots.push(await page.evaluate(()=>({planta:FloorPlanApp.levelContext.levelName,estancias:FloorPlanApp.project.rooms.length,muebles:FloorPlanApp.project.objects.length})));
 }
 return shots;
}
