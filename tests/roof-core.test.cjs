const {test}=require('node:test'),assert=require('node:assert/strict');
const Roof=require('../js/roof-core.js'),Exterior=require('../js/exterior-core.js');
const Building=require('../js/building-core.js');
const fs=require('node:fs'),path=require('node:path');
const rect=(x0,y0,x1,y1)=>[{x:x0,y:y0},{x:x1,y:y0},{x:x1,y:y1},{x:x0,y:y1}];
const rectangle=rect(0,0,6000,4000);
const L=[{x:0,y:0},{x:6000,y:0},{x:6000,y:2000},{x:3000,y:2000},{x:3000,y:4000},{x:0,y:4000}];
const U=[{x:0,y:0},{x:7000,y:0},{x:7000,y:5000},{x:5000,y:5000},{x:5000,y:2000},{x:2000,y:2000},{x:2000,y:5000},{x:0,y:5000}];
function inset(poly,d=100){return poly.map((p,i)=>{
  const a=poly[(i+poly.length-1)%poly.length],b=poly[(i+1)%poly.length],u={x:p.x-a.x,y:p.y-a.y},v={x:b.x-p.x,y:b.y-p.y};
  const n1={x:-u.y/Math.hypot(u.x,u.y),y:u.x/Math.hypot(u.x,u.y)},n2={x:-v.y/Math.hypot(v.x,v.y),y:v.x/Math.hypot(v.x,v.y)};
  const q={x:p.x+n1.x*d,y:p.y+n1.y*d},r={x:p.x+n2.x*d,y:p.y+n2.y*d};
  const den=u.x*v.y-u.y*v.x,t=((r.x-q.x)*v.y-(r.y-q.y)*v.x)/den;
  return {x:q.x+t*u.x,y:q.y+t*u.y};
});}
function project(poly,{thickness=200,height=2800}={}){
  const walls=poly.map((p,i)=>({id:`wal_${i}`,start:p,end:poly[(i+1)%poly.length],thicknessMm:thickness,heightMm:height,structure:'exterior',status:'existing'}));
  return {id:'prj_synthetic',walls,rooms:[{id:'rom_main',polygon:inset(poly),floorMaterialId:'mat_floor',countsTowardArea:true}],openings:[],materials:[],defaults:{wallHeightMm:height}};
}
const round=n=>Math.round(n*1000)/1000;
test('rectangle footprint uses facade cycle and actual half-thickness, not envelope',()=>{
  const p=project(rectangle),before=JSON.stringify(p),f=Roof.footprint(p,Exterior);
  assert.equal(f.status,'available');assert.deepEqual(f.polygon,rect(-100,-100,6100,4100));
  assert.equal(f.areaMm2,6200*4200);assert.equal(f.topMm,2800);assert.equal(JSON.stringify(p),before);
});
test('L and U concavities remain simple and have correct exterior area',()=>{
  for(const poly of [L,U]){const f=Roof.footprint(project(poly),Exterior);assert.equal(f.status,'available',f.reason);assert.ok(f.areaMm2>Math.abs(Roof.area(poly)));assert.equal(Roof.canonical(f.polygon).status,'available');}
});
test('different wall thickness at orthogonal corners has bounded intersections',()=>{
  const p=project(rectangle);p.walls[1].thicknessMm=300;p.walls[3].thicknessMm=300;
  const f=Roof.footprint(p,Exterior);assert.equal(f.status,'available',f.reason);assert.equal(f.polygon.length,4);
});
test('canonicalization ignores start, winding, duplicate and redundant collinear vertex',()=>{
  const a=Roof.canonical(rectangle),b=Roof.canonical([...rectangle.slice(2),...rectangle.slice(0,2)].reverse()),c=Roof.canonical([{x:0,y:0},{x:3000,y:0},{x:6000,y:0},...rectangle.slice(2),{x:0,y:0}]);
  assert.equal(JSON.stringify(a),JSON.stringify(b));assert.equal(JSON.stringify(a),JSON.stringify(c));
});
test('facade wall order and direction do not change footprint bytes',()=>{
  const p=project(rectangle),a=Roof.footprint(p,Exterior);
  p.walls.reverse();p.walls.forEach(w=>{[w.start,w.end]=[w.end,w.start];});
  const b=Roof.footprint(p,Exterior);
  assert.equal(JSON.stringify(a),JSON.stringify(b));
});
test('open/multiple facades and heterogeneous tops abstain',()=>{
  const p=project(rectangle);p.walls.pop();assert.equal(Roof.footprint(p,Exterior).status,'unavailable');
  const q=project(rectangle);q.walls[1].heightMm=2900;assert.deepEqual(Roof.footprint(q,Exterior),{status:'unavailable',reason:'heterogeneous-top-elevation'});
  const missing=project(rectangle);delete missing.walls[1].heightMm;assert.deepEqual(Roof.footprint(missing,Exterior),{status:'unavailable',reason:'invalid-facade-height'});
  const r=project(rectangle);r.walls.push(...project(rect(8000,0,10000,2000)).walls.map((w,i)=>({...w,id:`extra_${i}`})));assert.equal(Roof.footprint(r,Exterior).status,'unavailable');
});
test('self-intersection and almost-zero edges are invalid',()=>{
  assert.equal(Roof.canonical([{x:0,y:0},{x:4000,y:4000},{x:0,y:4000},{x:4000,y:0}]).status,'invalid');
  assert.equal(Roof.canonical([{x:0,y:0},{x:0.00001,y:0},{x:1000,y:0}]).status,'invalid');
});
test('acute miter is unavailable, without bevel or guessed repair',()=>{
  const p=project([{x:0,y:0},{x:10000,y:0},{x:10000,y:100}]);
  const declared={derive:()=>({status:'available',walls:p.walls.map(w=>({wallId:w.id,status:'facade'}))})};
  assert.equal(Roof.footprint(p,declared).reason,'miter-limit');
});
test('orthogonal setbacks conserve lower area, including containment, tangent and overhang',()=>{
  const lower=Roof.canonical(rectangle).polygon;
  for(const upper of [rect(1000,1000,5000,3000),rect(0,0,3000,4000),rect(3000,-1000,7000,2000),rect(1000,0,5000,4000)]){
    const relation=Roof.difference(lower,Roof.canonical(upper).polygon);assert.equal(relation.status,'available');
    const exposed=relation.exposed.reduce((s,p)=>s+Roof.area(p),0);
    assert.equal(round(exposed+relation.overlapMm2),round(Roof.area(lower)));
    assert.ok(relation.exposed.every(p=>Roof.area(p)>0));
  }
  assert.deepEqual(Roof.difference(lower,lower).exposed,[]);
  const tiny=Roof.difference(Roof.canonical(rect(0,0,1000,1000)).polygon,Roof.canonical(rect(0,0,995,1000)).polygon);
  assert.equal(tiny.exposed.reduce((s,p)=>s+Roof.area(p),0),5000); // 0.005 m² is real geometry.
});
test('non-orthogonal setback is unavailable, equivalent non-orthogonal footprint is allowed',()=>{
  const a=Roof.canonical([{x:0,y:0},{x:3000,y:0},{x:2000,y:2000}]).polygon;
  assert.deepEqual(Roof.difference(a,a).exposed,[]);
  assert.equal(Roof.difference(a,Roof.canonical([{x:100,y:0},{x:3100,y:0},{x:2100,y:2000}]).polygon).reason,'non-orthogonal-setback');
});
test('building transforms offsets into common frame, preserving areas and no mutation',()=>{
  const p0=project(rectangle),p1=project(rect(500,500,4500,3000));
  const b={levels:[{id:'lvl_0',elevationMm:0,offsetMm:{x:0,y:0},project:p0},{id:'lvl_1',elevationMm:3200,offsetMm:{x:1000,y:-300},project:p1}]};
  const before=JSON.stringify(b),result=Roof.deriveBuilding(b,Exterior,Building);
  assert.equal(result.status,'available',result.reason);assert.equal(result.levels[1].polygon[0].x,1400);
  assert.equal(result.levels[1].elevationMm,6000);assert.ok(result.relation.overlapMm2>0);
  assert.ok(result.relation.overhangMm2>=0);assert.equal(JSON.stringify(b),before);
  assert.ok(result.surfaces.some(s=>s.kind==='exposed-roof'));
});
test('contract building example derives both elevations and exposed lower cells without mutation',()=>{
  const building=JSON.parse(fs.readFileSync(path.join(__dirname,'../docs/contracts/examples/floorplan-building-v1.example.json'),'utf8'));
  const before=JSON.stringify(building),result=Roof.deriveBuilding(building,Exterior,Building);
  assert.equal(result.status,'available',result.reason);
  assert.equal(result.levels.length,2);
  assert.equal(result.surfaces.filter(s=>s.kind==='top-roof').length,1);
  assert.equal(result.surfaces.filter(s=>s.kind==='exposed-roof').length,2);
  assert.equal(result.levels[0].elevationMm,2800);
  assert.equal(result.levels[1].elevationMm,5900);
  assert.equal(JSON.stringify(building),before);
});
test('vendored Three triangulates concave roof with +Y normals and matching area',async()=>{
  const source=fs.readFileSync(path.join(__dirname,'../vendor/three/build/three.module.js'));
  const THREE=await import('data:text/javascript;base64,'+source.toString('base64'));
  for(const poly of [rectangle,L,U]){
    const footprint=Roof.footprint(project(poly),Exterior);assert.equal(footprint.status,'available');
    const shape=new THREE.Shape();footprint.polygon.forEach((p,i)=>shape[i?'lineTo':'moveTo'](p.x,-p.y));
    const geometry=new THREE.ShapeGeometry(shape);geometry.rotateX(-Math.PI/2);
    const position=geometry.attributes.position,normal=geometry.attributes.normal,index=geometry.index;
    let triangles=0;
    for(let i=0;i<index.count;i+=3){
      const a=index.getX(i),b=index.getX(i+1),c=index.getX(i+2);
      const ax=position.getX(a),az=position.getZ(a),bx=position.getX(b),bz=position.getZ(b),cx=position.getX(c),cz=position.getZ(c);
      const signed=((bx-ax)*(cz-az)-(bz-az)*(cx-ax))/2;
      assert.ok(signed<0);triangles-=signed;
      assert.ok(normal.getY(a)>0.999);
    }
    assert.ok(Math.abs(triangles-footprint.areaMm2)<=Roof.EPS.areaMm2);
    geometry.dispose();
  }
});
