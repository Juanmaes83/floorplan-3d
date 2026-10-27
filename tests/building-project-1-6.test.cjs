const {test}=require('node:test'),assert=require('node:assert/strict');
const B=require('../js/building-core.js');
const F=require('./fixtures/building-fixture.cjs');

const clone=value=>JSON.parse(JSON.stringify(value));

test('building accepts current FloorPlanProjectV1 1.6.0 levels and still rejects unknown future project versions',()=>{
 const current=F.build().building;
 current.levels[0].project.schemaVersion='1.6.0';
 current.levels[0].project.rooms[0].family='bedroom';
 assert.doesNotThrow(()=>B.validate(current));

 const future=clone(current);
 future.levels[0].project.schemaVersion='1.8.0';
 assert.throws(()=>B.validate(future),/unsupported level project version 1\.8\.0/);
});
