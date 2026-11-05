/* FT3D-8 FIDELITY (Phase D) in real Chromium. Reference = the REAL RUBIK editor (index.html, unmodified) with the
   same project imported through FloorPlanApp.importProjectFile and framed with View3D.presentationRestoreView.
   Candidate = labs/ft3d-8 (fidelity lab) at the final plan state, same camera pose and canvas size.
   Checks, strongest first:
   1. structural vs the editor's read-only APIs: door hinges/angles (View3D.doorLeaves), roof surfaces
      (View3D.roofInfo), level groups (View3D.levelInspect) — exact within 1 mm;
   2. structural vs canonical geometry computed here in Node from FloorPlanCore.geometry: every rendered element and
      its world box, no extra element;
   3. image: silhouette IoU and edge agreement (secondary; lighting/shadows/AA differ by design, see tolerances).
   Evidence (PNG + WebM) goes to FT3D8_FIDELITY_SHOTS. */
const {test,before,after}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs/promises'),path=require('node:path'),{createServer}=require('node:http'),{chromium}=require('playwright');
const Core=require('../js/project-core.js'),A=require('../js/construction-project-adapter.js'),V=require('../js/construction-visual-state.js');
const F=require('../labs/ft3d-8/fidelity-fixtures.js');
const root=path.resolve(__dirname,'..'),shots=process.env.FT3D8_FIDELITY_SHOTS||null;
const TYPES={'.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.html':'text/html','.json':'application/json','.png':'image/png','.webp':'image/webp',
  '.glb':'model/gltf-binary','.svg':'image/svg+xml','.wasm':'application/wasm','.jpg':'image/jpeg','.hdr':'application/octet-stream'};
const CANVAS='884x627';
// Tolerances (documented in docs/product/ft3d-8-fidelidad-evidencias-2026-11-05.md).
const TOL={mm:1,angle:1e-3,boxM:.002,iou:.80,edges:.55};
let server,browser,base;
before(async()=>{
  server=createServer(async(req,res)=>{try{let p=new URL(req.url,'http://local').pathname;if(p.endsWith('/'))p+='index.html';
    const file=path.resolve(root,'.'+decodeURIComponent(p));if(!file.startsWith(root+path.sep))throw Error('path');
    res.setHeader('Content-Type',TYPES[path.extname(file)]||'application/octet-stream');res.end(await fs.readFile(file));}catch{res.statusCode=404;res.end();}});
  await new Promise(r=>server.listen(0,'127.0.0.1',r));base=`http://127.0.0.1:${server.address().port}/`;
  browser=await chromium.launch({...(process.env.CHROME?{executablePath:process.env.CHROME}:{}),args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
  if(shots)await fs.mkdir(shots,{recursive:true});
});
after(async()=>{await browser?.close();await new Promise(r=>server?.close(r));});
const save=async(name,buf)=>{if(shots)await fs.writeFile(path.join(shots,name),buf);};
const watch=(page,errors,external)=>{page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error'&&!/^Failed to load resource/.test(m.text()))errors.push(m.text());});
  page.on('response',r=>{if(r.status()>=400&&!/favicon\.ico$/.test(r.url()))errors.push(`HTTP ${r.status()} ${r.url()}`);});
  page.on('request',r=>{if(!r.url().startsWith(base)&&!r.url().startsWith('data:')&&!r.url().startsWith('blob:'))external.push(r.url());});};

/* Expected world AABB of every element, computed here from the canonical inventory (Node, no Three). */
function expectedBoxes(inv,{roof}){
  const out={},o=inv.origin,lv=new Map(inv.levels.map(l=>[l.levelId,l]));
  const grow=(b,x,y,z)=>{b.min=[Math.min(b.min[0],x),Math.min(b.min[1],y),Math.min(b.min[2],z)];b.max=[Math.max(b.max[0],x),Math.max(b.max[1],y),Math.max(b.max[2],z)];};
  // Final plan state = the project as drawn: demolished walls are gone (the editor does not draw them either).
  for(const e of inv.elements){if(!e.representable||(e.type==='roof'&&!roof)||e.lifecycle==='demolished')continue;const l=lv.get(e.levelId),b={min:[Infinity,Infinity,Infinity],max:[-Infinity,-Infinity,-Infinity]};
    const W=(x,y)=>[(x+l.offsetMm.x-o.x)/1000,(y+l.offsetMm.y-o.y)/1000],Y=v=>l.elevationMm/1000+v;
    if(e.type==='wall'){for(const p of e.pieces){if(p.ytMm-p.ybMm<=1)continue;const [cx,cz]=W(p.center[0],p.center[1]),c=Math.cos(p.angle),s=Math.sin(p.angle),hx=p.spanMm/2000,hz=p.thicknessMm/2000;
      for(const [u,v] of [[-hx,-hz],[hx,-hz],[hx,hz],[-hx,hz]])for(const y of [Y(p.ybMm/1000),Y(p.ytMm/1000)])grow(b,cx+u*c-v*s,y,cz+u*s+v*c);}}
    else if(e.type==='floor'){for(const p of e.polygon){const [x,z]=W(p.x,p.y);grow(b,x,Y(.006),z);}}
    else if(e.type==='slab'){for(const poly of e.polygons)for(const p of poly){const [x,z]=W(p.x,p.y);grow(b,x,Y(-e.thicknessMm/1000-.002),z);grow(b,x,Y(-.002),z);}}
    else if(e.type==='roof'){for(const s of e.surfaces)for(const p of s.polygon){const [x,z]=W(p.x,p.y);grow(b,x,(s.elevationMm+2)/1000,z);}}
    else continue; // openings/doors: checked against the editor's own door data instead
    out[e.key]=b;}
  return out;
}
/* Image comparison run inside a page (Canvas 2D only). */
async function compareImages(page,a,b){
  return page.evaluate(async([a,b])=>{
    const load=src=>new Promise(r=>{const i=new Image();i.onload=()=>r(i);i.src=src;});
    const [ia,ib]=await Promise.all([load(a),load(b)]),w=ia.width,h=ia.height;
    const px=img=>{const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');g.drawImage(img,0,0,w,h);return g.getImageData(0,0,w,h).data;};
    const da=px(ia),db=px(ib);
    const mask=d=>{const border=[];for(let x=0;x<w;x+=7){border.push(x*4,((h-1)*w+x)*4);}for(let y=0;y<h;y+=7){border.push(y*w*4,(y*w+w-1)*4);}
      const med=k=>{const v=border.map(i=>d[i+k]).sort((p,q)=>p-q);return v[v.length>>1];},bg=[med(0),med(1),med(2)],m=new Uint8Array(w*h);
      for(let i=0;i<w*h;i++){const dr=d[i*4]-bg[0],dg=d[i*4+1]-bg[1],dbb=d[i*4+2]-bg[2];m[i]=Math.hypot(dr,dg,dbb)>22?1:0;}return m;};
    const ma=mask(da),mb=mask(db);let inter=0,uni=0;for(let i=0;i<w*h;i++){inter+=ma[i]&mb[i];uni+=ma[i]|mb[i];}
    // Edges of the silhouette masks (geometry outline), matched within 3 px.
    const edges=m=>{const e=new Uint8Array(w*h);for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){const i=y*w+x;if(m[i]&&(!m[i-1]||!m[i+1]||!m[i-w]||!m[i+w]))e[i]=1;}return e;};
    const ea=edges(ma),eb=edges(mb),near=(src,dst)=>{let n=0,hit=0;for(let y=3;y<h-3;y++)for(let x=3;x<w-3;x++){if(!src[y*w+x])continue;n++;let f=false;
      for(let dy=-3;dy<=3&&!f;dy++)for(let dx=-3;dx<=3&&!f;dx++)if(dst[(y+dy)*w+x+dx])f=true;if(f)hit++;}return n?hit/n:1;};
    const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d'),out=g.createImageData(w,h);
    for(let i=0;i<w*h;i++){const k=i*4;out.data[k+3]=255;const base=255-(ma[i]|mb[i])*30;out.data[k]=out.data[k+1]=out.data[k+2]=base;
      if(ea[i]){out.data[k]=220;out.data[k+1]=40;out.data[k+2]=40;}if(eb[i]){out.data[k]=eb[i]&&ea[i]?40:20;out.data[k+1]=ea[i]?160:150;out.data[k+2]=ea[i]?60:220;}}
    g.putImageData(out,0,0);
    return {iou:uni?inter/uni:1,edgesRefInLab:near(ea,eb),edgesLabInRef:near(eb,ea),pixelsRef:ma.reduce((s,v)=>s+v,0),pixelsLab:mb.reduce((s,v)=>s+v,0),overlay:c.toDataURL('image/png')};
  },[a,b]);
}
const dataUrl=buf=>'data:image/png;base64,'+buf.toString('base64');

for(const CASE of ['A','B','C'])
test(`fidelity vs real editor · case ${CASE}`,{timeout:300000},async t=>{
  const c=await F.build(CASE),inv=A.inventory(c.source),isBuilding=c.source.schema==='rubik-sota.floorplan-building',roof=CASE!=='C';
  const errors=[],external=[];
  // --- candidate: FT3D-8 fidelity lab
  const labCtx=await browser.newContext({viewport:{width:1440,height:900}});t.after(()=>labCtx.close());
  const lab=await labCtx.newPage();watch(lab,errors,external);
  await lab.goto(`${base}labs/ft3d-8/?case=${CASE}&capture=${CANVAS}`);await lab.waitForFunction(()=>document.body.classList.contains('ready'),null,{timeout:30000});
  const pose=await lab.evaluate(r=>{const f=window.__ft3dFidelity;f.setRoof(r);const p=f.frameEnvelope('iso');f.setPose(p);return p;},roof);
  for(const [k,fn] of [['01-start','reset'],['02-mid','mid'],['03-final','end']]){
    await lab.evaluate(fn=>{const f=window.__ft3dFidelity;if(fn==='reset')f.setPos(0);else if(fn==='mid')f.setPos(Math.round(f.timeline.positions*.5));else f.end();},fn);
    await lab.waitForTimeout(900);await save(`${CASE}-ft3d8-${k}.png`,await lab.locator('#stage').screenshot());
  }
  const last=await lab.evaluate(()=>window.__ft3dFidelity.last);
  assert.equal(last.stage,'final');
  // 2. structural vs canonical geometry: same element set, same world boxes, nothing extra.
  const got=await lab.evaluate(()=>window.__ft3dFidelity.inspect()),want=expectedBoxes(inv,{roof});
  const nonOpening=Object.keys(got).filter(k=>['wall','floor','roof','slab'].includes(got[k].type)).sort();
  assert.deepEqual(nonOpening,Object.keys(want).sort(),'rendered walls/floors/roofs = representable inventory');
  const representableOpenings=inv.elements.filter(e=>e.representable&&['window','door','sliding-door','opening'].includes(e.type)).map(e=>e.key).sort();
  assert.deepEqual(Object.keys(got).filter(k=>!['wall','floor','roof','slab'].includes(got[k].type)).sort(),representableOpenings.filter(k=>inv.elements.find(e=>e.key===k).type!=='opening'));
  for(const [k,b] of Object.entries(want))for(let i=0;i<3;i++){
    assert.ok(Math.abs(got[k].min[i]-b.min[i])<=TOL.boxM&&Math.abs(got[k].max[i]-b.max[i])<=TOL.boxM,`${k} axis ${i}: ${got[k].min[i]}..${got[k].max[i]} vs ${b.min[i]}..${b.max[i]}`);}
  // --- reference: the real editor, same project, same pose
  const edCtx=await browser.newContext({viewport:{width:1440,height:900}});t.after(()=>edCtx.close());
  const ed=await edCtx.newPage();watch(ed,errors,[]);
  await ed.goto(base);await require('./editor-fixture.cjs')(ed);
  assert.equal(await ed.evaluate(async j=>FloorPlanApp.importProjectFile(new File([j],'fixture.json',{type:'application/json'})),JSON.stringify(c.source)),true);
  await ed.evaluate(()=>setView('3d'));await ed.waitForFunction(()=>FloorPlanApp.viewMode==='3d'&&!document.body.classList.contains('busy'),null,{timeout:120000});
  // Same action a person takes in the editor: «Ver todas» shows every level.
  if(isBuilding){await ed.locator('#levelViewAll').click();await ed.waitForFunction(()=>View3D.levelView==='all');}
  // The editor flies the camera after a level change; its pose API refuses calls until the flight ends.
  await ed.waitForFunction(()=>{try{View3D.presentationPose();return true;}catch{return false;}},null,{timeout:30000});
  await ed.evaluate(([p,r])=>{const v=View3D.presentationViewState();View3D.presentationRestoreView({...v,roof:r,pose:{...v.pose,position:p.position,target:p.target,fov:p.fov}});},[pose,roof]);
  await ed.addStyleTag({content:'#view3d > :not(canvas),#territoryLayers{visibility:hidden!important}'});
  await ed.waitForTimeout(1500);
  const edPose=await ed.evaluate(()=>View3D.presentationPose());
  for(let i=0;i<3;i++)assert.ok(Math.abs(edPose.position[i]-pose.position[i])<1e-6&&Math.abs(edPose.target[i]-pose.target[i])<1e-6,'same camera');
  const refShot=await ed.locator('#view3d canvas').first().screenshot();await save(`${CASE}-reference-editor.png`,refShot);
  // Same canvas size as the editor's (a building adds the level bar, so it is measured, not assumed).
  const size=await ed.evaluate(()=>{const r=document.querySelector('#view3d canvas').getBoundingClientRect();return [Math.round(r.width),Math.round(r.height)];});
  await lab.evaluate(([w,h])=>{const d=document.documentElement.style;d.setProperty('--capture-w',w+'px');d.setProperty('--capture-h',h+'px');window.dispatchEvent(new Event('resize'));},size);
  await lab.waitForTimeout(1200);
  const labShot=await lab.locator('#stage').screenshot();await save(`${CASE}-ft3d8-final-compare.png`,labShot);
  // 1. structural vs the editor's own read-only data
  const info=await ed.evaluate(()=>({doors:View3D.doorLeaves,roof:View3D.roofInfo,levels:View3D.levelInspect().levelGroups}));
  const labDoors=Object.entries(got).filter(([,v])=>v.pivot);
  assert.equal(labDoors.length,info.doors.length,'same number of door leaves');
  for(const d of info.doors){const mine=labDoors.find(([k])=>k.endsWith('/'+d.id));assert.ok(mine,'door '+d.id);
    // For buildings the editor frames the active level; our frame is level 0, which is the active level after import.
    assert.ok(Math.abs(mine[1].pivot.x-d.x)*1000<=TOL.mm&&Math.abs(mine[1].pivot.z-d.z)*1000<=TOL.mm,`door ${d.id} hinge`);
    const da=Math.atan2(Math.sin(mine[1].pivot.angle-d.open),Math.cos(mine[1].pivot.angle-d.open));assert.ok(Math.abs(da)<=TOL.angle,`door ${d.id} angle`);}
  assert.equal(info.roof.status,inv.roof.status);
  const roofArea=inv.elements.filter(e=>e.type==='roof').flatMap(e=>e.surfaces).map(s=>Math.abs(s.polygon.reduce((a,p,i,P)=>a+p.x*P[(i+1)%P.length].y-P[(i+1)%P.length].x*p.y,0)/2));
  assert.equal(info.roof.surfaces.length,roofArea.length,'same roof surfaces');
  assert.ok(Math.abs(info.roof.surfaces.reduce((s,x)=>s+x.areaMm2,0)-roofArea.reduce((s,x)=>s+x,0))<=1,'same roof area (mm²)');
  // View3D.levelInspect lists the levels other than the active one (level 0 after import), at their elevation.
  if(isBuilding)assert.deepEqual(info.levels.map(l=>[l.id,Math.round(l.y*1000)]),inv.levels.filter(l=>l.order>0).map(l=>[l.levelId,l.elevationMm]),'same level elevations');
  // 3. image agreement (secondary)
  const cmp=await compareImages(lab,dataUrl(refShot),dataUrl(labShot));
  await save(`${CASE}-overlay-reference-red-ft3d8-blue.png`,Buffer.from(cmp.overlay.split(',')[1],'base64'));
  const metrics={case:CASE,iou:+cmp.iou.toFixed(4),edgesRefInLab:+cmp.edgesRefInLab.toFixed(4),edgesLabInRef:+cmp.edgesLabInRef.toFixed(4),pixelsRef:cmp.pixelsRef,pixelsLab:cmp.pixelsLab,
    doors:info.doors.length,roofSurfaces:info.roof.surfaces.length,elementsChecked:Object.keys(want).length,tolerances:TOL};
  await save(`${CASE}-metrics.json`,Buffer.from(JSON.stringify(metrics,null,1)));
  t.diagnostic(JSON.stringify(metrics));
  assert.ok(cmp.iou>=TOL.iou,`silhouette IoU ${cmp.iou}`);
  assert.ok(Math.min(cmp.edgesRefInLab,cmp.edgesLabInRef)>=TOL.edges,`edge agreement ${cmp.edgesRefInLab}/${cmp.edgesLabInRef}`);
  assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
});

test('two projects render differently; the demo house is never used',{timeout:120000},async t=>{
  const ctx=await browser.newContext({viewport:{width:1440,height:900}});t.after(()=>ctx.close());
  const page=await ctx.newPage(),errors=[],external=[];watch(page,errors,external);
  await page.goto(`${base}labs/ft3d-8/?case=A`);await page.waitForFunction(()=>document.body.classList.contains('ready'));
  const a=await page.evaluate(async()=>{const f=window.__ft3dFidelity;await f.loadCase('A');f.end();return Object.keys(f.inspect()).sort();});
  const b=await page.evaluate(async()=>{const f=window.__ft3dFidelity;await f.loadCase('B');f.end();return Object.keys(f.inspect()).sort();});
  assert.notDeepEqual(a,b);assert.ok(a.every(k=>k.startsWith('project/')));assert.ok(b.some(k=>k.startsWith('lvl_fx-b1/')));
  for(const demo of ['crane','scaffold','site-fence','frame','roof-frame'])assert.ok(![...a,...b].some(k=>k.endsWith('/'+demo)),demo);
  assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
});

for(const viewport of [{width:1440,height:900},{width:390,height:844}])
test(`fidelity lab interaction ${viewport.width}x${viewport.height}`,{timeout:240000},async t=>{
  const name=`${viewport.width}x${viewport.height}`,mobile=viewport.width<900;
  const ctx=await browser.newContext({viewport,isMobile:mobile,hasTouch:mobile,...(shots&&!mobile?{recordVideo:{dir:shots,size:{width:1280,height:800}}}:{})});
  t.after(()=>ctx.close());
  const page=await ctx.newPage(),errors=[],external=[];watch(page,errors,external);
  await page.goto(`${base}labs/ft3d-8/?case=A`);await page.waitForFunction(()=>document.body.classList.contains('ready'),null,{timeout:30000});
  const f=(fn,arg)=>page.evaluate(([fn,arg])=>window.__ft3dFidelity[fn](arg),[fn,arg]);const last=()=>page.evaluate(()=>window.__ft3dFidelity.last);
  const c=await F.build('A'),tl=V.timeline(c.schedule);
  assert.match(await page.locator('#origin').innerText(),/FIXTURE/);
  assert.equal((await last()).date,tl.preStartDate);assert.deepEqual((await last()).presentElements,[]);
  await page.waitForTimeout(500);if(shots)await page.screenshot({path:path.join(shots,`${name}-A-01-inicio.png`)});
  // Play, pause, step back: scene and Gantt share the date.
  await page.locator('#play').click();await page.waitForTimeout(2500);await page.locator('#play').click();
  let s=await last();assert.ok(s.date>tl.preStartDate);assert.equal(s.ganttCursorDate,s.date);
  assert.deepEqual(s.activeTaskIds,V.frameAt(c.schedule,s.date).activeTaskIds);
  const before=s.date;await page.locator('#back').click();s=await last();assert.ok(s.date<before,'back moves backward');
  // Task change across a dependency and sync with the Gantt row highlight.
  s=await f('setDate','2027-10-14');assert.deepEqual(s.activeTaskIds,['tabiques','cubierta']);
  assert.deepEqual(await page.locator('#gantt .row[data-phase="in-progress"]').evaluateAll(r=>r.map(x=>x.dataset.task)),['tabiques','cubierta']);
  assert.match(await page.locator('#cardTasks').innerText(),/Presupuestado con partidas revisadas/);
  if(shots)await page.screenshot({path:path.join(shots,`${name}-A-02-desarrollo-gantt-coste.png`),fullPage:!mobile});
  s=await f('end');assert.equal(s.stage,'final');assert.match(await page.locator('#cardStage').innerText(),/FINAL/);
  if(shots)await page.screenshot({path:path.join(shots,`${name}-A-03-final.png`)});
  s=await f('setDate','2027-10-01');assert.ok(!s.presentElements.includes('project/roof'),'reversible: roof gone again');
  // Project change: C reform starts from the existing building.
  await page.locator('#caseSel').selectOption('C');await page.waitForFunction(()=>document.body.dataset.case==='C');
  s=await last();assert.equal(s.modes['project/wal_c-x0'],'pre-existing');assert.ok(s.presentElements.includes('project/wal_c-old'));
  assert.match(await page.locator('#coverage').innerText(),/repartos pendientes: opening:door 50%/);
  if(shots)await page.screenshot({path:path.join(shots,`${name}-C-reforma-inicio.png`)});
  // Missing data: D has no plan; nothing is invented.
  await page.locator('#caseSel').selectOption('D');await page.waitForFunction(()=>document.body.dataset.case==='D');
  assert.match(await page.locator('#gantt').innerText(),/PLANIFICACIÓN NO DISPONIBLE O PENDIENTE/);
  assert.match(await page.locator('#delivery').innerText(),/Vista interna exploratoria/);
  assert.match(await page.locator('#coverage').innerText(),/sin plan válido: no se reparte entre tareas/);
  assert.equal(await page.locator('.transport').getAttribute('data-disabled'),'true');
  if(shots)await page.screenshot({path:path.join(shots,`${name}-D-datos-insuficientes.png`),fullPage:!mobile});
  // Revision change: the professional's schedule no longer matches an edited project file.
  const edited=structuredClone(c.source);edited.walls[0].heightMm=2900;edited.updatedAt='2026-11-05T09:00:00Z';
  await page.evaluate(([p,s])=>window.__ft3dFidelity.importText(p,{scheduleText:s}),[JSON.stringify(edited),JSON.stringify(c.schedule)]);
  assert.match(await page.locator('#origin').innerText(),/importado localmente/);
  assert.match(await page.locator('#coverage').innerText(),/schedule-project-revision-obsolete/);
  assert.doesNotMatch(await page.locator('#delivery').innerText(),/Entrega profesional/);
  // Strict validation of a broken file, with an explanatory message.
  const bad=structuredClone(c.source);bad.walls[0].status='half-built';
  await page.locator('#fileInput').setInputFiles({name:'roto.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(bad))});
  await page.waitForFunction(()=>document.getElementById('importError').textContent.length>0);
  assert.match(await page.locator('#importError').innerText(),/Importación rechazada: .*status/);
  if(mobile)assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1),'no horizontal scroll on phones');
  assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
  if(shots&&!mobile){const v=page.video();await ctx.close();if(v)await fs.rename(await v.path(),path.join(shots,'ft3d8-fidelity-review.webm')).catch(()=>{});
    for(const f of await fs.readdir(shots))if(/^page@.*\.webm$/.test(f))await fs.rm(path.join(shots,f));}
});
