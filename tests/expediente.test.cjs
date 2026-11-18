// F0.1 · Expediente RUBIK: export → clean browser → restore, integrity, historical formats, corruption, repetition.
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const C=require('../js/project-core.js'),B=require('../js/building-core.js'),P=require('../js/project-package.js'),T=require('../js/tracing-core.js');
const Library=require('../js/project-library.js'),Budget=require('../js/budget-core.js'),X=require('../js/expediente-core.js');
const F=require('./fixtures/building-fixture.cjs');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');

// A browser profile: localStorage + IndexedDB images, both in memory.
function browser(){
 const map=new Map(),images=new Map();
 const storage={getItem:k=>map.has(k)?map.get(k):null,setItem:(k,v)=>map.set(k,String(v)),removeItem:k=>map.delete(k),key:i=>[...map.keys()][i]??null,get length(){return map.size;}};
 const io={putImages:async entries=>{for(const [k,b] of entries)images.set(k,b);},removeImages:async keys=>{for(const k of keys)images.delete(k);},getImage:async k=>images.get(k)};
 return {map,images,storage,io,library:()=>Library.load(storage,C.initial())};
}
const journalKeys=b=>[...b.map.keys()].filter(k=>k.startsWith(X.JOURNAL+':'));
const snapshot=b=>JSON.stringify([...b.map].sort())+'|'+[...b.images.keys()].sort().join(',');
function budgetFor(projectId,tax=21){const b=Budget.createBudget({id:`bud_${projectId}`,subject:{type:'project',id:projectId},title:'Presupuesto reforma',taxRatePercent:tax});Budget.validateBudget(b);return b;}
function setDocs(b,key,docs){const all=JSON.parse(b.storage.getItem(key)||'{}');Object.assign(all,docs);b.storage.setItem(key,JSON.stringify(all));}
// Puts the fixture images in the profile and points the project(s) at them, as an import from ZIP leaves them.
async function storeImages(b,projects,fx){for(const p of projects)for(const im of p.sourceImages||[]){const k='img_'+crypto.randomBytes(8).toString('hex');await b.io.putImages([[k,new Blob([fx.bytesFor(im.id)],{type:im.mediaType})]]);im.storage={kind:'local-browser',ref:k};}}
async function singleProfile(){
 const fx=F.build(),b=browser(),lib=b.library(),p=JSON.parse(JSON.stringify(fx.building.levels[0].project));
 await storeImages(b,[p],fx);lib.importProject(lib.project(),p,'Reforma Calle Mayor');
 setDocs(b,'rubik-budget-v1',{[p.id]:budgetFor(p.id)});setDocs(b,'rubik-review-v1',{[p.id]:{received:[],note:'observaciones del cliente'}});
 return {fx,b,lib,project:p};
}
async function exportActive(b,lib,opts={}){const collected=X.collect({library:lib,storage:b.storage});const {archive,manifest}=await X.pack(collected,{getImage:b.io.getImage,now:()=>'2026-11-18T12:00:00.000Z',...opts});return {bytes:await archive.arrayBuffer(),manifest};}
const withoutStorage=p=>{const c=JSON.parse(JSON.stringify(p));for(const im of c.sourceImages||[]){delete im.storage;delete im.bytes;delete im.sha256;delete im.originalFileName;}return c;};
const fingerprints=m=>Object.fromEntries(m.files.map(f=>[f.path,f.sha256]));

test('a project with its image, budget and review is restored in a clean browser with the same content',async()=>{
 const {b,lib,project}=await singleProfile(),{bytes,manifest}=await exportActive(b,lib);
 assert.equal(manifest.format,'rubik-sota.expediente');assert.equal(manifest.subject.kind,'project');assert.deepEqual(manifest.notIncluded,X.NOT_INCLUDED);
 assert.ok(manifest.files.every(f=>/^[0-9a-f]{64}$/.test(f.sha256)));
 const clean=browser(),target=clean.library(),parsed=await X.read(bytes);assert.equal(parsed.source,'expediente');
 const r=await X.restore(parsed,{library:target,storage:clean.storage,...clean.io,visible:target.project()});
 assert.equal(r.status,'restored');assert.deepEqual(r.reidentified,[]);assert.equal(r.images,1);
 const restored=Library.load(clean.storage,C.initial());restored.open(r.entryId);
 assert.equal(restored.project().id,project.id);assert.deepEqual(withoutStorage(restored.project()),withoutStorage(project));
 // Budget ↔ project relation: same id, same document.
 assert.deepEqual(JSON.parse(clean.storage.getItem('rubik-budget-v1'))[project.id],JSON.parse(b.storage.getItem('rubik-budget-v1'))[project.id]);
 assert.deepEqual(JSON.parse(clean.storage.getItem('rubik-review-v1'))[project.id],{received:[],note:'observaciones del cliente'});
 // Image bytes identical; exporting again from the clean browser yields the same files (fingerprints).
 const ref=restored.project().sourceImages[0].storage.ref,orig=b.images.get(lib.project().sourceImages[0].storage.ref);
 assert.equal(sha(Buffer.from(await clean.images.get(ref).arrayBuffer())),sha(Buffer.from(await orig.arrayBuffer())));
 const again=await exportActive(clean,restored);assert.deepEqual(fingerprints(again.manifest),fingerprints(manifest));
});

test('a two-level building keeps every level, image and per-level budget',async()=>{
 const fx=F.build(),b=browser(),lib=b.library(),bld=JSON.parse(JSON.stringify(fx.building));
 await storeImages(b,bld.levels.map(l=>l.project),fx);lib.importBuilding(lib.project(),bld,bld.name);
 const ids=bld.levels.map(l=>l.project.id);setDocs(b,'rubik-budget-v1',{[ids[0]]:budgetFor(ids[0]),[ids[1]]:budgetFor(ids[1],10)});
 const {bytes,manifest}=await exportActive(b,lib);assert.equal(manifest.subject.kind,'building');assert.equal(manifest.documents.budgets.length,2);
 const clean=browser(),target=clean.library(),r=await X.restore(await X.read(bytes),{library:target,storage:clean.storage,...clean.io,visible:target.project()});
 assert.equal(r.status,'restored');assert.equal(r.images,2);
 const restored=Library.load(clean.storage,C.initial());restored.open(r.entryId);
 assert.deepEqual(restored.building().levels.map(l=>l.project.id),ids);
 const budgets=JSON.parse(clean.storage.getItem('rubik-budget-v1'));assert.equal(budgets[ids[0]].taxRatePercent,21);assert.equal(budgets[ids[1]].taxRatePercent,10);
});

test('historical project ZIP, building ZIP and project JSON are still read and restored',async()=>{
 const {b,lib,project}=await singleProfile();
 const legacyZip=await (await P.encode(lib.project(),b.io.getImage)).arrayBuffer();
 const fx=F.build(),{entries}=await B.packageEntries(fx.building,im=>fx.bytesFor(im.id),T.imageInfo),legacyBuilding=await P.zip(entries,{check:B.packagePath}).arrayBuffer();
 const initial=C.initial();initial.id='prj_json-historico';initial.name='Proyecto JSON histórico';const json=new TextEncoder().encode(JSON.stringify(initial)).buffer;
 for(const [buffer,source] of [[legacyZip,'project-zip'],[legacyBuilding,'building-zip'],[json,'project-json']]){
  const parsed=await X.read(buffer);assert.equal(parsed.source,source);assert.deepEqual(parsed.documents,{budgets:{},reviews:{}});
  const clean=browser(),target=clean.library(),r=await X.restore(parsed,{library:target,storage:clean.storage,...clean.io,visible:target.project()});assert.equal(r.status,'restored',source);
 }
 assert.equal((await X.read(legacyZip)).project.id,project.id);
});

test('a damaged or inconsistent expediente is rejected before anything is written',async()=>{
 const {b,lib}=await singleProfile(),{bytes}=await exportActive(b,lib),base=await P.unzip(bytes,{check:X.check,maxEntries:X.MAX_ENTRIES,jsonNames:['expediente.json','project.json']});
 const manifestOf=m=>JSON.parse(new TextDecoder().decode(m.get('expediente.json'))),put=(m,v)=>m.set('expediente.json',new TextEncoder().encode(JSON.stringify(v)));
 const budgetPath=manifestOf(base).documents.budgets[0].path;
 const cases={
  'altered budget':[m=>{const d=JSON.parse(new TextDecoder().decode(m.get(budgetPath)));d.title='Otro';m.set(budgetPath,new TextEncoder().encode(JSON.stringify(d)));},/huella SHA-256/],
  'missing document':[m=>{m.delete(budgetPath);},/Falta un archivo/],
  'unlisted document':[m=>{m.set('documents/review-999.json',new TextEncoder().encode('{}'));},/no lista/],
  'unsupported version':[m=>{const v=manifestOf(m);v.version=2;put(m,v);},/versión 2/],
  'foreign manifest':[m=>{const v=manifestOf(m);v.format='otro';put(m,v);},/no es un manifiesto/],
  'document for another project':[m=>{const v=manifestOf(m);v.documents.budgets[0].projectId='prj_otro-proyecto';put(m,v);},/no pertenece/],
  'duplicated document':[m=>{const v=manifestOf(m);v.documents.budgets.push({...v.documents.budgets[0]});put(m,v);},/repetido/],
  'path not allowed':[m=>{m.set('../fuera.json',new TextEncoder().encode('{}'));},/no permitida/],
 };
 for(const [name,[mutate,message]] of Object.entries(cases)){
  const m=new Map([...base].map(([k,v])=>[k,new Uint8Array(v)]));mutate(m);
  const buffer=await P.zip(m,{check:n=>n}).arrayBuffer(),clean=browser(),target=clean.library();target.save(target.project());const before=snapshot(clean);
  await assert.rejects(async()=>X.restore(await X.read(buffer),{library:target,storage:clean.storage,...clean.io,visible:target.project()}),message,name);
  assert.equal(snapshot(clean),before,name);
 }
 const truncated=bytes.slice(0,bytes.byteLength-40);await assert.rejects(X.read(truncated));
});

test('repeated import is idempotent; changed content becomes a visible copy with its own budget',async()=>{
 const {b,lib,project}=await singleProfile(),{bytes}=await exportActive(b,lib);
 const clean=browser(),target=clean.library(),ctx=()=>({library:target,storage:clean.storage,...clean.io,visible:target.project()});
 const first=await X.restore(await X.read(bytes),ctx()),entries=target.list().length,images=clean.images.size;
 const second=await X.restore(await X.read(bytes),ctx());assert.equal(second.status,'already-present');assert.equal(second.entryId,first.entryId);assert.equal(second.contentId,first.contentId);
 assert.equal(target.list().length,entries);assert.equal(clean.images.size,images);
 // Re-importing into the original browser is also recognised.
 assert.equal((await X.restore(await X.read(bytes),{library:lib,storage:b.storage,...b.io,visible:lib.project()})).status,'already-present');
 // The project changed here after the export: importing the old file must not overwrite it nor share its budget.
 const edited=lib.project();edited.objects.pop();lib.save(edited);const budgetsBefore=JSON.parse(b.storage.getItem('rubik-budget-v1'));
 const copy=await X.restore(await X.read(bytes),{library:lib,storage:b.storage,...b.io,visible:lib.project()});
 assert.equal(copy.status,'restored');assert.equal(copy.reidentified.length,1);const newId=copy.reidentified[0].to;assert.notEqual(newId,project.id);
 const budgets=JSON.parse(b.storage.getItem('rubik-budget-v1'));assert.deepEqual(budgets[project.id],budgetsBefore[project.id]);
 assert.equal(budgets[newId].id,`bud_${newId}`);assert.equal(budgets[newId].subject.id,newId);
 assert.equal(copy.reidentified[0].reason,'id-in-use');assert.equal(lib.origin(),project.id);
});

test('documents left by a deleted project are kept: the restored project gets a new id instead',async()=>{
 const {b,lib,project}=await singleProfile(),{bytes}=await exportActive(b,lib);
 const clean=browser(),target=clean.library(),orphan=budgetFor(project.id,4);setDocs(clean,'rubik-budget-v1',{[project.id]:orphan});
 const r=await X.restore(await X.read(bytes),{library:target,storage:clean.storage,...clean.io,visible:target.project()});
 assert.equal(r.reidentified.length,1);assert.equal(r.reidentified[0].reason,'documents-in-use');const budgets=JSON.parse(clean.storage.getItem('rubik-budget-v1'));
 assert.deepEqual(budgets[project.id],orphan);assert.equal(budgets[r.reidentified[0].to].taxRatePercent,21);
});

test('a failed write undoes the whole restore; a corrupt document store is never overwritten',async()=>{
 const {b,lib}=await singleProfile(),{bytes}=await exportActive(b,lib);
 const clean=browser(),target=clean.library();target.save(target.project());const before=snapshot(clean),write=clean.storage.setItem;
 clean.storage.setItem=(k,v)=>{if(k==='rubik-budget-v1')throw Object.assign(Error('quota'),{name:'QuotaExceededError'});write(k,v);};
 await assert.rejects(X.restore(await X.read(bytes),{library:target,storage:clean.storage,...clean.io,visible:target.project()}),/quota/);
 clean.storage.setItem=write;assert.equal(snapshot(clean),before);
 const reloaded=Library.load(clean.storage,C.initial());assert.equal(reloaded.list().length,1);
 clean.storage.setItem('rubik-budget-v1','{roto');const corrupt=snapshot(clean);
 await assert.rejects(X.restore(await X.read(bytes),{library:target,storage:clean.storage,...clean.io,visible:target.project()}),e=>e.code==='store-invalid');
 assert.equal(snapshot(clean),corrupt);
});

test('the expediente core works without network or external services',()=>{
 const source=fs.readFileSync(path.join(__dirname,'..','js','expediente-core.js'),'utf8');
 assert.doesNotMatch(source,/\bfetch\(|XMLHttpRequest|WebSocket|sendBeacon|https?:\/\//);
});

// ── Findings of the F0.1 closing review ─────────────────────────────────────────────────────────────────────────
const ctxOf=(b,lib,extra={})=>({library:lib,storage:b.storage,...b.io,visible:lib.project(),...extra});
async function profileWithImage(fx,bytes){const b=browser(),lib=b.library(),p=JSON.parse(JSON.stringify(fx.building.levels[0].project));
 for(const im of p.sourceImages){const k='img_k'+crypto.randomBytes(4).toString('hex');await b.io.putImages([[k,new Blob([bytes],{type:im.mediaType})]]);im.storage={kind:'local-browser',ref:k};}
 lib.importProject(lib.project(),p,'Reforma');return {b,lib};}

test('identity includes the real image bytes: same geometry with another image is not «already present»',async()=>{
 const fx=F.build(),png=fx.bytesFor('img_synthetic'),other=new Uint8Array(png);other[other.length-20]^=1;
 const a=await profileWithImage(fx,png),z=await profileWithImage(fx,other),fileA=(await exportActive(a.b,a.lib)).bytes,fileZ=(await exportActive(z.b,z.lib)).bytes;
 const t=browser(),lib=t.library();
 assert.equal((await X.restore(await X.read(fileA),ctxOf(t,lib))).status,'restored');
 const second=await X.restore(await X.read(fileZ),ctxOf(t,lib));assert.equal(second.status,'restored');assert.equal(second.reidentified[0].reason,'id-in-use');
 assert.equal((await X.restore(await X.read(fileZ),ctxOf(t,lib))).status,'already-present');
});

test('repeated imports after a re-identified copy never pile up copies; an intended copy is still possible',async()=>{
 const {b,lib}=await singleProfile(),{bytes}=await exportActive(b,lib);
 const edited=lib.project();edited.objects.pop();lib.save(edited);
 const first=await X.restore(await X.read(bytes),ctxOf(b,lib)),count=lib.list().length;assert.equal(first.status,'restored');
 for(let i=0;i<3;i++){const r=await X.restore(await X.read(bytes),ctxOf(b,lib));assert.equal(r.status,'already-present');assert.equal(r.entryId,first.entryId);}
 assert.equal(lib.list().length,count);
 const intended=await X.restore(await X.read(bytes),ctxOf(b,lib,{copy:true}));assert.equal(intended.status,'restored');assert.equal(lib.list().length,count+1);
 // The work restored in a clean browser, exported again and brought back, is the same work.
 const clean=browser(),cl=clean.library(),r=await X.restore(await X.read(bytes),ctxOf(clean,cl));cl.open(r.entryId);
 const back=(await exportActive(clean,cl)).bytes;assert.equal((await X.restore(await X.read(back),ctxOf(b,lib))).status,'already-present');
});

test('a multi-level building is idempotent after its levels were re-identified',async()=>{
 const fx=F.build(),b=browser(),lib=b.library(),bld=JSON.parse(JSON.stringify(fx.building));await storeImages(b,bld.levels.map(l=>l.project),fx);lib.importBuilding(lib.project(),bld,bld.name);
 const ids=bld.levels.map(l=>l.project.id);setDocs(b,'rubik-budget-v1',{[ids[0]]:budgetFor(ids[0]),[ids[1]]:budgetFor(ids[1],10)});
 const {bytes}=await exportActive(b,lib);const changed=lib.building();changed.levels[1].project.objects.pop();lib.saveBuilding(changed);
 const copy=await X.restore(await X.read(bytes),ctxOf(b,lib));assert.equal(copy.status,'restored');assert.equal(copy.reidentified.length,2);
 const budgets=JSON.parse(b.storage.getItem('rubik-budget-v1'));for(const {to} of copy.reidentified){assert.equal(budgets[to].subject.id,to);assert.equal(budgets[to].id,`bud_${to}`);}
 assert.equal(budgets[copy.reidentified[1].to].taxRatePercent,10);const count=lib.list().length;
 for(let i=0;i<2;i++)assert.equal((await X.restore(await X.read(bytes),ctxOf(b,lib))).status,'already-present');assert.equal(lib.list().length,count);
});

test('historical JSON keeps its image references as the JSON import does, and says which are missing',async()=>{
 const {b,lib}=await singleProfile(),json=lib.project();json.id='prj_json-con-imagen';json.name='Proyecto JSON con imagen';
 const buffer=new TextEncoder().encode(JSON.stringify(json)).buffer;
 const here=await X.restore(await X.read(buffer),ctxOf(b,lib));assert.equal(here.status,'restored');assert.deepEqual(here.missingImages,[]);assert.equal(here.imagesIncluded,false);
 const clean=browser(),cl=clean.library(),there=await X.restore(await X.read(buffer),ctxOf(clean,cl));
 assert.equal(there.status,'restored');assert.deepEqual(there.missingImages,[json.sourceImages[0].id]);assert.equal(there.images,0);
});

test('unsaved changes of the visible project are kept when a restore opens another entry',async()=>{
 const {b,lib}=await singleProfile(),{bytes}=await exportActive(b,lib),clean=browser(),cl=clean.library(),active=cl.activeId(),visible=cl.project();visible.objects.pop();
 await X.restore(await X.read(bytes),{library:cl,storage:clean.storage,...clean.io,visible});
 const reloaded=Library.load(clean.storage,C.initial());reloaded.open(active);assert.equal(reloaded.project().objects.length,visible.objects.length);
});

test('nothing is exported when a resource or a document is missing or corrupt',async()=>{
 const {b,lib}=await singleProfile();b.images.clear();await assert.rejects(exportActive(b,lib),/Imagen local no disponible/);
 const other=await singleProfile(),all=JSON.parse(other.b.storage.getItem('rubik-budget-v1'));all[other.project.id].currency='USD';other.b.storage.setItem('rubik-budget-v1',JSON.stringify(all));
 assert.throws(()=>X.collect({library:other.lib,storage:other.b.storage}),e=>e.code==='budget-invalid');
});

test('a cleanup that fails is reported, never hidden, and recover() finishes it later',async()=>{
 const {b,lib}=await singleProfile(),{bytes}=await exportActive(b,lib),clean=browser(),cl=clean.library(),before=cl.list().length;
 // The library write (commit point) fails, then the budget cleanup and the image cleanup fail too.
 const write=clean.storage.setItem;let budgetWrites=0;
 clean.storage.setItem=(k,v)=>{if(k===Library.KEY&&budgetWrites)throw Object.assign(Error('quota'),{name:'QuotaExceededError'});if(k==='rubik-budget-v1'&&++budgetWrites>1)throw Error('sin espacio');write(k,v);};
 const error=await X.restore(await X.read(bytes),{...ctxOf(clean,cl),removeImages:async()=>{throw Error('IndexedDB no disponible');}}).catch(e=>e);
 assert.ok(error instanceof X.ExpedienteError);assert.match(error.message,/no se pudieron limpiar/);assert.equal(error.cleanupPending.length,2);assert.match(error.cause.message,/quota/);
 clean.storage.setItem=write;assert.equal(Library.load(clean.storage,C.initial()).list().length,before);
 assert.equal(journalKeys(clean).length,1);assert.ok(clean.images.size>0);assert.ok(Object.keys(JSON.parse(clean.storage.getItem('rubik-budget-v1'))).length>0);
 // Next start-up (a reload or another tab): recover() undoes the leftovers.
 const report=await X.recover({library:Library.load(clean.storage,C.initial()),storage:clean.storage,removeImages:clean.io.removeImages});
 assert.deepEqual(report,{committed:0,rolledBack:1,pending:[]});assert.deepEqual(journalKeys(clean),[]);assert.equal(clean.images.size,0);
 assert.deepEqual(JSON.parse(clean.storage.getItem('rubik-budget-v1')),{});
});

test('an interruption after the commit point leaves a complete project; recover() only drops the journal',async()=>{
 const {b,lib}=await singleProfile(),{bytes}=await exportActive(b,lib),clean=browser(),cl=clean.library(),remove=clean.storage.removeItem;
 clean.storage.removeItem=k=>{if(k.startsWith(X.JOURNAL+':'))throw Error('cierre del navegador');remove(k);};
 const r=await X.restore(await X.read(bytes),ctxOf(clean,cl));assert.equal(r.status,'restored');assert.equal(r.journalPending,true);
 clean.storage.removeItem=remove;const reopened=Library.load(clean.storage,C.initial());
 assert.deepEqual(await X.recover({library:reopened,storage:clean.storage,removeImages:clean.io.removeImages}),{committed:1,rolledBack:0,pending:[]});
 reopened.open(r.entryId);assert.equal(reopened.project().sourceImages.length,1);assert.ok(clean.images.get(reopened.project().sourceImages[0].storage.ref));
});

test('a document written by another tab during the restore is not overwritten and nothing is added',async()=>{
 const {b,lib,project}=await singleProfile(),{bytes}=await exportActive(b,lib),clean=browser(),cl=clean.library(),theirs=budgetFor(project.id,7);
 const put=clean.io.putImages,ctx={...ctxOf(clean,cl),putImages:async e=>{await put(e);setDocs(clean,'rubik-budget-v1',{[project.id]:theirs});}};
 const error=await X.restore(await X.read(bytes),ctx).catch(e=>e);assert.equal(error.code,'document-conflict');
 assert.deepEqual(JSON.parse(clean.storage.getItem('rubik-budget-v1'))[project.id],theirs);assert.equal(cl.list().length,1);assert.equal(clean.images.size,0);
 assert.deepEqual(journalKeys(clean),[]);
});

test('restore and recover run under the same Web Lock when the browser offers it',async()=>{
 const {b,lib}=await singleProfile(),{bytes}=await exportActive(b,lib),clean=browser(),cl=clean.library(),names=[];
 const locks={request:async(name,fn)=>{names.push(name);return fn();}};
 await X.restore(await X.read(bytes),ctxOf(clean,cl,{locks}));await X.recover({library:cl,storage:clean.storage,removeImages:clean.io.removeImages,locks});
 assert.deepEqual(names,['rubik-sota-expediente','rubik-sota-expediente']);
});

test('a tab with a stale copy of the library refuses to restore instead of erasing the other tab’s work',async()=>{
 const {b,lib}=await singleProfile(),{bytes}=await exportActive(b,lib),clean=browser(),tabA=clean.library(),tabB=Library.load(clean.storage,C.initial());
 const a=await X.restore(await X.read(bytes),ctxOf(clean,tabA));assert.equal(a.status,'restored');const stored=clean.storage.getItem(Library.KEY);
 const error=await X.restore(await X.read(bytes),{...ctxOf(clean,tabB),copy:true}).catch(e=>e);assert.equal(error.code,'library-stale');
 assert.equal(clean.storage.getItem(Library.KEY),stored);assert.deepEqual(journalKeys(clean),[]);
});
