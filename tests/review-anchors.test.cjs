// Phase B6: anchored comments. Observations can point at the whole home, a room, an element (furniture, door, window),
// an image (project view or AI render) or a point on the plan. Unknown or malformed anchors fall back to the whole
// home; the file format stays v1, so files from older Rubik versions keep reading.
const test=require('node:test'),assert=require('node:assert/strict');
const R=require('../js/review-notes-core.js'),A=require('../js/review-anchors.js'),project=require('../js/reference-project.js');
const names={project:'Toda la vivienda',rooms:'Estancias',elements:'Elementos',images:'Imágenes',image:'Imagen',point:'Punto del plano',door:'Puerta',window:'Ventana',room:r=>r.name,object:o=>o.name};
test('anchors are normalised and bounded; anything else is the whole home',()=>{
 assert.deepEqual(R.anchorOf({kind:'element',elementId:'obj_1',elementType:'object',roomId:'rom_a',label:'Cama · Dormitorio'}),{kind:'element',elementId:'obj_1',elementType:'object',roomId:'rom_a',label:'Cama · Dormitorio'});
 assert.deepEqual(R.anchorOf({kind:'view',viewId:'ai:overview:warm',label:'Imagen: Render IA'}),{kind:'view',viewId:'ai:overview:warm',label:'Imagen: Render IA'});
 assert.deepEqual(R.anchorOf({kind:'point',x:1234.6,y:-50.2,label:'Punto'}),{kind:'point',x:1235,y:-50,label:'Punto'});
 for(const bad of [{kind:'element',elementId:'x',elementType:'wall'},{kind:'point',x:NaN,y:1},{kind:'point',x:1e9,y:0},{kind:'view'},{kind:'script'},null,'room'])assert.deepEqual(R.anchorOf(bad),{kind:'project'},JSON.stringify(bad));
 assert.equal(R.anchorOf({kind:'room',roomId:'r',label:'x'.repeat(300)}).label.length,100);
});
test('a file with every anchor kind round-trips, and missing rooms or elements are detected',()=>{
 let d=R.create(project,'rev-1');
 for(const anchor of [{kind:'project'},{kind:'room',roomId:'rom_master',label:'Dormitorio'},{kind:'element',elementId:project.objects[0].id,elementType:'object',label:'Cama'},{kind:'element',elementId:'obj_gone',elementType:'object',label:'Silla'},{kind:'view',viewId:'overview',label:'Vista general'},{kind:'point',x:8000,y:1500,roomId:'rom_master',label:'Punto'}])d=R.add(d,{anchor,text:'Nota'});
 const back=R.read(JSON.stringify(d));assert.deepEqual(back.notes.map(n=>n.anchor.kind),['project','room','element','element','view','point']);
 const m=R.match(back,project,'rev-1');assert.deepEqual(m.missing,[back.notes[3].id]);assert.deepEqual(m.missingRooms,[]);
 const resp=R.readResponse(R.respond(back,{},{},project,'rev-1'));assert.deepEqual(resp.items.map(i=>i.anchor),back.notes.map(n=>n.anchor));
});
test('anchor lists name elements by what they are and where they are',()=>{
 const g=A.groups(project,{names,views:[{id:'overview',label:'Vista general'}]});
 assert.deepEqual(g.map(x=>x.key),['project','rooms','elements','views']);
 const items=g.find(x=>x.key==='elements').items;assert.equal(items.length,project.objects.length+project.openings.length);
 const bed=items.find(i=>i.anchor.elementId===project.objects[0].id);assert.equal(bed.label,'双人床 · 主卧室');assert.equal(bed.anchor.roomId,'rom_master');
 const win=items.find(i=>i.anchor.elementType==='window');assert.match(win.label,/^Ventana 1( · .+)?$/);
 assert.equal(g.find(x=>x.key==='views').items[0].anchor.label,'Imagen: Vista general');
 const p=A.point(project,8000,1500,names);assert.deepEqual(p,{kind:'point',x:8000,y:1500,roomId:'rom_master',label:'Punto del plano · 主卧室'});
 assert.deepEqual(A.point(project,-9e5,0,names),{kind:'point',x:-900000,y:0,label:'Punto del plano'});
});
