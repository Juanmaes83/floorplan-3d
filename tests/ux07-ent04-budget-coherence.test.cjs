'use strict';
/* ENT-04 fase 2 · coherencia entre revisiones y presupuestos (FloorPlanRevisionBudget) y dossier 1.1.0. Fixtures
   sintéticas y PRECIOS FICTICIOS del laboratorio; los importes los calcula siempre el informe C2 existente. */
const test=require('node:test'),assert=require('node:assert/strict');
const F=require('../labs/ux07-ent04/fixtures.js'),R=require('../js/revision-compare-core.js'),RB=require('../js/revision-budget-core.js'),D=require('../js/before-after-dossier-core.js');
const P=require('../js/budget-presentation.js'),Core=require('../js/project-core.js');
const NOW='2026-11-12T10:00:00.000Z';
const pair=()=>{const before=F.before(),after=F.after();return {before,after,c:R.compare(before,after)};};
const cmp=(o={})=>{const {before,after,c}=pair();return {before,after,c,r:RB.compareBudgets({comparison:c,beforeProject:before,afterProject:after,...o.fn?o.fn(before,after):{}})};};
const both=(kb,ka)=>(b,a)=>({beforeBudget:F.budget(kb,b),afterBudget:F.budget(ka,a)});
const line=(r,id)=>r.lines.find(l=>l.itemId===id);
const throwsCode=(fn,code)=>assert.throws(fn,e=>e.code===code);

test('revisionMatch: dice sobre qué revisión está hecho un presupuesto (RUBIK no lo guarda)',()=>{
  const {before,after}=pair();
  assert.equal(RB.revisionMatch(F.budget('complete',before),{before,after}).matches,'before');
  assert.equal(RB.revisionMatch(F.budget('complete',after),{before,after}).matches,'after');
  // Dos revisiones con las mismas cantidades (solo cambia un mueble): el presupuesto vale para las dos.
  const moved=Core.clone(before);moved.objects[0].position.x+=100;assert.equal(RB.revisionMatch(F.budget('complete',before),{before,after:moved}).matches,'both');
  // Cantidad editada a mano: no corresponde a ninguna.
  const b=F.budget('complete',after);b.items.find(i=>i.id==='skirting').quantity.value+=1;
  const m=RB.revisionMatch(b,{before,after});assert.equal(m.matches,'neither');assert.ok(m.after.differences.some(d=>d.itemId==='skirting'&&d.reason==='quantity'));
  const other=F.budget('complete',after);other.subject.id='prj_otro';throwsCode(()=>RB.revisionMatch(other,{before,after}),'budget-subject-mismatch');
  const empty=F.budget('complete',after);empty.items=[];empty.chapters=[];throwsCode(()=>RB.revisionMatch(empty,{before,after}),'budget-empty');
});

test('completos y coherentes: diferencia total exacta = suma de las partidas, y cada cambio de partida tiene su causa en el proyecto',()=>{
  const {r}=cmp({fn:both('complete','complete')});
  assert.equal(r.status,'complete');assert.equal(r.before.matchesRevision,true);assert.equal(r.after.matchesRevision,true);
  assert.equal(r.totals.net.delta,Math.round((r.totals.net.after-r.totals.net.before)*100)/100);
  const sum=r.lines.reduce((n,l)=>n+l.delta.net,0);assert.ok(Math.abs(sum-r.totals.net.delta)<=0.01*r.lines.length,'la suma de partidas cuadra con el total (redondeo por partida)');
  assert.ok(r.lines.every(l=>l.status==='exact'));
  assert.deepEqual(Object.fromEntries(r.lines.filter(l=>l.change!=='same').map(l=>[l.itemId,l.change])),
    {'floor:mat_tile600':'removed',paint:'quantity','opening:window':'quantity','floor:mat_terrazzo':'added','partition-new':'added',demolition:'added'});
  assert.equal(line(r,'skirting').change,'same','el perímetro no cambia: el rodapié tampoco');
  assert.deepEqual(r.unexplained,[]);
  assert.deepEqual(line(r,'demolition').explainedBy,['wall:wal_ref-w32']);
  assert.deepEqual(line(r,'floor:mat_terrazzo').explainedBy,['room:rom_kitchen']);
  assert.ok(line(r,'opening:window').explainedBy.includes('opening:opn_ux07-window'));
  // Muebles: el borrador no tiene partidas de muebles, así que no dependen de ninguna.
  assert.deepEqual(r.dependencies.filter(d=>d.entity==='object').map(d=>d.items),[[],[]]);
  assert.match(r.totals.statement,/la diferencia es la de los dos presupuestos/);
});

test('parcial: importes conocidos y diferencia de las partidas comparables, nunca presentada como diferencia de coste',()=>{
  const {r}=cmp({fn:both('complete','partial')});
  assert.equal(r.status,'partial');assert.equal(r.totals.net,undefined,'sin diferencia total');
  assert.deepEqual(r.totals.excluded,[{itemId:'paint',reason:'unpriced-after'},{itemId:'opening:window',reason:'unpriced-after'}]);
  assert.equal(r.totals.comparable.items,r.lines.length-2);
  assert.equal(r.totals.comparable.netDelta,Math.round(r.lines.filter(l=>l.status==='exact').reduce((n,l)=>n+l.delta.net,0)*100)/100);
  assert.equal(line(r,'paint').delta,null);assert.equal(line(r,'paint').change,'quantity','sin precio no es «cambio de precio»');
  const {after}=pair(),known=P.buildReport(F.budget('partial',after)).totals.net.amount;assert.equal(r.totals.knownNet.after,known);
  assert.match(r.totals.statement,/No es la diferencia de coste total/);
  // Partial en «antes» también.
  const r2=cmp({fn:both('partial','complete')}).r;assert.equal(r2.status,'partial');assert.ok(r2.totals.excluded.every(x=>x.reason==='unpriced-before'));
});

test('incoherente: un presupuesto que no es de su revisión impide cualquier diferencia de importes',()=>{
  const {r}=cmp({fn:(b,a)=>({beforeBudget:F.budget('complete',a),afterBudget:F.budget('complete',a)})});
  assert.equal(r.status,'incoherent');assert.equal(r.totals.net,undefined);assert.equal(r.totals.comparable,undefined);
  // Auditoría ChatGPT (#212): tampoco en el modelo por partida — ninguna diferencia, ninguna «exacta», ningún importe.
  assert.ok(r.lines.length>0,'las partidas siguen para explicar el fallo');
  assert.ok(r.lines.every(l=>l.delta===null),'ninguna diferencia por partida');
  assert.ok(r.lines.every(l=>l.status==='withheld'&&l.excludedReason==='incoherent'),'ninguna rotulada exacta ni comparable');
  assert.ok(r.lines.every(l=>[l.before,l.after].every(x=>x===null||(!('net' in x)&&!('gross' in x)&&!('unitPrice' in x)))),'sin importes por partida');
  assert.ok(r.lines.some(l=>l.before?.quantity&&l.after?.quantity),'se conservan las cantidades que explican la incoherencia');
  assert.equal(r.counts.exact,0);
  assert.deepEqual(r.totals.mismatched.map(m=>[m.side,m.revisionMatch]),[['before','after']]);
  // Cantidad tocada a mano en «después»: tampoco.
  const r2=cmp({fn:(b,a)=>{const x=F.budget('complete',a);x.items.find(i=>i.id==='paint').quantity.value*=1.1;return {beforeBudget:F.budget('complete',b),afterBudget:x};}}).r;
  assert.equal(r2.status,'incoherent');assert.deepEqual(r2.totals.mismatched.map(m=>[m.side,m.revisionMatch]),[['after','neither']]);
});

test('uno o ningún presupuesto: no se inventa el que falta',()=>{
  const one=cmp({fn:(b,a)=>({afterBudget:F.budget('complete',a)})}).r;assert.equal(one.status,'one-sided');assert.match(one.totals.statement,/Solo hay presupuesto de «Después»/);
  assert.ok(one.lines.every(l=>l.status==='partial'&&l.excludedReason==='budget-missing'&&l.delta===null));
  const none=cmp().r;assert.equal(none.status,'none');assert.deepEqual(none.lines,[]);
  const {before,after,c}=pair();throwsCode(()=>RB.compareBudgets({comparison:c,beforeProject:before,afterProject:after,beforeBudget:(()=>{const x=F.budget('complete',before);x.subject.id='prj_otro';return x;})()}),'budget-subject-mismatch');
  throwsCode(()=>RB.compareBudgets({comparison:{},beforeProject:before,afterProject:after}),'comparison-required');
});

test('cambio solo de precio, IVA distinto y precios sin revisar: se distinguen y se avisa',()=>{
  const {r}=cmp({fn:(b,a)=>{const x=F.budget('complete',a);x.items.find(i=>i.id==='skirting').unitPrice=12;x.taxRatePercent=10;return {beforeBudget:F.budget('complete',b),afterBudget:x};}});
  assert.equal(r.status,'complete');const s=line(r,'skirting');assert.equal(s.change,'price');assert.equal(s.unexplained,false,'un cambio de precio no exige un cambio del proyecto');
  assert.ok(s.delta.net>0);assert.ok(r.notes.some(n=>/tipo de IVA cambia \(21 % → 10 %\)/.test(n)));assert.ok(r.notes.some(n=>/precios sin revisar/.test(n)));
});

test('cambio de contorno de una estancia: el rodapié y el suelo cambian y se explican por esa estancia',()=>{
  const before=F.before(),after=Core.clone(before);after.updatedAt='2026-10-20T09:00:00Z';
  const room=after.rooms.find(r=>r.id==='rom_kitchen');const xs=room.polygon.map(p=>p.x),maxX=Math.max(...xs);
  for(const p of room.polygon)if(p.x===maxX)p.x-=200;Core.validate(after);
  const c=R.compare(before,after),r=RB.compareBudgets({comparison:c,beforeProject:before,afterProject:after,beforeBudget:F.budget('complete',before),afterBudget:F.budget('complete',after)});
  assert.equal(r.status,'complete');
  for(const id of ['skirting','floor:mat_tile600']){const l=line(r,id);assert.equal(l.change,'quantity',id);assert.deepEqual(l.explainedBy,['room:rom_kitchen'],id);}
  assert.deepEqual(r.unexplained,[]);
});

test('variantes (proyectos distintos): cada presupuesto debe ser del suyo',()=>{
  const before=F.before(),after=F.after();after.id='prj_ux07-variante';Core.validate(after);
  const c=R.compare(before,after,{relation:'library-variant'});
  const ok=RB.compareBudgets({comparison:c,beforeProject:before,afterProject:after,beforeBudget:F.budget('complete',before),afterBudget:F.budget('complete',after)});
  assert.equal(ok.status,'complete');
  throwsCode(()=>RB.compareBudgets({comparison:c,beforeProject:before,afterProject:after,beforeBudget:F.budget('complete',after),afterBudget:F.budget('complete',after)}),'budget-subject-mismatch');
});

test('no muta ninguna entrada',()=>{
  const {before,after,c}=pair(),bb=F.budget('complete',before),ab=F.budget('partial',after),snap=JSON.stringify([before,after,c,bb,ab]);
  RB.compareBudgets({comparison:c,beforeProject:before,afterProject:after,beforeBudget:bb,afterBudget:ab});RB.revisionMatch(ab,{before,after});
  assert.equal(JSON.stringify([before,after,c,bb,ab]),snap);
});

test('dossier 1.1.0: sección de presupuestos comparados (completa, parcial, no válida) y presupuesto de «después» hecho sobre «antes»',()=>{
  const {before,after,c}=pair(),svg={beforeSvg:R.planSvg(c,'before',before),afterSvg:R.planSvg(c,'after',after)};
  const page=(budget,beforeBudget)=>D.html(D.view(c,{beforeProject:before,afterProject:after,budget,beforeBudget,now:NOW}),svg);
  const full=page(F.budget('complete',after),F.budget('complete',before));
  assert.match(full,/data-status="complete"/);assert.match(full,/Comparación completa/);assert.match(full,/<th>Sin IVA<\/th>.*Diferencia/s);
  assert.match(full,/data-item="demolition"/);assert.doesNotMatch(full,/data-item="skirting"/,'las partidas iguales no se listan');
  const part=page(F.budget('partial',after),F.budget('complete',before));
  assert.match(part,/Comparación parcial/);assert.match(part,/No es la diferencia de coste total/);assert.doesNotMatch(part,/<th>Con IVA<\/th>/);assert.match(part,/no comparable/);
  const bad=page(F.budget('complete',after),F.budget('complete',after));
  assert.match(bad,/Comparación no válida/);assert.match(bad,/sus cantidades son las de «Después»/);assert.doesNotMatch(bad,/data-item=/);
  // Sin presupuesto de «antes»: el dossier 1.0 de siempre, sin sección nueva.
  assert.doesNotMatch(page(F.budget('complete',after),null),/budget-compare/);
  // «Después» con el presupuesto hecho sobre «antes»: se dice explícitamente.
  const v=D.view(c,{beforeProject:before,afterProject:after,budget:F.budget('complete',before),now:NOW});
  assert.equal(v.budget.revisionMatch,'before');assert.match(D.html(v,svg),/sus cantidades son las de «Antes»/);
  throwsCode(()=>D.view(c,{beforeProject:before,afterProject:after,beforeBudget:F.budget('complete',before),now:NOW}),'after-budget-required');
});

test('dossier 1.1.0: manifiesto con el presupuesto de «antes», verify lo comprueba y sigue aceptando manifiestos 1.0.0',async()=>{
  const {before,after,c}=pair(),budget=F.budget('complete',after),beforeBudget=F.budget('complete',before);
  const v=D.view(c,{beforeProject:before,afterProject:after,budget,beforeBudget,now:NOW});
  const out=await D.exportDossier(v,{beforeProject:before,afterProject:after,budget,beforeBudget,comparison:c,beforeSvg:R.planSvg(c,'before',before),afterSvg:R.planSvg(c,'after',after)});
  assert.equal(out.manifest.version,'1.1.0');assert.equal(out.manifest.beforeBudget.status,'complete');assert.match(out.manifest.beforeBudget.sha256,/^[0-9a-f]{64}$/);
  assert.equal((await D.verify(out.html,out.manifest,{beforeProject:before,afterProject:after,budget,beforeBudget})).ok,true);
  const tampered=structuredClone(beforeBudget);tampered.items[0].unitPrice+=1;
  const bad=await D.verify(out.html,out.manifest,{beforeBudget:tampered});assert.equal(bad.ok,false);assert.deepEqual(bad.checks.filter(x=>!x.ok).map(x=>x.name),['presupuesto de «antes» sin cambios']);
  // Determinista: mismas entradas, misma huella.
  const again=await D.exportDossier(v,{beforeProject:before,afterProject:after,budget,beforeBudget,comparison:c,beforeSvg:R.planSvg(c,'before',before),afterSvg:R.planSvg(c,'after',after)});
  assert.equal(again.manifest.html.sha256,out.manifest.html.sha256);
  await assert.rejects(D.exportDossier(v,{beforeProject:before,afterProject:after,budget,comparison:c,beforeSvg:'',afterSvg:''}),e=>e.code==='before-budget-mismatch');
  // Un dossier 1.0.0 (sin presupuesto de «antes») sigue verificándose.
  const v10=D.view(c,{beforeProject:before,afterProject:after,budget,now:NOW});
  const o10=await D.exportDossier(v10,{beforeProject:before,afterProject:after,budget,comparison:c,beforeSvg:R.planSvg(c,'before',before),afterSvg:R.planSvg(c,'after',after)});
  const m10={...o10.manifest,version:'1.0.0'};delete m10.beforeBudget;
  assert.equal((await D.verify(o10.html,m10,{beforeProject:before,afterProject:after,budget,beforeBudget:null})).ok,true);
  assert.equal((await D.verify(o10.html,{...m10,version:'0.9.0'})).ok,false,'versión desconocida');
});

test('compatibilidad con un dossier 1.0.0 AUTÉNTICO de #209 (generado con su implementación, no reetiquetado)',async()=>{
  const fs=require('node:fs'),path=require('node:path'),dir=path.join(__dirname,'fixtures','ux07-dossier-1.0.0');
  const html=fs.readFileSync(path.join(dir,'dossier.html'),'utf8'),manifest=JSON.parse(fs.readFileSync(path.join(dir,'manifest.json'),'utf8')),origen=JSON.parse(fs.readFileSync(path.join(dir,'origen.json'),'utf8'));
  assert.equal(origen.commit,'8a3cce85df71b1f242ff0c5ccb53b46ea67c0fa2','generado con #209 (lab/ux07-ent04-before-after@8a3cce8)');
  assert.equal(manifest.version,'1.0.0');assert.equal('beforeBudget' in manifest,false,'el formato 1.0.0 no tenía presupuesto de «antes»');
  assert.doesNotMatch(html,/budget-compare/,'el HTML 1.0.0 no tiene la sección de la fase 2');
  // Con el verificador ACTUAL: el archivo intacto se verifica, también contra las entradas sintéticas que lo generaron.
  const {before,after}=pair(),budget=F.budget('complete');
  const ok=await D.verify(html,manifest,{beforeProject:before,afterProject:after,budget,beforeBudget:null});
  assert.equal(ok.ok,true,JSON.stringify(ok.checks.filter(c=>!c.ok)));assert.ok(ok.checks.length>=9);
  // Y cualquier alteración se sigue detectando.
  const bad=await D.verify(html.replace('Presupuesto completo','Presupuesto parcial'),manifest);assert.equal(bad.ok,false);
  assert.deepEqual(bad.checks.filter(c=>!c.ok).map(c=>c.name).sort(),['huella del HTML','tamaño del HTML'].sort());
  const otherBudget=await D.verify(html,manifest,{budget:F.budget('partial')});assert.equal(otherBudget.ok,false);
  // Un presupuesto de «antes» no puede colarse en un dossier 1.0.0, que no lo tenía.
  assert.equal((await D.verify(html,manifest,{beforeBudget:F.budget('complete',before)})).ok,false);
});
