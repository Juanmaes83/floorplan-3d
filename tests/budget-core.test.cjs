const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const B = require('../js/budget-core.js');

const budget = (taxRatePercent=21) => B.createBudget({
  id:'bud_main',
  subject:{type:'project', id:'prj_main'},
  title:'Reforma vivienda',
  taxRatePercent
});
const q7a = (value=12.84, status='measured', complete=true, unit='m2') => B.quantityFrom7A({
  value, unit, status, complete,
  ref:{scope:'room', id:'rom_bedroom', metric:'floor.areaM2'}
});
const item = (overrides={}) => B.createItem({
  id:'itm_floor',
  chapterId:null,
  description:'Pavimento dormitorio',
  quantity:q7a(),
  wastePercent:7,
  ...B.manualPrice({unitPrice:31, label:'Precio profesional', asOf:'2026-10-27'}),
  ...overrides
});

function withItem(b, i){
  const copy=JSON.parse(JSON.stringify(b));
  copy.items.push(i);
  return copy;
}

function withChapter(b, c){
  const copy=JSON.parse(JSON.stringify(b));
  copy.chapters.push(c);
  return copy;
}

test('creates a separate EUR budget document linked to project/building',()=>{
  const b=budget();
  assert.equal(b.schema,'rubik-sota.floorplan-budget');
  assert.equal(b.schemaVersion,'1.0.0');
  assert.equal(b.currency,'EUR');
  assert.deepEqual(b.subject,{type:'project',id:'prj_main'});
  assert.deepEqual(b.items,[]);
});

test('budget core rejects non-EUR documents in V1',()=>{
  const b=budget();b.currency='USD';
  assert.throws(()=>B.validateBudget(b),/currency must be EUR/);
});

test('7A quantity provenance stays explicit and no geometry is remeasured',()=>{
  const q=q7a(12.84,'measured',true);
  assert.equal(q.source.type,'quantity-engine');
  assert.equal(q.source.engine,'FloorPlanQuantities');
  assert.equal(q.source.ref.metric,'floor.areaM2');
  assert.equal(q.value,12.84);
});

test('unavailable 7A quantity must be null rather than zero',()=>{
  const q=B.quantityFrom7A({value:null,unit:'m2',status:'unavailable',complete:false,ref:{scope:'room',id:'x',metric:'floor.areaM2'}});
  assert.equal(q.value,null);
  assert.throws(()=>B.quantityFrom7A({value:0,unit:'m2',status:'unavailable',complete:false,ref:{}}),/value null/);
});

test('manual quantity is supported but explicitly marked manual',()=>{
  const q=B.manualQuantity({value:3,unit:'unit',status:'estimated',label:'Medición profesional'});
  assert.equal(q.source.type,'manual');
  assert.equal(q.status,'estimated');
});

test('waste is explicit and changes budget quantity without changing geometric quantity',()=>{
  const line=B.calculateItem(item(),21);
  assert.equal(line.quantity.value,12.84);
  assert.ok(Math.abs(line.budgetQuantity-13.7388)<1e-12);
  assert.equal(line.wastePercent,7);
});

test('priced item calculates net, VAT and gross in EUR',()=>{
  const line=B.calculateItem(item(),21);
  assert.equal(line.subtotalNet,425.9);
  assert.equal(line.taxAmount,89.44);
  assert.equal(line.subtotalGross,515.34);
  assert.equal(line.effectiveTaxRatePercent,21);
});

test('money is rounded at line level to cents while quantity keeps precision',()=>{
  const i=item({quantity:q7a(1.005),wastePercent:0,...B.manualPrice({unitPrice:10})});
  const line=B.calculateItem(i,21);
  assert.equal(line.budgetQuantity,1.005);
  assert.equal(line.subtotalNet,10.05);
});

test('unknown price is null and never converted to zero',()=>{
  const i=B.createItem({id:'itm_pending',description:'Pintura',quantity:q7a(20),wastePercent:5,unitPrice:null,priceSource:null});
  const line=B.calculateItem(i,21);
  assert.equal(line.unitPrice,null);
  assert.equal(line.subtotalNet,null);
  assert.equal(line.taxAmount,null);
  assert.equal(line.subtotalGross,null);
});

test('explicit zero price remains a known zero and requires provenance',()=>{
  const i=B.createItem({id:'itm_zero',description:'Cortesía',quantity:q7a(1,'measured',true,'unit'),wastePercent:0,...B.manualPrice({unitPrice:0})});
  const line=B.calculateItem(i,21);
  assert.equal(line.subtotalNet,0);
  assert.equal(line.subtotalGross,0);
});

test('priced item without price source is rejected',()=>{
  assert.throws(()=>B.createItem({id:'x',description:'x',quantity:q7a(),unitPrice:20,priceSource:null}),/requires priceSource/);
});

test('7B price source is manual only; external providers stay out of scope',()=>{
  assert.throws(()=>B.createItem({id:'x',description:'x',quantity:q7a(),unitPrice:20,priceSource:{type:'bcca',label:'BCCA'}}),/only supports manual/);
});

test('manual price helper records provenance and starts unreviewed',()=>{
  const p=B.manualPrice({unitPrice:25.5,label:'Tarifa estudio',asOf:'2026-10-27'});
  assert.deepEqual(p.priceSource,{type:'manual',label:'Tarifa estudio',asOf:'2026-10-27'});
  assert.deepEqual(p.review,{status:'unreviewed',reviewedAt:null});
});

test('review is explicit and timestamped',()=>{
  const reviewed=B.markReviewed(item(),{reviewedAt:'2026-10-27T17:00:00+01:00',note:'Revisado por profesional'});
  assert.equal(reviewed.review.status,'reviewed');
  assert.equal(reviewed.review.reviewedAt,'2026-10-27T17:00:00+01:00');
  assert.equal(reviewed.review.note,'Revisado por profesional');
});

test('cannot mark an unpriced item as reviewed',()=>{
  const i=B.createItem({id:'x',description:'x',quantity:q7a(),unitPrice:null,priceSource:null});
  assert.throws(()=>B.markReviewed(i,{reviewedAt:'2026-10-27T17:00:00+01:00'}),/without a unit price/);
});

test('changing manual price resets review state',()=>{
  const reviewed=B.markReviewed(item(),{reviewedAt:'2026-10-27T17:00:00+01:00'});
  const changed=B.setManualPrice(reviewed,{unitPrice:32,label:'Nueva tarifa',asOf:'2026-10-27'});
  assert.equal(changed.unitPrice,32);
  assert.equal(changed.review.status,'unreviewed');
  assert.equal(changed.review.reviewedAt,null);
});

test('clearing price restores pending/unpriced semantics',()=>{
  const cleared=B.clearPrice(item());
  assert.equal(cleared.unitPrice,null);
  assert.equal(cleared.priceSource,null);
  assert.equal(cleared.review.status,'unreviewed');
});

test('budget VAT can be unknown without inventing zero tax',()=>{
  const b=withItem(budget(null),item());
  const result=B.calculateBudget(b);
  assert.equal(result.lines[0].subtotalNet,425.9);
  assert.equal(result.lines[0].taxAmount,null);
  assert.equal(result.lines[0].subtotalGross,null);
  assert.equal(result.totals.tax.amount,null);
  assert.equal(result.totals.tax.complete,false);
});

test('item VAT override takes precedence over budget VAT',()=>{
  const i=item({taxRatePercent:10});
  const line=B.calculateItem(i,21);
  assert.equal(line.effectiveTaxRatePercent,10);
  assert.equal(line.taxAmount,42.59);
  assert.equal(line.subtotalGross,468.49);
});

test('zero VAT is explicit and different from unknown VAT',()=>{
  const line=B.calculateItem(item(),0);
  assert.equal(line.taxAmount,0);
  assert.equal(line.subtotalGross,line.subtotalNet);
});

test('chapter totals and global totals use only known lines but expose incompleteness',()=>{
  let b=budget(21);
  b=withChapter(b,B.createChapter({id:'ch_finishes',title:'Acabados',order:1}));
  const priced=item({chapterId:'ch_finishes'});
  const pending=B.createItem({id:'itm_pending',chapterId:'ch_finishes',description:'Pintura',quantity:q7a(20),unitPrice:null,priceSource:null});
  b.items=[priced,pending];
  const result=B.calculateBudget(b);
  assert.equal(result.chapters[0].totals.net.amount,425.9);
  assert.equal(result.chapters[0].totals.net.complete,false);
  assert.deepEqual(result.chapters[0].totals.unpricedItemIds,['itm_pending']);
  assert.equal(result.totals.net.amount,425.9);
  assert.equal(result.totals.net.complete,false);
});

test('unknown quantity prevents subtotal and is reported separately',()=>{
  const q=B.quantityFrom7A({value:null,unit:'m2',status:'unavailable',complete:false,ref:{scope:'room',id:'x',metric:'wallFaces.netAreaM2'}});
  const i=B.createItem({id:'itm_unknown_q',description:'Pintura',quantity:q,wastePercent:5,...B.manualPrice({unitPrice:12})});
  const result=B.calculateBudget(withItem(budget(),i));
  assert.equal(result.lines[0].subtotalNet,null);
  assert.deepEqual(result.totals.unavailableQuantityItemIds,['itm_unknown_q']);
});

test('incomplete but known 7A subtotal remains visible and flagged incomplete',()=>{
  const i=B.createItem({id:'itm_partial',description:'Pared parcial',quantity:q7a(10,'measured',false),...B.manualPrice({unitPrice:10})});
  const result=B.calculateBudget(withItem(budget(),i));
  assert.equal(result.lines[0].subtotalNet,100);
  assert.deepEqual(result.totals.incompleteQuantityItemIds,['itm_partial']);
});

test('unassigned items are summarized separately for future 7D presentation',()=>{
  const result=B.calculateBudget(withItem(budget(),item()));
  assert.deepEqual(result.unassigned.itemIds,['itm_floor']);
  assert.equal(result.unassigned.totals.net.amount,425.9);
});

test('duplicate ids and unknown chapters are rejected',()=>{
  let b=budget();
  b.chapters=[B.createChapter({id:'ch',title:'Uno'}),B.createChapter({id:'ch',title:'Dos'})];
  assert.throws(()=>B.validateBudget(b),/duplicate chapter/);
  b=budget();b.items=[item({chapterId:'missing'})];
  assert.throws(()=>B.validateBudget(b),/unknown chapter/);
});

test('negative quantity, waste, price and invalid VAT are rejected',()=>{
  assert.throws(()=>B.manualQuantity({value:-1,unit:'m2'}),/non-negative/);
  assert.throws(()=>B.createItem({id:'x',description:'x',quantity:q7a(),wastePercent:-1}),/wastePercent/);
  assert.throws(()=>B.manualPrice({unitPrice:-1}),/unitPrice/);
  assert.throws(()=>B.createBudget({id:'x',subject:{type:'project',id:'p'},taxRatePercent:101}),/taxRatePercent/);
});

test('calculation and price/review helpers never mutate input documents',()=>{
  const b=withItem(budget(),item());
  const before=JSON.stringify(b);
  B.calculateBudget(b);
  B.setManualPrice(b.items[0],{unitPrice:40});
  B.markReviewed(b.items[0],{reviewedAt:'2026-10-27T17:00:00+01:00'});
  assert.equal(JSON.stringify(b),before);
});

test('budget document survives JSON roundtrip with same calculation',()=>{
  const reviewed=B.markReviewed(item(),{reviewedAt:'2026-10-27T17:00:00+01:00'});
  const b=withItem(budget(),reviewed);
  const restored=JSON.parse(JSON.stringify(b));
  assert.deepEqual(B.calculateBudget(restored),B.calculateBudget(b));
  assert.equal(B.calculateBudget(restored).totals.reviewComplete,true);
});

test('browser export exposes FloorPlanBudget without DOM/network',()=>{
  const vm=require('node:vm');
  const source=fs.readFileSync(path.join(__dirname,'../js/budget-core.js'),'utf8');
  const context={};vm.createContext(context);vm.runInContext(source,context);
  assert.equal(typeof context.FloorPlanBudget.calculateBudget,'function');
  assert.equal(context.FloorPlanBudget.CURRENCY,'EUR');
});

const quantityPath=path.join(__dirname,'../js/quantity-core.js');
test('integration: real FloorPlanQuantities room floor can feed 7B without remeasurement',{skip:!fs.existsSync(quantityPath)},()=>{
  const Q=require('../js/quantity-core.js');
  const project={scale:{confidence:'real'},walls:[],openings:[],rooms:[{id:'rom_a',name:'A',polygon:[{x:0,y:0},{x:2000,y:0},{x:2000,y:3000},{x:0,y:3000}]}]};
  const room=Q.room(project,'rom_a');
  const q=B.quantityFrom7A({value:room.floor.areaM2,unit:'m2',status:room.floor.status,complete:true,ref:{scope:'room',id:'rom_a',metric:'floor.areaM2'}});
  assert.equal(q.value,6);
  assert.equal(q.status,'measured');
  const line=B.calculateItem(B.createItem({id:'itm',description:'Pavimento',quantity:q,...B.manualPrice({unitPrice:20})}),21);
  assert.equal(line.subtotalNet,120);
});

test('serialize/parse validates the standalone budget document',()=>{
  const b=withItem(budget(),item());
  const text=B.serializeBudget(b);
  const parsed=B.parseBudget(text);
  assert.deepEqual(parsed,B.validateBudget(b));
  assert.throws(()=>B.parseBudget('{bad json'),/invalid budget JSON/);
});

test('manual provenance rejects impossible calendar dates',()=>{
  assert.throws(()=>B.manualPrice({unitPrice:10,asOf:'2026-02-31'}),/YYYY-MM-DD/);
});

test('FloorPlanBudgetV1 JSON Schema matches core constants',()=>{
  const schema=JSON.parse(fs.readFileSync(path.join(__dirname,'../docs/contracts/FloorPlanBudgetV1.schema.json'),'utf8'));
  assert.equal(schema.properties.schema.const,B.SCHEMA);
  assert.equal(schema.properties.schemaVersion.const,B.VERSION);
  assert.equal(schema.properties.currency.const,B.CURRENCY);
});

test('review timestamp rejects impossible calendar dates',()=>{
  assert.throws(()=>B.markReviewed(item(),{reviewedAt:'2026-02-31T17:00:00+01:00'}),/offset-aware ISO/);
});
