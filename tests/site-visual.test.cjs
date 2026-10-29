// Project-First A3: orientation, sun and site read model. Facades by true orientation from the 8A facades and the
// declared north; the sun path from FloorPlanSolar at the project location; the parcel and the explicitly placed
// footprint through the territory transform. Nothing is guessed and the inputs are never mutated.
const test=require('node:test'),assert=require('node:assert/strict');
const SV=require('../js/site-visual-core.js'),Exterior=require('../js/exterior-core.js'),Solar=require('../js/solar-core.js');
const Roof=require('../js/roof-core.js'),Parcel=require('../js/parcel-core.js'),Territory=require('../js/territory-integration-core.js');
const deepFreeze=o=>{if(o&&typeof o==='object'&&!Object.isFrozen(o)){Object.freeze(o);Object.values(o).forEach(deepFreeze);}return o;};
const rect=(x0,y0,x1,y1)=>[{x:x0,y:y0},{x:x1,y:y0},{x:x1,y:y1},{x:x0,y:y1}];
// A 6×4 m house: plan-up wall (y=0) has a 1.2 m window, plan-down wall (y=4000) a 2 m window.
function house(){const poly=rect(0,0,6000,4000);return {id:'prj_t',rooms:[{id:'rom_a',polygon:rect(100,100,5900,3900),countsTowardArea:true}],
 walls:poly.map((p,i)=>({id:'wal_'+i,start:p,end:poly[(i+1)%4],thicknessMm:200,heightMm:2700,status:'existing'})),
 openings:[{id:'op_up',wallId:'wal_0',kind:'window',offsetMm:2000,widthMm:1200},{id:'op_down',wallId:'wal_2',kind:'window',offsetMm:2000,widthMm:2000},{id:'op_door',wallId:'wal_1',kind:'door',offsetMm:1000,widthMm:900}],materials:[]};}
const madrid={latitude:40.4168,longitude:-3.7038,timeZone:'Europe/Madrid',source:{providerId:'manual',type:'user-entered'}};
const parcel={reference:'1907401VK4810H',sourceCrs:'EPSG:25830',sourceGeometry:{type:'MultiPolygon',polygons:[{rings:[[[500000,4500000],[500030,4500000],[500030,4500020],[500000,4500020]]]}]},frame:{sourceCrs:'EPSG:25830',originX:500015,originY:4500010,sourceUnits:'m',xAxis:'east',yAxis:'north'},source:{providerId:'synthetic',type:'derived',license:{status:'restricted'}}};

test('facades take the outer side and the declared north; windows by orientation',()=>{
 const p=house(),ex=Exterior.derive(p);
 const relative=SV.facades({project:p,exterior:ex});assert.equal(relative.status,'relative');assert.equal(relative.sectors,null);assert.equal(relative.totalWindowMm,3200);
 // Plan-up is true north: the plan-up wall faces north, the plan-down wall south.
 const n0=SV.facades({project:p,exterior:ex,northOffsetDeg:0}),by=k=>n0.sectors.find(s=>s.sector===k);
 assert.equal(n0.status,'oriented');assert.equal(by('N').windowMm,1200);assert.equal(by('S').windowMm,2000);assert.equal(by('E').lengthMm,4000);assert.equal(by('O').lengthMm,4000);assert.equal(by('E').windowMm,0,'doors are not windows');
 // True north 90° clockwise from plan-up: the plan-up wall now faces west, the plan-down wall east.
 const n90=SV.facades({project:p,exterior:ex,northOffsetDeg:90}),s90=k=>n90.sectors.find(s=>s.sector===k);
 assert.equal(s90('O').windowMm,1200);assert.equal(s90('E').windowMm,2000);
 // Reversing every wall does not change the outer side.
 const q=house();q.walls.forEach(w=>{[w.start,w.end]=[w.end,w.start];});assert.deepEqual(SV.facades({project:q,exterior:Exterior.derive(q),northOffsetDeg:0}).sectors,n0.sectors);
 assert.equal(SV.facades({project:{rooms:[],walls:[]},exterior:{walls:[]}}).status,'unavailable');
});

test('sun path at the project location matches the astronomy of the reference days',()=>{
 const sun=SV.sunPath({site:{northOffsetDeg:0,location:madrid},Solar,year:2026,stepMin:5});
 assert.equal(sun.status,'available-orientative');const day=k=>sun.days.find(d=>d.key===k);
 // Madrid ≈ 40.4° N: noon altitude ≈ 90 − 40.4 ± 23.4.
 assert.ok(Math.abs(day('summer').maxAltitudeDeg-73)<1.5);assert.ok(Math.abs(day('winter').maxAltitudeDeg-26.2)<1.5);assert.ok(Math.abs(day('equinox').maxAltitudeDeg-49.6)<1.5);
 assert.ok(day('summer').daylightMin>day('equinox').daylightMin&&day('equinox').daylightMin>day('winter').daylightMin);
 assert.ok(day('summer').sunrise<day('summer').sunset);assert.ok(Math.abs(day('winter').maxAzimuthDeg-180)<10,'winter noon sun is due south');
 assert.deepEqual(SV.sunPath({site:{northOffsetDeg:0},Solar}),{status:'unavailable',reason:'location'});
 assert.deepEqual(SV.sunPath({site:{location:madrid},Solar}),{status:'unavailable',reason:'north'});
});

test('site view draws the parcel and only an explicitly placed, provable footprint',()=>{
 const p=house(),fp=Roof.footprint(p,Exterior);assert.equal(fp.status,'available');
 const only=SV.siteView({site:{parcel,northOffsetDeg:0},footprint:fp.polygon,Parcel,Territory});
 assert.equal(only.status,'parcel-only');assert.equal(only.reason,'placement');assert.equal(only.parcelAreaM2,600);assert.equal(only.building,null);
 const placement={horizontal:{modelAnchorMm:{x:3000,y:2000},parcelLocalAnchorMm:{x:0,y:0},source:{type:'user-entered'}}};
 const placed=SV.siteView({site:{parcel,northOffsetDeg:0,buildingPlacement:placement},footprint:fp.polygon,Parcel,Territory});
 assert.equal(placed.status,'placed');assert.ok(Math.abs(placed.footprintAreaM2-fp.areaMm2/1e6)<1e-6);
 const xs=placed.building.map(p=>p[0]);assert.ok(Math.abs((Math.min(...xs)+Math.max(...xs))/2)<1e-6,'footprint centred on the parcel anchor');
 assert.equal(SV.siteView({site:{parcel,northOffsetDeg:0,buildingPlacement:placement},footprint:null,Parcel,Territory}).reason,'footprint');
 assert.deepEqual(SV.siteView({site:{},Parcel,Territory}),{status:'unavailable',reason:'parcel'});
});

test('site visual read model never mutates its inputs',()=>{
 const p=deepFreeze(house()),ex=deepFreeze(Exterior.derive(p)),site=deepFreeze({parcel,northOffsetDeg:30,location:madrid}),before=JSON.stringify([p,ex,site]);
 SV.facades({project:p,exterior:ex,northOffsetDeg:30});SV.sunPath({site,Solar,stepMin:30});SV.siteView({site,footprint:null,Parcel,Territory});
 assert.equal(JSON.stringify([p,ex,site]),before);
});
