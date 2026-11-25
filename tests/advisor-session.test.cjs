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
const reset=()=>{mock.S.calls.length=0;mock.S.log.length=0;mock.S.fail={};mock.S.credits=100;for(const c of mock.S.convs.values()){c.status='ended';clearTimeout(c.timer);}};

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
 const r=await call(h,{action:'start',mode:'cliente'});const a=await call(h,{action:'abandon',conversationId:r.body.conversationId});assert.equal(a.status,200);
 assert.equal(mock.S.convs.get(r.body.conversationId).status,'ended');
 const raw=await fetch(mock.url+`/conversation/${r.body.conversationId}/end`,{method:'POST',headers:{Authorization:'Bearer '+mock.key,'Content-Type':'application/json'},body:'{}'});assert.equal(raw.status,411,'sin Content-Length: 0 el protocolo responde 411');
 assert.equal(clientTools().length<=16,true);});
