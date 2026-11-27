async page=>{
 const out='AUDIT_WORKSPACE/output/auditoria-324/villa-linde/aceptacion/';
 await page.setViewportSize({width:1600,height:1000});
 await page.waitForFunction(()=>document.documentElement.dataset.editorReady==='true');
 await page.locator('#uploadIn').setInputFiles(out+'villa-linde-aprobada.json');
 await page.waitForFunction(()=>FloorPlanApp.levelContext?.buildingId==='bld_linde-aprobada');
 const stats=[];
 for(const [name,file] of [['Planta baja','baja'],['Planta primera','primera']]){
  await page.getByRole('group',{name:'Planta activa'}).getByRole('button',{name,exact:true}).click();
  await page.waitForFunction(n=>FloorPlanApp.levelContext?.levelName===n,name);
  const fit=page.getByRole('button',{name:'Ajustar',exact:true});
  if(await fit.isVisible())await fit.click();
  await page.screenshot({path:out+'01-plano-'+file+'.png'});
  stats.push(await page.evaluate(()=>({planta:FloorPlanApp.levelContext.levelName,estancias:FloorPlanApp.project.rooms.length,muebles:FloorPlanApp.project.objects.length,escalera:FloorPlanBuildingUI.stairZoneList(),implantacion:FloorPlanBuildingUI.site})));
 }
 await page.getByRole('group',{name:'Planta activa'}).getByRole('button',{name:'Planta baja',exact:true}).click();
 await page.getByRole('button',{name:'Analizar',exact:true}).click();
 await page.getByRole('button',{name:'Ver informe de orientación y emplazamiento',exact:true}).click();
 const byDialog=page.getByRole('dialog',{name:/orientación/i});
 await byDialog.waitFor();
 const orient=(await byDialog.innerText()).split('\n').filter(l=>/recorrido del sol|sur|fachada|contexto|cálculo astronómico|parcela|Sombras|Norte/i.test(l)).slice(0,25);
 await page.screenshot({path:out+'02-orientacion.png'});
 await page.keyboard.press('Escape');
 await page.getByRole('button',{name:'Diseñar',exact:true}).click();
 await page.getByRole('button',{name:'Escena 3D',exact:true}).click();
 await page.waitForFunction(()=>FloorPlanApp.viewMode==='3d');
 await page.screenshot({path:out+'03-escena-3d.png'});
 return {stats,orient};
}
