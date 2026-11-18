'use strict';
/* E2.2 (A25) · coherencia económica del dossier antes/después, sobre el núcleo ENT-04 sin navegador. Datos SINTÉTICOS
   (labs/ux07-ent04/fixtures.js, precios ficticios). Cada caso era «REPRODUCIDO» en el diagnóstico de master@7dccf7a. */
const test=require('node:test'),assert=require('node:assert/strict');
const F=require('../labs/ux07-ent04/fixtures.js'),D=require('../js/before-after-dossier-core.js'),R=require('../js/revision-compare-core.js'),RB=require('../js/revision-budget-core.js');
const eur=v=>new Intl.NumberFormat('es-ES',{style:'currency',currency:'EUR'}).format(v);
const b=F.before(),a=F.after(),cmp=R.compare(b,a,{relation:'same-project',beforeLabel:'Original',afterLabel:'Reforma'});
const bBefore=F.budget('complete',b),bAfter=F.budget('complete',a),bStale=F.budget('complete',b);
const page=v=>D.html(v,{beforeSvg:'',afterSvg:''});
test('A25-1 · presupuesto de «después» hecho sobre la revisión anterior: nota veraz y sin importes de otra revisión',()=>{
  const v=D.view(cmp,{beforeProject:b,afterProject:a,budget:bStale,now:'2026-11-18T00:00:00Z'}),h=page(v);
  assert.equal(v.budget.applies,false);assert.match(h,/no coinciden/);assert.doesNotMatch(h,/se ha comprobado que sus cantidades coinciden/);
  assert.ok(!h.includes(eur(v.budget.gross.amount)),'el total de otra revisión no se muestra');assert.match(h,/Importes no mostrados/);});
test('A25-2 · comparación incoherente: ni el bloque comparativo ni el individual muestran importes de otra revisión',()=>{
  const v=D.view(cmp,{beforeProject:b,afterProject:a,budget:bStale,beforeBudget:bBefore,now:'2026-11-18T00:00:00Z'}),h=page(v);
  assert.equal(v.budgetComparison.status,'incoherent');assert.ok(!h.includes(eur(v.budget.gross.amount)));});
test('A25-3 · solo «antes»: aceptado (one-sided), el borrador lo dice y no inventa el que falta',()=>{
  const v=D.view(cmp,{beforeProject:b,afterProject:a,budget:null,beforeBudget:bBefore}),h=page(v);
  assert.equal(v.budgetComparison.status,'one-sided');assert.match(h,/Solo hay presupuesto de «Original»/);assert.equal(v.budget,null);});
test('A25-4 · solo «después» coherente: simétrico (one-sided en la comparación) y su presupuesto individual sí muestra importes',()=>{
  const bc=RB.compareBudgets({comparison:cmp,beforeProject:b,afterProject:a,beforeBudget:null,afterBudget:bAfter});assert.equal(bc.status,'one-sided');
  const v=D.view(cmp,{beforeProject:b,afterProject:a,budget:bAfter}),h=page(v);assert.equal(v.budget.applies,true);assert.ok(h.includes(eur(v.budget.gross.amount)));assert.match(h,/coinciden \(coincidir en cantidades no prueba la revisión\)/);});
test('Seis estados económicos sin deltas engañosos (complete, partial, incoherent, solo antes, solo después, none)',async()=>{
  const cases=[['complete',bBefore,bAfter],['partial',bBefore,F.budget('partial',a)],['incoherent',bBefore,bStale],['one-sided',bBefore,null],['one-sided',null,bAfter],['none',null,null]];
  for(const [st,bb,ab] of cases){const v=D.view(cmp,{beforeProject:b,afterProject:a,budget:ab,beforeBudget:bb});const h=page(v);
    if(st==='none')assert.equal(v.budgetComparison,null);else if(bb)assert.equal(v.budgetComparison.status,st);
    if(st!=='complete')assert.doesNotMatch(h,/<th>Con IVA<\/th>[\s\S]*Diferencia/,st+': sin delta de totales');
    const out=await D.exportDossier(v,{beforeProject:b,afterProject:a,budget:ab,beforeBudget:bb,comparison:cmp,beforeSvg:'',afterSvg:''});
    const ver=await D.verify(out.html,out.manifest,{beforeProject:b,afterProject:a,budget:ab,beforeBudget:bb});assert.ok(ver.ok,st+': verifica');}});
test('Compatibilidad: manifiesto 1.1.0 vigente y versión aceptada 1.0.0',()=>{assert.equal(D.VERSION,'1.1.0');assert.ok(D.VERSIONS.includes('1.0.0'));});
