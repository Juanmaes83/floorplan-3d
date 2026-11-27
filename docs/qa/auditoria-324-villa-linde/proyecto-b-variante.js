async page => {
 await page.getByRole('button',{name:'Diseñar',exact:true}).click();
 const origin=await page.evaluate(()=>({id:FloorPlanApp.entryId,room:FloorPlanApp.project.rooms[0],walls:FloorPlanApp.project.walls.length}));
 await page.getByLabel('Acciones del proyecto',{exact:true}).click();await page.locator('#pmVariant').click();
 await page.waitForFunction(x=>FloorPlanApp.entryId!==x,origin.id);
 const variant=await page.evaluate(()=>({id:FloorPlanApp.entryId,info:FloorPlanApp.entryInfo(),room:FloorPlanApp.project.rooms[0]}));
 await page.locator('#panel tr[data-room="'+variant.room.id+'"]').click();
 await page.locator('#panel [data-mat="mat_wood"]').click();
 const active=await page.evaluate(()=>({scale:FloorPlanApp.project.scale.confidence,floor:FloorPlanApp.project.rooms[0].floorMaterialId,walls:FloorPlanApp.project.walls.length}));
 const back=page.getByRole('button',{name:'Volver a la historia',exact:true}).filter({visible:true});
 const link=await back.count();
 if(link)await back.click();else await page.getByRole('button',{name:'Entregar',exact:true}).click();
 await page.locator('[data-entrega-code="P10"]').waitFor();
 const card=await page.locator('[data-entrega-code="P10"]').innerText();
 await page.screenshot({path:'AUDIT_WORKSPACE/output/auditoria-324/proyecto-b-variante-p10.png'});
 return {origin:origin.id,originFloor:origin.room.floorMaterialId,variant:variant.id,variantOf:variant.info?.variantOf,active,returnControl:link,card};
}
