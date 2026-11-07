// Delivery 3D — free-walk mini-map, pure part: which room the visitor stands in, and the «you are here» marker.
const test=require('node:test'),assert=require('node:assert/strict'),M=require('../js/delivery-map-core.js');
const sq=(id,x,y,w,h)=>({id,poly:[[x,y],[x+w,y],[x+w,y+h],[x,y+h]]});
const rooms=[sq('salon',0,0,5000,4000),sq('cocina',5000,0,3000,4000),sq('armario',1000,1000,800,800)];
test('roomAt: the room under the visitor; the smallest wins where rooms overlap; outside is null',()=>{
 assert.equal(M.roomAt(rooms,2500,3000).id,'salon');assert.equal(M.roomAt(rooms,6000,100).id,'cocina');
 assert.equal(M.roomAt(rooms,1400,1400).id,'armario','nested room');
 assert.equal(M.roomAt(rooms,-10,10),null);assert.equal(M.roomAt(rooms,NaN,1),null);assert.equal(M.roomAt([],1,1),null);
 assert.equal(M.roomAt([{id:'bad',poly:[[0,0],[1,1]]}],0,0),null,'degenerate polygon ignored');
});
test('marker: dot at the visitor, cone pointing where they look, sized to the map',()=>{
 const m=M.marker({x:1000,y:2000,dx:1,dy:0},10000);
 assert.equal(m.x,1000);assert.equal(m.y,2000);assert.equal(m.angleDeg,0);assert.equal(m.r,260);assert.match(m.cone,/^M 1000 2000 L /);
 const tip=m.cone.match(/L (-?\d+) (-?\d+)/).slice(1).map(Number);assert.ok(tip[0]>1000,'cone ahead of the visitor (east)');
 assert.equal(M.marker({x:0,y:0,dx:0,dy:-3},10000).angleDeg,-90,'normalised, plan y down: looking north');
 assert.equal(M.marker({x:0,y:0,dx:0,dy:1},1000).r,140,'minimum size on small maps');
 for(const bad of [null,{x:0,y:0,dx:0,dy:0},{x:NaN,y:0,dx:1,dy:0}])assert.equal(M.marker(bad,1000),null);
});
