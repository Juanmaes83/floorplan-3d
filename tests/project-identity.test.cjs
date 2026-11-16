// IDENTITY CONTRACT (consolidation P1, cross review of #240: CORREGIR-1 / CORREGIR-2). One project.id per independent
// project of the local collection; internal copies fork the saved budget; external imports never inherit a local
// budget; old collections are migrated once, conservatively. Engines: FloorPlanProjectV1, FloorPlanBudgetV1,
// calculateBudget — nothing else computes an amount here.
const {test}=require('node:test'),assert=require('node:assert/strict');
const Core=require('../js/project-core.js'),Library=require('../js/project-library.js'),Building=require('../js/building-core.js');
const D=require('../js/budget-draft-core.js'),B=require('../js/budget-core.js');
const BUD='rubik-budget-v1',labels={title:'Presupuesto',floor:'Pavimento',skirting:'Rodapié',paint:'Pintura',newWalls:'Tabique nuevo',demolition:'Demolición',door:'Puerta de paso',slidingDoor:'Puerta corredera',window:'Ventana',tariff:'Tarifa del estudio',chapters:{floors:'Pavimentos',walls:'Paredes',partitions:'Tabiquería',carpentry:'Carpintería'}};
function fixture(seed=Core.initial()){const map=new Map(),storage={getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v)};return {storage,map,library:Library.load(storage,seed)};}
const budgets=map=>JSON.parse(map.get(BUD)||'{}');
// A saved budget of `project`: manual price 11 € on paint (reviewed, own VAT 10 %), a BC3-like reference on skirting, VAT 21.
function priced(project){let {budget}=D.draft(project,{labels});const set=(id,fn)=>{const i=budget.items.findIndex(x=>x.id===id);budget.items[i]=fn(budget.items[i]);};
 set('paint',i=>({...B.markReviewed(B.setManualPrice(i,{unitPrice:11,label:'Precio propio',asOf:'2026-11-16'}),{reviewedAt:'2026-11-16T09:00:00Z'}),taxRatePercent:10}));
 set('opening:door',i=>B.setManualPrice(i,{unitPrice:240,label:'Tarifa del estudio',asOf:'2026-11-16'}));
 return JSON.parse(B.serializeBudget(B.validateBudget({...budget,taxRatePercent:21})));}
const saveBudget=(map,project)=>{const all=budgets(map);all[project.id]=priced(project);map.set(BUD,JSON.stringify(all));};
// What Presupuestar would show for `project`: its saved budget drafted over it (same path as the editor).
const shown=(map,project)=>{const prev=budgets(map)[project.id];return D.draft(project,{labels,previous:prev?B.parseBudget(JSON.stringify(prev)):null}).budget;};
const money=b=>{const t=B.calculateBudget(b).totals;return [t.net.amount,t.tax.amount,t.gross.amount];};
const econ=b=>b.items.filter(i=>i.unitPrice!==null).map(i=>[i.id,i.unitPrice,i.quantity.unit,i.review.status,i.taxRatePercent??null,i.priceSource.label]);
const allIds=library=>library.projects().map(p=>p.id);
const unique=library=>{const ids=allIds(library);assert.equal(new Set(ids).size,ids.length,'one project.id per stored project');};

test('import: the same project file imported repeatedly gives independent projects; no local budget is inherited; a free id is kept',()=>{
 const {library,map}=fixture(),original=library.project();saveBudget(map,original);const file=Core.clone(original),before=map.get(BUD);
 const a=library.importProject(library.project(),file,'Copia 1'),b=library.importProject(library.project(),file,'Copia 2'),c=library.importProject(library.project(),file,'Copia 3');
 unique(library);assert.equal(new Set([original.id,a.id,b.id,c.id]).size,4);assert.equal(library.origin(),file.id,'the file id is remembered locally');
 assert.equal(map.get(BUD),before,'an external import copies no budget');for(const p of [a,b,c])assert.equal(B.calculateBudget(shown(map,p)).totals.net.amount,null,'the import starts without prices');
 for(const p of [a,b,c])assert.deepEqual({...p,id:file.id},file,'content and geometry ids untouched');
 const free=Core.initial();free.id='prj_'+'a'.repeat(32);assert.equal(library.importProject(library.project(),free,'Traspaso').id,free.id);assert.equal(library.origin(),null);
 assert.equal(JSON.stringify(library.all()).includes('"origin"'),true);assert.equal('origin' in library.project(),false,'origin is collection metadata, never part of the project');
});
test('duplicate and variant: new identity with an independent copy of prices, own VAT, units, reviews and references; 11 € → 99 € in the copy leaves the original',()=>{
 for(const how of ['duplicate','variant']){
  const {library,map}=fixture(),original=library.project(),first=library.activeId();saveBudget(map,original);const savedOriginal=JSON.stringify(budgets(map)[original.id]);
  const copy=how==='duplicate'?library.duplicate(first,'Copia'):library.variant(original);unique(library);assert.notEqual(copy.id,original.id);
  const cb=budgets(map)[copy.id];assert.deepEqual(cb.subject,{type:'project',id:copy.id},how+': subject.id follows the new project.id');assert.equal(cb.id,'bud_'+copy.id);
  assert.deepEqual({...cb,id:0,subject:0},{...JSON.parse(savedOriginal),id:0,subject:0},how+': everything else is the same document');
  const so=shown(map,original),sc=shown(map,copy);assert.deepEqual(econ(sc),econ(so));assert.deepEqual(econ(sc).find(x=>x[0]==='paint'),['paint',11,'m2','reviewed',10,'Precio propio']);assert.deepEqual(money(sc),money(so));assert.ok(money(sc)[0]>0);
  // 11 € → 99 € in the copy.
  const all=budgets(map),i=all[copy.id].items.findIndex(x=>x.id==='paint');all[copy.id].items[i]=JSON.parse(JSON.stringify(B.setManualPrice(B.parseBudget(JSON.stringify(all[copy.id])).items[i],{unitPrice:99,label:'Precio de la copia',asOf:'2026-11-16'})));map.set(BUD,JSON.stringify(all));
  assert.equal(JSON.stringify(budgets(map)[original.id]),savedOriginal,how+': the original budget is byte-identical');assert.equal(shown(map,original).items.find(x=>x.id==='paint').unitPrice,11);assert.equal(shown(map,copy).items.find(x=>x.id==='paint').unitPrice,99);
  // Close and reopen.
  const re=Library.load({getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v)},Core.initial());unique(re);assert.deepEqual(re.migration(),{reidentified:[],failed:false});
  assert.equal(shown(map,re.projects().find(p=>p.id===original.id)).items.find(x=>x.id==='paint').unitPrice,11);assert.equal(shown(map,re.projects().find(p=>p.id===copy.id)).items.find(x=>x.id==='paint').unitPrice,99);
 }
});
test('a copy without a saved budget, or with a budget already stored under the new id, copies nothing and overwrites nothing',()=>{
 const {library,map}=fixture();library.duplicate(library.activeId(),'Sin presupuesto');assert.equal(map.has(BUD),false,'nothing invented');
 const f=fixture(),o=f.library.project();f.map.set(BUD,'no es json');f.library.duplicate(f.library.activeId(),'Copia');assert.equal(f.map.get(BUD),'no es json','a damaged store is left as it is');
});
test('buildings: duplicating forks the budget of every level; a single project turned into a building keeps its own budget and the building level gets a copy',()=>{
 const {library,map}=fixture(),single=library.project();saveBudget(map,single);
 library.addBuilding(Building.create(single,{name:'Edificio'}));unique(library);const lvl=library.building().levels[0].project;assert.notEqual(lvl.id,single.id);
 assert.deepEqual(budgets(map)[lvl.id].subject,{type:'project',id:lvl.id});assert.deepEqual(money(shown(map,lvl)),money(shown(map,single)));
 const before=library.building();library.duplicate(library.activeId(),'Edificio copia');unique(library);const after=library.building();
 assert.notEqual(after.levels[0].project.id,before.levels[0].project.id);assert.equal(after.levels[0].id!==before.levels[0].id,true);
 assert.deepEqual(after.levels[0].project.walls,before.levels[0].project.walls,'geometry ids are not regenerated');assert.deepEqual(econ(shown(map,after.levels[0].project)),econ(shown(map,before.levels[0].project)));
 // External building file whose level id is already stored: re-identified, no budget inherited.
 const file=Building.create(single,{name:'Importado'}),n=Object.keys(budgets(map)).length;library.importBuilding(library.project(),file,'Importado');unique(library);
 assert.notEqual(library.building().levels[0].project.id,single.id);assert.equal(Object.keys(budgets(map)).length,n);
});
// A collection as master 46174d6 could leave it: the sample, the same file imported twice and a building level, all with one id.
function legacy(){const map=new Map(),p=Core.initial(),twin=Core.clone(p);twin.objects.pop();const b=Building.create(p,{name:'Edificio'});
 map.set(Library.KEY,JSON.stringify({version:1,activeId:'prj_e2',entries:[{id:'prj_e1',name:'Original',project:p},{id:'prj_e2',name:'Copia importada',project:twin},{id:'prj_e3',name:'Otra copia',project:Core.clone(p)},{id:'prj_e4',name:'Edificio',kind:'building',building:b,activeLevelId:b.levels[0].id}]}));
 saveBudget(map,p);return {map,p,storage:{getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v)}};}
test('migration: entries that shared an id are re-identified once, keep the budget they were already showing, and a second load changes nothing',()=>{
 const {map,p,storage}=legacy(),sharedBefore=JSON.stringify(budgets(map)[p.id]);
 const library=Library.load(storage,Core.initial()),m=library.migration();unique(library);assert.equal(m.failed,false);assert.deepEqual(m.reidentified.map(x=>[x.from,x.entryId]),[[p.id,'prj_e2'],[p.id,'prj_e3'],[p.id,'prj_e4']]);
 const all=library.all();assert.equal(all[0].project.id,p.id,'the first entry keeps the id (and its budget, untouched)');assert.equal(JSON.stringify(budgets(map)[p.id]),sharedBefore);
 assert.equal(all[1].project.objects.length,p.objects.length-1,'each entry keeps its own content');assert.equal(all[1].origin.projectId,p.id);assert.equal(library.activeId(),'prj_e2');
 for(const x of m.reidentified){const b=budgets(map)[x.to];assert.deepEqual(b.subject,{type:'project',id:x.to});assert.deepEqual({...b,id:0,subject:0},{...JSON.parse(sharedBefore),id:0,subject:0},'the prices it was showing, nothing more');}
 assert.equal(Object.keys(budgets(map)).length,4);
 // Idempotent: load again (and again) → byte-identical storage, nothing reported.
 const lib1=map.get(Library.KEY),bud1=map.get(BUD);for(let i=0;i<2;i++){const again=Library.load(storage,Core.initial());assert.deepEqual(again.migration(),{reidentified:[],failed:false});assert.equal(map.get(Library.KEY),lib1);assert.equal(map.get(BUD),bud1);}
 // A clean collection is never written on load.
 const clean=fixture();let writes=0;const w=clean.storage.setItem;clean.storage.setItem=(k,v)=>{writes++;w(k,v);};Library.load(clean.storage,Core.initial());assert.equal(writes,0);
});
test('write failures: no half state — a failed collection write restores the budgets; a failed budget write leaves the collection; a failed migration leaves everything as it was',()=>{
 // duplicate: the collection write fails after the budget fork.
 {const {library,map,storage}=fixture(),o=library.project();saveBudget(map,o);library.save(o);const lib0=map.get(Library.KEY),bud0=map.get(BUD),w=storage.setItem;
  storage.setItem=(k,v)=>{if(k===Library.KEY)throw Error('quota');w(k,v);};assert.throws(()=>library.duplicate(library.activeId(),'Copia'),/quota/);
  assert.equal(map.get(Library.KEY),lib0);assert.equal(map.get(BUD),bud0,'no orphan budget is left');assert.equal(library.list().length,1);
  storage.setItem=(k,v)=>{if(k===BUD)throw Error('quota');w(k,v);};assert.throws(()=>library.variant(library.project()),/quota/);assert.equal(map.get(Library.KEY),lib0);assert.equal(map.get(BUD),bud0);assert.equal(library.list().length,1);}
 // migration: cannot be written → the collection loads exactly as stored and says so; the next load tries again.
 {const {map,storage}=legacy(),lib0=map.get(Library.KEY),bud0=map.get(BUD),w=storage.setItem;storage.setItem=()=>{throw Error('quota');};
  const library=Library.load(storage,Core.initial());assert.deepEqual(library.migration(),{reidentified:[],failed:true});assert.equal(map.get(Library.KEY),lib0);assert.equal(map.get(BUD),bud0);assert.equal(library.list().length,4);
  storage.setItem=w;assert.equal(Library.load(storage,Core.initial()).migration().reidentified.length,3);}
});
