async page => {
 await page.setViewportSize({width:1440,height:900});
 await page.waitForFunction(()=>FloorPlanApp.project.name.includes('Reforma diagonal')&&document.querySelector('#gSource image'));
 await page.getByRole('button',{name:'Abrir herramientas de calibración',exact:true}).click();
 const tool=async id=>{
  const l=page.locator('#'+id);
  if(!(await l.isVisible())) await page.getByRole('button',{name:'Plano propio',exact:true}).click();
  await l.click();
 };
 const point=async(x,y)=> {
  const q=await page.evaluate(({x,y})=>{const w=FloorPlanTracing.imageToWorld(FloorPlanApp.project.sourceImages[0],{x,y});const q=new DOMPoint(w.x,w.y).matrixTransform(document.querySelector('#plan').getScreenCTM());return {x:q.x,y:q.y};},{x,y});
  await page.mouse.click(q.x,q.y);
 };
 const measure=async(id,a,b,length)=>{
  await tool(id);await point(...a);await point(...b);
  await page.locator('#traceKnown').fill(String(length));await page.locator('#traceDistanceSave').click();
  await page.locator('#traceDistance').waitFor({state:'hidden'});
 };
 await measure('traceCalibrate',[40,40],[440,40],4000);
 await measure('traceVerify',[40,40],[40,290],2500);
 await tool('traceConfirm');
 const corners=[[40,40],[440,40],[440,225],[315,290],[40,290]];
 for(let i=0;i<corners.length;i++){await tool('traceWall');await point(...corners[i]);await point(...corners[(i+1)%corners.length]);}
 await tool('traceRoom');for(const q of corners)await point(...q);await tool('traceCloseRoom');
 await page.waitForFunction(()=>FloorPlanApp.project.rooms.length===1);
 const project=await page.evaluate(()=>structuredClone(FloorPlanApp.project));
 const poly=project.rooms[0].polygon;
 const area=Math.abs(poly.reduce((s,q,i)=>{const b=poly[(i+1)%poly.length];return s+q.x*b.y-q.y*b.x},0))/2e6;
 await page.screenshot({path:'AUDIT_WORKSPACE/output/auditoria-324/proyecto-b-trazado.png'});
 await page.getByRole('button',{name:'Analizar',exact:true}).click();
 const analyzed=(await page.locator('#professionalWorkspace').innerText()).split('\n').filter(x=>/m²|calibr/i.test(x)).slice(0,8);
 return {scale:project.scale,area,expected:9.59375,delta:area-9.59375,walls:project.walls.length,analyzed};
}


