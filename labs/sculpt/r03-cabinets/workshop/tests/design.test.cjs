const test = require('node:test');
const assert = require('node:assert/strict');
const design = require('../design.js');
const wardrobe = () => { const f={type:'wardrobe',w:2000,d:600,cx:1550,cy:8160,rot:0}; f.cabinet=design.defaultCabinet(f); return f; };

test('horizontal FOV remains calibrated for portrait, landscape and desktop canvases',()=>{
  for(const aspect of [.35,390/554,904/774,844/225,5]) for(const horizontal of [55,80,95,100]) {
    const vertical=design.verticalFov(horizontal,aspect);
    const actual=2*Math.atan(Math.tan(vertical*Math.PI/360)*aspect)*180/Math.PI;
    assert.ok(Math.abs(actual-horizontal)<1e-9);
  }
});
test('invalid view settings cannot produce NaN camera matrices',()=>{
  assert.deepEqual(design.viewSettings({eyeHeight:NaN,horizontalFov:Infinity}),design.defaults());
  assert.equal(design.viewSettings({horizontalFov:180}).horizontalFov,100);
});
test('all stock cabinets have valid interiors with actual board deductions',()=>{
  for(const [type,w,d] of [['wardrobe',2000,600],['wardrobe',1700,600],['tallcab',1750,600],['tallcab',1200,300],['cabinet',1000,400],['shoecab',2450,400]]) {
    const f={type,w,d}; f.cabinet=design.defaultCabinet(f);
    assert.doesNotThrow(()=>design.validateCabinet(f,f.cabinet));
    const c=f.cabinet, net=design.cavity(f,c);
    assert.ok(Math.abs(c.columns.reduce((n,b)=>n+b.width,0)+(c.columns.length+1)*c.thickness-w)<1e-9);
    assert.equal(net.depth,d-c.back-c.frontGap);
    assert.equal(net.height+c.plinth+2*c.thickness,c.height);
    assert.deepEqual(design.drawerDoorConflicts(f),[]);
  }
});
test('shelf openings subtract board thickness and drawer stacks exactly',()=>{
  const f=wardrobe(), b=f.cabinet.columns[0]; b.drawers=2;b.drawerHeight=180;b.shelves=[700,1200,1700];b.rod=null;
  design.validateCabinet(f,f.cabinet);
  const openings=design.openings(f,b);
  assert.deepEqual(openings.map(o=>o.height),[340,482,482,366]);
  assert.equal(openings.reduce((s,o)=>s+o.height,0)+3*18+360,design.cavity(f,f.cabinet).height);
});
test('rejects overlapping shelves, rails, oversized drawers and incomplete bay widths',()=>{
  for(const mutate of [c=>c.columns[0].shelves=[1000,1010], c=>c.columns[0].rod=c.columns[0].shelves[0], c=>Object.assign(c.columns[0],{drawers:6,drawerHeight:400}), c=>c.columns[0].width+=20, c=>c.columns[0].shelves=[NaN]]) {
    const f=wardrobe();
    mutate(f.cabinet); assert.throws(()=>design.validateCabinet(f,f.cabinet));
  }
});
test('bay width edits conserve total width and reject undersized neighbors',()=>{
  const f=wardrobe(); design.bayWidths(f,f.cabinet,0,800);
  assert.equal(f.cabinet.columns[0].width,800);
  assert.ok(Math.abs(f.cabinet.columns[1].width-f.cabinet.columns[2].width)<1e-9);
  assert.throws(()=>design.bayWidths(f,f.cabinet,0,1800));
});
test('changing internal bay widths and splitting bays preserves the exterior doors',()=>{
  const f=wardrobe(), before=design.fronts(f);
  assert.equal(before.length,4);
  design.bayWidths(f,f.cabinet,0,800);
  const col=f.cabinet.columns[0], width=(col.width-f.cabinet.thickness)/2;
  f.cabinet.columns.splice(0,1,{...structuredClone(col),width},{...structuredClone(col),width});
  design.validateCabinet(f,f.cabinet);
  assert.deepEqual(design.fronts(f),before);
});
test('warns when drawers span a fixed exterior door hinge',()=>{
  const f=wardrobe();
  f.cabinet.columns[1].drawers=2;
  assert.deepEqual(design.drawerDoorConflicts(f),[2]);
  f.cabinet.columns[1].drawers=0;
  assert.deepEqual(design.drawerDoorConflicts(f),[]);
});
test('resizing a cabinet rescales its layout with valid remaining clearances',()=>{
  const f=wardrobe(), oldHeight=design.cavity(f,f.cabinet).height;
  f.w=2400;f.cabinet.height=2500;
  design.resizeCabinet(f,f.cabinet,oldHeight);
  assert.ok(Math.abs(f.cabinet.columns.reduce((s,b)=>s+b.width,0)-2328)<1e-9);
  assert.ok(f.cabinet.columns[0].rod>1684);
});
test('furniture collision handles rotation and circular body clearance at corners',()=>{
  const box={cx:1000,cy:2000,w:2000,d:600,rot:90};
  assert.equal(design.circleRect(1000,2000,220,box),true);
  assert.equal(design.circleRect(1500,2000,220,box),true);
  assert.equal(design.circleRect(1600,2000,220,box),false);
  assert.equal(design.circleRect(1450,3150,220,box),true);
  assert.equal(design.circleRect(1460,3160,220,box),false);
});
test('opening cabinet fronts adds door and drawer clearance without removing the body',()=>{
  const f=wardrobe(); assert.equal(design.furnitureObstacles(f).length,1);
  f.cabinet.front='hidden';assert.equal(design.furnitureObstacles(f).length,1);
  f.cabinet.front='open';const parts=design.furnitureObstacles(f);
  assert.ok(parts.length>4);
  assert.equal(parts.some(r=>design.circleRect(f.cx,f.cy,0,r)),true);
  const drawerBay=design.bays(f).find(b=>b.drawers);
  const point={x:f.cx+drawerBay.x+drawerBay.width/2,y:f.cy+f.d/2+150};
  assert.equal(parts.some(r=>design.circleRect(point.x,point.y,0,r)),true);
  assert.deepEqual(design.furnitureObstacles({...f,type:'rug'}),[]);
});
test('door obstacle length matches real door width including the end near the jamb',()=>{
  const door={cx:540,cy:0,w:1080,d:40,rot:0};
  assert.equal(design.circleRect(1070,120,110,door),true);
  assert.equal(design.circleRect(1070,150,110,door),false);
});
test('clearance ray returns physical distance for rotated furniture and parallel walls',()=>{
  const cabinet={cx:1500,cy:0,w:1000,d:600,rot:90};
  assert.equal(design.rayRect(0,0,1,0,cabinet),1200);
  assert.equal(design.rayRect(0,0,-1,0,cabinet),Infinity);
  assert.equal(design.rayRect(0,2000,1,0,cabinet),Infinity);
  assert.equal(design.rayRect(1500,0,1,0,cabinet),0);
});
