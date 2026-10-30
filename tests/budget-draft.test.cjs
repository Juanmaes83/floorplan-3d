// Phase C2: items come from quantities (7A) with provenance; prices come only from the professional (previous
// budget or studio tariff) and start unreviewed; a review survives only while its quantity is unchanged.
const test=require('node:test'),assert=require('node:assert/strict');
const D=require('../js/budget-draft-core.js'),B=require('../js/budget-core.js'),project=require('../js/reference-project.js');
const labels={title:'Presupuesto',floor:'Pavimento',skirting:'Rodapié',paint:'Pintura',newWalls:'Tabique nuevo',demolition:'Demolición',door:'Puerta de paso',slidingDoor:'Puerta corredera',window:'Ventana',tariff:'Tarifa del estudio',chapters:{floors:'Pavimentos',walls:'Paredes',partitions:'Tabiquería',carpentry:'Carpintería'}};
test('items from quantities, no price invented',()=>{
 const {budget}=D.draft(project,{labels});
 assert.equal(budget.items.every(i=>i.quantity.source.engine==='FloorPlanQuantities'),true);assert.equal(budget.items.every(i=>i.unitPrice===null),true);
 assert.deepEqual(budget.chapters.map(c=>c.id),['floors','walls','carpentry']);
 assert.equal(budget.items.find(i=>i.id==='opening:window').quantity.value,12);
 const c=B.calculateBudget(budget);assert.equal(c.totals.net.complete,false);assert.equal(c.totals.unpricedItemIds.length,budget.items.length);
});
test('studio tariff prices are offered unreviewed, by finish kind',()=>{
 const {budget}=D.draft(project,{labels,tariff:{'floor:wood':{unitPrice:38.5,asOf:'2026-10-01'},paint:{unitPrice:9}}});
 const wood=budget.items.find(i=>i.id==='floor:mat_wood');assert.equal(wood.unitPrice,38.5);assert.equal(wood.priceSource.label,'Tarifa del estudio');assert.equal(wood.review.status,'unreviewed');
 assert.equal(budget.items.find(i=>i.id==='paint').unitPrice,9);
});
test('previous prices and waste are kept; a review holds only for the same quantity',()=>{
 let {budget}=D.draft(project,{labels});const at='2026-10-30T10:00:00.000Z';
 budget.items=budget.items.map(i=>i.id==='opening:door'||i.id==='paint'?B.markReviewed(B.setManualPrice({...i,wastePercent:i.id==='paint'?10:0},{unitPrice:i.id==='paint'?8:250,label:'Precio propio'}),{reviewedAt:at}):i);
 const same=D.draft(project,{labels,previous:budget});assert.equal(same.budget.items.find(i=>i.id==='opening:door').review.status,'reviewed');assert.equal(same.budget.items.find(i=>i.id==='paint').wastePercent,10);assert.deepEqual(same.reviewInvalidated,[]);
 const p=structuredClone(project);p.openings=p.openings.filter(o=>o.kind!=='door'||o.id!==p.openings.find(x=>x.kind==='door').id);
 const changed=D.draft(p,{labels,previous:budget});const door=changed.budget.items.find(i=>i.id==='opening:door');
 assert.equal(door.quantity.value,5);assert.equal(door.unitPrice,250);assert.equal(door.review.status,'unreviewed');assert.deepEqual(changed.reviewInvalidated.sort(),['opening:door','paint'],'removing a door also changes the net wall surface to paint');
});
test('new and demolished walls become their own items',()=>{
 const p=structuredClone(project);p.walls[3].status='new';p.walls[4].status='demolished';
 const ids=D.draft(p,{labels}).budget.items.map(i=>i.id);assert.ok(ids.includes('partition-new'));assert.ok(ids.includes('demolition'));
});
