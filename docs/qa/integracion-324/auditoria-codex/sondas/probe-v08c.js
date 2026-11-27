async page => {
 await page.waitForFunction(()=>document.documentElement.dataset.editorReady==='true');
 await page.locator('#uploadIn').setInputFiles('AUDIT_WORKSPACE/output/auditoria-324/villa-linde/aceptacion/villa-linde-aprobada.json');
 await page.waitForFunction(()=>window.FloorPlanApp.levelContext?.levels>=2,{timeout:60000});
 return await page.evaluate(()=>{
  const L=window.FloorPlanBuildingUI.presentationSources().levels,res={};
  // Planta primera: nodos de fachada con grado distinto de 2
  {const p=L[1].project,c=FloorPlanExterior.derive(p),ids=new Set(c.walls.filter(w=>w.status==='facade').map(w=>w.wallId)),n=new Map();
   for(const w of p.walls.filter(w=>ids.has(w.id)))for(const q of [w.start,w.end]){const k=q.x+','+q.y;if(!n.has(k))n.set(k,[]);n.get(k).push(w.id);}
   res.primeraNodos=[...n].filter(([,v])=>v.length!==2).map(([k,v])=>({punto:k,muros:v}));}
  // Planta baja: estancias que tocan b-51 y b-30
  {const p=L[0].project,w51=p.walls.find(w=>w.id==='wal_linde-b-51'),w30=p.walls.find(w=>w.id==='wal_linde-b-30');
   const near=(w)=>p.rooms.filter(r=>(r.polygon||r.points||[]).some(q=>{const x=q.x??q[0],y=q.y??q[1];const minx=Math.min(w.start.x,w.end.x)-150,maxx=Math.max(w.start.x,w.end.x)+150,miny=Math.min(w.start.y,w.end.y)-150,maxy=Math.max(w.start.y,w.end.y)+150;return x>=minx&&x<=maxx&&y>=miny&&y<=maxy;})).map(r=>r.name+(r.kind?' ['+r.kind+']':'')+(r.countsInArea===false||r.counted===false?' (fuera)':''));
   res.b51={muro:w51,estanciasCerca:near(w51)};res.b30={muro:w30,estanciasCerca:near(w30)};res.roomKeys=Object.keys(p.rooms[0]);}
  return res;});
}
