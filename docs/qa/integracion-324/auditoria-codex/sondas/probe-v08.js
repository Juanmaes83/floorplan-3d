async page => {
 await page.waitForFunction(()=>document.documentElement.dataset.editorReady==='true');
 await page.locator('#uploadIn').setInputFiles('AUDIT_WORKSPACE/output/auditoria-324/villa-linde/aceptacion/villa-linde-aprobada.json');
 await page.waitForFunction(()=>window.FloorPlanApp.levelContext?.levels>=2,{timeout:60000});
 await page.getByRole('button',{name:'Escena 3D',exact:true}).click();await page.waitForFunction(()=>window.FloorPlanApp.viewMode==='3d');await page.waitForTimeout(2500);
 return await page.evaluate(()=>{
  const ns=window.View3D.navState;const levels=window.FloorPlanBuildingUI.presentationSources().levels;
  const per=levels.map(l=>{let r;try{r=FloorPlanRoof.deriveProject(l.project,FloorPlanExterior);}catch(e){r={status:'throw',reason:e.message};}
   const ws=l.project.walls.map(w=>({id:w.id,len:Math.round(Math.hypot(w.end.x-w.start.x,w.end.y-w.start.y))})).filter(w=>/linde-b-(30|51)$/.test(w.id)||w.len<50);
   return {level:l.name,walls:l.project.walls.length,roof:{status:r.status,reason:r.reason,detail:JSON.stringify(r.details||r.diagnostics||r.issues||r.blockers||null).slice(0,600)},short:ws};});
  return {roofStatus:ns.roofStatus,roofReason:ns.roofReason,per};});
}
