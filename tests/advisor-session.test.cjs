// api/advisor-session.js contra el simulador local del protocolo Nuance (tests/fixtures/nuance-mock.cjs). Sin red externa.
'use strict';
const {test,before,after}=require('node:test'),assert=require('node:assert/strict');
const {createHandler,clientTools}=require('../api/advisor-session.js');const M=require('./fixtures/nuance-mock.cjs');
const CODE='c'.repeat(40);let mock;
before(async()=>{mock=await M.start({});});after(async()=>{await mock.close();});
const ENV=over=>({RUBIK_ADVISOR_ENABLED:'1',VERCEL_ENV:'preview',RUBIK_ADVISOR_TOKEN:CODE,RUBIK_ADVISOR_NUANCE_KEY:mock.key,RUBIK_SPEND_STORE_URL:'http://store',RUBIK_SPEND_STORE_TOKEN:'x',
 RUBIK_ADVISOR_DAILY_STARTS:'5',RUBIK_ADVISOR_MAX_SESSION_SECONDS:'120',RUBIK_ADVISOR_TEST_API:mock.url,...over});
function call(h,body,{code=CODE,headers={}}={}){return new Promise(r=>{const res={headers:{},statusCode:0,setHeader(k,v){this.headers[k.toLowerCase()]=v;},end(s){r({status:this.statusCode,body:s?JSON.parse(s):null});}};
 h({method:'POST',headers:{'x-rubik-advisor-code':code,...headers},body},res);});}
const reset=()=>{mock.S.calls.length=0;mock.S.log.length=0;mock.S.fail={};mock.S.auth.length=0;mock.S.endStillActive=0;mock.S.delay={};mock.S.credits=100;for(const c of mock.S.convs.values()){c.status='ended';clearTimeout(c.timer);}};

test('cerrado por defecto: sin configuración, Production o código erróneo no se llama al proveedor',async()=>{reset();
 for(const env of [{},ENV({RUBIK_ADVISOR_ENABLED:'0'}),ENV({VERCEL_ENV:'production'}),ENV({RUBIK_ADVISOR_NUANCE_KEY:'sk_x'}),ENV({RUBIK_ADVISOR_TOKEN:'corto'})]){
  const r=await call(createHandler({env,store:M.memoryStore()}),{action:'start',mode:'cliente'});assert.equal(r.status,503);}
 const r=await call(createHandler({env:ENV(),store:M.memoryStore()}),{action:'start',mode:'cliente'},{code:'d'.repeat(40)});assert.equal(r.status,401);
 assert.equal((await call(createHandler({env:ENV(),store:M.memoryStore()}),{action:'start',mode:'tecnico'})).status,400,'solo modo cliente en el piloto');
 assert.deepEqual(mock.S.calls,[],'cero llamadas al proveedor');});

test('inicio controlado por el servidor: saldo → token (cámara apagada, 3 herramientas) → conversación con tope → acceso solo a esa',async()=>{reset();
 const h=createHandler({env:ENV(),store:M.memoryStore()}),r=await call(h,{action:'start',mode:'cliente'});
 assert.equal(r.status,201);assert.match(r.body.sessionToken,/^st_/);assert.equal(r.body.maxSessionSeconds,120);
 assert.deepEqual(mock.S.calls,['GET /usage','POST /session-tokens','POST /conversation'],'orden: saldo, token, conversación (todo en servidor)');
 const mint=mock.S.log[0].mint;assert.equal(mint.interface_setup.video.input.camera,false,'cámara del usuario desactivada');
 assert.deepEqual(mint.interface_setup.delegation.responses.tools.map(t=>t.name),['consultar_superficies','enfocar_estancia','continuar_por_texto']);
 assert.ok(mint.interface_setup.delegation.responses.tools.every(t=>t.annotations.readOnlyHint===true&&t.annotations.destructiveHint===false));
 assert.match(mint.end_user_id,/^op_[0-9a-f]{24}$/);assert.ok(!JSON.stringify(mint).includes(CODE),'el código del operador no viaja');
 const conv=mock.S.convs.get(r.body.conversationId);assert.equal(conv.max,120,'max_session_seconds aplicado al crear');
 assert.equal(mock.S.tokens.get(r.body.sessionToken).spent,true,'el navegador recibe un token YA gastado');
 // El token gastado no crea otra conversación (no puede saltarse el tope).
 const again=await fetch(mock.url+'/conversation',{method:'POST',headers:{Authorization:'Bearer '+r.body.sessionToken,'Content-Type':'application/json'},body:JSON.stringify({max_session_seconds:999999})});assert.equal(again.status,401);
 // Cierre desde servidor con Content-Length: 0; la sesión activa se libera y se puede volver a iniciar.
 const e=await call(h,{action:'end',conversationId:r.body.conversationId});assert.equal(e.status,200);assert.equal(conv.status,'ended');
 assert.equal((await call(h,{action:'start',mode:'cliente'})).status,201,'tras cerrar se puede iniciar otra');});

test('solicitudes simultáneas del mismo operador: una entra, la otra 409; cuota diaria y saldo',async()=>{reset();
 const store=M.memoryStore(),h=createHandler({env:ENV({RUBIK_ADVISOR_DAILY_STARTS:'2'}),store});
 const [a,b]=await Promise.all([call(h,{action:'start',mode:'cliente'}),call(h,{action:'start',mode:'cliente'})]);
 assert.deepEqual([a.status,b.status].sort(),[201,409]);const ok=a.status===201?a:b;
 await call(h,{action:'end',conversationId:ok.body.conversationId});
 const c=await call(h,{action:'start',mode:'cliente'});assert.equal(c.status,201);await call(h,{action:'end',conversationId:c.body.conversationId});
 assert.equal((await call(h,{action:'start',mode:'cliente'})).status,429,'tope diario de inicios');
 const h2=createHandler({env:ENV(),store:M.memoryStore()});mock.S.credits=0;const d=await call(h2,{action:'start',mode:'cliente'});assert.deepEqual([d.status,d.body.error],[429,'credits_spent']);
 mock.S.credits=100;assert.equal((await call(h2,{action:'start',mode:'cliente'})).status,201,'la reserva se liberó tras el rechazo');});

test('errores del proveedor se traducen y liberan la reserva',async()=>{
 for(const [route,status,code,expect] of [['/session-tokens',429,'start_limit','start_limit'],['/conversation',409,'concurrency_limit','concurrency_limit'],['/conversation',429,'capacity_unavailable','capacity_unavailable'],['/conversation',503,'unavailable','unavailable'],['/session-tokens',401,'api_key_revoked','invalid_credential']]){reset();
  const h=createHandler({env:ENV(),store:M.memoryStore()});mock.S.fail[route]={status,code,retry:status===429?7:undefined};
  const r=await call(h,{action:'start',mode:'cliente'});assert.equal(r.body.error,expect,`${route} ${status} ${code}`);
  assert.equal((await call(h,{action:'start',mode:'cliente'})).status,201,'reserva liberada');}});

test('abandono antes de empezar y cierre con Content-Length: 0',async()=>{reset();const h=createHandler({env:ENV(),store:M.memoryStore()});
 const r=await call(h,{action:'start',mode:'cliente'});const a=await call(h,{action:'abandon',conversationId:r.body.conversationId,sessionToken:r.body.sessionToken});assert.equal(a.status,200);
 assert.equal(mock.S.convs.get(r.body.conversationId).status,'ended');
 const raw=await fetch(mock.url+`/conversation/${r.body.conversationId}/end`,{method:'POST',headers:{Authorization:'Bearer '+mock.key,'Content-Type':'application/json'},body:'{}'});assert.equal(raw.status,411,'sin Content-Length: 0 el protocolo responde 411');
 assert.equal(clientTools().length<=16,true);});

// ── Cierre del adaptador (encargo 89bae1ff §2) ──
const live=async h=>{const r=await call(h,{action:'start',mode:'cliente'});assert.equal(r.status,201);return r.body;};
test('credenciales como el proveedor: /abandon con token de sesión y /end con clave de servidor; el simulador rechaza las cruzadas',async()=>{reset();
 const h=createHandler({env:ENV(),store:M.memoryStore()}),b=await live(h);
 const id=b.conversationId,post=(path,auth)=>fetch(mock.url+`/conversation/${id}/${path}`,{method:'POST',headers:{Authorization:'Bearer '+auth,'Content-Length':'0'}});
 assert.equal((await post('abandon',mock.key)).status,401,'/abandon no acepta la clave de servidor');
 assert.equal((await post('end',b.sessionToken)).status,403,'/end no acepta el token de sesión');
 assert.equal((await call(h,{action:'abandon',conversationId:id})).status,400,'sin token de sesión no hay abandono');
 mock.S.auth.length=0;const a=await call(h,{action:'abandon',conversationId:id,sessionToken:b.sessionToken});assert.equal(a.status,200);assert.equal(a.body.ended,true);
 assert.deepEqual(mock.S.auth.map(x=>x.path+' '+x.cred),['/conversation/{id}/abandon st','/conversation/{id}/end nk'],'abandono con st_ y confirmación terminal con nk_');
 assert.equal((await call(h,{action:'start',mode:'cliente'})).status,201,'bloqueo liberado tras estado terminal');});

test('/end con 200 y conversación aún activa: el bloqueo se mantiene hasta confirmar estado terminal',async()=>{reset();
 const store=M.memoryStore(),h=createHandler({env:ENV(),store}),b=await live(h);
 mock.S.endStillActive=5;const e=await call(h,{action:'end',conversationId:b.conversationId});
 assert.equal(e.body.ended,false);assert.equal(e.body.pending,true);assert.equal(e.body.status,'connected');
 assert.equal((await call(h,{action:'start',mode:'cliente'})).status,409,'sin confirmación no se libera la sesión');
 mock.S.endStillActive=0;const e2=await call(h,{action:'end',conversationId:b.conversationId});assert.equal(e2.body.ended,true,'el reintento confirma');
 assert.equal((await call(h,{action:'start',mode:'cliente'})).status,201);});

test('cierre rechazado y pérdida de conexión: no se libera; el reintento reconcilia',async()=>{reset();
 const store=M.memoryStore(),h=createHandler({env:ENV(),store}),b=await live(h);
 mock.S.fail['/conversation/{id}/end']={status:503,code:'unavailable',persist:true};
 const e=await call(h,{action:'end',conversationId:b.conversationId});assert.equal(e.status,503);assert.equal(e.body.pending,true);
 const cut=createHandler({env:ENV(),store,fetch:async()=>{throw Error('ECONNRESET');}});
 const e2=await call(cut,{action:'end',conversationId:b.conversationId});assert.equal(e2.body.ended,false,'pérdida de conexión: pendiente');
 assert.equal((await call(h,{action:'start',mode:'cliente'})).status,409,'sigue bloqueada');
 delete mock.S.fail['/conversation/{id}/end'];assert.equal((await call(h,{action:'end',conversationId:b.conversationId})).body.ended,true);
 assert.equal((await call(h,{action:'start',mode:'cliente'})).status,201);});

test('cancelación que coincide con el arranque: el servidor cierra la conversación recién creada y no entrega acceso',async()=>{reset();
 const h=createHandler({env:ENV(),store:M.memoryStore()});mock.S.delay['/conversation']=300;
 const starting=call(h,{action:'start',mode:'cliente'});await new Promise(r=>setTimeout(r,120));
 const c=await call(h,{action:'abandon'});assert.equal(c.status,202);assert.equal(c.body.cancelled,true);
 const r=await starting;assert.equal(r.status,409);assert.equal(r.body.error,'cancelled');assert.equal(r.body.sessionToken,undefined,'sin token para el navegador');
 assert.ok([...mock.S.convs.values()].every(x=>x.status==='ended'),'la conversación creada quedó cerrada');
 assert.ok(mock.S.auth.some(x=>x.path==='/conversation/{id}/end'&&x.cred==='nk'));
 mock.S.delay={};assert.equal((await call(h,{action:'start',mode:'cliente'})).status,201,'bloqueo liberado');});

test('instrucciones y descripciones al proveedor en inglés',async()=>{reset();const h=createHandler({env:ENV(),store:M.memoryStore()});await live(h);
 const mint=mock.S.log[0].mint;const txt=mint.personality.system_prompt+' '+mint.interface_setup.delegation.responses.tools.map(t=>t.description).join(' ');
 assert.match(mint.personality.system_prompt,/^You are "RUBIK Advisor"/);assert.doesNotMatch(txt,/[áéíóúñ¿¡]/i,'sin texto en español hacia Nuance');});
