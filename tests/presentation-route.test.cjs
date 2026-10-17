const {test}=require('node:test'),assert=require('node:assert/strict');
const Route=require('../js/presentation-route.js'),Core=require('../js/project-core.js'),reference=require('../js/reference-project.js');
const rect=(x,y,spanMm,thickness,angle=0)=>({center:[x,y],spanMm,thickness,angle});
const room={id:'target',poly:[[0,0],[4000,0],[4000,4000],[0,4000]],counted:true,at:[3700,3700]};
const fixture=()=>({rooms:[structuredClone(room)],doors:[{id:'entry',entry:true,rect:rect(200,200,800,180)}],walls:[],windows:[],slides:[],envelope:{x:0,y:0,w:4000,h:4000}});
const project=()=>({objects:[]});
const segmentsSafe=(points,obstacles,clearance)=>points.every((p,i)=>{if(!i)return true;const a=points[i-1],n=Math.ceil(Math.hypot(p.x-a.x,p.y-a.y)/80);for(let k=0;k<=n;k++){const x=a.x+(p.x-a.x)*k/n,y=a.y+(p.y-a.y)*k/n;for(const w of obstacles){const dx=x-w.center[0],dy=y-w.center[1],c=Math.cos(w.angle),s=Math.sin(w.angle);if(Math.abs(dx*c+dy*s)<w.spanMm/2+clearance&&Math.abs(-dx*s+dy*c)<w.thickness/2+clearance)return false;}}return true;});

test('M18 reference home finds an interior path to the main bedroom and declares unreachable rooms aerial',()=>{
 const geometry=Core.geometry(reference),bedroom=Route.plan(reference,geometry,'rom_master'),kitchen=Route.plan(reference,geometry,'rom_kitchen');
 assert.equal(bedroom.kind,'interior');assert.ok(bedroom.points.length>=2);assert.ok(bedroom.lengthMm>1000);assert.ok(bedroom.visited>0);assert.equal(bedroom.clearanceMm,220);
 assert.equal(kitchen.kind,'aerial');assert.match(kitchen.reason,/recorrido aéreo/);assert.equal(kitchen.points.length,2);
});
test('M18 interpolated path rounds a diagonal wall with clearance',()=>{
 const geometry=fixture(),wall=rect(2000,2000,3400,180,-Math.PI/4);geometry.walls=[wall];
 const result=Route.plan(project(),geometry,'target');assert.equal(result.kind,'interior');assert.ok(result.points.length>=3);assert.ok(segmentsSafe(result.points,[wall],220));
});
test('M18 uses a door opening and reports the door visual to open',()=>{
 const geometry=fixture();geometry.doors=[{id:'entry',entry:true,rect:rect(200,2000,800,180)},{id:'passage',entry:false,rect:rect(2000,2000,800,180,Math.PI/2)}];
 geometry.walls=[rect(2000,800,1600,180,Math.PI/2),rect(2000,3200,1600,180,Math.PI/2)];geometry.rooms[0].at=[3700,2000];
 const result=Route.plan(project(),geometry,'target');assert.equal(result.kind,'interior');assert.ok(result.doorIds.includes('passage'));assert.ok(segmentsSafe(result.points,geometry.walls,220));
});
test('M18 concave room follows the floor polygon instead of its bounding box',()=>{
 const geometry=fixture();geometry.rooms[0].poly=[[0,0],[4000,0],[4000,1500],[1500,1500],[1500,4000],[0,4000]];geometry.rooms[0].at=[500,3700];geometry.doors[0].rect=rect(3700,500,800,180);
 const result=Route.plan(project(),geometry,'target');assert.equal(result.kind,'interior');assert.ok(result.points.length>=3);
 const inside=(x,y)=>x>=0&&y>=0&&(x<=1500||y<=1500);
 for(let i=1;i<result.points.length;i++){const a=result.points[i-1],b=result.points[i],n=Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)/80);for(let k=0;k<=n;k++){const t=k/n;assert.ok(inside(a.x+(b.x-a.x)*t,a.y+(b.y-a.y)*t));}}
});
test('M18 furniture barrier, missing entrance and search budget produce explicit alternatives',()=>{
 const geometry=fixture(),p=project();p.objects=[{type:'wardrobe',position:{x:2000,y:2000},size:{widthMm:4000,depthMm:4000},rotationDeg:27}];
 assert.equal(Route.plan(p,geometry,'target').kind,'aerial');assert.equal(Route.plan(project(),geometry,'target',{maxCells:5}).kind,'aerial');
 geometry.doors[0].height=1.5;assert.equal(Route.plan(project(),geometry,'target').kind,'unavailable');
 geometry.doors=[];const unavailable=Route.plan(project(),geometry,'target');assert.equal(unavailable.kind,'unavailable');assert.match(unavailable.reason,/entrada/);
});
