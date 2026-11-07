'use strict';
/* FT3D-8 · M1 · S3 — parcel association, explicit placement and export policy (FT8-S3-02/03/04/06/07). Synthetic
   parcels built with the existing parcel core (invented references and coordinates). */
const test=require('node:test'),assert=require('node:assert/strict');
const A=require('../js/parcel-association-core.js'),Parcel=require('../js/parcel-core.js'),Geo=require('../js/geo-provider.js'),Territory=require('../js/territory-integration-core.js');

const ring=(x,y,w,h)=>[[x,y],[x+w,y],[x+w,y+h],[x,y+h],[x,y]];
const parcelResult=(reference,{x=500000,y=4500000,w=20,h=15,providerId='catastro-inspire-wfs',license='restricted'}={})=>({status:'available',providerId,
  parcel:Parcel.normalizeParcel({reference,sourceCrs:'EPSG:25830',sourceGeometry:{type:'MultiPolygon',polygons:[{rings:[ring(x,y,w,h)]}]}}),
  provenance:{providerId,type:'official-source',sourceName:'SYNTHETIC TEST ONLY · Catastro',sourceId:reference,retrievedAt:'2026-11-05T12:00:00Z',attribution:'Dirección General del Catastro',
    license:{status:license,name:'Licencia de acceso y uso INSPIRE de la DGC'}}});
const subject=(id,revision='r1')=>({type:'project',id,revision});
const library=()=>({'prj_a':{revision:'r1',site:{northOffsetDeg:12}},'prj_b':{revision:'r7',site:{northOffsetDeg:0,parcel:A.plan({},subject('prj_b'),parcelResult('9999999ZZ9999Z')).next.parcel}}});

test('FT8-S3-02 · canonical parcel: reference, CRS, source and a stable fingerprint',()=>{
  const p=A.plan({},subject('prj_a'),parcelResult('1907401VK4810H'));
  assert.equal(p.action,'add');assert.equal(p.reference,'1907401VK4810H');assert.equal(p.next.parcel.sourceCrs,'EPSG:25830');
  assert.equal(p.next.parcel.source.providerId,'catastro-inspire-wfs');assert.equal(p.next.parcel.source.license.status,'restricted');
  assert.equal(A.fingerprint(p.next.parcel),p.fingerprint);assert.equal(A.fingerprint(parcelResult('1907401VK4810H').parcel),p.fingerprint);
  assert.notEqual(A.fingerprint(parcelResult('1907401VK4810H',{w:21}).parcel),p.fingerprint);
  assert.throws(()=>Parcel.normalizeParcel({...parcelResult('1907401VK4810H').parcel,sourceCrs:'EPSG:4326'}),/unsupported-source-crs/);
});

test('FT8-S3-03 / QA-10 · association lands only on the selected project; others are untouched; revision checked',()=>{
  const lib=library(),before=JSON.stringify(lib.prj_b);
  const p=A.plan(lib.prj_a.site,subject('prj_a'),parcelResult('1907401VK4810H'));
  const out=A.apply(lib,p);
  assert.equal(out.prj_a.site.parcel.reference,'1907401VK4810H');assert.equal(out.prj_a.site.northOffsetDeg,12,'other site data kept');
  assert.equal(JSON.stringify(out.prj_b),before,'another project is never touched');
  assert.equal(JSON.stringify(lib.prj_a.site),'{"northOffsetDeg":12}','the input library is not mutated');
  assert.equal(A.verify(out.prj_a.association,subject('prj_a'),out.prj_a.site),'match');
  assert.equal(A.verify(out.prj_a.association,subject('prj_b'),out.prj_a.site),'mismatch');
  assert.equal(A.verify(out.prj_a.association,subject('prj_a','r2'),out.prj_a.site),'obsolete');
  assert.equal(A.verify(out.prj_a.association,{type:'project',id:'prj_a'},out.prj_a.site),'unverifiable');
  assert.equal(A.verify(null,subject('prj_a'),out.prj_a.site),'absent');
  assert.throws(()=>A.apply({...lib,prj_a:{...lib.prj_a,revision:'r2'}},p),/revision changed/);
});

test('FT8-S3-03 / FT8-S3-08 · a different parcel replaces the saved one only with confirmation; dependants are reported',()=>{
  let lib=library();lib=A.apply(lib,A.plan(lib.prj_a.site,subject('prj_a'),parcelResult('1907401VK4810H')));
  let site=A.place(lib.prj_a.site,{modelAnchorMm:{x:0,y:0},parcelLocalAnchorMm:{x:5000,y:5000}});
  lib={...lib,prj_a:{...lib.prj_a,site}};
  const same=A.plan(site,subject('prj_a'),parcelResult('1907401VK4810H'));
  assert.deepEqual([same.action,same.needsConfirmation,same.keepsPlacement],['same',false,true]);
  assert.deepEqual(A.apply(lib,same).prj_a.site.buildingPlacement,site.buildingPlacement,'same parcel: placement preserved');
  const other=A.plan(site,subject('prj_a'),parcelResult('8888888YY8888Y'));
  assert.deepEqual([other.action,other.needsConfirmation,other.dropped],['replace',true,['buildingPlacement']]);
  assert.match(other.message,/requiere tu confirmación/);
  assert.throws(()=>A.apply(lib,other),/explicit confirmation/);
  assert.equal(lib.prj_a.site.parcel.reference,'1907401VK4810H','nothing changed without confirmation');
  const replaced=A.apply(lib,other,{confirmed:true});
  assert.equal(replaced.prj_a.site.parcel.reference,'8888888YY8888Y');assert.equal(replaced.prj_a.site.buildingPlacement,undefined,'placement dropped, never moved');
  const moved=A.plan(site,subject('prj_a'),parcelResult('1907401VK4810H',{w:25}));assert.equal(moved.action,'update-geometry');assert.equal(moved.needsConfirmation,true);
});

test('FT8-S3-05 · a failed lookup changes nothing (no result, invalid result)',()=>{
  const site={northOffsetDeg:3,parcel:A.plan({},subject('prj_a'),parcelResult('1907401VK4810H')).next.parcel};
  for(const r of [{status:'unavailable',reason:'network-unavailable'},{status:'cancelled',reason:'cancelled'},null,{status:'available',providerId:'x',parcel:{reference:'BAD'}}]){
    const p=A.plan(site,subject('prj_a'),r);assert.equal(p.ok,false);assert.equal(p.action,'none');assert.match(p.message,/no cambia nada/);
    assert.throws(()=>A.apply({prj_a:{site}},p),/nothing to apply/);}
});

test('FT8-S3-04 · explicit placement: north required, exact round trip within the contract tolerance',()=>{
  const site=A.plan({},subject('prj_a'),parcelResult('1907401VK4810H')).next;
  assert.throws(()=>A.place(site,{modelAnchorMm:{x:0,y:0},parcelLocalAnchorMm:{x:1,y:1}}),/north/);
  const placed=A.place(site,{modelAnchorMm:{x:1200,y:-300},parcelLocalAnchorMm:{x:8000,y:6000},northOffsetDeg:37.5});
  assert.equal(placed.buildingPlacement.horizontal.source.type,'user-entered');
  const rt=A.roundTrip(placed,[{x:0,y:0},{x:12345.6,y:-789.1},{x:-50000,y:42000}]);
  assert.ok(rt.withinTolerance,`max error ${rt.maxErrorMm} mm`);assert.ok(rt.maxErrorMm<=Territory.EPS.mm);
  const p=Territory.modelToParcel(placed,{x:1200,y:-300});assert.ok(Math.hypot(p.x-8000,p.y-6000)<1e-6,'the model anchor lands on the parcel anchor');
});

test('FT8-S3-07 / QA-17 · export per channel: restricted geometry never leaves; reference and attribution as text',()=>{
  const site=A.plan({},subject('prj_a'),parcelResult('1907401VK4810H')).next;
  const screen=A.exportView(site,'screen');assert.equal(screen.includeGeometry,true);assert.equal(screen.reason,'internal-display');
  for(const ch of ['video','html','snapshot']){const v=A.exportView(site,ch);
    assert.deepEqual([v.includeGeometry,v.licenseStatus,v.reason],[false,'restricted','license-does-not-allow-export'],ch);
    assert.equal(v.text,'Referencia catastral 1907401VK4810H · Fuente: Dirección General del Catastro');}
  const unknown=A.plan({},subject('prj_a'),parcelResult('1907401VK4810H',{license:'unknown'})).next;assert.equal(A.exportView(unknown,'video').includeGeometry,false);
  const free=A.plan({},subject('prj_a'),parcelResult('1907401VK4810H',{license:'not-applicable',providerId:'manual-gml'})).next;assert.equal(A.exportView(free,'html').includeGeometry,true);
  assert.equal(A.exportView({},'video').reason,'no-parcel');assert.throws(()=>A.exportView(site,'email'),/channel/);
});

test('FT8-S3-06 · PNOA and MDT05 are optional context with their own licence; never requested automatically',()=>{
  const reg=Geo.createDefaultRegistry(),site=A.plan({},subject('prj_a'),parcelResult('1907401VK4810H')).next;
  const layers=A.contextLayers(site,reg);
  assert.deepEqual(layers.map(l=>[l.key,l.providerId,l.available,l.status,l.network]),[['orthophoto','ign-pnoa-ma-wms',true,'not-requested','required'],['terrain','ign-mdt05-terrain',true,'not-requested','required']]);
  assert.ok(layers.every(l=>/No es levantamiento topográfico/.test(l.note)));
  assert.deepEqual(A.contextLayers(site,Geo.createRegistry([])).map(l=>l.status),['unavailable','unavailable']);
});
