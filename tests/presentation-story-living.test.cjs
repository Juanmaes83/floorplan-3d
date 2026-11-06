/* Hybrid V2 «Dibujo vivo» — the story narrative (pure): overview → rooms, camera leaving before 100 %, C¹ path,
   exact seek/reverse, reduced motion holding each room, free region of the card, failures without inputs. */
const {test}=require('node:test'),assert=require('node:assert/strict');
const S=require('../js/presentation-story-core.js'),L=require('../js/presentation-living-drawing-core.js'),Core=require('../js/project-core.js'),reference=require('../js/reference-project.js');
const geometry=Core.geometry(reference),OX=geometry.rooms.length?5925:0,OY=5280;
function build({order=['rom_living','rom_dining','rom_kitchen','rom_master'],reduced=false,region=[0,0,.62,1],aspect=1.6}={}){
 const tl=L.timeline(reference,geometry,{order,reduced}),intro=4.5;
 const rooms=tl.rooms.map(r=>{const g=geometry.rooms.find(x=>x.id===r.roomId),xs=g.poly.map(p=>p[0]),ys=g.poly.map(p=>p[1]);
  return {id:r.roomId,center:[((Math.min(...xs)+Math.max(...xs))/2-OX)/1000,((Math.min(...ys)+Math.max(...ys))/2-OY)/1000],extent:[(Math.max(...xs)-Math.min(...xs))/1000,(Math.max(...ys)-Math.min(...ys))/1000],start:intro+r.start,duration:r.duration,leaveAt:intro+r.leaveAt};});
 return {tl,n:S.create('living-drawing',{start:{position:[9,15,11],target:[0,0,0],fov:45},rooms,houseCenter:[0,0],total:intro+tl.total+1.6,intro,aspect,region,fov:48,reduced,base:{near:.05,far:300}})};
}

test('HV2-C3 the living drawing opens on the overview, visits every room in order and ends in the last one',()=>{
 const {n,tl}=build();assert.equal(n.kind,'living-drawing');
 const a=n.stateAt(0);assert.equal(a.phase,'intro');assert.deepEqual(a.position,[9,15,11]);assert.equal(a.roomId,null);
 const seen=[];for(let i=0;i<=400;i++){const s=n.stateAt(i/400);if(s.roomId&&seen[seen.length-1]!==s.roomId)seen.push(s.roomId);}
 assert.deepEqual(seen,tl.rooms.map(r=>r.roomId));
 const end=n.stateAt(1);assert.equal(end.roomId,'rom_master');assert.equal(end.phase,'room');
 assert.ok(['position','target'].every(k=>end[k].every(Number.isFinite)));
});

test('HV2-C3 the camera leaves each room before it is complete (leaving phase inside the room, not after it)',()=>{
 const {n}=build(),info=n.info;
 for(const r of info.rooms.slice(0,-1)){const s=n.stateAt((r.leaveAt+.05)/info.total);assert.equal(s.roomId,r.id);assert.equal(s.phase,'leaving');assert.ok(r.leaveAt<r.end-.5,'leaves at least half a second before the room ends');}
});

test('HV2-C3 the path is continuous in position and speed (no jump at any key) and stays above the furniture',()=>{
 const {n}=build(),T=n.info.total,N=2400;let prev=null,prevV=null,maxDv=0,maxV=0,minY=1e9;
 for(let i=0;i<=N;i++){const s=n.stateAt(i/N);minY=Math.min(minY,s.position[1]);
  if(prev){const v=Math.hypot(...s.position.map((x,k)=>x-prev.position[k]))/(T/N);maxV=Math.max(maxV,v);if(prevV!==null)maxDv=Math.max(maxDv,Math.abs(v-prevV));prevV=v;}prev=s;}
 assert.ok(maxDv<.12,`speed changes smoothly between frames (max Δv ${maxDv.toFixed(3)} m/s per sample)`);
 assert.ok(maxV<6,`no rush (max ${maxV.toFixed(2)} m/s)`);
 assert.ok(minY>=3.2,`camera well above every piece of furniture (≤ 2.4 m) (min y ${minY.toFixed(2)})`);
});

test('HV2-C3 seek and reverse give the same state; reduced motion holds each room and never travels inside it',()=>{
 const {n}=build(),ps=[0,.07,.21,.38,.5,.66,.83,1];
 assert.deepEqual(ps.map(p=>n.stateAt(p)),ps.slice().reverse().map(p=>n.stateAt(p)).reverse());
 const {n:r}=build({reduced:true});
 for(const room of r.info.rooms){const a=r.stateAt((room.start+.2)/r.info.total),b=r.stateAt((room.end-.2)/r.info.total);assert.deepEqual(a.position,b.position,'held view');assert.notEqual(a.phase,'leaving');}
 r.info.rooms.forEach((room,i)=>{const e=r.stateAt(room.end/r.info.total);assert.equal(e.roomIndex,i,'the hold at a room\'s end shows that room, complete');assert.deepEqual(e.position,r.stateAt((room.start+.2)/r.info.total).position);});
});

test('HV2-C3 the free region of the card shifts the aim, never the camera position; phones lift the camera',()=>{
 const wide=build({region:[0,0,1,1]}).n,card=build({region:[0,0,.62,1]}).n,phone=build({region:[0,0,1,.5],aspect:.46}).n,p=.3;
 assert.deepEqual(card.stateAt(p).position,wide.stateAt(p).position);assert.notDeepEqual(card.stateAt(p).target,wide.stateAt(p).target);
 assert.ok(phone.stateAt(p).position[1]>wide.stateAt(p).position[1],'higher on a portrait phone');
});

test('HV2-C3 without an overview pose or rooms the narrative refuses instead of inventing a view',()=>{
 assert.throws(()=>S.create('living-drawing',{start:null,rooms:[{id:'a',center:[0,0],start:0,duration:5,leaveAt:4}]}),/vista general/);
 assert.throws(()=>S.create('living-drawing',{start:{position:[0,9,9],target:[0,0,0],fov:45},rooms:[]}),/al menos una estancia/);
 assert.ok(S.NARRATIVES.includes('living-drawing'));assert.ok(S.SCENE_MS['living-drawing']>0);
});

test('HV2-C3 projected with a real camera, the room lands in the free region of the screen (never under the card)',()=>{
 const sub=(a,b)=>a.map((v,i)=>v-b[i]),dot=(a,b)=>a.reduce((n,v,i)=>n+v*b[i],0),nrm=a=>{const l=Math.hypot(...a);return a.map(v=>v/l);},cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
 const screen=(s,point,aspect)=>{const f=nrm(sub(s.target,s.position)),r=nrm(cross(f,[0,1,0])),u=cross(r,f),q=sub(point,s.position),z=dot(q,f),tV=Math.tan(s.fov*Math.PI/360);
  return [(dot(q,r)/z/(tV*aspect)+1)/2,(1-dot(q,u)/z/tV)/2];};
 for(const [region,aspect] of [[[0,0,.62,1],1.6],[[0,0,1,.5],.46]]){const {n}=build({region,aspect});
  for(const room of n.info.rooms){const s=n.stateAt((room.start+1.5)/n.info.total),g=build().tl.rooms.find(r=>r.roomId===room.id);
   const c=s.position&&geometry.rooms.find(r=>r.id===room.id),xs=c.poly.map(p=>p[0]),ys=c.poly.map(p=>p[1]);
   const [x,y]=screen(s,[((Math.min(...xs)+Math.max(...xs))/2-OX)/1000,0,((Math.min(...ys)+Math.max(...ys))/2-OY)/1000],aspect);
   assert.ok(g&&x>=region[0]&&x<=region[2]&&y>=region[1]&&y<=region[3],`${room.id} centre at (${x.toFixed(2)}, ${y.toFixed(2)}) inside the free region ${region}`);}}
});

test('HV2-C3 the camera never stands right behind a tall dark piece; long glides between rooms rise above the drawing',()=>{
 const rooms=[{id:'a',center:[0,0],extent:[4,4],start:5,duration:6,leaveAt:9.5},{id:'b',center:[4.5,0],extent:[4,4],start:11,duration:6,leaveAt:15},{id:'c',center:[4.5,9],extent:[4,4],start:17,duration:6,leaveAt:21}];
 const make=obstacles=>S.create('living-drawing',{start:{position:[9,15,11],target:[0,0,0],fov:45},rooms,houseCenter:[2,3],obstacles,total:24,intro:5,aspect:1.6,region:[0,0,1,1],fov:48,base:{near:.05,far:300}});
 const clear=make([]),at=(n,t)=>n.stateAt(t/24);
 const p=at(clear,6.5).position;
 const blocked=make([{x:(p[0]+0)/2,z:(p[2]+0)/2,h:1.7,dark:true},{x:p[0],z:p[2],h:1.7,dark:true}]);
 assert.notDeepEqual(at(blocked,6.5).position,p,'another standpoint is chosen when a tall dark piece stands between the camera and the room');
 // a → b: the standpoints are far apart (more than transitMin), so the glide between them rises above both
 const yA=at(clear,9.5).position[1],yB=at(clear,11.6).position[1],mid=Math.max(...Array.from({length:22},(_,k)=>at(clear,9.5+k*.1).position[1]));
 assert.ok(mid>Math.max(yA,yB)+1,`arc over the drawing (peak ${mid.toFixed(2)} vs ${Math.max(yA,yB).toFixed(2)})`);
});
