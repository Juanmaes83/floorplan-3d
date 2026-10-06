const {test}=require('node:test'),assert=require('node:assert/strict');
const Core=require('../js/project-core.js'),Library=require('../js/project-library.js'),V=require('../js/project-variants.js'),T=require('../js/tracing-core.js');
function fixture(){const map=new Map(),storage={getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v)};const library=Library.load(storage,Core.initial());library.save(Core.initial());return {storage,library,map};}
const raw=map=>JSON.parse(map.get(Library.KEY));

test('variant copies the visible (possibly unsaved) project, gets unique ids and a local link',()=>{
 const {library,map,storage}=fixture(),original=library.activeId(),visible=library.project();visible.objects.pop();
 const before=library.list().length;library.variant(visible);
 const variant=library.activeId(),list=library.list();
 assert.equal(list.length,before+1);assert.notEqual(variant,original);
 assert.deepEqual(list.find(e=>e.id===variant),{id:variant,name:'Proyecto inicial · Variante 1',variantOf:original});
 const stored=raw(map),o=stored.entries.find(e=>e.id===original),v=stored.entries.find(e=>e.id===variant);
 assert.equal(o.project.objects.length,45,'the original stores the visible state the copy was made from');
 assert.equal(v.project.objects.length,45);assert.notEqual(v.project.id,o.project.id);assert.equal(v.project.name,'Proyecto inicial · Variante 1');
 assert.equal(v.variantOf,original);assert.equal('variantOf' in v.project,false,'link lives on the entry, not in the project');
 const ids=stored.entries.map(e=>e.id),pids=stored.entries.map(e=>e.project.id);assert.equal(new Set(ids).size,ids.length);assert.equal(new Set(pids).size,pids.length);
 // Persistence after reload.
 const reload=Library.load(storage,Core.initial());assert.equal(reload.list().find(e=>e.id===variant).variantOf,original);
 assert.deepEqual(reload.group(variant).map(g=>g.id),[original,variant]);
});

test('editing the variant never mutates the original; renames keep the relation',()=>{
 const {library}=fixture(),original=library.activeId(),snapshot=JSON.stringify(library.project());
 library.variant(library.project());const variant=library.activeId(),edit=library.project();edit.objects=[];edit.rooms[0].name='Cambiada';library.save(edit);
 library.open(original);assert.equal(JSON.stringify(library.project()),snapshot);
 library.rename(original,'Casa');library.rename(variant,'Casa con cocina abierta');
 assert.deepEqual(library.group(original).map(g=>[g.name,g.variantOf]),[['Casa',undefined],['Casa con cocina abierta',original]]);
 assert.equal(library.group(variant)[1].project.objects.length,0);
});

test('names avoid collisions, respect 120 characters, nest under the root and cap at two variants',()=>{
 const {library}=fixture(),original=library.activeId();library.rename(original,'A'.repeat(120));
 library.variant(library.project());const v1=library.activeId(),expected='A'.repeat(120-' · Variante 1'.length)+' · Variante 1';assert.equal(library.list().find(e=>e.id===v1).name,expected);assert.equal(expected.length,120);
 library.rename(v1,'Mi variante');library.variant(library.project());const v2=library.activeId();
 assert.equal(library.list().find(e=>e.id===v2).name,expected,'freed suffix is reused, no collision');
 assert.equal(library.list().find(e=>e.id===v2).variantOf,original,'variant of a variant links to the original');
 const before=JSON.stringify(library.all());assert.throws(()=>library.variant(library.project()),/hasta 2 variantes/);assert.equal(JSON.stringify(library.all()),before);
 assert.throws(()=>library.variant(library.project(),'Mi variante'));
});

test('removing a variant keeps the original; removing the original keeps variants without a dangling link',()=>{
 const {library,storage,map}=fixture(),original=library.activeId(),originalProject=JSON.stringify(library.project());
 library.variant(library.project());const v1=library.activeId();library.variant(library.project());const v2=library.activeId();
 library.remove(v2);assert.equal(library.activeId(),original,'removing the active variant reopens its original');
 assert.equal(JSON.stringify(library.project()),originalProject);assert.deepEqual(library.group(original).map(g=>g.id),[original,v1]);
 library.open(v1);library.remove(original);
 const stored=raw(map);assert.equal(stored.entries.some(e=>e.id===original),false);
 const v=stored.entries.find(e=>e.id===v1);assert.ok(v,'variant survives');assert.equal('variantOf' in v,false,'link dropped, nothing points to a missing entry');
 assert.deepEqual(library.group(v1).map(g=>g.id),[v1]);Core.validate(v.project);
 assert.deepEqual(Library.load(storage,Core.initial()).list().find(e=>e.id===v1),{id:v1,name:'Proyecto inicial · Variante 1'});
});

test('full storage fails atomically: same bytes, same list, same active project, no partial metadata',()=>{
 const {library,storage,map}=fixture(),saved=map.get(Library.KEY),list=JSON.stringify(library.list()),active=library.activeId(),visible=library.project();visible.objects.pop();
 const real=storage.setItem;storage.setItem=()=>{const e=new Error('The quota has been exceeded.');e.name='QuotaExceededError';throw e;};
 assert.throws(()=>library.variant(visible),e=>e.name==='QuotaExceededError');
 assert.equal(map.get(Library.KEY),saved,'byte-for-byte');assert.equal(JSON.stringify(library.list()),list);assert.equal(library.activeId(),active);
 assert.equal(library.project().objects.length,46,'stored original untouched');storage.setItem=real;
});

test('old collections without variant metadata load unchanged; stale links are ignored, not rewritten',()=>{
 const map=new Map(),storage={getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v)},p=Core.initial();
 const legacy=JSON.stringify({version:1,activeId:'prj_a1',entries:[{id:'prj_a1',name:'Uno',project:p},{id:'prj_b2',name:'Dos',project:{...Core.clone(p),id:'prj_other'}}]});map.set(Library.KEY,legacy);
 const lib=Library.load(storage,p);assert.deepEqual(lib.list(),[{id:'prj_a1',name:'Uno'},{id:'prj_b2',name:'Dos'}]);assert.equal(map.get(Library.KEY),legacy,'loading does not write');
 const stale=JSON.parse(legacy);stale.entries[1].variantOf='prj_gone';map.set(Library.KEY,JSON.stringify(stale));
 const lib2=Library.load(storage,p);assert.deepEqual(lib2.list()[1],{id:'prj_b2',name:'Dos'});assert.deepEqual(lib2.group('prj_b2').map(g=>g.id),['prj_b2']);
 assert.equal(JSON.parse(map.get(Library.KEY)).entries[1].variantOf,'prj_gone','stale metadata is preserved, just not treated as a link');
 stale.entries[1].variantOf=5;map.set(Library.KEY,JSON.stringify(stale));assert.throws(()=>Library.load(storage,p),/Invalid local project entry/);
});

test('exported variant is a normal FloorPlanProjectV1 project without local metadata',()=>{
 const {library}=fixture();library.variant(library.project());const exported=JSON.parse(JSON.stringify(library.project()));
 Core.validate(exported);assert.equal(JSON.stringify(exported).includes('variantOf'),false);assert.equal(exported.schema,'rubik-sota.floorplan-project');
 assert.deepEqual(Object.keys(exported).sort(),Object.keys(Core.initial()).sort());
});

test('comparison metrics reuse geometry and the Phase A review states without inventing a threshold',()=>{
 const p=Core.initial(),m=V.metrics(p);
 assert.ok(Math.abs(m.netAreaM2-87.18)<0.005,`net area ${m.netAreaM2}`);assert.equal(m.objects,46);
 assert.equal(m.review.checks.holgura.status,'insufficient_evidence');assert.equal(m.review.status,'partial');assert.deepEqual(m.review.counts,{solape:0,holgura:0,puerta:1});
 const t=V.metrics(p,{clearanceMm:300});assert.equal(t.review.checks.holgura.status,'checked');assert.ok(t.review.counts.holgura>0);
 const q=Core.clone(p);q.objects=[];assert.deepEqual(V.metrics(q).review.counts,{solape:0,holgura:0,puerta:0});assert.equal(V.metrics(q).objects,0);
});
