async page => {
 const p10=page.locator('[data-entrega-code=P10]');
 const pair=await page.evaluate(()=>({original:FloorPlanApp.entryInfo().variantOf,variant:FloorPlanApp.entryId,room:FloorPlanApp.project.rooms[0]}));
 const traceClose=page.locator('#traceHidePanel'); if(await traceClose.isVisible()) await traceClose.click();
 await page.locator('#gRooms [data-room="'+pair.room.id+'"]').click();
 await page.locator('#panel [data-mat="mat_tile600"]').click();
 const newMaterial=await page.evaluate(()=>FloorPlanApp.project.rooms[0].floorMaterialId);
 await page.getByRole('button',{name:'Volver a la historia',exact:true}).filter({visible:true}).click();
 await p10.waitFor();
 const after=await page.evaluate(()=>({id:FloorPlanApp.entryId,material:FloorPlanApp.project.rooms[0].floorMaterialId,scale:FloorPlanApp.project.scale.confidence}));
 const card=await p10.innerText();
 await page.screenshot({path:'AUDIT_WORKSPACE/output/auditoria-324/proyecto-b-p10-cambio.png'});
 return {linked:pair.original===after.id,originalMaterial:after.material,newMaterial,scale:after.scale,card};
}


