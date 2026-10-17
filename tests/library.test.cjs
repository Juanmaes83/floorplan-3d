const {test}=require('node:test'),assert=require('node:assert/strict');
const Core=require('../js/project-core.js'),Library=require('../js/project-library.js');
function fixture(){const map=new Map(),storage={getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v)};return {storage,library:Library.load(storage,Core.initial()),map};}
test('create/open/rename/duplicate/delete persist independently after reload',()=>{
 const {storage,library}=fixture(),first=library.activeId();library.save(Core.initial());library.create('Second');const second=library.activeId();
 const p=library.project();p.objects.pop();library.save(p);library.rename(second,'Renamed');library.duplicate(second,'Copy');const copy=library.activeId();
 assert.notEqual(library.project().id,p.id);library.open(first);assert.equal(library.project().objects.length,46);
 const reload=Library.load(storage,Core.initial());reload.open(second);assert.equal(reload.project().objects.length,45);assert.equal(reload.list().find(e=>e.id===second).name,'Renamed');reload.remove(second);assert.equal(reload.list().length,2);reload.open(copy);assert.equal(reload.project().objects.length,45);
});
test('failed storage writes and invalid names preserve collection atomically',()=>{const {storage,library,map}=fixture();library.save(Core.initial());const before=JSON.stringify(library.list()),saved=map.get(Library.KEY);storage.setItem=()=>{throw Error('quota');};assert.throws(()=>library.create('Other'),/quota/);assert.equal(JSON.stringify(library.list()),before);assert.equal(map.get(Library.KEY),saved);assert.throws(()=>library.rename(library.activeId(),' '));assert.throws(()=>library.remove(library.activeId()),/al menos/);});
test('collection rejects corruption without overwriting source',()=>{const {storage,map}=fixture();map.set(Library.KEY,'{"version":1,"entries":[]}');assert.throws(()=>Library.load(storage,Core.initial()));assert.equal(map.get(Library.KEY),'{"version":1,"entries":[]}');});
test('renaming a project updates its portable name without altering independent projects',()=>{const {library,storage}=fixture();library.save(Core.initial());const first=library.activeId(),original=library.project();library.create('Second');const second=library.activeId();library.rename(second,'Vivienda');assert.equal(library.project().name,'Vivienda');const reloaded=Library.load(storage,Core.initial());reloaded.open(second);assert.equal(reloaded.project().name,'Vivienda');reloaded.open(first);assert.deepEqual(reloaded.project(),original);});
test('file import preserves the visible original atomically, even when the incoming document has the same ID',()=>{
 const {library,storage}=fixture(),originalId=library.activeId(),visible=library.project();visible.objects.pop();
 const incoming=Core.initial();incoming.name='Importado';let writes=0;const write=storage.setItem;storage.setItem=(k,v)=>{writes++;write(k,v);};
 const imported=library.importProject(visible,incoming,'Importado');assert.equal(writes,1);assert.notEqual(library.activeId(),originalId);assert.deepEqual(imported,incoming);
 const reloaded=Library.load(storage,Core.initial());assert.equal(reloaded.list().length,2);reloaded.open(originalId);assert.deepEqual(reloaded.project(),visible);
});
test('failed or invalid file imports leave every entry and the active project unchanged',()=>{
 const {library,storage,map}=fixture();library.save(Core.initial());const visible=library.project(),before=library.all(),active=library.activeId(),saved=map.get(Library.KEY);
 const invalid=Core.initial();invalid.rooms[0].polygon=[];assert.throws(()=>library.importProject(visible,invalid,'Inválido'));assert.deepEqual(library.all(),before);
 storage.setItem=()=>{throw Error('quota');};visible.objects.pop();assert.throws(()=>library.importProject(visible,Core.initial(),'Nuevo'),/quota/);
 assert.equal(library.activeId(),active);assert.deepEqual(library.all(),before);assert.equal(map.get(Library.KEY),saved);
});
