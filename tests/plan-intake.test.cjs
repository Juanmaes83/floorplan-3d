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
 for(const kind of ['dwg','usdz','unknown','dxf-binary'])assert.ok(I.GUIDANCE[kind].length>20,kind);
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
 assert.deepEqual(lengths,[2900,2900,2900,3900,3900],'the partition is extended to the axes of the walls it meets');assert.deepEqual(project.walls.map(w=>w.thicknessMm).sort(),[100,100,100,100,80]);
 assert.ok(project.walls.every(w=>w.source.method==='imported'&&w.source.review==='unreviewed'));
 assert.equal(project.scale.confidence,'estimated');assert.match(project.scale.note,/DXF \(mm\)/);
 assert.equal(report.rooms,2,'two rooms either side of the partition');
});
test('DXF doors and windows land on their wall and rooms take interior faces and text labels',()=>{
 const dxf=new DxfParser().parseSync(new TextDecoder().decode(fx('vivienda-dos-estancias.dxf'))),{project,report}=I.dxfToProject(dxf,{name:'Dos estancias'});C.validate(project);
 assert.equal(report.walls,5);assert.deepEqual(report.openings,{door:2,window:1,opening:0});assert.equal(report.unplaced,0);
 const byKind=k=>project.openings.filter(o=>o.kind===k).map(o=>o.widthMm).sort((a,b)=>a-b);assert.deepEqual(byKind('door'),[800,900]);assert.deepEqual(byKind('window'),[1200]);
 const wallOf=o=>project.walls.find(w=>w.id===o.wallId);assert.equal(wallOf(project.openings.find(o=>o.widthMm===800)).thicknessMm,100,'interior door sits on the partition');
 assert.ok(project.openings.every(o=>o.source.method==='imported'));
 const rooms=Object.fromEntries(project.rooms.map(r=>{const xs=r.polygon.map(p=>p.x),ys=r.polygon.map(p=>p.y);return [r.name,[Math.max(...xs)-Math.min(...xs),Math.max(...ys)-Math.min(...ys)]];}));
 assert.deepEqual(rooms,{'SALÓN':[3800,2600],'DORMITORIO':[2900,2600]},'interior faces of the drawn walls, area label text ignored');
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
const json=name=>JSON.parse(new TextDecoder().decode(fx(name)));
const sizes=project=>Object.fromEntries(project.rooms.map(r=>{const xs=r.polygon.map(p=>p.x),ys=r.polygon.map(p=>p.y);return [r.name,[Math.max(...xs)-Math.min(...xs),Math.max(...ys)-Math.min(...ys)]];}));
const widths=(project,kind)=>project.openings.filter(o=>o.kind===kind).map(o=>o.widthMm).sort((a,b)=>a-b);
test('IFC walls take the minimum-area footprint; openings come from IfcOpeningElement with real sill; rooms from IfcSpace',()=>{
 const {project,report}=I.ifcToProject(json('vivienda-ifc-extract.json'),{name:'BIM'});C.validate(project);
 assert.equal(report.walls,5);assert.equal(report.roomsFrom,'IfcSpace');assert.equal(report.storeys,1);assert.equal(report.unplaced,0);
 assert.deepEqual(project.walls.map(w=>w.thicknessMm).sort(),[100,200,200,200,200]);assert.ok(project.walls.every(w=>w.heightMm===2700&&w.status==='existing'));
 assert.deepEqual(widths(project,'door'),[800,900]);const win=project.openings.find(o=>o.kind==='window');assert.deepEqual([win.widthMm,win.heightMm,win.sillHeightMm],[1200,1200,900]);
 assert.deepEqual(sizes(project),{'Salón':[3800,2600],'Dormitorio':[2900,2600]});
 assert.throws(()=>I.ifcToProject({walls:[],openings:[],spaces:[]}),/no contiene muros/);
});
test('vector PDF: filled walls, swing arcs and glazing lines give walls, doors, windows and named rooms at the printed scale',()=>{
 const {vec,labels}=json('plano-vectorial-extract.json');assert.equal(I.pdfScaleFromText(labels.map(l=>l.text)),50);
 const {project,report}=I.pdfToProject(vec,{name:'PDF',scale:50,labels});C.validate(project);
 assert.equal(report.walls,5);assert.deepEqual(report.openings,{door:2,window:1,opening:0});assert.equal(project.scale.declaredRatio,'1:50');
 assert.deepEqual(widths(project,'door'),[800,900]);assert.deepEqual(widths(project,'window'),[1200]);
 assert.deepEqual(sizes(project),{SALON:[3800,2600],DORMITORIO:[2900,2600]});
 const doubled=I.pdfToProject(vec,{scale:100,labels});assert.deepEqual(Object.values(sizes(doubled.project))[0],[7600,5200],'the declared scale drives every measure');
 assert.equal(I.pdfScaleFromText(['ESCALA 1:50','Detalle 1:20']),null,'two different scales are ambiguous');assert.equal(I.pdfScaleFromText(['E 1/100']),100);assert.equal(I.pdfScaleFromText(['ref 11:50']),null);
 assert.throws(()=>I.pdfToProject(vec,{labels}),/escala/);
});
test('RoomPlan: flat and nested transforms agree; parentIdentifier places openings; sections name rooms',()=>{
 const flat=I.roomPlanToProject(json('roomplan-real-structure.json')),nested=I.roomPlanToProject(json('roomplan-nested-transform.json'));
 for(const r of [flat,nested]){C.validate(r.project);assert.equal(r.report.walls,5);assert.equal(r.report.openings,3);assert.equal(r.report.skippedOpenings,0);assert.deepEqual(r.report.roomNames.sort(),['Dormitorio','Salón']);}
 assert.deepEqual(sizes(nested.project),sizes(flat.project));
 const win=flat.project.openings.find(o=>o.kind==='window');assert.deepEqual([win.widthMm,win.heightMm,win.sillHeightMm],[1200,1200,900]);
 const room=json('roomplan-real-structure.json'),partition=room.walls[4].identifier,door=flat.project.openings.find(o=>o.widthMm===800);assert.equal(room.doors[1].parentIdentifier,partition);
 assert.equal(flat.project.walls.find(w=>w.id===door.wallId).start.x,flat.project.walls.find(w=>w.id===door.wallId).end.x,'interior door on the vertical partition');
 assert.equal(I.classifyJson(json('roomplan-nested-transform.json')),'roomplan');
});
test('raster bands: thick dark strokes become walls, thin strokes crossing a gap are ignored',()=>{
 const W=200,H=120,data=new Uint8ClampedArray(W*H*4).fill(255),dark=(x0,y0,x1,y1)=>{for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){const i=(y*W+x)*4;data[i]=data[i+1]=data[i+2]=20;}};
 dark(10,10,90,20);dark(110,10,190,20);for(const y of [12,15,18])dark(90,y,110,y+1);dark(10,10,20,110);dark(10,100,190,110);dark(180,10,190,110);dark(30,50,80,51);
 const bands=I.rasterWallBands({width:W,height:H,data},{minThick:3,maxThick:30,minLength:15});
 const horiz=bands.filter(b=>b.a.y===b.b.y).map(b=>[b.a.x,b.b.x,b.thickness]).sort((a,b)=>a[1]-b[1]||a[0]-b[0]);
 assert.deepEqual(horiz,[[10,90,10],[10,190,10],[110,190,10]],'top wall split at the glazed gap; thin lines ignored');
 assert.equal(bands.filter(b=>b.a.x===b.b.x).length,2);
 const flat=new Uint8ClampedArray(W*H*4).fill(255);assert.deepEqual(I.rasterWallBands({width:W,height:H,data:flat}),[]);
});
test('DWG versions are named in the guidance',()=>{
 assert.equal(I.dwgVersion(fx('plan.dwg')),'2018 o posterior');assert.equal(I.dwgVersion(new TextEncoder().encode('AC1015xx')),'2000–2002');assert.equal(I.dwgVersion(new TextEncoder().encode('ZZZZZZ')),null);
});
