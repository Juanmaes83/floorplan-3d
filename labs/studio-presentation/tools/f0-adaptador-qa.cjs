'use strict';
// E3 · QA del adaptador F0 contra un PIN de producto de solo lectura. Casos sintéticos dirigidos; no repite suites acreditadas.
// Uso: node tools/f0-adaptador-qa.cjs <pinDir> <pinSha> [salida.json]   (pin: `git archive <sha> js | tar -x -C <pinDir>`)
// Código: 0 todo PASS · 2 algún FAIL · 1 uso o entorno.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const A=require('./f0-adaptador.cjs'),R=require('./recetas.cjs');
const [pinDir,pinSha,salida]=process.argv.slice(2);
if(!pinDir||!pinSha){console.error('Uso: node tools/f0-adaptador-qa.cjs <pinDir> <pinSha> [salida.json]');process.exit(1);}
const LAB=path.resolve(__dirname,'..'),OUT=salida||path.join(LAB,'evidence/f0/f0-adaptador-qa.json');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const hashDir=d=>{const h=crypto.createHash('sha256');for(const f of fs.readdirSync(d).sort())h.update(f).update(fs.readFileSync(path.join(d,f)));return h.digest('hex');};
const pin=A.cargarPin(pinDir),{X,Core,Budget}=pin,pinHashAntes=hashDir(path.join(pinDir,'js'));
const clone=o=>JSON.parse(JSON.stringify(o));
async function empaquetar(project,{budgets={},now='2026-11-19T00:00:00.000Z',name='Fixture laboratorio E3'}={}){
 const out=await X.pack({kind:'project',name,project,documents:{budgets,reviews:{}}},{getImage:async()=>null,now:()=>now});
 return new Uint8Array(await out.archive.arrayBuffer());}
const casos=[];
async function caso(id,titulo,fn){try{const detalle=await fn();casos.push({id,titulo,resultado:'PASS',...(detalle?{detalle}:{})});}
 catch(e){casos.push({id,titulo,resultado:'FAIL',error:String(e&&e.message||e).slice(0,400)});}}

(async()=>{
 const base=Core.initial();
 const zip=await empaquetar(base),f=await A.leerExpediente(pin,zip);

 await caso('F0-01','Ciclo pack → read del proyecto de referencia del producto: formato, versión, sujeto y exclusiones',()=>{
  assert.equal(f.formato,X.FORMAT);assert.equal(f.version,X.VERSION);assert.equal(f.origen,'expediente');
  assert.deepEqual(f.sujeto,{kind:'project',id:base.id,name:'Fixture laboratorio E3'});assert.deepEqual(f.noIncluido,X.NOT_INCLUDED.slice());
  assert.match(f.contentId,/^[0-9a-f]{64}$/);return {contentId:f.contentId,bytes:zip.length};});

 await caso('F0-02','Identidad portable: otra fecha y otro id local = mismo trabajo; otra geometría = otro trabajo',async()=>{
  const otroId={...clone(base),id:'prj_restaurado-en-otro-navegador'};
  const g=await A.leerExpediente(pin,await empaquetar(otroId,{now:'2027-01-01T00:00:00.000Z',name:'Otro nombre'}));
  assert.equal(g.contentId,f.contentId);
  const movido=clone(base);movido.walls[0].end={x:movido.walls[0].end.x+10,y:movido.walls[0].end.y};
  const h=await A.leerExpediente(pin,await empaquetar(movido));assert.notEqual(h.contentId,f.contentId);
  return {mismoTrabajo:g.contentId===f.contentId,geometriaDistinta:h.contentId!==f.contentId};});

 await caso('F0-03','Presupuesto como documento F0 (FloorPlanBudgetV1 validado): se cuenta y forma parte de la identidad',async()=>{
  const b=Budget.createBudget({id:`bud_${base.id}`,subject:{type:'project',id:base.id}});Budget.validateBudget(b);
  const g=await A.leerExpediente(pin,await empaquetar(base,{budgets:{[base.id]:b}}));
  assert.deepEqual(g.documentos.presupuestos,[base.id]);assert.notEqual(g.contentId,f.contentId);
  const otro={...clone(base),id:'prj_copia'},b2={...clone(b),id:'bud_prj_copia',subject:{type:'project',id:'prj_copia'}};
  const h=await A.leerExpediente(pin,await empaquetar(otro,{budgets:{prj_copia:b2}}));assert.equal(h.contentId,g.contentId,'referencias neutralizadas');
  return {conPresupuesto:g.contentId};});

 await caso('F0-04','Integridad: un expediente alterado o truncado se rechaza antes de producir nada',async()=>{
  const rechazos=[];
  for(const [nombre,bytes] of [['byte alterado',(()=>{const c=zip.slice();c[Math.floor(c.length/2)]^=0xff;return c;})()],['truncado',zip.slice(0,zip.length-64)]]){
   let ok=false;try{await A.leerExpediente(pin,bytes);}catch(e){ok=true;rechazos.push({nombre,codigo:e.code||null});}assert.ok(ok,nombre+' aceptado');}
  return rechazos;});

 await caso('F0-05','JSON histórico de proyecto: se acepta sin documentos y es el mismo trabajo que su expediente',async()=>{
  const g=await A.leerExpediente(pin,new TextEncoder().encode(JSON.stringify(base)));
  assert.equal(g.origen,'project-json');assert.equal(g.formato,null);assert.equal(g.contentId,f.contentId);return {origen:g.origen};});

 await caso('F0-06','Mapa de dependencias: cubre exactamente las 43 fuentes del catálogo de recetas',()=>{
  const cat=Object.keys(R.FUENTES).sort(),mapa=Object.keys(A.MAPA).sort();assert.deepEqual(mapa,cat);
  const porEstado={};for(const v of Object.values(A.MAPA))porEstado[v.estado]=(porEstado[v.estado]||0)+1;return {fuentes:cat.length,porEstado};});

 await caso('F0-07','Exclusiones del expediente v1: todas tienen fuente asignada y ninguna se presenta como disponible',()=>{
  assert.deepEqual(Object.keys(A.EXCLUSION_A_FUENTES).sort(),X.NOT_INCLUDED.slice().sort());
  for(const [ex,fs_] of Object.entries(A.EXCLUSION_A_FUENTES))for(const id of fs_)assert.ok(['excluido','exp-v2','fuera'].includes(A.MAPA[id].estado),`${ex} → ${id} figura como ${A.MAPA[id].estado}`);});

 await caso('F0-08','Contrato de recetas intacto: las 21 recetas resuelven igual con y sin ctx.f0 (ES y EN)',()=>{
  const ctx=R.contexto(LAB,path.join(LAB,'out/v3/entrega')),con=A.vincular(ctx,f,{congeladoContentId:f.contentId});
  for(const r of R.RECETAS)for(const lang of ['es','en'])assert.deepEqual(R.resolver(r.key,con,lang),R.resolver(r.key,ctx,lang),r.key+' '+lang);
  assert.equal('_documentos' in con.f0,false);return {recetas:R.RECETAS.length};});

 await caso('F0-09','Vigencia por identidad de trabajo, con el vocabulario de N05',()=>{
  assert.equal(A.vigencia({congeladoContentId:f.contentId,fuente:f}).estado,'verificado');
  const d=A.vigencia({congeladoContentId:'0'.repeat(64),fuente:f});assert.equal(d.estado,'verificado-desactualizado');assert.ok(d.motivo);
  assert.equal(A.vigencia({fuente:f}).vigencia,'sin-vincular');assert.equal(A.vigencia({fuente:null}).vigencia,'sin-fuente');});

 await caso('F0-10','Sin simulación: la revisión confirmada se declara ausente con su motivo (dependencia F0.2b)',()=>{
  assert.equal(f.revision,null);assert.match(f.revisionMotivo,/F0\.2b/);});

 await caso('F0-11','Solo lectura: el pin del producto no cambia y el laboratorio no toca rutas de producto',()=>{
  assert.equal(hashDir(path.join(pinDir,'js')),pinHashAntes);
  const {execFileSync}=require('node:child_process'),root=execFileSync('git',['rev-parse','--show-toplevel'],{cwd:LAB,encoding:'utf8'}).trim();
  const sucio=execFileSync('git',['status','--porcelain','--','index.html','js','css','api','comparar','evolucion','.github'],{cwd:root,encoding:'utf8'}).trim();
  assert.equal(sucio,'','rutas de producto modificadas');});

 const pass=casos.filter(c=>c.resultado==='PASS').length;
 const informe={herramienta:'tools/f0-adaptador-qa.cjs',fecha:new Date().toISOString(),pin:{sha:pinSha,jsSha256:pinHashAntes},node:process.version,
  adaptadorSha256:sha(fs.readFileSync(path.join(__dirname,'f0-adaptador.cjs'))),resumen:`${pass}/${casos.length}`,casos};
 fs.mkdirSync(path.dirname(OUT),{recursive:true});fs.writeFileSync(OUT,JSON.stringify(informe,null,1)+'\n');
 console.log(JSON.stringify({resumen:informe.resumen,fallos:casos.filter(c=>c.resultado!=='PASS')},null,1));
 process.exit(pass===casos.length?0:2);
})().catch(e=>{console.error(e);process.exit(1);});
