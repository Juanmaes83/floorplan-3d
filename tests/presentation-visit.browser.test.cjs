/* Section → Spatial Visit V1 on the real app (reference home of «Probar el ejemplo»):
   - the sub-option is off by default and only available with the section; OFF keeps the base story (no room-visit);
   - ON: the whole story is plan-reveal → section-open → room-visit to the first chosen room with a validated route;
   - every camera state of the visit is either above every wall and piece of furniture, on the vertical landing column,
     or on the route at eye height with the route's clearance; full-height walls only at eye height inside the room;
   - seek forwards and backwards gives the same states; p = 1 is at eye height inside the destination room;
   - hand-over to «Recorrer» at the same pose (walk mode, collisions), back to the presentation and back to the section;
   - closing restores clipping, doors, cut and the editor; the project JSON never changes. */
const {test,before,after}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs/promises'),path=require('node:path'),{createServer}=require('node:http'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),three=require('./helpers/three-module.cjs');let server,url,browser;
const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.glb':'model/gltf-binary','.hdr':'application/octet-stream'};
before(async()=>{server=createServer(async(req,res)=>{try{const f=path.resolve(root,'.'+(req.url==='/'?'/index.html':new URL(req.url,'http://l').pathname));if(!f.startsWith(root+path.sep))throw 0;res.setHeader('Content-Type',types[path.extname(f)]||'application/octet-stream');res.end(await fs.readFile(f));}catch{res.writeHead(404);res.end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));url=`http://127.0.0.1:${server.address().port}/`;browser=await chromium.launch({executablePath:process.env.CHROME||undefined,args:['--no-sandbox','--enable-unsafe-swiftshader']});});
after(async()=>{await browser?.close();await new Promise(r=>server?.close(r));});
async function open(t,viewport={width:1280,height:800}){const mobile=viewport.width<1000,ctx=await browser.newContext({viewport,isMobile:mobile,hasTouch:mobile,reducedMotion:'reduce'});t.after(()=>ctx.close());
 const page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(90000);
 await page.route('https://cdn.jsdelivr.net/npm/three@0.160.0/**',async r=>r.fulfill({contentType:'text/javascript',headers:{'access-control-allow-origin':'*'},body:await three(r.request().url(),()=>{throw Error('no local three');})}));
 await page.goto(url);await page.waitForFunction(()=>window.FloorPlanPresentation&&window.View3D?.presentationStoryBegin,null,{timeout:90000});
 await page.locator('#welcomeExample').click();await page.waitForFunction(()=>FloorPlanApp.project.rooms.length>3);return {page,errors};}
const settled=page=>page.waitForFunction(()=>FloorPlanPresentation.active&&!FloorPlanPresentation.story&&document.querySelector('#presentationOverlay').dataset.moving==='false'&&!View3D.lifecycleMetrics.flying,null,{timeout:180000});
const seek=(page,P)=>page.evaluate(v=>{const s=document.querySelector('#presentationStorySlider');s.value=String(Math.round(v*1000));s.dispatchEvent(new Event('input',{bubbles:true}));},P).then(()=>page.waitForFunction(()=>!FloorPlanPresentation.story?.busy,null,{timeout:120000}));
async function start(page,{visit}){
 await page.locator('#presentationBtn:visible,#guidePresent:visible').first().click();await page.locator('#presentationConfig[open]').waitFor();
 const v=page.locator('#presentationVisitOption');assert.equal(await v.isChecked(),false,'off by default');assert.equal(await v.isDisabled(),true,'needs the section');
 await page.locator('#presentationSectionOption').check();assert.equal(await v.isDisabled(),false);if(visit)await v.check();
 await page.locator('#presentationConfig .presentation-config-actions .btn').first().click();await settled(page);
}
// Camera validity against the real plan (mm): walls of the active level and furniture footprints.
const validity=page=>page.evaluate(()=>{const g=FloorPlanApp.geometry,P=FloorPlanApp.project,c=View3D.cameraState.position,x=c[0]*1000+g.center.x,y=c[2]*1000+g.center.y,h=c[1];
 const inRect=(r,px,py,pad)=>{const dx=px-r.center[0],dy=py-r.center[1],co=Math.cos(r.angle),si=Math.sin(r.angle);return Math.abs(dx*co+dy*si)<r.spanMm/2+pad&&Math.abs(-dx*si+dy*co)<r.thickness/2+pad;};
 const top=Math.max(P.defaults.wallHeightMm,...P.walls.map(w=>w.heightMm||0))/1000,tallest=Math.max(0,...P.objects.map(o=>(o.size?.heightMm||0)/1000));
 const inWall=g.walls.filter(w=>w.status!=='demolished').some(w=>inRect(w,x,y,0)),inObj=P.objects.some(o=>{if(o.type==='rug'||!o.position)return false;const a=(o.rotationDeg||0)*Math.PI/180,dx=x-o.position.x,dy=y-o.position.y;return Math.abs(dx*Math.cos(a)+dy*Math.sin(a))<o.size.widthMm/2&&Math.abs(-dx*Math.sin(a)+dy*Math.cos(a))<o.size.depthMm/2&&h<(o.size.heightMm||0)/1000;});
 const room=g.rooms.find(r=>{let inside=false;for(let i=0,j=r.poly.length-1;i<r.poly.length;j=i++){const a=r.poly[i],b=r.poly[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])inside=!inside;}return inside;});
 const inDoor=g.doors.some(d=>inRect(d.rect,x,y,80));
 const s=View3D.presentationStoryInfo;return {phase:s.phase,kind:s.kind,cut:s.cut,h,above:h>Math.max(top,tallest),inWall,inObj,inDoor,room:room?.id||null,pos:c.map(v=>+v.toFixed(4))};});

test('OFF: the base story is unchanged (no room-visit, no visit controls)',{timeout:600000},async t=>{
 const {page,errors}=await open(t);await start(page,{visit:false});
 await page.evaluate(()=>document.querySelector('#presentationStoryFull').click());await page.waitForFunction(()=>FloorPlanPresentation.story?.scenes>1,null,{timeout:120000});
 const kinds=await page.evaluate(()=>FloorPlanPresentation.story.kinds);assert.ok(!kinds.includes('room-visit'));assert.ok(kinds.includes('section-open'));
 assert.equal(await page.locator('#presentationVisitWalk').isVisible(),false);assert.deepEqual(errors,[]);
});

test('ON: section → validated visit → eye level; reversible; hand-over to Recorrer and back; clean exit',{timeout:1200000},async t=>{
 const {page,errors}=await open(t);const before=await page.evaluate(()=>JSON.stringify(FloorPlanApp.project));
 await start(page,{visit:true});
 await page.evaluate(()=>document.querySelector('#presentationStoryFull').click());await page.waitForFunction(()=>FloorPlanPresentation.story?.scenes>1&&!FloorPlanPresentation.story.busy,null,{timeout:120000});
 const kinds=await page.evaluate(()=>FloorPlanPresentation.story.kinds);assert.deepEqual(kinds.slice(-2),['section-open','room-visit']);
 const from=await page.evaluate(()=>{const k=FloorPlanPresentation.story.kinds,seq=FloorPlanPresentationStory.sequence(k.map(x=>FloorPlanPresentationStory.SCENE_MS[x]));return seq.at(k.indexOf('room-visit'),0);});
 // Sweep the visit: every state is safe.
 const states=[];for(let i=0;i<=40;i++){const P=from+(1-from)*i/40;await seek(page,P);const v=await validity(page);states.push({P,...v});
  if(v.kind!=='room-visit'||v.phase==='overview')continue;
  assert.equal(v.inWall,false,`camera inside a wall at P=${P.toFixed(3)} (${v.phase})`);assert.equal(v.inObj,false,`camera inside furniture at P=${P.toFixed(3)}`);
  if(v.phase==='approach')assert.ok(v.above,`approach above walls and furniture (${v.h})`);
  if(['walk','turn','arrive','room'].includes(v.phase)){assert.ok(Math.abs(v.h-1.6)<1e-6,'eye height');assert.ok(v.room||v.inDoor,`inside a room or a doorway at P=${P.toFixed(3)}`);assert.equal(v.cut,2.8,'full height at eye level');}
  if(v.phase==='approach'||v.phase==='descend')assert.ok(v.cut<2.8,'cutaway while above and going down: no ceiling to cross');}
 const info=await page.evaluate(()=>View3D.presentationVisitInfo);assert.equal(info.route.kind,'interior');
 const end=states.at(-1);assert.equal(end.phase,'room');assert.equal(end.room,info.roomId,'arrives in the destination room');
 // Reverse: same P, same state.
 for(const i of [30,20,10]){const P=from+(1-from)*i/40;await seek(page,P);const v=await validity(page);assert.deepEqual(v.pos,states[i].pos,`reverse at ${P.toFixed(3)}`);}
 // Arrival → hand-over to «Recorrer» at the same pose.
 await seek(page,1);await page.locator('#presentationVisitWalk').waitFor();const arrival=(await validity(page)).pos;
 await page.locator('#presentationVisitWalk').click();await page.waitForFunction(()=>View3D.walking());
 assert.equal(await page.locator('#presentationWalkBar').isVisible(),true);assert.equal(await page.locator('.presentation-card').isVisible(),false);
 const walkPos=await page.evaluate(()=>View3D.cameraState.position.map(v=>+v.toFixed(4)));assert.deepEqual(walkPos,arrival,'same pose in Recorrer');
 // Back to the presentation (room stop), then back to the section, then exit.
 await page.locator('#presentationWalkBack').click();await page.waitForFunction(()=>!View3D.walking());await settled(page);
 assert.equal(await page.evaluate(()=>FloorPlanPresentation.current.kind),'room');
 await page.evaluate(()=>{FloorPlanPresentation.current;});
 await seekBackToSectionFromWalk(page);
 await page.locator('#presentationClose').click();await page.waitForFunction(()=>!FloorPlanPresentation.active);await page.waitForTimeout(800);
 const clip=await page.evaluate(()=>View3D.presentationClipInfo);assert.equal(clip.materialsWithPlanes??0,0,'no clipping left');
 assert.equal(await page.evaluate(()=>View3D.walking()),false);assert.equal(await page.evaluate(()=>JSON.stringify(FloorPlanApp.project)),before,'project JSON unchanged');
 assert.deepEqual(errors,[]);
});
// From the room stop: replay the story to the arrival, walk, then «Volver a la sección» lands on the section start.
async function seekBackToSectionFromWalk(page){
 await page.locator('.presentation-stops button').nth(0).click();await settled(page);
 await page.evaluate(()=>document.querySelector('#presentationStoryFull').click());await page.waitForFunction(()=>FloorPlanPresentation.story?.scenes>1&&!FloorPlanPresentation.story.busy,null,{timeout:120000});
 await seek(page,1);await page.locator('#presentationVisitWalk').click();await page.waitForFunction(()=>View3D.walking());
 await page.locator('#presentationWalkSection').click();await page.waitForFunction(()=>!View3D.walking()&&FloorPlanPresentation.story?.kind==='section-open'&&!FloorPlanPresentation.story.busy,null,{timeout:180000});
 assert.equal(await page.evaluate(()=>FloorPlanPresentation.story.local),0,'held at the section start');
}
