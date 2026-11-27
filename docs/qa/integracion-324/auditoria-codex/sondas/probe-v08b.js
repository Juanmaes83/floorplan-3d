async page => {
 await page.waitForFunction(()=>document.documentElement.dataset.editorReady==='true');
 await page.locator('#uploadIn').setInputFiles('AUDIT_WORKSPACE/output/auditoria-324/villa-linde/aceptacion/villa-linde-aprobada.json');
 await page.waitForFunction(()=>window.FloorPlanApp.levelContext?.levels>=2,{timeout:60000});
 return await page.evaluate(()=>{
  const levels=window.FloorPlanBuildingUI.presentationSources().levels,out=[];
  for(const l of levels){const p=structuredClone(l.project),c=FloorPlanExterior.derive(p);
   const st={};for(const w of c.walls){st[w.status]=(st[w.status]||0)+1;}
   const odd=c.walls.filter(w=>w.status!=='facade'&&w.status!=='interior').map(w=>({id:w.wallId,status:w.status,reason:w.reason||w.code||null}));
   // Copia de diagnóstico: quitar el muro de 10 mm y reclasificar.
   const q=structuredClone(p);q.walls=q.walls.filter(w=>Math.hypot(w.end.x-w.start.x,w.end.y-w.start.y)>=50);
   const c2=FloorPlanExterior.derive(q),r2=FloorPlanRoof.deriveProject(q,FloorPlanExterior);
   const odd2=c2.walls.filter(w=>w.status!=='facade'&&w.status!=='interior').map(w=>({id:w.wallId,status:w.status,reason:w.reason||w.code||null}));
   out.push({level:l.name,status:c.status,reason:c.reason||null,counts:st,odd,withoutShort:{removed:p.walls.length-q.walls.length,status:c2.status,odd:odd2,roof:r2.status+' '+(r2.reason||'')}});}
  return out;});
}
