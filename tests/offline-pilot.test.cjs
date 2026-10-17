'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),{spawnSync}=require('node:child_process');
const Shots=require('../scripts/offline-pilot/shots.cjs'),Fixture=require('../scripts/offline-pilot/irregular-fixture.cjs'),Core=require('../js/project-core.js'),reference=require('../js/reference-project.js');
const DEG=Math.PI/180,rooms=['rom_mbath','rom_gbath','rom_hall','rom_living'];
const plans=new Map(),plan=(p,ids)=>{const k=p.id+ids;if(!plans.has(k))plans.set(k,Shots.compose(p,{rooms:ids}));return plans.get(k);};
const inside=(x,y,poly)=>{let c=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const [ax,ay]=poly[i],[bx,by]=poly[j];if((ay>y)!==(by>y)&&x<(bx-ax)*(y-ay)/(by-ay)+ax)c=!c;}return c;};
const seg=(px,py,[ax,ay],[bx,by])=>{const dx=bx-ax,dy=by-ay,l=dx*dx+dy*dy,t=l?Math.max(0,Math.min(1,((px-ax)*dx+(py-ay)*dy)/l)):0;return Math.hypot(px-ax-t*dx,py-ay-t*dy);};
// Independent obstacle set: solid wall parts and window sills from Core.geometry, at camera height.
function solids(p,eye=1350){const g=Core.geometry(p);return [...g.walls.filter(w=>w.status!=='demolished').map(w=>w.poly),...[...g.windows,...g.voids].filter(o=>o.sill*1000>200&&o.sill*1000<eye+50).map(o=>o.poly)];}
function clearance(polys,x,y){let m=Infinity;for(const poly of polys){if(inside(x,y,poly))return 0;for(let i=0;i<poly.length;i++)m=Math.min(m,seg(x,y,poly[i],poly[(i+1)%poly.length]));}return m;}

for(const [name,project] of [['example',reference],['synthetic rotated 30°',Fixture.rotated(30).project]]){
 test(`${name}: every shot stays clear of walls on the densely interpolated path, at eye height, looking slightly down`,()=>{
  const before=JSON.stringify(project),r=plan(project,rooms),polys=solids(project);assert.equal(JSON.stringify(project),before,'project untouched');
  assert.equal(r.shots.length,rooms.length);
  for(const s of r.shots){assert.equal(s.status,'ok',s.roomId);let min=Infinity;
   for(let i=1;i<s.samples.length;i++){const a=s.samples[i-1],b=s.samples[i];for(let k=0;k<=10;k++){const x=a.x+(b.x-a.x)*k/10,y=a.y+(b.y-a.y)*k/10;min=Math.min(min,clearance(polys,x,y));}}
   assert.ok(min>=200,`${s.roomId} wall clearance ${min.toFixed(0)} mm`);
   assert.equal(s.eyeHeightMm,1350);for(const p of s.samples){assert.ok(p.pitch>=5*DEG-1e-9&&p.pitch<=18*DEG+1e-9,s.roomId+' pitch');}
   const sp=s.samples.slice(1).map((p,i)=>Math.hypot(p.x-s.samples[i].x,p.y-s.samples[i].y)/1000*s.fps),max=Math.max(...sp);
   assert.ok(max<=0.4,`${s.roomId} ${max} m/s`);if(max>0){assert.ok(sp[0]<max*.2&&sp.at(-1)<max*.2,s.roomId+' starts and stops with a ramp');}
   const turn=s.samples.slice(1).map((p,i)=>Math.abs(Math.atan2(Math.sin(p.yaw-s.samples[i].yaw),Math.cos(p.yaw-s.samples[i].yaw)))/DEG*s.fps);assert.ok(Math.max(...turn)<=12,s.roomId+' pan speed');
   assert.equal(s.frames,s.samples.length);assert.equal(s.blender.length,s.frames);}
  // Hard cuts between rooms: consecutive shots start where the timeline says, no frames in between.
  for(let i=1;i<r.shots.length;i++)assert.equal(r.shots[i].startFrame,r.shots[i-1].startFrame+r.shots[i-1].frames);
 });
 test(`${name}: the en-suite bath shot shows the bath and its three fixtures, not the bedroom`,()=>{
  const s=plan(project,rooms).shots.find(s=>s.roomId==='rom_mbath');
  for(const a of s.anchors){const other=Math.max(0,...Object.entries(a.share).filter(([k])=>!['rom_mbath','void','outside'].includes(k)).map(([,v])=>v));
   assert.ok((a.share.rom_mbath||0)>=.6,'bath share '+a.share.rom_mbath);assert.ok(other<.2&&other<(a.share.rom_mbath||0)/3,'neighbour '+other);assert.ok(a.nearSurface<=.15,'near surface '+a.nearSurface);}
  assert.deepEqual(s.anchors.at(-1).objectsSeen.sort(),s.contents.slice().sort());
 });
}

test('composition is deterministic and the Blender mapping matches the PR #24 exporter frame',()=>{
 const a=Shots.compose(reference,{rooms:['rom_mbath']}),b=Shots.compose(reference,{rooms:['rom_mbath']});assert.equal(JSON.stringify(a),JSON.stringify(b));
 const c=Core.geometry(reference).center,s=a.shots[0],p=s.samples[0],q=s.blender[0];
 assert.deepEqual(a.coordinateMapping.centerMm,c);
 assert.ok(Math.abs(q.location[0]-(p.x-c.x)/1000)<1e-9&&Math.abs(q.location[1]+(p.y-c.y)/1000)<1e-9&&q.location[2]===1.35);
 assert.ok(Math.abs(Math.hypot(...q.direction)-1)<1e-9&&q.direction[2]<0);
});

test('the synthetic second case is declared, valid and has no axis-aligned wall',()=>{
 const {project,trimmed}=Fixture.rotated(30);assert.match(project.id,/synthetic/);assert.doesNotThrow(()=>Core.validate(project));
 for(const w of project.walls){const a=Math.atan2(w.end.y-w.start.y,w.end.x-w.start.x)/DEG%90;assert.ok(Math.min(Math.abs(a),90-Math.abs(a))>5,w.id);}
 for(const t of trimmed)assert.ok(t.fromMm-t.toMm<=2,t.id);
 assert.equal(project.objects.length,reference.objects.length);
});

test('offline pilot end to end in Blender (anchors only)',{skip:!process.env.BPY_PYTHON&&'set BPY_PYTHON to a Python with bpy 5.2'},()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'pilot-')),src=path.join(dir,'project.json'),out=path.join(dir,'run');fs.writeFileSync(src,JSON.stringify(reference));
 const r=spawnSync(process.execPath,[require.resolve('../scripts/offline-pilot/run.cjs'),src,out,'--python',process.env.BPY_PYTHON,'--rooms','rom_mbath','--frames','anchors','--samples','4','--resolution','320x180'],{encoding:'utf8',timeout:900000});
 assert.equal(r.status,0,r.stdout+r.stderr);const run=JSON.parse(fs.readFileSync(path.join(out,'run.json')));assert.equal(run.status,'complete');assert.equal(run.project.unchanged,true);
 assert.equal(JSON.parse(fs.readFileSync(path.join(out,'reopen-report.json'))).status,'PASS');
 const rep=JSON.parse(fs.readFileSync(path.join(out,'render','render-report.json')));for(const p of rep.presence){assert.ok(p.targetShare>=.6);assert.ok(p.largestOtherShare<p.targetShare/3);}
 assert.equal(spawnSync(process.execPath,[require.resolve('../scripts/offline-pilot/run.cjs'),src,out,'--python',process.env.BPY_PYTHON]).status,1,'refuses to overwrite');
});
