// Phase C3: a professional-supplied BC3 gives reference prices (same unit only, chosen column, licence «unknown»),
// the budget bridge applies them unreviewed, and the budget exports as a BC3 that reads back.
const test=require('node:test'),assert=require('node:assert/strict');
const X=require('../js/bc3-budget-core.js'),B=require('../js/budget-core.js'),Bridge=require('../js/budget-cost-bridge.js'),D=require('../js/budget-draft-core.js'),F=require('../js/fiebdc3-codec.js');
const fx=require('./fixtures/bc3/synthetic-tariff.cjs'),project=require('../js/reference-project.js');
const labels={title:'Presupuesto',floor:'Pavimento',skirting:'Rodapié',paint:'Pintura',newWalls:'T',demolition:'D',door:'Puerta de paso',slidingDoor:'Puerta corredera',window:'Ventana',tariff:'Tarifa',chapters:{floors:'Pavimentos y rodapiés',walls:'Paredes',partitions:'Tabiquería',carpentry:'Carpintería'}};
test('loads a BC3 and searches by unit; unknown units are left out',()=>{
 const base=X.load(fx.bytes(),'tarifa.bc3');assert.equal(base.owner,'ESTUDIO DE PRUEBA');assert.deepEqual(base.labels,['Zona A','Zona B']);
 assert.deepEqual(base.items.map(i=>[i.code,i.unit]),[['PAV-ROBLE','m2'],['PINT-LISA','m2'],['PUERTA-LISA','unit'],['RODAPIE','m']],'kg is not a budget unit');
 assert.deepEqual(X.search(base,{text:'pintura paredes',unit:'m2'}).map(i=>i.code),['PINT-LISA']);assert.deepEqual(X.search(base,{text:'pintura',unit:'unit'}),[]);
 assert.throws(()=>X.load(new Uint8Array(Buffer.from('hola')),'x.bc3'),/no es un BC3/);
});
test('a reference quote goes through the bridge unreviewed, with its source',()=>{
 const base=X.load(fx.bytes(),'tarifa.bc3');let {budget}=D.draft(project,{labels});
 budget=Bridge.setPriceFromQuote(budget,'opening:door',X.quote(base,'PUERTA-LISA',1));const door=budget.items.find(i=>i.id==='opening:door');
 assert.equal(door.unitPrice,225);assert.equal(door.priceSource.type,'provider-reference');assert.equal(door.review.status,'unreviewed');assert.equal(door.priceReference.source.licenseStatus,'unknown');assert.match(door.priceReference.source.label,/ESTUDIO DE PRUEBA · Zona B/);
 budget=Bridge.setPriceReferenceFromQuote(budget,'paint',X.quote(base,'PINT-LISA',0));const paint=budget.items.find(i=>i.id==='paint');assert.equal(paint.unitPrice,null);assert.equal(paint.priceReference.unitPrice,7.9);
 assert.throws(()=>Bridge.setPriceFromQuote(budget,'paint',X.quote(base,'PUERTA-LISA')),/unit/,'never across units');
 const again=D.draft(project,{labels,previous:budget}).budget;assert.equal(again.items.find(i=>i.id==='opening:door').priceSource.type,'provider-reference');assert.equal(again.items.find(i=>i.id==='paint').priceReference.code,'PINT-LISA');
});
test('the budget exports as a BC3 that reads back, and can be loaded as a base',()=>{
 let {budget}=D.draft(project,{labels});budget.items=budget.items.map(i=>i.id==='paint'?B.setManualPrice(i,{unitPrice:8.5,label:'Precio propio'}):i);
 const out=X.exportBudget(budget,{title:'Proyecto de ejemplo',date:new Date('2026-10-30T12:00:00Z')});
 assert.equal(out.check.version.format,'FIEBDC-3/2016');assert.equal(out.check.concepts.filter(c=>/^P\d+$/.test(c.code)).length,budget.items.length);
 const paint=out.check.concepts.find(c=>c.summary.startsWith('Pintura'));assert.deepEqual([paint.unit,paint.prices[0].value],['m2',8.5]);
 assert.ok(out.check.decompositions.every(d=>d.children?.length||d.lines?.length||true));
 const back=X.load(out.bytes,'export.bc3');assert.deepEqual(back.items.map(i=>i.description),['Pintura'],'only priced items are usable as a base');
});
