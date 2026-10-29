const {test}=require('node:test'),assert=require('node:assert/strict');
const R=require('../js/review-notes-core.js');
const project={id:'prj_a',name:'Piso Calle Luna',rooms:[{id:'rom_salon',name:'Salón'},{id:'rom_cocina',name:'Cocina'}]};
test('a review is tied to one project version and never contains the project',()=>{
 let d=R.create(project,'rev-1',{reviewer:'Ana',now:'2026-10-22T10:00:00Z'});
 d=R.add(d,{anchor:{kind:'room',roomId:'rom_salon',label:'Salón'},text:'  ¿Se puede ampliar la ventana?  '});
 d=R.add(d,{anchor:{kind:'project'},text:'Me gusta la distribución'});
 assert.equal(d.notes.length,2);assert.equal(d.notes[0].text,'¿Se puede ampliar la ventana?');assert.equal(d.versionCode,R.versionCode('rev-1'));
 assert.ok(!JSON.stringify(d).includes('rooms'),'no project data inside');
 const back=R.read(JSON.stringify(d));assert.deepEqual(back,d);
 assert.deepEqual(R.match(back,project,'rev-1'),{sameProject:true,sameVersion:true,missingRooms:[],missing:[]});
 assert.deepEqual(R.match(back,project,'rev-2'),{sameProject:true,sameVersion:false,missingRooms:[],missing:[]});
 assert.equal(R.match(back,{...project,id:'prj_b'},'rev-1').sameProject,false);
 assert.deepEqual(R.match(back,{...project,rooms:[]},'rev-1').missingRooms,[d.notes[0].id]);
 assert.equal(R.remove(d,d.notes[0].id).notes.length,1);
});
test('received files are read strictly',()=>{
 assert.throws(()=>R.read('{"format":"x"}'),/No es un archivo de observaciones/);
 assert.throws(()=>R.read({format:R.FORMAT,version:2}),/Versión/);
 assert.throws(()=>R.read({format:R.FORMAT,version:1,projectId:'p',versionCode:'zz',notes:[]}),/identidad/);
 assert.throws(()=>R.add(R.create(project,'r'),{text:'   '}),/Escribe/);
 const long=R.read({format:R.FORMAT,version:1,projectId:'p',versionCode:'0000abcd',notes:[{id:'o1',text:'x'.repeat(5000),anchor:{kind:'room',roomId:'r',label:'<b>L</b>',evil:1},extra:true}],extra:1});
 assert.equal(long.notes[0].text.length,R.MAX_TEXT);assert.equal(long.extra,undefined);assert.equal(long.notes[0].anchor.evil,undefined);
 assert.throws(()=>R.read({format:R.FORMAT,version:1,projectId:'p',versionCode:'0000abcd',notes:[{id:'o',text:'a'},{id:'o',text:'b'}]}),/repetidas/);
});
test('the answer separates received, planned, discarded and implemented-in-version, and is read strictly',()=>{
 let d=R.create(project,'rev-1',{reviewer:'Ana'});
 for(const t of ['Ampliar ventana','Cambiar suelo','Quitar tabique','Me gusta'])d=R.add(d,{anchor:{kind:'project'},text:t});
 const [a,b,c,e]=d.notes.map(n=>n.id);
 const r=R.respond(d,{[a]:'incorporate',[b]:'incorporate',[c]:'discard'},{[b]:R.versionCode('rev-2')},project,'rev-2');
 assert.deepEqual(r.items.map(i=>[i.status,i.implementedIn||null]),[['planned',null],['implemented',R.versionCode('rev-2')],['discarded',null],['received',null]]);
 assert.equal(r.versionCode,R.versionCode('rev-2'));assert.ok(!JSON.stringify(r).includes('rooms'));
 assert.deepEqual(R.readResponse(JSON.stringify(r)),r);
 assert.throws(()=>R.respond(d,{},{},{id:'prj_other'},'x'),/mismo proyecto/);
 assert.throws(()=>R.readResponse({...r,items:[{id:'x',status:'implemented'}]}),/indicar su versión/);
 assert.throws(()=>R.readResponse({...r,items:[{id:'x',status:'done'}]}),/estado no válido/);
});
