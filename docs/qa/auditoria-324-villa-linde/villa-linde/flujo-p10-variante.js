async page=>{
 await page.setViewportSize({width:1440,height:900});
 const source=await page.evaluate(()=>({id:FloorPlanApp.entryId,level:FloorPlanApp.levelContext,room:FloorPlanApp.project.rooms[0]}));
 await page.locator('[data-entrega-code="P10"]').getByRole('button',{name:'Crear variante',exact:true}).click();
 await page.waitForFunction(id=>FloorPlanApp.entryId!==id,source.id,{timeout:15000});
 const variant=await page.evaluate(()=>({id:FloorPlanApp.entryId,level:FloorPlanApp.levelContext,rooms:FloorPlanApp.project.rooms.length,room:FloorPlanApp.project.rooms[0]}));
 await page.locator('#panel tr[data-room="'+variant.room.id+'"]').click({timeout:8000});
 await page.locator('#panel [data-mat="mat_wood"]').click({timeout:8000});
 const material=await page.evaluate(()=>FloorPlanApp.project.rooms[0].floorMaterialId);
 const back=page.getByRole('button',{name:'Volver a la historia',exact:true}).filter({visible:true});
 await back.click({timeout:8000});
 const d=page.getByRole('dialog',{name:'Historia del cambio'});
 await d.waitFor({timeout:8000});
 const story=await d.innerText();
 await page.screenshot({path:'AUDIT_WORKSPACE/output/auditoria-324/villa-linde/P10-variante.png'});
 return {source,variant,material,story:story.slice(0,1250)};
}
