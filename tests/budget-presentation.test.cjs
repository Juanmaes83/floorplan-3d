const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const B = require('../js/budget-core.js');
const P = require('../js/budget-presentation.js');

const makeBudget = (taxRatePercent=21) => B.createBudget({
  id:'bud_7d', subject:{type:'project',id:'prj_7d'}, title:'Presupuesto 7D', taxRatePercent
});
const q = (value, scope='room', id='room_a', complete=true, unit='m2') => B.quantityFrom7A({
  value, unit, status:value === null ? 'unavailable' : 'measured', complete:value === null ? false : complete,
  ref:{scope,id,metric:'test.metric'}
});
const manualItem = ({id='itm_a',description='Pintura',quantity=q(10),unitPrice=10,chapterId=null,wastePercent=0,taxRatePercent}={}) => B.createItem({
  id, description, quantity, chapterId, wastePercent,
  ...(unitPrice === null ? {unitPrice:null,priceSource:null} : B.manualPrice({unitPrice,label:'Profesional',asOf:'2026-10-27'})),
  ...(taxRatePercent === undefined ? {} : {taxRatePercent})
});
const withItems = (budget, items) => ({...budget,items});

function referencePrice(){
  return {
    providerId:'bcca-es', itemId:'bcca:item-1', code:'ITEM-1', description:'Referencia BCCA', unit:'m2', unitPrice:20,
    currency:'EUR', priceKind:'reference',
    source:{
      label:'BCCA sintética', asOf:'2026-10-27', retrievedAt:'2026-10-27T18:00:00+01:00', edition:null,
      region:'ES', sourceUrl:null, attribution:null, licenseStatus:'unknown', licenseName:null, licenseUrl:null
    }
  };
}

test('buildReport consumes Budget calculation and preserves canonical totals',()=>{
  const b=withItems(makeBudget(),[manualItem({quantity:q(10),unitPrice:12,wastePercent:5})]);
  const canonical=B.calculateBudget(b);
  const report=P.buildReport(b);
  assert.deepEqual(report.totals,canonical.totals);
  assert.deepEqual(report.lines,canonical.lines);
  assert.equal(report.currency,'EUR');
  assert.equal(report.reportVersion,'1.0.0');
});

test('chapters preserve calculated lines and totals without duplicating budget formulas',()=>{
  let b=makeBudget();
  b.chapters=[B.createChapter({id:'ch_a',title:'Acabados',order:1})];
  b.items=[manualItem({id:'a',chapterId:'ch_a',unitPrice:10}),manualItem({id:'b',chapterId:'ch_a',quantity:q(5),unitPrice:null})];
  const report=P.buildReport(b);
  assert.equal(report.chapters.length,1);
  assert.deepEqual(report.chapters[0].itemIds,['a','b']);
  assert.equal(report.chapters[0].totals.net.amount,100);
  assert.equal(report.chapters[0].totals.net.complete,false);
  assert.deepEqual(report.chapters[0].totals.unpricedItemIds,['b']);
});

test('unassigned lines remain explicit',()=>{
  const report=P.buildReport(withItems(makeBudget(),[manualItem()]));
  assert.deepEqual(report.unassigned.itemIds,['itm_a']);
  assert.equal(report.unassigned.lines[0].id,'itm_a');
});

test('quantity-engine refs group presentation by room, level and home',()=>{
  const b=withItems(makeBudget(),[
    manualItem({id:'room',quantity:q(2,'room','room_a')}),
    manualItem({id:'level',quantity:q(3,'level','level_0')}),
    manualItem({id:'home',quantity:q(4,'home','home_a')})
  ]);
  const report=P.buildReport(b);
  assert.deepEqual(report.contexts.map(x=>x.key),['home:home_a','level:level_0','room:room_a']);
  assert.equal(report.contexts.find(x=>x.key==='room:room_a').totals.net.amount,20);
});

test('home context can use budget subject id when the quantity ref omits id',()=>{
  const quantity=B.quantityFrom7A({value:2,unit:'m2',status:'measured',complete:true,ref:{scope:'home',metric:'floor.areaM2'}});
  const report=P.buildReport(withItems(makeBudget(),[manualItem({quantity})]));
  assert.equal(report.contexts[0].key,'home:prj_7d');
});

test('manual quantities are not falsely assigned to a geometric context',()=>{
  const quantity=B.manualQuantity({value:2,unit:'m2',label:'Profesional'});
  const report=P.buildReport(withItems(makeBudget(),[manualItem({quantity})]));
  assert.deepEqual(report.contexts,[]);
  assert.deepEqual(report.unscopedItemIds,['itm_a']);
});

test('warnings expose unknown, partial, unreviewed and tax-incomplete states',()=>{
  const partial=manualItem({id:'partial',quantity:q(2,'room','r',false),unitPrice:10});
  const unpriced=manualItem({id:'unpriced',quantity:q(2),unitPrice:null});
  const unknownQ=manualItem({id:'unknown-q',quantity:q(null),unitPrice:10});
  const report=P.buildReport(withItems(makeBudget(null),[partial,unpriced,unknownQ]));
  assert.deepEqual(report.warnings.map(x=>x.code),[
    'unpriced-items','unavailable-quantities','incomplete-quantities','unreviewed-prices','tax-incomplete'
  ]);
  assert.equal(report.totals.tax.amount,null);
});

test('explicit zero price remains zero in presentation and is not treated as unknown',()=>{
  const report=P.buildReport(withItems(makeBudget(0),[manualItem({unitPrice:0})]));
  assert.equal(report.lines[0].unitPrice,0);
  assert.equal(report.lines[0].subtotalNet,0);
  assert.deepEqual(report.totals.unpricedItemIds,[]);
});

test('provider reference provenance survives report and CSV while active manual price remains distinct',()=>{
  const ref=referencePrice();
  const item=B.createItem({
    id:'ref',description:'Acabado con referencia',quantity:q(2),priceReference:ref,
    ...B.manualPrice({unitPrice:22,label:'Override profesional',asOf:'2026-10-27'})
  });
  const b=withItems(makeBudget(),[item]);
  const report=P.buildReport(b);
  assert.equal(report.lines[0].priceSource.type,'manual');
  assert.equal(report.lines[0].priceReference.providerId,'bcca-es');
  const csv=P.toCsv(b,{delimiter:';'});
  assert.match(csv,/Override profesional/);
  assert.match(csv,/bcca-es/);
  assert.match(csv,/unknown/);
});

test('CSV is deterministic, RFC-style escaped and ends with the requested newline',()=>{
  const b=withItems(makeBudget(),[manualItem({description:'Pintura, "premium"\ninterior'})]);
  const a=P.toCsv(b);
  const c=P.toCsv(b);
  assert.equal(a,c);
  assert.match(a,/"Pintura, ""premium""\ninterior"/);
  assert.ok(a.endsWith('\r\n'));
});

test('CSV keeps null blank and explicit zero numeric',()=>{
  const b=withItems(makeBudget(),[
    manualItem({id:'zero',unitPrice:0}),
    manualItem({id:'pending',unitPrice:null})
  ]);
  const csv=P.toCsv(b,{delimiter:';',newline:'\n'}).trimEnd().split('\n');
  const headers=csv[0].split(';');
  const priceIndex=headers.indexOf('unit_price_eur');
  assert.equal(csv[1].split(';')[priceIndex],'0');
  assert.equal(csv[2].split(';')[priceIndex],'');
});

test('CSV supports semicolon/tab, optional BOM and rejects ambiguous options',()=>{
  const b=withItems(makeBudget(),[manualItem()]);
  assert.ok(P.toCsv(b,{delimiter:';',bom:true}).startsWith('\uFEFFbudget_id;'));
  assert.match(P.toCsv(b,{delimiter:'\t'}),/^budget_id\tsubject_type/);
  assert.throws(()=>P.toCsv(b,{delimiter:'|'}),/delimiter/);
  assert.throws(()=>P.toCsv(b,{newline:'\r'}),/newline/);
  assert.throws(()=>P.toCsv(b,{bom:'yes'}),/bom/);
});

test('serializeReport returns the same structured report as buildReport',()=>{
  const b=withItems(makeBudget(),[manualItem()]);
  assert.deepEqual(JSON.parse(P.serializeReport(b)),P.buildReport(b));
});

test('presentation never mutates the source budget',()=>{
  const b=withItems(makeBudget(),[manualItem()]);
  const before=JSON.stringify(b);
  P.buildReport(b);
  P.toCsv(b);
  assert.equal(JSON.stringify(b),before);
});

test('invalid budgets are rejected by the Budget authority instead of normalized locally',()=>{
  const b=makeBudget();
  b.currency='USD';
  assert.throws(()=>P.buildReport(b),/FloorPlanBudget:.*currency must be EUR/);
});

test('browser global exposes the same pure 7D API without DOM requirements',()=>{
  const budgetCode=fs.readFileSync(path.join(__dirname,'..','js','budget-core.js'),'utf8');
  const presentationCode=fs.readFileSync(path.join(__dirname,'..','js','budget-presentation.js'),'utf8');
  const context={console};
  vm.createContext(context);
  vm.runInContext(budgetCode,context);
  vm.runInContext(presentationCode,context);
  assert.equal(typeof context.FloorPlanBudgetPresentation.buildReport,'function');
  const b=context.FloorPlanBudget.createBudget({id:'b',subject:{type:'project',id:'p'},title:'Browser',taxRatePercent:21});
  const quantity=context.FloorPlanBudget.manualQuantity({value:1,unit:'unit',label:'Manual'});
  b.items.push(context.FloorPlanBudget.createItem({id:'i',description:'Item',quantity,...context.FloorPlanBudget.manualPrice({unitPrice:1})}));
  const report=context.FloorPlanBudgetPresentation.buildReport(b);
  assert.equal(report.totals.gross.amount,1.21);
});
