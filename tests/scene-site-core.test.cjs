// «Desde el paisaje» · entorno para la Escena para Blender: posición, escala, orientación y cota del terreno en el plano del
// modelo; política de licencias por capa; la parcela catastral nunca sale; sin emplazamiento no cambia nada.
const {test}=require('node:test'),assert=require('node:assert/strict');
const S=require('../js/scene-site-core.js'),C=require('../js/territory-integration-core.js');
const parcel={reference:'1907401VK4810H',sourceCrs:'EPSG:25830',sourceGeometry:{type:'MultiPolygon',polygons:[{rings:[[[500000,4500000],[500030,4500000],[500030,4500020],[500000,4500020]]]}]},
 frame:{sourceCrs:'EPSG:25830',originX:500015,originY:4500010,sourceUnits:'m',xAxis:'east',yAxis:'north'},source:{providerId:'synthetic',type:'derived',attribution:'Dirección General del Catastro',license:{status:'restricted'}}};
const placement={horizontal:{modelAnchorMm:{x:1300,y:-700},parcelLocalAnchorMm:{x:4200,y:9100},source:{type:'user-entered'}},vertical:{modelZeroElevationM:621.35,verticalReference:'orthometric',source:{type:'user-entered'}}};
const ok={license:{status:'verified',name:'CC BY 4.0'},attribution:'Sistema Cartográfico Nacional'};
// Malla 3×3 de 5 m centrada en el origen de la parcela; la cota sube 1 m hacia el este.
const grid={sourceCrs:'EPSG:25830',cols:3,rows:3,cellSizeX:5,cellSizeY:5,noData:null,sampleDomain:{minX:500010,minY:4500005,maxX:500020,maxY:4500015},values:[621,622,623,621,622,623,621,622,623]};
const site=(north=0,extra={})=>({parcel,northOffsetDeg:north,buildingPlacement:placement,terrain:{source:ok,productName:'MDT05',resolutionM:5},
 orthophoto:{source:{...ok,attribution:'Sistema Cartográfico Nacional'},extent:{minX:500000,minY:4500000,maxX:500030,maxY:4500020},widthPx:300,heightPx:200},...extra});
const session={terrain:{grid},orthophoto:{bytes:new Uint8Array([0xff,0xd8,0xff,0xe0])}};
const near=(a,b,t=1e-3)=>assert.ok(Math.abs(a-b)<t,`${a} != ${b}`);

test('sin emplazamiento: «absent» (el ZIP habitual no cambia)',()=>{assert.deepEqual(S.build({site:undefined}),{status:'absent'});assert.deepEqual(S.build({site:{northOffsetDeg:10}}),{status:'absent'});});

test('incompleto: dice qué falta (colocación, cota, terreno o ortofoto de sesión)',()=>{
 const r=S.build({site:{parcel,northOffsetDeg:0},session:{}});assert.equal(r.status,'incomplete');
 for(const k of ['buildingPlacement.horizontal','buildingPlacement.vertical','terrain','orthophoto'])assert.ok(r.missing.includes(k),k);
 const s=S.build({site:site(),session:{terrain:{grid}}});assert.equal(s.status,'incomplete');assert.deepEqual(s.missing,['orthophoto.session']);});

test('licencia restringida o sin atribución bloquea la capa (política existente)',()=>{
 const r=S.build({site:site(0,{terrain:{source:{license:{status:'restricted'},attribution:'X'}}}),session});assert.equal(r.status,'incomplete');assert.ok(r.missing.includes('terrain.licence:restricted'));
 const q=S.build({site:site(0,{orthophoto:{...site().orthophoto,source:{license:{status:'verified'},attribution:''}}}),session});assert.ok(q.missing.includes('orthophoto.licence:missing-attribution'));});

for(const north of [0,37,90])test('posición, escala, orientación y cota en el plano del modelo · norte '+north,()=>{
 const st=site(north),r=S.build({site:st,session});assert.equal(r.status,'ready');const t=r.doc.terrain;
 assert.equal(t.vertices.length,9);assert.equal(t.triangles.length,8);
 // Cada vértice = transformación de RUBIK de la muestra (parcela-local → modelo) y cota − cota cero del modelo.
 const v=t.vertices[4],m=C.parcelToModel(st,{x:0,y:0});near(v[0],m.x);near(v[1],m.y);near(v[2],622-621.35);
 // Escala: dos muestras vecinas a 5 m en el terreno quedan a 5000 mm en el plano, sea cual sea el giro.
 const a=t.vertices[3],b=t.vertices[5];near(Math.hypot(b[0]-a[0],b[1]-a[1]),10000,1e-2);
 // Orientación: con norte 0 el este del terreno es +x del plano; con 90 el este pasa a +y (plan y hacia abajo) o −y según convenio de RUBIK.
 const east=C.parcelToModel(st,{x:1000,y:0}),o=C.parcelToModel(st,{x:0,y:0});near((b[0]-a[0])/10000,(east.x-o.x)/1000,1e-6);near((b[1]-a[1])/10000,(east.y-o.y)/1000,1e-6);
 // Ortofoto: sus esquinas también pasan por la misma transformación.
 const nw=r.doc.orthophoto.cornersPlanMm.nw,mm=C.parcelToModel(st,C.sourceToLocal(parcel.frame,500000,4500020));near(nw[0],mm.x);near(nw[1],mm.y);});

test('la parcela catastral no sale; atribuciones y archivos declarados',()=>{
 const r=S.build({site:site(),session});const json=new TextDecoder().decode(r.files.get(S.FILE));
 assert.equal(r.doc.parcel.exported,false);assert.equal(r.doc.parcel.reference,null);assert.equal(json.includes('1907401VK4810H'),false);assert.equal(json.includes('4500020]]'),false,'sin anillos de la geometría catastral');
 assert.deepEqual(r.doc.attributions,['Sistema Cartográfico Nacional']);assert.deepEqual([...r.files.keys()],[S.FILE,S.ORTHO]);assert.equal(r.files.get(S.ORTHO),session.orthophoto.bytes);});
