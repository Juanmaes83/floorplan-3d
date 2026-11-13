'use strict';
/* Compara dos ejecuciones TAP de tests/walk-controls.browser.test.cjs: la de master (base) y la del HEAD de la PR.
   Separa fallos HISTÓRICOS (fallan también en master), CORREGIDOS (fallan en master y pasan en el HEAD) y NUEVOS
   (pasan en master y fallan en el HEAD). Termina con error solo si hay fallos nuevos: nunca oculta los históricos, que
   quedan listados en el informe. Además compara PASO A PASO (controls.json de cada ejecución): una prueba que ya
   fallaba en master puede esconder un paso nuevo roto más adelante; un paso que falla en el HEAD y en master no pasó
   (ni llegó a ejecutarse) cuenta como nuevo. Uso:
   node scripts/qa/compare-walk-controls.cjs base.tap head.tap salida.json [base-controls.json head-controls.json] */
const fs=require('node:fs');
const [baseFile,headFile,outFile,baseSteps,headSteps]=process.argv.slice(2);
// Una prueba saltada (# SKIP / # TODO) no es un aprobado: se marca aparte y hace fallar la comparación.
const parse=file=>{const rows=new Map();for(const line of fs.readFileSync(file,'utf8').split('\n')){const m=line.match(/^(not ok|ok) \d+ - (.+?)(?: # (SKIP|TODO)\b.*)?$/i);if(m)rows.set(m[2].trim(),m[3]?'skip':m[1]==='ok'?'pass':'fail');}return rows;};
const base=parse(baseFile),head=parse(headFile),names=[...new Set([...base.keys(),...head.keys()])];
const row=n=>({test:n,master:base.get(n)||'absent',head:head.get(n)||'absent'});
const all=names.map(row);
const report={historical:all.filter(r=>r.master==='fail'&&r.head==='fail').map(r=>r.test),fixed:all.filter(r=>r.master==='fail'&&r.head==='pass').map(r=>r.test),
  newFailures:[...all.filter(r=>r.head==='fail'&&r.master!=='fail').map(r=>r.test),...all.filter(r=>r.head==='skip'||r.master==='skip').map(r=>`${r.test} (saltada: no hay comparación)`)],passing:all.filter(r=>r.master==='pass'&&r.head==='pass').map(r=>r.test),rows:all};
const steps=f=>{try{return JSON.parse(fs.readFileSync(f,'utf8'));}catch{return null;}};
const bs=baseSteps&&steps(baseSteps),hs=headSteps&&steps(headSteps);
if(baseSteps||headSteps){const k=r=>`${r.viewport} · ${r.control}`,bm=new Map((bs||[]).map(r=>[k(r),r.result]));
  report.steps=(hs||[]).map(r=>({step:k(r),master:bm.get(k(r))||'not reached',head:r.result}));
  report.newStepFailures=report.steps.filter(r=>r.head==='FAIL'&&r.master!=='FAIL').map(r=>`${r.step} (master: ${r.master})`);
  if(!hs||!hs.length)report.newStepFailures.push('sin pasos registrados en el HEAD (controls.json vacío o ausente)');
  if(!bs||!bs.length)report.newStepFailures.push('sin pasos registrados en master (controls.json vacío o ausente)');}
if(!all.length)report.newFailures.push('sin resultados TAP: la suite no llegó a ejecutarse');
if(outFile)fs.writeFileSync(outFile,JSON.stringify(report,null,2));
const md=['### walk-controls · master frente al HEAD','','| Prueba | master | HEAD |','|---|---|---|',...all.map(r=>`| ${r.test} | ${r.master} | ${r.head} |`),'',
  `Históricos (fallan también en master): ${report.historical.length} · Corregidos por la PR: ${report.fixed.length} · **Nuevos: ${report.newFailures.length}**`].join('\n');
console.log(md);if(process.env.GITHUB_STEP_SUMMARY)fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,md+'\n');
if(report.steps){const sm=['','| Paso | master | HEAD |','|---|---|---|',...report.steps.map(r=>`| ${r.step} | ${r.master} | ${r.head} |`),'',`**Pasos nuevos rotos: ${report.newStepFailures.length}**`].join('\n');console.log(sm);if(process.env.GITHUB_STEP_SUMMARY)fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,sm+'\n');}
if(outFile)fs.writeFileSync(outFile,JSON.stringify(report,null,2));
process.exit(report.newFailures.length||report.newStepFailures?.length?1:0);
