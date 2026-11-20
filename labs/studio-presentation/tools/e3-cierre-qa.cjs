'use strict';
// E3 · CIERRE TÉCNICO · negativos dirigidos de los hallazgos E3-A (bytes), E3-B (integridad), E3-C (concurrencia),
// E3-D (vigencia de fuentes de sesión) y §8 (fuentes acreditadas). No sustituye a tools/e3-qa.cjs (23 casos conservados).
// «Antes»: con --antes <dir> (núcleo de 448b3ef extraído con git show) reproduce cada defecto sobre el código anterior.
// Determinista: las operaciones en vuelo se controlan con promesas diferidas; ningún caso depende de temporizadores.
// Uso: node tools/e3-cierre-qa.cjs <pinDir> <pinSha> [--antes <dirNucleoAnterior>] [salida.json]
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),zlib=require('node:zlib'),assert=require('node:assert/strict');
const args=process.argv.slice(2);const opt=k=>{const i=args.indexOf(k);if(i<0)return null;const v=args[i+1];args.splice(i,2);return v;};
const ANTES=opt('--antes');const [pinDir,pinSha,salida]=args;
if(!pinDir||!pinSha){console.error('Uso: node tools/e3-cierre-qa.cjs <pinDir> <pinSha> [--antes <dir>] [salida.json]');process.exit(1);}
const LAB=path.resolve(__dirname,'..'),PIN=path.resolve(pinDir),OUT=salida||path.join(LAB,'evidence/e3/e3-cierre-qa.json');
const E3=require('../e3/e3-core.js');
const js=f=>require(path.join(PIN,'js',f));
const X=js('expediente-core.js'),Core=js('project-core.js'),Budget=js('budget-core.js'),D=js('scene-delivery-core.js');
const MOTORES={Surface:js('surface-core.js'),Route:js('presentation-route.js'),Living:js('presentation-living-drawing-core.js'),Section:js('presentation-section-core.js'),Core};
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');const digest=async b=>sha(Buffer.from(b));
const clone=o=>JSON.parse(JSON.stringify(o));
const casos=[];let rechazosSinCapturar=0;process.on('unhandledRejection',()=>{rechazosSinCapturar++;});
async function caso(id,hallazgo,titulo,fn){try{const d=await fn();casos.push({id,hallazgo,titulo,resultado:'PASS',...(d?{detalle:d}:{})});}
 catch(e){casos.push({id,hallazgo,titulo,resultado:'FAIL',error:String(e&&e.stack||e).slice(0,600)});}}

// ---------------------------------------------------------------- escenario sintético
function crc32(b){let c,t=[];for(let n=0;n<256;n++){c=n;for(let k=0;k<8;k++)c=c&1?0xedb88320^(c>>>1):c>>>1;t[n]=c>>>0;}let x=0xffffffff;for(const v of b)x=t[(x^v)&255]^(x>>>8);return (x^0xffffffff)>>>0;}
function chunk(type,data){const l=Buffer.alloc(4);l.writeUInt32BE(data.length);const td=Buffer.concat([Buffer.from(type),data]);const c=Buffer.alloc(4);c.writeUInt32BE(crc32(td));return Buffer.concat([l,td,c]);}
function png(w,h,seed){const ih=Buffer.alloc(13);ih.writeUInt32BE(w,0);ih.writeUInt32BE(h,4);ih[8]=8;ih[9]=2;const raw=Buffer.alloc((w*3+1)*h);for(let i=0;i<raw.length;i++)raw[i]=i%(w*3+1)?((i*seed)&255):0;
 return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',ih),chunk('IDAT',zlib.deflateSync(raw)),chunk('IEND',Buffer.alloc(0))]);}
const PNG=png(4,3,7),PNG_SHA=sha(PNG);
const EX=require(path.join(PIN,'docs/contracts/examples/floorplan-project-v1.example.json')).sourceImages[0];
const base=()=>{const p=Core.initial();p.name='Vivienda sintética E3';return p;};
const conFoto=(p,{sha256=PNG_SHA}={})=>{const q=clone(p);q.sourceImages=[{...clone(EX),id:'img_e3sintetica',widthPx:4,heightPx:3,bytes:PNG.length,sha256,storage:{kind:'local-browser',ref:'img_e3sintetica'}}];Core.validate(q);return q;};
function docsDe(p,{budget=null,revision=3,entry='ent_e3',obra=null,variantes=[],raw={}}={}){
 const lib={version:1,activeId:entry,entries:[{id:entry,name:p.name,project:p},...variantes.map(v=>({id:v,name:'Variante',variantOf:entry,project:{...p,id:p.id+'_'+v}}))]};
 const m=new Map([[E3.KEYS.library,JSON.stringify(lib)],[E3.KEYS.budgets,JSON.stringify(budget?{[p.id]:budget}:{})],[E3.KEYS.reviews,'{}']]);
 if(obra)m.set(E3.KEYS.construction,JSON.stringify({schema:'rubik-sota.construction-record',schemaVersion:'0.1.0',records:{[entry+'|project:'+p.id]:obra}}));
 for(const [k,v] of Object.entries(raw))m.set(k,v);
 return {revision,docs:m};}
const presupuesto=p=>{const b=Budget.createBudget({id:`bud_${p.id}`,subject:{type:'project',id:p.id}});Budget.validateBudget(b);return b;};
// P inmediato y P controlado (cada lectura queda en cola hasta que la prueba la resuelve).
const P=leer=>({isTestOrigin:()=>true,async readConfirmed(){const s=typeof leer==='function'?leer():leer;return {revision:s.revision,docs:new Map(s.docs)};}});
function Pcontrolado(){const cola=[];return {cola,P:{isTestOrigin:()=>true,readConfirmed:()=>new Promise((res,rej)=>cola.push({res:s=>res({revision:s.revision,docs:new Map(s.docs)}),rej}))},
 async resolver(i,s){while(cola.length<=i)await Promise.resolve();cola[i].res(s);for(let k=0;k<20;k++)await Promise.resolve();},
 // Espera POR CONDICIÓN (n lecturas en cola), con límite de 10 s: no depende de cuántas vueltas del bucle tarde el cálculo.
 async esperar(n){const t0=Date.now();while(cola.length<n&&Date.now()-t0<10000)await new Promise(r=>setImmediate(r));assert.ok(cola.length>=n,`se esperaban ${n} lecturas, hay ${cola.length}`);}};}
const VISTAS=(id='V1',estado='ready')=>({estado,n:estado==='ready'?4:0,id:estado==='ready'?{takenAt:'2026-11-20T10:00:00Z',seleccion:id}:null});
function deps(Pp,p,o={}){return {P:Pp,X,Core,Budget,digest,imagenes:o.imagenes??(async ref=>ref==='img_e3sintetica'?new Uint8Array(PNG):null),observado:o.observado||(()=>clone(p)),
 entorno:o.entorno||(()=>({motores:MOTORES,vistas:VISTAS()})),marca:o.marca||(()=>({name:'Estudio sintético'}))};}
const prep=async(key,d,idioma='es')=>{const pr=E3.preparador();return E3.preparar({key,idioma},d,pr.iniciar(),pr);};
const settle=async()=>{for(let k=0;k<50;k++)await new Promise(r=>setImmediate(r));};
const rehuella=async c=>{c.huella=await digest(Buffer.from(E3.canon({schema:c.schema,version:c.version,congelado:c.congelado,composicion:c.composicion,identidades:c.identidades,paquete:c.paquete})));return c;};

(async()=>{
 const p0=base(),pF=conFoto(p0),b0=presupuesto(p0),bF=presupuesto(pF);

 // ============================================================ E3-A · identidad y bytes reales
 await caso('A-00','E3-A','Equivalencia: contentId de E3 (bytes efectivos) = contentIdOf del expediente canónico (pack → read) del mismo trabajo',async()=>{
  const out=await X.pack({kind:'project',name:'E3',project:pF,documents:{budgets:{[pF.id]:bF},reviews:{}}},{getImage:async()=>new Blob([PNG]),now:()=>'2026-11-20T00:00:00.000Z'});
  const canon=await X.contentIdOf(await X.read(new Uint8Array(await out.archive.arrayBuffer())));
  const r=await prep('RP02',deps(P(docsDe(pF,{budget:bF})),pF));assert.ok(r.ok,r.motivo);
  assert.equal(r.candidato.congelado.contentId,canon);assert.equal(r.fuentes.fotosAportadas.estado,'disponible');
  return {contentId:canon,fotos:r.fuentes.fotosAportadas};});
 await caso('A-01','E3-A','Referencia sin bytes: la foto queda ausente y no hay candidato ni «verificado»',async()=>{
  const d=deps(P(docsDe(pF)),pF,{imagenes:async()=>null});const r=await prep('RP02',d);assert.equal(r.ok,false);assert.equal(r.motivo,'imagen-sin-bytes');
  const okc=(await prep('RP02',deps(P(docsDe(pF)),pF))).candidato;const v=await E3.verificar(okc,await E3.actualDesdeConfirmado(d),{digest});
  assert.deepEqual(v,{estado:'preparado',motivo:'imagen-sin-bytes'});return {preparar:r.motivo,verificarDespues:v};});
 await caso('A-02','E3-A','Bytes alterados: fuente «invalida», sin candidato y sin «verificado»',async()=>{
  const mal=new Uint8Array(PNG);mal[40]^=0xff;const d=deps(P(docsDe(pF)),pF,{imagenes:async()=>mal});
  const r=await prep('RP02',d);assert.equal(r.motivo,'imagen-alterada');
  const F=E3.evaluarFuentes(E3.analizar(await E3.leerConfirmado(d.P),{Core,Budget}),{motores:MOTORES,imagenes:await E3.comprobarImagenes(pF,{leer:d.imagenes,digest})});
  assert.equal(F.fotosAportadas.estado,'invalida');return {preparar:r.motivo,fuente:F.fotosAportadas};});
 await caso('A-03','E3-A','Huella declarada que no corresponde a los bytes efectivos: «imagen-alterada», nunca equivalencia inventada',async()=>{
  const pX=conFoto(p0,{sha256:'0'.repeat(64)});const r=await prep('RP02',deps(P(docsDe(pX)),pX));assert.equal(r.motivo,'imagen-alterada');});
 await caso('A-04','E3-A','El recurso desaparece durante la preparación (segunda comprobación): «recurso-cambiado»',async()=>{
  let n=0;const r=await prep('RP02',deps(P(docsDe(pF)),pF,{imagenes:async()=>++n===1?new Uint8Array(PNG):null}));assert.equal(r.motivo,'recurso-cambiado');return {lecturas:n};});
 await caso('A-05','E3-A','La resolución falla o se cancela: «imagen-no-comprobable» / «cancelada», sin rechazo sin capturar',async()=>{
  const r1=await prep('RP02',deps(P(docsDe(pF)),pF,{imagenes:async()=>{throw new Error('lectura fallida');}}));assert.equal(r1.motivo,'imagen-no-comprobable');
  let soltar;const pr=E3.preparador(),t=pr.iniciar();
  const run=E3.preparar({key:'RP02',idioma:'es'},deps(P(docsDe(pF)),pF,{imagenes:()=>new Promise(r=>{soltar=r;})}),t,pr);
  await settle();pr.cancelar();soltar(new Uint8Array(PNG));const r2=await run;assert.deepEqual(r2,{ok:false,motivo:'cancelada'});
  return {fallo:r1.motivo,cancelada:r2.motivo};});
 await caso('A-06','E3-A','Adaptador de solo lectura: no abre ni crea el almacén de imágenes si no existe; sin databases() no es comprobable',async()=>{
  let gets=0;const Images={get:async()=>{gets++;return new Blob([PNG]);}};
  const leer=E3.adaptadorImagenes({indexedDB:{databases:async()=>[]},Images});assert.equal(await leer('img_e3sintetica'),null);assert.equal(gets,0);
  const leer2=E3.adaptadorImagenes({indexedDB:{databases:async()=>[{name:'rubik-sota-images-v1'}]},Images});assert.equal(sha(Buffer.from(await leer2('img_e3sintetica'))),PNG_SHA);assert.equal(gets,1);
  const leer3=E3.adaptadorImagenes({indexedDB:{},Images});const c=await E3.comprobarImagenes(pF,{leer:leer3,digest});assert.equal(c.estado,'no-comprobable');assert.equal(gets,1);
  return {sinAlmacen:'null sin get',conAlmacen:'bytes',sinDatabases:c.estado};});

 // ============================================================ E3-B · integridad del candidato
 const cRP01=(await prep('RP01',deps(P(docsDe(p0,{budget:b0})),p0))).candidato;assert.ok(cRP01,'RP01 debería prepararse');
 const actual01=await E3.actualDesdeConfirmado(deps(P(docsDe(p0,{budget:b0})),p0));
 await caso('B-00','E3-B','Candidato íntegro: «verificado»; la huella cubre la representación canónica completa (no solo «congelado»)',async()=>{
  assert.deepEqual(await E3.verificar(cRP01,actual01,{digest}),{estado:'verificado',motivo:'verificado'});
  const sinRehuella=clone(cRP01);sinRehuella.composicion.seleccion.idioma='en';assert.deepEqual(await E3.verificar(sinRehuella,actual01,{digest}),{estado:'invalido',motivo:'invalido-alterado'});
  const sinRehuella2=clone(cRP01);sinRehuella2.identidades.proyecto.nombre='Otro';assert.equal((await E3.verificar(sinRehuella2,actual01,{digest})).motivo,'invalido-alterado');
  return {schema:cRP01.schema,huella:cRP01.huella};});
 const ALTER=[
  ['B-01','composicion.seleccion (idioma)',c=>{c.composicion.seleccion.idioma='en';},'seleccion.idioma'],
  ['B-02','composicion.seleccion (receta)',c=>{c.composicion.seleccion.receta='RP05';},'seleccion.receta'],
  ['B-03','composicion.resolucion (estado)',c=>{c.composicion.resolucion.estado='preparable';c.composicion.resolucion.incompleta=[];},'resolucion.derivada'],
  ['B-04','fuentes acreditadas (selección y resolución a la vez)',c=>{for(const o of [c.composicion.seleccion,c.composicion.resolucion])o.acreditadas=[...o.acreditadas,'geometria'];},'resolucion.derivada'],
  ['B-05','fuentes parciales y omitidas',c=>{c.composicion.resolucion.parciales=[];c.composicion.resolucion.omitidas=['concepto','x'];},'seleccion.fuentes'],
  ['B-06','estado congelado de una fuente (deriva otra resolución)',c=>{c.congelado.fuentes.presupuesto='ausente';},'resolucion.derivada'],
  ['B-07','identidades.trabajo',c=>{c.identidades.trabajo.contentId='f'.repeat(64);},'identidades.trabajo'],
  ['B-08','identidades.proyecto y revisión',c=>{c.identidades.proyecto.nombre='Otro proyecto';c.identidades.revisionLocal.revision=9;},'identidades.revision'],
  ['B-09','versión de receta',c=>{c.congelado.receta.version=2;c.composicion.seleccion.version=2;},'receta.version'],
  ['B-10','catálogo declarado en la selección',c=>{c.composicion.seleccion.catalogo='otro-catalogo/9';},'seleccion.catalogo'],
  ['B-11','vínculo selección ↔ candidato (huella de la selección)',c=>{c.congelado.seleccionSha256='a'.repeat(64);},'seleccion.huella'],
  ['B-12','fuentes de vigencia congeladas',c=>{c.congelado.vigencia={};},'vigencia.fuentes'],
  ['B-13','paquete no nulo / emitible',c=>{c.paquete={zip:'x'};c.composicion.resolucion.emitible=true;},'paquete']];
 for(const [id,campo,mut,esperado] of ALTER)await caso(id,'E3-B',`Alteración coherente (huella recalculada) de ${campo}: «invalido», nunca «verificado»`,async()=>{
  const c=clone(cRP01);mut(c);await rehuella(c);const v=await E3.verificar(c,actual01,{digest});
  assert.equal(v.estado,'invalido',JSON.stringify(v));assert.equal(v.motivo,'invalido-incoherente');assert.ok(v.incoherencias.includes(esperado),JSON.stringify(v.incoherencias));return v.incoherencias;});
 await caso('B-14','E3-B','Catálogo de reglas distinto del vigente (huellas coherentes): «verificado-desactualizado», no «verificado»',async()=>{
  const c=clone(cRP01);c.congelado.catalogoSha='b'.repeat(64);c.composicion.seleccion.catalogoSha='b'.repeat(64);c.congelado.seleccionSha256=await digest(Buffer.from(E3.canon(c.composicion.seleccion)));await rehuella(c);
  assert.deepEqual(await E3.verificar(c,actual01,{digest}),{estado:'verificado-desactualizado',motivo:'desactualizado-catalogo'});});
 await caso('B-15','E3-B','E3-14 conservado: revisión congelada manipulada sin rehuella → «invalido-alterado»',async()=>{
  const m=clone(cRP01);m.congelado.revision=99;assert.deepEqual(await E3.verificar(m,actual01,{digest}),{estado:'invalido',motivo:'invalido-alterado'});});

 // ============================================================ E3-C · concurrencia y resultados obsoletos (controlador)
 const L0=docsDe(p0,{budget:b0});
 function ctl(Pp,o={}){const ev=[];const c=E3.controlador(()=>deps(Pp,p0,o),{onCambio:(s,f)=>ev.push({foco:f,ocupado:s.ocupado,sel:s.sel,aviso:s.aviso,cand:!!s.candidato})});return {c,ev};}
 await caso('C-01','E3-C','Cambiar de receta durante la preparación: el resultado tardío no aparece ni mueve el foco',async()=>{
  const g=Pcontrolado();const {c,ev}=ctl(g.P);c.elegir('RP10');const run=c.preparar();await g.esperar(1);c.elegir('RP09');
  await g.resolver(0,L0);await g.esperar(2);await g.resolver(1,L0);await run;const s=c.estado;
  assert.equal(s.sel,'RP09');assert.equal(s.candidato,null);assert.equal(s.ocupado,false);assert.equal(s.aviso,null);assert.ok(!ev.some(e=>e.foco==='vista-previa'));});
 await caso('C-02','E3-C','Cambiar de idioma durante la preparación: el candidato del idioma anterior se descarta',async()=>{
  const g=Pcontrolado();const {c,ev}=ctl(g.P);c.elegir('RP10');c.idioma('es');const run=c.preparar();await g.esperar(1);c.idioma('en');
  await g.resolver(0,L0);await g.esperar(2);await g.resolver(1,L0);await run;assert.equal(c.estado.candidato,null);assert.equal(c.estado.idioma,'en');assert.ok(!ev.some(e=>e.cand));});
 await caso('C-03','E3-C','Cancelar y preparar otra al instante: la antigua no apaga «ocupado» de la nueva ni se aplica',async()=>{
  const g=Pcontrolado();const {c}=ctl(g.P);c.elegir('RP10');const r1=c.preparar();await g.esperar(1);c.cancelar();assert.equal(c.estado.aviso,'cancelada');
  const r2=c.preparar();await g.esperar(2);assert.equal(c.estado.ocupado,true);
  await g.resolver(0,L0);await g.esperar(3);await g.resolver(2,L0);await r1;assert.equal(c.estado.ocupado,true,'la antigua apagó ocupado');assert.equal(c.estado.candidato,null);
  await g.resolver(1,L0);await g.esperar(4);await g.resolver(3,L0);await settle();
  // la nueva termina y verifica (lectura 5)
  await g.esperar(5);await g.resolver(4,L0);await r2;assert.equal(c.estado.ocupado,false);assert.ok(c.estado.candidato);assert.equal(c.estado.verificacion?.estado,'verificado');});
 await caso('C-04','E3-C','Cerrar y reabrir durante una operación: el diálogo cerrado no emite nada y el nuevo no se toca',async()=>{
  const g=Pcontrolado();const a=ctl(g.P);a.c.elegir('RP10');const run=a.c.preparar();await g.esperar(1);const n=a.ev.length;a.c.cerrar();
  const b=ctl(P(L0));b.c.elegir('RP09');await g.resolver(0,L0);await g.esperar(2);await g.resolver(1,L0);await run;
  assert.equal(a.ev.length,n);assert.equal(b.c.estado.sel,'RP09');assert.equal(b.c.estado.candidato,null);assert.equal(b.c.estado.ocupado,false);});
 await caso('C-05','E3-C','Cambio de proyecto o variante durante la preparación: no se congela el proyecto anterior',async()=>{
  const g=Pcontrolado();let obs=clone(p0);const {c}=ctl(g.P,{observado:()=>obs});c.elegir('RP10');const run=c.preparar();
  await g.resolver(0,L0);obs={...clone(p0),id:'prj_otra_variante',name:'Variante'};await g.esperar(2);await g.resolver(1,L0);await run;
  assert.equal(c.estado.candidato,null);assert.equal(c.estado.aviso,'cambios-sin-guardar');
  const g2=Pcontrolado();const d2=ctl(g2.P);d2.c.elegir('RP10');const run2=d2.c.preparar();await g2.resolver(0,L0);await g2.esperar(2);
  const pV={...clone(p0),id:'prj_var'};await g2.resolver(1,docsDe(pV,{revision:4,entry:'ent_var'}));await run2;assert.equal(d2.c.estado.aviso,'revision-movida');
  return {local:c.estado.aviso,confirmado:d2.c.estado.aviso};});
 await caso('C-06','E3-C','Releer con una verificación anterior pendiente: la verificación vieja no sobrescribe a la nueva',async()=>{
  const g=Pcontrolado();const {c}=ctl(g.P);c.elegir('RP10');const run=c.preparar();await g.resolver(0,L0);await g.esperar(2);await g.resolver(1,L0);
  await g.esperar(3);// verificación 1 pendiente (lectura 3)
  const L5=docsDe({...clone(p0),name:'Renombrado'},{budget:b0,revision:5});
  const rl=c.leer();await g.esperar(4);await g.resolver(3,L5);await settle();// relectura: proyecto cambiado
  await g.esperar(5);await g.resolver(4,L5);await rl;// verificación 2 (nueva) aplicada
  const despues=c.estado.verificacion;await g.resolver(2,L0);await run;// llega tarde la verificación 1 (habría dicho «verificado»)
  assert.equal(c.estado.verificacion,despues);assert.notEqual(c.estado.verificacion.estado,'verificado');return c.estado.verificacion;});
 await caso('C-07','E3-C','Otra pestaña confirma durante la preparación: «revision-movida», sin candidato',async()=>{
  const g=Pcontrolado();const {c}=ctl(g.P);c.elegir('RP10');const run=c.preparar();await g.resolver(0,L0);await g.esperar(2);await g.resolver(1,{...L0,revision:4});await run;
  assert.equal(c.estado.aviso,'revision-movida');assert.equal(c.estado.candidato,null);assert.equal(c.estado.ocupado,false);});
 await caso('C-08','E3-C','Cambios locales sin confirmar durante una preparación inicialmente válida: «cambios-sin-guardar»',async()=>{
  const g=Pcontrolado();let obs=clone(p0);const {c}=ctl(g.P,{observado:()=>obs});c.elegir('RP10');const run=c.preparar();await g.resolver(0,L0);
  obs=clone(p0);obs.walls[0].end={x:obs.walls[0].end.x+5,y:obs.walls[0].end.y};await g.esperar(2);await g.resolver(1,L0);await run;assert.equal(c.estado.aviso,'cambios-sin-guardar');});
 await caso('C-09','E3-C','Errores sin recuperación imposibles: dependencias que lanzan o lecturas que rechazan dejan un motivo, no una promesa rechazada',async()=>{
  const c=E3.controlador(()=>{throw new Error('deps rotas');});c.elegir('RP10');await c.leer();await c.preparar();
  assert.equal(c.estado.aviso,'error-inesperado');assert.equal(c.estado.ocupado,false);
  const g=Pcontrolado();const {c:c2}=ctl(g.P);const l=c2.leer();await g.esperar(1);g.cola[0].rej(new Error('fallo sin código'));await l;assert.equal(c2.estado.lectura.motivo,'c1-error');
  return {sinCapturar:rechazosSinCapturar};});

 // ============================================================ E3-D · vigencia de fuentes de sesión
 let vistas=VISTAS('V1');const dV=()=>deps(P(L0),p0,{entorno:()=>({motores:MOTORES,vistas})});
 const cRP07=(await prep('RP07',dV())).candidato;assert.ok(cRP07,'RP07 debería prepararse');
 await caso('D-01','E3-D','Vistas «ready» → verificado; sustituidas sin cambiar geometría o cambiada su selección → desactualizado',async()=>{
  assert.equal((await E3.verificar(cRP07,await E3.actualDesdeConfirmado(dV()),{digest})).estado,'verificado');
  vistas={estado:'ready',n:4,id:{takenAt:'2026-11-20T11:00:00Z',seleccion:'V1'}};const v1=await E3.verificar(cRP07,await E3.actualDesdeConfirmado(dV()),{digest});
  vistas=VISTAS('V2');const v2=await E3.verificar(cRP07,await E3.actualDesdeConfirmado(dV()),{digest});
  for(const v of [v1,v2]){assert.equal(v.estado,'verificado-desactualizado');assert.deepEqual(v.cambiadas,['vistas3d']);}vistas=VISTAS('V1');return {sustituidas:v1.motivo,seleccion:v2.motivo};});
 await caso('D-02','E3-D','Vistas «stale», «busy», «none», «error» o invalidadas: ni se acreditan ni dan «verificado»',async()=>{
  const out={};for(const e of ['stale','busy','none','error']){vistas={estado:e,n:0,id:null};
   const F=E3.evaluarFuentes(E3.analizar(await E3.leerConfirmado(P(L0)),{Core,Budget}),{motores:MOTORES,vistas});assert.equal(F.vistas3d.estado,'ausente',e);
   const v=await E3.verificar(cRP07,await E3.actualDesdeConfirmado(dV()),{digest});assert.deepEqual(v,{estado:'preparado',motivo:'fuente-no-comprobable',noComprobables:['vistas3d']});out[e]=v.motivo;}
  vistas=VISTAS('V1');return out;});
 await caso('D-03','E3-D','Cambio de planta o proyecto: «desactualizado-trabajo» (identidad portable distinta)',async()=>{
  const q=clone(p0);q.rooms[0].name=(q.rooms[0].name||'')+' (otra planta)';
  const v=await E3.verificar(cRP07,await E3.actualDesdeConfirmado(deps(P(docsDe(q,{budget:b0,revision:6})),q,{entorno:()=>({motores:MOTORES,vistas})})),{digest});assert.equal(v.motivo,'desactualizado-trabajo');});
 await caso('D-04','E3-D','Cambio de marca DURANTE la preparación: «recurso-cambiado»',async()=>{
  let n=0;const r=await prep('RP01',deps(P(L0),p0,{marca:()=>({name:++n===1?'Estudio A':'Estudio B'})}));assert.equal(r.motivo,'recurso-cambiado');});
 await caso('D-05','E3-D','Cambios del plan de obra y de las relaciones de variantes: caducan solo las recetas que los usan',async()=>{
  const obra={schedule:{tasks:[{id:'t1',days:3}]},binding:null};
  const LO=docsDe(p0,{budget:b0,obra}),c8=(await prep('RP08',deps(P(LO),p0))).candidato;assert.ok(c8,'RP08');assert.ok('planObra' in c8.congelado.vigencia);
  const v8=await E3.verificar(c8,await E3.actualDesdeConfirmado(deps(P(docsDe(p0,{budget:b0,obra:{schedule:{tasks:[{id:'t1',days:5}]}}})),p0)),{digest});
  assert.equal(v8.motivo,'desactualizado-fuente');assert.ok(v8.cambiadas.includes('planObra'));
  const LV=docsDe(p0,{budget:b0,variantes:['ent_v1']}),c3=(await prep('RP03',deps(P(LV),p0))).candidato;assert.ok(c3,'RP03');
  const v3=await E3.verificar(c3,await E3.actualDesdeConfirmado(deps(P(docsDe(p0,{budget:b0,variantes:['ent_v1','ent_v2']})),p0)),{digest});
  assert.deepEqual(v3.cambiadas,['variantesGuardadas']);
  const v10=await E3.verificar(cRP07,await E3.actualDesdeConfirmado(deps(P(docsDe(p0,{budget:b0,variantes:['ent_v9'],obra})),p0,{entorno:()=>({motores:MOTORES,vistas})})),{digest});
  assert.equal(v10.estado,'verificado','RP07 no usa obra ni variantes');return {RP08:v8.cambiadas,RP03:v3.cambiadas,RP07:v10.estado};});
 await caso('D-06','E3-D','Información externa necesaria ausente al verificar (firma no disponible): «preparado», no vigente',async()=>{
  const v=await E3.verificar(cRP01,await E3.actualDesdeConfirmado(deps(P(docsDe(p0,{budget:b0})),p0,{marca:()=>null})),{digest});
  assert.deepEqual(v,{estado:'preparado',motivo:'fuente-no-comprobable',noComprobables:['marca']});});
 await caso('D-07','E3-D','Restauración portable: mismo trabajo y mismas fuentes pertinentes → «verificado-restaurado»; sin vistas → no vigente',async()=>{
  const q={...clone(p0),id:'prj_restaurado_e3'};const bq={...clone(b0),id:`bud_${q.id}`,subject:{type:'project',id:q.id}};const LR=docsDe(q,{budget:bq,revision:1,entry:'ent_rest'});
  const v1=await E3.verificar(cRP01,await E3.actualDesdeConfirmado(deps(P(LR),q)),{digest});assert.deepEqual(v1,{estado:'verificado',motivo:'verificado-restaurado'});
  const v2=await E3.verificar(cRP07,await E3.actualDesdeConfirmado(deps(P(LR),q,{entorno:()=>({motores:MOTORES,vistas:{estado:'none',n:0,id:null}})})),{digest});assert.equal(v2.motivo,'fuente-no-comprobable');
  return {RP01:v1.motivo,RP07:v2.motivo};});
 await caso('D-08','E3-D','C4/C6 sin activar: ninguna cámara persistida; C6 sigue «observed-only» sin identidad confirmada',async()=>{
  const src=fs.readFileSync(path.join(LAB,'e3/e3-core.js'),'utf8')+fs.readFileSync(path.join(LAB,'e3/e3-ui.js'),'utf8');assert.ok(!/\.record\(|camera|setItem/.test(src));
  const r=await D.record({manifest:{files:{'scene.glb':{sha256:'0'.repeat(64)}},source:{projectId:p0.id,observedProjectSha256:'1'.repeat(64)}},digest});assert.equal(r.identity.status,'observed-only');});

 // ============================================================ §8 · fuentes acreditadas
 await caso('S-01','§8','Presupuesto: válido por FloorPlanBudget.parseBudget y del mismo sujeto → «parcial» (sin vínculo con esta geometría)',async()=>{
  const F=E3.evaluarFuentes(E3.analizar(await E3.leerConfirmado(P(L0)),{Core,Budget}),{motores:MOTORES});assert.equal(F.presupuesto.estado,'parcial');assert.equal(F.presupuesto.motivo,'presupuesto-sin-vinculo');});
 await caso('S-02','§8','Presupuesto de otro TIPO de sujeto (mismo id) o que no supera la validación canónica → «invalida», no acreditado',async()=>{
  const out={};for(const [k,b] of [['tipo',{...clone(b0),subject:{type:'building',id:p0.id}}],['validacion',{...clone(b0),items:'no-es-lista'}],['sinAutoridad',clone(b0)]]){
   const A=E3.analizar(await E3.leerConfirmado(P(docsDe(p0,{budget:b}))),{Core,Budget:k==='sinAutoridad'?null:Budget});const F=E3.evaluarFuentes(A,{motores:MOTORES});
   assert.equal(F.presupuesto.estado,'invalida',k);out[k]=A.budgetInvalido.slice(0,40);}
  const r=await prep('RP05',deps(P(docsDe(p0,{budget:{...clone(b0),subject:{type:'building',id:p0.id}}})),p0));assert.deepEqual(r.receta.falta,['presupuesto']);return out;});
 await caso('S-03','§8','Documentos corruptos (biblioteca, presupuestos, observaciones) → «documento-corrupto», nunca vacíos válidos',async()=>{
  const out={};for(const k of [E3.KEYS.library,E3.KEYS.budgets,E3.KEYS.reviews]){const d=docsDe(p0,{budget:b0,raw:{[k]:'{corrupto'}});
   const A=E3.analizar(await E3.leerConfirmado(P(d)),{Core,Budget});assert.equal(A.motivo,'documento-corrupto',k);out[k]=A.detalle;
   const r=await prep('RP10',deps(P(d),p0));assert.equal(r.motivo,'documento-corrupto');}
  for(const l of E3.LANGS)assert.ok(E3.texto('documento-corrupto',l).siguiente);return out;});
 await caso('S-04','§8','Motor cargado ≠ motor funcional: sin módulo, módulo que lanza o sin resultado → ausente con motivo propio',async()=>{
  const A=E3.analizar(await E3.leerConfirmado(P(L0)),{Core,Budget});
  const real=E3.evaluarFuentes(A,{motores:MOTORES});for(const k of ['superficies','recorrido','dibujoVivo'])assert.equal(real[k].estado,'disponible',k);
  const m={...MOTORES,Surface:{home(){throw new Error('x');}},Route:undefined,Section:{derive:()=>({supported:false})}};const F=E3.evaluarFuentes(A,{motores:m});
  assert.equal(F.superficies.motivo,'motor-error');assert.equal(F.recorrido.motivo,'sin-motor');assert.equal(F.seccionFachadas.motivo,'motor-sin-resultado');
  return {superficies:real.superficies.dato,recorrido:real.recorrido.dato,seccion:real.seccionFachadas};});
 await caso('S-05','§8','Interfaz de diagnóstico solo con la bandera de laboratorio RUBIK_E3_QA (no en la propuesta productiva)',async()=>{
  const ui=fs.readFileSync(path.join(LAB,'e3/e3-ui.js'),'utf8');assert.ok(/if\(window\.RUBIK_E3_QA===true\)/.test(ui));assert.ok(!/window\.__e3=state;/.test(ui));
  const patch=fs.readFileSync(path.join(LAB,'e3/rubik-130ba24-e3.patch'),'utf8');assert.ok(!patch.includes('RUBIK_E3_QA'));});
 await caso('S-06','§8','Ningún rechazo de promesa sin capturar en toda la suite',async()=>{await settle();assert.equal(rechazosSinCapturar,0);});

 // ============================================================ «antes»: reproducción sobre el núcleo de 448b3ef
 const antes=[];
 if(ANTES){
  const O=require(path.resolve(ANTES,'e3-core.js'));
  const od=(Pp,p,o={})=>({P:Pp,X,Core,digest,observado:()=>clone(p),entorno:()=>({motores:{superficies:true,dibujoVivo:true,recorrido:true,seccion:true},vistas:o.vistas||{estado:'ready',n:4}}),marca:o.marca||(()=>({name:'Estudio sintético'}))});
  const op=async(k,d)=>{const pr=O.preparador();return O.preparar({key:k,idioma:'es'},d,pr.iniciar(),pr);};
  const rep=(id,hallazgo,defecto,ok)=>antes.push({id,hallazgo,defecto,reproducido:!!ok});
  // E3-A: sin bytes y con bytes alterados, el núcleo anterior prepara y acredita la foto y verifica «verificado».
  const ra=await op('RP02',od(P(docsDe(pF)),pF));rep('A-antes','E3-A','Foto acreditada y candidato preparado sin leer sus bytes (huella declarada)',ra.ok&&ra.fuentes.fotosAportadas.estado==='disponible');
  const pX=conFoto(p0,{sha256:'0'.repeat(64)});const rx=await op('RP02',od(P(docsDe(pX)),pX));rep('A-antes-2','E3-A','Huella declarada falsa aceptada como identidad',rx.ok);
  // E3-B: alterar la composición (fuera de «congelado») sigue dando «verificado».
  const rb=await op('RP05',od(P(L0),p0));const cb=clone(rb.candidato);cb.composicion.resolucion.estado='preparable';cb.composicion.seleccion.acreditadas=['geometria'];cb.identidades.proyecto.id='otro';
  const vb=await O.verificar(cb,await O.actualDesdeConfirmado(od(P(L0),p0)),{digest});rep('B-antes','E3-B','Composición, fuentes e identidades alteradas fuera de «congelado» → «verificado»',vb.estado==='verificado');
  // E3-D: vistas sustituidas → «verificado»; marca cambiada → caduca RP05 aunque no la use.
  const rd=await op('RP07',od(P(L0),p0));const vd=await O.verificar(rd.candidato,await O.actualDesdeConfirmado(od(P(L0),p0,{vistas:{estado:'stale',n:0}})),{digest});
  rep('D-antes','E3-D','Vistas invalidadas tras preparar RP07 → sigue «verificado»',vd.estado==='verificado');
  const vm=await O.verificar(rb.candidato,await O.actualDesdeConfirmado(od(P(L0),p0,{marca:()=>({name:'Otro'})})),{digest});rep('D-antes-2','E3-D','Cambio de marca caduca RP05, que no usa la marca',vm.estado==='verificado-desactualizado');
  // §8: presupuesto de tipo «building» con el mismo id acreditado; motor «disponible» por estar cargado.
  const rs=await op('RP05',od(P(docsDe(p0,{budget:{...clone(b0),subject:{type:'building',id:p0.id}}})),p0));rep('S-antes','§8','Presupuesto de otro tipo de sujeto acreditado',rs.ok);
  const lc=docsDe(p0,{budget:b0,raw:{[E3.KEYS.budgets]:'{corrupto'}});const rc=await op('RP10',od(P(lc),p0));rep('S-antes-2','§8','Documento de presupuestos corrupto tratado como vacío (prepara)',rc.ok);
  // E3-C: el núcleo anterior no tenía controlador; la UI anterior asignaba el resultado si el preparador lo aceptaba, y el
  // cambio de receta no llamaba a prep.cancelar(): una preparación en vuelo podía terminar y mostrarse sobre otra receta.
  const ui=require('node:child_process').spawnSync('git',['show','448b3ef:labs/studio-presentation/e3/e3-ui.js'],{cwd:LAB,encoding:'utf8'}).stdout||'';
  rep('C-antes','E3-C','Cambio de receta sin cancelar la preparación en vuelo (inspección del código anterior)',/state\.sel=r\.key;state\.aviso=null;state\.candidato=null;state\.verificacion=null;renderDetail/.test(ui)&&!/inp\.addEventListener\('change',\(\)=>\{[^}]*prep\.cancelar/.test(ui));
 }

 const cuenta=r=>casos.filter(c=>c.resultado===r).length;
 const o={schema:'rubik-lab-e3-cierre-qa/1',fecha:new Date().toISOString(),pin:pinSha,entorno:{node:process.version,plataforma:process.platform},
  resumen:`${cuenta('PASS')}/${casos.length} PASS`,porHallazgo:Object.fromEntries(['E3-A','E3-B','E3-C','E3-D','§8'].map(h=>[h,`${casos.filter(c=>c.hallazgo===h&&c.resultado==='PASS').length}/${casos.filter(c=>c.hallazgo===h).length}`])),
  antes:ANTES?{nucleo:'448b3ef12eb6341e021308754c5fef726a28b8e4',reproducidos:`${antes.filter(a=>a.reproducido).length}/${antes.length}`,casos:antes}:null,casos};
 fs.mkdirSync(path.dirname(OUT),{recursive:true});fs.writeFileSync(OUT,JSON.stringify(o,null,1)+'\n');
 console.log(o.resumen,JSON.stringify(o.porHallazgo),o.antes?'antes '+o.antes.reproducidos:'');for(const c of casos)if(c.resultado!=='PASS')console.log(c.id,c.error);
 if(o.antes)for(const a of o.antes.casos)if(!a.reproducido)console.log('NO reproducido',a.id);
 process.exit(cuenta('FAIL')?2:0);
})().catch(e=>{console.error(e);process.exit(1);});
