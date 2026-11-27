async page => {
 await page.waitForFunction(()=>document.documentElement.dataset.editorReady==='true');
 await page.locator('#uploadIn').setInputFiles('AUDIT_WORKSPACE/output/auditoria-324/edificio-dos-plantas.json');
 await page.waitForFunction(()=>window.FloorPlanApp.levelContext?.levels===2);
 return await page.evaluate(()=>{const m=FloorPlanSurfaceMetrics.home(FloorPlanApp.project);return {ctx:FloorPlanApp.levelContext,projName:FloorPlanApp.project.name,areaM2:m.areaM2,levels:(m.levels||[]).map(l=>({keys:Object.keys(l).join(','),name:l.name,id:l.levelId||l.id,area:l.areaM2,rooms:(l.rooms||[]).length})),projLevels:(FloorPlanApp.project.levels||[]).length};});
}
