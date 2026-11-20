'use strict';
// E3 / K10 / ENT-03 · QA del DELTA del laboratorio (núcleo e3/e3-core.js) contra un PIN de master de solo lectura.
// Casos sintéticos dirigidos (proyecto de referencia del producto, Core.initial). No repite las suites acreditadas.
// Uso: node tools/e3-qa.cjs <pinDir> <pinSha> [salida.json]   (pin: `git archive <sha> | tar -x -C <pinDir>`)
// Código: 0 todo PASS · 2 algún FAIL · 1 uso o entorno.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict'),{spawnSync}=require('node:child_process');
const [pinDir,pinSha,salida]=process.argv.slice(2);
if(!pinDir||!pinSha){console.error('Uso: node tools/e3-qa.cjs <pinDir> <pinSha> [salida.json]');process.exit(1);}
const LAB=path.resolve(__dirname,'..'),OUT=salida||path.join(LAB,'evidence/e3/e3-qa.json');
const PIN=path.resolve(pinDir);
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const hashTree=d=>{const h=crypto.createHash('sha256');(function w(p){for(const f of fs.readdirSync(p).sort()){const q=path.join(p,f);const s=fs.statSync(q);if(s.isDirectory())w(q);else h.update(path.relative(d,q)).update(fs.readFileSync(q));}})(d);return h.digest('hex');};
const pinAntes=hashTree(path.join(PIN,'js'));
const E3=require('../e3/e3-core.js'),RC=require('./recetas.cjs'),A=require('./f0-adaptador.cjs');
const X=require(path.join(PIN,'js/expediente-core.js')),Core=require(path.join(PIN,'js/project-core.js')),Budget=require(path.join(PIN,'js/budget-core.js'));
const digest=async b=>sha(Buffer.from(b));
const clone=o=>JSON.parse(JSON.stringify(o));
const casos=[];
async function caso(id,titulo,fn){try{const detalle=await fn();casos.push({id,titulo,resultado:'PASS',...(detalle?{detalle}:{})});}
 catch(e){casos.push({id,titulo,resultado:'FAIL',error:String(e&&e.stack||e).slice(0,600)});}}

// ---------------------------------------------------------------- escenario sintético (sin datos reales)
const IMG=require(path.join(PIN,'docs/contracts/examples/floorplan-project-v1.example.json')).sourceImages[0];
function base(){const p=Core.initial();p.name='Vivienda sintética E3';return p;}
function docsDe(p,{budget=null,revision=3,entry='ent_e3',brand=null,obra=null,variantes=[]}={}){
 // Como en el producto con F0.2b: el proyecto abierto vive en la entrada activa de la biblioteca confirmada.
 const lib={version:1,activeId:entry,entries:[{id:entry,name:p.name,project:p},...variantes.map(v=>({id:v,name:'Variante',variantOf:entry,project:{...p,id:p.id+'_v'}}))]};
 const m=new Map([[E3.KEYS.library,JSON.stringify(lib)],
  [E3.KEYS.budgets,JSON.stringify(budget?{[p.id]:budget}:{})],[E3.KEYS.reviews,'{}']]);
 if(obra)m.set(E3.KEYS.construction,JSON.stringify({schema:'rubik-sota.construction-record',schemaVersion:'0.1.0',records:{[entry+'|project:'+p.id]:obra}}));
 return {revision,docs:m};}
// P falso: SOLO readConfirmed/isTestOrigin. Cualquier otra propiedad (session, commit, flush…) lanza: prueba de no escritura.
function falsoP(estado){let llamadas=0;const base={isTestOrigin:()=>estado.origen!==false,async readConfirmed(){llamadas++;if(estado.error)throw estado.error;const s=typeof estado.leer==='function'?estado.leer(llamadas):estado.leer;return {revision:s.revision,docs:new Map(s.docs)};}};
 return new Proxy(base,{get(t,k){if(k in t)return t[k];if(k==='then'||typeof k==='symbol')return undefined;throw new Error('E3 intentó usar FloorPlanPersistence.'+String(k)+' (solo se permite readConfirmed)');}});}
const presupuesto=(p,{titulo='Presupuesto'}={})=>{const b=Budget.createBudget({id:`bud_${p.id}`,subject:{type:'project',id:p.id},title:titulo});Budget.validateBudget(b);return b;};
const Surface=require(path.join(PIN,'js/surface-core.js')),Route=require(path.join(PIN,'js/presentation-route.js')),Living=require(path.join(PIN,'js/presentation-living-drawing-core.js')),Section=require(path.join(PIN,'js/presentation-section-core.js'));
const MOTORES={Surface,Route,Living,Section,Core};
// Lector de bytes de imagen sintético (por ref). IMG del ejemplo del contrato declara la huella de 0 bytes (e3b0c442…).
const BYTES={[IMG.storage.ref]:new Uint8Array(0)};
const leerBytes=async ref=>BYTES[ref]??null;
const deps=(P,p,extra={})=>({P,X,Core,Budget,digest,imagenes:leerBytes,observado:()=>clone(p),entorno:()=>({motores:MOTORES,vistas:{estado:'ready',n:4,id:{takenAt:'2026-11-20T10:00:00Z',items:['v1','v2','v3','v4']}}}),...extra,marca:()=>('marca' in extra?extra.marca:{name:'Estudio sintético',person:'Responsable sintético'})});
const prep=async(key,d,idioma='es')=>{const pr=E3.preparador();const t=pr.iniciar();return E3.preparar({key,idioma},d,t,pr);};

(async()=>{
 const p0=base(),b0=presupuesto(p0);
 const leer0=docsDe(p0,{budget:b0});

 await caso('E3-01','Catálogo generado idéntico a tools/recetas.cjs: 21 recetas, niveles L/C/F y campo «corte» intactos',()=>{
  const r=spawnSync('node',[path.join(__dirname,'e3-catalogo.cjs'),'--check'],{encoding:'utf8'});assert.equal(r.status,0,r.stdout);
  const keys=E3.CATALOGO.recetas.map(r=>r.key);assert.deepEqual(keys,Array.from({length:21},(_,i)=>'RP'+String(i+1).padStart(2,'0')));
  for(const r of RC.RECETAS){const c=E3.receta(r.key);assert.equal(c.nivel,r.nivel);assert.equal(c.corte,r.corte);assert.deepEqual(c.requeridas,r.requeridas);assert.deepEqual(c.completas,r.completas);assert.deepEqual(c.opcionales,r.opcionales);}
  const n=l=>RC.RECETAS.filter(r=>r.nivel===l).length;return {L:n('L'),C:n('C'),F:n('F'),sha256:E3.CATALOGO.sha256};});

 const evid=[];
 await caso('E3-02','Matriz de las 43 fuentes: cubre exactamente el catálogo y cada evidencia existe en master '+pinSha.slice(0,7),()=>{
  assert.deepEqual(Object.keys(E3.MATRIZ).sort(),Object.keys(RC.FUENTES).sort());assert.equal(Object.keys(E3.MATRIZ).length,43);
  for(const [id,m] of Object.entries(E3.MATRIZ))for(const [file,pat] of m.ev){const f=path.join(PIN,file);assert.ok(fs.existsSync(f),`${id}: falta ${file}`);
   const lines=fs.readFileSync(f,'utf8').split('\n');const re=new RegExp(pat);const i=lines.findIndex(l=>re.test(l));assert.ok(i>=0,`${id}: «${pat}» no está en ${file}`);evid.push({fuente:id,archivo:file,linea:i+1,patron:pat});}
  return {evidencias:evid.length,sinEvidencia:Object.entries(E3.MATRIZ).filter(([,m])=>!m.ev.length).map(([k])=>k)};});

 await caso('E3-03','Reconciliación con el mapa F0 (informe 21): cada cambio de clase está anotado y las exclusiones del expediente siguen cubiertas',()=>{
  const eq={expediente:'confirmada',motor:'motor','F0.2b':'consumidor-pendiente','F0.3':'historial','exp-v2':'local',excluido:'local','sin-fuente':'sin-fuente',aportacion:'aportacion',fuera:'fuera'};
  const cambios=[];for(const [id,m] of Object.entries(E3.MATRIZ)){const antes=A.MAPA[id].estado;if(eq[antes]!==m.clase){assert.ok(m.cambio,`${id}: ${antes}→${m.clase} sin anotar`);cambios.push({fuente:id,antes,ahora:m.clase,motivo:m.cambio});}}
  for(const [ex,ids] of Object.entries(A.EXCLUSION_A_FUENTES))for(const id of ids)assert.notEqual(E3.MATRIZ[id].clase,'confirmada',`${ex}/${id} no puede ser confirmada portable`);
  return {cambios};});

 await caso('E3-04','Paridad de resolución con tools/recetas.cjs (21 recetas × ES/EN) sobre las mismas fuentes',()=>{
  const ctx=RC.contexto(LAB,path.join(LAB,'out/v3/entrega'));const map={emitible:'preparable','emitible-parcial':'preparable-parcial',bloqueada:'bloqueada','contrato-cumplido-sin-emision':'contrato-cumplido-sin-emision','no-elegible':'no-elegible','no-disponible':'no-disponible'};let n=0;
  for(const lang of ['es','en'])for(const r of RC.RECETAS){const a=RC.resolver(r.key,ctx,lang),b=E3.resolver(r.key,a.fuentes);
   assert.equal(b.estado,map[a.estado],`${r.key}/${lang}`);assert.deepEqual(b.falta,a.falta);assert.deepEqual(b.incompleta,a.incompleta);assert.deepEqual(b.omitidas,a.omitidas);assert.equal(b.emitible,false);n++;}
  return {comparadas:n};});

 await caso('E3-05','Adaptador F0 del laboratorio intacto sobre master '+pinSha.slice(0,7)+' (11 casos)',()=>{
  const o=path.join(LAB,'evidence/e3/f0-adaptador-qa-'+pinSha.slice(0,7)+'.json');
  const r=spawnSync('node',[path.join(__dirname,'f0-adaptador-qa.cjs'),PIN,pinSha,o],{encoding:'utf8'});assert.equal(r.status,0,r.stdout.slice(-400));
  const j=JSON.parse(fs.readFileSync(o,'utf8'));return {resumen:j.resumen||j.total||null,archivo:path.relative(LAB,o)};});

 let cand=null;
 await caso('E3-06','Proyecto confirmado válido: RP05 se prepara solo con lo confirmado y verifica «verificado»',async()=>{
  const P=falsoP({leer:leer0});const r=await prep('RP05',deps(P,p0));assert.ok(r.ok,JSON.stringify(r).slice(0,300));cand=r.candidato;
  assert.equal(cand.estado,'preparado');assert.equal(cand.congelado.revision,3);assert.match(cand.congelado.contentId,/^[0-9a-f]{64}$/);assert.equal(cand.paquete,null);
  const v=await E3.verificar(cand,await E3.actualDesdeConfirmado(deps(P,p0)),{digest});assert.deepEqual(v,{estado:'verificado',motivo:'verificado'});
  // identidades separadas (C2)
  const I=cand.identidades;assert.notEqual(I.trabajo.contentId,I.proyecto.id);assert.equal(typeof I.revisionLocal.revision,'number');assert.notEqual(cand.congelado.seleccionSha256,I.trabajo.contentId);
  return {contentId:cand.congelado.contentId,revision:3,seleccionSha256:cand.congelado.seleccionSha256,acreditadas:cand.composicion.resolucion.acreditadas,parciales:cand.composicion.resolucion.parciales};});

 await caso('E3-07','Sin revisión confirmada (authority-missing): explica causa, siguiente paso, alternativa y datos; no crea revisión',async()=>{
  const e=Object.assign(new Error('Abre el editor…'),{code:'authority-missing'});const r=await prep('RP05',deps(falsoP({error:e}),p0));
  assert.equal(r.ok,false);assert.equal(r.motivo,'c1-sin-revision');for(const l of E3.LANGS){const t=E3.texto(r.motivo,l);assert.ok(t.causa&&t.siguiente&&t.alternativa&&t.datos);}
  const r0=await prep('RP05',deps(falsoP({leer:{revision:0,docs:leer0.docs}}),p0));assert.equal(r0.motivo,'c1-sin-revision');});

 await caso('E3-08','Cambios no guardados: no se prepara y el proyecto observado nunca pasa por confirmado',async()=>{
  const obs=clone(p0);obs.name='Cambio sin guardar';const r=await prep('RP05',deps(falsoP({leer:leer0}),obs));assert.equal(r.motivo,'cambios-sin-guardar');
  const A0=E3.analizar(await E3.leerConfirmado(falsoP({leer:leer0})),{Core});const F=E3.evaluarFuentes(A0,{cambios:true,vistas:{estado:'ready',n:4}});assert.equal(F.vistas3d.estado,'ausente');assert.equal(F.vistas3d.motivo,'cambios');});

 await caso('E3-09','Otra pestaña: almacenamiento bloqueado y revisión que cambia durante la preparación',async()=>{
  const e=Object.assign(new Error('bloqueado'),{code:'open-blocked'});assert.equal((await prep('RP05',deps(falsoP({error:e}),p0))).motivo,'c1-otra-pestana');
  const P=falsoP({leer:n=>n===1?leer0:{...leer0,revision:4}});assert.equal((await prep('RP05',deps(P,p0))).motivo,'revision-movida');});

 await caso('E3-10','Presupuesto de otra revisión o de otro sujeto: caduca el candidato o no se acredita',async()=>{
  const b1=presupuesto(p0,{titulo:'Presupuesto revisado'});const P=falsoP({leer:docsDe(p0,{budget:b1,revision:4})});
  const v=await E3.verificar(cand,await E3.actualDesdeConfirmado(deps(P,p0)),{digest});assert.equal(v.estado,'verificado-desactualizado');assert.equal(v.motivo,'desactualizado-trabajo');
  const ajeno={...clone(b0),subject:{type:'project',id:'prj_otro'}};const d=docsDe(p0);d.docs.set(E3.KEYS.budgets,JSON.stringify({[p0.id]:ajeno}));
  const A1=E3.analizar(await E3.leerConfirmado(falsoP({leer:d})),{Core});assert.equal(A1.budget,null);assert.equal(A1.budgetAjeno,true);
  const r=await prep('RP05',deps(falsoP({leer:d}),p0));assert.equal(r.motivo,'receta-bloqueada');assert.deepEqual(r.receta.falta,['presupuesto']);});

 await caso('E3-11','Cambio de marca: no entra en el expediente; su huella congelada caduca el candidato que la USA (RP01) y no el que no la usa (RP05)',async()=>{
  const d=deps(falsoP({leer:leer0}),p0,{marca:{name:'Otro estudio sintético'}});const v=await E3.verificar(cand,await E3.actualDesdeConfirmado(d),{digest});
  assert.deepEqual(v,{estado:'verificado',motivo:'verificado'});
  const r1=await prep('RP01',deps(falsoP({leer:leer0}),p0));assert.ok(r1.ok,r1.motivo);assert.deepEqual(Object.keys(r1.candidato.congelado.vigencia),['marca']);
  const v1=await E3.verificar(r1.candidato,await E3.actualDesdeConfirmado(d),{digest});
  assert.equal(v1.estado,'verificado-desactualizado');assert.equal(v1.motivo,'desactualizado-fuente');assert.deepEqual(v1.cambiadas,['marca']);
  return {RP05:v.estado,RP01:v1.estado};});

 await caso('E3-12','Cambio de geometría, de imágenes o de documentos: «verificado-desactualizado»',async()=>{
  const out={};
  const g=clone(p0);g.walls[0].end={x:g.walls[0].end.x+10,y:g.walls[0].end.y};
  const im=clone(p0);im.sourceImages=[clone(IMG)];
  const doc=docsDe(p0,{budget:b0});doc.docs.set(E3.KEYS.reviews,JSON.stringify({[p0.id]:{received:[{id:'obs_e3',text:'Observación sintética'}]}}));
  for(const [k,leer,obs] of [['geometria',docsDe(g,{budget:b0,revision:5}),g],['imagenes',docsDe(im,{budget:b0,revision:6}),im],['documentos',{...doc,revision:7},p0]]){
   const v=await E3.verificar(cand,await E3.actualDesdeConfirmado(deps(falsoP({leer}),obs)),{digest});assert.equal(v.estado,'verificado-desactualizado',k);out[k]=v.motivo;}
  return out;});

 await caso('E3-13','Restauración portable: otro id local, otra entrada y otra revisión con el mismo contentId → sigue vigente',async()=>{
  const q={...clone(p0),id:'prj_restaurado_e3'};const bq={...clone(b0),id:`bud_${q.id}`,subject:{type:'project',id:q.id}};
  const v=await E3.verificar(cand,await E3.actualDesdeConfirmado(deps(falsoP({leer:docsDe(q,{budget:bq,revision:1,entry:'ent_restaurada'})}),q)),{digest});
  assert.deepEqual(v,{estado:'verificado',motivo:'verificado-restaurado'});});

 await caso('E3-14','Expediente alterado o truncado y candidato manipulado: «invalido»',async()=>{
  const out=await X.pack({kind:'project',name:'E3',project:p0,documents:{budgets:{[p0.id]:b0},reviews:{}}},{getImage:async()=>null,now:()=>'2026-11-20T00:00:00.000Z'});
  const zip=new Uint8Array(await out.archive.arrayBuffer());const pin=A.cargarPin(PIN);
  const ok=await A.leerExpediente(pin,zip);const v0=await E3.verificar(cand,{contentId:ok.contentId,externos:null},{digest});assert.equal(v0.estado,'verificado');
  const res={};for(const [k,bytes] of [['truncado',zip.slice(0,zip.length-40)],['alterado',(()=>{const z=zip.slice();z[Math.floor(z.length/2)]^=0xff;return z;})()]]){
   let rech=null;try{await A.leerExpediente(pin,bytes);}catch(e){rech=e.message.slice(0,120);}assert.ok(rech,k+' aceptado');
   const v=await E3.verificar(cand,{expedienteRechazado:rech},{digest});assert.equal(v.estado,'invalido');res[k]=v.motivo;}
  const m=clone(cand);m.congelado.revision=99;assert.deepEqual(await E3.verificar(m,{contentId:ok.contentId},{digest}),{estado:'invalido',motivo:'invalido-alterado'});
  return {...res,expedienteMismoTrabajo:ok.contentId===cand.congelado.contentId};});

 await caso('E3-15','Preparación cancelada y resultado asíncrono obsoleto: se descartan sin aplicar nada',async()=>{
  const pr=E3.preparador();const t1=pr.iniciar();const t2=pr.iniciar();
  const viejo=await E3.preparar({key:'RP05',idioma:'es'},deps(falsoP({leer:leer0}),p0),t1,pr);assert.deepEqual(viejo,{ok:false,motivo:'obsoleta'});
  pr.cancelar();const c=await E3.preparar({key:'RP05',idioma:'es'},deps(falsoP({leer:leer0}),p0),t2,pr);assert.deepEqual(c,{ok:false,motivo:'cancelada'});
  const t3=pr.iniciar();const vivo=await E3.preparar({key:'RP05',idioma:'es'},deps(falsoP({leer:leer0}),p0),t3,pr);assert.equal(vivo.ok,true);
  return {primero:viejo.motivo,cancelado:c.motivo};});

 await caso('E3-16','Fuentes obligatorias ausentes: L bloqueada con lo que falta nombrado',async()=>{
  const r=await prep('RP01',deps(falsoP({leer:docsDe(p0)}),p0,{marca:null}));assert.equal(r.motivo,'receta-bloqueada');assert.deepEqual(r.receta.falta,['presupuesto','marca']);});

 await caso('E3-17','Receta parcial: se prepara y nombra lo incompleto y lo omitido (RP09, RP07, RP03)',async()=>{
  const out={};for(const k of ['RP09','RP07','RP03']){const r=await prep(k,deps(falsoP({leer:leer0}),p0));assert.ok(r.ok,k+' '+r.motivo);const R=r.candidato.composicion.resolucion;out[k]={estado:R.estado,incompleta:R.incompleta,omitidas:R.omitidas};}
  assert.equal(out.RP09.estado,'preparable-parcial');assert.ok(out.RP09.incompleta.includes('revisionAnterior'));assert.ok(out.RP07.omitidas.includes('norte'));return out;});

 await caso('E3-18','Recetas C/F: nunca preparables ni emitibles',async()=>{
  const F=E3.evaluarFuentes(E3.analizar(await E3.leerConfirmado(falsoP({leer:leer0})),{Core}),{vistas:{estado:'ready',n:4},marca:{}});
  const cf=E3.resolverTodas(F).filter(r=>r.nivel!=='L');assert.equal(cf.length,9);for(const r of cf){assert.equal(r.preparable,false);assert.equal(r.emitible,false);}
  for(const k of ['RP13','RP16']){const r=await prep(k,deps(falsoP({leer:leer0}),p0));assert.equal(r.ok,false);assert.equal(r.motivo,k==='RP13'?'receta-c':'receta-f');}
  return Object.fromEntries(cf.map(r=>[r.key,r.estado]));});

 await caso('E3-19','Conservación del almacenamiento: la lectura no cambia los documentos, no usa la sesión y el pin no cambia',async()=>{
  const antes=[...leer0.docs].map(([k,v])=>k+sha(v)).join();await prep('RP05',deps(falsoP({leer:leer0}),p0));
  assert.equal([...leer0.docs].map(([k,v])=>k+sha(v)).join(),antes);
  const src=fs.readFileSync(path.join(LAB,'e3/e3-core.js'),'utf8');for(const w of ['setItem','removeItem','.session(','commit(','flush(','indexedDB.open(','globalThis.indexedDB','window.indexedDB','fetch(','XMLHttpRequest','WebSocket','sendBeacon','localStorage.'])assert.ok(!src.includes(w),'e3-core usa '+w);});

 await caso('E3-20','Ninguna revisión confirmada falsa: origen fuera de prueba, lectura sin revisión o sin documentos',async()=>{
  assert.equal((await E3.leerConfirmado(falsoP({origen:false,leer:leer0}))).motivo,'c1-origen');
  for(const s of [{revision:undefined,docs:leer0.docs},{revision:-1,docs:leer0.docs},{revision:1.5,docs:leer0.docs}])assert.equal((await E3.leerConfirmado(falsoP({leer:s}))).estado,'sin-revision');
  const P2={isTestOrigin:()=>true,readConfirmed:async()=>({revision:2,docs:{}})};assert.equal((await E3.leerConfirmado(P2)).estado,'sin-revision');
  assert.equal((await E3.leerConfirmado(null)).estado,'no-disponible');
  assert.equal((await prep('RP10',{...deps(falsoP({leer:leer0}),p0),X:undefined})).motivo,'c2-sin-expediente');
  const leg=new Map([[E3.KEYS.project,JSON.stringify(p0)]]);assert.equal(E3.analizar({estado:'confirmado',revision:1,docs:leg},{Core}).ok,true);
  const ed=new Map([[E3.KEYS.library,JSON.stringify({version:1,activeId:'b',entries:[{id:'b',name:'Edificio',kind:'building',building:{}}]})]]);assert.equal(E3.analizar({estado:'confirmado',revision:1,docs:ed},{Core}).motivo,'edificio');
  const vacia=new Map([[E3.KEYS.library,JSON.stringify({version:1,activeId:null,entries:[]})],[E3.KEYS.project,JSON.stringify(p0)]]);assert.equal(E3.analizar({estado:'confirmado',revision:1,docs:vacia},{Core}).motivo,'c1-sin-revision');});

 await caso('E3-21','Textos ES/EN/ZH completos, sin respaldo silencioso; nombres de receta en ZH rotulados EN',()=>{
  for(const [k,e] of Object.entries(E3.T))for(const l of E3.LANGS){assert.equal(e[l]?.length,4,k+'/'+l);}
  for(const [k,e] of Object.entries(E3.TF))for(const l of E3.LANGS)assert.ok(e[l],k+'/'+l);
  assert.throws(()=>E3.texto('verificado','fr'));assert.throws(()=>E3.texto('no-existe','es'));
  assert.deepEqual(E3.nombre(E3.receta('RP05'),'zh'),{texto:'Initial cost estimate',lang:'en',rotulo:'EN'});
  return {codigos:Object.keys(E3.T).length,motivos:Object.keys(E3.TF).length};});

 await caso('E3-22','Contrato C6 de OP-10 sin activar: E3 no llama a record() y la identidad de C6 sigue «observed-only» sin confirmación',async()=>{
  const D=require(path.join(PIN,'js/scene-delivery-core.js'));const src=fs.readFileSync(path.join(LAB,'e3/e3-core.js'),'utf8');assert.ok(!/\.record\(/.test(src));
  const m={files:{'scene.glb':{sha256:'0'.repeat(64)}},source:{projectId:p0.id,observedProjectSha256:'1'.repeat(64)}};
  const r=await D.record({manifest:m,digest});assert.equal(r.identity.status,'observed-only');
  const r2=await D.record({manifest:m,digest,confirmed:{contentId:cand.congelado.contentId,revision:cand.congelado.revision}});assert.equal(r2.identity.status,'confirmed');
  return {observado:r.identity.status,conIdentidadE3:r2.identity.status,nota:'Solo demuestra la forma del consumo propuesto; producto sigue llamando record({confirmed:null}).'};});

 const pinDespues=hashTree(path.join(PIN,'js'));
 await caso('E3-23','Solo lectura del producto: el pin de master no cambia',()=>{assert.equal(pinDespues,pinAntes);return {pinJsSha256:pinAntes};});

 const pass=casos.filter(c=>c.resultado==='PASS').length;
 const o={schema:'rubik-lab-e3-qa/1',fecha:new Date().toISOString(),pin:pinSha,entorno:{node:process.version,plataforma:process.platform},
  resumen:`${pass}/${casos.length} PASS`,casos,evidenciasMatriz:evid};
 fs.mkdirSync(path.dirname(OUT),{recursive:true});fs.writeFileSync(OUT,JSON.stringify(o,null,1)+'\n');
 console.log(o.resumen);for(const c of casos)if(c.resultado!=='PASS')console.log(c.id,c.error);
 process.exit(pass===casos.length?0:2);
})().catch(e=>{console.error(e);process.exit(1);});
