const test=require('node:test');const assert=require('node:assert/strict');
const B=require('../js/budget-core.js');const P=require('../js/budget-presentation.js');const E=require('../js/economic-dossier-core.js');
const q=(value,complete=true,id='room_a')=>B.quantityFrom7A({value,unit:'m2',status:value===null?'unavailable':'measured',complete:value===null?false:complete,ref:{scope:'room',id,metric:'t'}});
const ref=()=>({providerId:'bcca-es',itemId:'bcca:1',code:'R1',description:'Ref',unit:'m2',unitPrice:20,currency:'EUR',priceKind:'reference',source:{label:'BCCA sintética',asOf:'2026-10-27',retrievedAt:'2026-10-27T18:00:00+01:00',edition:null,region:'ES',sourceUrl:null,attribution:null,licenseStatus:'unknown',licenseName:'L',licenseUrl:null}});
const item=(o={})=>B.createItem({id:o.id||'itm_a',description:o.d||'Pintura',quantity:o.q||q(10),chapterId:o.ch??null,wastePercent:o.w||0,
 ...(o.price===null?{unitPrice:null,priceSource:null}:o.provider?{unitPrice:20,priceSource:{type:'provider-reference',providerId:'bcca-es',itemId:'bcca:1'},priceReference:ref()}:{...B.manualPrice({unitPrice:o.price??10,label:'Profesional',asOf:'2026-10-27'}),...(o.contrast?{priceReference:ref()}:{})}),
 ...(o.tax===undefined?{}:{taxRatePercent:o.tax})});
const bud=(items,tax=21,chapters=[])=>({...B.createBudget({id:'bud_x',subject:{type:'project',id:'prj_x'},title:'P',taxRatePercent:tax}),chapters,items});
const rep=b=>P.buildReport(b);
const ch=[B.createChapter({id:'ch1',title:'Pinturas',order:0})];
test('figures are copied verbatim from the canonical report',()=>{const b=bud([item({ch:'ch1',w:5,price:12})],21,ch),r=rep(b),v=E.view(r);
 assert.equal(v.summary.net.amount,r.totals.net.amount);assert.equal(v.summary.gross.amount,r.totals.gross.amount);assert.equal(v.summary.tax.amount,r.totals.tax.amount);
 const l=v.chapters[0].lines[0];assert.equal(l.budgetQuantity,r.lines[0].budgetQuantity);assert.equal(l.subtotalNet,r.lines[0].subtotalNet);assert.equal(l.wastePercent,5);assert.equal(v.summary.gross.final,true);assert.equal(v.summary.tax.state,'defined');});
test('report is not mutated',()=>{const r=rep(bud([item()]));const s=JSON.stringify(r);E.view(r);E.view(r,{variant:'client'});E.cardState(r);assert.equal(JSON.stringify(r),s);});
test('origin and review are separate; retained reference with own price is contrast',()=>{const b=bud([item({id:'a',price:null}),item({id:'b',provider:true}),item({id:'c',contrast:true})]);const v=E.view(rep(b)),L=v.unassigned.lines;
 assert.deepEqual(L.map(l=>l.origin),['none','reference','own']);assert.deepEqual(L.map(l=>l.review),[null,'pending','pending']);assert.ok(L[2].contrastReference);assert.equal(L[2].reference,undefined);assert.equal(L[1].reference.label,'BCCA sintética');});
test('reviewed status comes from the item review',()=>{const b=bud([B.markReviewed(item(),{reviewedAt:'2026-10-30T10:00:00+01:00',note:'ok'})]);const v=E.view(rep(b));assert.equal(v.unassigned.lines[0].review,'reviewed');assert.equal(v.unassigned.lines[0].reviewNote,'ok');assert.equal(E.view(rep(b),{variant:'client'}).unassigned.lines[0].reviewNote,undefined);});
test('null VAT is undefined, not 0 %; gross is not final',()=>{const v=E.view(rep(bud([item()],null)));assert.equal(v.summary.tax.state,'undefined');assert.equal(v.summary.tax.complete,false);assert.equal(v.summary.gross.final,false);assert.ok(v.warnings.some(w=>w.code==='tax-incomplete'));});
test('VAT 0 % is defined',()=>{const v=E.view(rep(bud([item()],0)));assert.equal(v.summary.tax.state,'zero');assert.equal(v.summary.gross.final,true);});
test('mixed VAT rates stay defined',()=>{const v=E.view(rep(bud([item({id:'a'}),item({id:'b',tax:10})])));assert.equal(v.summary.tax.state,'defined');assert.equal(v.summary.tax.mixed,true);});
test('unpriced, unavailable and incomplete quantities surface as canonical warnings',()=>{const b=bud([item({id:'a',price:null}),item({id:'b',q:q(null)}),item({id:'c',q:q(3,false)})]);const v=E.view(rep(b));
 const codes=v.warnings.map(w=>w.code);for(const c of ['unpriced-items','unavailable-quantities','incomplete-quantities','unreviewed-prices'])assert.ok(codes.includes(c),c);assert.equal(v.summary.gross.final,false);assert.equal(E.cardState(rep(b)).state,'incomplete');assert.equal(E.cardState(rep(b)).gross,null);});
test('client variant: same figures, no ids, provider ids, licence or notes',()=>{const b=bud([item({id:'a',provider:true,ch:'ch1'}),item({id:'b',contrast:true})],21,ch),r=rep(b),p=E.view(r),c=E.view(r,{variant:'client'});
 assert.equal(c.summary.gross.amount,p.summary.gross.amount);const s=JSON.stringify(c);for(const k of ['bud_x','prj_x','bcca-es','bcca:1','licenseName','licenseStatus','"id"','ch1','itm_'])assert.ok(!s.includes(k),k);assert.equal(c.trace,undefined);assert.ok(p.trace.sources.length===1);});
test('empty budget and no-chapter lines',()=>{const v=E.view(rep(bud([])));assert.equal(v.summary.empty,true);assert.equal(v.summary.gross.final,false);assert.equal(E.cardState(rep(bud([]))).state,'empty');assert.equal(E.cardState(null).state,'none');
 const u=E.view(rep(bud([item()])));assert.equal(u.unassigned.lines.length,1);});
test('invalid input and variant are rejected',()=>{assert.throws(()=>E.view(null),TypeError);assert.throws(()=>E.view(rep(bud([])),{variant:'x'}),TypeError);});
// Contract §14 edge cases not covered above.
const D=require('../js/budget-draft-core.js'),project=require('../js/reference-project.js');
const labels={title:'Presupuesto',floor:'Pavimento',skirting:'Rodapié',paint:'Pintura',newWalls:'Tabique nuevo',demolition:'Demolición',door:'Puerta de paso',slidingDoor:'Puerta corredera',window:'Ventana',tariff:'Tarifa del estudio',chapters:{floors:'Pavimentos',walls:'Paredes',partitions:'Tabiquería',carpentry:'Carpintería'}};
test('§14.3 all items unpriced: no net, no final gross',()=>{const v=E.view(rep(bud([item({id:'a',price:null}),item({id:'b',price:null})])));assert.equal(v.summary.unpriced,2);assert.equal(v.summary.net.complete,false);assert.equal(v.summary.gross.final,false);assert.deepEqual(v.unassigned.lines.map(l=>l.origin),['none','none']);});
test('§14.6 explicit price 0 is a price, never «sin precio»',()=>{const r=rep(bud([item({price:0})])),l=E.view(r).unassigned.lines[0];assert.equal(l.origin,'own');assert.equal(l.unitPrice,0);assert.equal(l.subtotalNet,0);assert.equal(l.review,'pending');assert.ok(!E.view(r).warnings.some(w=>w.code==='unpriced-items'));});
test('§14.13 review invalidated by a quantity change reappears as pending (C2 draft)',()=>{
 let {budget}=D.draft(project,{labels});budget={...budget,items:budget.items.map(i=>i.id==='opening:door'?B.markReviewed(B.setManualPrice(i,{unitPrice:250,label:"Propio"}),{reviewedAt:'2026-10-30T10:00:00+01:00'}):i)};
 assert.equal(E.view(rep(budget)).chapters.flatMap(c=>c.lines).find(l=>l.id==='opening:door').review,'reviewed');
 const p=structuredClone(project);p.openings=p.openings.filter(o=>o.kind!=='door'||o.id!==p.openings.find(x=>x.kind==='door').id);
 const next=D.draft(p,{labels,previous:budget}).budget;assert.equal(E.view(rep(next)).chapters.flatMap(c=>c.lines).find(l=>l.id==='opening:door').review,'pending');});
test('§14.17/18 chapter completeness comes from the report',()=>{const chs=[B.createChapter({id:'ok',title:'Completo',order:0}),B.createChapter({id:'ko',title:'Incompleto',order:1})];
 const v=E.view(rep(bud([item({id:'a',ch:'ok'}),item({id:'b',ch:'ko',price:null})],21,chs)));assert.equal(v.chapters[0].totals.complete,true);assert.equal(v.chapters[1].totals.complete,false);assert.equal(v.chapters[1].totals.unpriced,1);});
test('§14.20/21 context from quantity source; manual quantity gets no invented context',()=>{
 const lv=B.quantityFrom7A({value:5,unit:'m2',status:'measured',complete:true,ref:{scope:'level',id:'lvl_1',metric:'t'}}),home=B.quantityFrom7A({value:5,unit:'m2',status:'measured',complete:true,ref:{scope:'home',id:null,metric:'t'}});
 const man=B.manualQuantity({value:3,unit:'m2',label:'Medido in situ'});
 const L=E.view(rep(bud([item({id:'a'}),item({id:'b',q:lv}),item({id:'c',q:home}),item({id:'d',q:man})]))).unassigned.lines;
 assert.deepEqual(L.map(l=>l.context&&l.context.scope),['room','level','home',null]);assert.equal(L[3].quantity.source,'manual');assert.equal(L[3].quantity.sourceLabel,'Medido in situ');});
test('§14.22/23 subject project and building',()=>{const b={...bud([item()]),subject:{type:'building',id:'bld_1'}};const v=E.view(rep(b));assert.equal(v.subject.type,'building');assert.equal(E.view(rep(b),{variant:'client'}).subject.id,undefined);assert.equal(E.view(rep(bud([item()]))).subject.type,'project');});
test('§14.30 deterministic: same budget, same view',()=>{const b=bud([item({id:'a',provider:true}),item({id:'b',price:null})]);assert.equal(JSON.stringify(E.view(rep(b))),JSON.stringify(E.view(rep(b))));assert.equal(P.toCsv(b),P.toCsv(b));assert.equal(P.serializeReport(b),P.serializeReport(b));});
test('client warnings: certainty only, no review noise',()=>{const v=E.view(rep(bud([item({id:'a'}),item({id:'b',price:null})],null)),{variant:'client'});const codes=v.warnings.map(w=>w.code);assert.ok(codes.includes('unpriced-items'));assert.ok(codes.includes('tax-incomplete'));assert.ok(!codes.includes('unreviewed-prices'));});
