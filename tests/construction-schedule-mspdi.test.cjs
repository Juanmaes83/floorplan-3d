// M13 · Exportación MSPDI del plan de obra: fidelidad (fechas, hitos, dependencias, identidad), no invención de datos,
// no mutación del plan, determinismo, casos límite y convivencia con la exportación JSON existente.
const test=require('node:test'),assert=require('node:assert/strict'),{execFileSync}=require('node:child_process'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const S=require('../js/construction-schedule-core.js'),X=require('../js/construction-schedule-mspdi.js');
const F=require('./fixtures/construction-schedule-fixtures.cjs'),{cases}=require('./fixtures/mspdi-cases.cjs');
const tasksOf=xml=>[...xml.matchAll(/<Task>([\s\S]*?)<\/Task>/g)].map(m=>m[1]);
const field=(t,n)=>{const m=new RegExp(`<${n}>([^<]*)</${n}>`).exec(t);return m?m[1]:null;};
const byRubikId=xml=>new Map(tasksOf(xml).filter(t=>field(t,'UID')!=='0').map(t=>[/<FieldID>188743731<\/FieldID><Value>([^<]*)</.exec(t)[1],t]));

test('cabecera MSPDI: espacio de nombres de Microsoft Project, calendario de 7 días y sin fecha de creación inventada',()=>{
  const {xml}=X.toMSPDI(F.simpleHouse().schedule,{projectName:'Casa'});
  assert.match(xml,/^<\?xml version="1.0" encoding="UTF-8" standalone="yes"\?>\n<Project xmlns="http:\/\/schemas.microsoft.com\/project">/);
  assert.equal((xml.match(/<WeekDay><DayType>\d<\/DayType><DayWorking>1<\/DayWorking>/g)||[]).length,7,'7 working days');
  assert.match(xml,/<MinutesPerDay>480<\/MinutesPerDay><MinutesPerWeek>3360<\/MinutesPerWeek>/);
  assert.doesNotMatch(xml,/<CreationDate>/,'no creation date unless the caller gives one');
  assert.match(X.toMSPDI(F.simpleHouse().schedule,{createdAt:'2026-11-22T10:00:00Z'}).xml,/<CreationDate>2026-11-22T10:00:00<\/CreationDate>/);
});

test('fechas exactas y ancladas: inicio 08:00, fin 17:00 del último día, duración en días naturales, «No comenzar antes de»',()=>{
  const sch=F.simpleHouse().schedule,{xml}=X.toMSPDI(sch),m=byRubikId(xml);
  for(const t of S.canonical(sch).tasks){
    const x=m.get(t.id),days=Math.round((Date.parse(t.endDate)-Date.parse(t.startDate))/86400000)+1;
    assert.equal(field(x,'Start'),t.startDate+'T08:00:00');assert.equal(field(x,'Finish'),t.endDate+'T17:00:00');
    assert.equal(field(x,'Duration'),`PT${days*8}H0M0S`);assert.equal(field(x,'ConstraintType'),'4');assert.equal(field(x,'ConstraintDate'),t.startDate+'T08:00:00');
  }
  // La estructura (27 días con fines de semana y Navidad) conserva sus días: sin calendario laboral que la desplace.
  assert.equal(field(m.get('structure'),'Duration'),'PT208H0M0S');
});

test('hitos con el criterio de RUBIK: un día y sin vínculos → duración 0; un día con elementos sigue siendo tarea',()=>{
  const {xml,report}=X.toMSPDI(cases().milestones),m=byRubikId(xml);
  assert.equal(field(m.get('start'),'Milestone'),'1');assert.equal(field(m.get('start'),'Duration'),'PT0H0M0S');assert.equal(field(m.get('start'),'Finish'),'2027-01-04T08:00:00');
  assert.equal(field(m.get('one-day-work'),'Milestone'),'0');assert.equal(field(m.get('one-day-work'),'Duration'),'PT8H0M0S');
  assert.equal(report.milestones,2);assert.equal(report.tasks,1);
});

test('dependencias: FS/SS/FF/SF con su código MSPDI y desfase en décimas de minuto (positivo, cero y negativo)',()=>{
  const {xml}=X.toMSPDI(cases().dependencyTypes),m=byRubikId(xml),uid=id=>field(m.get(id),'UID');
  const link=id=>{const t=/<PredecessorLink>([\s\S]*?)<\/PredecessorLink>/.exec(m.get(id))[1];return {pred:field(t,'PredecessorUID'),type:field(t,'Type'),lag:field(t,'LinkLag'),fmt:field(t,'LagFormat')};};
  assert.deepEqual(link('fs'),{pred:uid('a'),type:'1',lag:String(2*480*10),fmt:'7'});
  assert.deepEqual(link('ss'),{pred:uid('a'),type:'3',lag:String(2*4800),fmt:'7'});
  assert.deepEqual(link('ff'),{pred:uid('a'),type:'0',lag:String(-4800),fmt:'7'});
  assert.deepEqual(link('sf'),{pred:uid('a'),type:'2',lag:'4800',fmt:'7'});
  assert.deepEqual(link('lead'),{pred:uid('a'),type:'1',lag:String(-2*4800),fmt:'7'});
});

test('identidad: id y WBS de RUBIK en campos personalizados declarados; notas con elementos y partidas (sin importes)',()=>{
  const {xml}=X.toMSPDI(F.simpleHouse().schedule),t=byRubikId(xml).get('foundations');
  assert.match(xml,/<FieldID>188743731<\/FieldID><FieldName>Text1<\/FieldName><Alias>RUBIK id<\/Alias>/);
  assert.equal(field(t,'WBS'),'01');assert.match(field(t,'Notes'),/Elementos del proyecto: foundation \(structure\)\./);assert.match(field(t,'Notes'),/Partidas: concrete 60 %\./);
  assert.equal(field(t,'Cost'),'0');assert.doesNotMatch(xml,/96\.13|1850/,'no prices travel');
});

test('no inventa ejecución: avance 0, sin fechas reales; un plan revisado es «plan-approved», nunca ejecutado o certificado',()=>{
  for(const [sch,ev] of [[F.simpleHouse().schedule,'plan-approved'],[F.kitchenReform().schedule,'plan-estimated']]){
    const {xml,report}=X.toMSPDI(sch);
    assert.equal(report.evidence,ev);assert.doesNotMatch(xml,/<ActualStart>|<ActualFinish>|<ActualDuration>|executed|certified/);
    assert.ok(tasksOf(xml).every(t=>field(t,'PercentComplete')==='0'));
    assert.match(xml,ev==='plan-approved'?/Plan aprobado por FIXTURE arquitecta el 2026-11-04 \(previsión revisada, no ejecución ni certificación\)/:/Plan previsto en borrador/);
  }
});

test('no muta el plan, es determinista y la exportación JSON existente sigue idéntica',()=>{
  const sch=F.simpleHouse().schedule,before=JSON.stringify(sch),json=S.serialize(sch);
  const a=X.toMSPDI(sch,{projectName:'P'}),b=X.toMSPDI(JSON.parse(before),{projectName:'P'});
  assert.equal(JSON.stringify(sch),before);assert.equal(a.xml,b.xml);assert.equal(S.serialize(sch),json);
});

test('un plan inválido no se «arregla»: se rechaza con el mismo error que la autoridad de planificación',()=>{
  const bad=JSON.parse(JSON.stringify(F.simpleHouse().schedule));bad.tasks.find(t=>t.id==='roof').startDate='2027-01-10';
  const expected=(()=>{try{S.canonical(bad);}catch(e){return e.message;}})();
  assert.ok(expected);assert.throws(()=>X.toMSPDI(bad),e=>e.message===expected);
});

test('casos límite: texto con caracteres XML y acentos escapado sin pérdida, 29 de febrero, plan vacío y plan complejo',()=>{
  const c=cases(),{xml}=X.toMSPDI(c.textAndCalendar),amp=byRubikId(xml).get('amp');
  assert.equal(field(amp,'Name'),'Demolición &amp; «retirada» &lt;tabique&gt; &quot;norte&quot; — fase 1');
  assert.equal(field(byRubikId(xml).get('leap'),'Duration'),'PT24H0M0S','28/02–01/03/2028 = 3 days (leap year)');
  const e=X.toMSPDI(c.empty);assert.equal(tasksOf(e.xml).length,0);assert.match(e.report.warnings[0],/no tiene tareas/);
  const big=X.toMSPDI(c.complex);assert.equal(big.report.tasks+big.report.milestones,120);assert.equal(big.report.links,149);
  assert.equal(new Set(tasksOf(big.xml).map(t=>field(t,'UID'))).size,121,'unique UIDs incl. project summary');
});

test('informe honesto: qué no viaja, y resumen para la persona',()=>{
  const {report}=X.toMSPDI(F.simpleHouse().schedule),s=X.summary(report);
  assert.ok(report.notCarried.some(x=>/elementos del proyecto 3D/.test(x)));assert.ok(report.notCarried.some(x=>/partidas/.test(x)));
  assert.match(s,/8 tareas, 0 hitos y 8 dependencias/);assert.match(s,/No viaja: /);
});

// Interoperabilidad (opcional en local/CI): esquema oficial y lector de GanttProject. Si faltan, se OMITE y se dice.
const xsd=process.env.MSPDI_XSD,cp=process.env.MSPDI_MPXJ_CLASSPATH;
test('interoperabilidad: XSD oficial de Microsoft Project y relectura con MPXJ (GanttProject) idéntica',{skip:!(xsd&&cp)&&'MSPDI_XSD y MSPDI_MPXJ_CLASSPATH no definidos: verificación externa no ejecutada aquí'},()=>{
  const out=fs.mkdtempSync(path.join(os.tmpdir(),'mspdi-'))+'/run';
  execFileSync(process.execPath,[path.join(__dirname,'../scripts/interop/mspdi/verify.cjs'),out,'--xsd',xsd,'--mpxj-classpath',cp],{stdio:'pipe'});
  const r=JSON.parse(fs.readFileSync(out+'/verify-report.json','utf8'));assert.equal(r.ok,true);
});
