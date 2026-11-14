'use strict';
/* FOT-01 · cliente del contrato photo-reform/1 (js/photo-reform-provider.js), SIN ACTIVAR en el producto. El adaptador
   de servidor (serverAdapter, mismo origen, sin secretos del proveedor) se prueba aquí contra un servidor LOCAL simulado
   (127.0.0.1) que imita /api/photo-reform: ninguna llamada sale de la máquina, no hay claves reales ni gasto. El
   servidor real se prueba en tests/photo-reform-api.test.cjs. El «proveedor de prueba» es un doble de prueba. */
const test=require('node:test'),assert=require('node:assert/strict');
const http=require('node:http');
const P=require('../js/photo-reform-provider.js'),C=require('../js/photo-reform-core.js');

const JPEG=Buffer.concat([Buffer.from([0xff,0xd8,0xff,0xe0,0,16,74,70,73,70,0,1]),Buffer.alloc(64,7)]);
const PNG=Buffer.concat([Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a,0,0,0,13]),Buffer.alloc(64,3)]);
const req=n=>C.request({image:{mediaType:'image/jpeg',width:1600,height:1200,bytes:JPEG.length},intent:'floor',finish:'walnut',alternatives:n}).request;
const image=()=>new Blob([JPEG],{type:'image/jpeg'});
const ok=(alts,cost={amount:0.08,currency:'USD'})=>({version:1,provider:{id:'proveedor-prueba',name:'Proveedor de prueba'},cost,alternatives:alts});

// Servidor local que imita /api/photo-reform: «quote» responde una estimación; «generate» lo decide cada prueba.
const CODE='codigo-de-acceso-de-prueba-0123456789';
const QUOTE={version:1,contract:'photo-reform/1',confirmationId:'nonce-de-prueba-0001.1999999999999.'+'s'.repeat(43),expiresAt:'2026-11-14T15:10:00.000Z',provider:{id:'proveedor-prueba',name:'Proveedor de prueba'},model:'modelo-prueba',
 estimate:{amount:0.08,currency:'USD',basis:'price-per-image-env',priceDate:'2026-11-14',outputs:1},budget:{capUsd:0.5,maxOutputs:4,spentUsd:0,outputsUsed:0}};
async function mock(handler,{quote=(res)=>json(res,200,QUOTE)}={}){
 const seen=[];
 const server=http.createServer(async(r,res)=>{
  const chunks=[];for await(const c of r)chunks.push(c);let body=null;try{body=JSON.parse(Buffer.concat(chunks).toString());}catch{}
  seen.push({url:r.url,headers:r.headers,body});if(body?.action==='quote')return quote(res,body);await handler(res,body);
 });
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 return {origin:`http://127.0.0.1:${server.address().port}`,seen,close:()=>new Promise(r=>server.close(r))};
}
const adapter=(s,{confirm=async()=>true}={})=>P.serverAdapter({accessCode:CODE,origin:s.origin,confirm});
const json=(res,status,obj)=>{res.writeHead(status,{'content-type':'application/json'});res.end(typeof obj==='string'?obj:JSON.stringify(obj));};

test('configuración de este despliegue: sin proveedor; la puerta real sigue cerrada con sus cuatro motivos', () => {
  const cfg=P.config();assert.equal(cfg.configured,false);assert.equal(cfg.authorized,false);assert.equal(cfg.endpoint,null);assert.ok(Object.isFrozen(cfg));
  const g=C.gate({mode:'real',consent:true,provider:cfg,governance:cfg.governance});
  assert.equal(g.allowed,false);assert.equal(g.reasons.length,4);
  assert.equal(P.httpAdapter,undefined,'el antiguo adaptador con Bearer desde el navegador ya no existe');
  assert.throws(()=>P.serverAdapter({accessCode:'corto',confirm:()=>true,origin:'https://rubik.test'}),/código de acceso/);
  assert.throws(()=>P.serverAdapter({accessCode:CODE,origin:'https://rubik.test'}),/confirmación de gasto/);
  assert.equal(P.ENDPOINT,'/api/photo-reform');
});

test('envío: mismo origen, sin secretos del proveedor; solo la solicitud cerrada y la imagen recomprimida; presupuesto confirmado antes de generar', async () => {
  const s=await mock((res)=>json(res,200,ok([{index:0,mediaType:'image/jpeg',data:JPEG.toString('base64')},{index:1,mediaType:'image/png',data:PNG.toString('base64')}])));
  try{
    const items=[],quotes=[];const a=adapter(s,{confirm:async q=>{quotes.push(q);return true;}});
    const out=await a.run(req(2),image(),{onItem:(i,r)=>items.push([i,r])});
    assert.equal(out.ok,true);assert.equal(out.count,2);assert.equal(quotes.length,1);assert.equal(quotes[0].estimate.amount,0.08);
    assert.deepEqual(s.seen.map(x=>[x.url,x.body.action]),[['/api/photo-reform','quote'],['/api/photo-reform','generate']]);
    for(const {headers} of s.seen){assert.equal(headers.authorization,undefined,'nunca Authorization desde el navegador');assert.equal(headers['x-rubik-render-token'],undefined);
      assert.equal(headers['x-rubik-photo-reform-token'],CODE);assert.equal(headers['x-rubik-contract'],'photo-reform/1');assert.match(headers['content-type'],/^application\/json/);}
    const [q,g]=s.seen.map(x=>x.body);
    assert.deepEqual(Object.keys(q).sort(),['action','imageBytes','imageSha256','request']);assert.deepEqual(q.request,{version:1,intent:'floor',finish:'walnut',alternatives:2});
    assert.equal(q.imageSha256,require('node:crypto').createHash('sha256').update(JPEG).digest('hex'));assert.equal(q.imageBytes,JPEG.length);
    assert.deepEqual(Object.keys(g).sort(),['action','confirmationId','idempotencyKey','image','request']);assert.equal(g.confirmationId,QUOTE.confirmationId);assert.match(g.idempotencyKey,/^[A-Za-z0-9_-]{16,64}$/);
    assert.equal(g.image,'data:image/jpeg;base64,'+JPEG.toString('base64'));
    assert.doesNotMatch(JSON.stringify(s.seen.map(x=>x.body)),/width|height|metadata|IMG_|exif|project/i,'ni metadatos, ni nombre, ni proyecto');
    // Resultado GENERADO (doble de prueba): rótulo con el proveedor, coste solo el informado, descargable.
    assert.deepEqual(items.map(([i,r])=>[i,r.kind,r.mediaType]),[[0,'generated','image/jpeg'],[1,'generated','image/png']]);
    const l=C.label({kind:'generated',provider:items[0][1].provider,cost:items[0][1].cost});
    assert.equal(l.badge,'Imagen generada por IA (Proveedor de prueba) · ilustrativa, no medible');
    assert.equal(l.costText,'Coste informado por el proveedor: 0.08 USD.');assert.equal(l.downloadable,true);
    assert.equal(C.label({kind:'generated',provider:{name:'X'},cost:null}).costText,'Coste: desconocido (el proveedor no lo ha informado).','sin cifra no se inventa');
    // Si la persona no confirma el gasto estimado, no se envía la imagen.
    const n=s.seen.length;const no=await adapter(s,{confirm:async()=>false}).run(req(1),image(),{});
    assert.equal(no.reason,'not-confirmed');assert.deepEqual(s.seen.slice(n).map(x=>x.body.action),['quote']);
  }finally{await s.close();}
});

test('errores del proveedor: saldo, límite, desactivado, autorización y error interno; nunca hay imagen', async () => {
  for(const [status,reason] of [[402,'budget'],[409,'confirmation'],[429,'limit'],[503,'disabled'],[401,'unauthorized'],[500,'provider-error'],[502,'provider-error']]){
    const s=await mock(res=>json(res,status,{error:'budget-exceeded'}));
    try{const items=[];const out=await adapter(s).run(req(1),image(),{onItem:(...a)=>items.push(a)});
      assert.equal(out.ok,false);assert.equal(out.reason,reason,String(status));assert.equal(items.length,0);assert.equal(out.code,'budget-exceeded');}
    finally{await s.close();}
  }
  // El servidor cerrado (503) ya en el presupuesto: no se llega a generar.
  const s=await mock(()=>assert.fail('no debe generar'),{quote:res=>json(res,503,{error:'budget-not-approved'})});
  try{const out=await adapter(s).run(req(1),image(),{});assert.equal(out.reason,'disabled');assert.equal(out.code,'budget-not-approved');assert.equal(s.seen.length,1);}finally{await s.close();}
});

test('respuestas que no cumplen el contrato se descartan: nada se muestra ni se inventa', async () => {
  const good={index:0,mediaType:'image/jpeg',data:JPEG.toString('base64')};
  const bad=[
    'esto no es JSON',
    {...ok([good]),extra:1},
    {...ok([good]),version:2},
    ok([{...good,mediaType:'image/png'}]),                       // los bytes no son PNG
    ok([good,{...good,index:1}]),                                 // más alternativas de las pedidas (1)
    ok([{...good,index:3}]),
    ok([good],{amount:-1,currency:'USD'}),
    ok([good],{amount:1,currency:'BTC'}),
    {...ok([good]),provider:{id:'Mal Nombre',name:'x'}},
    ok([{...good,data:'%%%'}]),
    ok([]),
  ];
  for(const body of bad){
    const s=await mock(res=>json(res,200,body));
    try{const items=[];const out=await adapter(s).run(req(1),image(),{onItem:(...a)=>items.push(a)});
      assert.equal(out.ok,false,JSON.stringify(body).slice(0,80));assert.equal(out.reason,'invalid-response');assert.equal(items.length,0);}
    finally{await s.close();}
  }
  assert.equal(P.validateResponse(ok([good]),req(1)).ok,true);
});

test('cancelar a mitad: la petición se aborta y no llega ningún resultado', async () => {
  const s=await mock(async res=>{await new Promise(r=>setTimeout(r,1500));json(res,200,ok([{index:0,mediaType:'image/jpeg',data:JPEG.toString('base64')}]));});
  try{
    const ctl=new AbortController(),items=[];setTimeout(()=>ctl.abort(),200);
    await assert.rejects(adapter(s).run(req(1),image(),{signal:ctl.signal,onItem:(...a)=>items.push(a)}),e=>e.name==='AbortError');
    assert.equal(items.length,0);
  }finally{await s.close();}
});

test('sin red: un endpoint que no responde es «network», no un resultado', async () => {
  const a=P.serverAdapter({accessCode:CODE,origin:'http://127.0.0.1:9',confirm:async()=>true});
  const out=await a.run(req(1),image(),{});
  assert.equal(out.ok,false);assert.equal(out.reason,'network');
  assert.equal((await a.run(req(1),new Blob(['x'],{type:'text/plain'}),{})).reason,'bad-request');
  assert.equal((await a.run(req(1),new Blob([PNG],{type:'image/jpeg'}),{})).reason,'bad-request','el tipo declarado no coincide con los bytes');
});

test('trazabilidad: campos cerrados; nunca nombre de archivo, contenido ni texto libre', () => {
  let t=C.trace([], 'photo-accepted',{widthPx:1600,heightPx:1200},new Date('2026-11-14T10:00:00Z'));
  t=C.trace(t,'intent-set',{intent:'floor',finish:'walnut',alternatives:3});
  t=C.trace(t,'run-started',{mode:'simulated',adapter:'simulated-local',intent:'floor',finish:'walnut',alternatives:3});
  t=C.trace(t,'item-error',{index:1,reason:'provider-error'});
  assert.deepEqual(t[0],{at:'2026-11-14T10:00:00.000Z',event:'photo-accepted',widthPx:1600,heightPx:1200});
  for(const [ev,data] of [['photo-accepted',{fileName:'IMG_1.jpg'}],['intent-set',{intent:'derribar tabique'}],['item-error',{reason:'Texto libre con espacios'}],['inventado',{}],['photo-accepted',{data:'base64...'}]])
    assert.throws(()=>C.trace(t,ev,data),/traza/);
  let big=[];for(let i=0;i<260;i++)big=C.trace(big,'gate-blocked',{mode:'real'});assert.equal(big.length,200,'acotada');
});
