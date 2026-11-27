async page=>{
 const out='AUDIT_WORKSPACE/output/auditoria-324/villa-linde/aceptacion/';
 const name='Villa Linde';const assert={equal(a,b,msg){if(a!==b)throw Error(msg);},ok(a,msg){if(!a)throw Error(msg);}};
 await page.waitForFunction(()=>document.documentElement.dataset.editorReady==='true');
 await page.locator('#uploadIn').setInputFiles(out+'villa-linde-aprobada.json');
 await page.waitForFunction(()=>FloorPlanApp.levelContext?.buildingId==='bld_linde-aprobada');
 await page.locator('[data-view="3d"]').click();
 await page.waitForFunction(()=>window.View3D?.cameraState&&!View3D.lifecycleMetrics.animating&&!View3D.lifecycleMetrics.flying,null,{timeout:200000});await page.waitForTimeout(800);
 // On master the guided header hides «Vista aérea / Recorrer»; a person closes the guide to reach it.
 if(!(await page.locator('[data-mode="walk"]').isVisible())&&await page.locator('#guideClose').isVisible())await page.evaluate(()=>window.FloorPlanPerla?.setGuide?.(true,{focus:false})).then(()=>page.locator('#guideClose').click());
 await page.locator('[data-mode="walk"]').click();await page.locator('#walkOverlay').click();
 assert.equal(await page.evaluate(()=>!!document.pointerLockElement),true,`${name}: pointer locked`);
 // Where the person is (plan mm and room) and where they look, read from the real camera.
 const where=()=>page.evaluate(()=>{const s=View3D.cameraState,[x,,z]=s.position,[qx,qy,qz,qw]=s.quaternion,p=[x*1000+geometry.center.x,z*1000+geometry.center.y];
  const inside=(q,P)=>{let c=false;for(let i=0,j=P.length-1;i<P.length;j=i++){const a=P[i],b=P[j];if((a[1]>q[1])!==(b[1]>q[1])&&q[0]<(b[0]-a[0])*(q[1]-a[1])/(b[1]-a[1])+a[0])c=!c;}return c;};
  return {p,room:geometry.rooms.find(r=>inside(p,r.poly))?.id||null,fwd:[-2*(qx*qz+qw*qy),-(1-2*(qx*qx+qy*qy))]};});
 const start=await where();assert.ok(start.room,`${name}: the walk starts inside a room ${JSON.stringify(start)}`);
 // Target: the nearest door from the start room to another room; waypoints on both sides of it.
 const plan=await page.evaluate(r0=>{const inside=(q,P)=>{let c=false;for(let i=0,j=P.length-1;i<P.length;j=i++){const a=P[i],b=P[j];if((a[1]>q[1])!==(b[1]>q[1])&&q[0]<(b[0]-a[0])*(q[1]-a[1])/(b[1]-a[1])+a[0])c=!c;}return c;};
  const roomAt=q=>geometry.rooms.find(r=>inside(q,r.poly))?.id;const out=[];
  // Passages: hinged doors (hinge h, closed leaf c along the wall, open leaf o across it), open passages and sliding doors (rectangles in the wall).
  const rect=r=>{const w=Math.abs(r[2]-r[0]),h=Math.abs(r[3]-r[1]);return {m:[(r[0]+r[2])/2,(r[1]+r[3])/2],c:w<h?[1,0]:[0,1]};};
  const passages=[...geometry.doors.map(d=>({m:[d.h[0]+d.c[0]*d.len/2,d.h[1]+d.c[1]*d.len/2],c:d.o,door:true})),...geometry.voids.map(rect)];
  // Sliding doors are not opened by «E» in the walk (only hinged leaves are): they are not a route here.
  for(const d of passages){const m=d.m;for(const s of [1,-1]){const a=[m[0]+d.c[0]*600*s,m[1]+d.c[1]*600*s],b=[m[0]-d.c[0]*700*s,m[1]-d.c[1]*700*s];
   if(roomAt(a)===r0&&roomAt(b)&&roomAt(b)!==r0)out.push({waypoints:[a,m,b],to:roomAt(b),door:!!d.door});}}
  // Open plan (no door or opening between two rooms, e.g. living room and hall): walk straight to the other room.
  if(!out.length)for(const r of geometry.rooms)if(r.id!==r0){const c=[r.poly.reduce((s,p)=>s+p[0],0)/r.poly.length,r.poly.reduce((s,p)=>s+p[1],0)/r.poly.length];if(roomAt(c)===r.id)out.push({waypoints:[c],to:r.id,door:false,open:true});}
  return out;},start.room);
 assert.ok(plan.length,`${name}: a door leads from the start room to another one`);
 const dist=w=>(w.waypoints[0][0]-start.p[0])**2+(w.waypoints[0][1]-start.p[1])**2;const route=plan.sort((a,b)=>dist(a)-dist(b))[0];
 let pos=start,walked=0,opened=false;const trail=[start.p],events=[];
 for(const [i,w] of route.waypoints.entries()){
  for(let n=0;n<40;n++){pos=await where();const dx=w[0]-pos.p[0],dy=w[1]-pos.p[1],d=Math.hypot(dx,dy);if(d<250)break;
   // Turn with the mouse: PointerLockControls turns 0.002 rad per pixel (left = positive yaw).
   const want=Math.atan2(dy,dx),have=Math.atan2(pos.fwd[1],pos.fwd[0]);let err=want-have;while(err>Math.PI)err-=2*Math.PI;while(err<-Math.PI)err+=2*Math.PI;
   // Turning: headless Chromium does not report relative mouse deltas reliably under Pointer Lock, so the test sends the
   // same event the mouse produces (mousemove with movementX) to the handler PointerLockControls listens to. Moving
   // is real keyboard input. (A physical mouse is in the manual protocol.)
   if(Math.abs(err)>.08){await page.evaluate(px=>{for(let k=0;k<4;k++)document.dispatchEvent(new MouseEvent('mousemove',{movementX:px/4,movementY:0}));},err/0.002);await page.waitForTimeout(150);continue;}
   // «E» opens the door the cross points at, within reach; pressed once (it toggles).
   if(i===1&&!opened&&route.door&&d<1800){await page.keyboard.press('KeyE');opened=true;events.push(['E',Math.round(d)]);await page.waitForTimeout(900);}
   await page.keyboard.down('KeyW');await page.waitForTimeout(Math.min(1500,d*1.2));await page.keyboard.up('KeyW');
   const next=await where();const step=Math.hypot(next.p[0]-pos.p[0],next.p[1]-pos.p[1]);walked+=step;trail.push(next.p);
  }
 }
 const end=await where();await page.screenshot({path:out+'recorrido-a-pie.png'});
 assert.ok(walked>1000,`${name}: the person walked ${Math.round(walked)} mm with the keyboard ${JSON.stringify(trail.map(p=>p.map(Math.round)))}`);
 assert.equal(end.room,route.to,`${name}: reached another room (${start.room} → ${route.to}), ended in ${end.room} ${JSON.stringify(trail.map(p=>p.map(Math.round)))}`);

 return {start:start.room,end:end.room,walked};
}
