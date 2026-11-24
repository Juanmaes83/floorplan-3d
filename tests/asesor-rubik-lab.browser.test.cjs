// Asesor RUBIK en vivo · LABORATORIO SIMULADO (labs/asesor-rubik/). Chromium + Playwright en 1440x900 y 390x844 (táctil).
// Todo resultado aquí es SIMULADO salvo las lecturas y la vista de RUBIK, que son las del producto real (iframe).
// Comprueba: inicio solo por gesto, tres recorridos reales (superficies, enfocar estancia, pasar a texto), rechazo en modo
// cliente con proyecto idéntico, propuesta técnica sin escritura, errores del proveedor sin reintento automático,
// desvinculación al cambiar de proyecto, cierre que libera recursos, foco y mensajes, y CERO peticiones a Nuance.
'use strict';
const {test,before,after}=require('node:test'),assert=require('node:assert/strict');
const path=require('node:path'),fs=require('node:fs'),{createServer}=require('node:http'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),shots=process.env.ASESOR_SHOTS||path.join(root,'docs/qa/asesor-rubik/capturas');
const TYPES={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.woff2':'font/woff2'};
let server,browser,url;
before(async()=>{server=createServer((req,res)=>{try{const u=decodeURIComponent(new URL(req.url,'http://l').pathname),file=path.resolve(root,'.'+(u.endsWith('/')?u+'index.html':u));if(!file.startsWith(root+path.sep))throw 0;res.setHeader('Content-Type',TYPES[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));}catch{res.statusCode=404;res.end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));url=`http://127.0.0.1:${server.address().port}/labs/asesor-rubik/`;
 browser=await chromium.launch({executablePath:process.env.CHROME||undefined});fs.mkdirSync(shots,{recursive:true});});
after(async()=>{await browser?.close();await new Promise(r=>server?.close(r));});

for(const [viewport,touch] of [[{width:1440,height:900},false],[{width:390,height:844},true]])
test(`Asesor RUBIK · laboratorio simulado ${viewport.width}x${viewport.height}`,{timeout:240000},async t=>{
 const name=`${viewport.width}x${viewport.height}`;
 const context=await browser.newContext({viewport,isMobile:touch,hasTouch:touch});t.after(()=>context.close());
 const page=await context.newPage(),errors=[],requests=[];
 page.on('pageerror',e=>errors.push(e.message));context.on('request',r=>requests.push(r.url()));
 await context.route('https://cdn.jsdelivr.net/**',r=>r.abort());
 const press=async sel=>{const l=page.locator(sel).first();await l.scrollIntoViewIfNeeded();touch?await l.tap():await l.click();await page.waitForTimeout(150);};
 const frame=()=>page.frame({url:/index\.html/});
 const project=()=>frame().evaluate(()=>JSON.stringify(FloorPlanApp.project));
 await page.goto(url);await page.waitForFunction(()=>document.body.dataset.ready==='1',null,{timeout:60000});

 // Identificación: avatar IA, sesión simulada, voz real apagada.
 for(const [s,txt] of [['#badgeIa','IA'],['#badgeSim','Sesión simulada'],['#advTitle','asistente de IA']])assert.match(await page.locator(s).textContent(),new RegExp(txt));
 assert.match(await page.locator('#badgeOff').textContent(),/sin conexión a Nuance/);

 // 1 · Sin gesto no hay sesión.
 const blocked=await page.evaluate(()=>{const s=new AsesorSim.SimAdapter({rubik:AsesorLab.rubik,profile:'architecture',mode:'cliente'});return {started:s.start({isTrusted:false}),state:s.state};});
 assert.deepEqual(blocked,{started:false,state:'idle'},'el inicio exige un gesto de la persona');
 assert.equal(await page.locator('#say').isDisabled(),true,'antes de iniciar no se puede hablar');

 // 2 · Inicio por clic (modo cliente, Inmobiliaria).
 await page.selectOption('#profile','real-estate');await press('#start');
 await page.waitForFunction(()=>AsesorLab.sim?.state==='live');await page.waitForFunction(()=>/una IA\. Esta sesión es simulada/.test(document.querySelector('#subtitle').textContent),null,{timeout:10000});
 assert.match(await page.locator('#state').textContent(),/sesión simulada/);

 // 3 · Recorrido 1: superficies (motor real de RUBIK).
 await press('#chips .chip[data-say*="metros"]');await page.locator('#results table').waitFor();
 const rows=await page.locator('#results tbody tr').count();
 const truth=await frame().evaluate(()=>{const r=RubikAssistantDomainTools.execute('list_rooms',{},{project:FloorPlanApp.project},'qa');return {n:r.data.rooms.length,total:Math.round(r.data.rooms.filter(x=>x.counted&&Number.isFinite(x.floor.areaM2)).reduce((s,x)=>s+x.floor.areaM2,0)*100)/100};});
 assert.equal(rows,truth.n,'una fila por estancia del proyecto activo');
 assert.match(await page.locator('#results tfoot').textContent(),new RegExp(truth.total.toLocaleString('es-ES',{minimumFractionDigits:2}).replace('.','\\.')),'total igual al del motor de RUBIK');
 assert.doesNotMatch(await page.locator('#results').textContent(),/[㐀-鿿]/,'sin texto en chino en ES');
 await page.screenshot({path:path.join(shots,`${name}-01-superficies.png`)});

 // 4 · Recorrido 2: enfocar una estancia (misma selección que en el plano).
 const before=await project();
 await press('#chips .chip[data-say*="salón"]');await page.waitForTimeout(400);
 const sel=await frame().evaluate(()=>{const s=ui.sel;const r=FloorPlanApp.project.rooms.find(x=>x.id===s?.id);return {kind:s?.kind,name:r?FloorPlanDisplayName(r.name,'room'):null};});
 assert.deepEqual(sel,{kind:'room',name:'Salón'},'el visor selecciona el Salón');
 assert.equal(await project(),before,'enfocar no cambia el proyecto');
 await page.screenshot({path:path.join(shots,`${name}-02-enfocar-salon.png`)});

 // 5 · Modo cliente: acciones no permitidas → rechazo visible y proyecto idéntico.
 for(const [chip,say] of [['Presupuesto','cuesta'],['Cambiar suelo','Cambia el suelo']]){
  await page.evaluate(()=>document.querySelector('#results').replaceChildren());
  await press(`#chips .chip[data-say*="${say}"]`);await page.locator('#results .denied').waitFor();
  assert.equal(await page.locator('#results .denied').getAttribute('data-denied'),'not_allowed_in_mode',`${chip}: rechazado en modo cliente`);
  assert.match(await page.locator('#results .denied').textContent(),/En modo cliente esta acción no está permitida/);
  assert.equal(await project(),before,`${chip}: el proyecto queda idéntico`);}
 const direct=await page.evaluate(()=>AsesorTools.run({state:'live',profile:'real-estate',mode:'cliente',projectId:AsesorLab.rubik.project().id,rubik:AsesorLab.rubik},'publicar_enlace',{}));
 assert.equal(direct.error,'not_allowed_in_mode','publicar fuera del conjunto del cliente');
 assert.deepEqual(await page.evaluate(()=>AsesorTools.definitions('real-estate','cliente').map(d=>d.name)),['consultar_superficies','enfocar_estancia','continuar_por_texto'],'el cliente solo ve consultas');
 assert.equal(await project(),before);
 await page.screenshot({path:path.join(shots,`${name}-03-cliente-rechazo.png`)});

 // 6 · Recorrido 3: continuar con el Asistente de texto real.
 await press('#chips .chip[data-say*="texto"]');await page.waitForTimeout(400);
 assert.equal(await frame().evaluate(()=>RubikAssistantUI.state.open),true,'el Asistente de texto de RUBIK está abierto');
 await page.screenshot({path:path.join(shots,`${name}-04-asistente-texto.png`)});
 await frame().evaluate(()=>RubikAssistantUI.close());

 // 7 · Cierre: libera recursos y temporizadores; el foco vuelve a «Iniciar».
 await press('#close');const closed=await page.evaluate(()=>({state:AsesorLab.sim.state,res:AsesorLab.sim.resources,timers:AsesorLab.sim.timers.size}));
 assert.deepEqual(closed,{state:'ended',res:0,timers:0},'cerrar limpia los recursos');
 assert.equal(await page.evaluate(()=>document.activeElement?.id),'start','el foco vuelve a «Iniciar conversación»');

 // 8 · Modo técnico: un cambio solo se PROPONE; aquí se rechaza sin tocar el proyecto (requiere confirmar en RUBIK).
 await press('input[name=mode][value=tecnico]');await page.selectOption('#profile','architecture');await press('#start');await page.waitForFunction(()=>AsesorLab.sim?.state==='live');
 await page.evaluate(()=>document.querySelector('#results').replaceChildren());await press('#chips .chip[data-say*="Cambia el suelo"]');await page.locator('#results .denied').waitFor();
 assert.equal(await page.locator('#results .denied').getAttribute('data-denied'),'confirmation_required');assert.equal(await project(),before,'rechazar la propuesta deja el proyecto intacto');
 await press('#close');await press('input[name=mode][value=cliente]');

 // 9 · Errores del proveedor: mensaje, salida por texto y SIN reintento automático; reintentos manuales limitados.
 await press('details.qa>summary');
 for(const code of ['mic_denied','invalid_credential','forbidden','concurrency_limit','credits_spent','start_limit','capacity_unavailable','unavailable']){
  await page.selectOption('#failSel',code);await press('#start');await page.locator('#error:not([hidden])').waitFor();
  assert.equal(await page.locator('#errorMsg').getAttribute('data-code'),code);assert.equal(await page.locator('#errToText').isVisible(),true,`${code}: ofrece seguir por texto`);
  assert.equal(await page.evaluate(()=>document.activeElement?.id),'errToText',`${code}: el foco va a la alternativa`);
  await page.waitForTimeout(1200);assert.equal(await page.evaluate(()=>AsesorLab.sim.state),'error',`${code}: sin reintento automático`);
  assert.equal(await page.evaluate(()=>AsesorLab.sim.resources),0,`${code}: recursos liberados`);}
 await page.screenshot({path:path.join(shots,`${name}-05-error-saldo.png`)});
 // Reintentos manuales: como mucho 2 por sesión.
 await page.selectOption('#failSel','unavailable');await press('#start');await page.locator('#error:not([hidden])').waitFor();
 const tries=[];for(let i=0;i<3;i++)tries.push(await page.evaluate(()=>{const ok=AsesorLab.sim.retry({isTrusted:true});AsesorLab.sim.failWith='unavailable';return ok;}));
 assert.equal(tries.filter(Boolean).length<=2,true,'máximo dos reintentos manuales');
 await page.selectOption('#failSel','');

 // 10 · Pérdida de conexión en curso y desvinculación al cambiar de proyecto.
 await press('#start');await page.waitForFunction(()=>AsesorLab.sim?.state==='live');await press('#dropConn');
 await page.locator('#error:not([hidden])').waitFor();assert.equal(await page.locator('#errorMsg').getAttribute('data-code'),'connection_lost');
 await press('#start');await page.waitForFunction(()=>AsesorLab.sim?.state==='live');
 await frame().evaluate(()=>{FloorPlanApp.project.id='prj_otro_proyecto_qa';});
 await page.waitForFunction(()=>AsesorLab.sim.state==='ended',null,{timeout:5000});
 assert.match(await page.locator('#state').textContent(),/proyecto activo cambió/);

 // 11 · Red: CERO peticiones a Nuance (ni a ningún host externo salvo el CDN bloqueado del visor).
 const nuance=requests.filter(u=>/nuance/i.test(u));assert.deepEqual(nuance,[],'cero peticiones a Nuance');
 const external=requests.filter(u=>!u.startsWith('http://127.0.0.1')&&!u.startsWith('data:')&&!u.startsWith('blob:')&&!u.startsWith('https://cdn.jsdelivr.net/'));
 assert.deepEqual(external,[],'ninguna petición a servicios externos');
 fs.writeFileSync(path.join(shots,`${name}-red.json`),JSON.stringify({total:requests.length,nuance:nuance.length,externos:external.length,hosts:[...new Set(requests.map(u=>{try{return new URL(u).host;}catch{return u.slice(0,20);}}))]},null,1));
 assert.deepEqual(errors,[]);
});
