// ENT-01 I1B pure geometry and preview wiring invariants — no browser/network/secret.
'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const Map=require('../js/delivery-map-core.js');
test('roomAt locates the smallest containing room and rejects outside',()=>{
 const a={id:'a',poly:[[0,0],[2000,0],[2000,2000],[0,2000]]},b={id:'b',poly:[[300,300],[700,300],[700,700],[300,700]]};
 assert.equal(Map.roomAt([a,b],500,500).id,'b');
 assert.equal(Map.roomAt([a,b],100,100).id,'a');
 assert.equal(Map.roomAt([a,b],3000,3000),null);
});
test('directional marker normalizes heading and refuses malformed pose',()=>{
 assert.equal(Map.marker({x:100,y:200,dx:0,dy:10},1000).angleDeg,90);
 assert.equal(Map.marker({x:0,y:0,dx:0,dy:0},1000),null);
 assert.equal(Map.marker({x:0,y:0,dx:NaN,dy:1},1000),null);
});
test('client boot is preview-only and forbids remote delivery loading',()=>{
 const index=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
 const client=fs.readFileSync(path.join(__dirname,'../js/delivery-client.js'),'utf8');
 const ui=fs.readFileSync(path.join(__dirname,'../js/delivery-preview-ui.js'),'utf8');
 assert.match(index,/query\.get\('entrega'\)!=='vista-previa'/);
 assert.match(index,/Object\.defineProperty\(window,'localStorage'/);
 assert.match(client,/FloorPlanClientDelivery/);
 assert.doesNotMatch(client,/fetch\('api\/delivery/);
 assert.doesNotMatch(ui,/fetch\('api\/share|fetch\('api\/unshare|x-rubik-share-token/i);
 assert.match(ui,/event\.origin!==location\.origin/);
 assert.match(ui,/event\.source/);
});
