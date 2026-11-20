'use strict';
// K11 / IMG-12 / ENT-05 · QA del núcleo de laboratorio (k11/k11-core.js) contra un PIN de solo lectura (candidata E3 de Codex
// 64f8837 o master). Fixtures sintéticas: proyecto de referencia del producto, PNG generadas aquí, proveedor SIMULADO.
// «Antes» (K11-A/K11-B): se ejecuta la clave REAL de js/ai-render-ui.js extraída del pin y se inspecciona su ficha en memoria.
// Uso: node tools/k11-qa.cjs <pinDir> <pinSha> [salida.json]
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),zlib=require('node:zlib'),assert=require('node:assert/strict');
const [pinDir,pinSha,salida]=process.argv.slice(2);if(!pinDir||!pinSha){console.error('Uso: node tools/k11-qa.cjs <pinDir> <pinSha> [salida.json]');process.exit(1);}
const LAB=path.resolve(__dirname,'..'),PIN=path.resolve(pinDir),OUT=salida||path.join(LAB,'evidence/k11/k11-qa.json');
const K=require('../k11/k11-core.js');const js=f=>require(path.join(PIN,'js',f));
const X=js('expediente-core.js'),Core=js('project-core.js'),Persist=js('persistence-store.js');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');const digest=async b=>sha(Buffer.from(b));const clone=o=>JSON.parse(JSON.stringify(o));
const casos=[];let sinCapturar=0;process.on('unhandledRejection',()=>{sinCapturar++;});
async function caso(id,req,titulo,fn){try{const d=await fn();casos.push({id,requisito:req,titulo,resultado:'PASS',...(d?{detalle:d}:{})});}catch(e){casos.push({id,requisito:req,titulo,resultado:'FAIL',error:String(e&&e.stack||e).slice(0,500)});}}
// ---------------------------------------------------------------- fixtures sintéticas
function crc32(b){let c,t=[];for(let n=0;n<256;n++){c=n;for(let k=0;k<8;k++)c=c&1?0xedb88320^(c>>>1):c>>>1;t[n]=c>>>0;}let x=0xffffffff;for(const v of b)x=t[(x^v)&255]^(x>>>8);return (x^0xffffffff)>>>0;}
function chunk(type,data){const l=Buffer.alloc(4);l.writeUInt32BE(data.length);const td=Buffer.concat([Buffer.from(type),data]);const c=Buffer.alloc(4);c.writeUInt32BE(crc32(td));return Buffer.concat([l,td,c]);}
function png(w,h,seed){const ih=Buffer.alloc(13);ih.writeUInt32BE(w,0);ih.writeUInt32BE(h,4);ih[8]=8;ih[9]=2;const raw=Buffer.alloc((w*3+1)*h);for(let i=0;i<raw.length;i++)raw[i]=i%(w*3+1)?((i*seed)&255):0;return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',ih),chunk('IDAT',zlib.deflateSync(raw)),chunk('IEND',Buffer.alloc(0))]);}
const durl=(b,t='image/png')=>`data:${t};base64,${Buffer.from(b).toString('base64')}`;
const p0=Core.initial();p0.name='Vivienda sintética K11';
let CID=null;
const vista=(takeId,{seed=7,id='stop-r1'}={})=>({id,label:'Salón',takeId,takenAt:'2026-11-20T10:00:00.000Z',source:'automatic',dataUrl:durl(png(6,4,seed))});
const deferred=()=>{let res,rej;const p=new Promise((a,b)=>{res=a;rej=b;});return {p,res,rej};};
let n=0;const nuevoId=()=>'vr_'+crypto.randomBytes(8).toString('hex')+(++n);
// Conversión del envío: en el navegador es la de ai-render-ui (canvas → JPEG 0,9 con fondo blanco). Aquí, bytes distintos y declarados.
const convertir=async u=>durl(Buffer.concat([Buffer.from([0xff,0xd8,0xff]),Buffer.from(u).subarray(0,64)]),'image/jpeg');
const simulado=async({image,style})=>({image:durl(png(6,4,(style||'x').length+3)),model:null,usage:null,cost:null,generatedAt:'2026-11-20T10:01:00.000Z'});
function ctx(o={}){let c={projectId:p0.id,entryId:'ent_k11',levelId:null,contentId:CID,revision:3,takeId:'take-A',...o};return {get:()=>c,set:v=>{c={...c,...v};}};}
const depsDe=(cx,o={})=>({digest,nuevoId,ahora:()=>'2026-11-20T10:02:00.000Z',contexto:cx.get,convertir,proveedor:o.proveedor||simulado,transformacion:'jpeg q=0.9 fondo blanco (ai-render-ui.jpeg)',clase:'simulado-laboratorio',cache:o.cache||new Map(),proveedorNombre:'openai'});
function almacenes(o={}){const B=new Map(),log=[];let proj=clone(p0);
 const bytes={get:async r=>B.get(r)||null,put:async(r,b)=>{if(o.putFalla?.(r,B.size))throw o.putFalla(r,B.size);B.set(r,new Uint8Array(b));log.push('put:'+r);},remove:async r=>{B.delete(r);log.push('rm:'+r);}};
 const proyecto={leer:()=>proj,commit:async next=>{if(o.commitFalla)throw o.commitFalla;proj=next;log.push('commit');},fijar:p=>{proj=p;}};
 return {B,log,bytes,proyecto,ad:K.adaptadorLaboratorio({bytes,proyecto})};}
async function nueva(cx,v,estilo={style:'natural'},o={}){const g=K.generador();return K.generar({vista:v,estilo},depsDe(cx,o),g.iniciar(),g);}

(async()=>{
 CID=await X.contentId({kind:'project',project:p0},{budgets:{},reviews:{}},async()=>{throw new Error('sin imágenes');});

 // ================================================ antes: el código real de ai-render-ui.js
 const ui=fs.readFileSync(path.join(PIN,'js/ai-render-ui.js'),'utf8');
 await caso('K-00','K11-B · antes','La clave REAL de ai-render-ui.js da la MISMA clave para dos tomas distintas con la misma vista y revisión',()=>{
  const src=/const key=\(viewId,style,floor='',walls=''\)=>\[([^\]]+)\]\.join\('\|'\);/.exec(ui);assert.ok(src,'no se encontró la clave en ai-render-ui.js');
  const key=new Function('app','FloorPlanGuide',`return (viewId,style,floor='',walls='')=>[${src[1]}].join('|');`)({entryId:'ent',project:{id:'prj'}},{revision:()=>'r7'});
  const a=key('stop-r1','natural'),b=key('stop-r1','natural');assert.equal(a,b);assert.ok(!/take/i.test(src[1]));
  const ahoraA=K.claveCache({entryId:'ent',projectId:'prj',revision:'r7',takeId:'take-A',viewId:'stop-r1',style:'natural'}),ahoraB=K.claveCache({entryId:'ent',projectId:'prj',revision:'r7',takeId:'take-B',viewId:'stop-r1',style:'natural'});
  assert.notEqual(ahoraA,ahoraB);return {antes:a,ahoraA,ahoraB};});
 await caso('K-00b','K11-A · antes','ai-render-ui.js conserva como «original» view.dataUrl pero envía jpeg(view.dataUrl) y no guarda los bytes enviados',()=>{
  assert.ok(/image:await jpeg\(view\.dataUrl\)/.test(ui));assert.ok(/original:view\.dataUrl/.test(ui));
  const res=/const result=\{([^}]+)\}/.exec(ui)[1];assert.ok(!/sent|enviada|jpeg/i.test(res),'la ficha en memoria ya guardaba el envío');return {fichaEnMemoria:res.split(',').map(s=>s.split(':')[0])};});

 // ================================================ contrato y K11-A
 const cx=ctx();const r1=await nueva(cx,vista('take-A'));assert.ok(r1.ok,r1.motivo+' '+r1.detalle);const f1=r1.ficha;
 await caso('K-01','Contrato','Ficha trazable completa: id opaco, sujeto (proyecto, entrada, contentId, revisión), toma (takeId), recursos, estilo, procedencia, derechos; lo no acreditado se enumera',async()=>{
  for(const k of ['schema','id','clase','sujeto','toma','recursos','estilo','procedencia','derechos','noAcreditado','claveContenido','huella'])assert.ok(k in f1,k);
  assert.match(f1.id,/^vr_[0-9a-f]+/);assert.equal(f1.sujeto.contentId,CID);assert.equal(f1.toma.takeId,'take-A');assert.equal(f1.clase,'simulado-laboratorio');
  assert.deepEqual([...f1.noAcreditado].sort(),['camara','consumo','coste','iluminacion','modelo'].sort());// copia: sort() mutaría la fichaassert.equal(f1.procedencia.coste,null);assert.equal(f1.camara,null);
  const v=await K.verificar(f1,{digest,leerBytes:async r=>({[f1.recursos.original.storage.ref]:r1.datos.original,[f1.recursos.enviada.storage.ref]:r1.datos.enviada,[f1.recursos.resultado.storage.ref]:r1.datos.resultado})[r],actual:cx.get()});
  assert.deepEqual([v.integridad,v.vigencia],['integro','vigente']);return {id:f1.id,noAcreditado:f1.noAcreditado,huella:f1.huella};});
 await caso('K-02','K11-A','Original y bytes enviados son recursos distintos y verificables; el envío declara su transformación y deriva del original',async()=>{
  const {original,enviada,resultado}=f1.recursos;assert.notEqual(original.sha256,enviada.sha256);assert.equal(enviada.derivadaDe,original.sha256);assert.equal(enviada.mediaType,'image/jpeg');assert.ok(enviada.transformacion);
  const malos={[original.storage.ref]:r1.datos.original,[enviada.storage.ref]:Uint8Array.from(r1.datos.enviada,(x,i)=>i===5?x^1:x),[resultado.storage.ref]:r1.datos.resultado};
  const v=await K.verificar(f1,{digest,leerBytes:async r=>malos[r]});assert.equal(v.integridad,'invalido');assert.ok(v.motivos.includes('enviada:alterado'));
  await assert.rejects(K.crearResultado({...base(),enviada:{dataUrl:await convertir(vista('t').dataUrl)}},{digest,nuevoId}),e=>e.code==='sin-envio');
  const t=clone(f1);t.recursos.enviada.derivadaDe='0'.repeat(64);const {huella,...c}=t;t.huella=await digest(Buffer.from(K.canon(c)));
  assert.deepEqual((await K.verificar(t,{digest})).motivos,['envio-no-derivado']);return {original:original.sha256.slice(0,12),enviada:enviada.sha256.slice(0,12)};});
 function base(){return {clase:'render-ia',sujeto:{projectId:p0.id,entryId:'ent_k11',contentId:CID,revision:3},toma:{takeId:'take-A',takenAt:'2026-11-20T10:00:00.000Z',viewId:'stop-r1'},original:{dataUrl:vista('x').dataUrl},resultado:{dataUrl:durl(png(6,4,9))},procedencia:{proveedor:'openai'}};}

 // ================================================ K11-B
 await caso('K-03','K11-B','Recaptura (otro takeId, misma vista y revisión) no reutiliza el resultado anterior; la misma toma sí; sin takeId no hay caché',async()=>{
  const cache=new Map(),c=ctx();const a=await nueva(c,vista('take-A'),{style:'natural'},{cache});const a2=await nueva(c,vista('take-A'),{style:'natural'},{cache});
  assert.ok(a2.cache);assert.equal(a2.ficha.id,a.ficha.id);
  c.set({takeId:'take-B'});const b=await nueva(c,vista('take-B'),{style:'natural'},{cache});assert.ok(!b.cache);assert.notEqual(b.ficha.id,a.ficha.id);assert.equal(cache.size,2);
  c.set({takeId:null});assert.equal((await nueva(c,vista(null),{style:'natural'},{cache})).motivo,'sin-toma');assert.equal(K.claveCache({viewId:'v'}),null);
  return {entradasCache:cache.size};});

 // ================================================ casos obligatorios (§3.4)
 await caso('K-04','Dos resultados sobre la misma toma','Ambos se conservan como variantes; la comparación dice misma toma y qué cambia',async()=>{
  const A=almacenes();const a=await nueva(ctx(),vista('take-A'),{style:'natural'}),b=await nueva(ctx(),vista('take-A'),{style:'warm',floor:'walnut'});
  for(const r of [a,b])assert.ok((await A.ad.conservar(r.ficha,r.datos)).ok);const cmp=K.comparar(a.ficha,b.ficha);
  assert.ok(cmp.mismaToma&&cmp.mismoOriginal&&!cmp.mismoResultado);assert.deepEqual(cmp.cambia,['style','floor']);
  const rec=await A.ad.recuperar({digest,actual:ctx().get()});assert.equal(rec.fichas.length,2);return {cmp,bytesGuardados:A.B.size};});
 await caso('K-05','Dos tomas diferentes con la misma geometría','El resultado de la toma A, íntegro, se marca «de una toma anterior» al verificar contra la toma B',async()=>{
  const v=await K.verificar(f1,{digest,leerBytes:async r=>Object.values(r1.datos).find((b,i)=>Object.values(f1.recursos)[i]?.storage.ref===r),actual:{...cx.get(),takeId:'take-B'}});
  assert.deepEqual([v.integridad,v.vigencia],['integro','toma-anterior']);return v;});
 await caso('K-06','Cambio de proyecto durante una operación','Proyecto o toma que cambian mientras el proveedor responde: se descarta, no se asigna',async()=>{
  const c=ctx(),d=deferred();const run=nueva(c,vista('take-A'),{style:'natural'},{proveedor:async()=>d.p});await new Promise(r=>setImmediate(r));
  c.set({projectId:'prj_otro',contentId:'f'.repeat(64)});d.res(await simulado({style:'natural'}));assert.equal((await run).motivo,'proyecto-cambiado');
  const c2=ctx(),d2=deferred();const run2=nueva(c2,vista('take-A'),{style:'natural'},{proveedor:async()=>d2.p});await new Promise(r=>setImmediate(r));c2.set({takeId:'take-B'});d2.res(await simulado({}));
  assert.equal((await run2).motivo,'toma-cambiada');});
 await caso('K-07','Respuestas asíncronas tardías','Una generación anterior que responde tarde se descarta y no ensucia la caché',async()=>{
  const g=K.generador(),c=ctx(),cache=new Map(),d1=deferred(),d2=deferred();let i=0;const prov=async()=>(++i===1?d1.p:d2.p);
  const t1=g.iniciar();const r1p=K.generar({vista:vista('take-A'),estilo:{style:'natural'}},depsDe(c,{proveedor:prov,cache}),t1,g);await new Promise(r=>setImmediate(r));
  const t2=g.iniciar();const r2p=K.generar({vista:vista('take-A'),estilo:{style:'warm'}},depsDe(c,{proveedor:prov,cache}),t2,g);await new Promise(r=>setImmediate(r));
  d2.res(await simulado({style:'warm'}));const r2=await r2p;d1.res(await simulado({style:'natural'}));const r1x=await r1p;
  assert.ok(r2.ok);assert.ok(['obsoleta','cancelada'].includes(r1x.motivo));assert.equal(cache.size,1);return {primera:r1x.motivo,segunda:'ok'};});
 const leer1=async r=>({[f1.recursos.original.storage.ref]:r1.datos.original,[f1.recursos.enviada.storage.ref]:r1.datos.enviada,[f1.recursos.resultado.storage.ref]:r1.datos.resultado})[r]||null;
 await caso('K-08','Cambio de revisión','Íntegro y desactualizado a la vez; reabrir no reasigna la ficha a la revisión posterior',async()=>{
  const antes=K.canon(f1);const v=await K.verificar(f1,{digest,leerBytes:leer1,actual:{...cx.get(),contentId:'a'.repeat(64),revision:4}});
  assert.deepEqual([v.integridad,v.vigencia],['integro','desactualizado']);assert.equal(K.canon(f1),antes);assert.equal(f1.sujeto.revision,3);return v;});
 await caso('K-09','Imagen original o resultado alterado','Bytes del original o del resultado alterados, o la ficha manipulada → «invalido»',async()=>{
  const out={};for(const k of ['original','resultado']){const ref=f1.recursos[k].storage.ref;const v=await K.verificar(f1,{digest,leerBytes:async r=>r===ref?Uint8Array.from(await leer1(r),(x,i)=>i===20?x^255:x):leer1(r)});assert.equal(v.integridad,'invalido',k);out[k]=v.motivos;}
  const m=clone(f1);m.estilo.style='premium';assert.deepEqual(await K.verificar(m,{digest,leerBytes:leer1}),{integridad:'invalido',vigencia:'sin-comprobar',motivos:['ficha-alterada']});return out;});
 await caso('K-10','Archivo ausente o corrupto','Ausente → «incompleto»; truncado → «invalido»; lectura que falla → «no comprobable»; registro ilegible → «documento-corrupto»',async()=>{
  const ref=f1.recursos.resultado.storage.ref;
  assert.equal((await K.verificar(f1,{digest,leerBytes:async r=>r===ref?null:leer1(r)})).integridad,'incompleto');
  assert.equal((await K.verificar(f1,{digest,leerBytes:async r=>r===ref?(await leer1(r)).slice(0,10):leer1(r)})).integridad,'invalido');
  assert.equal((await K.verificar(f1,{digest,leerBytes:async r=>{if(r===ref)throw new Error('io');return leer1(r);}})).integridad,'no-comprobable');
  const A=almacenes();A.proyecto.fijar({...clone(p0),extensions:{[K.EXT]:{version:9}}});assert.equal((await A.ad.recuperar({digest})).motivo,'documento-corrupto');assert.equal((await A.ad.conservar(f1,r1.datos)).motivo,'documento-corrupto');});
 await caso('K-11','Restauración con identificadores locales diferentes','Otro id de proyecto y otra revisión con el mismo trabajo → «vigente · restaurado»; la ficha no se reasigna',async()=>{
  const A=almacenes();assert.ok((await A.ad.conservar(f1,r1.datos)).ok);const restaurado={...clone(A.proyecto.leer()),id:'prj_restaurado'};A.proyecto.fijar(restaurado);
  const rec=await A.ad.recuperar({digest,actual:{projectId:'prj_restaurado',contentId:CID,revision:1,takeId:'take-A'}});
  assert.equal(rec.fichas[0].verificacion.vigencia,'vigente-restaurado');assert.equal(rec.fichas[0].idLocalDistinto,true);assert.equal(rec.fichas[0].ficha.sujeto.projectId,p0.id);return rec.fichas[0].verificacion;});
 await caso('K-12','Cuota agotada','Almacén lleno al conservar → «cuota», nada a medias; proveedor sin cuota → «cuota-proveedor», nada cobrado ni guardado',async()=>{
  const A=almacenes({putFalla:(r,size)=>size>=1?Object.assign(new Error('full'),{name:'QuotaExceededError'}):null});const r=await A.ad.conservar(f1,r1.datos);
  assert.equal(r.motivo,'cuota');assert.equal(A.B.size,0);assert.equal(A.proyecto.leer().extensions?.[K.EXT],undefined);
  const g=await nueva(ctx(),vista('take-A'),{style:'natural'},{proveedor:async()=>({error:'quota'})});assert.equal(g.motivo,'cuota-proveedor');return {retirados:r.retirados};});
 await caso('K-13','Fallo parcial de escritura simulada','Si el commit falla, se retiran SOLO los bytes nuevos de la operación y el proyecto no cambia',async()=>{
  const A=almacenes({commitFalla:new Error('commit')});const pre=K.REF+'preexistente';A.B.set(pre,new Uint8Array([1]));
  const r=await A.ad.conservar(f1,r1.datos);assert.equal(r.motivo,'fallo-escritura');assert.equal(r.retirados,3);assert.deepEqual([...A.B.keys()],[pre]);assert.equal(A.proyecto.leer().extensions?.[K.EXT],undefined);return {log:A.log};});
 await caso('K-14','Cancelación','Cancelar la generación (proveedor pendiente) o la conservación (antes del commit): «cancelada» y nada guardado',async()=>{
  const g=K.generador(),d=deferred();const t=g.iniciar();const run=K.generar({vista:vista('take-A'),estilo:{style:'natural'}},depsDe(ctx(),{proveedor:async()=>d.p}),t,g);await new Promise(r=>setImmediate(r));g.cancelar();d.res(await simulado({}));
  assert.equal((await run).motivo,'cancelada');
  const A=almacenes(),ac=new AbortController();const orig=A.bytes.put;A.bytes.put=async(r,b)=>{await orig(r,b);ac.abort();};
  const c=await A.ad.conservar(f1,r1.datos,{signal:ac.signal});assert.equal(c.motivo,'cancelada');assert.equal(A.B.size,0);assert.equal(A.proyecto.leer().extensions?.[K.EXT],undefined);});
 await caso('K-15','Duplicados','Conservar dos veces la misma ficha no duplica; bytes iguales entre fichas se guardan una vez (direccionados por contenido)',async()=>{
  const A=almacenes();assert.ok((await A.ad.conservar(f1,r1.datos)).ok);const d=await A.ad.conservar({...f1,id:'vr_otro'},r1.datos);assert.deepEqual([d.duplicado,d.id],[true,f1.id]);
  const otra=await nueva(ctx(),vista('take-A'),{style:'scandinavian'});assert.notEqual(otra.ficha.recursos.resultado.sha256,f1.recursos.original.sha256);const r=await A.ad.conservar(otra.ficha,otra.datos);assert.equal(r.escritos,1,'original y envío idénticos ya existían: solo el resultado es nuevo');
  return {fichas:Object.keys(A.proyecto.leer().extensions[K.EXT].results).length,bytes:A.B.size};});
 await caso('K-16','Datos de otro proyecto','Una ficha de otro proyecto no se conserva en este; una extensión copiada a otro trabajo se marca «de otro proyecto»',async()=>{
  const A=almacenes();A.proyecto.fijar({...clone(p0),id:'prj_B'});assert.equal((await A.ad.conservar(f1,r1.datos)).motivo,'otro-proyecto');
  const B=almacenes();await B.ad.conservar(f1,r1.datos);B.proyecto.fijar({...clone(B.proyecto.leer()),id:'prj_C'});
  const rec=await B.ad.recuperar({digest,actual:{projectId:'prj_C',contentId:'c'.repeat(64),revision:2,takeId:'take-Z'}});assert.equal(rec.fichas[0].verificacion.vigencia,'otro-proyecto');});
 const vok={integridad:'integro',vigencia:'vigente'};
 await caso('K-17','Permisos insuficientes','Un simulado no va a presentación; un derecho no concedido se rechaza; el almacén sin permiso → «permiso-almacen»',async()=>{
  assert.deepEqual(K.permitir(f1,'presentacion-orientativa',vok),{ok:false,motivo:'permiso-insuficiente'});
  await assert.rejects(K.crearResultado({...base(),derechos:{destinos:['entrega-orientativa']},enviada:{dataUrl:await convertir('x'),transformacion:'jpeg'}},{digest,nuevoId}),e=>e.code==='permiso-insuficiente');
  const A=almacenes({putFalla:()=>Object.assign(new Error('denied'),{name:'SecurityError'})});assert.equal((await A.ad.conservar(f1,r1.datos)).motivo,'permiso-almacen');
  assert.equal(K.permitir(f1,'estudio',{integridad:'incompleto'}).motivo,'no-integro');});
 await caso('K-18','Destinos de exportación desconocidos','Destino fuera de la lista cerrada → «destino-desconocido», al crear y al usar',async()=>{
  assert.deepEqual(K.permitir(f1,'redes-sociales',vok),{ok:false,motivo:'destino-desconocido'});
  await assert.rejects(K.crearResultado({...base(),derechos:{destinos:['imprenta']},enviada:{dataUrl:await convertir('x'),transformacion:'jpeg'}},{digest,nuevoId}),e=>e.code==='destino-desconocido');
  assert.deepEqual(K.permitir(f1,'comparacion',vok),{ok:true,rotulo:'simulado'});});

 // ================================================ recorrido, variantes y favoritos
 await caso('K-19','Variantes y favoritos','El favorito vive aparte: no cambia la huella de la ficha y no equivale a aceptación; un histórico íntegro puede estar desactualizado',async()=>{
  const A=almacenes();await A.ad.conservar(f1,r1.datos);const h=f1.huella;assert.ok((await A.ad.favorito(f1.id,true,{ahora:'2026-11-20T11:00:00.000Z'})).ok);
  const e=A.proyecto.leer().extensions[K.EXT];assert.equal(e.results[f1.id].huella,h);assert.match(e.favoritos[f1.id].nota,/no es una aceptación/);
  const rec=await A.ad.recuperar({digest,actual:{...cx.get(),contentId:'d'.repeat(64)}});assert.deepEqual([rec.fichas[0].favorito,rec.fichas[0].verificacion.integridad,rec.fichas[0].verificacion.vigencia],[true,'integro','desactualizado']);});
 await caso('K-20','Recorrido','Vista → resultado → ficha → conservación → recuperación tras «recargar» (adaptador nuevo sobre los mismos almacenes) → comparación',async()=>{
  const A=almacenes();const a=await nueva(ctx(),vista('take-A'),{style:'natural'}),b=await nueva(ctx(),vista('take-A'),{style:'scandinavian'});
  await A.ad.conservar(a.ficha,a.datos);await A.ad.conservar(b.ficha,b.datos);
  const recargado=K.adaptadorLaboratorio({bytes:A.bytes,proyecto:A.proyecto});const rec=await recargado.recuperar({digest,actual:ctx().get()});
  assert.equal(rec.fichas.length,2);for(const f of rec.fichas)assert.deepEqual([f.verificacion.integridad,f.verificacion.vigencia],['integro','vigente']);
  return {comparacion:K.comparar(rec.fichas[0].ficha,rec.fichas[1].ficha)};});
 await caso('K-21','Clases separadas','Vista real (sin envío ni resultado distinto), render IA (exige proveedor y envío) y simulado (solo «simulador-laboratorio») no se confunden',async()=>{
  const vr=await K.crearResultado({clase:'vista-real',sujeto:base().sujeto,toma:base().toma,original:{dataUrl:vista('x').dataUrl}},{digest,nuevoId});
  assert.equal(vr.recursos.enviada,null);assert.equal(vr.recursos.resultado.sha256,vr.recursos.original.sha256);assert.equal(vr.procedencia.proveedor,'rubik-vista-3d');
  await assert.rejects(K.crearResultado({...base(),procedencia:{},enviada:{dataUrl:await convertir('x'),transformacion:'jpeg'}},{digest,nuevoId}),e=>e.code==='procedencia-incompleta');
  await assert.rejects(K.crearResultado({...base(),clase:'simulado-laboratorio',enviada:{dataUrl:await convertir('x'),transformacion:'jpeg'}},{digest,nuevoId}),e=>e.code==='clase-incoherente');
  await assert.rejects(K.crearResultado({...base(),clase:'vista-real',enviada:{dataUrl:'data:image/png;base64,AA',transformacion:'x'}},{digest,nuevoId}),e=>e.code==='clase-incoherente');
  const ia=await K.crearResultado({...base(),procedencia:{proveedor:'openai',modelo:'gpt-image-1',consumo:{totalTokens:1200,falso:'x'},coste:{amount:0.04,currency:'USD'}},enviada:{dataUrl:await convertir('x'),transformacion:'jpeg'}},{digest,nuevoId});
  assert.deepEqual(ia.procedencia.consumo,{totalTokens:1200});assert.ok(!ia.noAcreditado.includes('coste'));return {vistaReal:vr.derechos.destinos,ia:ia.derechos.destinos,simulado:f1.derechos.destinos};});
 await caso('K-22','K11-C','Las referencias de bytes de la extensión son VIVAS para el recolector real (persistence-store.refsIn) sin cambiar sus reglas',async()=>{
  const A=almacenes();await A.ad.conservar(f1,r1.datos);const vivas=new Set();Persist.refsIn(JSON.stringify(A.proyecto.leer()),vivas);
  for(const k of ['original','enviada','resultado'])assert.ok(vivas.has(f1.recursos[k].storage.ref),k);return {vivas:[...vivas].filter(r=>r.startsWith(K.REF)).length};});
 await caso('K-23','UX','Textos ES/EN/ZH completos (causa, siguiente, alternativa, datos) y estados; sin respaldo silencioso',()=>{
  for(const [k,e] of Object.entries(K.T))for(const l of K.LANGS)assert.equal(e[l]?.length,4,k+'/'+l);for(const k of Object.keys(K.ESTADOS))for(const l of K.LANGS)assert.ok(K.estado(k,l));
  assert.throws(()=>K.texto('cuota','fr'));return {codigos:Object.keys(K.T).length};});
 await caso('K-24','Seguridad','Núcleo sin red, sin almacenamiento propio, sin IA real; ningún rechazo sin capturar',()=>{
  const src=fs.readFileSync(path.join(LAB,'k11/k11-core.js'),'utf8');for(const w of ['fetch(','XMLHttpRequest','localStorage','indexedDB','sessionStorage','api/render','WebSocket'])assert.ok(!src.includes(w),w);assert.equal(sinCapturar,0);});

 const pass=casos.filter(c=>c.resultado==='PASS').length;
 const o={schema:'rubik-lab-k11-qa/1',fecha:new Date().toISOString(),pin:pinSha,entorno:{node:process.version,plataforma:process.platform},resumen:`${pass}/${casos.length} PASS`,casos};
 fs.mkdirSync(path.dirname(OUT),{recursive:true});fs.writeFileSync(OUT,JSON.stringify(o,null,1)+'\n');console.log(o.resumen);for(const c of casos)if(c.resultado!=='PASS')console.log(c.id,c.error);
 process.exit(pass===casos.length?0:2);
})().catch(e=>{console.error(e);process.exit(1);});
