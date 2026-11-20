'use strict';
// E3 · CIERRE FINAL · residual E3-D: identidad real de las TOMAS de vistas (FloorPlanProjectViews.takenAt es un Date).
// Negativos sobre E3.vistasDesde (adaptador del núcleo a la API real: status(), current(), takenAt, source) y E3.canon.
// «Antes»: con --antes <dir> (núcleo de e9bd6bf) reproduce la colisión: dos Date distintos → misma huella.
// Uso: node tools/e3-tomas-qa.cjs <pinDir> <pinSha> [--antes <dir>] [salida.json]
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const args=process.argv.slice(2);const opt=k=>{const i=args.indexOf(k);if(i<0)return null;const v=args[i+1];args.splice(i,2);return v;};
const ANTES=opt('--antes');const [pinDir,pinSha,salida]=args;
if(!pinDir||!pinSha){console.error('Uso: node tools/e3-tomas-qa.cjs <pinDir> <pinSha> [--antes <dir>] [salida.json]');process.exit(1);}
const LAB=path.resolve(__dirname,'..'),PIN=path.resolve(pinDir),OUT=salida||path.join(LAB,'evidence/e3/e3-tomas-qa.json');
const E3=require('../e3/e3-core.js');const js=f=>require(path.join(PIN,'js',f));
const X=js('expediente-core.js'),Core=js('project-core.js'),Budget=js('budget-core.js');
const MOTORES={Surface:js('surface-core.js'),Route:js('presentation-route.js'),Living:js('presentation-living-drawing-core.js'),Section:js('presentation-section-core.js'),Core};
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');const digest=async b=>sha(Buffer.from(b));const clone=o=>JSON.parse(JSON.stringify(o));
const casos=[];async function caso(id,titulo,fn){try{const d=await fn();casos.push({id,titulo,resultado:'PASS',...(d?{detalle:d}:{})});}catch(e){casos.push({id,titulo,resultado:'FAIL',error:String(e&&e.stack||e).slice(0,500)});}}
// Doble con la MISMA forma que js/project-views-ui.js: status(), current() → items {id,kind,roomId,label,dataUrl…}, takenAt (Date), source.
const ITEMS=[{id:'stop-overview',kind:'overview',label:'Vista general',dataUrl:'data:image/png;base64,AA'},{id:'stop-r1',kind:'room',roomId:'r1',label:'Salón',dataUrl:'data:image/png;base64,AB'}];
const V=(takenAt,{status='ready',items=ITEMS,source='automatic'}={})=>({status:()=>status,current:()=>status==='ready'?items:[],get takenAt(){return takenAt;},get source(){return source;}});
const p0=Core.initial();p0.name='Vivienda sintética E3';const b0=Budget.createBudget({id:`bud_${p0.id}`,subject:{type:'project',id:p0.id}});
const docsDe=(p,{revision=3,entry='ent_e3'}={})=>({revision,docs:new Map([[E3.KEYS.library,JSON.stringify({version:1,activeId:entry,entries:[{id:entry,name:p.name,project:p}]})],[E3.KEYS.budgets,JSON.stringify({[p.id]:{...clone(b0),id:`bud_${p.id}`,subject:{type:'project',id:p.id}}})],[E3.KEYS.reviews,'{}']])});
const P=s=>({isTestOrigin:()=>true,async readConfirmed(){return {revision:s.revision,docs:new Map(s.docs)};}});
const deps=(vistas,{p=p0,leer=docsDe(p0)}={})=>({P:P(leer),X,Core,Budget,digest,imagenes:async()=>null,observado:()=>clone(p),marca:()=>({name:'Estudio sintético'}),entorno:()=>({motores:MOTORES,vistas:E3.vistasDesde(vistas())})});
const prep=async(k,d)=>{const pr=E3.preparador();return E3.preparar({key:k,idioma:'es'},d,pr.iniciar(),pr);};

(async()=>{
 const T1=new Date('2026-11-20T10:00:00.123Z'),T2=new Date('2026-11-20T10:00:05.456Z');
 await caso('T-01','canon() ya no colapsa valores no planos: Date, Map, Set, instancias y números no finitos se rechazan; JSON plano estable',()=>{
  for(const v of [new Date(),new Map(),new Set(),new (class K{})(),NaN,Infinity])assert.throws(()=>E3.canon({v}),e=>e.code==='no-normalizado');
  assert.equal(E3.canon({b:1,a:[{d:2,c:null}]}),E3.canon({a:[{c:null,d:2}],b:1}));});
 await caso('T-02','Dos objetos Date DISTINTOS con mismos ids, etiquetas y origen → identidades y huellas distintas',async()=>{
  const a=E3.vistasDesde(V(T1)),b=E3.vistasDesde(V(T2));assert.equal(a.estado,'ready');assert.notEqual(a.id.takenAt,b.id.takenAt);
  const hA=await digest(Buffer.from(E3.canon(a.id))),hB=await digest(Buffer.from(E3.canon(b.id)));assert.notEqual(hA,hB);
  return {a:a.id.takenAt,b:b.id.takenAt};});
 await caso('T-03','Normalización estable: dos Date del MISMO instante (y su ISO en texto) → la misma identidad',()=>{
  const a=E3.vistasDesde(V(new Date(T1.getTime()))),b=E3.vistasDesde(V(new Date(T1.getTime()))),c=E3.vistasDesde(V(T1.toISOString()));
  assert.equal(E3.canon(a.id),E3.canon(b.id));assert.equal(E3.canon(a.id),E3.canon(c.id));return a.id.takenAt;});
 let take=T1;const cRP07=(await prep('RP07',deps(()=>V(take)))).candidato;assert.ok(cRP07,'RP07 debe prepararse con una toma válida');
 const cRP10=(await prep('RP10',deps(()=>V(take)))).candidato;assert.ok(cRP10);
 await caso('T-04','Repetir la captura (misma geometría, mismos ids) caduca SOLO el candidato que usa las vistas (RP07); RP10 sigue vigente',async()=>{
  assert.equal((await E3.verificar(cRP07,await E3.actualDesdeConfirmado(deps(()=>V(take))),{digest})).estado,'verificado');
  take=T2;const v7=await E3.verificar(cRP07,await E3.actualDesdeConfirmado(deps(()=>V(take))),{digest});
  const v10=await E3.verificar(cRP10,await E3.actualDesdeConfirmado(deps(()=>V(take))),{digest});take=T1;
  assert.deepEqual(v7,{estado:'verificado-desactualizado',motivo:'desactualizado-fuente',cambiadas:['vistas3d']});assert.deepEqual(v10,{estado:'verificado',motivo:'verificado'});
  return {RP07:v7.estado,RP10:v10.estado};});
 await caso('T-05','Toma sin identidad válida (fecha inválida, ausente o no ISO; vistas sin id; origen no plano): no se acredita y no da vigencia',async()=>{
  const out={};
  for(const [k,vv] of [['fechaInvalida',V(new Date(NaN))],['sinFecha',V(null)],['textoNoISO',V('20/11/2026 10:00')],['numero',V(T1.getTime())],
   ['sinId',V(T1,{items:[{label:'Salón'}]})],['origenNoPlano',V(T1,{source:new Date()})],['vacia',V(T1,{items:[]})]]){
   const r=E3.vistasDesde(vv);assert.equal(r.id,null,k);
   const F=E3.evaluarFuentes(E3.analizar(await E3.leerConfirmado(P(docsDe(p0))),{Core,Budget}),{motores:MOTORES,vistas:r});assert.equal(F.vistas3d.estado,'ausente',k);
   const v=await E3.verificar(cRP07,await E3.actualDesdeConfirmado(deps(()=>vv)),{digest});assert.equal(v.motivo,'fuente-no-comprobable',k);out[k]=F.vistas3d.motivo;}
  const rb=await prep('RP07',deps(()=>V(new Date(NaN))));assert.equal(rb.motivo,'receta-bloqueada');
  for(const l of E3.LANGS)assert.ok(E3.motivoFuente('sesion-sin-identidad',l));return out;});
 await caso('T-06','Estados no «ready» (stale, busy, none, error) y API que lanza: sin identidad ni vigencia',async()=>{
  for(const st of ['stale','busy','none','error'])assert.deepEqual(E3.vistasDesde(V(T1,{status:st})),{estado:st,n:0,id:null});
  assert.deepEqual(E3.vistasDesde({status(){throw new Error('x');}}),{estado:'error',n:0,id:null});assert.equal(E3.vistasDesde(null).estado,'none');});
 await caso('T-07','Restauración portable conservada: otro id local y otra revisión con la misma toma → «verificado-restaurado»; con otra toma → desactualizado',async()=>{
  const q={...clone(p0),id:'prj_restaurado_e3'};const LR=docsDe(q,{revision:1,entry:'ent_rest'});
  const v1=await E3.verificar(cRP07,await E3.actualDesdeConfirmado(deps(()=>V(T1),{p:q,leer:LR})),{digest});assert.deepEqual(v1,{estado:'verificado',motivo:'verificado-restaurado'});
  const v2=await E3.verificar(cRP07,await E3.actualDesdeConfirmado(deps(()=>V(T2),{p:q,leer:LR})),{digest});assert.equal(v2.motivo,'desactualizado-fuente');
  return {mismaToma:v1.motivo,otraToma:v2.motivo};});
 await caso('T-08','La interfaz usa el adaptador del núcleo sobre la autoridad real (no construye identidades propias) y no persiste cámaras',()=>{
  const ui=fs.readFileSync(path.join(LAB,'e3/e3-ui.js'),'utf8');assert.ok(/const vistasInfo=\(\)=>E3\.vistasDesde\(window\.FloorPlanProjectViews\);/.test(ui));
  assert.ok(!/takenAt:V\.takenAt/.test(ui));assert.ok(!/camera|setItem/.test(ui+fs.readFileSync(path.join(LAB,'e3/e3-core.js'),'utf8')));});

 const antes=[];
 if(ANTES){
  const O=require(path.resolve(ANTES,'e3-core.js'));
  // vistasInfo() de e9bd6bf: {estado,n,id:{takenAt:V.takenAt (Date), source, items:[[id,label]]}}
  const viejo=vv=>{const items=vv.current();return {estado:'ready',n:items.length,id:{takenAt:vv.takenAt||null,source:vv.source||null,items:items.map(v=>[v.id,v.label])}};};
  const A={ok:true,obra:{},variantes:[]};
  const h1=await O.huellasFuentes(A,{vistas:viejo(V(T1))},digest),h2=await O.huellasFuentes(A,{vistas:viejo(V(T2))},digest);
  antes.push({id:'T-antes',defecto:'Dos tomas con Date distintos (mismos ids, etiquetas y origen) → misma huella de vistas',reproducido:h1.vistas3d===h2.vistas3d,huella:h1.vistas3d});
  antes.push({id:'T-antes-2',defecto:'canon() del núcleo anterior convierte un Date en «{}»',reproducido:O.canon({t:T1})==='{"t":{}}'});
 }
 const pass=casos.filter(c=>c.resultado==='PASS').length;
 const o={schema:'rubik-lab-e3-tomas-qa/1',fecha:new Date().toISOString(),pin:pinSha,entorno:{node:process.version,plataforma:process.platform},resumen:`${pass}/${casos.length} PASS`,
  antes:ANTES?{nucleo:'e9bd6bfd9e5053c56dd151a289f5ed1e4054a941',reproducidos:`${antes.filter(a=>a.reproducido).length}/${antes.length}`,casos:antes}:null,casos};
 fs.mkdirSync(path.dirname(OUT),{recursive:true});fs.writeFileSync(OUT,JSON.stringify(o,null,1)+'\n');
 console.log(o.resumen,o.antes?'antes '+o.antes.reproducidos:'');for(const c of casos)if(c.resultado!=='PASS')console.log(c.id,c.error);
 process.exit(pass===casos.length?0:2);
})().catch(e=>{console.error(e);process.exit(1);});
