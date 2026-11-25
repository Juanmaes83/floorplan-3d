// Asesor RUBIK · ADAPTADOR NUANCE LIVE contra el simulador LOCAL del protocolo (tests/fixtures/nuance-mock.cjs).
// Chromium + Playwright en 1440x900 y 390x844 (táctil), con micrófono falso del navegador. Comprueba: inicio por gesto,
// servidor que crea la conversación con tope, eventos y sala, micrófono con cancelación de eco y SIN cámara, vídeo y audio
// del avatar, subtítulos, herramientas (permitida y rechazada), traspaso a texto sin ampliar acceso, cuota y errores,
// cancelación durante la conexión, cierre con limpieza, y cero tráfico al proveedor real (y al simulador en modo simulado).
// Lo que NO se prueba aquí: WebRTC/LiveKit real, audio y vídeo reales del proveedor y su facturación (ensayo autorizado).
'use strict';
const {test,before,after}=require('node:test'),assert=require('node:assert/strict');
const path=require('node:path'),fs=require('node:fs'),{createServer}=require('node:http'),{chromium}=require('playwright');
const M=require('./fixtures/nuance-mock.cjs'),{createHandler}=require('../api/advisor-session.js');
const root=path.resolve(__dirname,'..'),shots=process.env.ASESOR_SHOTS||path.join(root,'docs/qa/asesor-rubik/capturas-live');
const TYPES={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.woff2':'font/woff2'};
const CODE='o'.repeat(40);let server,browser,url,mock,store;
before(async()=>{mock=await M.start({concurrency:5});store=M.memoryStore();
 const env={RUBIK_ADVISOR_ENABLED:'1',VERCEL_ENV:'preview',RUBIK_ADVISOR_TOKEN:CODE,RUBIK_ADVISOR_NUANCE_KEY:mock.key,RUBIK_SPEND_STORE_URL:'http://store',RUBIK_SPEND_STORE_TOKEN:'x',RUBIK_ADVISOR_DAILY_STARTS:'200',RUBIK_ADVISOR_MAX_SESSION_SECONDS:'60',RUBIK_ADVISOR_TEST_API:mock.url};
 const api=createHandler({env,store});
 server=createServer((req,res)=>{const u=decodeURIComponent(new URL(req.url,'http://l').pathname);if(u==='/api/advisor-session')return api(req,res);
  try{const file=path.resolve(root,'.'+(u.endsWith('/')?u+'index.html':u));if(!file.startsWith(root+path.sep))throw 0;res.setHeader('Content-Type',TYPES[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));}catch{res.statusCode=404;res.end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));url=`http://127.0.0.1:${server.address().port}/labs/asesor-rubik/`;
 browser=await chromium.launch({executablePath:process.env.CHROME||undefined,args:['--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream','--autoplay-policy=no-user-gesture-required']});fs.mkdirSync(shots,{recursive:true});});
after(async()=>{await browser?.close();await new Promise(r=>server?.close(r));await mock?.close();});

for(const [viewport,touch] of [[{width:1440,height:900},false],[{width:390,height:844},true]])
test(`Nuance Live (simulador del protocolo) ${viewport.width}x${viewport.height}`,{timeout:300000},async t=>{
 const name=`${viewport.width}x${viewport.height}`;
 const context=await browser.newContext({viewport,isMobile:touch,hasTouch:touch,permissions:['microphone']});t.after(()=>context.close());
 const page=await context.newPage(),errors=[],requests=[];page.on('pageerror',e=>errors.push(e.message));context.on('request',r=>requests.push(r.url()));
 await context.route('https://cdn.jsdelivr.net/**',r=>r.abort());
 const press=async sel=>{const l=page.locator(sel).first();await l.scrollIntoViewIfNeeded();touch?await l.tap():await l.click();await page.waitForTimeout(120);};
 const frame=()=>page.frame({url:/index\.html/}),project=()=>frame().evaluate(()=>JSON.stringify(FloorPlanApp.project));
 // Registro de getUserMedia: qué se pide (audio con cancelación de eco, nunca vídeo).
 await page.addInitScript(()=>{window.__gum=[];const o=navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);navigator.mediaDevices.getUserMedia=c=>{window.__gum.push(JSON.parse(JSON.stringify(c)));return o(c);};});
 await page.goto(url+'?mock-provider=1');await page.waitForFunction(()=>document.body.dataset.ready==='1',null,{timeout:60000});
 await page.selectOption('#transport','live');await page.fill('#opCode',CODE);
 const sim=()=>page.evaluate(()=>{const s=AsesorLab.sim;return s&&{state:s.state,conv:s.conv,resources:s.resources,mic:s.mic?s.mic.getAudioTracks().map(t=>({ready:t.readyState,echo:t.getSettings().echoCancellation})):null};});

 // 1 · Sin gesto no se inicia; con clic: servidor → conversación con tope → eventos → sala → «started».
 assert.equal(await page.evaluate(()=>new AsesorNuance.NuanceLiveAdapter({rubik:AsesorLab.rubik,mode:'cliente'}).start({isTrusted:false})),false);
 const before0=mock.S.convs.size;await press('#start');
 await page.waitForFunction(()=>AsesorLab.sim?.state==='live',null,{timeout:20000});
 const s1=await sim();assert.equal(mock.S.convs.size,before0+1);const conv=mock.S.convs.get(s1.conv);
 assert.equal(conv.max,60,'la conversación la creó el servidor con max_session_seconds');
 assert.equal(conv.setup.interface_setup.video.input.camera,false,'cámara del usuario desactivada en el token');
 const gum=await page.evaluate(()=>window.__gum);assert.equal(gum.length,1);assert.equal(gum[0].video,false,'no se pide cámara');assert.equal(gum[0].audio.echoCancellation,true,'micrófono con cancelación de eco');
 assert.equal(s1.mic[0].echo,true,'la pista del micrófono tiene la cancelación de eco activa');
 await page.waitForFunction(()=>/una IA/.test(document.querySelector('#subtitle').textContent),null,{timeout:10000});
 await page.waitForFunction(()=>{const v=document.querySelector('#avatarVideo');return !!v.srcObject&&v.srcObject.getVideoTracks().length===1;});
 assert.equal(await page.evaluate(()=>document.querySelector('#avatarAudio').srcObject?.getAudioTracks().length),1,'audio del avatar conectado');
 assert.match(await page.locator('#log').textContent(),/tope 60 s/);await page.screenshot({path:path.join(shots,`${name}-01-conectado.png`)});

 // 2 · Herramienta permitida pedida por la persona del proveedor (delegación) → resultado real de RUBIK por el topic.
 const before=await project();
 await fetch(`${mock.url}/mock-control/${s1.conv}/tool`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:'consultar_superficies',said:'¿Cuántos metros tiene?'})});
 await page.locator('#results table').waitFor({timeout:10000});
 await page.waitForFunction(id=>true,null);await page.waitForTimeout(400);
 const out=conv.fromClient.filter(e=>e.type==='response.item.create').map(e=>JSON.parse(e.item.output));assert.ok(out[0].totalM2>80,'function_call_output con la superficie real');
 assert.ok(conv.fromClient.some(e=>e.type==='response.create'),'response.create tras el resultado');
 await page.waitForFunction(()=>/Hecho/.test(document.querySelector('#subtitle').textContent),null,{timeout:10000});
 // 3 · Enfocar estancia por delegación.
 await fetch(`${mock.url}/mock-control/${s1.conv}/tool`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:'enfocar_estancia',arguments:{roomName:'Salón'}})});
 await page.waitForFunction(()=>/Salón seleccionada/.test(document.querySelector('#results').textContent),null,{timeout:10000});
 // 4 · Acción NO permitida en modo cliente (aunque el proveedor la pidiera): rechazo visible y proyecto idéntico.
 for(const toolName of ['resumen_presupuesto','proponer_cambio_suelo','publicar_enlace','borrar_todo']){
  await page.evaluate(()=>document.querySelector('#results').replaceChildren());
  await fetch(`${mock.url}/mock-control/${s1.conv}/tool`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:toolName,arguments:{roomName:'Salón',materialId:'x'}})});
  await page.locator('#results .denied').waitFor({timeout:10000});
  assert.match(await page.locator('#results .denied').getAttribute('data-denied'),/not_allowed_in_mode|unknown_tool/,`${toolName} rechazada`);
  const last=JSON.parse(conv.fromClient.filter(e=>e.type==='response.item.create').at(-1).item.output);assert.ok(last.error,'el proveedor recibe un error, no datos');}
 assert.equal(await project(),before,'el proyecto queda idéntico');
 await page.screenshot({path:path.join(shots,`${name}-02-rechazo.png`)});
 // 5 · Continuar por texto (por delegación): sigue en el asesor; NO abre el Asistente completo (costes internos).
 await fetch(`${mock.url}/mock-control/${s1.conv}/tool`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:'continuar_por_texto'})});
 await page.waitForFunction(()=>/Por texto con el asesor/.test(document.querySelector('#state').textContent),null,{timeout:10000});
 assert.equal(await frame().evaluate(()=>RubikAssistantUI.state.open),false,'no se abre el Asistente completo de RUBIK');
 await page.waitForFunction(id=>true,null);await page.waitForTimeout(600);
 assert.equal(conv.status,'ended','pasar a texto cierra la conversación de voz en el servidor');
 const s2=await sim();assert.equal(s2.resources,0,'recursos liberados');
 assert.equal(await page.evaluate(()=>document.querySelector('#avatarVideo').srcObject),null,'vídeo del avatar soltado');

 // 6 · Cancelación DURANTE la conexión: abandono en servidor, micrófono detenido, sin sesión activa colgada.
 await press('#start');await page.waitForFunction(()=>AsesorLab.sim?.conv,null,{timeout:10000});
 const s3=await sim();await press('#close');await page.waitForTimeout(800);
 assert.equal(mock.S.convs.get(s3.conv).status,'ended','cancelar durante la conexión abandona/cierra la conversación');
 assert.equal((await sim()).resources,0);
 assert.ok(mock.S.calls.some(c=>c==='POST /conversation/'+s3.conv+'/abandon'||c==='POST /conversation/'+s3.conv+'/end'));
 // 7 · Cuota y errores del proveedor: mensaje y alternativa por texto; reserva liberada (se puede volver a iniciar).
 for(const [route,status,code,re] of [['/conversation',429,'credits_spent',/saldo/],['/conversation',409,'concurrency_limit',/otra conversación/],['/conversation',429,'capacity_unavailable',/capacidad/],['/session-tokens',503,'unavailable',/no está disponible/]]){
  mock.S.fail[route]={status,code,retry:status===429?5:undefined};await press('#start');await page.locator('#error:not([hidden])').waitFor({timeout:10000});
  assert.match(await page.locator('#errorMsg').textContent(),re,code);assert.equal(await page.locator('#errToText').isVisible(),true);assert.equal((await sim()).resources,0,code+': recursos liberados');}
 await press('#start');await page.waitForFunction(()=>AsesorLab.sim?.state==='live',null,{timeout:20000});
 // 8 · Cierre en vivo: session.close + cierre de servidor; micrófono y sala liberados; foco a «Iniciar».
 const s4=await sim();await press('#close');await page.waitForTimeout(800);
 assert.equal(mock.S.convs.get(s4.conv).status,'ended');assert.equal((await sim()).resources,0);
 assert.equal(await page.evaluate(()=>document.activeElement?.id),'start');
 await page.screenshot({path:path.join(shots,`${name}-03-cerrado.png`)});
 // 9 · Cero tráfico al proveedor real: todo va a 127.0.0.1 (laboratorio + simulador).
 const real=requests.filter(u=>{try{return /nuancelabs\.ai|livekit\.cloud/i.test(new URL(u).host);}catch{return false;}});assert.deepEqual(real,[],'cero peticiones al proveedor real');
 fs.writeFileSync(path.join(shots,`${name}-red.json`),JSON.stringify({total:requests.length,proveedorReal:real.length,hosts:[...new Set(requests.map(u=>{try{return new URL(u).host;}catch{return 'otro';}}))]},null,1));
 assert.deepEqual(errors,[]);
});

test('modo simulado: cero peticiones al simulador del proveedor y al servidor de voz',{timeout:120000},async t=>{
 const context=await browser.newContext({viewport:{width:1440,height:900}});t.after(()=>context.close());const page=await context.newPage(),req=[];context.on('request',r=>req.push(r.url()));
 await context.route('https://cdn.jsdelivr.net/**',r=>r.abort());await page.goto(url);await page.waitForFunction(()=>document.body.dataset.ready==='1',null,{timeout:60000});
 const n=mock.S.calls.length;await page.click('#start');await page.waitForFunction(()=>AsesorLab.sim?.state==='live');await page.click('#chips .chip[data-say*="metros"]');await page.locator('#results table').waitFor();await page.click('#close');
 assert.equal(mock.S.calls.length,n,'el simulador del proveedor no recibe nada');assert.deepEqual(req.filter(u=>/\/api\/advisor-session|nuancelabs|mock-room/.test(u)),[]);});
