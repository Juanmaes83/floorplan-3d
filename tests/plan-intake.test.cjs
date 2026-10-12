const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const I=require('../js/plan-intake.js'),C=require('../js/project-core.js'),DxfParser=require('../vendor/dxf-parser/dxf-parser.js');
const fx=name=>new Uint8Array(fs.readFileSync(__dirname+'/fixtures/intake/'+name)),root=name=>new Uint8Array(fs.readFileSync(__dirname+'/fixtures/'+name));

test('format detection uses content, never the file extension',()=>{
 const cases=[['plan-one-page.pdf','pdf'],['plan.heic','heic'],['plan.tif','tiff'],['plan.bmp','bmp'],['plan.gif','gif'],['plan.svg','svg'],['vivienda-mm.dxf','dxf'],['plan.dwg','dwg'],['plan.ifc','ifc'],['roomplan-capturedroom.json','json'],['plan-mirrored.jpg','jpeg'],['plan-exif.png','png']];
 for(const [file,kind]of cases){assert.equal(I.sniff(fx(file),file),kind,file);assert.equal(I.sniff(fx(file),'renamed.txt'),kind,file+' renamed');}
 assert.equal(I.sniff(root('manual-plan.webp'),'plano'),'webp');assert.equal(I.sniff(root('manual-plan.jpg'),'plano.jfif'),'jpeg');
 assert.equal(I.sniff(new TextEncoder().encode('﻿  {"schema":"x"}')),'json');
 assert.equal(I.sniff(new Uint8Array([0x50,0x4b,3,4,0,0]),'scan.usdz'),'usdz');assert.equal(I.sniff(new Uint8Array([0x50,0x4b,3,4,0,0]),'p.zip'),'zip');
 assert.equal(I.sniff(new Uint8Array(0)),'unknown');assert.equal(I.sniff(new TextEncoder().encode('hola')),'unknown');
 for(const kind of ['dwg','ifc','usdz','unknown','dxf-binary'])assert.ok(I.GUIDANCE[kind].length>20,kind);
});
test('large scans are reduced uniformly within the side and pixel limits',()=>{
 assert.deepEqual(I.fitRaster(1600,1200),{factor:1,width:1600,height:1200});
 const a1=I.fitRaster(7016,9933);assert.ok(a1.height<=8000&&a1.width*a1.height<=I.LIMITS.rasterPixels&&a1.height>7000);const a3=I.fitRaster(4961,7016);assert.equal(a3.factor,1);const wide=I.fitRaster(9000,600);assert.equal(wide.width,8000);assert.ok(Math.abs(a1.width/a1.height-7016/9933)<1e-3);
 const square=I.fitRaster(7900,7900);assert.ok(square.width*square.height<=I.LIMITS.rasterPixels);
 assert.throws(()=>I.fitRaster(0,10),/no válidas/);
});
test('DXF double-line walls become wall axes with measured thickness in mm',()=>{
 const dxf=new DxfParser().parseSync(new TextDecoder().decode(fx('vivienda-mm.dxf'))),{project,report}=I.dxfToProject(dxf,{name:'Vivienda'});
 C.validate(project);assert.equal(project.name,'Vivienda');assert.equal(report.walls,5);assert.equal(report.paired,5);assert.ok(report.layerFilter);assert.deepEqual(report.inserts,{doors:1,windows:0});
 const lengths=project.walls.map(w=>Math.round(Math.hypot(w.end.x-w.start.x,w.end.y-w.start.y))).sort((a,b)=>a-b);
 assert.deepEqual(lengths,[2800,2900,2900,3900,3900]);assert.deepEqual(project.walls.map(w=>w.thicknessMm).sort(),[100,100,100,100,80]);
 assert.ok(project.walls.every(w=>w.source.method==='imported'&&w.source.review==='unreviewed'));
 assert.equal(project.scale.confidence,'estimated');assert.match(project.scale.note,/DXF \(mm\)/);
});
test('DXF units scale to mm and unsupported or empty drawings are rejected with guidance',()=>{
 const doc=(units,entities)=>({header:units===undefined?{}:{$INSUNITS:units},entities});
 const line=(layer,a,b)=>({type:'LINE',layer,vertices:[{x:a[0],y:a[1]},{x:b[0],y:b[1]}]});
 const metres=I.dxfToProject(doc(6,[line('0',[0,0],[4,0])])).project.walls[0];assert.equal(metres.end.x-metres.start.x,4000);
 const cm=I.dxfToProject(doc(5,[line('0',[0,0],[400,0])])).project.walls[0];assert.equal(cm.end.x-cm.start.x,4000);
 assert.equal(I.dxfToProject(doc(undefined,[line('0',[0,0],[4000,0])])).report.assumedUnits,true);
 assert.throws(()=>I.dxfToProject(doc(3,[line('0',[0,0],[1,0])])),/Unidades DXF no admitidas/);
 assert.throws(()=>I.dxfToProject(doc(4,[])),/No se encontraron líneas/);
 assert.throws(()=>I.dxfToProject(doc(6,[line('0',[0,0],[500,0])])),/200 m/);
 assert.equal(I.dxfToProject(doc(4,[line('MUROS',[0,0],[4000,0]),line('COTAS',[0,500],[4000,500])])).report.walls,1);
});
test('RoomPlan CapturedRoom JSON becomes walls and openings on the nearest wall',()=>{
 const room=JSON.parse(new TextDecoder().decode(fx('roomplan-capturedroom.json')));assert.equal(I.classifyJson(room),'roomplan');
 const {project,report}=I.roomPlanToProject(room,{name:'Escaneo'});C.validate(project);
 assert.equal(report.walls,4);assert.equal(report.openings,2);assert.equal(report.skippedOpenings,0);
 const lengths=project.walls.map(w=>Math.round(Math.hypot(w.end.x-w.start.x,w.end.y-w.start.y))).sort((a,b)=>a-b);assert.deepEqual(lengths,[3000,3000,4000,4000]);
 assert.deepEqual(project.openings.map(o=>[o.kind,o.widthMm]).sort(),[['door',900],['window',1200]]);
 assert.equal(I.classifyJson({type:'FeatureCollection',features:[]}),'geojson');assert.equal(I.classifyJson(C.initial()),'project');
 assert.throws(()=>I.roomPlanToProject({walls:[{transform:new Array(16).fill(0),dimensions:[0,0,0]}]}),/muros válidos/);
});
